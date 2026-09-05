import unittest
from unittest.mock import patch

from ai.providers.base import AIResponse
from ai.service import analyze_trade


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
                    "regime": "TRENDING",
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

class AIProviderFactoryTests(unittest.TestCase):
    @patch("ai.provider_factory.get_setting")
    def test_ollama_is_default_provider(self, get_setting):
        get_setting.side_effect = lambda key, default=None: default

        from ai.provider_factory import get_ai_provider

        provider = get_ai_provider()

        self.assertEqual(provider.provider_name, "ollama")
        self.assertEqual(provider.model, "qwen2.5:0.5b-instruct")

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




if __name__ == "__main__":
    unittest.main()