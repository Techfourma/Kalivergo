import assert from "node:assert/strict";
import test from "node:test";

import { sendToAIAssistant, validateAIResponse } from "@/server/ai/client";
import { buildAssistantUrl } from "@/server/ai/url";

const originalFetch = globalThis.fetch;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("AI response validator accepts success and error envelopes", () => {
  assert.equal(validateAIResponse({ success: true, data: { response: "Hello" } }), true);
  assert.equal(validateAIResponse({ success: false, error: { code: "HTTP_500", message: "Failed" } }), true);
  assert.equal(validateAIResponse({ success: "yes" }), false);
  assert.equal(validateAIResponse({ success: true, data: { response: 123 } }), false);
  assert.equal(validateAIResponse(null), false);
});

test("buildAssistantUrl normalizes every supported AI_ASSISTANT_URL shape", () => {
  assert.equal(
    buildAssistantUrl("https://academic-ai-assistant-seven.vercel.app"),
    "https://academic-ai-assistant-seven.vercel.app/api/assistant"
  );
  assert.equal(
    buildAssistantUrl("https://academic-ai-assistant-seven.vercel.app/"),
    "https://academic-ai-assistant-seven.vercel.app/api/assistant"
  );
  assert.equal(
    buildAssistantUrl("https://academic-ai-assistant-seven.vercel.app/api"),
    "https://academic-ai-assistant-seven.vercel.app/api/assistant"
  );
  assert.equal(
    buildAssistantUrl("https://academic-ai-assistant-seven.vercel.app/api/"),
    "https://academic-ai-assistant-seven.vercel.app/api/assistant"
  );
  assert.equal(
    buildAssistantUrl("https://academic-ai-assistant-seven.vercel.app/api/assistant"),
    "https://academic-ai-assistant-seven.vercel.app/api/assistant"
  );
  assert.equal(
    buildAssistantUrl("https://academic-ai-assistant-seven.vercel.app/api/assistant/"),
    "https://academic-ai-assistant-seven.vercel.app/api/assistant"
  );
  assert.equal(buildAssistantUrl("http://localhost:3000"), "http://localhost:3000/api/assistant");
  assert.equal(buildAssistantUrl("http://localhost:4000/"), "http://localhost:4000/api/assistant");
  assert.equal(buildAssistantUrl(""), "/api/assistant");
  assert.equal(buildAssistantUrl("   "), "/api/assistant");
});

test("AI client POSTs to /api/assistant with uuid ids and maps the backend answer", async () => {
  let request: Request | undefined;
  globalThis.fetch = async (input, init) => {
    request = new Request(input, init);
    return new Response(
      JSON.stringify({
        success: true,
        requestId: "11111111-1111-4111-8111-111111111111",
        answer: "Answer",
        sources: [],
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  };

  const result = await sendToAIAssistant({ message: "Question", userId: "user-1" }, "secret");

  assert.equal(result.success, true);
  assert.equal(result.response?.data?.response, "Answer");
  assert.match(result.response?.data?.conversationId ?? "", UUID_RE);
  assert.equal(request?.method, "POST");
  assert.match(request?.url ?? "", /\/api\/assistant$/);
  assert.equal(request?.headers.get("authorization"), "Bearer secret");

  const body = await request?.json();
  assert.match(body.requestId, UUID_RE);
  assert.match(body.conversationId, UUID_RE);
  assert.equal(body.message, "Question");
});

test("AI client reuses a provided uuid conversationId", async () => {
  let request: Request | undefined;
  globalThis.fetch = async (input, init) => {
    request = new Request(input, init);
    return new Response(
      JSON.stringify({ success: true, requestId: "1", answer: "Answer", sources: [] }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  };

  const conversationId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

  await sendToAIAssistant(
    { message: "Question", userId: "user-1", conversationId },
    "secret"
  );

  const body = await request?.json();
  assert.equal(body.conversationId, conversationId);
});

test("AI client maps backend errors to retryable failures", async () => {
  globalThis.fetch = async () => new Response("{}", { status: 503 });

  const result = await sendToAIAssistant({ message: "Question", userId: "user-1" }, "secret");

  assert.equal(result.success, false);
  assert.equal(result.response?.error?.code, "HTTP_503");
  assert.equal(result.response?.error?.isRetryable, true);
  assert.equal(result.error?.message, "AI Assistant tidak tersedia sementara.");
});

test("AI client surfaces backend error messages from an HTTP 200 error envelope", async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({ success: false, error: "AI_INTERNAL_ERROR", message: "Gemini unavailable" }),
      { status: 200, headers: { "content-type": "application/json" } }
    );

  const result = await sendToAIAssistant({ message: "Question", userId: "user-1" }, "secret");

  assert.equal(result.success, false);
  assert.equal(result.response?.error?.code, "AI_INTERNAL_ERROR");
  assert.equal(result.error?.message, "Gemini unavailable");
});

test("AI client converts aborts into a user-facing timeout error", async () => {
  globalThis.fetch = async (_input, init) => {
    init?.signal?.dispatchEvent(new Event("abort"));
    throw new DOMException("Aborted", "AbortError");
  };

  const result = await sendToAIAssistant({ message: "Question", userId: "user-1" }, "secret");

  assert.equal(result.success, false);
  assert.equal(result.error?.message, "AI Assistant timeout. Silakan coba lagi.");
});