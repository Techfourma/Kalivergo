"use client";

import { FileDown } from "lucide-react";

interface AuditLog {
  id: string;
  module: string;
  action: string;
  description: string;
  userId: string | null;
  userName: string | null;
  metadata: any;
  createdAt: Date;
}

interface AuditExportButtonProps {
  logs: AuditLog[];
  universityName: string;
  programName: string;
  className: string;
  module: string;
  startDate: string;
  endDate: string;
}

const MODULE_LABELS: Record<string, string> = {
  FINANCE: "Finance",
  PEOPLE: "People Management",
  TASKS: "Tasks",
  SEMINAR: "Seminar",
  SCHEDULE: "Schedule",
  ACCESS: "Access Control",
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Menambahkan",
  UPDATE: "Mengubah",
  UPDATE_ROLE: "Mengubah jabatan",
  DELETE: "Menghapus",
  APPROVE: "Menyetujui",
  REJECT: "Menolak",
};

export default function AuditExportButton({
  logs,
  universityName,
  programName,
  className,
  module,
  startDate,
  endDate,
}: AuditExportButtonProps) {
  const handleExportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();

    const WEBSITE_NAME = "Kalivergo";

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(WEBSITE_NAME, 14, 20);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Universitas ${universityName} - Program ${programName} - Kelas ${className}`,
      14,
      28
    );

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const moduleLabel = module === "ALL" ? "Semua Module" : MODULE_LABELS[module] || module;
    doc.text(`Laporan Audit Log - ${moduleLabel}`, 14, 36);

    let dateInfo = "Semua Transaksi";
    if (startDate || endDate) {
      const startStr = startDate
        ? new Date(startDate).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "awal";
      const endStr = endDate
        ? new Date(endDate).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "sekarang";
      dateInfo = `${startStr} - ${endStr}`;
    }
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Periode: ${dateInfo}`, 14, 43);
    doc.text(`Total: ${logs.length} entri`, 14, 49);

    const tableData = logs.map((log) => {
      const dateStr = new Date(log.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const moduleLabel = MODULE_LABELS[log.module] || log.module;
      const actionLabel = ACTION_LABELS[log.action] || log.action;

      return [
        dateStr,
        moduleLabel,
        actionLabel,
        log.description,
        log.userName || "-",
      ];
    });

    autoTable(doc, {
      startY: 55,
      head: [["Tanggal & Waktu", "Module", "Aksi", "Deskripsi", "User"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 55 },
      didParseCell: (data: any) => {
        if (data.section === "body") {
          data.cell.styles.fontSize = 8;
        }
        if (data.section === "head") {
          data.cell.styles.fontSize = 9;
        }
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Dicetak pada: ${new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      14,
      finalY
    );
    doc.text("Dokumen ini digenerate secara otomatis oleh sistem Kalivergo.", 14, finalY + 6);

    doc.save(
      `audit-log-${className.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  return (
    <button
      type="button"
      onClick={handleExportPDF}
      className="inline-flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5 active:translate-y-0 transition-all"
    >
      <FileDown className="h-4 w-4" />
      Export PDF
    </button>
  );
}
