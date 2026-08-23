"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { logoutPlatformAdmin } from "@/actions/platform-auth";

export default function PlatformLogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutPlatformAdmin();
      router.push("/platform/login");
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="flex items-center gap-2 rounded-lg border border-dark-200 px-3 py-2 text-sm text-dark-600 hover:bg-dark-100 hover:text-dark-900 disabled:opacity-50 transition-colors"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Keluar</span>
    </button>
  );
}