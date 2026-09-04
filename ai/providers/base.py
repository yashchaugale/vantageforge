"""Provider-neutral interface for VantageForge AI."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class AIResponse:
    """Normalized response returned by every AI provider."""

    content: str
    provider: str
    model: str
    usage: dict[str, Any] | None = None


class AIProviderError(RuntimeError):
    """Base error for provider failures."""


class AIProviderUnavailableError(AIProviderError):
    """The configured provider cannot currently be reached."""


class AIProviderAuthenticationError(AIProviderError):
    """The configured provider rejected the supplied credentials."""


class AIProviderResponseError(AIProviderError):
    """The provider returned an unusable response."""


class AIProvider(ABC):
    """Common contract used by all VantageForge AI providers."""

    provider_name: str

    @abstractmethod
    def health(self) -> dict[str, Any]:
        """Return provider availability and model information."""

    @abstractmethod
    def generate(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        model: str | None = None,
        response_format: str = "json",
        max_tokens: int | None = None,
        temperature: float | None = None,
    ) -> AIResponse:
        """Generate a response using the configured provider."""

    @abstractmethod
    def list_models(self) -> list[str]:
        """Return models available to the provider."""