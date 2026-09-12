import unittest

from services.data_health import assess_data_health


class DataHealthTests(unittest.TestCase):
    def test_reports_completeness_and_analysis_readiness(self):
        trades = [
            {
                "id": "ready",
                "entry": 100,
                "stopLoss": 95,
                "takeProfit": 110,
                "exitPrice": 110,
                "result": "WIN",
                "intelligence": {
                    "marketContext": {"regime": "TRENDING"},
                    "marketStructure": {"state": "BULLISH"},
                    "setupFingerprint": {
                        "features": ["LONG"],
                        "tags": ["STRUCTURE_ALIGNED"],
                    },
                    "calculated": {
                        "features": {"actualR": 2.0},
                    },
                },
            },
            {
                "id": "incomplete",
                "entry": None,
                "stopLoss": None,
                "takeProfit": 100,
                "exitPrice": None,
                "result": "LOSS",
                "intelligence": {},
            },
            {
                "id": "unreviewed",
                "entry": 100,
                "stopLoss": 95,
                "takeProfit": 110,
                "exitPrice": None,
                "result": None,
                "intelligence": {},
            },
        ]

        health = assess_data_health(trades)

        self.assertEqual(health["computationVersion"], 1)
        self.assertEqual(health["totalTrades"], 3)
        self.assertEqual(health["reviewedTrades"], 2)
        self.assertEqual(health["unreviewedTrades"], 1)

        self.assertEqual(health["missing"]["outcome"], 1)
        self.assertEqual(health["missing"]["entry"], 1)
        self.assertEqual(health["missing"]["stopLoss"], 1)
        self.assertEqual(health["missing"]["takeProfit"], 0)
        self.assertEqual(health["missing"]["exitPriceReviewed"], 1)
        self.assertEqual(health["missing"]["actualRReviewed"], 1)
        self.assertEqual(health["missing"]["marketContext"], 2)
        self.assertEqual(health["missing"]["marketStructure"], 2)
        self.assertEqual(health["missing"]["setupFingerprint"], 2)

        self.assertEqual(health["analysisReadyTrades"], 1)


if __name__ == "__main__":
    unittest.main()
