import os
import tempfile
import unittest
import importlib


class LocalDatabaseCompatibilityTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        os.environ["VANTAGEFORGE_DATA_DIR"] = self.temp_dir.name
        import database.local_database as database
        database = importlib.reload(database)
        self.database = database
        database.initialise()

    def tearDown(self):
        self.temp_dir.cleanup()
        os.environ.pop("VANTAGEFORGE_DATA_DIR", None)

    def test_canonical_intelligence_round_trip(self):
        trade = {
            "id": "fixture-db-trade",
            "schemaVersion": 4,
            "timestamp": "2026-08-27T10:00:00.000Z",
            "updatedAt": "2026-08-27T10:00:00.000Z",
            "symbol": "BTCUSD",
            "direction": "LONG",
            "entry": 100,
            "stopLoss": 95,
            "takeProfit": 110,
            "intelligence": {"marketContext": {"trend": None}},
        }
        saved = self.database.upsert_trade(trade)
        self.assertEqual(saved["schemaVersion"], 4)
        self.assertEqual(saved["intelligence"]["marketContext"]["trend"], None)

    def test_legacy_rows_are_read_after_migration(self):
        with self.database.connect() as connection:
            connection.execute("insert into trades (id, schema_version, captured_at, updated_at) values (?, ?, ?, ?)", ("legacy", 3, "2026-01-01T00:00:00Z", "2026-01-01T00:00:00Z"))
        self.database.initialise()
        legacy = self.database.get_trade("legacy")
        self.assertIsNotNone(legacy)
        self.assertEqual(legacy["schemaVersion"], 4)
        self.assertIn("marketStructure", legacy["intelligence"])

    def test_similarity_prefers_canonical_market_context_and_structure(self):
        source = {
            "id": "source",
            "symbol": "BTCUSD",
            "timeframe": "15m",
            "direction": "LONG",
            "setup": "breakout",
            "intelligence": {
                "marketContext": {
                    "regime": "CONTRACTING",
                    "direction": "DOWN",
                },
                "marketStructure": {
                    "state": "BEARISH",
                    "events": [
                        {"event": "BEARISH_BOS", "time": 100},
                    ],
                },
                "setupFingerprint": {
                    "features": [
                        "LONG",
                        "CONTRACTING",
                        "BEARISH_STRUCTURE",
                    ],
                    "tags": ["COUNTER_STRUCTURE"],
                },
            },
        }

        canonical_match = {
            "id": "canonical-match",
            "symbol": "BTCUSD",
            "timeframe": "15m",
            "direction": "LONG",
            "setup": "different-setup",
            "intelligence": {
                "marketContext": {
                    "regime": "CONTRACTING",
                    "direction": "DOWN",
                },
                "marketStructure": {
                    "state": "BEARISH",
                    "events": [
                        {"event": "BEARISH_BOS", "time": 200},
                    ],
                },
                "setupFingerprint": {
                    "features": [
                        "LONG",
                        "CONTRACTING",
                        "BEARISH_STRUCTURE",
                    ],
                    "tags": ["COUNTER_STRUCTURE"],
                },
            },
        }

        journal_match = {
            "id": "journal-match",
            "symbol": "BTCUSD",
            "timeframe": "15m",
            "direction": "LONG",
            "setup": "breakout",
            "intelligence": {
                "marketContext": {
                    "regime": "EXPANDING",
                    "direction": "UP",
                },
                "marketStructure": {
                    "state": "BULLISH",
                    "events": [
                        {"event": "BULLISH_BOS", "time": 200},
                    ],
                },
                "setupFingerprint": {
                    "features": ["LONG"],
                    "tags": [],
                },
            },
        }

        canonical_score = self.database._canonical_similarity_score(
            source,
            canonical_match,
        )
        journal_score = self.database._canonical_similarity_score(
            source,
            journal_match,
        )

        self.assertGreater(canonical_score, journal_score)

    def test_similarity_does_not_use_result(self):
        source = {
            "id": "source",
            "symbol": "BTCUSD",
            "timeframe": "15m",
            "direction": "LONG",
            "result": "WIN",
            "intelligence": {
                "marketContext": {
                    "regime": "CONTRACTING",
                    "direction": "DOWN",
                },
                "marketStructure": {
                    "state": "BEARISH",
                },
                "setupFingerprint": {
                    "features": ["LONG", "CONTRACTING"],
                    "tags": ["COUNTER_STRUCTURE"],
                },
            },
        }

        same_context_win = {
            "id": "win",
            "symbol": "BTCUSD",
            "timeframe": "15m",
            "direction": "LONG",
            "result": "WIN",
            "intelligence": source["intelligence"],
        }

        same_context_loss = {
            "id": "loss",
            "symbol": "BTCUSD",
            "timeframe": "15m",
            "direction": "LONG",
            "result": "LOSS",
            "intelligence": source["intelligence"],
        }

        win_score = self.database._canonical_similarity_score(
            source,
            same_context_win,
        )
        loss_score = self.database._canonical_similarity_score(
            source,
            same_context_loss,
        )

        self.assertEqual(win_score, loss_score)

    def test_similarity_supports_trades_without_intelligence(self):
        source = {
            "id": "source",
            "symbol": "BTCUSD",
            "timeframe": "15m",
            "direction": "LONG",
            "setup": "breakout",
            "session": "LONDON",
            "intelligence": {},
        }

        legacy_match = {
            "id": "legacy",
            "symbol": "BTCUSD",
            "timeframe": "15m",
            "direction": "LONG",
            "setup": "breakout",
            "session": "LONDON",
            "intelligence": {},
        }

        score = self.database._canonical_similarity_score(
            source,
            legacy_match,
        )

        self.assertEqual(score, 14)


if __name__ == "__main__":
    unittest.main()
