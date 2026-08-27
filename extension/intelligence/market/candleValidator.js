export function validateCandles(candles) {

    const errors = [];

    if (!Array.isArray(candles)) {
        return {
            valid: false,
            errors: ["Candles must be an array"]
        };
    }

    if (candles.length === 0) {
        return {
            valid: false,
            errors: ["No candle data available"]
        };
    }

    for (let i = 0; i < candles.length; i++) {

        const candle = candles[i];

        if (
            !Number.isFinite(candle.timestamp) ||
            !Number.isFinite(candle.open) ||
            !Number.isFinite(candle.high) ||
            !Number.isFinite(candle.low) ||
            !Number.isFinite(candle.close)
        ) {
            errors.push(
                `Invalid candle at index ${i}`
            );
        }

        if (i > 0) {

            if (
                candle.timestamp <=
                candles[i - 1].timestamp
            ) {
                errors.push(
                    `Candles are not strictly chronological at index ${i}`
                );
            }
        }

        if (candle.high < candle.low) {

            errors.push(
                `High is below low at index ${i}`
            );
        }

        if (
            candle.high < candle.open ||
            candle.high < candle.close
        ) {

            errors.push(
                `High is below OHLC value at index ${i}`
            );
        }

        if (
            candle.low > candle.open ||
            candle.low > candle.close
        ) {

            errors.push(
                `Low is above OHLC value at index ${i}`
            );
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}