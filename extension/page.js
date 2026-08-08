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

            return {
                id,
                type,
                points
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

    return {

        event: `DRAWING_${change.action}`,

        id: change.id,

        drawing: {
            id: change.drawing.id,

            type: change.drawing.type,

            points: change.drawing.points
        },

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

    window.postMessage(
        {
            type: "VANTAGE_DRAWING_EVENT",
            event: event
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