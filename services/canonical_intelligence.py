"""Build canonical deterministic intelligence before a trade is persisted."""

from __future__ import annotations

from typing import Any

def _empty_intelligence() -> dict[str, Any]:
    return {
        "marketContext": {},
        "marketStructure": {},
        "setupFingerprint": {},
        "calculated": {},
        "execution": {},
        "behavior": {},
        "rules": {},
        "historical": {},
        "ai": {},
    }


def canonical_similarity_score(source: dict[str, Any], candidate: dict[str, Any]) -> int:
    """Score historical similarity using canonical intelligence first.

    Outcome/result is intentionally excluded so retrieval does not become
    outcome-biased. Journal fields provide secondary context only.
    """
    score = 0

    # Primary trade identity/context.
    if source.get("symbol") and source.get("symbol") == candidate.get("symbol"):
        score += 5

    if source.get("timeframe") and source.get("timeframe") == candidate.get("timeframe"):
        score += 3

    if source.get("direction") and source.get("direction") == candidate.get("direction"):
        score += 2

    source_intelligence = source.get("intelligence") or {}
    candidate_intelligence = candidate.get("intelligence") or {}

    source_context = source_intelligence.get("marketContext") or {}
    candidate_context = candidate_intelligence.get("marketContext") or {}

    # Canonical market regime.
    if (
        source_context.get("regime")
        and source_context.get("regime") == candidate_context.get("regime")
    ):
        score += 4

    if (
        source_context.get("direction")
        and source_context.get("direction") == candidate_context.get("direction")
    ):
        score += 3

    # Canonical market structure.
    source_structure = source_intelligence.get("marketStructure") or {}
    candidate_structure = candidate_intelligence.get("marketStructure") or {}

    if (
        source_structure.get("state")
        and source_structure.get("state") == candidate_structure.get("state")
    ):
        score += 4

    # Setup fingerprint.
    source_fingerprint = source_intelligence.get("setupFingerprint") or {}
    candidate_fingerprint = candidate_intelligence.get("setupFingerprint") or {}

    source_features = set(source_fingerprint.get("features") or [])
    candidate_features = set(candidate_fingerprint.get("features") or [])
    score += 2 * len(source_features & candidate_features)

    source_tags = set(source_fingerprint.get("tags") or [])
    candidate_tags = set(candidate_fingerprint.get("tags") or [])
    score += 2 * len(source_tags & candidate_tags)

    # Latest structural event provides additional context.
    def latest_structure_event(structure: dict[str, Any]) -> str | None:
        events = structure.get("events") or []
        if not events:
            return None

        valid_events = [
            event
            for event in events
            if isinstance(event, dict) and event.get("event")
        ]

        if not valid_events:
            return None

        valid_events.sort(
            key=lambda event: (
                float(event.get("time"))
                if isinstance(event.get("time"), (int, float))
                else float("-inf")
            )
        )

        return valid_events[-1].get("event")

    source_event = latest_structure_event(source_structure)
    candidate_event = latest_structure_event(candidate_structure)

    if source_event and source_event == candidate_event:
        score += 3

    # Secondary journal context.
    if source.get("setup") and source.get("setup") == candidate.get("setup"):
        score += 3

    if source.get("session") and source.get("session") == candidate.get("session"):
        score += 1

    if (
        source.get("planAdherence")
        and source.get("planAdherence") == candidate.get("planAdherence")
    ):
        score += 1

    if (
        source.get("executionTag")
        and source.get("executionTag") == candidate.get("executionTag")
    ):
        score += 1

    shared_emotions = set(source.get("emotions") or []) & set(candidate.get("emotions") or [])
    score += len(shared_emotions)

    return score


def assemble_canonical_intelligence(
    trade: dict[str, Any],
    existing_trades: list[dict[str, Any]],
    limit: int = 10,
) -> dict[str, Any]:
    """Attach deterministic historical context without performing any writes."""

    intelligence = dict(trade.get("intelligence") or {})
    safe_limit = max(1, min(int(limit), 50))

    scored: list[tuple[int, dict[str, Any]]] = []

    for candidate in existing_trades:
        if candidate.get("id") == trade.get("id"):
            continue

        score = canonical_similarity_score(trade, candidate)

        if score:
            scored.append((score, candidate))

    scored.sort(
        key=lambda item: (
            -item[0],
            item[1].get("timestamp") or "",
        )
    )

    matches = [candidate for _, candidate in scored[:safe_limit]]
    scores = [score for score, _ in scored[:safe_limit]]

    reviewed = [
        candidate
        for candidate in matches
        if candidate.get("result") in {"WIN", "LOSS", "BE"}
    ]

    wins = sum(candidate.get("result") == "WIN" for candidate in reviewed)
    losses = sum(candidate.get("result") == "LOSS" for candidate in reviewed)
    break_even = sum(candidate.get("result") == "BE" for candidate in reviewed)

    actual_r: list[float] = []
    planned_rr: list[float] = []

    for candidate in reviewed:
        entry = candidate.get("entry")
        stop = candidate.get("stopLoss")
        exit_price = candidate.get("exitPrice")

        if all(
            isinstance(value, (int, float))
            for value in (entry, stop, exit_price)
        ):
            risk = abs(entry - stop)

            if risk > 0:
                profit = (
                    exit_price - entry
                    if candidate.get("direction") == "LONG"
                    else entry - exit_price
                )
                actual_r.append(profit / risk)

        candidate_intelligence = candidate.get("intelligence") or {}
        calculated = candidate_intelligence.get("calculated") or {}
        features = calculated.get("features") or {}
        value = features.get("plannedRR")

        if isinstance(value, (int, float)):
            planned_rr.append(float(value))

    pattern_references: list[str] = []
    source_fingerprint = intelligence.get("setupFingerprint") or {}

    for value in (
        list(source_fingerprint.get("tags") or [])
        + list(source_fingerprint.get("features") or [])
    ):
        if isinstance(value, str) and value not in pattern_references:
            pattern_references.append(value)

    compact_matches = []

    for score, candidate in scored[:safe_limit]:
        candidate_intelligence = candidate.get("intelligence") or {}
        market_context = candidate_intelligence.get("marketContext") or {}
        market_structure = candidate_intelligence.get("marketStructure") or {}
        fingerprint = candidate_intelligence.get("setupFingerprint") or {}
        calculated = candidate_intelligence.get("calculated") or {}
        features = calculated.get("features") or {}

        compact_matches.append(
            {
                "id": candidate.get("id"),
                "similarityScore": score,
                "symbol": candidate.get("symbol"),
                "timeframe": candidate.get("timeframe"),
                "direction": candidate.get("direction"),
                "result": candidate.get("result"),
                "marketRegime": market_context.get("regime"),
                "structureState": market_structure.get("state"),
                "setupFeatures": fingerprint.get("features") or [],
                "setupTags": fingerprint.get("tags") or [],
                "plannedRR": features.get("plannedRR"),
            }
        )

    intelligence["historical"] = {
        "similarTradeIds": [
            candidate.get("id")
            for candidate in matches
            if isinstance(candidate.get("id"), str)
        ],
        "similarityScore": max(scores) if scores else None,
        "sampleSize": len(matches),
        "comparableStats": {
            "reviewedSampleSize": len(reviewed),
            "wins": wins,
            "losses": losses,
            "breakEven": break_even,
            "winRate": (
                round(wins / len(reviewed), 4)
                if reviewed
                else None
            ),
            "actualR": {
                "count": len(actual_r),
                "average": (
                    round(sum(actual_r) / len(actual_r), 6)
                    if actual_r
                    else None
                ),
            },
            "plannedRR": {
                "count": len(planned_rr),
                "average": (
                    round(sum(planned_rr) / len(planned_rr), 6)
                    if planned_rr
                    else None
                ),
            },
        },
        "patternReferences": pattern_references,
        "matches": compact_matches,
    }

    return {
        **trade,
        "intelligence": intelligence or _empty_intelligence(),
    }
