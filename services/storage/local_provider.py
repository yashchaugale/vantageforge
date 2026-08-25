"""Adapter around the existing SQLite repository.

Keeping this adapter thin means local behavior and existing data remain unchanged.
"""

from __future__ import annotations

from typing import Any

from database import local_database as db

from .base import StorageProvider


class LocalStorageProvider(StorageProvider):
    name = "local"

    def status(self) -> dict[str, Any]:
        return {"provider": self.name, "state": "CONNECTED", **db.storage_stats()}

    def create_trade(self, trade: dict[str, Any]) -> dict[str, Any]:
        return db.upsert_trade(trade)

    def get_trade(self, trade_id: str) -> dict[str, Any] | None:
        return db.get_trade(trade_id)

    def update_trade(self, trade_id: str, trade: dict[str, Any]) -> dict[str, Any]:
        payload = {**trade, "id": trade_id}
        return db.upsert_trade(payload)

    def delete_trade(self, trade_id: str) -> bool:
        return db.delete_trade(trade_id)

    def list_trades(self, limit: int = 100, offset: int = 0) -> list[dict[str, Any]]:
        return db.list_trades(limit=limit, offset=offset)

    def search_trades(self, query: str, limit: int = 50) -> list[dict[str, Any]]:
        return db.search_trades(query, limit=limit)

    def get_similar_trades(self, trade_id: str, limit: int = 10) -> list[dict[str, Any]]:
        return db.similar_trades(trade_id, limit=limit)

    def get_statistics(self) -> dict[str, Any]:
        return db.journal_analytics()
