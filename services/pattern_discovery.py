"""Deterministic journal-level pattern discovery for You Can't Trade."""

from __future__ import annotations

from collections import defaultdict
from typing import Any


PATTERN_DISCOVERY_VERSION = 1
MIN_PATTERN_SAMPLE = 3


def _actual_r(trade: dict[str, Any]) -> float | None:
    features = (
        (trade.get("intelligence") or {})
        .get("calculated", {})
        .get("features", {})
    )
    value = features.get("actualR")
    return float(value) if isinstance(value, (int, float)) else None


def _pattern_values(trade: dict[str, Any]) -> list[tuple[str, str]]:
    intelligence = trade.get("intelligence") or {}
    context = intelligence.get("marketContext") or {}
    structure = intelligence.get("marketStructure") or {}
    fingerprint = intelligence.get("setupFingerprint") or {}

    values: list[tuple[str, str]] = []

    candidates = [
        ("setup", trade.get("setup")),
        ("direction", trade.get("direction")),
        ("session", trade.get("session")),
        ("market_regime", context.get("regime")),
        ("structure_state", structure.get("state")),
    ]

    for dimension, value in candidates:
        if isinstance(value, str) and value.strip():
            values.append((dimension, value.strip()))

    for value in fingerprint.get("features") or []:
        if isinstance(value, str) and value.strip():
            values.append(("fingerprint_feature", value.strip()))

    for value in fingerprint.get("tags") or []:
        if isinstance(value, str) and value.strip():
            values.append(("fingerprint_tag", value.strip()))

    return values


def discover_patterns(
    trades: list[dict[str, Any]],
    min_sample: int = MIN_PATTERN_SAMPLE,
) -> list[dict[str, Any]]:
    """Discover recurring outcome patterns from reviewed canonical trades."""
    if min_sample < 1:
        raise ValueError("min_sample must be at least 1.")

    groups: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)

    for trade in trades:
        if trade.get("result") not in {"WIN", "LOSS", "BE"}:
            continue

        for key in _pattern_values(trade):
            groups[key].append(trade)

    findings: list[dict[str, Any]] = []

    for (dimension, value), matches in groups.items():
        if len(matches) < min_sample:
            continue

        wins = sum(trade.get("result") == "WIN" for trade in matches)
        losses = sum(trade.get("result") == "LOSS" for trade in matches)
        break_even = sum(trade.get("result") == "BE" for trade in matches)

        actual_r = [
            actual_r_value
            for trade in matches
            if (actual_r_value := _actual_r(trade)) is not None
        ]

        timestamps = [
            trade.get("timestamp")
            for trade in matches
            if isinstance(trade.get("timestamp"), str)
        ]

        findings.append(
            {
                "dimension": dimension,
                "value": value,
                "sampleSize": len(matches),
                "outcomes": {
                    "wins": wins,
                    "losses": losses,
                    "breakEven": break_even,
                },
                "winRate": round(wins / len(matches), 6),
                "actualR": {
                    "count": len(actual_r),
                    "total": round(sum(actual_r), 6),
                    "average": (
                        round(sum(actual_r) / len(actual_r), 6)
                        if actual_r
                        else None
                    ),
                },
                "sourceTradeIds": [
                    trade.get("id")
                    for trade in matches
                    if isinstance(trade.get("id"), str)
                ],
                "firstObserved": min(timestamps) if timestamps else None,
                "lastObserved": max(timestamps) if timestamps else None,
                "computationVersion": PATTERN_DISCOVERY_VERSION,
                "reliability": {
                    "level": "LOW" if len(matches) < 10 else "OBSERVATIONAL",
                    "minimumSample": min_sample,
                },
            }
        )

    return sorted(
        findings,
        key=lambda finding: (
            -finding["sampleSize"],
            finding["dimension"],
            finding["value"],
        ),
    )
