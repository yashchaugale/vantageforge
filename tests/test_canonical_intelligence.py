import unittest

from services.canonical_intelligence import assemble_canonical_intelligence


class CanonicalIntelligenceTests(unittest.TestCase):
    def test_assembles_historical_context_without_persisting(self):
        trade = {
            "id": "new-trade",
            "symbol": "BTCUSDT",
            "timeframe": "15m",
            "direction": "LONG",
            "result": None,
            "intelligence": {
                "marketContext": {
                    "regime": "TRENDING",
                    "direction": "BULLISH",
                },
                "marketStructure": {
                    "state": "BULLISH",
                },
                "setupFingerprint": {
                    "features": ["pullback"],
                    "tags": ["trend"],
                },
            },
        }

        existing = [
            {
                "id": "old-trade",
                "symbol": "BTCUSDT",
                "timeframe": "15m",
                "direction": "LONG",
                "result": "WIN",
                "entry": 100,
                "stopLoss": 95,
                "exitPrice": 110,
                "intelligence": {
                    "marketContext": {
                        "regime": "TRENDING",
                        "direction": "BULLISH",
                    },
                    "marketStructure": {
                        "state": "BULLISH",
                    },
                    "setupFingerprint": {
                        "features": ["pullback"],
                        "tags": ["trend"],
                    },
                    "calculated": {
                        "features": {
                            "plannedRR": 2,
                        }
                    },
                },
            }
        ]

        result = assemble_canonical_intelligence(
            trade,
            existing,
            limit=10,
        )

        self.assertEqual(result["id"], "new-trade")
        self.assertIn("historical", result["intelligence"])

        historical = result["intelligence"]["historical"]

        self.assertEqual(historical["similarTradeIds"], ["old-trade"])
        self.assertEqual(historical["sampleSize"], 1)
        self.assertEqual(historical["comparableStats"]["wins"], 1)
        self.assertEqual(historical["comparableStats"]["losses"], 0)

        # The function must only assemble data; it must not mutate
        # the supplied existing trade list.
        self.assertEqual(existing[0]["id"], "old-trade")


if __name__ == "__main__":
    unittest.main()
