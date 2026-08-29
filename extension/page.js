console.log("🌐 VantageForge PAGE SCRIPT LOADED");


window.VantageForge = window.VantageForge || {};

// ============================================================
// BASIC TEST
// ============================================================

window.VantageForge.test = function () {
    console.log("🔥 VantageForge is alive");
};


// ============================================================
// GET TRADINGVIEW MODEL
// ============================================================

window.VantageForge.getChartModel = function () {

    try {

        const model =
            window.TradingViewApi
                ._chartWidgetCollection
                .activeChartWidget
                ._value
                ._modelWV
                ._value
                .m_model;

        return model;

    } catch (error) {

        console.error(
            "❌ Could not access TradingView chart model",
            error
        );

        return null;
    }
};

// ============================================================
// GET CURRENT MARKET PRICE
// ============================================================

window.VantageForge.getCurrentPrice = function () {

    try {

        const model =
            window.VantageForge.getChartModel();

        if (!model || !model._mainSeries) {
            return null;
        }

        const data =
            model._mainSeries.lastValueData();

        if (!data || data.noData) {
            return null;
        }

        const price =
            Number(
                data.formattedPriceAbsolute
                    ?.replace(/,/g, "")
            );

        if (!Number.isFinite(price)) {
            return null;
        }

        return price;

    } catch (error) {

        console.error(
            "❌ Failed to get current price",
            error
        );

        return null;
    }
};

// ============================================================
// EXTRACT DRAWINGS
// ============================================================

window.VantageForge.extractDrawings = function () {

    const model =
        window.VantageForge.getChartModel();

    if (!model) {
        return [];
    }

    try {

        const tools =
            model.allLineTools();

        return tools.map(tool => {

            const id =
                typeof tool.id === "function"
                    ? tool.id()
                    : null;


            const type =
                typeof tool.toolname === "function"
                    ? tool.toolname()
                    : tool.toolname || null;


            const points =
                Array.isArray(tool._points)
                    ? tool._points.map(point => ({
                        index: point.index,
                        time: point.time,
                        price: point.price,
                        interval: point.interval
                    }))
                    : [];


            // ====================================================
            // RISK / REWARD DATA
            // ====================================================

            let riskReward = null;


            if (
                type === "LineToolRiskRewardLong" ||
                type === "LineToolRiskRewardShort"
            ) {

                try {

                    const direction =
                        type === "LineToolRiskRewardLong"
                            ? "LONG"
                            : "SHORT";


                    const entry =
                        Number(
                            tool._properties
                                ?.entryPrice
                                ?.value?.()
                        );


                    const stopLoss =
                        Number(
                            tool._properties
                                ?.stopPrice
                                ?.value?.()
                        );


                    const takeProfit =
                        Number(
                            tool._properties
                                ?.targetPrice
                                ?.value?.()
                        );


                    if (
                        Number.isFinite(entry) &&
                        Number.isFinite(stopLoss) &&
                        Number.isFinite(takeProfit)
                    ) {

                        riskReward = {

                            direction,

                            entry,

                            stopLoss,

                            takeProfit
                        };

                    }

                } catch (error) {

                    console.error(
                        "❌ Failed to extract Risk/Reward values",
                        error
                    );
                }
            }


            return {

                id,

                type,

                points,

                riskReward
            };

        });

    } catch (error) {

        console.error(
            "❌ Failed to extract drawings",
            error
        );

        return [];
    }
};

// ============================================================
// GET MARKET DATA SNAPSHOT
// ============================================================

window.VantageForge.getMarketData = function () {

    try {

        const model =
            window.VantageForge.getChartModel();

        const bars =
            model?._mainSeries?.bars()?._items || [];

        const candles =
            bars
                .map(bar => {

                    const [
                        rawTimestamp,
                        open,
                        high,
                        low,
                        close,
                        volume
                    ] = bar.value;

                    const timestamp =
                        Number(rawTimestamp) > 10_000_000_000
                            ? Number(rawTimestamp) / 1000
                            : Number(rawTimestamp);

                    return {
                        timestamp,
                        open: Number(open),
                        high: Number(high),
                        low: Number(low),
                        close: Number(close),
                        volume: Number.isFinite(Number(volume))
                            ? Number(volume)
                            : null
                    };

                })
                .filter(candle =>
                    Number.isFinite(candle.timestamp) &&
                    Number.isFinite(candle.open) &&
                    Number.isFinite(candle.high) &&
                    Number.isFinite(candle.low) &&
                    Number.isFinite(candle.close)
                )
                .sort(
                    (a, b) =>
                        a.timestamp - b.timestamp
                );

        return {
            source: "TRADINGVIEW",
            candles
        };

    } catch (error) {

        console.error(
            "❌ MARKET DATA EXTRACTION FAILED:",
            error
        );

        return {
            source: "TRADINGVIEW",
            candles: []
        };

    }

};

// ============================================================
// GET CURRENT RISK / REWARD TRADE
// ============================================================

window.VantageForge.getCurrentRR = function () {

    const drawings =
        window.VantageForge.extractDrawings();

    const rrDrawings =
        drawings.filter(
            drawing =>
                drawing.riskReward !== null
        );

    const rrDrawing =
        rrDrawings.find(
            drawing =>
                drawing.id ===
                window.VantageForge.lastRRDrawingId
        ) || rrDrawings.at(-1);

    if (!rrDrawing) {

        console.warn(
            "⚠️ No Risk/Reward drawing found"
        );

        return null;
    }

    console.log(
        "🎯 CURRENT RR FOUND:",
        rrDrawing.riskReward
    );

    const anchorPoints =
        rrDrawing.points.filter(
            point => Number.isFinite(Number(point.time))
        );

    const chartAnchorTime = anchorPoints.length > 0
        ? Math.min(
            ...anchorPoints.map(point => {
                const time = Number(point.time);

                const rawMilliseconds = time < 10_000_000_000
                    ? time * 1000
                    : time;
                // TradingView RR point times are chart-wall-clock values.
                // Convert them once into the browser's local epoch so the
                // dashboard and outcome scan use the same chart timestamp.
                return rawMilliseconds + (new Date(rawMilliseconds).getTimezoneOffset() * 60_000);
            })
        )
        : null;

    let pathOutcome = null;
    let pathOutcomeTime = null;
    try {
        const model = window.VantageForge.getChartModel();
        const bars = model?._mainSeries?.bars()?._items || [];
        const anchorSeconds = chartAnchorTime == null ? null : chartAnchorTime / 1000;
        const intervalSeconds = Number(anchorPoints[0]?.interval || 0) * 60;
        // Only scan candles at and after the RR tool anchor. Earlier candles
        // belong to pre-trade price action and must not decide the outcome.
        // Ignore the anchor candle itself; begin with the next complete candle.
        const pathStart = anchorSeconds == null
            ? null
            : anchorSeconds + (Number.isFinite(intervalSeconds) && intervalSeconds > 0 ? intervalSeconds : 0);
        const path = bars
            .map(bar => {
                const [rawTimestamp, open, high, low, close] = bar.value;
                const timestamp = Number(rawTimestamp) > 10_000_000_000
                    ? Number(rawTimestamp) / 1000
                    : Number(rawTimestamp);
                return { timestamp, open, high, low, close };
            })
            .filter(bar => pathStart == null || bar.timestamp >= pathStart)
            .sort((a, b) => a.timestamp - b.timestamp);
        for (const bar of path) {
            const hitStop = rrDrawing.riskReward.direction === "LONG"
                ? bar.low <= rrDrawing.riskReward.stopLoss
                : bar.high >= rrDrawing.riskReward.stopLoss;
            const hitTarget = rrDrawing.riskReward.direction === "LONG"
                ? bar.high >= rrDrawing.riskReward.takeProfit
                : bar.low <= rrDrawing.riskReward.takeProfit;
            // If both levels occur in one candle, intrabar order is unknowable.
            if (hitStop && hitTarget) break;
            if (hitTarget) { pathOutcome = "WIN"; pathOutcomeTime = bar.timestamp; break; }
            if (hitStop) { pathOutcome = "LOSS"; pathOutcomeTime = bar.timestamp; break; }
        }
    } catch (error) {
        console.warn("⚠️ Could not infer outcome from chart path", error);
    }

    return {
        ...rrDrawing.riskReward,
        drawingId: rrDrawing.id,
        chartAnchorTime,
        chartAnchorInterval: anchorPoints[0]?.interval || null,
        pathOutcome,
        pathOutcomeTime
    };
};

// ============================================================
// RECEIVE CURRENT RR REQUEST FROM CONTENT SCRIPT
// ============================================================

window.addEventListener("message", event => {

    if (
        event.source !== window ||
        event.origin !== window.location.origin
    ) {
        return;
    }

    if (event.data?.type === "VANTAGE_GET_CURRENT_PRICE") {
        window.postMessage({
            type: "VANTAGE_CURRENT_PRICE_RESPONSE",
            price: window.VantageForge.getCurrentPrice()
        }, window.location.origin);
        return;
    }

    if (event.data?.type === "VANTAGE_GET_CURRENT_RR") {

        console.log(
            "📡 PAGE RECEIVED CURRENT RR REQUEST"
        );

        const rr =
    window.VantageForge.getCurrentRR();

const marketData =
    window.VantageForge.getMarketData();

const structure =
    window.vantageForgeStructure || null;

console.log(
    "🧠 PAGE STRUCTURE:",
    structure
);

window.postMessage({
    type: "VANTAGE_CURRENT_RR_RESPONSE",
    rr: rr || null,
    marketData: marketData,
    structure: structure
}, window.location.origin);

        console.log(
            "📤 PAGE SENT CURRENT RR:",
            rr
        );
        console.log(
    "📊 PAGE SENT MARKET DATA:",
    marketData
);
    }

});


// ============================================================
// TEST DRAWING EXTRACTION
// ============================================================

window.VantageForge.testDrawings = function () {

    const drawings =
        window.VantageForge.extractDrawings();

    console.log(
        "📊 DRAWING COUNT:",
        drawings.length
    );

    console.table(
        drawings.map(drawing => ({
            id: drawing.id,
            type: drawing.type,
            points: drawing.points.length
        }))
    );

    return drawings;
};


// ============================================================
// GET DRAWING SNAPSHOT
// ============================================================

window.VantageForge.getDrawingSnapshot = function () {

    const drawings =
        window.VantageForge.extractDrawings();

    return new Map(
        drawings.map(drawing => [
            drawing.id,
            JSON.stringify(drawing)
        ])
    );
};


// ============================================================
// COMPARE DRAWING SNAPSHOTS
// ============================================================

window.VantageForge.compareDrawings = function (
    previous,
    current
) {

    const changes = [];


    // --------------------------------------------------------
    // CREATED / MODIFIED
    // --------------------------------------------------------

    for (const [id, currentValue] of current) {

        // CREATED
        if (!previous.has(id)) {

            changes.push({
                action: "CREATED",
                id: id,
                drawing: JSON.parse(currentValue)
            });

            continue;
        }


        // MODIFIED
        const previousValue =
            previous.get(id);

        if (previousValue !== currentValue) {

            changes.push({
                action: "MODIFIED",
                id: id,
                drawing: JSON.parse(currentValue)
            });
        }
    }


    // --------------------------------------------------------
    // DELETED
    // --------------------------------------------------------

    for (const [id, previousValue] of previous) {

        if (!current.has(id)) {

            changes.push({
                action: "DELETED",
                id: id,
                drawing: JSON.parse(previousValue)
            });
        }
    }


    return changes;
};


// ============================================================
// NORMALIZE DRAWING EVENT
// ============================================================

window.VantageForge.createDrawingEvent = function (change) {

    // ============================================================
    // BASE EVENT
    // ============================================================

    const event = {
        event: `DRAWING_${change.action}`,

        id: change.id,

        drawing: {
            id: change.drawing.id,
            type: change.drawing.type,
            points: change.drawing.points,
            riskReward: change.drawing.riskReward || null
        },

        timestamp: new Date().toISOString()
    };


    // ============================================================
    // ONLY ANALYZE NEW RR DRAWINGS
    // ============================================================

    if (
        change.action === "CREATED" &&
        change.drawing?.riskReward
    ) {

        try {

            const model =
                window.VantageForge.getChartModel();

            const series =
                model?._mainSeries;

            const bars =
                series?.bars();


            if (!model || !series || !bars) {

                console.warn(
                    "⚠️ Could not access chart data for pre-creation analysis"
                );

                return event;
            }


            // ====================================================
            // RR DATA
            // ====================================================

            const rr =
                change.drawing.riskReward;

            const direction =
                rr.direction;

            const entry =
                Number(rr.entry);

            const stopLoss =
                Number(rr.stopLoss);

            const takeProfit =
                Number(rr.takeProfit);


            // ====================================================
            // CREATION TIME
            // ====================================================

            const creationTimestamp =
                new Date(event.timestamp).getTime() / 1000;


            // ====================================================
            // CREATION PRICE
            // ====================================================

            const lastValue =
                series.lastValueData();

            const creationPrice =
                Number(
                    lastValue?.formattedPriceAbsolute
                        ?.replace(/,/g, "")
                );


            if (!Number.isFinite(creationPrice)) {

                console.warn(
                    "⚠️ Could not determine creation price"
                );

                return event;
            }


            event.creationPrice =
                creationPrice;


            // ====================================================
            // BUILD HISTORICAL BARS
            // ====================================================

            const allBars =
                bars._items
                    .map(bar => {

                        const [
                            timestamp,
                            open,
                            high,
                            low,
                            close,
                            volume
                        ] = bar.value;

                        return {

                            index: bar.index,

                            timestamp,

                            date:
                                new Date(
                                    timestamp * 1000
                                ).toISOString(),

                            open,
                            high,
                            low,
                            close,
                            volume
                        };

                    })
                    .sort(
                        (a, b) =>
                            a.timestamp -
                            b.timestamp
                    );


            // ====================================================
            // FIND CREATION CANDLE
            // ====================================================

            const creationBar =
                [...allBars]
                    .reverse()
                    .find(
                        bar =>
                            bar.timestamp <=
                            creationTimestamp
                    );


            if (!creationBar) {

                console.warn(
                    "⚠️ Creation candle not found"
                );

                return event;
            }


            // ====================================================
            // HISTORICAL BARS ONLY
            // ====================================================

            const historicalBars =
                allBars.filter(
                    bar =>
                        bar.timestamp <
                        creationBar.timestamp
                );


            // ====================================================
// INTERACTION TRACKING
// ============================================================

const interactions = [];

for (const bar of historicalBars) {

    // --------------------------------------------------------
    // ENTRY
    // --------------------------------------------------------

    const entryTouched =
        bar.low <= entry &&
        bar.high >= entry;


    // --------------------------------------------------------
    // STOP LOSS
    // --------------------------------------------------------

    const stopLossTouched =
        direction === "LONG"
            ? bar.low <= stopLoss
            : bar.high >= stopLoss;


    // --------------------------------------------------------
    // TAKE PROFIT
    // --------------------------------------------------------

    const takeProfitTouched =
        direction === "LONG"
            ? bar.high >= takeProfit
            : bar.low <= takeProfit;


    // --------------------------------------------------------
    // RECORD INTERACTIONS
    // --------------------------------------------------------

    if (entryTouched) {

        interactions.push({
            level: "ENTRY",
            index: bar.index,
            timestamp: bar.timestamp,
            date: bar.date
        });
    }


    if (stopLossTouched) {

        interactions.push({
            level: "SL",
            index: bar.index,
            timestamp: bar.timestamp,
            date: bar.date
        });
    }


    if (takeProfitTouched) {

        interactions.push({
            level: "TP",
            index: bar.index,
            timestamp: bar.timestamp,
            date: bar.date
        });
    }
}


// ============================================================
// SORT INTERACTIONS CHRONOLOGICALLY
// ============================================================

interactions.sort(
    (a, b) =>
        a.timestamp - b.timestamp
);


// ============================================================
// LEVEL FLAGS
// ============================================================

const entryAlreadyTouched =
    interactions.some(
        interaction =>
            interaction.level === "ENTRY"
    );


const stopLossAlreadyTouched =
    interactions.some(
        interaction =>
            interaction.level === "SL"
    );


const takeProfitAlreadyTouched =
    interactions.some(
        interaction =>
            interaction.level === "TP"
    );


// ============================================================
// LAST HISTORICAL INTERACTION
// ============================================================

const lastInteraction =
    interactions.length > 0
        ? interactions[interactions.length - 1]
        : null;


// ============================================================
// CREATION PRICE STATE
// ============================================================

let state = "UNKNOWN";


if (direction === "LONG") {

    if (creationPrice <= stopLoss) {

        state = "SL_ALREADY_PASSED";

    }
    else if (creationPrice >= takeProfit) {

        state = "TP_ALREADY_PASSED";

    }
    else if (creationPrice >= entry) {

        state = "PRICE_ABOVE_ENTRY";

    }
    else {

        state = "ENTRY_AHEAD";
    }

}
else {

    if (creationPrice >= stopLoss) {

        state = "SL_ALREADY_PASSED";

    }
    else if (creationPrice <= takeProfit) {

        state = "TP_ALREADY_PASSED";

    }
    else if (creationPrice <= entry) {

        state = "PRICE_BELOW_ENTRY";

    }
    else {

        state = "ENTRY_AHEAD";
    }
}


// ============================================================
// PRE-CREATION ANALYSIS
// ============================================================

event.preCreationAnalysis = {

    // --------------------------------------------------------
    // WHEN THE RR WAS CREATED
    // --------------------------------------------------------

    creationPrice,

    creationTimestamp,


    // --------------------------------------------------------
    // CANDLE IN WHICH RR WAS CREATED
    // --------------------------------------------------------

    creationCandle: {

        index:
            creationBar.index,

        timestamp:
            creationBar.timestamp,

        date:
            creationBar.date,

        open:
            creationBar.open,

        high:
            creationBar.high,

        low:
            creationBar.low,

        close:
            creationBar.close
    },


    // --------------------------------------------------------
    // WHAT HAD ALREADY HAPPENED
    // --------------------------------------------------------

    entryAlreadyTouched,

    stopLossAlreadyTouched,

    takeProfitAlreadyTouched,


    // --------------------------------------------------------
    // MOST RECENT HISTORICAL INTERACTION
    // --------------------------------------------------------

    lastInteraction,


    // --------------------------------------------------------
    // TOTAL HISTORICAL INTERACTIONS
    // --------------------------------------------------------

    interactionCount:
        interactions.length,


    // --------------------------------------------------------
    // PRICE STATE AT CREATION
    // --------------------------------------------------------

    state
};


// ============================================================
// DEBUG OUTPUT
// ============================================================

console.log(
    "🧠 PRE-CREATION ANALYSIS",
    event.preCreationAnalysis
);

        }

        catch (error) {

            console.error(
                "❌ PRE-CREATION ANALYSIS FAILED",
                error
            );
        }
    }


    // ============================================================
    // RETURN EVENT
    // ============================================================

    return event;
};


// ============================================================
// DISPATCH DRAWING EVENT
// ============================================================

window.VantageForge.dispatchDrawingEvent = function (
    event
) {

    console.log(
        "📡 DRAWING EVENT:",
        event
    );

    const action =
        event.event === "DRAWING_CREATED"
            ? "CREATED"
            : event.event === "DRAWING_MODIFIED"
                ? "MODIFIED"
                : event.event === "DRAWING_DELETED"
                    ? "DELETED"
                    : event.event;

    // Capture Trade should use the RR plan the trader most recently worked on,
    // rather than an unrelated RR drawing elsewhere on the chart.
    if (
        event.drawing?.riskReward &&
        (action === "CREATED" || action === "MODIFIED")
    ) {
        window.VantageForge.lastRRDrawingId = event.id;
    }

    window.postMessage(
        {
            type: "VANTAGE_DRAWING_CHANGE",

            changes: [
                {
                    action: action,
                    id: event.id,
                    drawing: event.drawing,

                    creationPrice:
                        event.creationPrice || null,

                    preCreationAnalysis:
                        event.preCreationAnalysis || null
                }
            ]
        },
        "*"
    );
};


// ============================================================
// START DRAWING MONITOR
// ============================================================

window.VantageForge.startDrawingMonitoring = function () {

    // Prevent duplicate monitoring
    if (window.VantageForge._drawingMonitorInterval) {

        console.log(
            "⚠️ Drawing monitoring already active"
        );

        return false;
    }

    let lastSentPrice = null;



    console.log(
        "👀 Starting drawing monitoring..."
    );


    // Take initial snapshot
    let previous =
        window.VantageForge.getDrawingSnapshot();


    // Start polling
    window.VantageForge._drawingMonitorInterval =
        setInterval(() => {

            const current =
                window.VantageForge.getDrawingSnapshot();

            // ============================================================
// SEND CURRENT PRICE
// ============================================================

const currentPrice =
    window.VantageForge.getCurrentPrice();

if (typeof currentPrice === "number") {

    if (currentPrice !== lastSentPrice) {

        lastSentPrice = currentPrice;

        console.log(
            "💰 PRICE UPDATE:",
            currentPrice
        );

        window.postMessage({

            type: "VANTAGE_PRICE_UPDATE",

            price: currentPrice,

            timestamp:
                new Date().toISOString()

        }, "*");
    }
}


            const changes =
                window.VantageForge.compareDrawings(
                    previous,
                    current
                );


            if (changes.length > 0) {

                console.log(
                    "🔥 DRAWING CHANGES DETECTED:",
                    changes
                );


                for (const change of changes) {

                    const event =
                        window.VantageForge.createDrawingEvent(
                            change
                        );


                    window.VantageForge.dispatchDrawingEvent(
                        event
                    );
                }
            }


            previous = current;

        }, 1000);


    console.log(
        "✅ Drawing monitoring ACTIVE"
    );

    return true;
};


// ============================================================
// STOP DRAWING MONITOR
// ============================================================

window.VantageForge.stopDrawingMonitoring = function () {

    if (!window.VantageForge._drawingMonitorInterval) {

        console.log(
            "⚠️ Drawing monitoring is not running"
        );

        return false;
    }


    clearInterval(
        window.VantageForge._drawingMonitorInterval
    );


    window.VantageForge._drawingMonitorInterval =
        null;


    console.log(
        "🛑 Drawing monitoring STOPPED"
    );

    return true;
};


console.log("🌐 VantageForge READY");

window.VantageForge.loadHistoricalBars = async function (count = 2000) {
    const model = window.VantageForge.getChartModel();

    if (!model || !model._mainSeries) {
        throw new Error("Chart model or main series unavailable");
    }

    const series = model._mainSeries;

    const before = series.bars()?._items?.length || 0;

    console.log("📚 HISTORICAL LOAD START");
    console.log("Current bars:", before);
    console.log("Requested additional bars:", count);

    if (typeof series.requestMoreData !== "function") {
        throw new Error("TradingView requestMoreData unavailable");
    }

    series.requestMoreData(count);

    const timeout = 15000;
    const pollInterval = 250;
    const start = Date.now();

    while (Date.now() - start < timeout) {
        const current = series.bars()?._items?.length || 0;

        if (current >= before + count) {
            break;
        }

        await new Promise(resolve =>
            setTimeout(resolve, pollInterval)
        );
    }

    const items = series.bars()?._items || [];

    console.log("📚 HISTORICAL LOAD COMPLETE");
    console.log("Bars before:", before);
    console.log("Bars after:", items.length);
    console.log("Bars added:", items.length - before);

    return items;
};

function getHistoricalCandles() {
    try {
        const model = window.VantageForge.getChartModel();

        const bars =
            model?._mainSeries?.bars()?._items || [];

        const candles = bars
            .map(bar => {
                const v = bar?.value;

                if (!Array.isArray(v) || v.length < 5) {
                    return null;
                }

                return {
                    timestamp: Number(v[0]),
                    open: Number(v[1]),
                    high: Number(v[2]),
                    low: Number(v[3]),
                    close: Number(v[4]),
                    volume: Number(v[5] ?? 0)
                };
            })
            .filter(Boolean)
            .filter(candle =>
                Number.isFinite(candle.timestamp)
            )
            .sort(
                (a, b) =>
                    a.timestamp - b.timestamp
            );

        return candles;

    } catch (error) {
        console.warn(
            "⚠️ Failed to extract historical candles",
            error
        );

        return [];
    }
}

function getCandleIntervalSeconds(candles) {
    if (candles.length < 2) {
        return null;
    }

    const interval =
        candles[1].timestamp -
        candles[0].timestamp;

    return Number.isFinite(interval) && interval > 0
        ? interval
        : null;
}

function findAnchorCandle(candles, anchorSeconds) {
    if (!Number.isFinite(anchorSeconds)) {
        return null;
    }

    for (let i = 0; i < candles.length; i++) {
        const candle = candles[i];

        const next =
            candles[i + 1];

        const candleStart =
            candle.timestamp;

        const candleEnd =
            next
                ? next.timestamp
                : candle.timestamp;

        if (
            anchorSeconds >= candleStart &&
            anchorSeconds < candleEnd
        ) {
            return {
                candle,
                index: i
            };
        }
    }

    return null;
}
