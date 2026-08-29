// ============================================================
// VANTAGEFORGE
// STRUCTURAL SWING DETECTOR
//
// PURPOSE:
// Convert chronological TradingView candles into confirmed
// structural HIGH / LOW levels.
//
// INPUT:
// canonical candles
//
// OUTPUT:
// structuralSwings
//
// IMPORTANT:
// This module is intentionally isolated from V11-V14.
// V11-V14 consume the resulting swings and own structural
// state evolution.
// ============================================================


const STRUCTURAL_SWING_DETECTOR =
    "VANTAGEFORGE_STRUCTURAL_SWING_DETECTOR_V1";


// ============================================================
// NORMALIZE CANDLE
// ============================================================

function normalizeCandle(candle) {

    if (!candle) {
        return null;
    }

    const timestamp =
        Number(
            candle.timestamp
        );

    const high =
        Number(
            candle.high
        );

    const low =
        Number(
            candle.low
        );

    if (
        !Number.isFinite(timestamp) ||
        !Number.isFinite(high) ||
        !Number.isFinite(low)
    ) {
        return null;
    }

    return {
        timestamp,
        high,
        low
    };
}


// ============================================================
// AGGREGATE 15M → 4H
// ============================================================

function aggregate4HCandles(candles) {

    const groups = new Map();

    for (const candle of candles) {

        const normalized =
            normalizeCandle(candle);

        if (!normalized) {
            continue;
        }

        const FOUR_HOURS =
            4 * 60 * 60;

        const bucket =
            Math.floor(
                normalized.timestamp /
                FOUR_HOURS
            ) * FOUR_HOURS;

        if (!groups.has(bucket)) {

            groups.set(
                bucket,
                {
                    timestamp: bucket,
                    high: normalized.high,
                    low: normalized.low
                }
            );

        } else {

            const group =
                groups.get(bucket);

            group.high =
                Math.max(
                    group.high,
                    normalized.high
                );

            group.low =
                Math.min(
                    group.low,
                    normalized.low
                );
        }
    }

    return [...groups.values()]
        .sort(
            (a, b) =>
                a.timestamp -
                b.timestamp
        );
}


// ============================================================
// DETECT CONFIRMED SWINGS
// ============================================================
//
// IMPORTANT:
// A swing is only emitted after both neighboring 4H candles
// exist.
//
// This prevents using future information before confirmation.
// ============================================================

function detectConfirmedSwings(
    candles
) {

    const swings = [];

    for (
        let index = 1;
        index < candles.length - 1;
        index++
    ) {

        const previous =
            candles[index - 1];

        const current =
            candles[index];

        const next =
            candles[index + 1];


        // ----------------------------------------------------
        // HIGH
        // ----------------------------------------------------

        const isHigh =
            current.high > previous.high &&
            current.high >= next.high;


        // ----------------------------------------------------
        // LOW
        // ----------------------------------------------------

        const isLow =
            current.low < previous.low &&
            current.low <= next.low;


        // ----------------------------------------------------
        // HIGH SWING
        // ----------------------------------------------------

        if (isHigh) {

            swings.push({

                type:
                    "HIGH",

                price:
                    Number(
                        current.high
                    ),

                time:
                    Number(
                        current.timestamp
                    ),

                confirmationTime:
                    Number(
                        next.timestamp
                    ),

                fourHTime:
                    Number(
                        current.timestamp
                    ),

                fourHIndex:
                    index
            });
        }


        // ----------------------------------------------------
        // LOW SWING
        // ----------------------------------------------------

        if (isLow) {

            swings.push({

                type:
                    "LOW",

                price:
                    Number(
                        current.low
                    ),

                time:
                    Number(
                        current.timestamp
                    ),

                confirmationTime:
                    Number(
                        next.timestamp
                    ),

                fourHTime:
                    Number(
                        current.timestamp
                    ),

                fourHIndex:
                    index
            });
        }
    }


    return swings.sort(
        (a, b) =>
            Number(a.time) -
            Number(b.time)
    );
}


// ============================================================
// PUBLIC API
// ============================================================

export function detectStructuralSwings(
    candles = []
) {

    if (!Array.isArray(candles)) {

        throw new Error(
            "Structural swing detector: candles must be an array."
        );
    }


    const fourHCandles =
        aggregate4HCandles(
            candles
        );


    const structuralSwings =
        detectConfirmedSwings(
            fourHCandles
        );


    console.log(
        "🧭 STRUCTURAL SWINGS:",
        {
            sourceCandles:
                candles.length,

            fourHCandles:
                fourHCandles.length,

            structuralSwings:
                structuralSwings.length
        }
    );


    return {

        engine:
            STRUCTURAL_SWING_DETECTOR,

        timeframe:
            "4H",

        sourceTimeframe:
            "15M",

        candles:
            fourHCandles,

        structuralSwings
    };
}

