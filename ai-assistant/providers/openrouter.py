import os
from .base import OpenAICompatibleProvider

openrouter_provider = OpenAICompatibleProvider(
    name="openrouter",
    api_key=os.getenv("OPENROUTER_API_KEY", ""),
    base_url="https://openrouter.ai/api/v1/chat/completions",
    model=os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash"),
)
