"""OpenAI-compatible provider for VantageForge AI."""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any

from .base import (
    AIProvider,
    AIProviderAuthenticationError,
    AIProviderResponseError,
    AIProviderUnavailableError,
    AIResponse,
)


class OpenAICompatibleProvider(AIProvider):
    """Provider for APIs implementing the OpenAI chat-completions contract."""

    provider_name = "openai-compatible"

    def __init__(
        self,
        *,
        api_key: str,
        base_url: str,
        model: str,
        provider_name: str = "openai-compatible",
    ) -> None:
        if not api_key.strip():
            raise ValueError("An API key is required.")

        if not base_url.strip():
            raise ValueError("A provider base URL is required.")

        if not model.strip():
            raise ValueError("A model name is required.")

        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.provider_name = provider_name

    def _request(
        self,
        path: str,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        body = None
        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }
        method = "GET"

        if payload is not None:
            body = json.dumps(payload).encode("utf-8")
            headers["Content-Type"] = "application/json"
            method = "POST"

        request = urllib.request.Request(
            f"{self.base_url}{path}",
            data=body,
            headers=headers,
            method=method,
        )

        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                return json.loads(
                    response.read().decode("utf-8")
                )

        except urllib.error.HTTPError as error:
            if error.code in {401, 403}:
                raise AIProviderAuthenticationError(
                    f"{self.provider_name} rejected the API key."
                ) from error

            try:
                detail = error.read().decode("utf-8")
            except Exception:
                detail = ""

            raise AIProviderUnavailableError(
                f"{self.provider_name} returned HTTP {error.code}."
                + (f" {detail[:300]}" if detail else "")
            ) from error

        except (
            urllib.error.URLError,
            TimeoutError,
            json.JSONDecodeError,
        ) as error:
            raise AIProviderUnavailableError(
                f"{self.provider_name} could not be reached."
            ) from error

    def health(self) -> dict[str, Any]:
        try:
            models = self.list_models()
        except AIProviderAuthenticationError:
            return {
                "available": False,
                "authenticated": False,
                "provider": self.provider_name,
                "model": self.model,
                "models": [],
                "modelReady": False,
            }
        except AIProviderUnavailableError:
            return {
                "available": False,
                "authenticated": None,
                "provider": self.provider_name,
                "model": self.model,
                "models": [],
                "modelReady": False,
            }

        return {
            "available": True,
            "authenticated": True,
            "provider": self.provider_name,
            "model": self.model,
            "models": models,
            "modelReady": self.model in models,
        }

    def list_models(self) -> list[str]:
        result = self._request("/models")

        models = result.get("data", [])

        if not isinstance(models, list):
            raise AIProviderResponseError(
                f"{self.provider_name} returned an invalid model list."
            )

        return [
            item.get("id")
            for item in models
            if isinstance(item, dict) and item.get("id")
        ]

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
        selected_model = model or self.model

        payload: dict[str, Any] = {
            "model": selected_model,
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
        }

        if response_format == "json":
            payload["response_format"] = {
                "type": "json_object",
            }

        if max_tokens is not None:
            payload["max_tokens"] = max_tokens

        if temperature is not None:
            payload["temperature"] = temperature

        result = self._request(
            "/chat/completions",
            payload,
        )

        choices = result.get("choices")

        if not isinstance(choices, list) or not choices:
            raise AIProviderResponseError(
                f"{self.provider_name} returned no choices."
            )

        message = choices[0].get("message")

        if not isinstance(message, dict):
            raise AIProviderResponseError(
                f"{self.provider_name} returned an invalid message."
            )

        content = message.get("content")

        if not isinstance(content, str) or not content.strip():
            raise AIProviderResponseError(
                f"{self.provider_name} returned an empty response."
            )

        usage = result.get("usage")

        return AIResponse(
            content=content.strip(),
            provider=self.provider_name,
            model=selected_model,
            usage=usage if isinstance(usage, dict) else None,
        )