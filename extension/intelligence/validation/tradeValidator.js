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

    if (typeof trade.timestamp !== "string" || !trade.timestamp.trim()) {
        errors.push("Timestamp is missing");
    }

    if (!trade.source || typeof trade.source !== "string") {
        errors.push("Source is missing");
    }

    if (!Number.isInteger(trade.schemaVersion) || trade.schemaVersion < 1) {
        errors.push("Schema version is invalid");
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

    if ([trade.entry, trade.stopLoss, trade.takeProfit].every(Number.isFinite)) {
        const validLong = trade.direction === "LONG" && trade.stopLoss < trade.entry && trade.entry < trade.takeProfit;
        const validShort = trade.direction === "SHORT" && trade.takeProfit < trade.entry && trade.entry < trade.stopLoss;
        if (!validLong && !validShort) errors.push("Risk/Reward levels do not match the trade direction");
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
