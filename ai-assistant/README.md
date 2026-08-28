# Kalivergo AI Assistant (internal)

Layanan AI Assistant internal Kalivergo berbasis **Gemini** dengan dataset
lokal dari folder `dataset/` — tanpa bergantung pada service AI eksternal.

## Struktur

```
ai-assistant/
├── ai_assistant.py     # Inti model: Gemini + knowledge base dataset internal
├── main.py             # FastAPI server (chat / ask / search / health)
└── requirements.txt    # Dependensi Python
```

`ai_assistant.py` membaca dataset internal dari `../dataset` (folder akar
proyek), menyusun system prompt otomatis dari konten tersebut, dan menjawab
menggunakan Gemini.

## Menjalankan service FastAPI

```bash
pip install -r requirements.txt
export GEMINI_API_KEY="<key_gemini>"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Endpoint utama:

- `GET  /health`  — status layanan & jumlah dataset termuat
- `POST /chat`    — chat dengan konteks riwayat
- `POST /ask`     — tanya sekali (tanpa menyimpan konteks)
- `POST /search`  — cari konten di knowledge base internal
- `GET  /datasets`— info dataset yang dimuat

## Catatan migrasi internal

- File sebelumnya bernama `kalivergo_ai_assistant.py` → diubah menjadi
  `ai_assistant.py` agar rapi dan konsisten.
- Seluruh logika yang menarik AI dari URL eksternal telah dihapus.
- App frontend (Next.js) kini menjawab langsung memakai Gemini + dataset
  internal lewat `src/server/ai/*` (lihat `npm run test:ai`).