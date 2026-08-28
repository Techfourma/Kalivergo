"use client";

import Link from "next/link";

import Card from "@/components/ui/Card";

import { GraduationCap } from "lucide-react";

import { cn } from "@/lib/utils";

interface Seminar {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
}

interface HomeUpcomingSeminarsProps {
  seminars: Seminar[];
  tenantPath: string;
}

export default function HomeUpcomingSeminars({
  seminars,
  tenantPath,
}: HomeUpcomingSeminarsProps) {
  return (
    <Link href={`${tenantPath}/seminar`} className="block">
      {/* WRAPPER UTAMA - TIDAK ADA HOVER */}
      <Card
        className={cn(
          "relative overflow-hidden",
          "border border-slate-200 bg-white/90",
          "dark:border-[#263b5c] dark:bg-[#121d32]",
          "backdrop-blur-md"
        )}
      >
        {/* HEADER - TIDAK ADA HOVER */}
        <div className="mb-5 flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              "bg-accent-50 text-accent-600",
              "dark:bg-accent-500/10 dark:text-accent-400"
            )}
          >
            <GraduationCap className="h-5 w-5" />
          </div>

          <div>
            <h2
              className={cn(
                "text-lg font-bold",
                "text-slate-900 dark:text-slate-100"
              )}
            >
              Seminar Mendatang
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {seminars.length} seminar dalam 7 hari ke depan
            </p>
          </div>
        </div>

        {/* ISI SEMINAR */}
        <div className="space-y-3">
          {seminars.length === 0 ? (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400">
              <GraduationCap className="mx-auto mb-2 h-10 w-10 opacity-50" />

              <p className="text-sm">
                Belum ada seminar dalam 7 hari ke depan
              </p>
            </div>
          ) : (
            seminars.map((seminar) => {
              const seminarDate = new Date(seminar.date);
              const now = new Date();

              const diffMs =
                seminarDate.getTime() - now.getTime();

              const diffDays = Math.ceil(
                diffMs / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={seminar.id}
                  className={cn(
                    // Base card seminar
                    "group rounded-xl border p-4",

                    // LIGHT MODE
                    "border-slate-200",
                    "bg-gradient-to-r from-accent-50/70 to-primary-50/70",

                    // DARK MODE
                    "dark:border-[#263b5c]",
                    "dark:from-[#17243a]",
                    "dark:to-[#142238]",

                    // HANYA SEMINAR INI YANG HOVER
                    "transition-all duration-300 ease-out",
                    "hover:-translate-y-0.5",
                    "hover:border-primary-500",
                    "hover:shadow-md hover:shadow-primary-500/10",

                    // Dark mode hover
                    "dark:hover:border-blue-500",
                    "dark:hover:shadow-blue-500/10"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* JUDUL SEMINAR - BERUBAH BIRU SAAT SEMINAR DI-HOVER */}
                      <h3
                        className={cn(
                          "font-semibold",
                          "text-slate-900 dark:text-slate-100",
                          "transition-colors duration-300",
                          "group-hover:text-primary-600",
                          "dark:group-hover:text-blue-400"
                        )}
                      >
                        {seminar.title}
                      </h3>

                      {/* DESKRIPSI - TIDAK BERUBAH WARNA */}
                      <p
                        className={cn(
                          "mt-1 line-clamp-2 text-sm",
                          "text-slate-600",
                          "dark:text-slate-300"
                        )}
                      >
                        {seminar.description}
                      </p>
                    </div>

                    {/* STATUS */}
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-1",
                        "text-[10px] font-medium",

                        // Light mode
                        "bg-accent-100 text-accent-700",

                        // Dark mode
                        "dark:bg-blue-500/15 dark:text-blue-300"
                      )}
                    >
                      {diffDays === 0
                        ? "Hari ini"
                        : diffDays === 1
                        ? "Besok"
                        : `${diffDays} hari lagi`}
                    </span>
                  </div>

                  {/* TANGGAL & LOKASI */}
                  <div
                    className={cn(
                      "mt-3 flex items-center gap-4",
                      "text-xs",
                      "text-slate-500",
                      "dark:text-slate-400"
                    )}
                  >
                    <span className="flex items-center gap-1">
                      <span className="text-slate-400 dark:text-slate-500">
                        📅
                      </span>

                      {seminarDate.toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>

                    {seminar.location && (
                      <span className="flex items-center gap-1">
                        <span className="text-slate-400 dark:text-slate-500">
                          📍
                        </span>

                        {seminar.location}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </Link>
  );
}
