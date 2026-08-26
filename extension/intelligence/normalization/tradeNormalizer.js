export function normalizeTrade(trade) {

    if (!trade) {
        return null;
    }

    const normalized = {
        ...trade
    };

    // Normalize direction
    if (normalized.direction) {

        normalized.direction =
            normalized.direction
                .toString()
                .trim()
                .toUpperCase();

    }

    // Normalize symbol
    if (normalized.symbol) {

        normalized.symbol =
            normalized.symbol
                .toString()
                .trim()
                .toUpperCase();

    }

    // Normalize numeric fields
    normalized.entry =
        toNumberOrNull(normalized.entry);

    normalized.stopLoss =
        toNumberOrNull(normalized.stopLoss);

    normalized.takeProfit =
        toNumberOrNull(normalized.takeProfit);

    normalized.exitPrice =
        toNumberOrNull(normalized.exitPrice);

    return normalized;
}


function toNumberOrNull(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : null;
}