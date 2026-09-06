import json
import unittest

from ai.agents.base import AgentContractError, AgentRequest
from ai.agents.synthesis import SynthesisAgent


class SynthesisAgentTests(unittest.TestCase):
    def test_agent_has_stable_id(self):
        self.assertEqual(
            SynthesisAgent.agent_id,
            "synthesis-agent",
        )

    def test_build_prompt_contains_specialist_outputs(self):
        agent = SynthesisAgent()

        request = AgentRequest(
            trade_id="trade-123",
            agent_id="synthesis-agent",
            context={
                "trade": {
                    "symbol": "BTCUSD",
                    "direction": "LONG",
                    "result": "WIN",
                },
                "intelligence": {
                    "marketContext": {
                        "trend": "bullish",
                    },
                    "historical": {
                        "sampleSize": 10,
                    },
                },
                "specialists": {
                    "structure": {
                        "status": "ok",
                        "observations": [
                            "Bullish BOS recorded."
                        ],
                    },
                    "historical": {
                        "status": "ok",
                        "observations": [
                            "10 similar trades retrieved."
                        ],
                    },
                    "behavior": {
                        "status": "ok",
                        "observations": [],
                    },
                    "execution": {
                        "status": "ok",
                        "observations": [],
                    },
                },
            },
            evidence=[
                {
                    "ref": "intelligence.marketContext"
                }
            ],
        )

        system_prompt, user_prompt = agent.build_prompt(request)

        self.assertIn(
            "Synthesis Agent",
            system_prompt,
        )
        self.assertIn(
            "Recorded trade facts",
            system_prompt,
        )
        self.assertIn(
            "Do not turn historical outcomes into predictions",
            system_prompt,
        )

        payload = json.loads(user_prompt)

        self.assertEqual(
            payload["tradeId"],
            "trade-123",
        )
        self.assertEqual(
            payload["context"]["specialists"]["structure"]["status"],
            "ok",
        )
        self.assertEqual(
            payload["context"]["specialists"]["historical"][
                "observations"
            ][0],
            "10 similar trades retrieved.",
        )

    def test_parse_result_returns_synthesis_output(self):
        agent = SynthesisAgent()

        request = AgentRequest(
            trade_id="trade-123",
            agent_id="synthesis-agent",
            context={},
        )

        result = agent.parse_result(
            request,
            {
                "summary": (
                    "The trade followed the recorded bullish structure. "
                    "Historical evidence provides context but does not "
                    "establish future performance."
                ),
                "keyObservations": [
                    "Bullish structure was recorded.",
                    "The historical sample contains 10 similar trades.",
                ],
                "action": (
                    "Record whether the same structural condition "
                    "appears in the next review."
                ),
                "unknowns": [
                    "Actual exit price was not recorded."
                ],
                "evidenceRefs": [
                    "intelligence.marketStructure",
                    "intelligence.historical",
                ],
            },
        )

        output = agent.extract_output(result)

        self.assertEqual(
            result.agent_id,
            "synthesis-agent",
        )
        self.assertEqual(
            result.status,
            "ok",
        )
        self.assertIn(
            "bullish structure",
            output["summary"],
        )
        self.assertEqual(
            len(output["keyObservations"]),
            2,
        )
        self.assertEqual(
            len(output["unknowns"]),
            1,
        )

    def test_missing_summary_fails_closed(self):
        agent = SynthesisAgent()

        request = AgentRequest(
            trade_id="trade-123",
            agent_id="synthesis-agent",
            context={},
        )

        with self.assertRaises(AgentContractError):
            agent.parse_result(
                request,
                {
                    "keyObservations": [],
                    "action": "",
                    "unknowns": [],
                    "evidenceRefs": [],
                },
            )


if __name__ == "__main__":
    unittest.main()