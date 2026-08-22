import NextAuth, { type DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { env } from "@/config/env";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      nim?: string | null;
      isVerified: boolean;
    } & DefaultSession["user"];
  }
}

export const authOptions = {
  adapter: undefined, 
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        nim: { label: "NIM", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.nim || !credentials?.password) {
          throw new Error("NIM dan password diperlukan");
        }

        const nim = credentials.nim.trim();

        const user = await prisma.user.findFirst({
          where: { nim },
        });

        if (!user || !user.password) {
          throw new Error("NIM atau password salah");
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("NIM atau password salah");
        }

        if (!user.isVerified) {
          throw new Error(
            "Akun belum diverifikasi. Silakan cek email Anda atau kirim ulang link verifikasi."
          );
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email ?? "",
          nim: user.nim,
          role: user.platformRole ?? "MEMBER",
          isVerified: user.isVerified,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.nim = token.nim;
        session.user.isVerified = token.isVerified;
      }
      return session;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.nim = user.nim;
        token.isVerified = user.isVerified;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt" as const,
  },
  secret: env.nextAuthSecret,
  pages: {
    signIn: "/login",
  },
};

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}