import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Platform - kalivergo",
  description: "Panel administrasi platform kalivergo",
};


export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-dark-50 text-dark-900">{children}</div>
  );
}