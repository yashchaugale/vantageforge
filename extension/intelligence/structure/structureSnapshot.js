// ============================================================
// VANTAGEFORGE
// STRUCTURE SNAPSHOT
// ============================================================
//
// Purpose:
// Convert the existing bar-by-bar structural output into a
// compact, deterministic snapshot that can be attached to a
// captured trade.
//
// This module DOES NOT:
// - detect new swings
// - create a second structure engine
// - modify existing structure logic
// - infer broker execution
//
// It consumes the existing structure result.
//
// ============================================================

(function () {

    "use strict";


    // ========================================================
    // CONSTANTS
    // ========================================================

    const ENGINE_VERSION =
        "STRUCTURE_SNAPSHOT_V1";


    // ========================================================
    // HELPERS
    // ========================================================

    function finiteNumber(value) {

        const number =
            Number(value);

        return Number.isFinite(number)
            ? number
            : null;
    }


    function normalizePrice(value) {

        const number =
            finiteNumber(value);

        if (number === null) {
            return null;
        }

        return Number(
            number.toFixed(8)
        );
    }


    function normalizeTime(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return null;
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return null;
        }

        return date.toISOString();
    }


    function cloneLevel(level) {

        if (!level) {
            return null;
        }

        return {

            type:
                level.type || null,

            price:
                normalizePrice(
                    level.price
                ),

            time:
                normalizeTime(
                    level.time
                ),

            confirmationTime:
                normalizeTime(
                    level.confirmationTime
                )
        };
    }


    function cloneBroken(broken) {

        if (!broken) {
            return null;
        }

        return {

            type:
                broken.type || null,

            price:
                normalizePrice(
                    broken.price
                ),

            swingTime:
                normalizeTime(
                    broken.swingTime
                ),

            confirmationTime:
                normalizeTime(
                    broken.confirmationTime
                )
        };
    }


    function cloneOrigin(origin) {

        if (!origin) {
            return null;
        }

        const result = {

            status:
                origin.status || null,

            direction:
                origin.direction || null,

            impulseStart:
                normalizeTime(
                    origin.impulseStart
                ),

            impulseEnd:
                normalizeTime(
                    origin.impulseEnd
                ),

            bosTime:
                normalizeTime(
                    origin.bosTime
                ),

            move:
                normalizePrice(
                    origin.move
                )
        };


        if (
            origin.originLow
        ) {

            result.originLow =
                cloneBroken(
                    origin.originLow
                );
        }


        if (
            origin.originHigh
        ) {

            result.originHigh =
                cloneBroken(
                    origin.originHigh
                );
        }


        return result;
    }


    function cloneEvent(event) {

        if (!event) {
            return null;
        }

        return {

            sequence:
                event.sequence ?? null,

            event:
                event.event || null,

            stateBefore:
                event.stateBefore || null,

            stateAfter:
                event.stateAfter || null,

            timestamp:
                normalizeTime(
                    event.time ||
                    event.timestamp
                ),

            broken:
                cloneBroken(
                    event.broken
                ),

            origin:
                cloneOrigin(
                    event.origin
                ),

            activeHigh:
                cloneLevel(
                    event.activeHigh
                ),

            activeLow:
                cloneLevel(
                    event.activeLow
                ),

            protectedHigh:
                cloneLevel(
                    event.protectedHigh
                ),

            protectedLow:
                cloneLevel(
                    event.protectedLow
                )
        };
    }


    // ========================================================
    // LAST EVENT HELPERS
    // ========================================================

    function findLastEvent(
        events,
        eventNames
    ) {

        if (
            !Array.isArray(events)
        ) {
            return null;
        }

        for (
            let i =
                events.length - 1;

            i >= 0;

            i--
        ) {

            const event =
                events[i];

            if (
                event &&
                eventNames.includes(
                    event.event
                )
            ) {
                return event;
            }
        }

        return null;
    }


    // ========================================================
    // BUILD SNAPSHOT
    // ========================================================

    function buildStructureSnapshot(
        structure
    ) {

        if (
            !structure ||
            typeof structure !==
                "object"
        ) {

            return {

                engine:
                    ENGINE_VERSION,

                available:
                    false,

                reason:
                    "STRUCTURE_UNAVAILABLE"
            };
        }


        const events =
            Array.isArray(
                structure.events
            )
                ? structure.events
                : [];


        const lastBOS =
            findLastEvent(
                events,
                [
                    "INITIAL_BULLISH_BREAK",
                    "INITIAL_BEARISH_BREAK",
                    "BULLISH_BOS",
                    "BEARISH_BOS"
                ]
            );


        const lastCHOCH =
            findLastEvent(
                events,
                [
                    "BULLISH_CHOCH",
                    "BEARISH_CHOCH"
                ]
            );


        // ----------------------------------------------------
        // FINAL STATE
        // ----------------------------------------------------

        const state =
            structure.state ||
            "UNKNOWN";


        // ----------------------------------------------------
        // SNAPSHOT
        // ----------------------------------------------------

        const snapshot = {

            engine:
                ENGINE_VERSION,

            available:
                true,

            state:
                state,

            activeHigh:
                cloneLevel(
                    structure.activeHigh
                ),

            activeLow:
                cloneLevel(
                    structure.activeLow
                ),

            protectedHigh:
                cloneLevel(
                    structure.protectedHigh
                ),

            protectedLow:
                cloneLevel(
                    structure.protectedLow
                ),

            lastBOS:
                cloneEvent(
                    lastBOS
                ),

            lastCHOCH:
                cloneEvent(
                    lastCHOCH
                ),

            eventCount:
                events.length,

            consumedLevelCount:
                Array.isArray(
                    structure.consumedLevels
                )
                    ? structure.consumedLevels.length
                    : 0
        };


        // ----------------------------------------------------
        // CURRENT PROTECTED LEVEL
        // ----------------------------------------------------

        if (
            state ===
            "BULLISH"
        ) {

            snapshot.currentProtected =
                cloneLevel(
                    structure.protectedLow
                );

            snapshot.currentProtectedType =
                "LOW";
        }


        else if (
            state ===
            "BEARISH"
        ) {

            snapshot.currentProtected =
                cloneLevel(
                    structure.protectedHigh
                );

            snapshot.currentProtectedType =
                "HIGH";
        }


        else {

            snapshot.currentProtected =
                null;

            snapshot.currentProtectedType =
                null;
        }


        // ----------------------------------------------------
        // LAST STRUCTURAL EVENT
        // ----------------------------------------------------

        if (
            events.length
        ) {

            snapshot.lastEvent =
                cloneEvent(
                    events[
                        events.length - 1
                    ]
                );

        } else {

            snapshot.lastEvent =
                null;
        }


        return snapshot;
    }


    // ========================================================
    // SNAPSHOT AT TIME
    // ========================================================

    function buildSnapshotAtTime(
        structure,
        anchorTime
    ) {

        const base =
            buildStructureSnapshot(
                structure
            );


        if (
            !base.available
        ) {
            return base;
        }


        if (
            !anchorTime
        ) {
            return {

                ...base,

                snapshotTime:
                    null,

                timeFiltered:
                    false
            };
        }


        const anchor =
            new Date(
                anchorTime
            );


        if (
            Number.isNaN(
                anchor.getTime()
            )
        ) {

            return {

                ...base,

                snapshotTime:
                    null,

                timeFiltered:
                    false
            };
        }


        const anchorMs =
            anchor.getTime();


        const events =
            Array.isArray(
                structure.events
            )
                ? structure.events
                : [];


        const historicalEvents =
            events.filter(
                event => {

                    const eventTime =
                        new Date(
                            event.time ||
                            event.timestamp
                        ).getTime();

                    return (
                        Number.isFinite(
                            eventTime
                        ) &&
                        eventTime <=
                            anchorMs
                    );
                }
            );


        const historicalBOS =
            findLastEvent(
                historicalEvents,
                [
                    "INITIAL_BULLISH_BREAK",
                    "INITIAL_BEARISH_BREAK",
                    "BULLISH_BOS",
                    "BEARISH_BOS"
                ]
            );


        const historicalCHOCH =
            findLastEvent(
                historicalEvents,
                [
                    "BULLISH_CHOCH",
                    "BEARISH_CHOCH"
                ]
            );


        return {

            ...base,

            snapshotTime:
                anchor.toISOString(),

            timeFiltered:
                true,

            historicalEventCount:
                historicalEvents.length,

            lastBOSAtAnchor:
                cloneEvent(
                    historicalBOS
                ),

            lastCHOCHAtAnchor:
                cloneEvent(
                    historicalCHOCH
                )
        };
    }


    // ========================================================
    // PUBLIC API
    // ========================================================

    window.VantageForgeStructureSnapshot = {

        version:
            ENGINE_VERSION,

        build:
            buildStructureSnapshot,

        buildAtTime:
            buildSnapshotAtTime
    };


    console.log(
        "VantageForge Structure Snapshot loaded:",
        ENGINE_VERSION
    );

})();