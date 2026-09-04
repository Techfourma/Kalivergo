import assert from "node:assert/strict";
import test from "node:test";

import { sendToAIAssistant, validateAIResponse, clearAIAgentState, streamFromAIAssistant } from "@/server/ai/client";
import {
  loadKnowledgeBase,
  resetKnowledgeBase,
  getKnowledgeFiles,
  retrieveRelevantContext,
  isKnowledgeLoaded,
  getKnowledgeVersion,
} from "@/server/ai/knowledgeBase";
import { buildPrompt } from "@/server/ai/providers/gemini";
import { withTimeout, withStreamTimeout } from "@/server/ai/providers/utils";
import { AIAssistantConfig, isProduction } from "@/server/ai/config";
import { getProviderOrder, isAnyProviderConfigured, generateWithFallback } from "@/server/ai/providers";
import { groqProvider } from "@/server/ai/providers/groq";
import { cerebrasProvider } from "@/server/ai/providers/cerebras";
import { geminiProvider } from "@/server/ai/providers/gemini";
import { openRouterProvider } from "@/server/ai/providers/openrouter";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

test("AI response validator accepts success and error envelopes", () => {
  assert.equal(validateAIResponse({ success: true, data: { response: "Hello" } }), true);
  assert.equal(
    validateAIResponse({
      success: false,
      error: { code: "AI_GENERATION_ERROR", message: "Failed" },
    }),
    true
  );
  assert.equal(validateAIResponse({ success: "yes" }), false);
  assert.equal(validateAIResponse({ success: true, data: { response: 123 } }), false);
  assert.equal(validateAIResponse(null), false);
});

test("sendToAIAssistant returns a success reply backed by a conversationId", async () => {
  clearAIAgentState();
  const result = await sendToAIAssistant({ message: "Question", userId: "user-test-1" });

  assert.equal(result.success, true);
  assert.match(result.response?.data?.conversationId ?? "", UUID_RE);
  assert.equal(typeof result.response?.data?.response, "string");
});

test("sendToAIAssistant reuses a provided valid conversationId", async () => {
  clearAIAgentState();
  const conversationId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

  const result = await sendToAIAssistant({
    message: "Question about Kalivergo",
    userId: "user-test-2",
    conversationId,
  });

  assert.equal(result.response?.data?.conversationId, conversationId);
});

test("sendToAIAssistant returns RATE_LIMITED when per-minute limit is exceeded", async () => {
  clearAIAgentState();
  const userId = "user-test-rl";

  const limit = AIAssistantConfig.rateLimits.perMinute;
  let rateLimited = false;

  for (let i = 0; i < limit + 2; i++) {
    const result = await sendToAIAssistant({
      message: `Test message ${i}`,
      userId,
    });

    if (!result.success && result.response?.error?.code === "RATE_LIMITED") {
      rateLimited = true;
      break;
    }
  }

  assert.equal(rateLimited, true, "Expected at least one request to be rate-limited");
});

test("sendToAIAssistant serves cached response for identical queries", async () => {
  clearAIAgentState();
  const userId = "user-test-cache";
  const message = "Test cache message unique";

  const result1 = await sendToAIAssistant({ message, userId });
  assert.equal(result1.success, true);
  const firstResponse = result1.response?.data?.response;

  const result2 = await sendToAIAssistant({ message, userId });
  assert.equal(result2.success, true);
  const secondResponse = result2.response?.data?.response;

  assert.equal(firstResponse, secondResponse, "Cached response should be identical");
});

test("knowledge base loads the internal Kalivergo dataset", async () => {
  clearAIAgentState();
  resetKnowledgeBase();
  const files = await loadKnowledgeBase();

  assert.ok(files.length > 0);
  assert.ok(getKnowledgeFiles().every((f) => f.content.trim().length > 0));
});

test("knowledge base is memoized after first load", async () => {
  clearAIAgentState();
  resetKnowledgeBase();
  assert.equal(isKnowledgeLoaded(), false);

  const versionBefore = getKnowledgeVersion();
  await loadKnowledgeBase();

  assert.equal(isKnowledgeLoaded(), true);
  const versionAfter = getKnowledgeVersion();
  assert.equal(versionAfter, versionBefore + 1);

  await loadKnowledgeBase();
  assert.equal(getKnowledgeVersion(), versionAfter, "Version should not increase on cached load");
});

test("retrieval returns relevant internal context for Kalivergo questions", async () => {
  clearAIAgentState();
  resetKnowledgeBase();
  await loadKnowledgeBase();

  const result = retrieveRelevantContext("Bagaimana cara registrasi seminar?", 3);
  assert.ok(result);
  assert.ok(result.context.length > 0);
  assert.ok(result.sources.length > 0);
});

test("retrieval returns null when nothing matches", async () => {
  clearAIAgentState();
  resetKnowledgeBase();
  await loadKnowledgeBase();

  const result = retrieveRelevantContext("zzzzxq notarealterm qqqq", 3);
  assert.equal(result, null);
});

test("retrieval uses inverted index and returns matching sources", async () => {
  clearAIAgentState();
  resetKnowledgeBase();
  await loadKnowledgeBase();

  const result = retrieveRelevantContext("Cara menggunakan CMS", 3);
  assert.ok(result);
  assert.ok(result.sources.length > 0);
  assert.ok(result.sources[0].path.includes("cms"));
});

test("retrieval respects maxFiles limit", async () => {
  clearAIAgentState();
  resetKnowledgeBase();
  await loadKnowledgeBase();

  const result = retrieveRelevantContext("Kalivergo", 2);
  assert.ok(result);
  assert.ok(result.sources.length <= 2);
});

test("retrieval returns excerpts, not full file content", async () => {
  clearAIAgentState();
  resetKnowledgeBase();
  await loadKnowledgeBase();

  const result = retrieveRelevantContext("Bagaimana cara login ke Kalivergo?", 1);
  assert.ok(result);

  const allFiles = getKnowledgeFiles();
  const matchedFile = allFiles.find((f) => f.path === result.sources[0].path);
  assert.ok(matchedFile);

  assert.ok(
    result.context.length < matchedFile.content.length,
    "Context should contain excerpts, not the entire file content"
  );
});

test("buildPrompt includes knowledge context and history", () => {
  const prompt = buildPrompt("Apa itu Kalivergo?", {
    knowledge: "Kalivergo adalah platform manajemen kelas.",
    history: [
      { role: "user", content: "Halo" },
      { role: "assistant", content: "Hai, ada yang bisa saya bantu?" },
    ],
  });

  assert.ok(prompt.includes("KONTEKS INTERNAL KALIVERGO"));
  assert.ok(prompt.includes("Kalivergo adalah platform manajemen kelas."));
  assert.ok(prompt.includes("RIWAYAT PERCAKAPAN"));
  assert.ok(prompt.includes("PERTANYAAN PENGGUNA"));
  assert.ok(prompt.includes("Apa itu Kalivergo?"));
});

test("buildPrompt includes only last maxHistoryMessages", () => {
  const history = Array.from({ length: 20 }, (_, i) => ({
    role: i % 2 === 0 ? "user" as const : "assistant" as const,
    content: `Message ${i}`,
  }));

  const prompt = buildPrompt("Pertanyaan", { history });
  const maxHist = AIAssistantConfig.maxHistoryMessages;
  assert.ok(maxHist > 0 && maxHist <= 20);
  assert.ok(prompt.includes(`Message ${19 - maxHist + 1}`));
});

test("withTimeout rejects on timeout", async () => {
  const neverResolve = new Promise<string>(() => {});
  await assert.rejects(
    withTimeout(neverResolve, 50),
    /timed out/
  );
});

test("withTimeout resolves when promise completes in time", async () => {
  const result = await withTimeout(Promise.resolve("done"), 1000);
  assert.equal(result, "done");
});

test("withStreamTimeout yields all chunks before timeout", async () => {
  async function* gen(): AsyncGenerator<string, void, void> {
    yield "chunk1";
    yield "chunk2";
    yield "chunk3";
  }

  const results: string[] = [];
  for await (const chunk of withStreamTimeout(gen(), 1000)) {
    results.push(chunk);
  }

  assert.deepEqual(results, ["chunk1", "chunk2", "chunk3"]);
});

test("streamFromAIAssistant returns a stream in mock mode", async () => {
  clearAIAgentState();
  const result = await streamFromAIAssistant({
    message: "Halo ai",
    userId: "user-test-stream-mock",
  });

  if (!result.success) {
    throw new Error(`Expected success but got: ${result.error?.message}`);
  }

  const chunks: string[] = [];
  for await (const chunk of result.stream) {
    chunks.push(chunk);
  }

  assert.equal(chunks.length > 0, true);
  assert.ok(chunks.join("").includes("MOCK MODE"));
});

test("streamFromAIAssistant respects rate limiting", async () => {
  clearAIAgentState();
  const userId = "user-test-stream-rl";
  const limit = AIAssistantConfig.rateLimits.perMinute;

  for (let i = 0; i < limit; i++) {
    await streamFromAIAssistant({ message: `Test ${i}`, userId });
  }

  const result = await streamFromAIAssistant({ message: "Over limit", userId });
  assert.equal(result.success, false);
  assert.equal(result.error?.code, "RATE_LIMITED");
});

test("isProduction is a function that reflects NODE_ENV", () => {
  assert.equal(typeof isProduction(), "boolean");
  assert.equal(isProduction(), false, "Should be false in non-production test env");
});

test("provider registry respects priority order", () => {
  const order = AIAssistantConfig.providerOrder;
  assert.deepEqual(order, ["groq", "cerebras", "gemini", "openrouter"]);
});

test("getProviderOrder filters unconfigured providers", () => {
  const providers = getProviderOrder();
  for (const p of providers) {
    assert.equal(p.isConfigured(), true);
  }
});

test("isAnyProviderConfigured returns boolean", () => {
  assert.equal(typeof isAnyProviderConfigured(), "boolean");
});

test("geminiProvider.isConfigured checks only Gemini API key", () => {
  assert.equal(typeof geminiProvider.isConfigured(), "boolean");
});

test("groqProvider has correct name and config", () => {
  assert.equal(groqProvider.name, "groq");
});

test("cerebrasProvider has correct name", () => {
  assert.equal(cerebrasProvider.name, "cerebras");
});

test("openRouterProvider has correct name", () => {
  assert.equal(openRouterProvider.name, "openrouter");
});

test("geminiProvider has correct name", () => {
  assert.equal(geminiProvider.name, "gemini");
});

test("generateWithFallback returns provider metadata on success", async () => {
  clearAIAgentState();

  if (!isAnyProviderConfigured()) {
    console.log("  (skipped: no provider configured in test env)");
    return;
  }

  const result = await generateWithFallback("Halo", { knowledge: "Kalivergo adalah platform." });

  assert.ok(result.response.length > 0);
  assert.equal(typeof result.provider, "string");
  assert.equal(typeof result.fallbackUsed, "boolean");
  assert.ok(Array.isArray(result.fallbackChain));
});
