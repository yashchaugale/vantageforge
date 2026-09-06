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

        user_prompt = kwargs["user_prompt"]

        if "trade-123" not in user_prompt:
            raise AssertionError("unexpected trade id")

        if "structure-analyst" not in user_prompt:
            raise AssertionError(
                "expected structure specialist"
            )

        if "historical-analyst" not in user_prompt:
            raise AssertionError(
                "expected historical specialist"
            )

        if "behavior-analyst" not in user_prompt:
            raise AssertionError(
                "expected behavior specialist"
            )

        if "execution-analyst" not in user_prompt:
            raise AssertionError(
                "expected execution specialist"
            )

        return FakeResponse(
            json.dumps(
                {
                    "specialists": {
                        "structure-analyst": {
                            "observations": [
                                {
                                    "text": "Structure evidence was supplied.",
                                    "evidenceRefs": [
                                        "intelligence.marketStructure"
                                    ],
                                }
                            ],
                            "interpretations": [],
                            "unknowns": [],
                            "evidenceRefs": [
                                "intelligence.marketStructure"
                            ],
                        },
                        "historical-analyst": {
                            "observations": [
                                {
                                    "text": "Historical evidence was supplied.",
                                    "evidenceRefs": [
                                        "intelligence.historical"
                                    ],
                                }
                            ],
                            "interpretations": [],
                            "unknowns": [],
                            "evidenceRefs": [
                                "intelligence.historical"
                            ],
                        },
                        "behavior-analyst": {
                            "observations": [],
                            "interpretations": [],
                            "unknowns": [],
                            "evidenceRefs": [],
                        },
                        "execution-analyst": {
                            "observations": [],
                            "interpretations": [],
                            "unknowns": [],
                            "evidenceRefs": [],
                        },
                    },
                    "synthesis": {
                        "summary": (
                            "The recorded trade aligned with "
                            "the supplied evidence."
                        ),
                        "keyObservations": [
                            "Specialist evidence was available."
                        ],
                        "action": (
                            "Record the same evidence in the "
                            "next review."
                        ),
                        "unknowns": [],
                        "evidenceRefs": [
                            "intelligence.marketStructure"
                        ],
                    },
                }
            )
        )


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
            )
        )

        self.assertIsNotNone(result.synthesis)
        self.assertEqual(
            result.synthesis.status,
            "ok",
        )

        self.assertIsNotNone(result.synthesis_output)

        self.assertEqual(
            len(ai_service.provider.calls),
            1,
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