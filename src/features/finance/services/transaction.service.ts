import "server-only";

import { createAuditLog } from "@/server/audit";
import {
  createTransaction as createTransactionRepo,
  deleteTransactionById,
  findTransactionById,
  findTransactionsByTenantId,
} from "../repositories/transaction.repository";
import {
  createCashPayment,
  deleteCashPaymentsByUserIdAndDate,
} from "../repositories/cash-payment.repository";
import { isUangKasName } from "../validators/finance.utils";
import { findCategoryById } from "@/features/cms/repositories/category.repository";

export async function getTransactionsWithSummary(tenantId: string, startDate?: Date, endDate?: Date) {
  const transactions = await findTransactionsByTenantId(tenantId, { startDate, endDate });

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  return {
    transactions,
    summary: {
      totalIncome,
      totalExpense,
      balance,
    },
  };
}

export async function createTransactionService(input: {
  tenantId: string;
  userId: string | null;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  date: Date;
  invoiceUrl: string | null;
  createdBy: string;
  categoryId: string | null;
}) {
  let finalAmount = input.amount;
  let isUangKas = false;

  if (input.type === "INCOME" && input.categoryId) {
    const category = await findCategoryById(input.categoryId, input.tenantId);
    if (category && isUangKasName(category.name)) {
      isUangKas = true;
      const schedules = await import("../repositories/uang-kas-schedule.repository").then(({ findUangKasSchedulesByTenantId }) =>
        findUangKasSchedulesByTenantId(input.tenantId)
      );
      const selectedDate = input.date.toISOString().split("T")[0];
      const activeSchedule = schedules.find(
        (schedule) => schedule.date.toISOString().split("T")[0] === selectedDate
      );
      if (!activeSchedule) throw new Error("Pilih tanggal tagihan yang sudah didata pada Uang Kelas.");
      finalAmount = Number(activeSchedule.amount);
      input.date = activeSchedule.date;
    }
  }

  const transaction = await createTransactionRepo({
    ...input,
    amount: finalAmount,
  });

  if (isUangKas && input.userId) {
    try {
      await createCashPayment({
        tenantId: input.tenantId,
        userId: input.userId,
        amount: finalAmount,
        description: input.description || "Uang kas",
        date: input.date,
      });
    } catch (e) {
      console.error("Error creating cash payment for uang kas:", e);
    }
  }

  return { transaction, isUangKas };
}

export async function deleteTransactionService(
  id: string,
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  const transaction = await findTransactionById(id, tenantId);
  if (!transaction) {
    return { success: false, error: "Transaksi tidak ditemukan" };
  }

  if (transaction.tenantId !== tenantId) {
    return {
      success: false,
      error: "Akses ditolak: Transaksi bukan milik kelas Anda",
    };
  }

  if (transaction.userId && transaction.type === "INCOME" && transaction.categoryId) {
    const category = await findCategoryById(transaction.categoryId, tenantId);
    if (category && isUangKasName(category.name)) {
      try {
        await deleteCashPaymentsByUserIdAndDate(transaction.userId, tenantId, transaction.date);
      } catch (e) {
        console.error("Error deleting cash payment for uang kas:", e);
      }
    }
  }

  await deleteTransactionById(id, tenantId);
  return { success: true };
}

export async function getMemberName(userId: string | null): Promise<string | undefined> {
  if (!userId) return undefined;

  const { prisma } = await import("@/lib/db");
  const member = await prisma.user.findUnique({ where: { id: userId } });
  return member?.name;
}