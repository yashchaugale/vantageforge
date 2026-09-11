import json
import unittest

from ai.agents.base import AgentRequest
from ai.agents.structure import StructureAnalyst


class StructureAnalystTests(unittest.TestCase):
    def test_agent_has_stable_id(self):
        self.assertEqual(
            StructureAnalyst.agent_id,
            "structure-analyst",
        )

    def test_build_prompt_contains_deterministic_context(self):
        agent = StructureAnalyst()

        request = AgentRequest(
            trade_id="trade-123",
            agent_id="structure-analyst",
            context={
                "marketContext": {
                    "trend": "bullish",
                    "regime": "trend",
                },
                "marketStructure": {
                    "events": [
                        {
                            "type": "BOS",
                            "direction": "bullish",
                        }
                    ],
                    "swings": [],
                    "levels": [],
                },
                "setupFingerprint": {
                    "features": ["bullish-bos"],
                    "tags": ["trend-following"],
                },
            },
            evidence=[
                {
                    "ref": "intelligence.marketStructure",
                    "source": "YOU_CANT_TRADE_STRUCTURE_ENGINE",
                }
            ],
        )

        system_prompt, user_prompt = agent.build_prompt(request)

        self.assertIn("Structure Analyst", system_prompt)
        self.assertIn("Do not calculate or invent", system_prompt)

        payload = json.loads(user_prompt)

        self.assertEqual(payload["tradeId"], "trade-123")
        self.assertEqual(
            payload["context"]["marketContext"]["trend"],
            "bullish",
        )
        self.assertEqual(
            payload["context"]["marketStructure"]["events"][0]["type"],
            "BOS",
        )

    def test_parse_result_returns_structure_agent_result(self):
        agent = StructureAnalyst()

        request = AgentRequest(
            trade_id="trade-123",
            agent_id="structure-analyst",
            context={},
        )

        result = agent.parse_result(
            request,
            {
                "observations": [
                    {
                        "text": "A bullish BOS is recorded.",
                        "evidenceRefs": [
                            "intelligence.marketStructure"
                        ],
                    }
                ],
                "interpretations": [
                    {
                        "text": "The recorded setup aligns with that structure.",
                        "evidenceRefs": [
                            "intelligence.marketStructure"
                        ],
                        "confidence": "medium",
                    }
                ],
                "unknowns": [],
                "evidenceRefs": [
                    "intelligence.marketStructure"
                ],
            },
        )

        self.assertEqual(result.agent_id, "structure-analyst")
        self.assertEqual(result.status, "ok")
        self.assertEqual(len(result.observations), 1)
        self.assertEqual(len(result.interpretations), 1)


if __name__ == "__main__":
    unittest.main()