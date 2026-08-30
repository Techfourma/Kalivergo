import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentTenantForUser } from "@/lib/tenant-context";
import { getCurrentSessionUser } from "@/server/auth/session";
import { getTransactionsWithSummary, createTransactionService } from "@/features/finance/services/transaction.service";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { requireCmsActor } from "@/actions/cms/role-model";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");

    const session = await getCurrentSessionUser();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantContext = await getCurrentTenantForUser(session.id);
    if (!tenantContext) {
      return NextResponse.json({ error: "Tenant access denied" }, { status: 403 });
    }
    const tenantId = tenantContext?.tenantId;
    const slug = tenantContext?.customSlug;

    let startDateObj: Date | undefined;
    let endDateObj: Date | undefined;
    if (startDate) startDateObj = new Date(startDate);
    if (endDate) endDateObj = new Date(endDate);

    const { transactions, summary } = await getTransactionsWithSummary(tenantId, startDateObj, endDateObj);

    let filteredTransactions = transactions;
    if (type) {
      filteredTransactions = filteredTransactions.filter((t) => t.type === type);
    }

    return NextResponse.json({
      transactions: filteredTransactions,
      summary,
    });
  } catch (error) {
    console.error("Error fetching finance:", error);
    return NextResponse.json({ error: "Failed to fetch finance data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const type = formData.get("type") as "INCOME" | "EXPENSE";
    const amountStr = formData.get("amount") as string;
    const description = formData.get("description") as string;
    const dateStr = formData.get("date") as string;
    const invoiceFile = formData.get("invoice") as File | null;
    const userId = formData.get("userId") as string | null;
    const categoryId = formData.get("categoryId") as string | null;

    if (!type || !amountStr || !description) {
      return NextResponse.json({ error: "Data transaksi tidak lengkap" }, { status: 400 });
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Jumlah nominal tidak valid" }, { status: 400 });
    }

    const session = await getCurrentSessionUser();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantContext = await getCurrentTenantForUser(session.id);
    const tenantId = tenantContext?.tenantId;
    const slug = tenantContext?.customSlug;
    if (!tenantId) {
      return NextResponse.json(
        { error: "Konteks tenant tidak ditemukan. Buka kelas melalui URL /[universitas]/[prodi]/[kelas]." },
        { status: 400 }
      );
    }

    const hasCmsAccess = await requireCmsActor(tenantId);
    if (!hasCmsAccess) {
      return NextResponse.json(
        { error: "Akses ditolak: hanya OWNER atau role CMS yang dapat membuat transaksi." },
        { status: 403 }
      );
    }

    let invoiceUrl = null;
    if (invoiceFile && invoiceFile.size > 0) {
      const bytes = await invoiceFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadResult = await uploadToCloudinary(buffer, {
        folder: "kalivergo/finance/invoices",
        resourceType: "auto",
      });
      invoiceUrl = uploadResult.secure_url;
    }

    const { readSessionUser } = await import("@/actions/cms/role-model");
    const creatorName = (await readSessionUser())?.name ?? "System";

    const { transaction } = await createTransactionService({
      tenantId,
      userId: userId || null,
      type,
      amount,
      description,
      date: dateStr ? new Date(dateStr) : new Date(),
      invoiceUrl,
      createdBy: creatorName,
      categoryId: categoryId || null,
    });

    if (slug) {
      revalidatePath(`/${slug}/cms/finance`);
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json({ error: "Gagal membuat transaksi" }, { status: 500 });
  }
}