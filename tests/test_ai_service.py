import unittest
from unittest.mock import patch

from ai.providers.base import AIResponse
from ai.service import analyze_trade, analyze_trade_multi_agent


class FakeProvider:
    provider_name = "fake"

    def generate(
        self,
        *,
        system_prompt,
        user_prompt,
        model=None,
        response_format="json",
        max_tokens=None,
        temperature=None,
    ):
        return AIResponse(
            content='{"summary":"Grounded reflection.","action":"Record one specific decision detail."}',
            provider="fake",
            model="fake-model",
            usage={"test": 1},
        )


class AIServiceTests(unittest.TestCase):
    def test_analyze_trade_uses_provider_and_returns_provenance(self):
        trade = {
            "symbol": "BTCUSD",
            "timeframe": "15m",
            "direction": "LONG",
            "entry": 100,
            "stopLoss": 95,
            "takeProfit": 110,
            "result": "WIN",
            "exitPrice": 109,
            "setup": "BREAKOUT",
            "session": "LONDON",
            "planAdherence": "FOLLOWED",
            "executionTag": "CLEAN",
            "notes": "Waited for confirmation.",
            "emotions": ["CALM"],
            "intelligence": {
                "marketContext": {
                    "regime": {
                        "regime": "TRENDING",
                    },
                },
                "historical": {
                    "similarTradeIds": ["trade-1"],
                    "sampleSize": 1,
                },
            },
        }

        with patch(
            "ai.service.get_ai_provider",
            return_value=FakeProvider(),
        ) as get_provider:
            result = analyze_trade(trade)

        get_provider.assert_called_once()

        self.assertEqual(
            result["summary"],
            "Grounded reflection.",
        )
        self.assertEqual(
            result["action"],
            "Record one specific decision detail.",
        )
        self.assertEqual(
            result["provider"],
            "fake",
        )
        self.assertEqual(
            result["model"],
            "fake-model",
        )
        self.assertEqual(
            result["promptVersion"],
            "trade-reflection-v6",
        )
        self.assertEqual(
            result["usage"],
            {"test": 1},
        )

    @patch("ai.service._pipeline_model_name", return_value="fake-model")
    @patch("ai.service._pipeline_provider_name", return_value="fake")
    @patch("ai.service.AgentPipeline")
    @patch("ai.service.get_storage_provider")
    def test_multi_agent_uses_fresh_historical_context(
        self,
        get_storage_provider,
        pipeline_class,
        pipeline_provider_name,
        pipeline_model_name,
    ):
        trade = {
            "id": "trade-1",
            "symbol": "BTCUSD",
            "timeframe": "15m",
            "direction": "LONG",
            "intelligence": {
                "historical": {
                    "sampleSize": 1,
                    "similarityScore": 10,
                },
            },
        }

        fresh_historical = {
            "sampleSize": 10,
            "similarityScore": 25,
            "matches": [
                {
                    "id": "trade-2",
                    "similarityScore": 25,
                    "result": "WIN",
                }
            ],
        }

        get_storage_provider.return_value.get_trade.return_value = trade

        get_storage_provider.return_value.get_historical_context.return_value = (
            fresh_historical
        )

        pipeline_result = type(
            "PipelineResult",
            (),
            {
                "specialists": {},
                "synthesis_output": {
                    "summary": "Historical evidence reviewed.",
                    "action": "Record the relevant historical comparison.",
                    "keyObservations": [],
                    "unknowns": [],
                    "evidenceRefs": [],
                },
                "synthesis": None,
            },
        )()

        pipeline_class.return_value.run.return_value = pipeline_result

        result = analyze_trade_multi_agent("trade-1")

        get_storage_provider.return_value.get_historical_context.assert_called_once_with(
            "trade-1",
            limit=10,
        )

        pipeline_context = pipeline_class.return_value.run.call_args.kwargs[
            "context"
        ]

        self.assertEqual(
            pipeline_context["intelligence"]["historical"],
            fresh_historical,
        )

        self.assertEqual(
            result["summary"],
            "Historical evidence reviewed.",
        )

    @patch("ai.service._pipeline_provider_name", return_value="fake")
    @patch("ai.service.AgentPipeline")
    @patch("ai.service.get_storage_provider")
    def test_multi_agent_reuses_current_saved_reflection(
        self,
        get_storage_provider,
        pipeline_class,
        pipeline_provider_name,
    ):
        trade = {
            "id": "trade-1",
            "updatedAt": "2026-09-10T10:00:00Z",
        }

        saved_reflection = {
            "id": "reflection-1",
            "tradeId": "trade-1",
            "tradeUpdatedAt": "2026-09-10T10:00:00Z",
            "summary": "Previously generated reflection.",
            "keyObservations": ["Historical pattern reviewed."],
            "action": "Record the comparison.",
            "unknowns": [],
            "evidenceRefs": ["trade", "historical"],
            "model": "fake-model",
            "promptVersion": "multi-agent-v1",
            "contractVersion": 1,
            "createdAt": "2026-09-10T10:01:00Z",
        }

        storage = get_storage_provider.return_value
        storage.get_trade.return_value = trade
        storage.get_latest_ai_trade_reflection.return_value = saved_reflection

        result = analyze_trade_multi_agent("trade-1")

        self.assertEqual(
            result["summary"],
            "Previously generated reflection.",
        )
        storage.get_latest_ai_trade_reflection.assert_called_once_with("trade-1")
        pipeline_class.assert_not_called()

class AIProviderFactoryTests(unittest.TestCase):
    @patch("ai.provider_factory.get_setting")
    def test_ollama_is_default_provider(self, get_setting):
        get_setting.side_effect = lambda key, default=None: default

        from ai.provider_factory import get_ai_provider

        provider = get_ai_provider()

        self.assertEqual(provider.provider_name, "ollama")
        self.assertEqual(provider.model, "qwen3:4b")

    @patch("ai.provider_factory.get_api_key", return_value="test-key")
    @patch("ai.provider_factory.get_setting")
    def test_cloud_provider_requires_model_and_base_url(
        self,
        get_setting,
        get_api_key,
    ):
        settings = {
            "ai_provider": "openai",
            "ai_model": "test-model",
            "ai_base_url": "https://example.test/v1",
        }

        get_setting.side_effect = (
            lambda key, default=None: settings.get(key, default)
        )

        from ai.provider_factory import get_ai_provider

        provider = get_ai_provider()

        self.assertEqual(
            provider.provider_name,
            "openai",
        )
        self.assertEqual(
            provider.model,
            "test-model",
        )
        self.assertEqual(
            provider.base_url,
            "https://example.test/v1",
        )
        self.assertEqual(
            provider.api_key,
            "test-key",
        )

    @patch("ai.provider_factory.get_api_key", return_value=None)
    @patch("ai.provider_factory.get_setting")
    def test_cloud_provider_without_key_fails_closed(
        self,
        get_setting,
        get_api_key,
    ):
        settings = {
            "ai_provider": "openai",
            "ai_model": "test-model",
            "ai_base_url": "https://example.test/v1",
        }

        get_setting.side_effect = (
            lambda key, default=None: settings.get(key, default)
        )

        from ai.provider_factory import get_ai_provider

        with self.assertRaises(ValueError):
            get_ai_provider()

    def test_multi_agent_service_function_exists(self):
        from ai.service import analyze_trade_multi_agent

        self.assertTrue(callable(analyze_trade_multi_agent))




if __name__ == "__main__":
    unittest.main()