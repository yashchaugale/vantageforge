"""Server-only Notion credential handling.

The browser never receives the token. If keyring cannot be imported or used, the
token is held only for this server process and is intentionally not persisted.
"""

from __future__ import annotations

import os

SERVICE_NAME = "vantageforge"
ACCOUNT_NAME = "notion-connection-token"
_session_token: str | None = None


def _keyring():
    try:
        import keyring  # type: ignore
        return keyring
    except ImportError:
        return None


def store_token(token: str) -> dict[str, bool]:
    global _session_token
    cleaned = str(token or "").strip()
    if not cleaned:
        raise ValueError("A Notion connection token is required.")
    keyring = _keyring()
    if keyring is not None:
        try:
            keyring.set_password(SERVICE_NAME, ACCOUNT_NAME, cleaned)
            _session_token = None
            return {"persistent": True, "sessionOnly": False}
        except Exception:
            pass
    _session_token = cleaned
    return {"persistent": False, "sessionOnly": True}


def get_token() -> str | None:
    if _session_token:
        return _session_token
    keyring = _keyring()
    if keyring is None:
        return None
    try:
        return keyring.get_password(SERVICE_NAME, ACCOUNT_NAME)
    except Exception:
        return None


def clear_token() -> None:
    global _session_token
    _session_token = None
    keyring = _keyring()
    if keyring is not None:
        try:
            keyring.delete_password(SERVICE_NAME, ACCOUNT_NAME)
        except Exception:
            pass
