"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ProjectShowcase from "@/features/project/components/ProjectShowcase";
import { mockProjects } from "@/features/project/data/mockData";
import PageBackground from "@/components/ui/PageBackground";

export default function ProjectPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      container.style.backgroundPosition = `0 ${scrollY * 0.3}px`;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-dark-50 dark:bg-dark-950 relative overflow-hidden">
      <PageBackground />
      
      <div className="relative z-10 flex flex-col min-h-screen">   
        <nav className="border-b border-dark-200 dark:border-dark-800 backdrop-blur-md sticky top-0 z-50 bg-dark-50/80 dark:bg-dark-950/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => router.push("/")}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg shadow-primary-500/30 overflow-hidden">
                  <Image
                    src="/logo.jpg"
                    alt="kalivergo Logo"
                    width={36}
                    height={36}
                    className="object-cover"
                    priority
                  />
                </div>
                <span className="text-xl font-bold font-display text-dark-900 dark:text-white">kalivergo</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/login")}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 px-4 py-2 text-sm font-medium text-white hover:shadow-lg hover:shadow-primary-500/30 transition-all"
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        </nav>

        
        <main className="flex-1 py-8">
          <div 
            ref={containerRef}
            className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
          >
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-dark-900 dark:text-white font-display">
                Project Showcase
              </h1>
              <p className="mt-2 text-muted max-w-3xl">
                Lihat contoh project anggota kelas kalivergo dan filter berdasarkan teknologi.
              </p>
            </div>

            <ProjectShowcase projects={mockProjects} />
          </div>
        </main>

        
        <footer className="border-t border-dark-200 dark:border-dark-800 py-8 bg-dark-50/90 dark:bg-dark-950/90 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="text-sm text-muted">
                  kalivergo © {new Date().getFullYear()} - Class Management System
                </p>
              </div>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => router.push("/privacy")}
                  className="text-sm text-muted hover:text-dark-900 dark:hover:text-white transition-colors"
                >
                  Kebijakan Privasi
                </button>
                <span className="text-faint">•</span>
                <button
                  onClick={() => router.push("/terms")}
                  className="text-sm text-muted hover:text-dark-900 dark:hover:text-white transition-colors"
                >
                  Syarat & Ketentuan
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}