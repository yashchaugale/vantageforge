import test from "node:test";
import assert from "node:assert/strict";
import { normalizeTrade, TRADE_SCHEMA_VERSION, isValidTradeForSave } from "../extension/models/trade.js";
import { processTrade } from "../extension/intelligence/index.js";
import { validateTrade } from "../extension/intelligence/validation/tradeValidator.js";

const base = {
    id: "fixture-long-win",
    timestamp: "2026-08-27T10:00:00.000Z",
    source: "TRADINGVIEW",
    symbol: "BTCUSD",
    timeframe: "15m",
    exchange: "Bitstamp",
    direction: "LONG",
    entry: 100,
    stopLoss: 95,
    takeProfit: 110,
    result: "WIN",
    exitPrice: 110,
    notes: "Waited for confirmation",
    emotions: ["calm"]
};

test("normalization creates the versioned intelligence contract", () => {
    const trade = normalizeTrade(base);
    assert.equal(trade.schemaVersion, TRADE_SCHEMA_VERSION);
    assert.equal(trade.symbol, "BTCUSD");
    assert.deepEqual(trade.intelligence.marketContext, { trend: null, regime: null, volatility: null, momentum: null, session: null, higherTimeframe: null });
    assert.deepEqual(trade.intelligence.marketStructure.events, []);
    assert.deepEqual(trade.intelligence.setupFingerprint.tags, []);
    assert.deepEqual(trade.intelligence.historical.similarTradeIds, []);
    assert.equal(trade.notes, base.notes);
});

test("legacy schema remains readable and migrates idempotently", () => {
    const legacy = normalizeTrade({ ...base, schemaVersion: 3, intelligence: undefined });
    const migratedAgain = normalizeTrade(legacy);
    assert.equal(legacy.schemaVersion, TRADE_SCHEMA_VERSION);
    assert.deepEqual(migratedAgain, legacy);
});

test("valid long and short trades pass deterministic validation", () => {
    assert.equal(processTrade(base).valid, true);
    assert.equal(processTrade({ ...base, id: "fixture-short-win", direction: "SHORT", entry: 100, stopLoss: 105, takeProfit: 90 }).valid, true);
    assert.equal(processTrade({ ...base, id: "fixture-long-loss", result: "LOSS", exitPrice: 95 }).valid, true);
    assert.equal(processTrade({ ...base, id: "fixture-short-loss", direction: "SHORT", entry: 100, stopLoss: 105, takeProfit: 90, result: "LOSS", exitPrice: 105 }).valid, true);
});

test("user-authored behaviour fields and missing intelligence are preserved", () => {
    const trade = normalizeTrade({ ...base, id: "fixture-emotions", notes: "Followed the plan", emotions: ["focused", "calm"], setup: "London sweep" });
    assert.deepEqual(trade.emotions, ["focused", "calm"]);
    assert.equal(trade.notes, "Followed the plan");
    assert.equal(trade.intelligence.behavior.tags.length, 0);
});

test("invalid directional RR levels fail validation", () => {
    assert.equal(processTrade({ ...base, id: "invalid-long", stopLoss: 105 }).valid, false);
    assert.equal(processTrade({ ...base, id: "invalid-short", direction: "SHORT", stopLoss: 95, takeProfit: 110 }).valid, false);
});

test("required identity and provenance fields are validated", () => {
    const result = validateTrade({ ...base, id: "", timestamp: "", source: "" });
    assert.equal(result.valid, false);
    assert.ok(result.errors.includes("Trade ID is missing"));
    assert.ok(result.errors.includes("Timestamp is missing"));
    assert.ok(result.errors.includes("Source is missing"));
});

test("optional intelligence remains explicitly empty", () => {
    const trade = normalizeTrade({ ...base, id: "unknown-outcome", result: null, exitPrice: null, notes: "", emotions: [] });
    assert.equal(trade.result, null);
    assert.equal(trade.intelligence.marketContext.trend, null);
    assert.deepEqual(trade.intelligence.behavior.ruleViolations, []);
    assert.equal(isValidTradeForSave(trade), true);
});


test("setup fingerprint ignores CHOCH events after the trade chart anchor", async () => {
    const { calculateSetupFingerprint } =
        await import("../extension/intelligence/features/setupFingerprint.js");

    const trade = {
        ...base,
        id: "fixture-fingerprint-anchor",
        chartAnchorTime: 1788144300000
    };

    const structure = {
        state: "BEARISH",
        events: [
            {
                event: "BEARISH_CHOCH",
                time: 1788138000
            },
            {
                event: "BULLISH_CHOCH",
                time: 1788156000
            }
        ]
    };

    const fingerprint = calculateSetupFingerprint({
        trade,
        marketContext: {
            regime: "RANGING"
        },
        structure
    });

    assert.equal(
        fingerprint.marketRegime,
        "RANGING"
    );

    assert.ok(
        fingerprint.features.includes(
            "POST_BEARISH_CHOCH"
        )
    );

    assert.equal(
        fingerprint.features.includes(
            "POST_BULLISH_CHOCH"
        ),
        false
    );
});
