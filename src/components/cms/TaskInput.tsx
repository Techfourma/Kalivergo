"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { ClipboardList, Plus, Send } from "lucide-react";

interface TaskInputProps {
  onAddTask: (data: { title: string; description: string; deadline: string }) => Promise<void>;
}

export default function TaskInput({ onAddTask }: TaskInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", deadline: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onAddTask(formData);
      setIsOpen(false);
      setFormData({ title: "", description: "", deadline: "" });
    } catch (error) {
      console.error("Error adding task:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-dark-900">Input Tugas</h2>
              <p className="text-xs text-dark-500">Tambah tugas baru untuk kelas</p>
            </div>
          </div>
          <Button onClick={() => setIsOpen(true)}>
            <Plus className="h-4 w-4" /> Tambah Tugas
          </Button>
        </div>
      </Card>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Tambah Tugas Baru">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">Judul Tugas</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-xl border border-dark-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Masukkan judul tugas..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">Deskripsi</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-dark-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={3}
              placeholder="Deskripsi detail tugas..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">Deadline</label>
            <input
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full rounded-xl border border-dark-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsOpen(false)}>Batal</Button>
            <Button type="submit" className="flex-1" isLoading={isLoading}>
              <Send className="h-4 w-4" /> Publish
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}