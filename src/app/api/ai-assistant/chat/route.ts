import { NextRequest, NextResponse } from "next/server";
import { sendToAIAssistant, validateAIResponse } from "@/server/ai/client";
import { AIAssistantConfig } from "@/server/ai/config";
import { getCurrentSessionUser } from "@/server/auth/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSessionUser();

    if (!session?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHENTICATED",
            message: "Anda harus login untuk menggunakan AI Assistant.",
          },
        },
        { status: 401 }
      );
    }

    const userId = session.id;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_JSON",
            message: "Format permintaan tidak valid.",
          },
        },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_BODY",
            message: "Format permintaan tidak valid.",
          },
        },
        { status: 400 }
      );
    }

    const reqBody = body as Record<string, unknown>;

    const message = reqBody.message;
    if (typeof message !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_MESSAGE",
            message: "Pesan diperlukan.",
          },
        },
        { status: 400 }
      );
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EMPTY_MESSAGE",
            message: "Pesan tidak boleh kosong.",
          },
        },
        { status: 400 }
      );
    }

    if (trimmedMessage.length > AIAssistantConfig.maxMessageLength) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MESSAGE_TOO_LONG",
            message: `Pesan terlalu panjang. Maksimal ${AIAssistantConfig.maxMessageLength} karakter.`,
          },
        },
        { status: 400 }
      );
    }

    const conversationId = reqBody.conversationId;
    if (conversationId !== undefined && typeof conversationId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CONVERSATION_ID",
            message: "ID percakapan tidak valid.",
          },
        },
        { status: 400 }
      );
    }

    let parsedHistory: Array<{ role: "user" | "assistant"; content: string }> | undefined;
    const history = reqBody.history;
    if (history !== undefined) {
      if (!Array.isArray(history)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_HISTORY",
              message: "Riwayat percakapan harus berupa array.",
            },
          },
          { status: 400 }
        );
      }
      parsedHistory = history
        .filter((h): h is { role: string; content: string } =>
          typeof h === "object" && h !== null &&
          (h.role === "user" || h.role === "assistant") &&
          typeof h.content === "string"
        )
        .map((h) => ({ role: h.role as "user" | "assistant", content: h.content }));
    }

    const aiResult = await sendToAIAssistant({
      message: trimmedMessage,
      userId,
      conversationId: typeof conversationId === "string" && conversationId.length > 0 ? conversationId : undefined,
      history: parsedHistory,
    });

    if (!aiResult.success) {
      const isRateLimited = aiResult.response?.error?.code === "RATE_LIMITED";
      return NextResponse.json(
        {
          success: false,
          error: {
            code: isRateLimited ? "RATE_LIMITED" : "AI_BACKEND_ERROR",
            message:
              aiResult.error?.message || "Terjadi masalah saat memproses pertanyaan.",
          },
        },
        { status: isRateLimited ? 429 : 503 }
      );
    }

    if (!aiResult.response || !validateAIResponse(aiResult.response)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_AI_RESPONSE",
            message: "Respons AI tidak valid.",
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json(aiResult.response);
  } catch (error) {
    console.error(
      "[AI Assistant] Unexpected error:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Terjadi masalah saat memproses pertanyaan. Silakan coba lagi.",
        },
      },
      { status: 500 }
    );
  }
}