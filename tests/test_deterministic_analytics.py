import unittest

from services.deterministic_analytics import calculate_journal_analytics


class DeterministicAnalyticsTests(unittest.TestCase):
    def test_calculates_reviewed_outcomes_actual_r_and_top_fields(self):
        trades = [
            {
                "result": "WIN",
                "direction": "LONG",
                "entry": 100,
                "stopLoss": 95,
                "exitPrice": 110,
                "setup": "Breakout",
                "emotions": ["calm", "focused"],
                "executionTag": "planned",
            },
            {
                "result": "LOSS",
                "direction": "SHORT",
                "entry": 100,
                "stopLoss": 105,
                "exitPrice": 110,
                "setup": "Breakout",
                "emotions": ["frustrated"],
                "executionTag": "late",
            },
            {
                "result": None,
                "direction": "LONG",
                "entry": 100,
                "stopLoss": 95,
                "exitPrice": 105,
                "setup": "Ignored",
            },
        ]

        stats = calculate_journal_analytics(trades)

        self.assertEqual(stats["totalTrades"], 3)
        self.assertEqual(stats["reviewedTrades"], 2)
        self.assertEqual(stats["outcomes"], {
            "wins": 1,
            "losses": 1,
            "breakEven": 0,
        })
        self.assertEqual(stats["actualR"]["count"], 2)
        self.assertEqual(stats["actualR"]["total"], 0.0)
        self.assertEqual(stats["actualR"]["average"], 0.0)
        self.assertEqual(stats["topSetups"], [{"value": "Breakout", "count": 2}])
        self.assertEqual(stats["topEmotions"][0], {"value": "calm", "count": 1})
        self.assertEqual(stats["topExecutionTags"], [
            {"value": "late", "count": 1},
            {"value": "planned", "count": 1},
        ])
        self.assertIn("at least 10 trades", stats["sampleWarning"])


if __name__ == "__main__":
    unittest.main()
