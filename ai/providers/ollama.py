"""Ollama provider for VantageForge AI."""

from __future__ import annotations

import json
import os
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


OLLAMA_BASE_URL = os.environ.get(
    "VANTAGEFORGE_OLLAMA_URL",
    "http://127.0.0.1:11434",
)

DEFAULT_MODEL = os.environ.get(
    "VANTAGEFORGE_AI_MODEL",
    "qwen2.5:0.5b-instruct",
)


class OllamaProvider(AIProvider):
    """VantageForge provider for a local Ollama installation."""

    provider_name = "ollama"

    def __init__(self, model: str | None = None) -> None:
        self.model = model or DEFAULT_MODEL

    def _request(
        self,
        path: str,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        body = None
        headers: dict[str, str] = {}
        method = "GET"

        if payload is not None:
            body = json.dumps(payload).encode("utf-8")
            headers["Content-Type"] = "application/json"
            method = "POST"

        request = urllib.request.Request(
            f"{OLLAMA_BASE_URL}{path}",
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
                    "Ollama rejected the request."
                ) from error

            raise AIProviderUnavailableError(
                f"Ollama returned HTTP {error.code}."
            ) from error

        except (
            urllib.error.URLError,
            TimeoutError,
            json.JSONDecodeError,
        ) as error:
            raise AIProviderUnavailableError(
                "Ollama is unavailable. Start Ollama and make sure "
                "the selected local model is installed."
            ) from error

    def health(self) -> dict[str, Any]:
        try:
            result = self._request("/api/tags")
        except AIProviderUnavailableError:
            return {
                "available": False,
                "provider": self.provider_name,
                "model": self.model,
                "models": [],
                "modelReady": False,
            }

        models = [
            item.get("name")
            for item in result.get("models", [])
            if isinstance(item, dict) and item.get("name")
        ]

        return {
            "available": True,
            "provider": self.provider_name,
            "model": self.model,
            "models": models,
            "modelReady": self.model in models,
        }

    def list_models(self) -> list[str]:
        result = self._request("/api/tags")

        return [
            item.get("name")
            for item in result.get("models", [])
            if isinstance(item, dict) and item.get("name")
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

        options: dict[str, Any] = {}

        if max_tokens is not None:
            options["num_predict"] = max_tokens

        if temperature is not None:
            options["temperature"] = temperature

        payload: dict[str, Any] = {
            "model": selected_model,
            "stream": False,
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
            payload["format"] = "json"

        if options:
            payload["options"] = options

        result = self._request(
            "/api/chat",
            payload,
        )

        message = result.get("message")

        if not isinstance(message, dict):
            raise AIProviderResponseError(
                "Ollama returned an invalid response."
            )

        content = message.get("content")

        if not isinstance(content, str) or not content.strip():
            raise AIProviderResponseError(
                "Ollama returned an empty response."
            )

        usage = {
            key: result.get(key)
            for key in (
                "prompt_eval_count",
                "prompt_eval_duration",
                "eval_count",
                "eval_duration",
            )
            if result.get(key) is not None
        }

        return AIResponse(
            content=content.strip(),
            provider=self.provider_name,
            model=selected_model,
            usage=usage or None,
        )