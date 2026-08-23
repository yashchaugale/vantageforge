import {
    isValidTradeForSave,
    normalizeTrade
} from "../models/trade.js";
import {
    getLocalStorageUsage,
    getLocalTrades,
    LocalApiUnavailableError,
    saveLocalTrade,
    updateLocalTrade,
    deleteLocalTrade
} from "./localApiService.js";

export const TRADES_KEY = "trades";

const STORAGE_SOFT_LIMIT_BYTES = 9 * 1024 * 1024;

let localSyncAttempted = false;


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

    try {
        const localTrades = await getLocalTrades();

        if (!localSyncAttempted) {
            localSyncAttempted = true;
            const cachedTrades = await getRawTrades();
            const remoteIds = new Set(localTrades.map(trade => trade.id));

            for (const cachedTrade of cachedTrades) {
                if (!remoteIds.has(cachedTrade?.id)) {
                    await saveLocalTrade(normalizeTrade(cachedTrade));
                }
            }

            return cachedTrades.length > 0 && localTrades.length === 0
                ? await getLocalTrades()
                : localTrades;
        }

        return localTrades;
    } catch (error) {
        if (!(error instanceof LocalApiUnavailableError)) {
            throw error;
        }
    }

    const trades = await getRawTrades();

    return trades
        .map(normalizeTrade)
        .filter(Boolean);
}


export async function getStorageUsage() {

    try {
        return await getLocalStorageUsage();
    } catch (error) {
        if (!(error instanceof LocalApiUnavailableError)) {
            throw error;
        }
    }

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

    try {
        return await saveLocalTrade(normalisedTrade);
    } catch (error) {
        if (!(error instanceof LocalApiUnavailableError)) {
            throw error;
        }
    }

    await ensureCapacityFor(normalisedTrade);

    const trades = await getRawTrades();

    trades.push(normalisedTrade);

    await chrome.storage.local.set({
        [TRADES_KEY]: trades
    });
}


export async function deleteTrade(tradeId) {
    try {
        await deleteLocalTrade(tradeId);
    } catch (error) {
        if (!(error instanceof LocalApiUnavailableError)) throw error;
        const trades = await getRawTrades();
        await chrome.storage.local.set({
            [TRADES_KEY]: trades.filter(trade => trade?.id !== tradeId)
        });
    }
}


export async function updateTrade(tradeId, changes) {

    const trades = await getRawTrades();

    let index = trades.findIndex(
        trade => trade?.id === tradeId
    );

    let existingTrade = index === -1 ? null : trades[index];

    if (!existingTrade) {
        try {
            existingTrade = (await getLocalTrades())
                .find(trade => trade.id === tradeId);
        } catch (error) {
            if (!(error instanceof LocalApiUnavailableError)) {
                throw error;
            }
        }
    }

    if (!existingTrade) {
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
        ...existingTrade,
        ...changes,
        status: changes.result ? "REVIEWED" : existingTrade.status,
        id: tradeId,
        updatedAt: new Date().toISOString()
    });

    if (!updatedTrade || !isValidTradeForSave(updatedTrade)) {
        throw new TradeStorageError(
            "VantageForge could not save the trade changes because the data is invalid."
        );
    }

    try {
        return await updateLocalTrade(updatedTrade);
    } catch (error) {
        if (!(error instanceof LocalApiUnavailableError)) {
            throw error;
        }
    }

    if (index === -1) {
        return null;
    }

    trades[index] = updatedTrade;

    await chrome.storage.local.set({
        [TRADES_KEY]: trades
    });

    return updatedTrade;
}
