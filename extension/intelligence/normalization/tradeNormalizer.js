import { normalizeTrade as normalizeCanonicalTrade } from "../../models/trade.js";

export function normalizeTrade(trade) {
    if (!trade || typeof trade !== "object") return null;
    const candidate = {
        ...trade,
        direction: typeof trade.direction === "string" ? trade.direction.trim().toUpperCase() : trade.direction,
        symbol: typeof trade.symbol === "string" ? trade.symbol.trim().toUpperCase() : trade.symbol,
        entry: toNumberOrNull(trade.entry),
        stopLoss: toNumberOrNull(trade.stopLoss),
        takeProfit: toNumberOrNull(trade.takeProfit),
        exitPrice: toNumberOrNull(trade.exitPrice)
    };
    return normalizeCanonicalTrade(candidate);
}

function toNumberOrNull(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}
