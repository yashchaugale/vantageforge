// ============================================================
// VANTAGEFORGE
// STRUCTURE ENGINE
// Production structural-state interface
//
// SOURCE:
// structuralSwings
// chronologicalBreaks
// items
//
// FLOW:
// CONFIRMED SWINGS
//      ↓
// ACTIVE LEVELS
//      ↓
// BOS / CHOCH
//      ↓
// PROTECTED LEVEL
//      ↓
// BOS ORIGIN
//      ↓
// CURRENT STRUCTURAL STATE
// ============================================================
import { runV14 } from "./v14.js";

const STRUCTURE_ENGINE_NAME =
    "VANTAGEFORGE_STRUCTURE_ENGINE";


// ============================================================
// HELPERS
// ============================================================

function clone(value) {
    if (value === null || value === undefined) {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(clone);
    }

    if (typeof value === "object") {
        const result = {};

        for (const key of Object.keys(value)) {
            result[key] = clone(value[key]);
        }

        return result;
    }

    return value;
}


// ============================================================
// NORMALIZE LEVEL
// ============================================================

function normalizeLevel(level) {
    if (!level) {
        return null;
    }

    return {
        type: level.type ?? null,
        price:
            Number.isFinite(Number(level.price))
                ? Number(level.price)
                : null,
        time:
            level.time ?? null,
        confirmationTime:
            level.confirmationTime ?? null
    };
}


// ============================================================
// GET CURRENT STRUCTURE
// ============================================================

function getCurrentStructure(source) {

    if (!source) {
        return {
            engine: STRUCTURE_ENGINE_NAME,
            state: "UNKNOWN",

            activeHigh: null,
            activeLow: null,

            protectedHigh: null,
            protectedLow: null,

            consumedLevels: [],
            events: [],

            currentLeg: null,
            direction: null,
            origin: null,

            watchingLevel: null,
            watchingLevelType: null,
            watchingAction: null,

            lastBOS: null,
            lastCHOCH: null
        };
    }


    // --------------------------------------------------------
    // The unified engine exposes:
    //
    // state
    // activeHigh
    // activeLow
    // protectedHigh
    // protectedLow
    // consumedLevels
    // events
    // --------------------------------------------------------

    const events =
        Array.isArray(source.events)
            ? source.events
            : [];


    let lastBOS = null;
    let lastCHOCH = null;


    for (const event of events) {

        if (
            event.event === "BULLISH_BOS" ||
            event.event === "BEARISH_BOS"
        ) {
            lastBOS = event;
        }

        if (
            event.event === "BULLISH_CHOCH" ||
            event.event === "BEARISH_CHOCH"
        ) {
            lastCHOCH = event;
        }
    }


    // --------------------------------------------------------
    // CURRENT DIRECTION
    // --------------------------------------------------------

    let direction = null;

    if (source.state === "BULLISH") {
        direction = "BULLISH";
    }

    else if (source.state === "BEARISH") {
        direction = "BEARISH";
    }


    // --------------------------------------------------------
    // CURRENT PROTECTED LEVEL
    // --------------------------------------------------------

    let protectedLevel = null;
    let protectedLevelType = null;

    if (
        direction === "BULLISH" &&
        source.protectedLow
    ) {
        protectedLevel =
            normalizeLevel(source.protectedLow);

        protectedLevelType =
            "PROTECTED_LOW";
    }

    else if (
        direction === "BEARISH" &&
        source.protectedHigh
    ) {
        protectedLevel =
            normalizeLevel(source.protectedHigh);

        protectedLevelType =
            "PROTECTED_HIGH";
    }


    // --------------------------------------------------------
    // NEXT REVERSAL ACTION
    // --------------------------------------------------------

    let watchingAction = null;

    if (direction === "BULLISH") {
        watchingAction = "BEARISH_CHOCH";
    }

    else if (direction === "BEARISH") {
        watchingAction = "BULLISH_CHOCH";
    }


    // --------------------------------------------------------
    // RETURN
    // --------------------------------------------------------

    return {

        engine:
            STRUCTURE_ENGINE_NAME,

        state:
            source.state ?? "UNKNOWN",

        direction,

        activeHigh:
            normalizeLevel(
                source.activeHigh
            ),

        activeLow:
            normalizeLevel(
                source.activeLow
            ),

        protectedHigh:
            normalizeLevel(
                source.protectedHigh
            ),

        protectedLow:
            normalizeLevel(
                source.protectedLow
            ),

        protectedLevel,

        protectedLevelType,

        watchingLevel:
            protectedLevel,

        watchingLevelType:
            protectedLevelType,

        watchingAction,

        lastBOS:
            clone(lastBOS),

        lastCHOCH:
            clone(lastCHOCH),

        consumedLevels:
            Array.isArray(source.consumedLevels)
                ? [...source.consumedLevels]
                : [],

        events:
            clone(events)
    };
}

// ============================================================
// RUN STRUCTURE ENGINE
// ============================================================

function runStructureEngine({
    items = [],
    structuralSwings = []
} = {}) {

    console.log(
        "🧭 STRUCTURE ENGINE:",
        {
            items: items.length,
            structuralSwings: structuralSwings.length
        }
    );

    if (!Array.isArray(items)) {
        throw new Error(
            "Structure engine: items must be an array."
        );
    }

    if (!Array.isArray(structuralSwings)) {
        throw new Error(
            "Structure engine: structuralSwings must be an array."
        );
    }

    const v14 =
        runV14({
            items,
            structuralSwings
        });

    return getCurrentStructure(
        v14
    );
}


// ============================================================
// PUBLIC API
// ============================================================

const structureEngine = {

    name:
        STRUCTURE_ENGINE_NAME,

    run:
        runStructureEngine,

    


    /**
     * Convert the raw unified structure result
     * into the structure state VantageForge uses.
     */
    getCurrentStructure,


    /**
     * Normalize a structural level.
     */
    normalizeLevel
};


// ============================================================
// EXPORT
// ============================================================

if (
    typeof module !== "undefined" &&
    module.exports
) {
    module.exports =
        structureEngine;
}


// ============================================================
// BROWSER ACCESS
// ============================================================

if (
    typeof window !== "undefined"
) {
    window.vantageForgeStructureEngine =
        structureEngine;
}

export default structureEngine;