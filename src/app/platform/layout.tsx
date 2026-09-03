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
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-dark-50 text-dark-900 dark:bg-dark-950 dark:text-dark-100">{children}</div>
  );
}