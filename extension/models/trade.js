export const TRADE_SCHEMA_VERSION = 4;

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

function emptyMarketContext() {
    return {
        trend: null,
        regime: null,
        volatility: null,
        momentum: null,
        session: null,
        higherTimeframe: null
    };
}

function emptyMarketStructure() {
    return {
        events: [],
        swings: [],
        levels: []
    };
}

export function createEmptyIntelligence() {
    return {
        marketContext: emptyMarketContext(),
        marketStructure: emptyMarketStructure(),
        setupFingerprint: { version: 1, features: [], tags: [], marketRegime: null },
        calculated: { features: {}, provenance: { source: "CALCULATED", confidence: 1, evidence: [] } },
        execution: { actualEntry: null, actualStopLoss: null, actualTakeProfit: null, entryTime: null, exitTime: null, stopMoved: null, targetMoved: null, partialExits: [], breakEven: null, slippage: null },
        behavior: { ruleViolations: [], tags: [], evidence: [] },
        rules: { applicable: [], satisfied: [], violated: [] },
        historical: { similarTradeIds: [], similarityScore: null, sampleSize: null, comparableStats: null, patternReferences: [] },
        ai: { analysis: null, evidence: [], memoryReferences: [], retrievedMemories: [], reasoning: null }
    };
}

// Future intelligence engines write only to this namespaced contract. Values
// are null/empty until an engine produces evidence; engines should attach
// provenance as { source, confidence, evidence } beside any populated value.
function normalizeIntelligence(value) {
    const defaults = createEmptyIntelligence();
    if (!value || typeof value !== "object" || Array.isArray(value)) return defaults;
    return {
        ...defaults,
        ...value,
        marketContext: { ...defaults.marketContext, ...(value.marketContext || {}) },
        marketStructure: { ...defaults.marketStructure, ...(value.marketStructure || {}) },
        setupFingerprint: { ...defaults.setupFingerprint, ...(value.setupFingerprint || {}) },
        calculated: { ...defaults.calculated, ...(value.calculated || {}) },
        execution: { ...defaults.execution, ...(value.execution || {}) },
        behavior: { ...defaults.behavior, ...(value.behavior || {}) },
        rules: { ...defaults.rules, ...(value.rules || {}) },
        historical: { ...defaults.historical, ...(value.historical || {}) },
        ai: { ...defaults.ai, ...(value.ai || {}) }
    };
}


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
        aiAnalysis: null,
        intelligence: createEmptyIntelligence()
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
        outcomeSource: typeof value.outcomeSource === "string" ? value.outcomeSource : null,
        outcomeEvidenceTime: numberOrNull(value.outcomeEvidenceTime),
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
        aiAnalysis: value.aiAnalysis ?? null,
        
        intelligence: normalizeIntelligence(value.intelligence)
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
