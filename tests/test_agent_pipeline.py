import json
import unittest

from ai.agents.base import AgentResult
from ai.agents.pipeline import AgentPipeline
from ai.agents.runner import AgentRunner


class FakeResponse:
    def __init__(self, content):
        self.content = content


class FakeProvider:
    def __init__(self):
        self.calls = []

    def generate(self, **kwargs):
        self.calls.append(kwargs)

        call_number = len(self.calls)

        if call_number == 1:
            return FakeResponse(json.dumps({
                "observations": [{
                    "text": "Structure evidence was supplied.",
                    "evidenceRefs": ["intelligence.marketStructure"],
                }],
                "interpretations": [],
                "unknowns": [],
                "evidenceRefs": ["intelligence.marketStructure"],
            }))

        if call_number == 2:
            return FakeResponse(json.dumps({
                "observations": [{
                    "text": "Historical evidence was supplied.",
                    "evidenceRefs": ["intelligence.historical"],
                }],
                "interpretations": [],
                "unknowns": [],
                "evidenceRefs": ["intelligence.historical"],
            }))

        if call_number in (3, 4):
            return FakeResponse(json.dumps({
                "observations": [],
                "interpretations": [],
                "unknowns": [],
                "evidenceRefs": [],
            }))

        if call_number == 5:
            return FakeResponse(json.dumps({
                "summary": "The recorded trade aligned with the supplied evidence.",
                "keyObservations": ["Specialist evidence was available."],
                "action": "Record the same evidence in the next review.",
                "unknowns": [],
                "evidenceRefs": ["intelligence.marketStructure"],
            }))

        raise AssertionError("unexpected agent request")


class FakeAIService:
    def __init__(self):
        self.provider = FakeProvider()

    def generate_structured(self, **kwargs):
        response = self.provider.generate(**kwargs)

        return (
            json.loads(response.content),
            response,
        )


class AgentPipelineTests(unittest.TestCase):
    def test_pipeline_runs_four_specialists_and_synthesis(self):
        ai_service = FakeAIService()
        pipeline = AgentPipeline(
            AgentRunner(ai_service)
        )

        result = pipeline.run(
            trade_id="trade-123",
            context={
                "trade": {
                    "symbol": "BTCUSD",
                    "timeframe": "15m",
                    "direction": "LONG",
                    "chartAnchorTime": 1234567890000,
                },
                "intelligence": {
                    "marketContext": {
                        "trend": "bullish",
                    },
                    "marketStructure": {
                        "events": [],
                        "swings": [],
                        "levels": [],
                    },
                    "setupFingerprint": {
                        "features": [],
                        "tags": [],
                    },
                    "historical": {
                        "sampleSize": 10,
                    },
                },
            },
        )

        self.assertEqual(
            result.trade_id,
            "trade-123",
        )

        self.assertEqual(
            set(result.specialists.keys()),
            {
                "structure-analyst",
                "historical-analyst",
                "behavior-analyst",
                "execution-analyst",
            },
        )

        self.assertTrue(
            all(
                specialist.status == "ok"
                for specialist in result.specialists.values()
            ),
            {agent_id: result.specialists[agent_id].error for agent_id in result.specialists},
        )

        self.assertIsNotNone(result.synthesis)
        self.assertEqual(
            result.synthesis.status,
            "ok",
        )

        self.assertIsNotNone(result.synthesis_output)

        self.assertEqual(
            len(ai_service.provider.calls),
            5,
        )

    def test_specialist_context_is_restricted(self):
        pipeline = AgentPipeline(
            AgentRunner(FakeAIService())
        )

        context = {
            "trade": {
                "symbol": "BTCUSD",
                "timeframe": "15m",
                "direction": "LONG",
                "chartAnchorTime": 123,
                "entryPrice": 100,
                "stopPrice": 95,
                "result": "WIN",
            },
            "intelligence": {
                "marketContext": {
                    "trend": "bullish"
                },
                "marketStructure": {
                    "events": []
                },
                "historical": {
                    "sampleSize": 10
                },
                "behavior": {
                    "ruleViolations": [
                        "early-exit"
                    ]
                },
                "execution": {
                    "actualEntry": 100.2
                },
            },
        }

        structure_context = pipeline._specialist_context(
            "structure-analyst",
            context,
        )

        self.assertIn(
            "marketStructure",
            structure_context,
        )

        self.assertIn(
            "marketContext",
            structure_context,
        )

        self.assertNotIn(
            "historical",
            structure_context,
        )

        self.assertNotIn(
            "behavior",
            structure_context,
        )

    def test_pipeline_survives_specialist_failure(self):
        class FailingProvider:
            def generate(self, **kwargs):
                raise RuntimeError(
                    "provider unavailable"
                )

        class FailingAIService:
            provider = FailingProvider()

        pipeline = AgentPipeline(
            AgentRunner(FailingAIService())
        )

        result = pipeline.run(
            trade_id="trade-123",
            context={},
        )

        self.assertEqual(
            len(result.specialists),
            4,
        )

        self.assertTrue(
            all(
                specialist.status == "error"
                for specialist in result.specialists.values()
            )
        )

        self.assertEqual(
            result.synthesis.status,
            "error",
        )


if __name__ == "__main__":
    unittest.main()