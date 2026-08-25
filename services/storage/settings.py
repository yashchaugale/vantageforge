"""Non-secret provider settings stored in SQLite."""

from __future__ import annotations

import json
from typing import Any

from database.local_database import connect


def get_setting(key: str, default: Any = None) -> Any:
    with connect() as connection:
        row = connection.execute("select value from app_settings where key = ?", (key,)).fetchone()
    if not row:
        return default
    try:
        return json.loads(row[0])
    except (TypeError, json.JSONDecodeError):
        return row[0]


def set_setting(key: str, value: Any) -> None:
    encoded = json.dumps(value)
    with connect() as connection:
        connection.execute(
            """insert into app_settings(key, value) values (?, ?)
               on conflict(key) do update set value=excluded.value,
               updated_at=strftime('%Y-%m-%dT%H:%M:%fZ', 'now')""",
            (key, encoded),
        )


def provider_name() -> str:
    return str(get_setting("storage_provider", "local")) if get_setting("storage_provider", "local") in {"local", "notion"} else "local"


def notion_config() -> dict[str, Any]:
    return {
        "databaseId": get_setting("notion_database_id"),
        "dataSourceId": get_setting("notion_data_source_id"),
        "databaseName": get_setting("notion_database_name"),
        "dataSourceName": get_setting("notion_data_source_name"),
        "lastSyncedAt": get_setting("notion_last_synced_at"),
    }
