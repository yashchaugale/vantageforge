"""Google Gemini provider for You Can't Trade AI."""

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


class GeminiProvider(AIProvider):
    """Provider for Google's Gemini generateContent REST API."""

    provider_name = "gemini"

    DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        base_url: str = DEFAULT_BASE_URL,
    ) -> None:
        if not api_key.strip():
            raise ValueError("A Gemini API key is required.")

        if not model.strip():
            raise ValueError("A Gemini model name is required.")

        if not base_url.strip():
            raise ValueError("A Gemini API base URL is required.")

        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")

    def _request(
        self,
        path: str,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        body = None
        headers = {
            "x-goog-api-key": self.api_key,
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
            if error.code in {400, 401, 403}:
                raise AIProviderAuthenticationError(
                    "Gemini rejected the supplied API key or request."
                ) from error

            try:
                detail = error.read().decode("utf-8")
            except Exception:
                detail = ""

            raise AIProviderUnavailableError(
                f"Gemini returned HTTP {error.code}."
                + (f" {detail[:300]}" if detail else "")
            ) from error

        except urllib.error.URLError as error:
            raise AIProviderUnavailableError(
                "Gemini could not be reached."
            ) from error

        except TimeoutError as error:
            raise AIProviderUnavailableError(
                "Gemini request timed out."
            ) from error

        except json.JSONDecodeError as error:
            raise AIProviderResponseError(
                "Gemini returned invalid JSON."
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
        except AIProviderResponseError:
            return {
                "available": False,
                "authenticated": True,
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

        models = result.get("models", [])

        if not isinstance(models, list):
            raise AIProviderResponseError(
                "Gemini returned an invalid model list."
            )

        return [
            item.get("name", "").removeprefix("models/")
            for item in models
            if isinstance(item, dict)
            and isinstance(item.get("name"), str)
            and item.get("name")
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

        generation_config: dict[str, Any] = {}

        if response_format == "json":
            generation_config["responseMimeType"] = "application/json"

        if max_tokens is not None:
            generation_config["maxOutputTokens"] = max_tokens

        if temperature is not None:
            generation_config["temperature"] = temperature

        if selected_model.startswith("gemini-3."):
            generation_config["thinkingConfig"] = {
                "thinkingLevel": "minimal",
            }

        payload: dict[str, Any] = {
            "systemInstruction": {
                "parts": [
                    {
                        "text": system_prompt,
                    }
                ]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": user_prompt,
                        }
                    ],
                }
            ],
        }

        if generation_config:
            payload["generationConfig"] = generation_config

        result = self._request(
            f"/models/{selected_model}:generateContent",
            payload,
        )

        candidates = result.get("candidates")

        if not isinstance(candidates, list) or not candidates:
            raise AIProviderResponseError(
                "Gemini returned no candidates."
            )

        content = candidates[0].get("content")

        if not isinstance(content, dict):
            raise AIProviderResponseError(
                "Gemini returned an invalid content object."
            )

        parts = content.get("parts")

        if not isinstance(parts, list):
            raise AIProviderResponseError(
                "Gemini returned invalid content parts."
            )

        text_parts = [
            part.get("text")
            for part in parts
            if isinstance(part, dict)
            and isinstance(part.get("text"), str)
        ]

        text = "".join(text_parts).strip()

        if not text:
            raise AIProviderResponseError(
                "Gemini returned an empty response."
            )

        usage = result.get("usageMetadata")

        return AIResponse(
            content=text,
            provider=self.provider_name,
            model=selected_model,
            usage=usage if isinstance(usage, dict) else None,
        )