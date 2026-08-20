export const TRADE_SCHEMA_VERSION = 3;

const VALID_RESULTS = new Set([
    "WIN",
    "LOSS",
    "BE"
]);

export const TRADING_SESSIONS = [
    "ASIA",
    "LONDON",
    "NEW_YORK",
    "OTHER"
];

export const PLAN_ADHERENCE_OPTIONS = [
    "FOLLOWED",
    "DEVIATED"
];

export const EXECUTION_TAG_OPTIONS = [
    "FOLLOWED_PLAN",
    "EARLY_ENTRY",
    "LATE_ENTRY",
    "MOVED_STOP",
    "EARLY_EXIT",
    "OVERTRADED",
    "OTHER"
];

const VALID_SESSIONS = new Set(TRADING_SESSIONS);
const VALID_PLAN_ADHERENCE = new Set(PLAN_ADHERENCE_OPTIONS);
const VALID_EXECUTION_TAGS = new Set(EXECUTION_TAG_OPTIONS);


function stringOrEmpty(value) {

    return typeof value === "string"
        ? value
        : "";
}


function numberOrNull(value) {

    return Number.isFinite(value)
        ? value
        : null;
}


function emotionsOrEmpty(value) {

    return Array.isArray(value)
        ? value.filter(
            emotion =>
                typeof emotion === "string"
        )
        : [];
}


function enumOrNull(value, allowedValues) {

    return allowedValues.has(value)
        ? value
        : null;
}


export function createTrade() {

    const timestamp = new Date().toISOString();

    return {
        id: crypto.randomUUID(),
        schemaVersion: TRADE_SCHEMA_VERSION,
        timestamp,
        updatedAt: timestamp,
        status: "CAPTURED",
        source: "TRADINGVIEW",
        url: "",
        title: "",
        screenshot: null,
        symbol: "",
        timeframe: "",
        exchange: "",
        chartAnchorTime: null,
        chartAnchorInterval: null,
        direction: null,
        entry: null,
        stopLoss: null,
        takeProfit: null,
        exitPrice: null,
        result: null,
        setup: "",
        session: null,
        planAdherence: null,
        executionTag: null,
        notes: "",
        emotions: [],
        aiAnalysis: null
    };
}


export function normalizeTrade(value) {

    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    const id = stringOrEmpty(value.id);

    if (!id) {
        return null;
    }

    const timestamp = stringOrEmpty(value.timestamp);
    const result = VALID_RESULTS.has(value.result)
        ? value.result
        : null;

    return {
        id,
        schemaVersion: TRADE_SCHEMA_VERSION,
        timestamp,
        updatedAt: stringOrEmpty(value.updatedAt) || timestamp,
        status: stringOrEmpty(value.status) || "CAPTURED",
        source: stringOrEmpty(value.source) || "TRADINGVIEW",
        url: stringOrEmpty(value.url),
        title: stringOrEmpty(value.title),
        screenshot: typeof value.screenshot === "string"
            ? value.screenshot
            : null,
        symbol: stringOrEmpty(value.symbol),
        timeframe: stringOrEmpty(value.timeframe),
        exchange: stringOrEmpty(value.exchange),
        chartAnchorTime: numberOrNull(value.chartAnchorTime),
        chartAnchorInterval: typeof value.chartAnchorInterval === "string"
            ? value.chartAnchorInterval
            : null,
        direction: value.direction === "LONG" || value.direction === "SHORT"
            ? value.direction
            : null,
        entry: numberOrNull(value.entry),
        stopLoss: numberOrNull(value.stopLoss),
        takeProfit: numberOrNull(value.takeProfit),
        exitPrice: numberOrNull(value.exitPrice),
        result,
        setup: stringOrEmpty(value.setup),
        session: enumOrNull(value.session, VALID_SESSIONS),
        planAdherence: enumOrNull(
            value.planAdherence,
            VALID_PLAN_ADHERENCE
        ),
        executionTag: enumOrNull(
            value.executionTag,
            VALID_EXECUTION_TAGS
        ),
        notes: stringOrEmpty(value.notes),
        emotions: emotionsOrEmpty(value.emotions),
        aiAnalysis: value.aiAnalysis ?? null
    };
}


export function isValidTradeForSave(value) {

    if (!value || typeof value !== "object") {
        return false;
    }

    if (!stringOrEmpty(value.id)) {
        return false;
    }

    if (
        value.result != null &&
        !VALID_RESULTS.has(value.result)
    ) {
        return false;
    }

    if (
        value.session != null &&
        !VALID_SESSIONS.has(value.session)
    ) {
        return false;
    }

    if (
        value.planAdherence != null &&
        !VALID_PLAN_ADHERENCE.has(value.planAdherence)
    ) {
        return false;
    }

    if (
        value.executionTag != null &&
        !VALID_EXECUTION_TAGS.has(value.executionTag)
    ) {
        return false;
    }

    if (
        value.setup != null &&
        typeof value.setup !== "string"
    ) {
        return false;
    }

    if (
        value.chartAnchorTime != null &&
        !Number.isFinite(value.chartAnchorTime)
    ) {
        return false;
    }

    if (
        value.chartAnchorInterval != null &&
        typeof value.chartAnchorInterval !== "string"
    ) {
        return false;
    }

    return [
        value.entry,
        value.stopLoss,
        value.takeProfit,
        value.exitPrice
    ].every(
        price =>
            price == null || Number.isFinite(price)
    );
}
