// ============================================================
// VANTAGEFORGE
// STRUCTURE ENGINE V11
// LEG EVOLUTION + PROTECTED LEVEL TRACE
// ============================================================

export function runV11({
    items = [],
    structuralSwings = []
} = {}) {

    if (!Array.isArray(items)) {
        throw new Error("V11: items must be an array.");
    }

    if (!Array.isArray(structuralSwings)) {
        throw new Error(
            "V11: structuralSwings must be an array."
        );
    }


    // ========================================================
    // HELPERS
    // ========================================================

    function v11Fmt(t) {
        return new Date(
            Number(t) * 1000
        ).toISOString();
    }


    function v11Clone(s) {

        if (!s) {
            return null;
        }

        return {
            ...s,
            price: Number(s.price),
            time: Number(s.time)
        };
    }


    function v11Key(s) {

        if (!s) {
            return null;
        }

        return `${s.type}_${Number(s.time)}_${Number(s.price)}`;
    }


    // ========================================================
    // SORT
    // ========================================================

    const v11Bars =
        [...items].sort(
            (a, b) =>
                Number(a.value[0]) -
                Number(b.value[0])
        );


    const v11Swings =
        [...structuralSwings].sort(
            (a, b) =>
                Number(a.time) -
                Number(b.time)
        );


    // ========================================================
    // STATE
    // ========================================================

    let v11State = "UNKNOWN";

    let v11ActiveHigh = null;
    let v11ActiveLow = null;

    let v11ProtectedHigh = null;
    let v11ProtectedLow = null;

    let v11BullishOrigin = null;
    let v11BearishOrigin = null;

    let v11BullishLegStart = null;
    let v11BearishLegStart = null;

    let v11PendingCHOCHLevel = null;
    let v11PendingCHOCHDirection = null;
    let v11PendingCHOCHTime = null;


    // ========================================================
    // TRACKING
    // ========================================================

    const v11Processed = new Set();
    const v11Consumed = new Set();

    const v11Events = [];
    const v11LegUpdates = [];


    // ========================================================
    // CONSUME
    // ========================================================

    function v11Consume(s) {

        if (!s) {
            return;
        }

        v11Consumed.add(
            v11Key(s)
        );
    }


    function v11IsConsumed(s) {

        if (!s) {
            return false;
        }

        return v11Consumed.has(
            v11Key(s)
        );
    }


    // ========================================================
    // LATEST LOW
    // ========================================================

    function v11LatestLowBefore(time) {

        const lows =
            v11Swings.filter(
                s =>
                    s.type === "LOW" &&
                    Number(s.time) <=
                        Number(time)
            );

        if (!lows.length) {
            return null;
        }

        lows.sort(
            (a, b) =>
                Number(b.time) -
                Number(a.time)
        );

        return v11Clone(
            lows[0]
        );
    }


    // ========================================================
    // LATEST HIGH
    // ========================================================

    function v11LatestHighBefore(time) {

        const highs =
            v11Swings.filter(
                s =>
                    s.type === "HIGH" &&
                    Number(s.time) <=
                        Number(time)
            );

        if (!highs.length) {
            return null;
        }

        highs.sort(
            (a, b) =>
                Number(b.time) -
                Number(a.time)
        );

        return v11Clone(
            highs[0]
        );
    }


    // ========================================================
    // PRICE PATH
    // ========================================================

    function v11Path(
        startTime,
        endTime
    ) {

        let highest = null;
        let lowest = null;

        let highestTime = null;
        let lowestTime = null;

        for (const bar of v11Bars) {

            const t =
                Number(bar.value[0]);

            if (
                t < Number(startTime) ||
                t > Number(endTime)
            ) {
                continue;
            }

            const h =
                Number(bar.value[2]);

            const l =
                Number(bar.value[3]);


            if (
                highest === null ||
                h > highest
            ) {
                highest = h;
                highestTime = t;
            }


            if (
                lowest === null ||
                l < lowest
            ) {
                lowest = l;
                lowestTime = t;
            }
        }

        return {
            highest,
            highestTime,
            lowest,
            lowestTime
        };
    }


    // ========================================================
    // BEARISH CHOCH ORIGIN
    // ========================================================

    function v11FindBearishCHOCHOrigin(
        protectedLow,
        chochTime
    ) {

        if (!protectedLow) {
            return null;
        }

        const candidates =
            v11Swings
                .filter(
                    s =>
                        s.type === "HIGH" &&
                        Number(s.time) >
                            Number(protectedLow.time) &&
                        Number(s.time) <
                            Number(chochTime)
                )
                .filter(
                    s => {

                        const path =
                            v11Path(
                                Number(s.time),
                                Number(chochTime)
                            );

                        return (
                            path.lowest !== null &&
                            path.lowest <=
                                Number(
                                    protectedLow.price
                                )
                        );
                    }
                );


        if (!candidates.length) {
            return null;
        }


        candidates.sort(
            (a, b) =>
                Number(b.time) -
                Number(a.time)
        );


        return v11Clone(
            candidates[0]
        );
    }


    // ========================================================
    // BULLISH CHOCH ORIGIN
    // ========================================================

    function v11FindBullishCHOCHOrigin(
        protectedHigh,
        chochTime
    ) {

        if (!protectedHigh) {
            return null;
        }

        const candidates =
            v11Swings
                .filter(
                    s =>
                        s.type === "LOW" &&
                        Number(s.time) >
                            Number(protectedHigh.time) &&
                        Number(s.time) <
                            Number(chochTime)
                )
                .filter(
                    s => {

                        const path =
                            v11Path(
                                Number(s.time),
                                Number(chochTime)
                            );

                        return (
                            path.highest !== null &&
                            path.highest >=
                                Number(
                                    protectedHigh.price
                                )
                        );
                    }
                );


        if (!candidates.length) {
            return null;
        }


        candidates.sort(
            (a, b) =>
                Number(b.time) -
                Number(a.time)
        );


        return v11Clone(
            candidates[0]
        );
    }


    // ========================================================
    // LEG UPDATE TRACE
    // ========================================================

    function v11RecordLegUpdate({
        time,
        reason,
        swing,
        previousProtected,
        previousOrigin
    }) {

        v11LegUpdates.push({

            time:
                v11Fmt(time),

            reason,

            swingType:
                swing
                    ? swing.type
                    : null,

            swingPrice:
                swing
                    ? Number(swing.price)
                    : null,

            swingTime:
                swing
                    ? v11Fmt(swing.time)
                    : null,

            previousProtected:
                previousProtected
                    ? Number(
                        previousProtected.price
                    )
                    : null,

            newProtected:
                v11ProtectedLow
                    ? Number(
                        v11ProtectedLow.price
                    )
                    : (
                        v11ProtectedHigh
                            ? Number(
                                v11ProtectedHigh.price
                            )
                            : null
                    ),

            previousOrigin:
                previousOrigin
                    ? Number(
                        previousOrigin.price
                    )
                    : null,

            newOrigin:
                v11BullishOrigin
                    ? Number(
                        v11BullishOrigin.price
                    )
                    : (
                        v11BearishOrigin
                            ? Number(
                                v11BearishOrigin.price
                            )
                            : null
                    ),

            state:
                v11State
        });
    }


    // ========================================================
    // EVENT TRACE
    // ========================================================

    function v11RecordEvent({
        time,
        event,
        broken,
        origin,
        previousState
    }) {

        v11Events.push({

            sequence:
                v11Events.length,

            time:
                v11Fmt(time),

            event,

            previousState,

            state:
                v11State,

            broken:
                v11Clone(broken),

            origin:
                v11Clone(origin),

            protectedHigh:
                v11Clone(
                    v11ProtectedHigh
                ),

            protectedLow:
                v11Clone(
                    v11ProtectedLow
                ),

            activeHigh:
                v11Clone(
                    v11ActiveHigh
                ),

            activeLow:
                v11Clone(
                    v11ActiveLow
                )
        });
    }


    // ========================================================
    // MAIN LOOP
    // ========================================================

    for (const bar of v11Bars) {

        const time =
            Number(bar.value[0]);

        const high =
            Number(bar.value[2]);

        const low =
            Number(bar.value[3]);


        // ====================================================
        // STRUCTURAL SWINGS BECOMING AVAILABLE
        // ====================================================

        const newSwings =
            v11Swings
                .filter(
                    s =>
                        Number(s.time) <= time &&
                        !v11Processed.has(
                            v11Key(s)
                        )
                )
                .sort(
                    (a, b) =>
                        Number(a.time) -
                        Number(b.time)
                );


        for (const s of newSwings) {

            v11Processed.add(
                v11Key(s)
            );


            // ================================================
            // HIGH
            // ================================================

            if (s.type === "HIGH") {

                if (
                    !v11IsConsumed(s)
                ) {
                    v11ActiveHigh =
                        v11Clone(s);
                }
            }


            // ================================================
            // LOW
            // ================================================

            if (s.type === "LOW") {

                if (
                    !v11IsConsumed(s)
                ) {
                    v11ActiveLow =
                        v11Clone(s);
                }


                // ============================================
                // BULLISH LEG
                // ============================================

                if (
                    v11State === "BULLISH"
                ) {

                    const previousProtected =
                        v11Clone(
                            v11ProtectedLow
                        );

                    const previousOrigin =
                        v11Clone(
                            v11BullishOrigin
                        );


                    v11ProtectedLow =
                        v11Clone(s);

                    v11BullishOrigin =
                        v11Clone(s);


                    v11RecordLegUpdate({

                        time,

                        reason:
                            "NEW_BULLISH_STRUCTURAL_LOW",

                        swing: s,

                        previousProtected,

                        previousOrigin
                    });
                }
            }
        }


        // ====================================================
        // UNKNOWN
        // ====================================================

        if (
            v11State === "UNKNOWN"
        ) {


            // ================================================
            // INITIAL BULLISH
            // ================================================

            if (
                v11ActiveHigh &&
                !v11IsConsumed(
                    v11ActiveHigh
                ) &&
                high >
                    Number(
                        v11ActiveHigh.price
                    )
            ) {

                const broken =
                    v11Clone(
                        v11ActiveHigh
                    );

                const origin =
                    v11LatestLowBefore(
                        time
                    );

                const previousState =
                    v11State;


                v11Consume(
                    broken
                );


                v11State =
                    "BULLISH";


                v11BullishOrigin =
                    v11Clone(origin);

                v11ProtectedLow =
                    v11Clone(origin);

                v11BullishLegStart =
                    origin
                        ? Number(origin.time)
                        : time;


                v11ProtectedHigh =
                    null;

                v11BearishOrigin =
                    null;

                v11BearishLegStart =
                    null;

                v11ActiveHigh =
                    null;

                v11ActiveLow =
                    null;


                v11RecordEvent({

                    time,

                    event:
                        "INITIAL_BULLISH_BREAK",

                    broken,

                    origin,

                    previousState
                });


                continue;
            }


            // ================================================
            // INITIAL BEARISH
            // ================================================

            if (
                v11ActiveLow &&
                !v11IsConsumed(
                    v11ActiveLow
                ) &&
                low <
                    Number(
                        v11ActiveLow.price
                    )
            ) {

                const broken =
                    v11Clone(
                        v11ActiveLow
                    );

                const origin =
                    v11LatestHighBefore(
                        time
                    );

                const previousState =
                    v11State;


                v11Consume(
                    broken
                );


                v11State =
                    "BEARISH";


                v11BearishOrigin =
                    v11Clone(origin);

                v11ProtectedHigh =
                    v11Clone(origin);

                v11BearishLegStart =
                    origin
                        ? Number(origin.time)
                        : time;


                v11ProtectedLow =
                    null;

                v11BullishOrigin =
                    null;

                v11BullishLegStart =
                    null;

                v11ActiveHigh =
                    null;

                v11ActiveLow =
                    null;


                v11RecordEvent({

                    time,

                    event:
                        "INITIAL_BEARISH_BREAK",

                    broken,

                    origin,

                    previousState
                });


                continue;
            }
        }


        // ====================================================
        // BULLISH
        // ====================================================

        if (
            v11State === "BULLISH"
        ) {


            // ================================================
            // BEARISH CHOCH
            // ================================================

            if (
                v11ProtectedLow &&
                low <
                    Number(
                        v11ProtectedLow.price
                    )
            ) {

                const broken =
                    v11Clone(
                        v11ProtectedLow
                    );

                const origin =
                    v11FindBearishCHOCHOrigin(
                        broken,
                        time
                    );

                const previousState =
                    v11State;


                v11PendingCHOCHLevel =
                    v11Clone(broken);

                v11PendingCHOCHDirection =
                    "BEARISH";

                v11PendingCHOCHTime =
                    time;


                v11State =
                    "BEARISH";


                v11BearishOrigin =
                    v11Clone(origin);

                v11ProtectedHigh =
                    v11Clone(origin);

                v11BearishLegStart =
                    origin
                        ? Number(origin.time)
                        : time;


                v11BullishOrigin =
                    null;

                v11BullishLegStart =
                    null;

                v11ProtectedLow =
                    null;

                v11ActiveHigh =
                    null;

                v11ActiveLow =
                    null;


                v11RecordEvent({

                    time,

                    event:
                        "BEARISH_CHOCH",

                    broken,

                    origin,

                    previousState
                });


                continue;
            }


            // ================================================
            // BULLISH BOS
            // ================================================

            if (
                v11ActiveHigh &&
                !v11IsConsumed(
                    v11ActiveHigh
                ) &&
                high >
                    Number(
                        v11ActiveHigh.price
                    )
            ) {

                const broken =
                    v11Clone(
                        v11ActiveHigh
                    );

                const origin =
                    v11BullishOrigin
                        ? v11Clone(
                            v11BullishOrigin
                        )
                        : v11LatestLowBefore(
                            time
                        );

                const previousState =
                    v11State;


                v11Consume(
                    broken
                );


                v11ActiveHigh =
                    null;


                if (origin) {

                    v11BullishOrigin =
                        v11Clone(origin);

                    v11ProtectedLow =
                        v11Clone(origin);

                    v11BullishLegStart =
                        Number(
                            origin.time
                        );
                }


                v11RecordEvent({

                    time,

                    event:
                        "BULLISH_BOS",

                    broken,

                    origin,

                    previousState
                });


                continue;
            }
        }


        // ====================================================
        // BEARISH
        // ====================================================

        if (
            v11State === "BEARISH"
        ) {


            // ================================================
            // PENDING BEARISH BOS
            // ================================================

            if (
                v11PendingCHOCHLevel &&
                v11PendingCHOCHDirection ===
                    "BEARISH" &&
                time >
                    Number(
                        v11PendingCHOCHTime
                    ) &&
                low <
                    Number(
                        v11PendingCHOCHLevel.price
                    )
            ) {

                const broken =
                    v11Clone(
                        v11PendingCHOCHLevel
                    );

                const origin =
                    v11BearishOrigin
                        ? v11Clone(
                            v11BearishOrigin
                        )
                        : null;

                const previousState =
                    v11State;


                v11Consume(
                    broken
                );


                v11PendingCHOCHLevel =
                    null;

                v11PendingCHOCHDirection =
                    null;

                v11PendingCHOCHTime =
                    null;


                v11RecordEvent({

                    time,

                    event:
                        "BEARISH_BOS",

                    broken,

                    origin,

                    previousState
                });


                continue;
            }


            // ================================================
            // BULLISH CHOCH
            // ================================================

            if (
                v11ProtectedHigh &&
                high >
                    Number(
                        v11ProtectedHigh.price
                    )
            ) {

                const broken =
                    v11Clone(
                        v11ProtectedHigh
                    );

                const origin =
                    v11FindBullishCHOCHOrigin(
                        broken,
                        time
                    );

                const previousState =
                    v11State;


                v11PendingCHOCHLevel =
                    v11Clone(broken);

                v11PendingCHOCHDirection =
                    "BULLISH";

                v11PendingCHOCHTime =
                    time;


                v11State =
                    "BULLISH";


                v11BullishOrigin =
                    v11Clone(origin);

                v11ProtectedLow =
                    v11Clone(origin);

                v11BullishLegStart =
                    origin
                        ? Number(origin.time)
                        : time;


                v11BearishOrigin =
                    null;

                v11BearishLegStart =
                    null;

                v11ProtectedHigh =
                    null;

                v11ActiveHigh =
                    null;

                v11ActiveLow =
                    null;


                v11RecordEvent({

                    time,

                    event:
                        "BULLISH_CHOCH",

                    broken,

                    origin,

                    previousState
                });


                continue;
            }


            // ================================================
            // NORMAL BEARISH BOS
            // ================================================

            if (
                v11ActiveLow &&
                !v11IsConsumed(
                    v11ActiveLow
                ) &&
                low <
                    Number(
                        v11ActiveLow.price
                    )
            ) {

                const broken =
                    v11Clone(
                        v11ActiveLow
                    );

                const origin =
                    v11BearishOrigin
                        ? v11Clone(
                            v11BearishOrigin
                        )
                        : v11LatestHighBefore(
                            time
                        );

                const previousState =
                    v11State;


                v11Consume(
                    broken
                );


                v11ActiveLow =
                    null;


                if (origin) {

                    v11BearishOrigin =
                        v11Clone(origin);

                    v11ProtectedHigh =
                        v11Clone(origin);

                    v11BearishLegStart =
                        Number(
                            origin.time
                        );
                }


                v11RecordEvent({

                    time,

                    event:
                        "BEARISH_BOS",

                    broken,

                    origin,

                    previousState
                });


                continue;
            }
        }
    }


    // ========================================================
    // FINAL RESULT
    // ========================================================

    return {

        engine:
            "BAR_BY_BAR_V11",

        generatedAt:
            new Date().toISOString(),

        state:
            v11State,

        activeHigh:
            v11Clone(
                v11ActiveHigh
            ),

        activeLow:
            v11Clone(
                v11ActiveLow
            ),

        protectedHigh:
            v11Clone(
                v11ProtectedHigh
            ),

        protectedLow:
            v11Clone(
                v11ProtectedLow
            ),

        bullishOrigin:
            v11Clone(
                v11BullishOrigin
            ),

        bearishOrigin:
            v11Clone(
                v11BearishOrigin
            ),

        bullishLegStart:
            v11BullishLegStart
                ? v11Fmt(
                    v11BullishLegStart
                )
                : null,

        bearishLegStart:
            v11BearishLegStart
                ? v11Fmt(
                    v11BearishLegStart
                )
                : null,

        events:
            v11Events,

        legUpdates:
            v11LegUpdates,

        consumedLevels:
            [...v11Consumed]
    };
}