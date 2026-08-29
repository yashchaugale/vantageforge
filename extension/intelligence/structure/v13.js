// ============================================================
// VANTAGEFORGE
// STRUCTURE ENGINE V13
// EXPLICIT LEG OWNERSHIP + EVENT RESPONSIBILITY
// ============================================================

import { runV12 } from "./v12.js";


export function runV13({
    items = [],
    structuralSwings = []
} = {}) {

    // ========================================================
    // RUN V12
    // ========================================================

    const v12Source =
        runV12({
            items,
            structuralSwings
        });


    const legs =
        v12Source.legs || [];

    const sourceEvents =
        v12Source.source?.events ||
        [];


    // ========================================================
    // HELPERS
    // ========================================================

    function eventTime(event) {

        return (
            Date.parse(
                event.time
            ) / 1000
        );
    }


    function updateTime(update) {

        return (
            Date.parse(
                update.time
            ) / 1000
        );
    }


    function clone(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return value;
        }

        if (
            Array.isArray(value)
        ) {
            return value.map(clone);
        }

        if (
            typeof value === "object"
        ) {

            const result = {};

            for (
                const key of Object.keys(value)
            ) {
                result[key] =
                    clone(value[key]);
            }

            return result;
        }

        return value;
    }


    // ========================================================
    // FIND LEG AT EXACT EVENT TIME
    // ========================================================

    function findLegAtTime(
        time,
        direction = null
    ) {

        const candidates =
            legs.filter(
                leg => {

                    if (
                        direction &&
                        leg.direction !==
                            direction
                    ) {
                        return false;
                    }


                    if (
                        Number(
                            leg.startTime
                        ) >
                        Number(time)
                    ) {
                        return false;
                    }


                    if (
                        leg.endTime !== null &&
                        Number(time) >
                        Number(
                            leg.endTime
                        )
                    ) {
                        return false;
                    }


                    return true;
                }
            );


        if (
            !candidates.length
        ) {
            return null;
        }


        // Most recently created leg wins.
        candidates.sort(
            (a, b) =>
                legs.indexOf(b) -
                legs.indexOf(a)
        );


        return candidates[0];
    }


    // ========================================================
    // FIND ACTIVE DIRECTIONAL LEG
    // ========================================================

    function findActiveDirectionalLeg(
        time,
        direction
    ) {

        return findLegAtTime(
            time,
            direction
        );
    }


    // ========================================================
    // ATTACH STRUCTURAL UPDATES
    // ========================================================

    const v13LegUpdates =
        v12Source.source?.legUpdates ||
        [];


    for (
        const update of v13LegUpdates
    ) {

        const time =
            updateTime(update);


        let direction = null;


        if (
            update.swingType ===
            "LOW"
        ) {

            direction =
                "BULLISH";

        }

        else if (
            update.swingType ===
            "HIGH"
        ) {

            direction =
                "BEARISH";
        }


        const leg =
            findActiveDirectionalLeg(
                time,
                direction
            );


        if (
            !leg
        ) {
            continue;
        }


        // Avoid duplicating updates
        // already attached by V12.

        const alreadyExists =
            leg.updates.some(
                existing =>
                    existing.time ===
                        update.time &&
                    existing.swingType ===
                        update.swingType &&
                    Number(
                        existing.swingPrice
                    ) ===
                    Number(
                        update.swingPrice
                    )
            );


        if (
            !alreadyExists
        ) {

            leg.updates.push({

                time:
                    update.time,

                swingType:
                    update.swingType,

                swingPrice:
                    update.swingPrice,

                swingTime:
                    update.swingTime,

                previousProtected:
                    update.previousProtected,

                newProtected:
                    update.newProtected,

                previousOrigin:
                    update.previousOrigin,

                newOrigin:
                    update.newOrigin
            });
        }


        // Synchronize protected level.

        if (
            update.swingType ===
                "LOW" &&
            direction ===
                "BULLISH"
        ) {

            leg.protectedLevel = {

                type:
                    "LOW",

                price:
                    Number(
                        update.newProtected
                    ),

                time:
                    update.swingTime
                        ? (
                            Date.parse(
                                update.swingTime
                            ) / 1000
                        )
                        : time
            };
        }


        if (
            update.swingType ===
                "HIGH" &&
            direction ===
                "BEARISH"
        ) {

            leg.protectedLevel = {

                type:
                    "HIGH",

                price:
                    Number(
                        update.newProtected
                    ),

                time:
                    update.swingTime
                        ? (
                            Date.parse(
                                update.swingTime
                            ) / 1000
                        )
                        : time
            };
        }
    }


    // ========================================================
    // EVENT → RESPONSIBLE LEG
    // ========================================================

    const v13Events =
        sourceEvents.map(
            event => {

                const time =
                    eventTime(event);


                let responsibleLeg =
                    null;


                // ------------------------------------------------
                // BEARISH CHOCH
                // OLD BULLISH LEG
                // ------------------------------------------------

                if (
                    event.event ===
                    "BEARISH_CHOCH"
                ) {

                    responsibleLeg =
                        findLegAtTime(
                            time,
                            "BULLISH"
                        );
                }


                // ------------------------------------------------
                // BULLISH CHOCH
                // OLD BEARISH LEG
                // ------------------------------------------------

                else if (
                    event.event ===
                    "BULLISH_CHOCH"
                ) {

                    responsibleLeg =
                        findLegAtTime(
                            time,
                            "BEARISH"
                        );
                }


                // ------------------------------------------------
                // BULLISH EVENTS
                // ------------------------------------------------

                else if (
                    event.state ===
                    "BULLISH"
                ) {

                    responsibleLeg =
                        findActiveDirectionalLeg(
                            time,
                            "BULLISH"
                        );
                }


                // ------------------------------------------------
                // BEARISH EVENTS
                // ------------------------------------------------

                else if (
                    event.state ===
                    "BEARISH"
                ) {

                    responsibleLeg =
                        findActiveDirectionalLeg(
                            time,
                            "BEARISH"
                        );
                }


                return {

                    sequence:
                        event.sequence,

                    event:
                        event.event,

                    time:
                        event.time,

                    direction:
                        event.state,

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

                    responsibleLeg:
                        responsibleLeg
                            ? responsibleLeg.id
                            : null,

                    legDirection:
                        responsibleLeg
                            ? responsibleLeg.direction
                            : null,

                    legOrigin:
                        responsibleLeg?.origin
                            ? Number(
                                responsibleLeg
                                    .origin
                                    .price
                            )
                            : null,

                    legProtected:
                        responsibleLeg?.protectedLevel
                            ? Number(
                                responsibleLeg
                                    .protectedLevel
                                    .price
                            )
                            : null,

                    legStart:
                        responsibleLeg
                            ? responsibleLeg.startTimeISO
                            : null,

                    legEnd:
                        responsibleLeg
                            ? responsibleLeg.endTimeISO
                            : null
                };
            }
        );


    // ========================================================
    // VALIDATION
    // ========================================================

    const validation = {

        totalLegs:
            legs.length,

        totalEvents:
            sourceEvents.length,

        initialOriginCorrect:
            legs.length > 0 &&
            legs[0].origin &&
            Number(
                legs[0].origin.price
            ) === 64112.88,

        bearishCHOCHResponsibleLegBullish:
            v13Events.some(
                event =>
                    event.event ===
                        "BEARISH_CHOCH" &&
                    event.legDirection ===
                        "BULLISH"
            ),

        bullishCHOCHResponsibleLegBearish:
            v13Events.some(
                event =>
                    event.event ===
                        "BULLISH_CHOCH" &&
                    event.legDirection ===
                        "BEARISH"
            ),

        bullishBOSResponsibleLegBullish:
            v13Events
                .filter(
                    event =>
                        event.event ===
                        "BULLISH_BOS"
                )
                .every(
                    event =>
                        event.legDirection ===
                        "BULLISH"
                ),

        bearishBOSResponsibleLegBearish:
            v13Events
                .filter(
                    event =>
                        event.event ===
                        "BEARISH_BOS"
                )
                .every(
                    event =>
                        event.legDirection ===
                        "BEARISH"
                ),

        bullishBOSAfterBullishCHOCHUseNewLeg:
            v13Events.some(
                event =>
                    event.event ===
                        "BULLISH_CHOCH" &&
                    event.responsibleLeg ===
                        "LEG_1"
            ) &&
            v13Events.some(
                event =>
                    event.event ===
                        "BULLISH_BOS" &&
                    event.responsibleLeg ===
                        "LEG_2"
            ),

        bullishLegUpdatesAttached:
            legs.some(
                leg =>
                    leg.direction ===
                        "BULLISH" &&
                    leg.updates.length > 0
            )
    };


    // ========================================================
    // FINAL
    // ========================================================

    return {

        engine:
            "STRUCTURAL_LEG_MAP_V13",

        state:
            v12Source.state,

        legs:
            clone(legs),

        events:
            clone(v13Events),

        validation,

        source:
            clone(v12Source.source)
    };
}