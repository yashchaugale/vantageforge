// ============================================================
// MARKET STATISTICS
// ============================================================

export function calculatePriceStatistics(candles) {

    if (!Array.isArray(candles) || candles.length === 0) {
        return {
            current: null,
            previous: null,
            change: null,
            changePercent: null
        };
    }

    const current =
        candles[candles.length - 1];

    const previous =
        candles.length > 1
            ? candles[candles.length - 2]
            : null;

    const currentPrice =
        Number(current.close);

    const previousPrice =
        previous
            ? Number(previous.close)
            : null;

    let change = null;
    let changePercent = null;

    if (
        Number.isFinite(currentPrice) &&
        Number.isFinite(previousPrice)
    ) {

        change =
            currentPrice - previousPrice;

        if (previousPrice !== 0) {

            changePercent =
                (change / previousPrice) * 100;

        }

    }

    return {
        current: currentPrice,
        previous: previousPrice,
        change,
        changePercent
    };
}

export function calculateRangeStatistics(candles) {

    if (!Array.isArray(candles) || candles.length === 0) {
        return {
            high: null,
            low: null,
            position: null
        };
    }

    const highs = candles
        .map(candle => Number(candle.high))
        .filter(Number.isFinite);

    const lows = candles
        .map(candle => Number(candle.low))
        .filter(Number.isFinite);

    if (highs.length === 0 || lows.length === 0) {
        return {
            high: null,
            low: null,
            position: null
        };
    }

    const high = Math.max(...highs);
    const low = Math.min(...lows);

    const current =
        Number(candles[candles.length - 1].close);

    let position = null;

    if (
        Number.isFinite(current) &&
        high > low
    ) {
        position =
            (current - low) / (high - low);
    }

    return {
        high,
        low,
        position
    };
}




export function calculateVolatilityStatistics(candles) {

    if (!Array.isArray(candles) || candles.length === 0) {
        return {
            averageRange: null,
            recentRange: null,
            largestRange: null,
            rangeRatio: null
        };
    }

    const ranges = candles
        .map(candle =>
            Number(candle.high) - Number(candle.low)
        )
        .filter(Number.isFinite);

    if (ranges.length === 0) {
        return {
            averageRange: null,
            recentRange: null,
            largestRange: null,
            rangeRatio: null
        };
    }

    const averageRange =
        ranges.reduce(
            (sum, range) => sum + range,
            0
        ) / ranges.length;

    const recentRange =
        ranges[ranges.length - 1];

    const largestRange =
        Math.max(...ranges);

    const rangeRatio =
        averageRange > 0
            ? recentRange / averageRange
            : null;

    return {
        averageRange,
        recentRange,
        largestRange,
        rangeRatio
    };
}

export function calculateCandleDirectionStatistics(candles) {

    if (!Array.isArray(candles) || candles.length === 0) {
        return {
            bullishCount: 0,
            bearishCount: 0,
            neutralCount: 0,
            bullishRatio: null,
            bearishRatio: null
        };
    }

    let bullishCount = 0;
    let bearishCount = 0;
    let neutralCount = 0;

    for (const candle of candles) {

        const open = Number(candle.open);
        const close = Number(candle.close);

        if (
            !Number.isFinite(open) ||
            !Number.isFinite(close)
        ) {
            continue;
        }

        if (close > open) {
            bullishCount++;
        } else if (close < open) {
            bearishCount++;
        } else {
            neutralCount++;
        }
    }

    const total =
        bullishCount +
        bearishCount +
        neutralCount;

    return {
        bullishCount,
        bearishCount,
        neutralCount,

        bullishRatio:
            total > 0
                ? bullishCount / total
                : null,

        bearishRatio:
            total > 0
                ? bearishCount / total
                : null
    };
}

export function calculateVolumeStatistics(candles) {

    if (!Array.isArray(candles) || candles.length === 0) {
        return {
            current: null,
            average: null,
            relative: null
        };
    }

    const volumes = candles
        .map(candle => Number(candle.volume))
        .filter(Number.isFinite);

    if (volumes.length === 0) {
        return {
            current: null,
            average: null,
            relative: null
        };
    }

    const current =
        volumes[volumes.length - 1];

    const average =
        volumes.reduce(
            (sum, volume) => sum + volume,
            0
        ) / volumes.length;

    const relative =
        average > 0
            ? current / average
            : null;

    return {
        current,
        average,
        relative
    };
}

export function getRecentCandles(candles, lookback = 50) {

    if (!Array.isArray(candles)) {
        return [];
    }

    const safeLookback =
        Number.isInteger(lookback) && lookback > 0
            ? lookback
            : 50;

    return candles.slice(-safeLookback);
}

export function calculateMarketStatistics(candles, options = {}) {

    const lookback =
        Number.isInteger(options.lookback) && options.lookback > 0
            ? options.lookback
            : 50;

    const recentCandles =
        getRecentCandles(candles, lookback);

    return {
        lookback,

        price:
            calculatePriceStatistics(recentCandles),

        range:
            calculateRangeStatistics(recentCandles),


        volatility:
            calculateVolatilityStatistics(recentCandles),

        direction:
            calculateCandleDirectionStatistics(recentCandles),

        volume:
            calculateVolumeStatistics(recentCandles)
    };
}