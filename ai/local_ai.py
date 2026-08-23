"""Local-only Ollama integration for personal trade reflection."""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any


OLLAMA_BASE_URL = "http://127.0.0.1:11434"
DEFAULT_MODEL = os.environ.get("VANTAGEFORGE_AI_MODEL", "qwen2.5:0.5b-instruct")
PROMPT_VERSION = "trade-reflection-v5"


class LocalAIUnavailableError(RuntimeError):
    pass


def _request(path: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    body = None
    headers = {}
    method = "GET"
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
        method = "POST"

    request = urllib.request.Request(
        f"{OLLAMA_BASE_URL}{path}",
        data=body,
        headers=headers,
        method=method,
    )
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            return json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
        raise LocalAIUnavailableError(
            "Ollama is unavailable. Start Ollama and make sure a local model is installed."
        ) from error


def health() -> dict[str, Any]:
    try:
        result = _request("/api/tags")
    except LocalAIUnavailableError:
        return {"available": False, "model": DEFAULT_MODEL, "models": []}

    models = [item.get("name") for item in result.get("models", [])]
    return {
        "available": True,
        "model": DEFAULT_MODEL,
        "models": [model for model in models if model],
        "modelReady": DEFAULT_MODEL in models,
    }


def _trade_prompt(trade: dict[str, Any]) -> str:
    fields = {
        "symbol": trade.get("symbol"),
        "timeframe": trade.get("timeframe"),
        "direction": trade.get("direction"),
        "entry": trade.get("entry"),
        "stopLoss": trade.get("stopLoss"),
        "takeProfit": trade.get("takeProfit"),
        "result": trade.get("result"),
        "exitPrice": trade.get("exitPrice"),
        "setup": trade.get("setup"),
        "session": trade.get("session"),
        "planAdherence": trade.get("planAdherence"),
        "executionTag": trade.get("executionTag"),
        "notes": trade.get("notes"),
        "emotions": trade.get("emotions"),
    }
    return (
        "Important field meanings: entry, stopLoss, and takeProfit are planned levels; "
        "exitPrice is the actual exit and is unavailable when null. result is the trader's recorded label, "
        "not an inference. A null or empty setup, session, planAdherence, executionTag, notes, or emotions "
        "means it was not recorded; never describe it as absent from the trader's mind.\n"
        f"Trade record:\n{json.dumps(fields, ensure_ascii=False)}"
    )


def compare_trade(target: dict[str, Any], matches: list[dict[str, Any]]) -> dict[str, Any]:
    comparison = {
        "target": {key: target.get(key) for key in ("symbol", "timeframe", "direction", "result", "setup", "session", "planAdherence", "executionTag", "emotions")},
        "similar": [{key: trade.get(key) for key in ("symbol", "timeframe", "direction", "result", "setup", "session", "planAdherence", "executionTag", "emotions")} for trade in matches],
    }
    response = _request("/api/chat", {
        "model": DEFAULT_MODEL, "stream": False, "format": "json",
        "messages": [
            {"role": "system", "content": "You are a private journaling coach. Use only this structured comparison. Do not invent causes or numbers. Return JSON with exactly one string field action containing one cautious comparison question."},
            {"role": "user", "content": f"Suggest one question for comparing this trade with similar journal records:\n{json.dumps(comparison, ensure_ascii=False)}"},
        ],
    })
    try:
        parsed = json.loads(response.get("message", {}).get("content", "{}"))
    except (TypeError, json.JSONDecodeError):
        parsed = {}
    action = parsed.get("action", "") if isinstance(parsed.get("action", ""), str) else ""
    if not action.strip():
        action = "What was different in your plan adherence or execution between this trade and the closest matches?"
    return {"summary": f"Compared this trade with {len(matches)} similar journal record{'s' if len(matches) != 1 else ''}.", "action": action.strip(), "model": DEFAULT_MODEL, "promptVersion": PROMPT_VERSION}


def analyze_patterns(analytics: dict[str, Any]) -> dict[str, Any]:
    response = _request(
        "/api/chat",
        {
            "model": DEFAULT_MODEL,
            "stream": False,
            "format": "json",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a private journaling coach. Use only the supplied verified aggregate data. "
                        "Do not invent trade details, causes, or performance claims. Return JSON with exactly "
                        "one string field: action, containing one cautious journaling experiment. Do not mention "
                        "numbers or outcomes unless they are explicitly supplied."
                    ),
                },
                {"role": "user", "content": f"Suggest one journaling experiment from these verified aggregates:\n{json.dumps(analytics, ensure_ascii=False)}"},
            ],
        },
    )
    try:
        parsed = json.loads(response.get("message", {}).get("content", "{}"))
    except (TypeError, json.JSONDecodeError):
        parsed = {}
    action = parsed.get("action", "")
    if not isinstance(action, str):
        action = ""
    action = action.strip()
    reviewed = analytics.get("reviewedTrades", 0)
    actual_r = analytics.get("actualR") or {}
    if not action or action.lower() in {"suggestions", "suggestion", "journaling", "reflection", "review"}:
        if not actual_r.get("count"):
            action = "Record the actual exit price on each of your next three reviews."
        elif not analytics.get("topSetups"):
            action = "Name the setup in each of your next three reviews so similar trades can be compared."
        else:
            action = "Record one specific emotion and the decision it influenced in each of your next three reviews."
    summary = f"Pattern review is based on {reviewed} reviewed trade{'s' if reviewed != 1 else ''}. Treat it as an observation, not a conclusion."
    return {"summary": summary, "action": action, "model": DEFAULT_MODEL, "promptVersion": PROMPT_VERSION}


def analyze_trade(trade: dict[str, Any]) -> dict[str, Any]:
    prompt = _trade_prompt(trade)
    response = _request(
        "/api/chat",
        {
            "model": DEFAULT_MODEL,
            "stream": False,
            "format": "json",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a private post-trade journaling coach. Reflect only on the supplied completed trade. "
                        "Do not predict markets, give entry or exit instructions, or provide financial advice. "
                        "Never call a planned take-profit an executed price. Never invent an exit price, setup, "
                        "plan adherence, emotion, or note. Do not restate numeric levels unless needed to explain "
                        "the review. Separate observed facts from interpretation. Return JSON with exactly two "
                        "string fields: summary (2-4 concise sentences) and action (one small journaling experiment, "
                        "or an empty string)."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Review this trade record and return the required JSON:\n{prompt}",
                },
            ],
        },
    )
    content = response.get("message", {}).get("content", "")

    try:
        parsed = json.loads(content)
    except (TypeError, json.JSONDecodeError):
        parsed = {"summary": content.strip(), "action": ""}

    summary = parsed.get("summary")
    action = parsed.get("action", "")
    if not isinstance(summary, str) or not summary.strip():
        raise LocalAIUnavailableError("Ollama returned an empty trade reflection. Try the analysis again.")

    summary = summary.strip()
    action = action.strip() if isinstance(action, str) else ""

    # Small local models can still violate a factual instruction. Treat the
    # database as the source of truth and fail closed when the text claims an
    # unavailable exit or invents an outcome-specific action.
    exit_price = trade.get("exitPrice")
    # Until the trader records an actual exit, do not display model prose about
    # execution. This is intentionally strict: a small model can turn a planned
    # take-profit or a WIN label into an invented execution narrative.
    if exit_price in (None, ""):
        result_label = trade.get("result") or "no outcome label"
        summary = (
            "The journal records a " + str(result_label) + " outcome, but no actual exit price "
            "was saved. Execution details cannot be verified yet; review the notes and state "
            "of mind, then add the exit price when available."
        )
        action = "Record the actual exit price and one sentence about the decision behind it."
    else:
        # Verified facts are rendered by code, never by the language model.
        summary = (
            f"Recorded outcome: {trade.get('result') or 'not labelled'}. "
            f"Actual exit price: {exit_price}. Planned entry: {trade.get('entry')}; "
            f"planned stop-loss: {trade.get('stopLoss')}; planned take-profit: "
            f"{trade.get('takeProfit')}."
        )

    return {
        "summary": summary,
        "action": action,
        "model": DEFAULT_MODEL,
        "promptVersion": PROMPT_VERSION,
    }
