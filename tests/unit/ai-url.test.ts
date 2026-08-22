import assert from "node:assert/strict";
import test from "node:test";

import { buildAssistantUrl } from "@/server/ai/url";

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