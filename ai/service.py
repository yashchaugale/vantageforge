"""Provider-neutral AI service for VantageForge."""

from __future__ import annotations

from typing import Any

from .provider_factory import get_ai_provider
from .providers.base import (
    AIProviderError,
    AIProviderResponseError,
    AIResponse,
)


PROMPT_VERSION = "trade-reflection-v6"


def _parse_json_response(response: AIResponse) -> dict[str, Any]:
    """Parse a provider response while failing closed on invalid JSON."""

    import json

    try:
        parsed = json.loads(response.content)
    except (TypeError, json.JSONDecodeError) as error:
        raise AIProviderResponseError(
            "The AI provider returned invalid JSON."
        ) from error

    if not isinstance(parsed, dict):
        raise AIProviderResponseError(
            "The AI provider returned an invalid JSON object."
        )

    return parsed


def analyze_trade(trade: dict[str, Any]) -> dict[str, Any]:
    """Generate a grounded post-trade reflection."""

    provider = get_ai_provider()

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
        "intelligence": trade.get("intelligence"),
    }

    system_prompt = (
        "You are a private post-trade journaling coach. "
        "Use only the supplied verified trade record and deterministic intelligence. "
        "Do not predict markets, give entry or exit instructions, or provide financial advice. "
        "Never call a planned take-profit an executed price. "
        "Never invent an exit price, setup, plan adherence, emotion, note, or market fact. "
        "Separate observed facts from interpretation. "
        "Return JSON with exactly two string fields: "
        "summary and action. "
        "summary should contain 2-4 concise sentences. "
        "action should contain one small journaling experiment or an empty string."
    )

    user_prompt = (
        "Important field meanings: entry, stopLoss, and takeProfit are planned levels; "
        "exitPrice is the actual exit and is unavailable when null. "
        "result is the trader's recorded label, not an inference. "
        "A null or empty journal field means it was not recorded; "
        "never interpret that as evidence of the trader's mental state.\n\n"
        "Verified trade record:\n"
        f"{_json(fields)}"
    )

    response = provider.generate(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        response_format="json",
        max_tokens=700,
        temperature=0.2,
    )

    parsed = _parse_json_response(response)

    summary = parsed.get("summary")
    action = parsed.get("action", "")

    if not isinstance(summary, str) or not summary.strip():
        raise AIProviderResponseError(
            "The AI provider returned an empty trade reflection."
        )

    if not isinstance(action, str):
        action = ""

    return {
        "summary": summary.strip(),
        "action": action.strip(),
        "model": response.model,
        "provider": response.provider,
        "promptVersion": PROMPT_VERSION,
        "usage": response.usage,
    }


def _json(value: Any) -> str:
    import json

    return json.dumps(
        value,
        ensure_ascii=False,
        separators=(",", ":"),
    )


def health() -> dict[str, Any]:
    """Return health information for the configured provider."""

    provider = get_ai_provider()
    return provider.health()


def compare_trade(
    target: dict[str, Any],
    matches: list[dict[str, Any]],
) -> dict[str, Any]:
    """Compare a trade against retrieved historical matches."""

    provider = get_ai_provider()

    comparison = {
        "target": {
            key: target.get(key)
            for key in (
                "symbol",
                "timeframe",
                "direction",
                "result",
                "setup",
                "session",
                "planAdherence",
                "executionTag",
                "emotions",
            )
        },
        "similar": [
            {
                key: trade.get(key)
                for key in (
                    "symbol",
                    "timeframe",
                    "direction",
                    "result",
                    "setup",
                    "session",
                    "planAdherence",
                    "executionTag",
                    "emotions",
                )
            }
            for trade in matches
        ],
    }

    response = provider.generate(
        system_prompt=(
            "You are a private trading-journal reflection coach. "
            "Use only the supplied structured comparison. "
            "Do not invent causes, numbers, market facts, or execution details. "
            "Do not give financial advice or trading instructions. "
            "Return JSON with exactly one string field named action. "
            "The action must be one cautious comparison question."
        ),
        user_prompt=(
            "Suggest one question for comparing this trade with similar "
            "journal records.\n\n"
            f"{_json(comparison)}"
        ),
        response_format="json",
        max_tokens=300,
        temperature=0.2,
    )

    parsed = _parse_json_response(response)

    action = parsed.get("action", "")

    if not isinstance(action, str) or not action.strip():
        action = (
            "What was different in your plan adherence or execution "
            "between this trade and the closest matches?"
        )

    return {
        "summary": (
            f"Compared this trade with {len(matches)} similar journal "
            f"record{'s' if len(matches) != 1 else ''}."
        ),
        "action": action.strip(),
        "model": response.model,
        "provider": response.provider,
        "promptVersion": PROMPT_VERSION,
        "usage": response.usage,
    }


def analyze_patterns(
    analytics: dict[str, Any],
) -> dict[str, Any]:
    """Generate a grounded reflection from verified journal aggregates."""

    provider = get_ai_provider()

    response = provider.generate(
        system_prompt=(
            "You are a private trading-journal reflection coach. "
            "Use only the supplied verified aggregate data. "
            "Do not invent trade details, causes, market facts, or "
            "performance claims. "
            "Do not give financial advice or trading instructions. "
            "Return JSON with exactly one string field named action. "
            "The action must contain one cautious journaling experiment. "
            "Do not mention numbers or outcomes unless explicitly supplied."
        ),
        user_prompt=(
            "Suggest one journaling experiment from these verified "
            "aggregates:\n\n"
            f"{_json(analytics)}"
        ),
        response_format="json",
        max_tokens=300,
        temperature=0.2,
    )

    parsed = _parse_json_response(response)

    action = parsed.get("action", "")

    if not isinstance(action, str):
        action = ""

    action = action.strip()

    reviewed = analytics.get("reviewedTrades", 0)
    actual_r = analytics.get("actualR") or {}

    if not action or action.lower() in {
        "suggestions",
        "suggestion",
        "journaling",
        "reflection",
        "review",
    }:
        if not actual_r.get("count"):
            action = (
                "Record the actual exit price on each of your next "
                "three reviews."
            )
        elif not analytics.get("topSetups"):
            action = (
                "Name the setup in each of your next three reviews "
                "so similar trades can be compared."
            )
        else:
            action = (
                "Record one specific emotion and the decision it "
                "influenced in each of your next three reviews."
            )

    summary = (
        f"Pattern review is based on {reviewed} reviewed trade"
        f"{'s' if reviewed != 1 else ''}. "
        "Treat it as an observation, not a conclusion."
    )

    return {
        "summary": summary,
        "action": action,
        "model": response.model,
        "provider": response.provider,
        "promptVersion": PROMPT_VERSION,
        "usage": response.usage,
    }