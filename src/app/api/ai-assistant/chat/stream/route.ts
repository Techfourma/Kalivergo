import { NextRequest, NextResponse } from "next/server";
import { streamFromAIAssistant } from "@/server/ai/client";
import { AIAssistantConfig } from "@/server/ai/config";
import { getCurrentSessionUser } from "@/server/auth/session";

const HEARTBEAT_INTERVAL_MS = 15000;
const ENCODER = new TextEncoder();

export async function POST(request: NextRequest) {
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

  const history = reqBody.history;
  let parsedHistory: Array<{ role: "user" | "assistant"; content: string }> | undefined;
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

  const streamResult = await streamFromAIAssistant({
    message: trimmedMessage,
    userId,
    conversationId: typeof conversationId === "string" ? conversationId : undefined,
    history: parsedHistory,
  });

  if (!streamResult.success) {
    const err = streamResult.error ?? { code: "UNKNOWN", message: "Unknown error", isRetryable: false };
    return NextResponse.json(
      {
        success: false,
        error: err,
      },
      { status: err.code === "RATE_LIMITED" ? 429 : 503 }
    );
  }

  const { conversationId: resolvedId, stream } = streamResult;

  const readable = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        ENCODER.encode(
          `event: conversationId\ndata: ${JSON.stringify(resolvedId)}\n\n`
        )
      );

      let heartbeat: NodeJS.Timeout | undefined;
      const startHeartbeat = () => {
        heartbeat = setInterval(() => {
          controller.enqueue(ENCODER.encode(":heartbeat\n\n"));
        }, HEARTBEAT_INTERVAL_MS);
      };
      const stopHeartbeat = () => {
        if (heartbeat) clearInterval(heartbeat);
      };

      startHeartbeat();

      try {
        for await (const chunk of stream) {
          controller.enqueue(
            ENCODER.encode(`event: chunk\ndata: ${JSON.stringify(chunk)}\n\n`)
          );
        }
        controller.enqueue(ENCODER.encode(`event: done\ndata: {}\n\n`));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          ENCODER.encode(`event: error\ndata: ${JSON.stringify(message)}\n\n`)
        );
      } finally {
        stopHeartbeat();
        controller.close();
      }
    },
    cancel() {
    },
  });

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
