import os
from .base import OpenAICompatibleProvider

groq_provider = OpenAICompatibleProvider(
    name="groq",
    api_key=os.getenv("GROQ_API_KEY", ""),
    base_url="https://api.groq.com/openai/v1/chat/completions",
    model=os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
)
