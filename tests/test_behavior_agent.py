import json
import unittest

from ai.agents.base import AgentRequest
from ai.agents.behavior import BehaviorAnalyst


class BehaviorAnalystTests(unittest.TestCase):
    def test_agent_has_stable_id(self):
        self.assertEqual(
            BehaviorAnalyst.agent_id,
            "behavior-analyst",
        )

    def test_build_prompt_contains_behavior_context(self):
        agent = BehaviorAnalyst()

        request = AgentRequest(
            trade_id="trade-123",
            agent_id="behavior-analyst",
            context={
                "review": {
                    "planAdherence": "partial",
                    "emotions": ["fear"],
                    "executionTag": "early-exit",
                },
                "behavior": {
                    "ruleViolations": [
                        "Exited before planned target"
                    ],
                    "tags": ["early-exit"],
                    "evidence": [
                        "Trade review records an early exit."
                    ],
                },
                "rules": {
                    "applicable": ["Hold planned target"],
                    "satisfied": [],
                    "violated": ["Hold planned target"],
                },
            },
            evidence=[
                {
                    "ref": "intelligence.behavior",
                    "source": "YOU_CANT_TRADE_BEHAVIOR_ENGINE",
                }
            ],
        )

        system_prompt, user_prompt = agent.build_prompt(request)

        self.assertIn("Behavior Analyst", system_prompt)
        self.assertIn(
            "Do not infer psychological states",
            system_prompt,
        )
        self.assertIn(
            "Do not diagnose the trader",
            system_prompt,
        )

        payload = json.loads(user_prompt)

        self.assertEqual(payload["tradeId"], "trade-123")
        self.assertEqual(
            payload["context"]["review"]["planAdherence"],
            "partial",
        )
        self.assertEqual(
            payload["context"]["behavior"]["ruleViolations"][0],
            "Exited before planned target",
        )

    def test_parse_result_returns_behavior_agent_result(self):
        agent = BehaviorAnalyst()

        request = AgentRequest(
            trade_id="trade-123",
            agent_id="behavior-analyst",
            context={},
        )

        result = agent.parse_result(
            request,
            {
                "observations": [
                    {
                        "text": "The review records partial plan adherence.",
                        "evidenceRefs": [
                            "trade.review.planAdherence"
                        ],
                    }
                ],
                "interpretations": [
                    {
                        "text": (
                            "The recorded early exit is a process "
                            "deviation from the stated plan."
                        ),
                        "evidenceRefs": [
                            "intelligence.behavior"
                        ],
                        "confidence": "high",
                    }
                ],
                "unknowns": [],
                "evidenceRefs": [
                    "trade.review.planAdherence",
                    "intelligence.behavior",
                ],
            },
        )

        self.assertEqual(result.agent_id, "behavior-analyst")
        self.assertEqual(result.status, "ok")
        self.assertEqual(len(result.observations), 1)
        self.assertEqual(len(result.interpretations), 1)


if __name__ == "__main__":
    unittest.main()