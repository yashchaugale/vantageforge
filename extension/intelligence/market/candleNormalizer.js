const VALID_SOURCES = new Set([
    "TRADINGVIEW"
]);

export function normalizeCandle(candle) {

    if (!candle || typeof candle !== "object") {
        return null;
    }

    const timestamp = Number(candle.timestamp);
    const open = Number(candle.open);
    const high = Number(candle.high);
    const low = Number(candle.low);
    const close = Number(candle.close);

    const volume =
        candle.volume === null ||
        candle.volume === undefined
            ? null
            : Number(candle.volume);

    if (
        !Number.isFinite(timestamp) ||
        !Number.isFinite(open) ||
        !Number.isFinite(high) ||
        !Number.isFinite(low) ||
        !Number.isFinite(close)
    ) {
        return null;
    }

    if (
        high < low ||
        high < open ||
        high < close ||
        low > open ||
        low > close
    ) {
        return null;
    }

    return {
        timestamp,
        open,
        high,
        low,
        close,
        volume:
            Number.isFinite(volume)
                ? volume
                : null
    };
}


export function normalizeCandles(candles) {

    if (!Array.isArray(candles)) {
        return [];
    }

    const normalized = candles
        .map(normalizeCandle)
        .filter(Boolean)
        .sort(
            (a, b) =>
                a.timestamp - b.timestamp
        );

    return deduplicateCandles(normalized);
}


function deduplicateCandles(candles) {

    const map = new Map();

    for (const candle of candles) {
        map.set(candle.timestamp, candle);
    }

    return [...map.values()]
        .sort(
            (a, b) =>
                a.timestamp - b.timestamp
        );
}