"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ActionFeedback from "@/components/cms/ActionFeedback";
import { Wallet, Plus, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { createTransaction } from "@/features/finance";

interface User {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

interface FinanceInputProps {
  users: User[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  uangKasDates?: { label: string; value: string }[];
  uangKasAmount?: number;
}

export default function FinanceInput({
  users,
  incomeCategories,
  expenseCategories,
  uangKasDates = [],
  uangKasAmount = 10000,
}: FinanceInputProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState("INCOME");
  const [categoryId, setCategoryId] = useState("");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [showCategoryNotice, setShowCategoryNotice] = useState(false);

  const today = new Date();
  const maxDate = today.toISOString().split("T")[0];
  const minDate = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const selectedCategories = type === "INCOME" ? incomeCategories : expenseCategories;

  const selectedCategory = selectedCategories.find((cat) => cat.id === categoryId);
  const isUangKasIncome = type === "INCOME" && selectedCategory?.name.toLowerCase() === "uang kas";

  const hasIncomeCategories = incomeCategories.length > 0;
  const hasExpenseCategories = expenseCategories.length > 0;
  const onlyHasUangKas = hasIncomeCategories && !hasExpenseCategories && incomeCategories.some(cat => cat.name.toLowerCase().includes("uang kas"));

  const handleOpenModal = () => {
    if (onlyHasUangKas || (!hasIncomeCategories && !hasExpenseCategories)) {
      setShowCategoryNotice(true);
    } else {
      setIsOpen(true);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    formData.set("type", type);
    if (invoiceFile) {
      formData.set("invoiceName", invoiceFile.name);
    }

    const result = await createTransaction(formData);


    if (result && "success" in result) {
      setType("INCOME");
      setCategoryId("");
      setInvoiceFile(null);
    }

    return result;
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-dark-900">Input Transaksi</h2>
              <p className="text-xs text-dark-500">Tambah pemasukan atau pengeluaran</p>
            </div>
          </div>
          <Button onClick={handleOpenModal}>
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </div>
      </Card>

      {showCategoryNotice && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-dark-900 dark:border dark:border-dark-700 p-8 text-center shadow-2xl">
            <button
              type="button"
              onClick={() => setShowCategoryNotice(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-dark-400 dark:text-dark-500 transition-colors hover:bg-dark-100 dark:hover:bg-dark-800 hover:text-dark-600 dark:hover:text-dark-200"
              aria-label="Tutup"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-dark-900 dark:text-white">Kategori Belum Lengkap</h2>
            <p className="mt-2 text-sm text-dark-600 dark:text-dark-300">
              {onlyHasUangKas
                ? "Anda hanya memiliki kategori Uang Kas. Silakan tambahkan kategori Pemasukan dan Pengeluaran terlebih dahulu sebelum melakukan input transaksi."
                : "Silakan tambahkan kategori Pemasukan dan Pengeluaran terlebih dahulu sebelum melakukan input transaksi."
              }
            </p>
            <button
              type="button"
              onClick={() => setShowCategoryNotice(false)}
              className="mt-6 rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-700"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Tambah Transaksi" size="md">
        <ActionFeedback
          actionType="finance"
          errorTitle="Gagal menambahkan transaksi"
          customSubmit={handleSubmit}
          refreshOnSuccess={false}
          onClose={() => {
            setIsOpen(false);
            router.refresh();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">Tipe Transaksi</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setType("INCOME"); setCategoryId(""); }}
                className={`rounded-xl border-2 p-3 text-center text-sm font-medium transition-all ${
                  type === "INCOME" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-dark-200 text-dark-600 hover:border-dark-300"
                }`}
              >
                Pemasukan
              </button>
              <button
                type="button"
                onClick={() => { setType("EXPENSE"); setCategoryId(""); }}
                className={`rounded-xl border-2 p-3 text-center text-sm font-medium transition-all ${
                  type === "EXPENSE" ? "border-red-500 bg-red-50 text-red-700" : "border-dark-200 text-dark-600 hover:border-dark-300"
                }`}
              >
                Pengeluaran
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">Nama Anggota</label>
            <select name="userId" required className="w-full rounded-xl border border-dark-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Pilih anggota</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">Kategori</label>
            <select name="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="w-full rounded-xl border border-dark-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Pilih kategori</option>
              {selectedCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">Nominal</label>
            {isUangKasIncome ? (
              <input type="number" name="amount" value={uangKasAmount} readOnly required className="w-full rounded-xl border border-dark-200 bg-dark-50 px-4 py-2.5 text-sm text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-not-allowed" />
            ) : (
              <input type="number" name="amount" min="0" step="0.01" required className="w-full rounded-xl border border-dark-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            )}
            {isUangKasIncome && (
              <p className="text-xs text-dark-500 mt-1">Nominal mengikuti pengaturan Uang Kelas.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">Tanggal</label>
            {isUangKasIncome ? (
              <select name="date" required className="w-full rounded-xl border border-dark-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Pilih tanggal</option>
                {uangKasDates.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="date"
                name="date"
                required
                min={minDate}
                max={maxDate}
                defaultValue={maxDate}
                className="w-full rounded-xl border border-dark-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">Deskripsi</label>
            <textarea name="description" required rows={3} className="w-full rounded-xl border border-dark-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">Invoice (Opsional)</label>
            <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-dark-200 p-4 cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-all">
              <Upload className="h-5 w-5 text-dark-400" />
              <span className="text-sm text-dark-500">{invoiceFile ? invoiceFile.name : "Upload invoice..."}</span>
              <input type="file" accept="image/*,.pdf" onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)} className="hidden" />
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsOpen(false)}>Batal</Button>
            <Button type="submit" className="flex-1">+ Tambah Transaksi</Button>
          </div>
        </ActionFeedback>
      </Modal>
    </>
  );
}