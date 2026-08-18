"use client";

import { useRouter } from "next/navigation";
import { Shield, Lock, Users } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-primary-950 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-600/20 via-transparent to-transparent" />

      <Card className="relative w-full max-w-md !p-8 bg-white/95 backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white text-2xl font-bold shadow-xl shadow-primary-500/25 mb-4">
            T4
          </div>
          <h1 className="text-2xl font-bold text-dark-900 font-display">
            Techfourma Demo
          </h1>
          <p className="text-sm text-dark-500 mt-2">
            Login lokal tanpa autentikasi eksternal untuk preview UI.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            className="w-full !py-3 !text-base"
            onClick={() => router.push("/home")}
          >
            Masuk sebagai Demo User
          </Button>
        </div>

        <div className="mt-8 space-y-3 text-dark-400 text-xs">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" />
            <span>Preview lokal: tidak menggunakan next-auth atau database.</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" />
            <span>Gunakan halaman /home, /dashboard, /cms, /about, /project.</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            <span>Semua data ditampilkan dari mock lokal.</span>
          </div>
        </div>
      </Card>
    </div>
  );
}