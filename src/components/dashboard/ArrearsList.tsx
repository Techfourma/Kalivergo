"use client";

import { useState, useMemo } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { AlertCircle, CheckCircle2, ChevronDown, CalendarDays, User, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface MemberArrears {
  userId: string;
  userName: string;
  userEmail: string;
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
}

export default function ArrearsList({ members, hasUangKasSettings = true }: ArrearsListProps) {
  const [selectedMember, setSelectedMember] = useState<string>("all");

  const allMemberNames = useMemo(() => {
    return Array.from(new Set(members.map((m) => m.userName))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [members]);

  const selectedMemberData = useMemo(() => {
    if (selectedMember === "all") return null;
    return members.find((m) => m.userName === selectedMember) || null;
  }, [members, selectedMember]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => m.arrears > 0);
  }, [members]);

  const totalArrears = filteredMembers.reduce((sum, m) => sum + m.arrears, 0);
  const membersWithArrears = filteredMembers.filter((m) => m.arrears > 0);

  if (selectedMember === "all") {
    return (
      <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-dark-900">Tunggakan Uang Kas</h3>
            <p className="text-sm text-dark-500 mt-1">
              Total tunggakan: {formatCurrency(totalArrears)}
            </p>
          </div>
          <Badge variant="danger">
            {membersWithArrears.length} anggota menunggak
          </Badge>
        </div>

        {!hasUangKasSettings ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-amber-600" />
            <p className="font-medium text-amber-900">Silakan lakukan pendataan Uang Kelas terlebih dahulu.</p>
            <p className="mt-1 text-sm text-amber-700">Tanggal tagihan dan nominal uang kas belum ditentukan oleh pengelola kelas.</p>
          </div>
        ) : (
        <>
        {/* Filter Nama */}
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <label className="text-sm text-dark-500">Filter Nama:</label>
          <div className="relative">
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="appearance-none bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 pr-10 text-sm text-dark-100 focus:outline-none focus:border-primary-500"
            >
              <option value="all">Semua Anggota</option>
              {allMemberNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-2">
          {membersWithArrears.length === 0 ? (
            <div className="text-center py-12 text-dark-400">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-400" />
              <p className="font-medium">Semua anggota sudah lunas! 🎉</p>
            </div>
          ) : (
            membersWithArrears.map((member) => (
              <div
                key={member.userId}
                className="flex items-center gap-4 rounded-xl border border-red-100 bg-red-50/50 p-4 hover:bg-red-50 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {member.userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-dark-900 text-sm">
                    {member.userName}
                  </p>
                  <p className="text-xs text-dark-500 truncate">{member.userEmail}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {member.unpaidDates.slice(0, 3).map((date) => (
                      <span
                        key={date}
                        className="rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700"
                      >
                        {date}
                      </span>
                    ))}
                    {member.unpaidDates.length > 3 && (
                      <span className="rounded-md bg-dark-700 px-2 py-0.5 text-[10px] font-medium text-dark-300">
                        +{member.unpaidDates.length - 3} lainnya
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-dark-500 mt-1">
                    Menunggak {member.unpaidCount} dari {member.totalExpectedCount} kali pembayaran
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-red-700">
                    {formatCurrency(member.arrears)}
                  </p>
                  <p className="text-[10px] text-dark-400">tunggakan</p>
                </div>
              </div>
            ))
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

    return (
      <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-dark-900">Tunggakan Uang Kas</h3>
            <p className="text-sm text-dark-500 mt-1">
              Rincian uang kas: <span className="font-semibold text-dark-900">{selectedMemberData.userName}</span>
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

        {/* Pindah filter nama tetap tersedia */}
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <label className="text-sm text-dark-500">Filter Nama:</label>
          <div className="relative">
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="appearance-none bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 pr-10 text-sm text-dark-100 focus:outline-none focus:border-primary-500"
            >
              <option value="all">Semua Anggota</option>
              {allMemberNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400 pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.length === 0 ? (
            <div className="col-span-full text-center py-12 text-dark-400">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 text-dark-300" />
              <p className="font-medium">Belum ada jadwal uang kas.</p>
            </div>
          ) : (
            schedules.map((schedule: any) => {
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
                      ? "border-emerald-200 bg-emerald-50/60"
                      : "border-red-200 bg-red-50/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-dark-900">
                      <CalendarDays className="h-4 w-4 text-dark-500" />
                      <span className="font-semibold text-sm">{detail.formattedDate}</span>
                    </div>
                    <Badge variant={paid ? "success" : "danger"}>
                      {paid ? "Lunas" : "Belum Bayar"}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-dark-500">Nominal</span>
                      <span className="font-semibold text-dark-900">
                        {formatCurrency(Number(detail.amount))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-dark-500">Dibayar</span>
                      <span className={paid ? "font-semibold text-emerald-700" : "font-semibold text-red-700"}>
                        {paid ? formatCurrency(Number(detail.paymentAmount) || Number(detail.amount)) : "—"}
                      </span>
                    </div>

                    <div className="border-t border-dark-100 pt-2 mt-2">
                      <p className="text-xs font-medium text-dark-500 mb-1 flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" /> Deskripsi
                      </p>
                      <p className="text-sm text-dark-700">
                        {detail.transactionDescription ||
                          detail.scheduleDescription ||
                          "Tidak ada deskripsi"}
                      </p>
                    </div>

                    <div className="border-t border-dark-100 pt-2 mt-2">
                      <p className="text-xs font-medium text-dark-500 mb-1 flex items-center gap-1">
                        <User className="h-3.5 w-3.5" /> Diinput oleh
                      </p>
                      <p className="text-sm text-dark-900 font-medium">
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
      <div className="py-12 text-center text-dark-400">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-dark-300" />
        <p className="font-medium">Anggota tidak ditemukan.</p>
      </div>
    </Card>
  );
}