// ============================================================
// VANTAGEFORGE
// STRUCTURE ENGINE V14
// INTERNAL LEG EVOLUTION
// Production module
//
// SOURCE:
// V13 structural legs
//
// RESPONSIBILITIES:
// - Preserve explicit legs
// - Build structural evolution
// - Track protected-level history
// - Analyze BOS at historical protected level
// - Analyze CHOCH at historical protected level
// - Validate structural evolution
// ============================================================

import { runV13 } from "./v13.js";


// ============================================================
// MAIN
// ============================================================

export function runV14({
    items = [],
    structuralSwings = []
} = {}) {


    // ========================================================
    // RUN V13
    // ========================================================

    const v13Source =
        runV13({
            items,
            structuralSwings
        });


    const v14Legs =
        v13Source.legs || [];

    const v14Events =
        v13Source.events || [];


    // ========================================================
    // HELPERS
    // ========================================================

    function v14Fmt(t) {

        return new Date(
            Number(t) * 1000
        ).toISOString();
    }


    function v14Clone(s) {

        if (!s) {
            return null;
        }

        return {
            ...s,

            price:
                Number(s.price),

            time:
                Number(s.time)
        };
    }


    function v14Time(value) {

        if (
            typeof value === "number"
        ) {
            return Number(value);
        }

        return (
            Date.parse(value) / 1000
        );
    }


    // ========================================================
    // PROTECTED LEVEL LOOKUP
    // ========================================================

    function v14GetProtectedAtTime(
        history,
        eventTime
    ) {

        const target =
            v14Time(eventTime);


        let latest =
            null;


        for (
            const item of history
        ) {

            const t =
                v14Time(
                    item.time
                );


            if (
                t <= target
            ) {

                latest =
                    item;
            }
        }


        return latest
            ? {

                price:
                    latest.price,

                type:
                    latest.type,

                time:
                    latest.time,

                reason:
                    latest.reason

            }
            : null;
    }


    // ========================================================
    // BUILD EVOLUTION OBJECTS
    // ========================================================

    const v14Evolution = [];


    // ========================================================
    // PROCESS EACH LEG
    // ========================================================

    for (
        const leg of v14Legs
    ) {

        const evolution = {

            legId:
                leg.id,

            direction:
                leg.direction,

            startTime:
                leg.startTime,

            startTimeISO:
                leg.startTimeISO,

            endTime:
                leg.endTime,

            endTimeISO:
                leg.endTimeISO,

            status:
                leg.status,

            createdBy:
                leg.createdBy,

            initialOrigin:
                v14Clone(
                    leg.origin
                ),

            initialProtected:
                v14Clone(
                    leg.protectedLevel
                ),

            structuralUpdates:
                [],

            bosEvents:
                [],

            chochEvents:
                [],

            timeline:
                []
        };


        // ====================================================
        // INITIAL ORIGIN
        // ====================================================

        evolution.timeline.push({

            type:
                "LEG_START",

            time:
                leg.startTimeISO,

            price:
                leg.origin
                    ? Number(
                        leg.origin.price
                    )
                    : null,

            swingType:
                leg.origin
                    ? leg.origin.type
                    : null,

            role:
                "LEG_ORIGIN",

            protectedLevel:
                leg.origin
                    ? Number(
                        leg.origin.price
                    )
                    : null
        });


        // ====================================================
        // STRUCTURAL UPDATES
        // ====================================================

        for (
            const update of (
                leg.updates || []
            )
        ) {

            const updateObject = {

                type:
                    "STRUCTURAL_UPDATE",

                time:
                    update.time,

                swingType:
                    update.swingType,

                swingPrice:
                    Number(
                        update.swingPrice
                    ),

                swingTime:
                    update.swingTime,

                previousProtected:
                    update.previousProtected !== null
                        ? Number(
                            update.previousProtected
                        )
                        : null,

                newProtected:
                    update.newProtected !== null
                        ? Number(
                            update.newProtected
                        )
                        : null,

                previousOrigin:
                    update.previousOrigin !== null
                        ? Number(
                            update.previousOrigin
                        )
                        : null,

                newOrigin:
                    update.newOrigin !== null
                        ? Number(
                            update.newOrigin
                        )
                        : null
            };


            evolution.structuralUpdates.push(
                updateObject
            );


            evolution.timeline.push({

                type:
                    "STRUCTURAL_UPDATE",

                time:
                    update.time,

                price:
                    Number(
                        update.swingPrice
                    ),

                swingType:
                    update.swingType,

                role:
                    "PROTECTED_LEVEL_UPDATE",

                previousProtected:
                    update.previousProtected !== null
                        ? Number(
                            update.previousProtected
                        )
                        : null,

                newProtected:
                    update.newProtected !== null
                        ? Number(
                            update.newProtected
                        )
                        : null
            });
        }


        // ====================================================
        // EVENTS BELONGING TO LEG
        // ====================================================

        for (
            const event of (
                leg.events || []
            )
        ) {

            const eventObject = {

                sequence:
                    event.sequence,

                event:
                    event.event,

                time:
                    event.time,

                broken:
                    event.broken
                        ? Number(
                            event.broken.price
                        )
                        : null,

                origin:
                    event.origin
                        ? Number(
                            event.origin.price
                        )
                        : null,

                protectedHigh:
                    event.protectedHigh
                        ? Number(
                            event.protectedHigh.price
                        )
                        : null,

                protectedLow:
                    event.protectedLow
                        ? Number(
                            event.protectedLow.price
                        )
                        : null
            };


            if (
                event.event ===
                    "BULLISH_BOS" ||
                event.event ===
                    "BEARISH_BOS"
            ) {

                evolution.bosEvents.push(
                    eventObject
                );
            }


            if (
                event.event ===
                    "BULLISH_CHOCH" ||
                event.event ===
                    "BEARISH_CHOCH"
            ) {

                evolution.chochEvents.push(
                    eventObject
                );
            }


            evolution.timeline.push({

                type:
                    event.event,

                time:
                    event.time,

                price:
                    event.broken
                        ? Number(
                            event.broken.price
                        )
                        : null,

                origin:
                    event.origin
                        ? Number(
                            event.origin.price
                        )
                        : null,

                role:
                    event.event.includes(
                        "CHOCH"
                    )
                        ? "REVERSAL"
                        : "CONTINUATION"
            });
        }


        // ====================================================
        // SORT TIMELINE
        // ====================================================

        evolution.timeline.sort(
            (a, b) =>
                v14Time(a.time) -
                v14Time(b.time)
        );


        // ====================================================
        // DERIVE PROTECTED LEVEL HISTORY
        // ====================================================

        let currentProtected =
            leg.origin
                ? Number(
                    leg.origin.price
                )
                : null;


        let currentProtectedType =
            leg.origin
                ? leg.origin.type
                : null;


        const protectedHistory = [];


        if (
            currentProtected !== null
        ) {

            protectedHistory.push({

                time:
                    leg.startTimeISO,

                price:
                    currentProtected,

                type:
                    currentProtectedType,

                reason:
                    "LEG_ORIGIN"
            });
        }


        for (
            const update of (
                leg.updates || []
            )
        ) {

            if (
                update.newProtected !== null &&
                update.newProtected !== undefined
            ) {

                currentProtected =
                    Number(
                        update.newProtected
                    );


                currentProtectedType =
                    update.swingType;


                protectedHistory.push({

                    time:
                        update.time,

                    price:
                        currentProtected,

                    type:
                        currentProtectedType,

                    reason:
                        "STRUCTURAL_UPDATE"
                });
            }
        }


        evolution.protectedHistory =
            protectedHistory;


        evolution.finalProtected =
            currentProtected;


        evolution.finalProtectedType =
            currentProtectedType;


        // ====================================================
        // BOS ANALYSIS
        // ====================================================

        evolution.bosAnalysis =
            evolution.bosEvents.map(
                bos => ({

                    time:
                        bos.time,

                    broken:
                        bos.broken,

                    origin:
                        bos.origin,

                    legDirection:
                        leg.direction,

                    protectedAtBOS:
                        v14GetProtectedAtTime(
                            protectedHistory,
                            bos.time
                        )
                })
            );


        // ====================================================
        // REVERSAL ANALYSIS
        // ====================================================

        evolution.reversalAnalysis =
            evolution.chochEvents.map(
                choch => ({

                    time:
                        choch.time,

                    broken:
                        choch.broken,

                    origin:
                        choch.origin,

                    legDirection:
                        leg.direction,

                    protectedAtCHOCH:
                        v14GetProtectedAtTime(
                            protectedHistory,
                            choch.time
                        ),

                    reversalDirection:
                        choch.event ===
                        "BULLISH_CHOCH"
                            ? "BULLISH"
                            : "BEARISH"
                })
            );


        // ====================================================
        // PUSH
        // ====================================================

        v14Evolution.push(
            evolution
        );
    }


    // ========================================================
    // REBUILD BOS ANALYSIS
    // ========================================================

    for (
        const evolution of v14Evolution
    ) {

        evolution.bosAnalysis =
            evolution.bosEvents.map(
                bos => {

                    const protectedAtBOS =
                        v14GetProtectedAtTime(
                            evolution.protectedHistory,
                            bos.time
                        );


                    return {

                        time:
                            bos.time,

                        broken:
                            bos.broken,

                        origin:
                            bos.origin,

                        leg:
                            evolution.legId,

                        direction:
                            evolution.direction,

                        protectedAtBOS:
                            protectedAtBOS
                                ? protectedAtBOS.price
                                : null,

                        protectedType:
                            protectedAtBOS
                                ? protectedAtBOS.type
                                : null
                    };
                }
            );
    }


    // ========================================================
    // VALIDATION
    // ========================================================

    const leg0 =
        v14Evolution.find(
            l =>
                l.legId ===
                "LEG_0"
        );


    const leg1 =
        v14Evolution.find(
            l =>
                l.legId ===
                "LEG_1"
        );


    const leg2 =
        v14Evolution.find(
            l =>
                l.legId ===
                "LEG_2"
        );


    const v14Validation = {

        totalLegs:
            v14Evolution.length,

        leg0Exists:
            !!leg0,

        leg1Exists:
            !!leg1,

        leg2Exists:
            !!leg2,

        leg0OriginCorrect:
            !!leg0?.initialOrigin &&
            Number(
                leg0.initialOrigin.price
            ) === 64112.88,

        leg1OriginCorrect:
            !!leg1?.initialOrigin &&
            Number(
                leg1.initialOrigin.price
            ) === 77533.79,

        leg2OriginCorrect:
            !!leg2?.initialOrigin &&
            Number(
                leg2.initialOrigin.price
            ) === 75568.18,

        leg0HasProtectedUpdate:
            leg0?.structuralUpdates?.length === 1,

        leg2HasTwoProtectedUpdates:
            leg2?.structuralUpdates?.length === 2,

        leg2HasTwoBOS:
            leg2?.bosEvents?.length === 2,

        leg0HasBearishCHOCH:
            leg0?.chochEvents?.some(
                e =>
                    e.event ===
                    "BEARISH_CHOCH"
            ) === true,

        leg1HasBearishBOS:
            leg1?.bosEvents?.some(
                e =>
                    e.event ===
                    "BEARISH_BOS"
            ) === true,

        leg1HasBullishCHOCH:
            leg1?.chochEvents?.some(
                e =>
                    e.event ===
                    "BULLISH_CHOCH"
            ) === true,

        leg2FinalProtectedCorrect:
            Number(
                leg2?.finalProtected
            ) === 77626.89
    };


    // ========================================================
    // RETURN
    // ========================================================

    return {

        engine:
            "STRUCTURAL_LEG_EVOLUTION_V14",

        source:
            "V13",

        state:
            v13Source.state,

        legs:
            v14Evolution,

        validation:
            v14Validation,

        sourceData:
            v13Source
    };
}