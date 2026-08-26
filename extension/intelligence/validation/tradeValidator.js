export function validateTrade(trade) {

    const errors = [];

    if (!trade) {
        errors.push("Trade is missing");
        return {
            valid: false,
            errors
        };
    }

    if (!trade.id) {
        errors.push("Trade ID is missing");
    }

    if (!trade.symbol) {
        errors.push("Symbol is missing");
    }

    if (!trade.direction) {
        errors.push("Direction is missing");
    }

    if (
        trade.direction &&
        !["LONG", "SHORT"].includes(trade.direction)
    ) {
        errors.push(
            `Invalid direction: ${trade.direction}`
        );
    }

    if (
        trade.entry !== null &&
        trade.entry !== undefined &&
        typeof trade.entry !== "number"
    ) {
        errors.push("Entry must be a number");
    }

    if (
        trade.stopLoss !== null &&
        trade.stopLoss !== undefined &&
        typeof trade.stopLoss !== "number"
    ) {
        errors.push("Stop loss must be a number");
    }

    if (
        trade.takeProfit !== null &&
        trade.takeProfit !== undefined &&
        typeof trade.takeProfit !== "number"
    ) {
        errors.push("Take profit must be a number");
    }

    return {
        valid: errors.length === 0,
        errors
    };
}