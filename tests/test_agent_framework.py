import json
import unittest

from ai.agents.base import (
    Agent,
    AgentContractError,
    AgentRequest,
)
from ai.agents.runner import AgentRunner


class FakeResponse:
    content = json.dumps({
        "observations": [
            {
                "text": "Structure was recorded as bullish.",
                "evidenceRefs": ["intelligence.marketContext"],
            }
        ],
        "interpretations": [
            {
                "text": "The setup was aligned with the recorded context.",
                "evidenceRefs": ["intelligence.marketContext"],
                "confidence": "medium",
            }
        ],
        "unknowns": [
            {
                "text": "No actual exit price was recorded.",
            }
        ],
        "evidenceRefs": ["intelligence.marketContext"],
    })


class FakeProvider:
    def generate(self, **kwargs):
        return FakeResponse()


class FakeAIService:
    def generate_structured(self, **kwargs):
        response = FakeProvider().generate(**kwargs)

        return (
            json.loads(response.content),
            response,
        )


class TestAgent(Agent):
    agent_id = "test-agent"

    def build_prompt(self, request):
        return (
            "You are a test agent.",
            json.dumps(request.to_dict()),
        )


class AgentFrameworkTests(unittest.TestCase):
    def test_request_serializes_to_contract(self):
        request = AgentRequest(
            trade_id="trade-1",
            agent_id="test-agent",
            context={"marketRegime": "trend"},
        )

        payload = request.to_dict()

        self.assertEqual(payload["tradeId"], "trade-1")
        self.assertEqual(payload["agentId"], "test-agent")
        self.assertEqual(payload["contractVersion"], 1)

    def test_runner_returns_structured_result(self):
        request = AgentRequest(
            trade_id="trade-1",
            agent_id="test-agent",
            context={"marketRegime": "trend"},
        )

        result = AgentRunner(FakeAIService()).run(
            TestAgent(),
            request,
        )

        self.assertEqual(result.status, "ok")
        self.assertEqual(result.agent_id, "test-agent")
        self.assertEqual(len(result.observations), 1)
        self.assertEqual(len(result.interpretations), 1)
        self.assertEqual(len(result.unknowns), 1)

    def test_invalid_request_fails_closed(self):
        request = AgentRequest(
            trade_id="",
            agent_id="test-agent",
            context={},
        )

        with self.assertRaises(AgentContractError):
            AgentRunner(FakeAIService()).run(
                TestAgent(),
                request,
            )


if __name__ == "__main__":
    unittest.main()