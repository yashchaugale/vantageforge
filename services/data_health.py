"""Deterministic journal data-health reporting for You Can't Trade."""

from __future__ import annotations

from typing import Any


DATA_HEALTH_VERSION = 1


def _has_value(value: Any) -> bool:
    return value is not None and value != ""


def assess_data_health(trades: list[dict[str, Any]]) -> dict[str, Any]:
    """Assess completeness and analysis readiness without mutating trades."""
    reviewed = [
        trade
        for trade in trades
        if trade.get("result") in {"WIN", "LOSS", "BE"}
    ]

    missing_outcome = sum(
        not _has_value(trade.get("result"))
        for trade in trades
    )
    missing_entry = sum(
        not isinstance(trade.get("entry"), (int, float))
        for trade in trades
    )
    missing_stop_loss = sum(
        not isinstance(trade.get("stopLoss"), (int, float))
        for trade in trades
    )
    missing_take_profit = sum(
        not isinstance(trade.get("takeProfit"), (int, float))
        for trade in trades
    )
    missing_exit_price = sum(
        not isinstance(trade.get("exitPrice"), (int, float))
        for trade in reviewed
    )

    missing_actual_r = 0
    missing_market_context = 0
    missing_market_structure = 0
    missing_setup_fingerprint = 0

    analysis_ready = 0

    for trade in trades:
        intelligence = trade.get("intelligence") or {}
        calculated = intelligence.get("calculated") or {}
        calculated_features = calculated.get("features") or {}
        market_context = intelligence.get("marketContext") or {}
        market_structure = intelligence.get("marketStructure") or {}
        fingerprint = intelligence.get("setupFingerprint") or {}

        has_actual_r = isinstance(
            calculated_features.get("actualR"),
            (int, float),
        )
        has_market_context = any(
            _has_value(market_context.get(field))
            for field in (
                "trend",
                "regime",
                "volatility",
                "momentum",
                "session",
                "higherTimeframe",
            )
        )
        has_market_structure = any(
            _has_value(market_structure.get(field))
            for field in (
                "state",
                "events",
                "swings",
                "levels",
            )
        )
        has_setup_fingerprint = bool(
            fingerprint.get("features")
            or fingerprint.get("tags")
        )

        if trade in reviewed and not has_actual_r:
            missing_actual_r += 1
        if not has_market_context:
            missing_market_context += 1
        if not has_market_structure:
            missing_market_structure += 1
        if not has_setup_fingerprint:
            missing_setup_fingerprint += 1

        if (
            trade in reviewed
            and has_actual_r
            and has_market_context
            and has_market_structure
            and has_setup_fingerprint
        ):
            analysis_ready += 1

    return {
        "computationVersion": DATA_HEALTH_VERSION,
        "totalTrades": len(trades),
        "reviewedTrades": len(reviewed),
        "unreviewedTrades": len(trades) - len(reviewed),
        "missing": {
            "outcome": missing_outcome,
            "entry": missing_entry,
            "stopLoss": missing_stop_loss,
            "takeProfit": missing_take_profit,
            "exitPriceReviewed": missing_exit_price,
            "actualRReviewed": missing_actual_r,
            "marketContext": missing_market_context,
            "marketStructure": missing_market_structure,
            "setupFingerprint": missing_setup_fingerprint,
        },
        "analysisReadyTrades": analysis_ready,
    }
