import os
from .base import OpenAICompatibleProvider

cerebras_provider = OpenAICompatibleProvider(
    name="cerebras",
    api_key=os.getenv("CEREBBRAS_API_KEY", ""),
    base_url="https://api.cerebras.ai/v1/chat/completions",
    model=os.getenv("CEREBBRAS_MODEL", "gpt-oss-120b"),
)
