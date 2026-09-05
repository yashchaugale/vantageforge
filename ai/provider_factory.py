"""Factory for configured VantageForge AI providers."""

from __future__ import annotations

from typing import Any

from services.ai_credentials import get_api_key
from services.storage.settings import get_setting

from .providers.base import AIProvider
from .providers.ollama import OllamaProvider
from .providers.openai_compatible import OpenAICompatibleProvider


DEFAULT_OLLAMA_MODEL = "qwen2.5:0.5b-instruct"


def ai_config() -> dict[str, Any]:
    """Return non-secret AI configuration."""

    return {
        "provider": get_setting("ai_provider", "ollama"),
        "model": get_setting("ai_model", DEFAULT_OLLAMA_MODEL),
        "baseUrl": get_setting("ai_base_url", ""),
    }


def get_ai_provider() -> AIProvider:
    """Build the currently configured AI provider."""

    config = ai_config()

    provider = str(config.get("provider") or "ollama").strip().lower()
    model = str(config.get("model") or "").strip()

    if provider == "ollama":
        return OllamaProvider(
            model=model or DEFAULT_OLLAMA_MODEL,
        )

    if provider in {
        "openai",
        "gemini",
        "openrouter",
        "openai-compatible",
    }:
        api_key = get_api_key(provider)

        if not api_key:
            raise ValueError(
                f"No API key is configured for AI provider '{provider}'."
            )

        base_url = str(config.get("baseUrl") or "").strip()

        if not base_url:
            raise ValueError(
                f"No API base URL is configured for AI provider '{provider}'."
            )

        if not model:
            raise ValueError(
                f"No AI model is configured for provider '{provider}'."
            )

        return OpenAICompatibleProvider(
            api_key=api_key,
            base_url=base_url,
            model=model,
            provider_name=provider,
        )

    raise ValueError(
        f"Unsupported AI provider: {provider}"
    )