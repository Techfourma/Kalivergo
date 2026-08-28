"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { GraduationCap, MapPin, Calendar } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Seminar {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
}

interface UpcomingSeminarsProps {
  seminars: Seminar[];
}

export default function UpcomingSeminars({ seminars }: UpcomingSeminarsProps) {
  return (
    <Card>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 ring-1 ring-accent-200/60 dark:ring-accent-800/40">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-dark-900 dark:text-white">Seminar Mendatang</h2>
          <p className="text-xs text-dark-400 dark:text-dark-500">
            {seminars.length} seminar terjadwal
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {seminars.length === 0 ? (
          <div className="text-center py-8 text-dark-400 dark:text-dark-500">
            <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Belum ada seminar terjadwal</p>
          </div>
        ) : (
          seminars.map((seminar, i) => (
            <div
              key={seminar.id}
              style={{ animationDelay: `${i * 70}ms` }}
              className="seminar-item group relative overflow-hidden rounded-2xl border border-dark-100 dark:border-dark-700/70 bg-white/70 dark:bg-dark-800/40 backdrop-blur-md p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-blue-300/70 dark:hover:border-blue-600/50 hover:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.55)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-dark-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                    {seminar.title}
                  </h3>
                  <p className="text-sm text-dark-500 dark:text-dark-300 mt-1 line-clamp-2">
                    {seminar.description}
                  </p>
                </div>
                <Badge variant="info">Upcoming</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-dark-500 dark:text-dark-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-dark-400 dark:text-dark-500" />
                  {formatDateTime(seminar.date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-dark-400 dark:text-dark-500" />
                  {seminar.location}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        @keyframes seminar-fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .seminar-item {
          animation: seminar-fade-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .seminar-item {
            animation: none;
          }
        }
      `}</style>
    </Card>
  );
}