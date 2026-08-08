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

window.VantageForge.createDrawingEvent = function (
    change
) {

    const currentPrice =
        window.VantageForge.getCurrentPrice();

    return {

        event: `DRAWING_${change.action}`,

        id: change.id,

        drawing: {

            id:
                change.drawing.id,

            type:
                change.drawing.type,

            points:
                change.drawing.points,

            riskReward:
                change.drawing.riskReward || null
        },

        // Price at the moment VantageForge
        // detected the drawing
        creationPrice:
            currentPrice,

        timestamp:
            new Date().toISOString()
    };
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

    window.postMessage(
        {
            type: "VANTAGE_DRAWING_CHANGE",

            changes: [
                {
                    action: action,
                    id: event.id,
                    drawing: event.drawing
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