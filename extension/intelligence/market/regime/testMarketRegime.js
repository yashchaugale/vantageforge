import {
    calculateMarketRegime
} from "./marketRegime.js";


function test(name, marketStatistics) {

    const result =
        calculateMarketRegime(marketStatistics);

    console.log(`\n=== ${name} ===`);

    console.log(
        JSON.stringify(
            result,
            null,
            2
        )
    );
}


// ============================================================
// 1. STRONG UPWARD MARKET
// ============================================================

test(
    "STRONG UP",
    {
        direction: {
            bullishRatio: 0.75,
            bearishRatio: 0.15
        },

        price: {
            current: 110,
            changePercent: 2
        },

        volatility: {
            rangeRatio: 1.1
        }
    }
);


// ============================================================
// 2. STRONG DOWNWARD MARKET
// ============================================================

test(
    "STRONG DOWN",
    {
        direction: {
            bullishRatio: 0.15,
            bearishRatio: 0.75
        },

        price: {
            current: 90,
            changePercent: -2
        },

        volatility: {
            rangeRatio: 1.1
        }
    }
);


// ============================================================
// 3. EXPANDING MARKET
// ============================================================

test(
    "EXPANDING",
    {
        direction: {
            bullishRatio: 0.45,
            bearishRatio: 0.45
        },

        price: {
            current: 100,
            changePercent: 0
        },

        volatility: {
            rangeRatio: 1.8
        }
    }
);


// ============================================================
// 4. CONTRACTING MARKET
// ============================================================

test(
    "CONTRACTING",
    {
        direction: {
            bullishRatio: 0.45,
            bearishRatio: 0.45
        },

        price: {
            current: 100,
            changePercent: 0
        },

        volatility: {
            rangeRatio: 0.5
        }
    }
);


// ============================================================
// 5. RANGING MARKET
// ============================================================

test(
    "RANGING",
    {
        direction: {
            bullishRatio: 0.5,
            bearishRatio: 0.5
        },

        price: {
            current: 100,
            changePercent: 0
        },

        volatility: {
            rangeRatio: 1
        }
    }
);


// ============================================================
// 6. UNCERTAIN MARKET
// ============================================================

test(
    "UNCERTAIN",
    {
        direction: {
            bullishRatio: 0.65,
            bearishRatio: 0.35
        },

        price: {
            current: 100,
            changePercent: -1
        },

        volatility: {
            rangeRatio: 1.1
        }
    }
);