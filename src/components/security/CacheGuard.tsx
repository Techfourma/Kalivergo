"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";


export default function CacheGuard({ redirectTo = "/login" }: { redirectTo?: string }) {
  const router = useRouter();

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        router.refresh();
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [router]);

  return null;
}