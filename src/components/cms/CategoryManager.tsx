"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ActionFeedback from "@/components/cms/ActionFeedback";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/actions/cms";

interface Category {
  id: string;
  name: string;
  type: string;
}

interface CategoryManagerProps {
  incomeCategories: Category[];
  expenseCategories: Category[];
}

type Result = { success?: string | boolean; error?: string } | undefined;

function DeleteCategoryButton({
  id,
  name,
  onDeleted,
}: {
  id: string;
  name: string;
  onDeleted: () => void;
}) {
  const handleDelete = async () => {
    if (confirm(`Yakin ingin menghapus kategori "${name}"?`)) {
      return await deleteCategory(id);
    }
  };

  return (
    <ActionFeedback
      actionType="category"
      errorTitle="Gagal menghapus kategori"
      customSubmit={handleDelete}
      refreshOnSuccess={false}
      onClose={onDeleted}
      className="inline-block"
    >
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
      >
        <Trash2 className="h-4 w-4" /> Hapus
      </button>
    </ActionFeedback>
  );
}

export default function CategoryManager({
  incomeCategories,
  expenseCategories,
}: CategoryManagerProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Category | null>(null);
  const [type, setType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [name, setName] = useState("");
  const [activeTab, setActiveTab] = useState<"INCOME" | "EXPENSE">("INCOME");

  const closeModal = () => {
    setIsOpen(false);
    setEditing(null);
    setName("");
  };

  const openCreate = (t: "INCOME" | "EXPENSE") => {
    setMode("create");
    setEditing(null);
    setType(t);
    setName("");
    setIsOpen(true);
  };

  const openEdit = (cat: Category) => {
    setMode("edit");
    setEditing(cat);
    setType(cat.type as "INCOME" | "EXPENSE");
    setName(cat.name);
    setIsOpen(true);
  };

  const handleSubmit = async (formData: FormData): Promise<Result> => {
    formData.set("name", name.trim());
    formData.set("type", type);
    let result: Result;
    if (mode === "edit" && editing) {
      formData.set("id", editing.id);
      result = await updateCategory(formData);
    } else {
      result = await createCategory(formData);
    }
    if (result?.success) {
      closeModal();
      router.refresh();
    }
    return result;
  };

  const currentItems = activeTab === "INCOME" ? incomeCategories : expenseCategories;
  const isIncome = activeTab === "INCOME";

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              isIncome
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            }`}>
              {isIncome ? <ArrowDownCircle className="h-5 w-5" /> : <ArrowUpCircle className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-dark-900 dark:text-dark-50">
                {isIncome ? "Pemasukan" : "Pengeluaran"}
              </h2>
              <p className="text-xs text-dark-500 dark:text-dark-400">
                {isIncome ? "Kategori untuk pemasukan uang kas" : "Kategori untuk pengeluaran uang kas"}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => openCreate(activeTab)}>
            <Plus className="h-4 w-4" /> Tambah
          </Button>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-dark-100 dark:bg-dark-800 p-1 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("INCOME")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              activeTab === "INCOME"
                ? "bg-white dark:bg-dark-900 text-dark-900 dark:text-white shadow-sm"
                : "text-dark-600 dark:text-dark-300 hover:text-dark-900 dark:hover:text-dark-100"
            }`}
          >
            Pemasukan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("EXPENSE")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              activeTab === "EXPENSE"
                ? "bg-white dark:bg-dark-900 text-dark-900 dark:text-white shadow-sm"
                : "text-dark-600 dark:text-dark-300 hover:text-dark-900 dark:hover:text-dark-100"
            }`}
          >
            Pengeluaran
          </button>
        </div>

        {currentItems.length === 0 ? (
          <p className="text-sm text-dark-500 dark:text-dark-400">Belum ada kategori {isIncome ? "pemasukan" : "pengeluaran"}.</p>
        ) : (
          <div className="divide-y divide-dark-100 dark:divide-dark-700/60">
            {currentItems.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-2.5 w-2.5 rounded-full ${
                      isIncome ? "bg-green-500 dark:bg-green-400" : "bg-red-500 dark:bg-red-400"
                    }`}
                  />
                  <span className="text-sm font-medium text-dark-900 dark:text-dark-50">
                    {cat.name}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => openEdit(cat)}
                    className="inline-flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                  >
                    <Pencil className="h-4 w-4" /> Ubah
                  </button>
                  <DeleteCategoryButton
                    id={cat.id}
                    name={cat.name}
                    onDeleted={() => router.refresh()}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        title={mode === "edit" ? "Ubah Kategori" : "Tambah Kategori"}
        size="sm"
      >
        <ActionFeedback
          actionType="category"
          errorTitle={
            mode === "edit"
              ? "Gagal mengubah kategori"
              : "Gagal menambahkan kategori"
          }
          customSubmit={handleSubmit}
          refreshOnSuccess={false}
          onClose={closeModal}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
              Tipe Kategori
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "INCOME" | "EXPENSE")}
              className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-900 dark:text-dark-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:light] dark:[color-scheme:dark]"
            >
              <option value="INCOME">Pemasukan</option>
              <option value="EXPENSE">Pengeluaran</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
              Nama Kategori
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Uang kas, Acara, Operasional..."
              required
              className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-900 dark:text-dark-50 placeholder:text-dark-400 dark:placeholder:text-dark-500 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={closeModal}
            >
              Batal
            </Button>
            <Button type="submit" className="flex-1">
              {mode === "edit" ? "Simpan Perubahan" : "Tambah Kategori"}
            </Button>
          </div>
        </ActionFeedback>
      </Modal>
    </>
  );
}