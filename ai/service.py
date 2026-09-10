"""Provider-neutral AI service for VantageForge."""

from __future__ import annotations
from .agents.pipeline import AgentPipeline
from .agents.runner import AgentRunner
from services.storage import get_storage_provider

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

def generate_structured(
    *,
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 700,
    temperature: float = 0.2,
) -> tuple[dict[str, Any], AIResponse]:
    """Generate and parse a provider-neutral structured AI response."""

    provider = get_ai_provider()

    response = provider.generate(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        response_format="json",
        max_tokens=max_tokens,
        temperature=temperature,
    )
    
    try:
        print("AGENT RESPONSE:", response.content)
        return _parse_json_response(response), response
    except AIProviderResponseError:
        raise AIProviderResponseError(
            f"Invalid JSON from {response.provider}/{response.model}: "
            f"{response.content!r}"
        )

def _ai_intelligence_context(
    intelligence: dict[str, Any] | None,
) -> dict[str, Any]:
    """Build a compact, verified intelligence packet for AI reasoning."""

    intelligence = intelligence or {}

    market_context = intelligence.get("marketContext") or {}
    regime = market_context.get("regime") or {}
    statistics = market_context.get("statistics") or {}

    structure = intelligence.get("marketStructure") or {}
    setup = intelligence.get("setupFingerprint") or {}
    calculated = intelligence.get("calculated") or {}
    historical = intelligence.get("historical") or {}

    last_bos = structure.get("lastBOS") or {}
    last_choch = structure.get("lastCHOCH") or {}
    protected_level = structure.get("protectedLevel") or {}

    return {
        "marketContext": {
            "regime": regime.get("regime"),
            "direction": regime.get("direction"),
            "confidence": regime.get("confidence"),
            "priceChangePercent": (
                statistics.get("price") or {}
            ).get("changePercent"),
            "rangePosition": (
                statistics.get("range") or {}
            ).get("position"),
            "volumeRelative": (
                statistics.get("volume") or {}
            ).get("relative"),
        },
        "structure": {
            "state": structure.get("state"),
            "direction": structure.get("direction"),
            "lastBOS": {
                "event": last_bos.get("event"),
                "time": last_bos.get("time"),
                "broken": (
                    last_bos.get("broken") or {}
                ).get("price"),
            },
            "lastCHOCH": {
                "event": last_choch.get("event"),
                "time": last_choch.get("time"),
                "broken": (
                    last_choch.get("broken") or {}
                ).get("price"),
            },
            "protectedLevel": {
                "type": protected_level.get("type"),
                "price": protected_level.get("price"),
            },
        },
        "setup": {
            "version": setup.get("version"),
            "features": setup.get("features") or [],
            "tags": setup.get("tags") or [],
            "marketRegime": setup.get("marketRegime"),
        },
        "calculated": calculated.get("features") or {},
        "historical": {
            "sampleSize": historical.get("sampleSize"),
            "similarityScore": historical.get("similarityScore"),
            "comparableStats": historical.get("comparableStats") or {},
            "patternReferences": historical.get("patternReferences") or [],
        },
    }


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
        "intelligence": _ai_intelligence_context(
            trade.get("intelligence")
            ),
    }

    system_prompt = """You are VantageForge's post-trade reflection assistant.

Your job is to explain what the supplied evidence says about a COMPLETED trade.

Return ONLY valid JSON with exactly two keys:
"summary" and "action".

Both values must be strings.

Rules:
- Use only the supplied trade and verified intelligence.
- Do not repeat the raw trade record.
- Do not invent facts.
- Do not predict future prices or market direction.
- Do not recommend entering, exiting, holding, or monitoring a trade.
- Do not give financial advice.
- Describe contradictions in the evidence when relevant.
- Treat the recorded result as a fact, not proof that the setup was good or bad.
- The action must be a journaling/review experiment, not a trading instruction.

summary: 2 short sentences explaining the most important evidence about what happened.
action: one short journaling experiment, or an empty string."""

    user_prompt = f"""Review this completed trade using only the verified evidence below.

Trade:
{_json({
    "symbol": fields["symbol"],
    "timeframe": fields["timeframe"],
    "direction": fields["direction"],
    "entry": fields["entry"],
    "stopLoss": fields["stopLoss"],
    "takeProfit": fields["takeProfit"],
    "result": fields["result"],
})}

Verified intelligence:
{_json(fields["intelligence"])}

Write exactly:
- summary: 2 short sentences about the most important evidence.
- action: 1 short journaling/review experiment, or an empty string.

Output ONLY the JSON object with exactly "summary" and "action".
"""

    response = provider.generate(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        response_format="json",
        max_tokens=400,
        temperature=0,
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


def analyze_trade_multi_agent(
    trade_id: str,
) -> dict[str, Any]:
    """Generate a grounded post-trade review using the V1 agent pipeline."""

    storage = get_storage_provider()

    trade = storage.get_trade(trade_id)

    if not trade:
        raise AIProviderResponseError(
            f"Trade not found: {trade_id}"
        )

    existing_reflection = storage.get_latest_ai_trade_reflection(trade_id)

    if (
        existing_reflection
        and existing_reflection.get("tradeUpdatedAt") == trade.get("updatedAt")
    ):
        return {
            **existing_reflection,
            "provider": _pipeline_provider_name(),
            "specialists": {},
            "synthesis": None,
        }

    historical = storage.get_historical_context(
        str(trade.get("id") or trade.get("tradeId") or ""),
        limit=10,
    )

    intelligence = dict(trade.get("intelligence") or {})
    intelligence["historical"] = historical

    context = {
        "trade": trade,
        "intelligence": intelligence,
    }

    evidence = [
        {
            "ref": "trade",
            "source": "VERIFIED_TRADE_RECORD",
        },
        {
            "ref": "intelligence",
            "source": "VANTAGEFORGE_DETERMINISTIC_INTELLIGENCE",
        },
    ]

    pipeline = AgentPipeline(
        AgentRunner(_ModuleAIService())
    )

    result = pipeline.run(
        trade_id=str(trade.get("id") or trade.get("tradeId") or ""),
        context=context,
        evidence=evidence,
    )

    if not result.synthesis_output:
        raise AIProviderResponseError(
            "The multi-agent synthesis did not produce an insight."
        )

    output = result.synthesis_output

    

    if "error" in output:
        raise AIProviderResponseError(
            f"Multi-agent synthesis failed: {output['error']}"
        )

    existing_reflection = storage.get_latest_ai_trade_reflection(trade_id)

    if (
        existing_reflection
        and existing_reflection.get("tradeUpdatedAt") == trade.get("updatedAt")
    ):
        return {
            **existing_reflection,
            "provider": _pipeline_provider_name(),
            "specialists": {},
            "synthesis": None,
        }


    storage.save_ai_trade_reflection(
        trade_id=trade_id,
        trade_updated_at=trade.get("updatedAt") or trade.get("tradeUpdatedAt"),
        reflection={
            "summary": output["summary"],
            "keyObservations": output["keyObservations"],
            "action": output["action"],
            "unknowns": output["unknowns"],
            "evidenceRefs": output["evidenceRefs"],
            "model": _pipeline_model_name(),
            "promptVersion": PROMPT_VERSION,
            "contractVersion": 1,
        },
    )

    synthesis = result.synthesis

    return {
        "summary": output["summary"],
        "action": output["action"],
        "keyObservations": output["keyObservations"],
        "unknowns": output["unknowns"],
        "evidenceRefs": output["evidenceRefs"],
        "provider": _pipeline_provider_name(),
        "model": _pipeline_model_name(),
        "promptVersion": PROMPT_VERSION,
        "agentContractVersion": 1,
        "specialists": {
            agent_id: specialist.to_dict()
            for agent_id, specialist in result.specialists.items()
        },
        "synthesis": (
            synthesis.to_dict()
            if synthesis
            else None
        ),
    }


class _ModuleAIService:
    """Adapter exposing this module's structured generation API to agents."""

    def generate_structured(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 700,
        temperature: float = 0.2,
    ) -> tuple[dict[str, Any], AIResponse]:
        return generate_structured(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=max_tokens,
            temperature=temperature,
        )


def _pipeline_provider_name() -> str:
    return get_ai_provider().provider_name


def _pipeline_model_name() -> str:
    provider = get_ai_provider()
    return getattr(provider, "model", "")


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