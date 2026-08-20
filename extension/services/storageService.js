import {
    isValidTradeForSave,
    normalizeTrade
} from "../models/trade.js";

export const TRADES_KEY = "trades";

const STORAGE_SOFT_LIMIT_BYTES = 9 * 1024 * 1024;


export class TradeStorageError extends Error {

    constructor(message) {

        super(message);
        this.name = "TradeStorageError";
    }
}


async function getRawTrades() {

    const result = await chrome.storage.local.get([TRADES_KEY]);

    return Array.isArray(result[TRADES_KEY])
        ? result[TRADES_KEY]
        : [];
}


function serializedBytes(value) {

    return new TextEncoder()
        .encode(JSON.stringify(value))
        .length;
}


async function ensureCapacityFor(trade) {

    const currentUsage =
        await chrome.storage.local.getBytesInUse(null);

    if (
        currentUsage + serializedBytes(trade) >=
        STORAGE_SOFT_LIMIT_BYTES
    ) {
        throw new TradeStorageError(
            "VantageForge storage is nearly full. Export or remove old screenshots before capturing another trade."
        );
    }
}


export async function getTrades() {

    const trades = await getRawTrades();

    return trades
        .map(normalizeTrade)
        .filter(Boolean);
}


export async function getStorageUsage() {

    const bytes = await chrome.storage.local.getBytesInUse(null);

    return {
        bytes,
        limitBytes: STORAGE_SOFT_LIMIT_BYTES,
        percent: Math.min(
            100,
            (bytes / STORAGE_SOFT_LIMIT_BYTES) * 100
        )
    };
}


export async function saveTrade(trade) {

    if (!isValidTradeForSave(trade)) {
        throw new TradeStorageError(
            "VantageForge could not save this trade because its data is invalid."
        );
    }

    const normalisedTrade = normalizeTrade(trade);

    if (!normalisedTrade) {
        throw new TradeStorageError(
            "VantageForge could not save this trade because its ID is invalid."
        );
    }

    await ensureCapacityFor(normalisedTrade);

    const trades = await getRawTrades();

    trades.push(normalisedTrade);

    await chrome.storage.local.set({
        [TRADES_KEY]: trades
    });
}


export async function updateTrade(tradeId, changes) {

    const trades = await getRawTrades();

    const index = trades.findIndex(
        trade => trade?.id === tradeId
    );

    if (index === -1) {
        return null;
    }

    if (!isValidTradeForSave({
        ...changes,
        id: tradeId
    })) {
        throw new TradeStorageError(
            "VantageForge could not save the trade changes because the data is invalid."
        );
    }

    const updatedTrade = normalizeTrade({
        ...trades[index],
        ...changes,
        id: trades[index].id,
        updatedAt: new Date().toISOString()
    });

    if (!updatedTrade || !isValidTradeForSave(updatedTrade)) {
        throw new TradeStorageError(
            "VantageForge could not save the trade changes because the data is invalid."
        );
    }

    trades[index] = updatedTrade;

    await chrome.storage.local.set({
        [TRADES_KEY]: trades
    });

    return updatedTrade;
}
