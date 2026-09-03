from dataclasses import dataclass, field
from typing import List, Optional, AsyncGenerator, Protocol


@dataclass
class Message:
    role: str
    content: str


@dataclass
class ProviderContext:
    knowledge: Optional[str] = None
    history: List[Message] = field(default_factory=list)


@dataclass
class GenerationResult:
    response: str
    provider: str
    fallback_used: bool = False
    fallback_chain: List[str] = field(default_factory=list)


@dataclass
class StreamChunk:
    chunk: str
    provider: str
    fallback_used: bool = False
    fallback_chain: List[str] = field(default_factory=list)


class AIProvider(Protocol):
    @property
    def name(self) -> str: ...

    def is_configured(self) -> bool: ...

    def generate_answer(self, message: str, context: ProviderContext) -> str: ...

    def generate_answer_stream(
        self, message: str, context: ProviderContext
    ) -> AsyncGenerator[str, None]: ...
