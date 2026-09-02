# Kalivergo AI Assistant 

Layanan AI Assistant internal Kalivergo berbasis **Gemini** dengan dataset
lokal dari folder `dataset/` — tanpa bergantung pada service AI eksternal.

## Struktur

```
ai-assistant/
├── ai_assistant.py     # Inti model: Gemini + knowledge base dataset internal (opsional, FastAPI)
├── main.py             # FastAPI server (chat / ask / search / health)
└── requirements.txt    # Dependensi Python
```

`ai_assistant.py` membaca seluruh dataset internal dari `../dataset` (folder akar
proyek) secara rekursif, menyusun system prompt otomatis dari konten tersebut, dan menjawab
menggunakan Gemini.

Implementasi utama AI Assistant saat ini berada di **Next.js** (`src/server/ai/*`),
yang memuat knowledge base dari `dataset/` dan meneruskan pertanyaan ke Gemini.
File Python opsional ini tetap bisa dijalankan sebagai layanan mandiri.

## Menjalankan service FastAPI (opsional)

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

## Memperbarui dataset knowledge base

Knowledge base dibaca dari folder `dataset/` di akar proyek (file `.md`/`.txt`).
Struktur yang digunakan saat ini:

```text
dataset/
├── platform/            # cara kerja, terms, privacy, dan FAQ
└── page/<nama-halaman>/  # panduan penggunaan tiap halaman
```

Catatan pemeliharaan:

- Tambahkan atau perbarui file di `dataset/` saat fitur/UI berubah agar
  jawaban asisten tetap akurat.
- Knowledge base dimuat dan di-memoize saat server pertama kali dipakai.
  Setelah mengubah isi `dataset/`, mulai ulang proses server (atau muat
  ulang indeks via mekanisme `loadKnowledgeBase(force = true)` pada
  `src/server/ai/knowledgeBase.ts`).
- Format Markdown polos direkomendasikan; hindari karakter/HTML kompleks
  agar tokenisasi dan retrieval term-overlap bekerja optimal.
- Jalankan `npm run test:ai` setelah mengubah dataset untuk memastikan
  knowledge base masih termuat dan retrieval tetap mengembalikan konteks.

## Catatan migrasi internal

- File sebelumnya bernama `kalivergo_ai_assistant.py` → diubah menjadi
  `ai_assistant.py` agar rapi dan konsisten.
- Seluruh logika yang menarik AI dari URL eksternal telah dihapus.
- App frontend (Next.js) kini menjawab langsung memakai Gemini + dataset
  internal lewat `src/server/ai/*` (lihat `npm run test:ai`).