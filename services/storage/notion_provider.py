"""Notion-backed implementation of the provider contract."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from database.local_database import connect, queue_storage_job, storage_outbox_status

from .base import StorageProvider, StorageProviderError
from .credentials import get_token
from .notion_client import NotionClient
from .notion_mapper import build_mapping, page_to_trade, trade_to_properties
from .settings import notion_config, set_setting


class NotionStorageProvider(StorageProvider):
    name = "notion"

    def __init__(self):
        self.config = notion_config()
        self.client = NotionClient(get_token() or "")
        self._schema: dict[str, Any] | None = None
        self._mapping: dict[str, str] | None = None

    def status(self) -> dict[str, Any]:
        config = notion_config()
        connected = bool(get_token())
        configured = bool(config.get("databaseId") and config.get("dataSourceId"))
        return {
            "provider": self.name,
            "state": "CONNECTED" if connected and configured else ("CONFIGURATION_REQUIRED" if connected else "NOT_CONNECTED"),
            "databaseName": config.get("databaseName"),
            "dataSourceName": config.get("dataSourceName"),
            "lastSyncedAt": config.get("lastSyncedAt"),
            "tokenStored": connected,
            "token": None,
            "outbox": storage_outbox_status(),
        }

    def _configuration(self) -> tuple[str, str]:
        database_id = self.config.get("databaseId")
        data_source_id = self.config.get("dataSourceId")
        if not database_id or not data_source_id:
            raise StorageProviderError("Choose a Notion trading database and data source first.")
        return str(database_id), str(data_source_id)

    def _mapping_for_schema(self) -> tuple[dict[str, Any], dict[str, str]]:
        _, data_source_id = self._configuration()
        if self._schema is None:
            self._schema = self.client.retrieve_data_source(data_source_id).get("properties") or {}
        if self._mapping is None:
            self._mapping = build_mapping(self._schema)
        if "id" not in self._mapping:
            raise StorageProviderError("Map a Notion property to VF Trade ID before enabling Notion storage.")
        return self._schema, self._mapping

    def _pages(self) -> list[dict[str, Any]]:
        _, data_source_id = self._configuration()
        pages = self.client.query_data_source(data_source_id)
        set_setting("notion_last_synced_at", datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"))
        return pages

    def create_trade(self, trade: dict[str, Any], queue_on_failure: bool = True) -> dict[str, Any]:
        try:
            schema, mapping = self._mapping_for_schema()
            existing = self._find_page(str(trade.get("id")))
            properties = trade_to_properties(trade, schema, mapping)
            if existing:
                page = self.client.update_page(existing["id"], properties)
            else:
                _, data_source_id = self._configuration()
                page = self.client.create_page(data_source_id, properties)
        except (StorageProviderError, ValueError) as error:
            if not queue_on_failure:
                raise StorageProviderError(str(error)) from None
            try:
                queue_storage_job(str(trade.get("id") or ""), "UPSERT", trade, str(error))
            except ValueError as queue_error:
                raise StorageProviderError(str(queue_error)) from None
            raise StorageProviderError("Notion is unavailable. This trade is waiting to be saved; retry from Storage settings.") from None
        normalized = page_to_trade(page, mapping)
        normalized.update({key: value for key, value in trade.items() if key not in {"screenshot"} and value is not None})
        normalized["notionPageId"] = page.get("id")
        self._cache(normalized)
        return normalized

    def get_trade(self, trade_id: str) -> dict[str, Any] | None:
        schema, mapping = self._mapping_for_schema()
        page = self._find_page(trade_id)
        if not page:
            return None
        return page_to_trade(page, mapping)

    def update_trade(self, trade_id: str, trade: dict[str, Any]) -> dict[str, Any]:
        return self.create_trade({**trade, "id": trade_id})

    def delete_trade(self, trade_id: str) -> bool:
        page = self._find_page(trade_id)
        if not page:
            return False
        self.client.archive_page(page["id"])
        return True

    def list_trades(self, limit: int = 100, offset: int = 0) -> list[dict[str, Any]]:
        _, mapping = self._mapping_for_schema()
        pages = self._pages()
        trades = []
        for page in pages[offset: offset + max(1, min(int(limit), 1000))]:
            try:
                trades.append(page_to_trade(page, mapping))
            except StorageProviderError:
                continue
        return trades

    def search_trades(self, query: str, limit: int = 50) -> list[dict[str, Any]]:
        term = " ".join(str(query or "").lower().split())
        return [trade for trade in self.list_trades(limit=1000) if term in json.dumps(trade, ensure_ascii=False).lower()][:max(1, min(int(limit), 200))]

    def get_similar_trades(self, trade_id: str, limit: int = 10) -> list[dict[str, Any]]:
        source = self.get_trade(trade_id)
        if not source:
            return []
        scored = []
        for trade in self.list_trades(limit=1000):
            if trade.get("id") == trade_id:
                continue
            score = sum(weight for field, weight in (("symbol", 5), ("timeframe", 3), ("direction", 2), ("result", 1), ("setup", 3), ("session", 1)) if source.get(field) and source.get(field) == trade.get(field))
            if score:
                scored.append((score, trade))
        scored.sort(key=lambda pair: (-pair[0], pair[1].get("timestamp") or ""))
        return [trade for _, trade in scored[:max(1, min(int(limit), 50))]]

    def get_statistics(self) -> dict[str, Any]:
        trades = self.list_trades(limit=1000)
        reviewed = [trade for trade in trades if trade.get("result") in {"WIN", "LOSS", "BE"}]
        wins = sum(trade.get("result") == "WIN" for trade in reviewed)
        losses = sum(trade.get("result") == "LOSS" for trade in reviewed)
        actual_r = []
        for trade in reviewed:
            entry, stop, exit_price = trade.get("entry"), trade.get("stopLoss"), trade.get("exitPrice")
            if not all(isinstance(value, (int, float)) for value in (entry, stop, exit_price)):
                continue
            risk = abs(entry - stop)
            if risk:
                profit = exit_price - entry if trade.get("direction") == "LONG" else entry - exit_price
                actual_r.append(profit / risk)

        def counts(values):
            tally = {}
            for value in values:
                if isinstance(value, str) and value.strip():
                    tally[value.strip()] = tally.get(value.strip(), 0) + 1
            return [{"value": value, "count": count} for value, count in sorted(tally.items(), key=lambda item: (-item[1], item[0]))][:5]

        return {
            "totalTrades": len(trades), "reviewedTrades": len(reviewed),
            "outcomes": {"wins": wins, "losses": losses, "breakEven": len(reviewed) - wins - losses},
            "actualR": {"count": len(actual_r), "total": round(sum(actual_r), 6), "average": round(sum(actual_r) / len(actual_r), 6) if actual_r else None},
            "topSetups": counts([trade.get("setup") for trade in reviewed]),
            "topEmotions": counts([emotion for trade in reviewed for emotion in (trade.get("emotions") or [])]),
            "topExecutionTags": counts([trade.get("executionTag") for trade in reviewed]),
            "sampleWarning": "Capture and review at least 10 trades before treating recurring patterns as reliable." if len(reviewed) < 10 else None,
            "source": "Notion",
        }

    def _find_page(self, trade_id: str) -> dict[str, Any] | None:
        if not trade_id:
            return None
        _, mapping = self._mapping_for_schema()
        for page in self._pages():
            try:
                trade = page_to_trade(page, mapping)
            except StorageProviderError:
                continue
            if trade.get("id") == trade_id:
                return page
        return None

    def _cache(self, trade: dict[str, Any]) -> None:
        metadata = {key: trade.get(key) for key in ("id", "symbol", "timestamp", "result", "actualR", "setup", "session", "updatedAt")}
        with connect() as connection:
            connection.execute("insert or replace into provider_cache(trade_id,provider,provider_record_id,metadata_json,touched_at) values(?,?,?,?,strftime('%Y-%m-%dT%H:%M:%fZ','now'))", (trade.get("id"), self.name, trade.get("notionPageId"), json.dumps(metadata)))
            connection.execute("delete from provider_cache where provider = ? and trade_id not in (select trade_id from provider_cache where provider = ? order by touched_at desc limit 250)", (self.name, self.name))
