// ============================================================
// VANTAGEFORGE
// STRUCTURE ENGINE V12
// EXPLICIT STRUCTURAL LEG MAP
// ============================================================

import { runV11 } from "./v11.js";

export function runV12({
    items = [],
    structuralSwings = []
} = {}) {

    // ========================================================
    // RUN V11
    // ========================================================

    const v11Source =
        runV11({
            items,
            structuralSwings
        });

    const v12Events =
        v11Source.events || [];

    const v12LegUpdates =
        v11Source.legUpdates || [];


    // ========================================================
    // HELPERS
    // ========================================================

    function v12Fmt(t) {
        return new Date(
            Number(t) * 1000
        ).toISOString();
    }


    function v12Clone(s) {

        if (!s) {
            return null;
        }

        return {
            ...s,
            price: Number(s.price),
            time: Number(s.time)
        };
    }


    // ========================================================
    // LEG STORAGE
    // ========================================================

    const v12Legs = [];

    let v12CurrentLeg = null;


    // ========================================================
    // CREATE LEG
    // ========================================================

    function v12CreateLeg({
        direction,
        startTime,
        origin,
        createdBy,
        broken
    }) {

        const leg = {

            id:
                `LEG_${v12Legs.length}`,

            direction,

            startTime:
                Number(startTime),

            startTimeISO:
                v12Fmt(startTime),

            endTime:
                null,

            endTimeISO:
                null,

            origin:
                v12Clone(origin),

            protectedLevel:
                v12Clone(origin),

            createdBy,

            broken:
                v12Clone(broken),

            updates: [],

            events: [],

            status:
                "ACTIVE"
        };


        v12Legs.push(
            leg
        );

        v12CurrentLeg =
            leg;

        return leg;
    }


    // ========================================================
    // CLOSE LEG
    // ========================================================

    function v12CloseCurrentLeg(
        endTime,
        closingEvent
    ) {

        if (!v12CurrentLeg) {
            return;
        }

        v12CurrentLeg.endTime =
            Number(endTime);

        v12CurrentLeg.endTimeISO =
            v12Fmt(endTime);

        v12CurrentLeg.status =
            "CLOSED";

        v12CurrentLeg.closedBy =
            closingEvent;
    }


    // ========================================================
    // EVENT → LEG
    // ========================================================

    for (
        const event of v12Events
    ) {

        // ====================================================
        // INITIAL BULLISH
        // ====================================================

        if (
            event.event ===
            "INITIAL_BULLISH_BREAK"
        ) {

            v12CreateLeg({

                direction:
                    "BULLISH",

                startTime:
                    event.origin
                        ? event.origin.time
                        : Date.parse(
                            event.time
                        ) / 1000,

                origin:
                    event.origin,

                createdBy:
                    event.event,

                broken:
                    event.broken
            });


            v12CurrentLeg.events.push(
                event
            );

            continue;
        }


        // ====================================================
        // INITIAL BEARISH
        // ====================================================

        if (
            event.event ===
            "INITIAL_BEARISH_BREAK"
        ) {

            v12CreateLeg({

                direction:
                    "BEARISH",

                startTime:
                    event.origin
                        ? event.origin.time
                        : Date.parse(
                            event.time
                        ) / 1000,

                origin:
                    event.origin,

                createdBy:
                    event.event,

                broken:
                    event.broken
            });


            v12CurrentLeg.events.push(
                event
            );

            continue;
        }


        // ====================================================
        // BEARISH CHOCH
        // ====================================================

        if (
            event.event ===
            "BEARISH_CHOCH"
        ) {

            // OLD BULLISH LEG is responsible.

            if (
                v12CurrentLeg
            ) {

                v12CurrentLeg.events.push(
                    event
                );

                v12CloseCurrentLeg(

                    Date.parse(
                        event.time
                    ) / 1000,

                    event.event
                );
            }


            // NEW BEARISH LEG

            v12CreateLeg({

                direction:
                    "BEARISH",

                startTime:
                    event.origin
                        ? event.origin.time
                        : Date.parse(
                            event.time
                        ) / 1000,

                origin:
                    event.origin,

                createdBy:
                    event.event,

                broken:
                    event.broken
            });


            v12CurrentLeg.events.push(
                event
            );

            continue;
        }


        // ====================================================
        // BULLISH CHOCH
        // ====================================================

        if (
            event.event ===
            "BULLISH_CHOCH"
        ) {

            // OLD BEARISH LEG is responsible.

            if (
                v12CurrentLeg
            ) {

                v12CurrentLeg.events.push(
                    event
                );

                v12CloseCurrentLeg(

                    Date.parse(
                        event.time
                    ) / 1000,

                    event.event
                );
            }


            // NEW BULLISH LEG

            v12CreateLeg({

                direction:
                    "BULLISH",

                startTime:
                    event.origin
                        ? event.origin.time
                        : Date.parse(
                            event.time
                        ) / 1000,

                origin:
                    event.origin,

                createdBy:
                    event.event,

                broken:
                    event.broken
            });


            v12CurrentLeg.events.push(
                event
            );

            continue;
        }


        // ====================================================
        // BOS
        // ====================================================

        if (
            event.event ===
                "BULLISH_BOS" ||
            event.event ===
                "BEARISH_BOS"
        ) {

            if (
                v12CurrentLeg
            ) {

                v12CurrentLeg.events.push(
                    event
                );
            }
        }
    }


    // ========================================================
    // ATTACH LEG UPDATES
    // ========================================================

    for (
        const update of v12LegUpdates
    ) {

        const updateTime =
            Date.parse(
                update.time
            ) / 1000;


        const matchingLeg =
            v12Legs.find(
                leg =>
                    updateTime >=
                    leg.startTime &&
                    (
                        leg.endTime === null ||
                        updateTime <=
                        leg.endTime
                    )
            );


        if (
            matchingLeg
        ) {

            matchingLeg.updates.push({

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
    }


    // ========================================================
    // EVENT → RESPONSIBLE LEG
    // ========================================================

    const v12EventAnalysis =
        v12Events.map(
            event => {

                const eventTime =
                    Date.parse(
                        event.time
                    ) / 1000;


                let responsibleLeg =
                    null;


                // ------------------------------------------------
                // CHOCH belongs to OLD / OPPOSITE leg
                // ------------------------------------------------

                if (
                    event.event ===
                        "BEARISH_CHOCH" ||
                    event.event ===
                        "BULLISH_CHOCH"
                ) {

                    const expectedDirection =
                        event.event ===
                            "BEARISH_CHOCH"
                            ? "BULLISH"
                            : "BEARISH";


                    responsibleLeg =
                        v12Legs.find(
                            leg =>

                                leg.direction ===
                                    expectedDirection &&

                                leg.startTime <=
                                    eventTime
                        );
                }


                // ------------------------------------------------
                // BOS belongs to current direction
                // ------------------------------------------------

                else {

                    const expectedDirection =
                        event.state ===
                            "BULLISH"
                            ? "BULLISH"
                            : "BEARISH";


                    responsibleLeg =
                        v12Legs.find(
                            leg =>

                                leg.direction ===
                                    expectedDirection &&

                                leg.startTime <=
                                    eventTime
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
                            ? event.broken.price
                            : null,

                    origin:
                        event.origin
                            ? event.origin.price
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
                        responsibleLeg &&
                        responsibleLeg.origin
                            ? responsibleLeg.origin.price
                            : null,

                    legStart:
                        responsibleLeg
                            ? responsibleLeg.startTimeISO
                            : null
                };
            }
        );


    // ========================================================
    // VALIDATION
    // ========================================================

    const v12Validation = {

        totalLegs:
            v12Legs.length,

        totalEvents:
            v12Events.length,

        finalState:
            v11Source.state,

        initialLegCorrect:
            v12Legs.length > 0 &&
            v12Legs[0].origin &&
            Number(
                v12Legs[0].origin.price
            ) === 64112.88,

        bearishCHOCHHasBullishResponsibleLeg:
            v12EventAnalysis.some(
                e =>
                    e.event ===
                        "BEARISH_CHOCH" &&
                    e.legDirection ===
                        "BULLISH"
            ),

        bullishCHOCHHasBearishResponsibleLeg:
            v12EventAnalysis.some(
                e =>
                    e.event ===
                        "BULLISH_CHOCH" &&
                    e.legDirection ===
                        "BEARISH"
            ),

        bullishBOSHaveBullishLeg:
            v12EventAnalysis
                .filter(
                    e =>
                        e.event ===
                        "BULLISH_BOS"
                )
                .every(
                    e =>
                        e.legDirection ===
                        "BULLISH"
                ),

        bearishBOSHaveBearishLeg:
            v12EventAnalysis
                .filter(
                    e =>
                        e.event ===
                        "BEARISH_BOS"
                )
                .every(
                    e =>
                        e.legDirection ===
                        "BEARISH"
                )
    };


    // ========================================================
    // RETURN
    // ========================================================

    return {

        engine:
            "STRUCTURAL_LEG_MAP_V12",

        state:
            v11Source.state,

        legs:
            v12Legs,

        events:
            v12EventAnalysis,

        validation:
            v12Validation,

        source:
            v11Source
    };
}