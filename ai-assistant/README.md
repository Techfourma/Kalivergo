# Kalivergo AI Assistant

Layanan AI Assistant internal Kalivergo berbasis **multi-provider fallback**
(Groq → Cerebras → Gemini → OpenRouter) dengan dataset lokal dari folder
`dataset/` — tanpa bergantung pada service AI eksternal tunggal.

## Struktur

```text
ai-assistant/
├── ai_assistant.py         # Inti: KnowledgeBase (RAG) + AIAssistant class + rate limiter + cache
├── main.py                 # FastAPI server (chat / ask / chat/stream / search / health)
├── requirements.txt         # Dependensi Python
├── providers/
│   ├── __init__.py          # Public API exports
│   ├── types.py             # AIProvider interface, ProviderContext, Message, Result types
│   ├── base.py              # OpenAICompatibleProvider (Groq, Cerebras, OpenRouter)
│   ├── groq.py              # Groq provider instance
│   ├── cerebras.py          # Cerebras provider instance
│   ├── gemini.py            # Gemini provider (google-generativeai SDK)
│   └── openrouter.py        # OpenRouter provider instance
```

## Arsitektur Multi-Provider Fallback

```
User
  ↓
API Router (main.py)
  ↓
AIAssistant.ask() / ask_stream()
  ↓
generate_with_fallback() / stream_with_fallback()
  ↓
Groq (primary)
  ├─ fail (429/timeout/5xx) → Cerebras
  │     ├─ fail → Gemini
  │     │     ├─ fail → OpenRouter (final)
  │     │     └─ fail → Final error
  │     └─ success → Response
  └─ success → Response
```

### Provider Priority

| No | Provider    | Model                          | API Key Env       |
|----|-------------|--------------------------------|-------------------|
| 1  | Groq        | `openai/gpt-oss-120b`          | `GROQ_API_KEY`    |
| 2  | Cerebras    | `gpt-oss-120b`                 | `CEREBBRAS_API_KEY` |
| 3  | Gemini      | `gemini-3.6-flash`             | `GEMINI_API_KEY`  |
| 4  | OpenRouter  | `google/gemini-2.0-flash`      | `OPENROUTER_API_KEY` |

### Fallback Rules

**Fallback ke provider berikutnya jika:**
- 429 Rate limit / quota exceeded
- 503 / 502 / 504 Service unavailable
- 500 Internal server error
- Timeout
- Network error
- Model not found or unavailable (404)
- Transient provider error

**Tidak melakukan fallback jika:**
- 400 Bad Request
- Invalid API key (misconfiguration) — langsung pindah ke provider berikutnya tanpa retry
- Programming error

### Internal Rate Limiting

- **5 request/menit per user** (configurable via `AI_MAX_REQUESTS_PER_MINUTE`)
- Rate limit diterapkan **sebelum** provider fallback — mencegah abuse bahkan jika semua provider tersedia.

## Cara Menjalankan

```bash
pip install -r requirements.txt
export GROQ_API_KEY="your_groq_key"
export CEREBBRAS_API_KEY="your_cerebras_key"
export GEMINI_API_KEY="your_gemini_key"
export OPENROUTER_API_KEY="your_openrouter_key"
export KNOWLEDGE_BASE_DIR="../dataset"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Endpoints

| Method | Endpoint          | Deskripsi                          |
|--------|-------------------|------------------------------------|
| GET    | `/`               | Info API                           |
| GET    | `/health`         | Status layanan & provider aktif    |
| POST   | `/chat`           | Chat dengan konteks riwayat        |
| POST   | `/chat/stream`    | Chat dengan streaming response     |
| POST   | `/ask`            | Tanya sekali (tanpa menyimpan context) |
| POST   | `/search`         | Cari konten di knowledge base      |
| GET    | `/datasets`       | Info dataset yang dimuat           |
| POST   | `/clear-history`  | Clear chat history                 |
| GET    | `/providers`      | Info provider & priority order     |

## Environment Variables

```env
# Provider API Keys
GROQ_API_KEY=
CEREBBRAS_API_KEY=
GEMINI_API_KEY=
OPENROUTER_API_KEY=

# Provider Models (optional, uses defaults)
GROQ_MODEL=openai/gpt-oss-120b
CEREBBRAS_MODEL=gpt-oss-120b
GEMINI_MODEL=gemini-3.6-flash
OPENROUTER_MODEL=google/gemini-2.0-flash

# Knowledge Base
KNOWLEDGE_BASE_DIR=dataset

# Limits & Timeouts
AI_MAX_INPUT_CHARS=4000
AI_MAX_OUTPUT_TOKENS=3000
AI_MAX_HISTORY_MESSAGES=6
AI_MAX_REQUESTS_PER_MINUTE=5
AI_MAX_REQUESTS_PER_HOUR=30
AI_REQUEST_TIMEOUT_MS=60000
AI_MAX_RETRIES=2
AI_MOCK_MODE=false
```

## Knowledge Base

Knowledge base dimuat dari folder `dataset/` di akar proyek (file `.md`/`.txt`).
Menggunakan **inverted index** yang di-pre-tokenize saat load — retrieval
hanya O(Q × P) per query, bukan O(N × T).

```text
dataset/
├── platform/             # cara kerja, terms, privacy, FAQ
└── page/<nama-halaman>/  # panduan penggunaan tiap halaman
```

Setelah mengubah isi `dataset/`, restart server agar indeks di-rebuild.

## Response Format

```json
{
  "response": "Jawaban dari AI...",
  "provider": "groq",
  "fallback_used": false,
  "fallback_chain": [],
  "response_time_ms": 152.3,
  "cached": false
}
```

Jika fallback terjadi:
```json
{
  "response": "Jawaban dari AI...",
  "provider": "cerebras",
  "fallback_used": true,
  "fallback_chain": ["groq"],
  "response_time_ms": 312.5,
  "cached": false
}
```

## Migration Notes

- File sebelumnya bernama `ai_assistant.py` (single Gemini) telah diperluas
  untuk mendukung multi-provider.
- System prompt dan conversation history tetap sama.
- RAG/knowledge base context tetap sama (retrieval-augmented generation).
- Streaming tetap didukung via SSE (`/chat/stream`).
- Provider error tidak bocir ke user — semua error disamarkan dengan pesan generik.
