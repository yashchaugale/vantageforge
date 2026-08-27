import {
    normalizeCandles
} from "./candleNormalizer.js";

import {
    validateCandles
} from "./candleValidator.js";

import {
    calculateMarketStatistics
} from "./marketStatistics.js";


const rawCandles = [
    {
        timestamp: 3,
        open: 103,
        high: 110,
        low: 100,
        close: 108,
        volume: 50
    },
    {
        timestamp: 1,
        open: 100,
        high: 105,
        low: 98,
        close: 103,
        volume: 40
    },
    {
        timestamp: 2,
        open: 103,
        high: 106,
        low: 101,
        close: 103,
        volume: 45
    }
];


const candles =
    normalizeCandles(rawCandles);


console.log(
    "NORMALIZED CANDLES:",
    candles
);


const validation =
    validateCandles(candles);


console.log(
    "CANDLE VALIDATION:",
    validation
);

const statistics =
    calculateMarketStatistics(candles);

console.log(
    "MARKET STATISTICS:",
    JSON.stringify(statistics, null, 2)
);