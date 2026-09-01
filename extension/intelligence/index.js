import { validateTrade } from "./validation/tradeValidator.js";
import { normalizeTrade } from "./normalization/tradeNormalizer.js";
import { calculateTradeFeatures } from "./features/tradeFeatures.js";
import { calculateSetupFingerprint } from "./features/setupFingerprint.js";
import { normalizeCandles } from "./market/candleNormalizer.js";
import { validateCandles } from "./market/candleValidator.js";
import { runV11 } from "./structure/v11.js";

import {
    detectStructuralSwings
} from "./structure/structuralSwingDetector.js";

import structureEngine from "./structure/structureEngine.js";


import {
    calculateMarketStatistics
} from "./market/marketStatistics.js";

import {
    calculateMarketRegime
} from "./market/regime/marketRegime.js";


export function processTrade(trade, marketData = null) {

    // ============================================================
    // 1. NORMALIZE
    // ============================================================

    const normalizedTrade =
        normalizeTrade(trade);


    // ============================================================
// MARKET DATA
// ============================================================

let candles = [];

if (marketData?.candles) {

    candles =
        normalizeCandles(
            marketData.candles
        );

    const candleValidation =
        validateCandles(candles);

    if (!candleValidation.valid) {

        console.warn(
            "⚠️ MARKET DATA VALIDATION FAILED:",
            candleValidation.errors
        );

        candles = [];
    }

}

console.log(
    "📈 CANONICAL CANDLES:",
    candles.length
);

const marketStatistics =
    calculateMarketStatistics(candles);

console.log(
    "📊 MARKET STATISTICS:",
    marketStatistics
);

const marketRegime =
    calculateMarketRegime(marketStatistics);

console.log(
    "🧭 MARKET REGIME:",
    marketRegime
);

// ============================================================
// STRUCTURE
// ============================================================

const structuralResult =
    detectStructuralSwings(
        candles
    );

console.log(
    "🧭 STRUCTURAL SWINGS:",
    structuralResult.structuralSwings.length
);

console.table(
    structuralResult.structuralSwings.map(
        (s, i) => ({
            index: i,
            type: s.type,
            price: s.price,
            time: s.time,
            confirmationTime: s.confirmationTime,
            fourHIndex: s.fourHIndex
        })
    )
);

const structureItems =
    candles.map(candle => ({
        value: [
            Number(candle.timestamp),
            Number(candle.open),
            Number(candle.high),
            Number(candle.low),
            Number(candle.close),
            Number(candle.volume ?? 0)
        ]
    }));

const structure =
    structureEngine.run({
        items: structureItems,
        structuralSwings:
            structuralResult.structuralSwings
    });

const v11Diagnostic =
    runV11({
        items: structureItems,
        structuralSwings:
            structuralResult.structuralSwings
    });

console.log(
    "🔬 V11 FINAL STRUCTURE:",
    JSON.stringify(
        {
            state: v11Diagnostic.state,
            activeHigh: v11Diagnostic.activeHigh,
            activeLow: v11Diagnostic.activeLow,
            protectedHigh: v11Diagnostic.protectedHigh,
            protectedLow: v11Diagnostic.protectedLow,
            bullishOrigin: v11Diagnostic.bullishOrigin,
            bearishOrigin: v11Diagnostic.bearishOrigin,
            bullishLegStart: v11Diagnostic.bullishLegStart,
            bearishLegStart: v11Diagnostic.bearishLegStart,
            events: v11Diagnostic.events,
            legUpdates: v11Diagnostic.legUpdates
        },
        null,
        2
    )
);

console.table(v11Diagnostic.events);
console.table(v11Diagnostic.legUpdates);

normalizedTrade.intelligence.structure = {
    ...structure,
    provenance: {
        source: "VANTAGEFORGE_STRUCTURE_ENGINE",
        confidence: 1,
        evidence: [
            {
                type: "STRUCTURAL_SWINGS",
                count:
                    structuralResult.structuralSwings.length
            }
        ]
    }
};

console.log(
    "🏗️ STRUCTURE STATE:",
    structure
);

normalizedTrade.intelligence.marketContext = {
    ...normalizedTrade.intelligence.marketContext,

    statistics: marketStatistics,

    regime: marketRegime,

    provenance: {
        source: "TRADINGVIEW",
        confidence: 1,
        evidence: [
            {
                type: "CANDLE_DATA",
                candleCount: candles.length
            }
        ]
    }
};


    // ============================================================
    // 2. VALIDATE
    // ============================================================

    const validation =
        validateTrade(normalizedTrade);


    if (!validation.valid) {

        console.warn(
            "⚠️ TRADE VALIDATION FAILED:",
            validation.errors
        );

        return {
            valid: false,
            errors: validation.errors,
            trade: normalizedTrade
        };

    }


    // ============================================================
    // 3. CALCULATE FEATURES
    // ============================================================

    const features =
        calculateTradeFeatures(
            normalizedTrade
        );

    normalizedTrade.intelligence.calculated = {
        features: features || {},
        provenance: { source: "CALCULATED", confidence: 1, evidence: [] }
    };

    const setupFingerprint =
        calculateSetupFingerprint({
            trade: normalizedTrade,
            marketContext:
                normalizedTrade.intelligence.marketContext,
            structure:
                normalizedTrade.intelligence.structure
        });

    normalizedTrade.intelligence.setupFingerprint =
        setupFingerprint;


    // ============================================================
    // 4. RETURN INTELLIGENCE OBJECT
    // ============================================================

    return {

        valid: true,

        trade: normalizedTrade,

        features

    };

}
