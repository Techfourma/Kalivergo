from typing import List
from .types import AIProvider, ProviderContext, GenerationResult, StreamChunk
from .groq import groq_provider
from .cerebras import cerebras_provider
from .gemini import gemini_provider
from .openrouter import openrouter_provider


PROVIDER_ORDER = ["groq", "cerebras", "gemini", "openrouter"]

PROVIDERS: dict[str, AIProvider] = {
    "groq": groq_provider,
    "cerebras": cerebras_provider,
    "gemini": gemini_provider,
    "openrouter": openrouter_provider,
}


def get_provider_order() -> List[AIProvider]:
    result = []
    for name in PROVIDER_ORDER:
        provider = PROVIDERS.get(name)
        if provider and provider.is_configured():
            result.append(provider)
    return result


def is_any_provider_configured() -> bool:
    return len(get_provider_order()) > 0


def is_fallback_error(error: Exception) -> bool:
    if not isinstance(error, Exception):
        return False
    msg = str(error).lower()
    fallback_indicators = [
        "rate limit",
        "429",
        "quota",
        "daily limit",
        "monthly limit",
        "503",
        "unavailable",
        "timeout",
        "timed out",
        "502",
        "500",
        "504",
        "network",
        "connection error",
        "temporarily",
        "404",
        "model_not_found",
        "does not exist",
        "do not have access",
    ]
    return any(ind in msg for ind in fallback_indicators)


def generate_with_fallback(
    message: str, context: ProviderContext | None = None
) -> GenerationResult:
    context = context or ProviderContext()
    providers = get_provider_order()

    if not providers:
        raise Exception("No AI provider is configured.")

    last_error: Exception | None = None
    fallback_chain: List[str] = []
    is_first = True

    for provider in providers:
        if not is_first:
            fallback_chain.append(provider.name)
        is_first = False

        try:
            print(f"[AI] Provider: {provider.name}")
            response = provider.generate_answer(message, context)
            if response and response.strip():
                print(f"[AI] {provider.name} success")
                return GenerationResult(
                    response=response.strip(),
                    provider=provider.name,
                    fallback_used=len(fallback_chain) > 0,
                    fallback_chain=fallback_chain,
                )
            last_error = Exception(f"Provider {provider.name} returned empty response")
        except Exception as err:
            last_error = err
            print(f"[AI] {provider.name} failed, trying next provider")
            if not is_fallback_error(err):
                raise err

    if isinstance(last_error, Exception):
        raise last_error
    raise Exception("All AI providers failed to generate a response.")


async def stream_with_fallback(
    message: str, context: ProviderContext | None = None
):
    context = context or ProviderContext()
    providers = get_provider_order()

    if not providers:
        raise Exception("No AI provider is configured.")

    last_error: Exception | None = None
    fallback_chain: List[str] = []
    is_first = True

    for provider in providers:
        if not is_first:
            fallback_chain.append(provider.name)
        is_first = False

        has_yielded = False
        try:
            print(f"[AI] Provider: {provider.name}")
            async for chunk in provider.generate_answer_stream(message, context):
                has_yielded = True
                yield StreamChunk(
                    chunk=chunk,
                    provider=provider.name,
                    fallback_used=len(fallback_chain) > 0,
                    fallback_chain=list(fallback_chain),
                )
            if has_yielded:
                print(f"[AI] {provider.name} stream success")
                return
            last_error = Exception(f"Provider {provider.name} returned empty stream")
        except Exception as err:
            last_error = err
            print(f"[AI] {provider.name} stream failed, trying next provider")
            if has_yielded:
                raise err
            if not is_fallback_error(err):
                raise err

    if isinstance(last_error, Exception):
        raise last_error
    raise Exception("All AI providers failed to stream a response.")
