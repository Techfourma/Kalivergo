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
}

export default function FinanceInput({
  users,
  incomeCategories,
  expenseCategories,
  uangKasDates = [],
}: FinanceInputProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState("INCOME");
  const [categoryId, setCategoryId] = useState("");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  const today = new Date();
  const maxDate = today.toISOString().split("T")[0];
  const minDate = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const selectedCategories = type === "INCOME" ? incomeCategories : expenseCategories;

  const selectedCategory = selectedCategories.find((cat) => cat.id === categoryId);
  const isUangKasIncome = type === "INCOME" && selectedCategory?.name.toLowerCase() === "uang kas";

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
          <Button onClick={() => setIsOpen(true)}>
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </div>
      </Card>

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
              <input type="number" name="amount" value={10000} readOnly required className="w-full rounded-xl border border-dark-200 bg-dark-50 px-4 py-2.5 text-sm text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-not-allowed" />
            ) : (
              <input type="number" name="amount" min="0" step="0.01" required className="w-full rounded-xl border border-dark-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            )}
            {isUangKasIncome && (
              <p className="text-xs text-dark-500 mt-1">Nominal uang kas ditetapkan Rp 10.000.</p>
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