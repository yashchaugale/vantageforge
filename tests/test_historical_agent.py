import json
import unittest

from ai.agents.base import AgentRequest
from ai.agents.historical import HistoricalAnalyst


class HistoricalAnalystTests(unittest.TestCase):
    def test_agent_has_stable_id(self):
        self.assertEqual(
            HistoricalAnalyst.agent_id,
            "historical-analyst",
        )

    def test_build_prompt_contains_historical_context(self):
        agent = HistoricalAnalyst()

        request = AgentRequest(
            trade_id="trade-123",
            agent_id="historical-analyst",
            context={
                "historical": {
                    "similarTradeIds": [
                        "trade-001",
                        "trade-002",
                    ],
                    "similarityScore": 25,
                    "sampleSize": 10,
                    "reviewedSampleSize": 9,
                    "wins": 8,
                    "losses": 1,
                    "winRate": 0.8889,
                    "plannedRR": {
                        "count": 9,
                        "average": 2.46,
                    },
                }
            },
            evidence=[
                {
                    "ref": "intelligence.historical",
                    "source": "YOU_CANT_TRADE_HISTORICAL_SIMILARITY",
                }
            ],
        )

        system_prompt, user_prompt = agent.build_prompt(request)

        self.assertIn("Historical Analyst", system_prompt)
        self.assertIn(
            "Historical outcomes describe what happened in the past",
            system_prompt,
        )
        self.assertIn(
            "Do not calculate a new similarity score",
            system_prompt,
        )

        payload = json.loads(user_prompt)

        self.assertEqual(payload["tradeId"], "trade-123")
        self.assertEqual(
            payload["context"]["historical"]["sampleSize"],
            10,
        )
        self.assertEqual(
            payload["context"]["historical"]["winRate"],
            0.8889,
        )

    def test_parse_result_returns_historical_agent_result(self):
        agent = HistoricalAnalyst()

        request = AgentRequest(
            trade_id="trade-123",
            agent_id="historical-analyst",
            context={},
        )

        result = agent.parse_result(
            request,
            {
                "observations": [
                    {
                        "text": "The retrieved sample contains 10 similar trades.",
                        "evidenceRefs": [
                            "intelligence.historical"
                        ],
                    }
                ],
                "interpretations": [
                    {
                        "text": (
                            "The sample provides historical context, "
                            "but does not establish future performance."
                        ),
                        "evidenceRefs": [
                            "intelligence.historical"
                        ],
                        "confidence": "high",
                    }
                ],
                "unknowns": [],
                "evidenceRefs": [
                    "intelligence.historical"
                ],
            },
        )

        self.assertEqual(result.agent_id, "historical-analyst")
        self.assertEqual(result.status, "ok")
        self.assertEqual(len(result.observations), 1)
        self.assertEqual(len(result.interpretations), 1)


if __name__ == "__main__":
    unittest.main()