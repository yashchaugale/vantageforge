function calculateDirectionalMovement(marketStatistics) {

    const rawBullishRatio =
    marketStatistics?.direction?.bullishRatio;

const rawBearishRatio =
    marketStatistics?.direction?.bearishRatio;

if (
    rawBullishRatio === null ||
    rawBullishRatio === undefined ||
    rawBearishRatio === null ||
    rawBearishRatio === undefined
) {
    return {
        direction: null,
        strength: null
    };
}

const bullishRatio =
    Number(rawBullishRatio);

const bearishRatio =
    Number(rawBearishRatio);

    if (
        !Number.isFinite(bullishRatio) ||
        !Number.isFinite(bearishRatio)
    ) {
        return {
            direction: null,
            strength: null
        };
    }

    const difference =
        bullishRatio - bearishRatio;

    return {
        direction:
            difference > 0
                ? "UP"
                : difference < 0
                    ? "DOWN"
                    : "NEUTRAL",

        strength:
            Math.abs(difference)
    };
}

function calculatePriceProgression(marketStatistics) {

    const rawCurrent =
    marketStatistics?.price?.current;

const rawChangePercent =
    marketStatistics?.price?.changePercent;

if (
    rawCurrent === null ||
    rawCurrent === undefined ||
    rawChangePercent === null ||
    rawChangePercent === undefined
) {
    return {
        direction: null,
        magnitude: null
    };
}

const current =
    Number(rawCurrent);

const changePercent =
    Number(rawChangePercent);

    if (
        !Number.isFinite(current) ||
        !Number.isFinite(changePercent)
    ) {
        return {
            direction: null,
            magnitude: null
        };
    }

    return {
        direction:
            changePercent > 0
                ? "UP"
                : changePercent < 0
                    ? "DOWN"
                    : "NEUTRAL",

        magnitude:
            Math.abs(changePercent)
    };
}

function calculateVolatilityState(marketStatistics) {

    const rawRangeRatio =
    marketStatistics?.volatility?.rangeRatio;

if (
    rawRangeRatio === null ||
    rawRangeRatio === undefined
) {
    return {
        state: null,
        magnitude: null
    };
}

const rangeRatio =
    Number(rawRangeRatio);

if (!Number.isFinite(rangeRatio)) {
        return {
            state: null,
            magnitude: null
        };
    }

    if (rangeRatio >= 1.5) {
        return {
            state: "EXPANDING",
            magnitude: rangeRatio
        };
    }

    if (rangeRatio <= 0.67) {
        return {
            state: "CONTRACTING",
            magnitude: rangeRatio
        };
    }

    return {
        state: "NORMAL",
        magnitude: rangeRatio
    };
}

// ============================================================
// MARKET REGIME
// ============================================================

const REGIMES = Object.freeze({
    TRENDING: "TRENDING",
    RANGING: "RANGING",
    EXPANDING: "EXPANDING",
    CONTRACTING: "CONTRACTING",
    UNCERTAIN: "UNCERTAIN"
});

export function calculateMarketRegime(marketStatistics) {

    if (
        !marketStatistics ||
        typeof marketStatistics !== "object"
    ) {
        return {
    regime: REGIMES.UNCERTAIN,
    direction: null,
    confidence: 0,
    evidence: []
};
    }

    const {
        directionalMovement,
        priceProgression,
        volatilityState,
        evidence
    } = collectRegimeEvidence(marketStatistics);

    const directionAgreement =
        directionalMovement.direction &&
        priceProgression.direction &&
        directionalMovement.direction ===
            priceProgression.direction;

    const directionalStrength =
        Number(directionalMovement.strength);

    const priceMagnitude =
        Number(priceProgression.magnitude);

    if (
        directionAgreement &&
        Number.isFinite(directionalStrength) &&
        Number.isFinite(priceMagnitude) &&
        directionalStrength >= 0.25 &&
        priceMagnitude >= 0.5
    ) {

        const confidence =
            Math.min(
                1,
                (
                    directionalStrength +
                    Math.min(priceMagnitude / 5, 1)
                ) / 2
            );

        return {
    regime: REGIMES.TRENDING,
    direction: directionalMovement.direction,
    confidence,
    evidence
};
    }

    if (
        volatilityState.state === "EXPANDING"
    ) {

        return {
    regime: REGIMES.EXPANDING,
    direction:
        directionalMovement.direction === "NEUTRAL"
            ? null
            : directionalMovement.direction,
    confidence: Math.min(
        1,
        Math.max(
            0,
            (volatilityState.magnitude - 1.5) / 1.5
        )
    ),
    evidence
};
    }

    if (
        volatilityState.state === "CONTRACTING"
    ) {

        return {
    regime: REGIMES.CONTRACTING,
    direction:
        directionalMovement.direction === "NEUTRAL"
            ? null
            : directionalMovement.direction,
    confidence: Math.min(
        1,
        Math.max(
            0,
            (1 - volatilityState.magnitude) / 0.33
        )
    ),
    evidence
};
    }

    const weakDirection =
    directionalMovement.direction !== null &&
    Number.isFinite(directionalMovement.strength) &&
    directionalMovement.strength < 0.20;

const weakPriceMovement =
    priceProgression.direction !== null &&
    Number.isFinite(priceProgression.magnitude) &&
    priceProgression.magnitude < 0.50;

const normalVolatility =
    volatilityState.state === "NORMAL";

if (
    (
        directionalMovement.direction === "NEUTRAL" &&
        priceProgression.direction === "NEUTRAL"
    ) ||
    (
        weakDirection &&
        weakPriceMovement &&
        normalVolatility
    )
) {
    return {
        regime: REGIMES.RANGING,
        direction: null,
        confidence: 0.7,
        evidence
    };
}

    return {
    regime: REGIMES.UNCERTAIN,
    direction: null,
    confidence: 0,
    evidence
};
}

export { REGIMES };

function collectRegimeEvidence(marketStatistics) {

    const directionalMovement =
        calculateDirectionalMovement(marketStatistics);

    const priceProgression =
        calculatePriceProgression(marketStatistics);

    const volatilityState =
        calculateVolatilityState(marketStatistics);

    const evidence = [];

    if (directionalMovement.direction) {
        evidence.push({
            type: "DIRECTIONAL_MOVEMENT",
            direction: directionalMovement.direction,
            strength: directionalMovement.strength
        });
    }

    if (priceProgression.direction) {
        evidence.push({
            type: "PRICE_PROGRESSION",
            direction: priceProgression.direction,
            magnitude: priceProgression.magnitude
        });
    }

    if (volatilityState.state) {
        evidence.push({
            type: "VOLATILITY_STATE",
            state: volatilityState.state,
            magnitude: volatilityState.magnitude
        });
    }

    return {
        directionalMovement,
        priceProgression,
        volatilityState,
        evidence
    };
}