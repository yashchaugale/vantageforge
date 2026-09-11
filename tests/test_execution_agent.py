import json
import unittest

from ai.agents.base import AgentRequest
from ai.agents.execution import ExecutionAnalyst


class ExecutionAnalystTests(unittest.TestCase):
    def test_agent_has_stable_id(self):
        self.assertEqual(
            ExecutionAnalyst.agent_id,
            "execution-analyst",
        )

    def test_build_prompt_contains_execution_context(self):
        agent = ExecutionAnalyst()

        request = AgentRequest(
            trade_id="trade-123",
            agent_id="execution-analyst",
            context={
                "direction": "LONG",
                "entryPrice": 100,
                "stopPrice": 95,
                "targetPrice": 110,
                "exitPrice": None,
                "result": "WIN",
                "execution": {
                    "plannedEntry": 100,
                    "plannedStop": 95,
                    "plannedTarget": 110,
                    "actualEntry": 100.2,
                    "actualExit": None,
                },
            },
            evidence=[
                {
                    "ref": "intelligence.execution",
                    "source": "YOU_CANT_TRADE_EXECUTION_ENGINE",
                }
            ],
        )

        system_prompt, user_prompt = agent.build_prompt(request)

        self.assertIn("Execution Analyst", system_prompt)
        self.assertIn(
            "planned values from actual values",
            system_prompt,
        )
        self.assertIn(
            "Do not invent missing execution facts",
            system_prompt,
        )

        payload = json.loads(user_prompt)

        self.assertEqual(payload["tradeId"], "trade-123")
        self.assertEqual(
            payload["context"]["direction"],
            "LONG",
        )
        self.assertEqual(
            payload["context"]["execution"]["actualEntry"],
            100.2,
        )
        self.assertIsNone(
            payload["context"]["execution"]["actualExit"],
        )

    def test_parse_result_returns_execution_agent_result(self):
        agent = ExecutionAnalyst()

        request = AgentRequest(
            trade_id="trade-123",
            agent_id="execution-analyst",
            context={},
        )

        result = agent.parse_result(
            request,
            {
                "observations": [
                    {
                        "text": "The planned target is 110.",
                        "evidenceRefs": [
                            "trade.targetPrice"
                        ],
                    }
                ],
                "interpretations": [
                    {
                        "text": (
                            "Actual exit quality cannot be evaluated "
                            "because no actual exit price is recorded."
                        ),
                        "evidenceRefs": [
                            "trade.exitPrice"
                        ],
                        "confidence": "high",
                    }
                ],
                "unknowns": [
                    {
                        "text": "Actual exit price is not recorded."
                    }
                ],
                "evidenceRefs": [
                    "trade.targetPrice",
                    "trade.exitPrice",
                ],
            },
        )

        self.assertEqual(result.agent_id, "execution-analyst")
        self.assertEqual(result.status, "ok")
        self.assertEqual(len(result.observations), 1)
        self.assertEqual(len(result.interpretations), 1)
        self.assertEqual(len(result.unknowns), 1)


if __name__ == "__main__":
    unittest.main()