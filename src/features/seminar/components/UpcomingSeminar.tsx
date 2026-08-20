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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-accent-600">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-dark-900">Seminar Mendatang</h2>
          <p className="text-xs text-dark-400">
            {seminars.length} seminar terjadwal
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {seminars.length === 0 ? (
          <div className="text-center py-8 text-dark-400">
            <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Belum ada seminar terjadwal</p>
          </div>
        ) : (
          seminars.map((seminar) => (
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
                <Badge variant="info">Upcoming</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-dark-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDateTime(seminar.date)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {seminar.location}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}