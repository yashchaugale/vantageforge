import { validateTrade } from "./validation/tradeValidator.js";
import { normalizeTrade } from "./normalization/tradeNormalizer.js";
import { calculateTradeFeatures } from "./features/tradeFeatures.js";


export function processTrade(trade) {

    // ============================================================
    // 1. NORMALIZE
    // ============================================================

    const normalizedTrade =
        normalizeTrade(trade);


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


    // ============================================================
    // 4. RETURN INTELLIGENCE OBJECT
    // ============================================================

    return {

        valid: true,

        trade: normalizedTrade,

        features

    };

}