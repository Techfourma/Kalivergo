"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Save, Wallet } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ActionFeedback from "@/components/cms/ActionFeedback";
import { saveUangKasSettingsAction } from "@/features/finance";

interface UangKasSettingsCardProps {
  dates?: string[];
  amount?: number;
}

export default function UangKasSettingsCard({ dates = [], amount = 10000 }: UangKasSettingsCardProps) {
  const router = useRouter();
  const [billingDates, setBillingDates] = useState(dates.length > 0 ? dates : [""]);
  const [cashAmount, setCashAmount] = useState(String(amount));

  const handleSubmit = async (formData: FormData) => {
    formData.delete("dates");
    billingDates.forEach((date) => formData.append("dates", date));
    formData.set("amount", cashAmount);
    const result = await saveUangKasSettingsAction(formData);
    if (result?.success) router.refresh();
    return result;
  };

  return (
    <Card>
      <div className="flex items-start gap-3 mb-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
          <Wallet className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">Pendataan Uang Kelas</h2>
          <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
            Tentukan jadwal tagihan dan nominal uang kas untuk kelas ini.
          </p>
        </div>
      </div>

      <ActionFeedback
        actionType="finance"
        errorTitle="Gagal menyimpan pengaturan uang kelas"
        customSubmit={handleSubmit}
        refreshOnSuccess={false}
        className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end"
      >
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-dark-700 dark:text-dark-300">Tanggal tagihan</label>
          <div className="space-y-2">
            {billingDates.map((date, index) => (
              <div key={`${index}-${date}`} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-400 dark:text-dark-500" />
                  <input
                    type="date"
                    name="dates"
                    value={date}
                    onChange={(event) => setBillingDates((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                    required
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-900 dark:text-dark-50 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
                {billingDates.length > 1 && (
                  <button type="button" onClick={() => setBillingDates((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="px-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">Hapus</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setBillingDates((current) => [...current, ""])} className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">+ Tambah tanggal tagihan</button>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dark-700 dark:text-dark-300">Nominal uang kas</label>
          <input
            type="number"
            name="amount"
            min="1"
            step="1"
            value={cashAmount}
            onChange={(event) => setCashAmount(event.target.value)}
            required
            className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-900 dark:text-dark-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <Button type="submit">
          <Save className="h-4 w-4" />
          Simpan Pengaturan
        </Button>
      </ActionFeedback>
    </Card>
  );
}