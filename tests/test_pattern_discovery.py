import unittest

from services.pattern_discovery import discover_patterns


class PatternDiscoveryTests(unittest.TestCase):
    def test_discovers_deterministic_pattern_from_canonical_trade_data(self):
        trades = [
            {
                "id": "trade-1",
                "timestamp": "2026-08-01T10:00:00.000Z",
                "direction": "LONG",
                "setup": "breakout",
                "session": "LONDON",
                "result": "WIN",
                "intelligence": {
                    "marketContext": {"regime": "TRENDING"},
                    "marketStructure": {"state": "BULLISH"},
                    "setupFingerprint": {
                        "features": ["LONG", "TRENDING"],
                        "tags": ["STRUCTURE_ALIGNED"],
                    },
                    "calculated": {
                        "features": {"actualR": 2.0},
                    },
                },
            },
            {
                "id": "trade-2",
                "timestamp": "2026-08-02T10:00:00.000Z",
                "direction": "LONG",
                "setup": "breakout",
                "session": "LONDON",
                "result": "WIN",
                "intelligence": {
                    "marketContext": {"regime": "TRENDING"},
                    "marketStructure": {"state": "BULLISH"},
                    "setupFingerprint": {
                        "features": ["LONG", "TRENDING"],
                        "tags": ["STRUCTURE_ALIGNED"],
                    },
                    "calculated": {
                        "features": {"actualR": 1.0},
                    },
                },
            },
            {
                "id": "trade-3",
                "timestamp": "2026-08-03T10:00:00.000Z",
                "direction": "LONG",
                "setup": "breakout",
                "session": "LONDON",
                "result": "LOSS",
                "intelligence": {
                    "marketContext": {"regime": "TRENDING"},
                    "marketStructure": {"state": "BULLISH"},
                    "setupFingerprint": {
                        "features": ["LONG", "TRENDING"],
                        "tags": ["STRUCTURE_ALIGNED"],
                    },
                    "calculated": {
                        "features": {"actualR": -1.0},
                    },
                },
            },
            {
                "id": "unreviewed",
                "timestamp": "2026-08-04T10:00:00.000Z",
                "direction": "LONG",
                "setup": "breakout",
                "result": None,
                "intelligence": {
                    "marketContext": {"regime": "TRENDING"},
                },
            },
        ]

        findings = discover_patterns(trades, min_sample=3)

        setup = next(
            finding
            for finding in findings
            if finding["dimension"] == "setup"
            and finding["value"] == "breakout"
        )

        self.assertEqual(setup["sampleSize"], 3)
        self.assertEqual(setup["outcomes"], {
            "wins": 2,
            "losses": 1,
            "breakEven": 0,
        })
        self.assertEqual(setup["winRate"], 0.666667)
        self.assertEqual(setup["actualR"]["count"], 3)
        self.assertEqual(setup["actualR"]["total"], 2.0)
        self.assertEqual(setup["actualR"]["average"], 0.666667)
        self.assertEqual(
            setup["sourceTradeIds"],
            ["trade-1", "trade-2", "trade-3"],
        )
        self.assertEqual(setup["firstObserved"], "2026-08-01T10:00:00.000Z")
        self.assertEqual(setup["lastObserved"], "2026-08-03T10:00:00.000Z")
        self.assertEqual(setup["computationVersion"], 1)
        self.assertEqual(setup["reliability"]["level"], "LOW")

    def test_does_not_create_findings_below_minimum_sample(self):
        trades = [
            {
                "id": "trade-1",
                "timestamp": "2026-08-01T10:00:00.000Z",
                "setup": "rare",
                "result": "WIN",
            },
            {
                "id": "trade-2",
                "timestamp": "2026-08-02T10:00:00.000Z",
                "setup": "rare",
                "result": "WIN",
            },
        ]

        self.assertEqual(discover_patterns(trades, min_sample=3), [])


if __name__ == "__main__":
    unittest.main()
