"use client";

import { useState, useMemo } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import { AlertCircle, CheckCircle2, ChevronDown, CalendarDays, User, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface MemberArrears {
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string | null;
  totalPaid: number;
  totalExpected: number;
  arrears: number;
  unpaidCount: number;
  totalExpectedCount: number;
  unpaidDates: string[];
  isFullyPaid: boolean;
  paymentByDate?: Record<string, any>;
  schedules?: any[];
}

interface ArrearsListProps {
  members: MemberArrears[];
  hasUangKasSettings?: boolean;
  shouldLockFeatures?: boolean;
  uangKasDates?: Array<{ id: string; date: string; formattedDate: string; amount: number; description: string | null }>;
}

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

export default function ArrearsList({ members, hasUangKasSettings = true, shouldLockFeatures = false, uangKasDates = [] }: ArrearsListProps) {
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  const allMemberNames = useMemo(() => {
    return Array.from(new Set(members.map((m) => m.userName))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [members]);

  const selectedMemberData = useMemo(() => {
    if (selectedMember === "all") return null;
    return members.find((m) => m.userName === selectedMember) || null;
  }, [members, selectedMember]);

  const availableDates = useMemo(() => uangKasDates ?? [], [uangKasDates]);

  const activeDate = useMemo(() => {
    if (!selectedDate) return "";
    const exists = availableDates.some((d) => d.date === selectedDate);
    return exists ? selectedDate : "";
  }, [selectedDate, availableDates]);

  const selectedDateLabel = useMemo(() => {
    if (!activeDate) return "Semua Tanggal";
    const match = availableDates.find((d) => d.date === activeDate);
    return match?.formattedDate ?? activeDate;
  }, [activeDate, availableDates]);

  const dateFilteredMembers = useMemo(() => {
    if (!activeDate) return members.filter((m) => m.arrears > 0);
    return members.filter((m) => {
      const detail = m.paymentByDate?.[activeDate];
      return !detail?.paid;
    });
  }, [members, activeDate]);

  const totalArrears = dateFilteredMembers.reduce((sum, m) => {
    if (!activeDate) return sum + m.arrears;
    const detail = m.paymentByDate?.[activeDate];
    return sum + (detail ? Number(detail.amount) : 0);
  }, 0);

  if (selectedMember === "all") {
    return (
      <Card padding="lg" className={shouldLockFeatures ? "opacity-50 pointer-events-none" : ""}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-dark-900 dark:text-white">Tunggakan Uang Kas</h3>
            <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
              {activeDate ? `Tunggakan ${selectedDateLabel}: ${formatCurrency(totalArrears)}` : `Total tunggakan: ${formatCurrency(totalArrears)}`}
            </p>
          </div>
          <Badge variant="danger">
            {dateFilteredMembers.length} anggota menunggak
          </Badge>
        </div>

        {shouldLockFeatures && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 px-4 py-3 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Silahkan melakukan input Kategori Pemasukan dan Pengeluaran untuk membuka fitur ini.
            </p>
          </div>
        )}

        {!hasUangKasSettings || availableDates.length === 0 ? (
          <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/30 p-5 text-center">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-amber-600 dark:text-amber-400" />
            <p className="font-medium text-amber-900 dark:text-amber-200">Silakan lakukan pendataan Uang Kelas terlebih dahulu.</p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300/80">Tanggal tagihan dan nominal uang kas belum ditentukan oleh pengelola kelas.</p>
          </div>
        ) : (
        <>
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <label className="text-sm text-dark-500 dark:text-dark-400">Tanggal:</label>
          <div className="relative">
            <select
              value={activeDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              disabled={shouldLockFeatures}
              className="appearance-none bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-lg px-4 py-2 pr-10 text-sm text-dark-900 dark:text-dark-100 focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Semua Tanggal</option>
              {availableDates.map((d) => (
                <option key={d.date} value={d.date}>
                  {d.formattedDate}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400 dark:text-dark-500 pointer-events-none" />
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <label className="text-sm text-dark-500 dark:text-dark-400">Filter Nama:</label>
          <div className="relative">
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              disabled={shouldLockFeatures}
              className="appearance-none bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-lg px-4 py-2 pr-10 text-sm text-dark-900 dark:text-dark-100 focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="all">Semua Anggota</option>
              {allMemberNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400 dark:text-dark-500 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-2">
          {dateFilteredMembers.length === 0 ? (
            <div className="text-center py-12 text-dark-400 dark:text-dark-500">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500 dark:text-emerald-400" />
              <p className="font-medium">
                {activeDate ? "Semua anggota sudah lunas untuk tanggal ini! 🎉" : "Semua anggota sudah lunas! 🎉"}
              </p>
            </div>
          ) : (
            dateFilteredMembers.map((member) => {
              const detail = member.paymentByDate?.[activeDate];
              const amount = detail ? Number(detail.amount) : member.arrears;
              return (
                <div
                  key={member.userId}
                  className="flex items-center gap-4 rounded-xl border border-red-100 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-4 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Avatar src={member.userImage} name={member.userName} id={member.userId} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark-900 dark:text-white text-sm">
                      {member.userName}
                    </p>
                    <p className="text-xs text-dark-500 dark:text-dark-400 truncate">{member.userEmail}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {activeDate && (
                        <span className="rounded-md bg-red-100 dark:bg-red-950/50 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:text-red-300">
                          {selectedDateLabel}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-red-700 dark:text-red-400">
                      {formatCurrency(amount)}
                    </p>
                    <p className="text-[10px] text-dark-400 dark:text-dark-500">tunggakan</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        </>
        )}
      </Card>
    );
  }

  if (selectedMemberData) {
    const schedules = selectedMemberData.schedules || [];
    const paymentByDate = selectedMemberData.paymentByDate || {};
    const filteredSchedules = activeDate
      ? schedules.filter((s: any) => s.date === activeDate)
      : schedules;

    return (
      <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-dark-900 dark:text-white">Tunggakan Uang Kas</h3>
            <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
              Rincian uang kas: <span className="font-semibold text-dark-900 dark:text-dark-100">{selectedMemberData.userName}</span>
            </p>
          </div>
          <div className="text-right">
            <Badge variant={selectedMemberData.arrears > 0 ? "danger" : "success"}>
              {selectedMemberData.arrears > 0
                ? `Tunggakan ${formatCurrency(selectedMemberData.arrears)}`
                : "Lunas"}
            </Badge>
          </div>
        </div>

        {availableDates.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 items-center">
            <label className="text-sm text-dark-500 dark:text-dark-400">Tanggal:</label>
            <div className="relative">
              <select
                value={activeDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={shouldLockFeatures}
                className="appearance-none bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-lg px-4 py-2 pr-10 text-sm text-dark-900 dark:text-dark-100 focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Semua Tanggal</option>
                {availableDates.map((d) => (
                  <option key={d.date} value={d.date}>
                    {d.formattedDate}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400 dark:text-dark-500 pointer-events-none" />
            </div>
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <label className="text-sm text-dark-500 dark:text-dark-400">Filter Nama:</label>
          <div className="relative">
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              disabled={shouldLockFeatures}
              className="appearance-none bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-lg px-4 py-2 pr-10 text-sm text-dark-900 dark:text-dark-100 focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="all">Semua Anggota</option>
              {allMemberNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400 dark:text-dark-500 pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchedules.length === 0 ? (
            <div className="col-span-full text-center py-12 text-dark-400 dark:text-dark-500">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 text-dark-300 dark:text-dark-600" />
              <p className="font-medium">
                {activeDate ? "Tidak ada jadwal uang kas untuk tanggal ini." : "Belum ada jadwal uang kas."}
              </p>
            </div>
          ) : (
            filteredSchedules.map((schedule: any) => {
              const detail = paymentByDate[schedule.date] || {
                date: schedule.date,
                formattedDate: schedule.formattedDate,
                amount: schedule.amount,
                scheduleDescription: schedule.description,
                paid: false,
                paymentAmount: 0,
                transactionDescription: null,
                createdBy: null,
              };
              const paid = !!detail.paid;

              return (
                <div
                  key={schedule.id || schedule.date}
                  className={`rounded-xl border p-4 transition-colors ${
                    paid
                      ? "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-950/20"
                      : "border-red-200 dark:border-red-800/40 bg-red-50/60 dark:bg-red-950/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-dark-900 dark:text-white">
                      <CalendarDays className="h-4 w-4 text-dark-500 dark:text-dark-400" />
                      <span className="font-semibold text-sm">{detail.formattedDate}</span>
                    </div>
                    <Badge variant={paid ? "success" : "danger"}>
                      {paid ? "Lunas" : "Belum Bayar"}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-dark-500 dark:text-dark-400">Nominal</span>
                      <span className="font-semibold text-dark-900 dark:text-white">
                        {formatCurrency(Number(detail.amount))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-dark-500 dark:text-dark-400">Dibayar</span>
                      <span className={paid ? "font-semibold text-emerald-700 dark:text-emerald-400" : "font-semibold text-red-700 dark:text-red-400"}>
                        {paid ? formatCurrency(Number(detail.paymentAmount) || Number(detail.amount)) : "—"}
                      </span>
                    </div>

                    <div className="border-t border-dark-100 dark:border-dark-800 pt-2 mt-2">
                      <p className="text-xs font-medium text-dark-500 dark:text-dark-400 mb-1 flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" /> Deskripsi
                      </p>
                      <p className="text-sm text-dark-700 dark:text-dark-200">
                        {detail.transactionDescription ||
                          detail.scheduleDescription ||
                          "Tidak ada deskripsi"}
                      </p>
                    </div>

                    <div className="border-t border-dark-100 dark:border-dark-800 pt-2 mt-2">
                      <p className="text-xs font-medium text-dark-500 dark:text-dark-400 mb-1 flex items-center gap-1">
                        <User className="h-3.5 w-3.5" /> Diinput oleh
                      </p>
                      <p className="text-sm text-dark-900 dark:text-dark-100 font-medium">
                        {paid
                          ? (detail.createdBy && detail.createdBy !== "System" ? detail.createdBy : "Admin")
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <div className="py-12 text-center text-dark-400 dark:text-dark-500">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-dark-300 dark:text-dark-600" />
        <p className="font-medium">Anggota tidak ditemukan.</p>
      </div>
    </Card>
  );
}
