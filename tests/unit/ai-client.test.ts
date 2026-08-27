import assert from "node:assert/strict";
import test from "node:test";

import { sendToAIAssistant, validateAIResponse } from "@/server/ai/client";
import {
  loadKnowledgeBase,
  resetKnowledgeBase,
  getKnowledgeFiles,
  retrieveRelevantContext,
} from "@/server/ai/knowledgeBase";

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
  const result = await sendToAIAssistant({ message: "Question", userId: "user-1" });

  assert.equal(result.success, true);
  assert.match(result.response?.data?.conversationId ?? "", UUID_RE);
  assert.equal(typeof result.response?.data?.response, "string");
});

test("sendToAIAssistant reuses a provided valid conversationId", async () => {
  const conversationId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

  const result = await sendToAIAssistant({
    message: "Question",
    userId: "user-1",
    conversationId,
  });

  assert.equal(result.response?.data?.conversationId, conversationId);
});

test("knowledge base loads the internal Kalivergo dataset", async () => {
  resetKnowledgeBase();
  const files = await loadKnowledgeBase();

  assert.ok(files.length > 0);
  assert.ok(getKnowledgeFiles().every((f) => f.content.trim().length > 0));
});

test("retrieval returns relevant internal context for Kalivergo questions", async () => {
  resetKnowledgeBase();
  await loadKnowledgeBase();

  const result = retrieveRelevantContext("Bagaimana cara registrasi seminar?", 3);
  assert.ok(result);
  assert.ok(result.context.length > 0);
  assert.ok(result.sources.length > 0);
});

test("retrieval returns null when nothing matches", async () => {
  resetKnowledgeBase();
  await loadKnowledgeBase();

  const result = retrieveRelevantContext("zzzzxq notarealterm qqqq", 3);
  assert.equal(result, null);
});