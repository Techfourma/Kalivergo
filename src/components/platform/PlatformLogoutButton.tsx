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
      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-dark-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:text-dark-300 dark:hover:bg-red-950/30 dark:hover:text-red-300"
    >
      <LogOut className="h-4 w-4" />
      <span>Sign Out</span>
    </button>
  );
}