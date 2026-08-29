import { validateTrade } from "./validation/tradeValidator.js";
import { normalizeTrade } from "./normalization/tradeNormalizer.js";
import { calculateTradeFeatures } from "./features/tradeFeatures.js";
import { normalizeCandles } from "./market/candleNormalizer.js";
import { validateCandles } from "./market/candleValidator.js";
import { runV14 } from "./structure/v14.js";

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


    // ============================================================
    // 4. RETURN INTELLIGENCE OBJECT
    // ============================================================

    return {

        valid: true,

        trade: normalizedTrade,

        features

    };

}
