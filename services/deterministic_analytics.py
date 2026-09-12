"""Provider-neutral deterministic analytics for You Can't Trade."""

from __future__ import annotations

from typing import Any


def calculate_journal_analytics(trades: list[dict[str, Any]]) -> dict[str, Any]:
    """Calculate journal analytics from canonical trades without storage or AI."""
    reviewed = [
        trade
        for trade in trades
        if trade.get("result") in {"WIN", "LOSS", "BE"}
    ]

    def counts(values: list[Any]) -> list[dict[str, Any]]:
        tally: dict[str, int] = {}
        for value in values:
            if isinstance(value, str) and value.strip():
                key = value.strip()
                tally[key] = tally.get(key, 0) + 1
        return [
            {"value": value, "count": count}
            for value, count in sorted(
                tally.items(),
                key=lambda item: (-item[1], item[0]),
            )
        ]

    actual_r: list[float] = []
    for trade in reviewed:
        entry = trade.get("entry")
        stop = trade.get("stopLoss")
        exit_price = trade.get("exitPrice")

        if not all(
            isinstance(value, (int, float))
            for value in (entry, stop, exit_price)
        ):
            continue

        risk = abs(entry - stop)
        if risk == 0:
            continue

        profit = (
            exit_price - entry
            if trade.get("direction") == "LONG"
            else entry - exit_price
        )
        actual_r.append(profit / risk)

    return {
        "totalTrades": len(trades),
        "reviewedTrades": len(reviewed),
        "outcomes": {
            "wins": sum(trade.get("result") == "WIN" for trade in reviewed),
            "losses": sum(trade.get("result") == "LOSS" for trade in reviewed),
            "breakEven": sum(trade.get("result") == "BE" for trade in reviewed),
        },
        "actualR": {
            "count": len(actual_r),
            "total": round(sum(actual_r), 6),
            "average": (
                round(sum(actual_r) / len(actual_r), 6)
                if actual_r
                else None
            ),
        },
        "topSetups": counts([trade.get("setup") for trade in reviewed])[:5],
        "topEmotions": counts(
            [
                emotion
                for trade in reviewed
                for emotion in (trade.get("emotions") or [])
            ]
        )[:5],
        "topExecutionTags": counts(
            [trade.get("executionTag") for trade in reviewed]
        )[:5],
        "sampleWarning": (
            "Capture and review at least 10 trades before treating recurring "
            "patterns as reliable."
            if len(reviewed) < 10
            else None
        ),
    }
