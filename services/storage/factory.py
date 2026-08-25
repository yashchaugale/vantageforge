"""Provider selection. Local is always the safe default."""

from __future__ import annotations

from typing import Any

from .base import StorageProvider, StorageProviderError
from .local_provider import LocalStorageProvider
from .notion_provider import NotionStorageProvider
from .credentials import get_token
from .settings import notion_config, provider_name


def get_storage_provider() -> StorageProvider:
    if provider_name() == "notion":
        return NotionStorageProvider()
    return LocalStorageProvider()


def provider_status() -> dict[str, Any]:
    name = provider_name()
    if name == "notion":
        try:
            return get_storage_provider().status()
        except StorageProviderError as error:
            config = notion_config()
            return {"provider": "notion", "state": "AUTHENTICATION_FAILED", "message": str(error), **config}
    return {**LocalStorageProvider().status(), "notionConnected": bool(get_token())}
