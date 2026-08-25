"""Deterministic Notion property mapping and Trade normalization."""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any

from .base import StorageProviderError

FIELD_ALIASES = {
    "id": ["vf trade id", "vantageforge trade id", "trade id"],
    "symbol": ["symbol", "ticker", "asset", "pair"],
    "timeframe": ["timeframe", "time frame"],
    "exchange": ["exchange", "venue"],
    "direction": ["direction", "side"],
    "entry": ["entry", "entry price"],
    "stopLoss": ["stop loss", "sl", "stop"],
    "takeProfit": ["take profit", "tp", "target"],
    "exitPrice": ["exit", "exit price"],
    "result": ["result", "outcome"],
    "plannedR": ["planned r", "plan r"],
    "actualR": ["actual r", "r", "result r"],
    "timestamp": ["captured at", "captured", "date"],
    "updatedAt": ["vantageforge updated at", "updated at"],
    "setup": ["setup", "strategy", "model"],
    "session": ["session", "trading session"],
    "planAdherence": ["plan adherence", "plan"],
    "executionTag": ["execution", "execution tag"],
    "notes": ["notes", "journal", "comment"],
    "emotions": ["emotions", "emotion"],
    "source": ["source"],
    "url": ["vantageforge url", "source url", "url"],
    "screenshotPath": ["chart screenshot", "screenshot", "attachment", "attachments"],
    "status": ["status"],
}


def normalize_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").lower()).strip()


def property_type(property_value: dict[str, Any]) -> str:
    return str(property_value.get("type") or "").lower()


def build_mapping(schema: dict[str, Any]) -> dict[str, str]:
    names = {normalize_name(name): name for name in schema}
    mapping: dict[str, str] = {}
    for field, aliases in FIELD_ALIASES.items():
        for alias in aliases:
            if normalize_name(alias) in names:
                mapping[field] = names[normalize_name(alias)]
                break
    return mapping


def _text(value: Any) -> str:
    return "" if value is None else str(value)


def _property_value(field: str, value: Any, schema_value: dict[str, Any]) -> dict[str, Any] | None:
    if value is None or value == "":
        return None
    kind = property_type(schema_value)
    if kind == "title":
        return {"title": [{"type": "text", "text": {"content": _text(value)[:2000]}}]}
    if kind == "rich_text":
        return {"rich_text": [{"type": "text", "text": {"content": _text(value)[:2000]}}]}
    if kind == "number":
        try:
            return {"number": float(value)}
        except (TypeError, ValueError):
            return None
    if kind == "select":
        return {"select": {"name": _text(value)[:100]}}
    if kind == "multi_select":
        values = value if isinstance(value, list) else [value]
        return {"multi_select": [{"name": _text(item)[:100]} for item in values if _text(item).strip()]}
    if kind == "date":
        return {"date": {"start": _text(value)}}
    if kind == "url":
        return {"url": _text(value)}
    if kind == "checkbox":
        return {"checkbox": bool(value)}
    if kind == "files" and isinstance(value, dict) and value.get("id"):
        return {"files": [{"type": "file_upload", "file_upload": {"id": value["id"]}, "name": value.get("name") or "vantageforge-chart.png"}]}
    return None


def trade_to_properties(trade: dict[str, Any], schema: dict[str, Any], mapping: dict[str, str]) -> dict[str, Any]:
    values = {
        "id": trade.get("id"), "symbol": trade.get("symbol"), "timeframe": trade.get("timeframe"),
        "exchange": trade.get("exchange"), "direction": trade.get("direction"), "entry": trade.get("entry"),
        "stopLoss": trade.get("stopLoss"), "takeProfit": trade.get("takeProfit"), "exitPrice": trade.get("exitPrice"),
        "result": trade.get("result"), "plannedR": trade.get("plannedR"), "actualR": trade.get("actualR"),
        "timestamp": trade.get("timestamp"), "updatedAt": trade.get("updatedAt"), "setup": trade.get("setup"),
        "session": trade.get("session"), "planAdherence": trade.get("planAdherence"), "executionTag": trade.get("executionTag"),
        "notes": trade.get("notes"), "emotions": trade.get("emotions"), "source": trade.get("source"),
        "url": trade.get("url"), "status": trade.get("status"),
    }
    output: dict[str, Any] = {}
    for field, notion_name in mapping.items():
        converted = _property_value(field, values.get(field), schema.get(notion_name, {}))
        if converted is not None:
            output[notion_name] = converted
    # Notion requires a title property on every data source. It is a display
    # label, not synchronization identity; VF Trade ID remains the identity.
    for notion_name, definition in schema.items():
        if property_type(definition) == "title" and notion_name not in output:
            label = f"{trade.get('symbol') or 'Trade'} · {trade.get('id') or 'VantageForge'}"
            output[notion_name] = _property_value("title", label, definition) or {"title": []}
    return output


def _read_property(value: dict[str, Any]) -> Any:
    kind = value.get("type")
    content = value.get(kind, {}) if kind else {}
    if kind in {"title", "rich_text"}:
        return "".join(item.get("plain_text") or item.get("text", {}).get("content", "") for item in content).strip()
    if kind in {"number", "url", "checkbox"}:
        return content
    if kind == "select":
        return content.get("name") if content else None
    if kind == "multi_select":
        return [item.get("name") for item in content]
    if kind == "date":
        return content.get("start") if content else None
    if kind == "files":
        files = content or []
        for item in files:
            file = item.get("file") or item.get("external") or {}
            if file.get("url"):
                return file["url"]
        return None
    return None


def page_to_trade(page: dict[str, Any], mapping: dict[str, str]) -> dict[str, Any]:
    properties = page.get("properties") or {}
    reverse = {name: field for field, name in mapping.items()}
    trade: dict[str, Any] = {"id": page.get("id"), "source": "NOTION", "status": "CAPTURED", "emotions": []}
    for name, value in properties.items():
        field = reverse.get(name)
        if field:
            trade[field] = _read_property(value)
    if not trade.get("id") or not mapping.get("id"):
        raise StorageProviderError("The Notion data source needs a VF Trade ID field before it can be used.")
    trade["id"] = _read_property(properties.get(mapping["id"], {}))
    trade["timestamp"] = trade.get("timestamp") or page.get("created_time")
    trade["updatedAt"] = trade.get("updatedAt") or page.get("last_edited_time")
    trade["notionPageId"] = page.get("id")
    trade["screenshot"] = trade.get("screenshotPath")
    trade["screenshotPath"] = None
    return trade


def schema_summary(data_source: dict[str, Any]) -> dict[str, Any]:
    schema = data_source.get("properties") or {}
    return {"name": data_source.get("title", [{}])[0].get("plain_text", "") if data_source.get("title") else "", "fields": [{"name": name, "type": property_type(value)} for name, value in schema.items()]}
