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


if __name__ == "__main__":
    unittest.main()
