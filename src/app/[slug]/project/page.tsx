"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ProjectShowcase from "@/features/project/components/ProjectShowcase";
import { mockProjects } from "@/features/project/data/mockData";
import WaveBackground from "@/components/ui/WaveBackground";

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
    <div className="min-h-screen flex flex-col bg-[#0a0a14] relative overflow-hidden">
      <WaveBackground />
      
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-transparent via-[#0a0a14]/50 to-[#0a0a14] pointer-events-none" />

     
      <div className="relative z-10 flex flex-col min-h-screen">   
        <nav className="border-b border-white/10 backdrop-blur-md sticky top-0 z-50 bg-[#0a0a14]/80">
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
                <span className="text-xl font-bold font-display text-white">kalivergo</span>
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
              <h1 className="text-3xl font-bold text-white font-display">
                Project Showcase
              </h1>
              <p className="mt-2 text-gray-300 max-w-3xl">
                Lihat contoh project anggota kelas kalivergo dan filter berdasarkan teknologi.
              </p>
            </div>

            <ProjectShowcase projects={mockProjects} />
          </div>
        </main>

        
        <footer className="border-t border-white/10 py-8 bg-[#0a0a14]/90 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="text-sm text-gray-400">
                  kalivergo © {new Date().getFullYear()} - Class Management System
                </p>
              </div>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => router.push("/privacy")}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Kebijakan Privasi
                </button>
                <span className="text-gray-600">•</span>
                <button
                  onClick={() => router.push("/terms")}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
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