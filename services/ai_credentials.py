"""Server-only AI API credential handling.

AI credentials never enter extension storage, SQLite, URLs, logs, or API
responses. The OS keyring is used when available; otherwise credentials remain
memory-only for the lifetime of the server process.
"""

from __future__ import annotations

import keyring


SERVICE_NAME = "vantageforge-ai"

_session_credentials: dict[str, str] = {}


def _account_name(provider: str) -> str:
    cleaned = str(provider or "").strip().lower()

    if not cleaned:
        raise ValueError("An AI provider is required.")

    return f"{cleaned}-api-key"


def store_api_key(provider: str, api_key: str) -> dict[str, bool]:
    cleaned = str(api_key or "").strip()

    if not cleaned:
        raise ValueError("An AI API key is required.")

    account = _account_name(provider)

    try:
        keyring.set_password(
            SERVICE_NAME,
            account,
            cleaned,
        )
        _session_credentials.pop(provider, None)

        return {
            "persistent": True,
            "sessionOnly": False,
        }

    except Exception:
        _session_credentials[provider] = cleaned

        return {
            "persistent": False,
            "sessionOnly": True,
        }


def get_api_key(provider: str) -> str | None:
    cleaned_provider = str(provider or "").strip().lower()

    if not cleaned_provider:
        return None

    session_key = _session_credentials.get(cleaned_provider)

    if session_key:
        return session_key

    try:
        return keyring.get_password(
            SERVICE_NAME,
            _account_name(cleaned_provider),
        )
    except Exception:
        return None


def clear_api_key(provider: str) -> None:
    cleaned_provider = str(provider or "").strip().lower()

    if not cleaned_provider:
        return

    _session_credentials.pop(cleaned_provider, None)

    try:
        keyring.delete_password(
            SERVICE_NAME,
            _account_name(cleaned_provider),
        )
    except Exception:
        pass
    