from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uvicorn

from ai_assistant import AIAssistant


app = FastAPI(
    title="Kalivergo AI Assistant API",
    description="Internal AI Assistant API untuk platform Kalivergo menggunakan Gemini dan dataset internal",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

assistant: Optional[AIAssistant] = None


class ChatRequest(BaseModel):
    message: str = Field(..., description="Pesan dari pengguna")
    use_context: bool = Field(default=True, description="Gunakan chat history untuk context")


class ChatResponse(BaseModel):
    response: str
    timestamp: str
    response_time_ms: float
    model: str
    context_used: bool


class SearchRequest(BaseModel):
    query: str = Field(..., description="Query pencarian")
    top_k: int = Field(default=3, ge=1, le=10, description="Jumlah hasil teratas")


class SearchResult(BaseModel):
    dataset: str
    snippets: List[str]
    relevance_score: int


class DatasetInfo(BaseModel):
    total_datasets: int
    datasets: List[str]
    base_path: str


class HealthCheck(BaseModel):
    status: str
    timestamp: str
    datasets_loaded: int


@app.on_event("startup")
async def startup_event():
    """Initialize AI Assistant saat aplikasi start"""
    global assistant
    try:
        assistant = AIAssistant()
        print(f"✓ AI Assistant initialized with {len(assistant.dataset_contents)} datasets")
    except Exception as e:
        print(f"✗ Failed to initialize AI Assistant: {e}")
        raise


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint dengan informasi API"""
    return {
        "name": "Kalivergo AI Assistant API",
        "version": "1.0.0",
        "description": "Internal AI Assistant menggunakan Gemini dan dataset internal Kalivergo",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthCheck, tags=["Health"])
async def health_check():
    """Health check endpoint"""
    if not assistant:
        raise HTTPException(status_code=503, detail="AI Assistant not initialized")

    return HealthCheck(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        datasets_loaded=len(assistant.dataset_contents)
    )


@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(request: ChatRequest):
    """
    Chat dengan AI Assistant

    - **message**: Pesan dari pengguna
    - **use_context**: Apakah menggunakan chat history untuk context (default: True)
    """
    if not assistant:
        raise HTTPException(status_code=503, detail="AI Assistant not initialized")

    try:
        result = assistant.chat(request.message)
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ask", response_model=ChatResponse, tags=["Chat"])
async def ask(request: ChatRequest):
    """
    Tanya pertanyaan ke AI Assistant (tanpa menyimpan context)

    - **message**: Pertanyaan dari pengguna
    - **use_context**: Tidak digunakan untuk endpoint ini
    """
    if not assistant:
        raise HTTPException(status_code=503, detail="AI Assistant not initialized")

    try:
        response = assistant.ask(request.message, use_context=False)
        return ChatResponse(
            response=response,
            timestamp=datetime.now().isoformat(),
            response_time_ms=0,  # Not tracked for simple ask
            model=assistant.model.model_name,
            context_used=False
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search", response_model=List[SearchResult], tags=["Knowledge Base"])
async def search_knowledge_base(request: SearchRequest):
    """
    Search dalam knowledge base dataset internal

    - **query**: Query pencarian
    - **top_k**: Jumlah hasil teratas yang dikembalikan (1-10)
    """
    if not assistant:
        raise HTTPException(status_code=503, detail="AI Assistant not initialized")

    try:
        results = assistant.search_knowledge_base(request.query, request.top_k)
        return [SearchResult(**r) for r in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/datasets", response_model=DatasetInfo, tags=["Knowledge Base"])
async def get_datasets():
    """Get informasi tentang dataset yang loaded"""
    if not assistant:
        raise HTTPException(status_code=503, detail="AI Assistant not initialized")

    return DatasetInfo(**assistant.get_dataset_info())


@app.post("/clear-history", tags=["Chat"])
async def clear_chat_history():
    """Clear chat history untuk memulai sesi baru"""
    if not assistant:
        raise HTTPException(status_code=503, detail="AI Assistant not initialized")

    assistant.clear_history()
    return {"status": "success", "message": "Chat history cleared"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
