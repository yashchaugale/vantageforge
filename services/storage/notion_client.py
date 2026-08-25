"""Minimal server-side Notion API client.

The client deliberately uses urllib so the integration adds no browser or heavy
runtime dependency. Authorization headers and token values never enter errors.
"""

from __future__ import annotations

import json
import random
import time
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from .base import StorageProviderError

NOTION_API_BASE = "https://api.notion.com/v1"
NOTION_VERSION = "2026-03-11"


class NotionClient:
    def __init__(self, token: str, timeout: float = 15.0):
        if not token:
            raise StorageProviderError("Notion is not connected.")
        self._token = token
        self.timeout = timeout

    def _request(self, method: str, path: str, body: dict[str, Any] | None = None) -> dict[str, Any]:
        payload = None if body is None else json.dumps(body).encode("utf-8")
        request = Request(
            f"{NOTION_API_BASE}{path}",
            data=payload,
            method=method,
            headers={
                "Authorization": f"Bearer {self._token}",
                "Notion-Version": NOTION_VERSION,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        )
        for attempt in range(3):
            try:
                with urlopen(request, timeout=self.timeout) as response:
                    raw = response.read().decode("utf-8")
                    return json.loads(raw) if raw else {}
            except HTTPError as error:
                if error.code == 429 and attempt < 2:
                    time.sleep((2**attempt) + random.random())
                    continue
                safe_messages = {
                    401: "The Notion connection token is invalid or expired.",
                    403: "VantageForge is connected to Notion, but access to this resource was denied.",
                    404: "The selected Notion resource could not be found.",
                    409: "Notion rejected this update because the resource changed. Try again.",
                    429: "Notion is rate-limiting requests. Try again in a moment.",
                }
                raise StorageProviderError(safe_messages.get(error.code, "Notion is temporarily unavailable.")) from None
            except (URLError, TimeoutError):
                raise StorageProviderError("Notion is unavailable. Check your connection and try again.") from None
            except (json.JSONDecodeError, OSError):
                raise StorageProviderError("Notion returned an unreadable response.") from None
        raise StorageProviderError("Notion is temporarily unavailable.")

    def validate(self) -> dict[str, Any]:
        return self._request("GET", "/users/me")

    def search_databases(self, query: str = "") -> list[dict[str, Any]]:
        body: dict[str, Any] = {"filter": {"property": "object", "value": "data_source"}, "page_size": 100}
        if query.strip():
            body["query"] = query.strip()
        results = self._paginate("POST", "/search", body, "results")
        databases: list[dict[str, Any]] = []
        seen: set[str] = set()
        for result in results:
            if result.get("object") == "database":
                database_id = result.get("id")
            else:
                parent = result.get("parent") or {}
                database_id = parent.get("database_id")
            if not database_id or database_id in seen:
                continue
            try:
                database = self.retrieve_database(database_id)
            except StorageProviderError:
                continue
            seen.add(database_id)
            databases.append(database)
        return databases

    def retrieve_database(self, database_id: str) -> dict[str, Any]:
        return self._request("GET", f"/databases/{quote(database_id, safe='')}")

    def retrieve_data_source(self, data_source_id: str) -> dict[str, Any]:
        return self._request("GET", f"/data_sources/{quote(data_source_id, safe='')}")

    def query_data_source(self, data_source_id: str, page_size: int = 100) -> list[dict[str, Any]]:
        return self._paginate("POST", f"/data_sources/{quote(data_source_id, safe='')}/query", {"page_size": min(page_size, 100)}, "results")

    def create_page(self, data_source_id: str, properties: dict[str, Any]) -> dict[str, Any]:
        return self._request("POST", "/pages", {"parent": {"data_source_id": data_source_id}, "properties": properties})

    def update_page(self, page_id: str, properties: dict[str, Any]) -> dict[str, Any]:
        return self._request("PATCH", f"/pages/{quote(page_id, safe='')}", {"properties": properties})

    def archive_page(self, page_id: str) -> dict[str, Any]:
        return self._request("PATCH", f"/pages/{quote(page_id, safe='')}", {"in_trash": True})

    def update_data_source_properties(self, data_source_id: str, properties: dict[str, Any]) -> dict[str, Any]:
        return self._request("PATCH", f"/data_sources/{quote(data_source_id, safe='')}", {"properties": properties})

    def _paginate(self, method: str, path: str, body: dict[str, Any], key: str) -> list[dict[str, Any]]:
        results: list[dict[str, Any]] = []
        cursor: str | None = None
        while True:
            request_body = {**body}
            if cursor:
                request_body["start_cursor"] = cursor
            page = self._request(method, path, request_body)
            results.extend(page.get(key, []))
            if not page.get("has_more") or not page.get("next_cursor"):
                return results
            cursor = page["next_cursor"]
