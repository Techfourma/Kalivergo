from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uvicorn

from ai_assistant import AIAssistant
from providers import get_provider_order, is_any_provider_configured


app = FastAPI(
    title="Kalivergo AI Assistant API",
    description="Internal AI Assistant API untuk platform Kalivergo dengan multi-provider fallback (Groq → Cerebras → Gemini → OpenRouter)",
    version="2.0.0",
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
    history: Optional[List[dict]] = Field(default=None, description="Riwayat percakapan")
    user_id: str = Field(default="anonymous", description="User identifier untuk rate limiting")


class ChatResponse(BaseModel):
    response: str
    timestamp: str
    response_time_ms: float
    model: str
    context_used: bool
    provider: str = "unknown"
    fallback_used: bool = False
    fallback_chain: List[str] = Field(default_factory=list)


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
    providers: List[str]


@app.on_event("startup")
async def startup_event():
    global assistant
    try:
        assistant = AIAssistant()
        assistant.load_knowledge_base()
        print(f"✓ AI Assistant initialized with {assistant.get_dataset_info()['total_datasets']} datasets")
        print(f"✓ Active providers: {assistant.active_providers}")
    except Exception as e:
        print(f"✗ Failed to initialize AI Assistant: {e}")


@app.get("/", tags=["Root"])
async def root():
    return {
        "name": "Kalivergo AI Assistant API",
        "version": "2.0.0",
        "description": "Multi-provider AI Assistant (Groq → Cerebras → Gemini → OpenRouter) dengan dataset internal Kalivergo",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", response_model=HealthCheck, tags=["Health"])
async def health_check():
    if not assistant:
        raise HTTPException(status_code=503, detail="AI Assistant not initialized")

    return HealthCheck(
        status="healthy" if is_any_provider_configured() else "degraded",
        timestamp=datetime.now().isoformat(),
        datasets_loaded=assistant.get_dataset_info()["total_datasets"],
        providers=assistant.active_providers,
    )


@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(request: ChatRequest):
    if not assistant:
        raise HTTPException(status_code=503, detail="AI Assistant not initialized")

    history = None
    if request.history:
        history = [
            {"role": h.get("role", "user"), "content": h.get("content", "")}
            for h in request.history
        ]

    try:
        from datetime import datetime as dt
        start_time = dt.now()
        result = assistant.ask(
            request.message,
            use_context=request.use_context,
            history=history,
            user_id=request.user_id,
        )
        end_time = dt.now()

        if result.get("error"):
            status_code = 429 if result.get("error_code") == "RATE_LIMITED" else 503
            raise HTTPException(status_code=status_code, detail=result["response"])

        metadata = result.get("metadata", {})
        return ChatResponse(
            response=result["response"],
            timestamp=datetime.now().isoformat(),
            response_time_ms=(end_time - start_time).total_seconds() * 1000,
            model=metadata.get("provider", "unknown"),
            context_used=True,
            provider=metadata.get("provider", "unknown"),
            fallback_used=metadata.get("fallback_used", False),
            fallback_chain=metadata.get("fallback_chain", []),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/stream", tags=["Chat"])
async def chat_stream(request: ChatRequest):
    if not assistant:
        raise HTTPException(status_code=503, detail="AI Assistant not initialized")

    history = None
    if request.history:
        from providers import Message
        history = [
            Message(role=h.get("role", "user"), content=h.get("content", ""))
            for h in request.history
        ]

    stream = assistant.ask_stream(
        request.message,
        use_context=request.use_context,
        history=history,
        user_id=request.user_id,
    )

    async def event_generator():
        import json
        async for stream_chunk in stream:
            yield f"event: chunk\ndata: {json.dumps(stream_chunk.chunk)}\n\n"
        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/ask", response_model=ChatResponse, tags=["Chat"])
async def ask(request: ChatRequest):
    if not assistant:
        raise HTTPException(status_code=503, detail="AI Assistant not initialized")

    try:
        from datetime import datetime as dt
        start_time = dt.now()
        result = assistant.ask(request.message, use_context=False, user_id=request.user_id)
        end_time = dt.now()

        if result.get("error"):
            status_code = 429 if result.get("error_code") == "RATE_LIMITED" else 503
            raise HTTPException(status_code=status_code, detail=result["response"])

        metadata = result.get("metadata", {})
        return ChatResponse(
            response=result["response"],
            timestamp=datetime.now().isoformat(),
            response_time_ms=(end_time - start_time).total_seconds() * 1000,
            model=metadata.get("provider", "unknown"),
            context_used=False,
            provider=metadata.get("provider", "unknown"),
            fallback_used=metadata.get("fallback_used", False),
            fallback_chain=metadata.get("fallback_chain", []),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search", response_model=List[SearchResult], tags=["Knowledge Base"])
async def search_knowledge_base(request: SearchRequest):
    if not assistant:
        raise HTTPException(status_code=503, detail="AI Assistant not initialized")

    try:
        results = assistant.search_knowledge_base(request.query, request.top_k)
        return [SearchResult(**r) for r in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/datasets", response_model=DatasetInfo, tags=["Knowledge Base"])
async def get_datasets():
    if not assistant:
        raise HTTPException(status_code=503, detail="AI Assistant not initialized")

    info = assistant.get_dataset_info()
    return DatasetInfo(**info)


@app.post("/clear-history", tags=["Chat"])
async def clear_chat_history():
    if not assistant:
        raise HTTPException(status_code=503, detail="AI Assistant not initialized")

    assistant.clear_history()
    return {"status": "success", "message": "Chat history cleared"}


@app.get("/providers", tags=["Config"])
async def get_providers():
    if not assistant:
        raise HTTPException(status_code=503, detail="AI Assistant not initialized")

    return {
        "provider_order": ["groq", "cerebras", "gemini", "openrouter"],
        "active_providers": assistant.active_providers,
        "configured": is_any_provider_configured(),
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
