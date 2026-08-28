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

export default function HomeUpcomingSeminars({ seminars, tenantPath }: HomeUpcomingSeminarsProps) {
  return (
    <Link href={`${tenantPath}/seminar`} className="block">
      <Card
        className={cn(
          "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
        )}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-accent-600">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-dark-900">Seminar Mendatang</h2>
            <p className="text-xs text-dark-400">
              {seminars.length} seminar dalam 7 hari ke depan
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {seminars.length === 0 ? (
            <div className="text-center py-8 text-dark-400">
              <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada seminar dalam 7 hari ke depan</p>
            </div>
          ) : (
            seminars.map((seminar) => {
              const seminarDate = new Date(seminar.date);
              const now = new Date();
              const diffMs = seminarDate.getTime() - now.getTime();
              const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={seminar.id}
                  className="rounded-xl border border-dark-100 bg-gradient-to-r from-accent-50/50 to-primary-50/50 p-4 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-dark-900">{seminar.title}</h3>
                      <p className="text-sm text-dark-500 mt-1 line-clamp-2">
                        {seminar.description}
                      </p>
                    </div>
                    <span className="text-[10px] font-medium text-accent-700 dark:text-accent-300 bg-accent-100 dark:bg-accent-500/20 px-2 py-1 rounded-full shrink-0">
                      {diffDays === 0 ? "Hari ini" : diffDays === 1 ? "Besok" : `${diffDays} hari lagi`}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-dark-500">
                    <span className="flex items-center gap-1">
                      <span className="text-dark-400">📅</span>
                      {seminarDate.toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {seminar.location && (
                      <span className="flex items-center gap-1">
                        <span className="text-dark-400">📍</span>
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
