"""Small SQLite repository for the personal VantageForge service."""

from __future__ import annotations

import json
import os
import sqlite3
import base64
import uuid
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("VANTAGEFORGE_DATA_DIR", ROOT / "data"))
DB_PATH = DATA_DIR / "vantageforge.sqlite3"
SCREENSHOT_DIR = DATA_DIR / "screenshots"
SCHEMA_PATH = Path(__file__).resolve().parent / "migrations" / "001_initial.sql"


def connect() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("pragma foreign_keys = on")
    connection.execute("pragma journal_mode = wal")
    return connection


def initialise() -> None:
    with connect() as connection:
        connection.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))


def trade_count() -> int:
    with connect() as connection:
        return int(connection.execute("select count(*) from trades").fetchone()[0])


def storage_stats() -> dict[str, int]:
    total_bytes = sum(
        path.stat().st_size
        for path in DATA_DIR.rglob("*")
        if path.is_file()
    ) if DATA_DIR.exists() else 0
    return {"bytes": total_bytes, "tradeCount": trade_count()}


def _store_screenshot(trade_id: str, screenshot: Any) -> str | None:
    if not isinstance(screenshot, str) or not screenshot.startswith("data:"):
        return None

    header, encoded = screenshot.split(",", 1) if "," in screenshot else ("", "")
    if ";base64" not in header:
        return None

    mime = header[5:].split(";", 1)[0]
    extension = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
    }.get(mime, "bin")
    screenshot_path = SCREENSHOT_DIR / f"{trade_id}.{extension}"
    screenshot_path.write_bytes(base64.b64decode(encoded, validate=True))
    return f"screenshots/{screenshot_path.name}"


def _review_values(payload: dict[str, Any]) -> tuple[Any, ...]:
    emotions = payload.get("emotions", [])
    if not isinstance(emotions, list) or not all(isinstance(item, str) for item in emotions):
        emotions = []

    return (
        payload.get("setup", ""),
        payload.get("session"),
        payload.get("planAdherence"),
        payload.get("executionTag"),
        payload.get("notes", ""),
        json.dumps(emotions),
    )


def upsert_trade(payload: dict[str, Any]) -> dict[str, Any]:
    trade_id = payload.get("id")
    if not isinstance(trade_id, str) or not trade_id.strip():
        raise ValueError("A stable trade id is required.")
    captured_at = payload.get("timestamp")
    updated_at = payload.get("updatedAt") or captured_at
    if not isinstance(captured_at, str) or not isinstance(updated_at, str):
        raise ValueError("Capture and update timestamps are required.")

    screenshot_path = _store_screenshot(trade_id, payload.get("screenshot"))
    if screenshot_path is None:
        screenshot_path = payload.get("screenshotPath")
    if screenshot_path is None:
        with connect() as connection:
            existing = connection.execute(
                "select screenshot_path from trades where id = ?",
                (trade_id,),
            ).fetchone()
        screenshot_path = existing[0] if existing else None

    fields = (
        trade_id,
        int(payload.get("schemaVersion", 3)),
        payload.get("source", "TRADINGVIEW"),
        payload.get("status", "CAPTURED"),
        captured_at,
        updated_at,
        payload.get("symbol", ""),
        payload.get("timeframe", ""),
        payload.get("exchange", ""),
        payload.get("direction"),
        payload.get("entry"),
        payload.get("stopLoss"),
        payload.get("takeProfit"),
        payload.get("chartAnchorTime"),
        payload.get("chartAnchorInterval"),
        payload.get("exitPrice"),
        payload.get("result"),
        payload.get("url", ""),
        screenshot_path,
    )
    with connect() as connection:
        connection.execute(
            """insert into trades (
                id, schema_version, source, status, captured_at, updated_at,
                symbol, timeframe, exchange, direction, entry, stop_loss,
                take_profit, chart_anchor_time, chart_anchor_interval,
                exit_price, result, source_url, screenshot_path
            ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            on conflict(id) do update set
                schema_version=excluded.schema_version,
                status=excluded.status,
                updated_at=excluded.updated_at,
                symbol=excluded.symbol,
                timeframe=excluded.timeframe,
                exchange=excluded.exchange,
                direction=excluded.direction,
                entry=excluded.entry,
                stop_loss=excluded.stop_loss,
                take_profit=excluded.take_profit,
                chart_anchor_time=excluded.chart_anchor_time,
                chart_anchor_interval=excluded.chart_anchor_interval,
                exit_price=excluded.exit_price,
                result=excluded.result,
                source_url=excluded.source_url,
                screenshot_path=excluded.screenshot_path""",
            fields,
        )
        connection.execute(
            """insert into trade_reviews (
                trade_id, setup, session, plan_adherence, execution_tag, notes, emotions_json
            ) values (?, ?, ?, ?, ?, ?, ?)
            on conflict(trade_id) do update set
                setup=excluded.setup,
                session=excluded.session,
                plan_adherence=excluded.plan_adherence,
                execution_tag=excluded.execution_tag,
                notes=excluded.notes,
                emotions_json=excluded.emotions_json,
                reviewed_at=strftime('%Y-%m-%dT%H:%M:%fZ', 'now')""",
            (trade_id, *_review_values(payload)),
        )

    return get_trade(trade_id) or {}


def _row_to_trade(row: sqlite3.Row) -> dict[str, Any]:
    trade = dict(row)
    trade["timestamp"] = trade.pop("captured_at")
    trade["updatedAt"] = trade.pop("updated_at")
    trade["stopLoss"] = trade.pop("stop_loss")
    trade["takeProfit"] = trade.pop("take_profit")
    chart_anchor_time = trade.pop("chart_anchor_time")
    if chart_anchor_time is not None:
        try:
            numeric_chart_time = float(chart_anchor_time)
            chart_anchor_time = int(numeric_chart_time) if numeric_chart_time.is_integer() else numeric_chart_time
        except (TypeError, ValueError):
            chart_anchor_time = None
    trade["chartAnchorTime"] = chart_anchor_time
    trade["chartAnchorInterval"] = trade.pop("chart_anchor_interval")
    trade["exitPrice"] = trade.pop("exit_price")
    trade["url"] = trade.pop("source_url")
    trade["screenshotPath"] = trade.pop("screenshot_path")
    emotions = trade.pop("emotions_json", "[]")
    trade["emotions"] = json.loads(emotions) if emotions else []
    trade["setup"] = trade.pop("setup", "")
    trade["session"] = trade.pop("session", None)
    trade["planAdherence"] = trade.pop("plan_adherence", None)
    trade["executionTag"] = trade.pop("execution_tag", None)
    trade.pop("trade_id", None)
    trade.pop("reviewed_at", None)
    return trade


def similar_trades(trade_id: str, limit: int = 10) -> list[dict[str, Any]]:
    source = get_trade(trade_id)
    if not source:
        return []
    candidates = list_trades(limit=1000)
    scored = []
    for trade in candidates:
        if trade.get("id") == trade_id:
            continue
        score = 0
        for field, weight in (("symbol", 5), ("timeframe", 3), ("direction", 2), ("result", 1), ("setup", 3), ("session", 1)):
            if source.get(field) and source.get(field) == trade.get(field):
                score += weight
        shared_emotions = set(source.get("emotions") or []) & set(trade.get("emotions") or [])
        score += len(shared_emotions)
        if score:
            scored.append((score, trade))
    scored.sort(key=lambda item: (-item[0], item[1].get("timestamp") or ""))
    return [trade for _, trade in scored[:max(1, min(int(limit), 50))]]


def search_trades(query: str, limit: int = 50) -> list[dict[str, Any]]:
    """Search journal text locally without sending records to an external service."""
    term = " ".join(str(query or "").split()).strip()
    if not term:
        return []
    safe_limit = max(1, min(int(limit), 200))
    pattern = f"%{term}%"
    with connect() as connection:
        rows = connection.execute(
            """select t.*, r.setup, r.session, r.plan_adherence,
                      r.execution_tag, r.notes, r.emotions_json, r.reviewed_at
               from trades t left join trade_reviews r on r.trade_id = t.id
               where lower(
                   coalesce(t.symbol, '') || ' ' || coalesce(t.timeframe, '') || ' ' ||
                   coalesce(t.direction, '') || ' ' || coalesce(t.result, '') || ' ' ||
                   coalesce(r.setup, '') || ' ' || coalesce(r.session, '') || ' ' ||
                   coalesce(r.plan_adherence, '') || ' ' || coalesce(r.execution_tag, '') || ' ' ||
                   coalesce(r.notes, '') || ' ' || coalesce(r.emotions_json, '')
               ) like lower(?)
               order by t.captured_at desc limit ?""",
            (pattern, safe_limit),
        ).fetchall()
    return [_row_to_trade(row) for row in rows]


def get_trade(trade_id: str) -> dict[str, Any] | None:
    with connect() as connection:
        row = connection.execute(
            """select t.*, r.setup, r.session, r.plan_adherence,
                      r.execution_tag, r.notes, r.emotions_json, r.reviewed_at
               from trades t left join trade_reviews r on r.trade_id = t.id
               where t.id = ?""",
            (trade_id,),
        ).fetchone()
    return _row_to_trade(row) if row else None


def list_trades(limit: int = 100, offset: int = 0) -> list[dict[str, Any]]:
    safe_limit = max(1, min(int(limit), 1000))
    safe_offset = max(0, int(offset))
    with connect() as connection:
        rows = connection.execute(
            """select t.*, r.setup, r.session, r.plan_adherence,
                      r.execution_tag, r.notes, r.emotions_json, r.reviewed_at
               from trades t left join trade_reviews r on r.trade_id = t.id
               order by t.captured_at desc limit ? offset ?""",
            (safe_limit, safe_offset),
        ).fetchall()
    return [_row_to_trade(row) for row in rows]


def journal_analytics() -> dict[str, Any]:
    trades = list_trades(limit=1000)
    reviewed = [trade for trade in trades if trade.get("result") in {"WIN", "LOSS", "BE"}]

    def counts(values: list[Any]) -> list[dict[str, Any]]:
        tally: dict[str, int] = {}
        for value in values:
            if isinstance(value, str) and value.strip():
                key = value.strip()
                tally[key] = tally.get(key, 0) + 1
        return [
            {"value": value, "count": count}
            for value, count in sorted(tally.items(), key=lambda item: (-item[1], item[0]))
        ]

    actual_r: list[float] = []
    for trade in reviewed:
        entry, stop, exit_price = trade.get("entry"), trade.get("stopLoss"), trade.get("exitPrice")
        if not all(isinstance(value, (int, float)) for value in (entry, stop, exit_price)):
            continue
        risk = abs(entry - stop)
        if risk == 0:
            continue
        profit = exit_price - entry if trade.get("direction") == "LONG" else entry - exit_price
        actual_r.append(profit / risk)

    return {
        "totalTrades": len(trades),
        "reviewedTrades": len(reviewed),
        "outcomes": {
            "wins": sum(trade.get("result") == "WIN" for trade in reviewed),
            "losses": sum(trade.get("result") == "LOSS" for trade in reviewed),
            "breakEven": sum(trade.get("result") == "BE" for trade in reviewed),
        },
        "actualR": {"count": len(actual_r), "total": round(sum(actual_r), 6), "average": round(sum(actual_r) / len(actual_r), 6) if actual_r else None},
        "topSetups": counts([trade.get("setup") for trade in reviewed])[:5],
        "topEmotions": counts([emotion for trade in reviewed for emotion in (trade.get("emotions") or [])])[:5],
        "topExecutionTags": counts([trade.get("executionTag") for trade in reviewed])[:5],
        "sampleWarning": "Capture and review at least 10 trades before treating recurring patterns as reliable." if len(reviewed) < 10 else None,
    }


def list_experiments() -> list[dict[str, Any]]:
    with connect() as connection:
        rows = connection.execute("select * from experiments order by created_at desc").fetchall()
        experiments = []
        for row in rows:
            item = dict(row)
            reviewed_since = connection.execute(
                "select count(*) from trades where result in ('WIN','LOSS','BE') and updated_at >= ?",
                (item["start_date"],),
            ).fetchone()[0]
            item["reviewedCount"] = int(reviewed_since)
            item["progress"] = min(item["sample_target"], int(reviewed_since))
            experiments.append(item)
        return experiments


def create_experiment(payload: dict[str, Any]) -> dict[str, Any]:
    now = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat().replace("+00:00", "Z")
    experiment = {
        "id": str(uuid.uuid4()),
        "title": str(payload.get("title") or payload.get("behavior") or "Untitled experiment").strip(),
        "behavior": str(payload.get("behavior") or "").strip(),
        "hypothesis": str(payload.get("hypothesis") or "").strip(),
        "baseline_metric": str(payload.get("baselineMetric") or "").strip(),
        "target_metric": str(payload.get("targetMetric") or "").strip(),
        "sample_target": max(1, min(int(payload.get("sampleTarget") or 10), 100)),
        "start_date": now,
        "end_date": payload.get("endDate"),
        "status": "ACTIVE",
        "related_pattern_id": payload.get("relatedPatternId"),
        "notes": str(payload.get("notes") or "").strip(),
        "created_at": now,
        "completed_at": None,
    }
    with connect() as connection:
        connection.execute(
            """insert into experiments (id,title,behavior,hypothesis,baseline_metric,target_metric,sample_target,start_date,end_date,status,related_pattern_id,notes,created_at,completed_at)
               values (:id,:title,:behavior,:hypothesis,:baseline_metric,:target_metric,:sample_target,:start_date,:end_date,:status,:related_pattern_id,:notes,:created_at,:completed_at)""",
            experiment,
        )
    return next(item for item in list_experiments() if item["id"] == experiment["id"])


def update_experiment_status(experiment_id: str, status: str) -> dict[str, Any] | None:
    if status not in {"DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"}:
        raise ValueError("Invalid experiment status")
    completed_at = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')" if status == "COMPLETED" else "null"
    with connect() as connection:
        connection.execute(f"update experiments set status = ?, completed_at = {completed_at} where id = ?", (status, experiment_id))
    return next((item for item in list_experiments() if item["id"] == experiment_id), None)


def delete_trade(trade_id: str) -> bool:
    with connect() as connection:
        row = connection.execute("select screenshot_path from trades where id = ?", (trade_id,)).fetchone()
        if not row:
            return False
        connection.execute("delete from ai_insights where source_trade_ids_json like ?", (f"%{trade_id}%",))
        connection.execute("delete from trades where id = ?", (trade_id,))
    screenshot_path = row[0]
    if screenshot_path:
        candidate = (DATA_DIR / screenshot_path).resolve()
        if candidate.parent == SCREENSHOT_DIR.resolve() and candidate.is_file():
            candidate.unlink()
    return True


def save_ai_insight(
    trade_id: str,
    summary: str,
    action: str | None,
    model: str,
    prompt_version: str,
) -> dict[str, Any]:
    insight = {
        "id": str(uuid.uuid4()),
        "insightType": "POST_TRADE_REFLECTION",
        "sourceTradeIds": [trade_id],
        "summary": summary,
        "action": action,
        "model": model,
        "promptVersion": prompt_version,
    }
    with connect() as connection:
        connection.execute(
            """insert into ai_insights (
                id, insight_type, source_trade_ids_json, summary, action,
                model, prompt_version
            ) values (?, ?, ?, ?, ?, ?, ?)""",
            (
                insight["id"],
                insight["insightType"],
                json.dumps(insight["sourceTradeIds"]),
                summary,
                action,
                model,
                prompt_version,
            ),
        )
    return insight


def latest_ai_insight(trade_id: str) -> dict[str, Any] | None:
    with connect() as connection:
        rows = connection.execute(
            """select id, insight_type, source_trade_ids_json, summary,
                      action, model, prompt_version, created_at
               from ai_insights order by created_at desc"""
        ).fetchall()

    for row in rows:
        source_trade_ids = json.loads(row["source_trade_ids_json"] or "[]")
        if trade_id not in source_trade_ids:
            continue
        return {
            "id": row["id"],
            "insightType": row["insight_type"],
            "sourceTradeIds": source_trade_ids,
            "summary": row["summary"],
            "action": row["action"],
            "model": row["model"],
            "promptVersion": row["prompt_version"],
            "createdAt": row["created_at"],
        }

    return None


def queue_storage_job(trade_id: str, operation: str, payload: dict[str, Any], error: str) -> str:
    """Keep a bounded, recoverable Notion retry payload; callers must surface it."""
    now = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat().replace("+00:00", "Z")
    job_id = str(uuid.uuid4())
    with connect() as connection:
        count = connection.execute("select count(*) from storage_outbox").fetchone()[0]
        if count >= 100:
            raise ValueError("The Notion retry queue is full. Export the pending trades before trying again.")
        connection.execute(
            """insert into storage_outbox(job_id,trade_id,operation,payload_json,attempts,status,created_at,next_retry_at,last_error)
               values(?,?,?,?,0,'PENDING',?,?,?)""",
            (job_id, trade_id, operation, json.dumps(payload), now, now, error[:500]),
        )
    return job_id


def storage_outbox_status() -> dict[str, Any]:
    with connect() as connection:
        row = connection.execute("select count(*) from storage_outbox where status in ('PENDING','RETRYING','FAILED')").fetchone()
        return {"pending": int(row[0]), "max": 100}


def list_storage_jobs(limit: int = 20) -> list[dict[str, Any]]:
    with connect() as connection:
        rows = connection.execute("select * from storage_outbox order by created_at asc limit ?", (max(1, min(int(limit), 100)),)).fetchall()
    return [dict(row) for row in rows]


def complete_storage_job(job_id: str) -> None:
    with connect() as connection:
        connection.execute("delete from storage_outbox where job_id = ?", (job_id,))


def fail_storage_job(job_id: str, error: str) -> None:
    with connect() as connection:
        connection.execute("update storage_outbox set attempts = attempts + 1, status = 'RETRYING', last_error = ?, next_retry_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+5 minutes') where job_id = ?", (error[:500], job_id))
