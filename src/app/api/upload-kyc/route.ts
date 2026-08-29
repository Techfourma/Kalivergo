import { NextRequest, NextResponse } from "next/server";
import {
  uploadSelfieForKYC,
  uploadKtmForKYC,
} from "@/features/kyc/services/kyc-storage.service";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const type = formData.get("type");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    const allowedTypes = ["selfie", "ktm", "profile"];
    if (!type || typeof type !== "string" || !allowedTypes.includes(type)) {
      return NextResponse.json(
        { error: "Tipe file tidak valid. Gunakan: selfie, ktm, atau profile" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let result;
    if (type === "ktm") {
      result = await uploadKtmForKYC(buffer, file.name);
    } else {
      result = await uploadSelfieForKYC(buffer, file.name);
    }

    if (!result.success || !result.publicId) {
      return NextResponse.json(
        { error: result.error || "Gagal mengunggah file" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      publicId: result.publicId,
      url: result.url,
    });
  } catch (error) {
    console.error("Upload KYC error:", error);
    return NextResponse.json(
      { error: "Gagal mengunggah file" },
      { status: 500 }
    );
  }
}
