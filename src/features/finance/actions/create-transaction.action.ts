"use server";

import { revalidatePath } from "next/cache";
import { readSessionUser, requireCmsActor, resolveTenantId } from "@/actions/cms/role-model";
import { createAuditLog } from "@/actions/cms/audit";
import {
  createTransactionService,
  deleteTransactionService,
  getMemberName,
} from "../services/transaction.service";

export async function createTransaction(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const type = formData.get("type") as "INCOME" | "EXPENSE";
    let amount = parseFloat(formData.get("amount") as string) || 10000;
    const description = formData.get("description") as string;
    const date = new Date(formData.get("date") as string);
    const categoryId = formData.get("categoryId") as string;

    if (!userId) return { error: "Pilih anggota terlebih dahulu" };
    if (!categoryId) return { error: "Pilih kategori transaksi" };

    const tenantId = await resolveTenantId();
    if (!tenantId)
      return {
        error:
          "Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].",
      };
    if (!(await requireCmsActor(tenantId)))
      return { error: "Akses ditolak: hanya OWNER atau role CMS." };

    const invoiceName = formData.get("invoiceName") as string | null;
    let invoiceUrl: string | null = null;
    if (invoiceName) {
      const safeFileName = `${Date.now()}-${invoiceName.replace(/\s+/g, "_")}`;
      invoiceUrl = `/uploads/${safeFileName}`;
    }

    const creatorName = (await readSessionUser())?.name ?? "System";

    const { transaction, isUangKas } = await createTransactionService({
      tenantId,
      userId,
      type,
      amount,
      description,
      date,
      invoiceUrl,
      createdBy: creatorName,
      categoryId,
    });

    const memberName = await getMemberName(userId);

    const auditDescription = `Menambahkan transaksi ${type === "INCOME" ? "pemasukan" : "pengeluaran"}: ${description}${memberName ? ` oleh ${memberName}` : ""}`;
    await createAuditLog("FINANCE", "CREATE", auditDescription, undefined, {
      transactionId: transaction.id,
      amount: transaction.amount,
      type,
      userId,
      userName: memberName,
      tenantId,
    });

    revalidatePath("/cms/finance");
    return { success: "Transaksi berhasil ditambahkan" };
  } catch (error: any) {
    console.error("Error creating transaction:", error);
    return { error: error.message || "Gagal menambahkan transaksi" };
  }
}

export async function deleteTransaction(id: string) {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) {
      return {
        error:
          "Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].",
      };
    }
    if (!(await requireCmsActor(tenantId))) {
      return {
        error:
          "Akses ditolak: hanya OWNER atau role CMS yang dapat menghapus transaksi.",
      };
    }

    const result = await deleteTransactionService(id, tenantId);
    if (!result.success) {
      return { error: result.error };
    }

    const { prisma } = await import("@/lib/db");
    const transaction = await prisma.transaction.findFirst({ where: { id, tenantId } });

    let transactionOwnerName: string | undefined;
    if (transaction?.userId) {
      const member = await prisma.user.findUnique({
        where: { id: transaction.userId },
      });
      transactionOwnerName = member?.name;
    }

    const delDescription = `Menghapus transaksi: ${transaction?.description}${transactionOwnerName ? ` oleh ${transactionOwnerName}` : ""}`;
    await createAuditLog("FINANCE", "DELETE", delDescription, undefined, {
      transactionId: id,
      amount: transaction?.amount,
      type: transaction?.type,
      userId: transaction?.userId,
      userName: transactionOwnerName,
      tenantId,
    });

    revalidatePath("/cms/finance");
    return { success: "Transaksi berhasil dihapus" };
  } catch (error: any) {
    console.error("Error deleting transaction:", error);
    return { error: error.message || "Gagal menghapus transaksi" };
  }
}