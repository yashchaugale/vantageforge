const TRADE_STATE_KEY = "vantageforge_trade_state";

// ============================================================
// GET CURRENT TRADE STATE
// ============================================================

export async function getTradeState() {

    const result = await chrome.storage.local.get(
        [TRADE_STATE_KEY]
    );

    return result[TRADE_STATE_KEY] || null;
}

// ============================================================
// PROCESS PRICE UPDATE
// ============================================================

export async function processPriceUpdate(data) {

    const trade =
        await getTradeState();

    if (!trade) {
        return;
    }

    await processDrawingEvent({
        event: "PRICE_UPDATE",
        price: data.price,
        timestamp: data.timestamp
    });
}


// ============================================================
// CREATE NEW TRADE STATE
// ============================================================

export async function createTradeState(context = {}) {

    const trade = {

        id: crypto.randomUUID(),

        createdAt: new Date().toISOString(),

        // ========================================================
        // TRADE LIFECYCLE
        // ========================================================

        status: "OPEN",

        phase: "SETUP",

        setupCreatedAt:
            context.setupCreatedAt || null,

        activatedAt: null,

        closedAt: null,

        // WIN / LOSS / HISTORICAL_AMBIGUOUS
        result: null,

        // ========================================================
        // CHART CONTEXT
        // ========================================================

        symbol: context.symbol || "",
        timeframe: context.timeframe || "",
        exchange: context.exchange || "",
        url: context.url || "",

        // ========================================================
        // DRAWINGS
        // ========================================================

        drawings: [],

        // ========================================================
        // TRADE LEVELS
        // ========================================================

        direction: null,

        entry: null,
        stopLoss: null,
        takeProfit: null,

        preCreationState: null,

        creationPrice: null,

        lastPreCreationInteraction: null,

        entryAlreadyTouched: false,
        stopLossAlreadyTouched: false,
        takeProfitAlreadyTouched: false,

        // ========================================================
        // JOURNAL DATA
        // ========================================================

        screenshot: null,

        notes: "",

        emotions: []
    };


    await chrome.storage.local.set({
        [TRADE_STATE_KEY]: trade
    });


    console.log(
        "🧠 NEW TRADE STATE CREATED",
        trade
    );


    return trade;
}


// ============================================================
// HANDLE DRAWING EVENT
// ============================================================

export async function processDrawingEvent(event) {

    let trade = await getTradeState();


    // --------------------------------------------------------
    // No active trade yet
    // --------------------------------------------------------

    if (!trade) {

        trade = await createTradeState({
            symbol: event.symbol,
            timeframe: event.timeframe,
            exchange: event.exchange,
            url: event.url
        });
    }
    // ============================================================
// UPDATE CHART CONTEXT
// ============================================================

if (event.symbol) {
    trade.symbol = event.symbol;
}

if (event.timeframe) {
    trade.timeframe = event.timeframe;
}

if (event.exchange) {
    trade.exchange = event.exchange;
}

if (event.url) {
    trade.url = event.url;
}


    // --------------------------------------------------------
    // DRAWING CREATED
    // --------------------------------------------------------

    if (event.event === "DRAWING_CREATED") {

        const exists =
            trade.drawings.some(
                drawing => drawing.id === event.id
            );


        if (!exists) {

            trade.drawings.push(
                event.drawing
            );
        }


        console.log(
            "➕ DRAWING ADDED TO TRADE",
            event.id
        );
    }


    // --------------------------------------------------------
    // DRAWING MODIFIED
    // --------------------------------------------------------

    else if (event.event === "DRAWING_MODIFIED") {

        const index =
            trade.drawings.findIndex(
                drawing => drawing.id === event.id
            );


        if (index !== -1) {

            trade.drawings[index] =
                event.drawing;


            console.log(
                "✏️ DRAWING UPDATED IN TRADE",
                event.id
            );

        } else {

            // Safety fallback:
            // If we somehow missed CREATED,
            // add the drawing now.

            trade.drawings.push(
                event.drawing
            );


            console.log(
                "⚠️ MODIFIED DRAWING WAS NOT FOUND — ADDED",
                event.id
            );
        }
    }


    // --------------------------------------------------------
    // DRAWING DELETED
    // --------------------------------------------------------

    else if (event.event === "DRAWING_DELETED") {

        trade.drawings =
            trade.drawings.filter(
                drawing => drawing.id !== event.id
            );


        console.log(
            "🗑️ DRAWING REMOVED FROM TRADE",
            event.id
        );
    }


    // --------------------------------------------------------
// RISK / REWARD TRADE LEVELS
// --------------------------------------------------------

if (event.drawing?.riskReward) {

    const rr = event.drawing.riskReward;

    trade.direction = rr.direction;

    trade.entry = rr.entry;

    trade.stopLoss = rr.stopLoss;

    trade.takeProfit = rr.takeProfit;

    console.log(
        "🎯 TRADE LEVELS UPDATED",
        {
            direction: trade.direction,
            entry: trade.entry,
            stopLoss: trade.stopLoss,
            takeProfit: trade.takeProfit
        }
    );
}


// --------------------------------------------------------
// PRE-CREATION ANALYSIS
// --------------------------------------------------------
//
// This tells us what had already happened BEFORE
// the user placed the RR tool.
//

if (
    event.event === "DRAWING_CREATED" &&
    event.preCreationAnalysis
) {

    const analysis =
        event.preCreationAnalysis;


    trade.preCreationState =
        analysis.state || null;


    trade.creationPrice =
        analysis.creationPrice ?? null;


    trade.lastPreCreationInteraction =
        analysis.lastInteraction || null;


    trade.entryAlreadyTouched =
        analysis.entryAlreadyTouched || false;


    trade.stopLossAlreadyTouched =
        analysis.stopLossAlreadyTouched || false;


    trade.takeProfitAlreadyTouched =
        analysis.takeProfitAlreadyTouched || false;


    console.log(
        "🧠 PRE-CREATION STATE SAVED",
        {
            state:
                trade.preCreationState,

            creationPrice:
                trade.creationPrice,

            lastInteraction:
                trade.lastPreCreationInteraction,

            entryAlreadyTouched:
                trade.entryAlreadyTouched,

            stopLossAlreadyTouched:
                trade.stopLossAlreadyTouched,

            takeProfitAlreadyTouched:
                trade.takeProfitAlreadyTouched
        }
    );
}

    // ============================================================
// TRADE LIFECYCLE
// ============================================================
//
// IMPORTANT:
// Only interactions AFTER RR CREATION can activate/close
// the trade.
//
// Historical interactions stored in preCreationAnalysis
// are NOT treated as actual trade execution.
// ============================================================

if (
    event.event === "PRICE_UPDATE" &&
    trade.status === "OPEN"
) {

    const price = event.price;

    if (
        typeof price !== "number" ||
        !trade.entry ||
        !trade.stopLoss ||
        !trade.takeProfit ||
        !trade.direction
    ) {
        return trade;
    }


    // ========================================================
    // SETUP → ACTIVE
    // ========================================================

    if (trade.phase === "SETUP") {

        const entryHit =
            trade.direction === "LONG"
                ? price >= trade.entry
                : price <= trade.entry;


        if (entryHit) {

            trade.phase = "ACTIVE";

            trade.activatedAt =
                new Date().toISOString();

            console.log(
                "🚀 TRADE ACTIVATED",
                {
                    price,
                    entry: trade.entry,
                    direction: trade.direction
                }
            );
        }
    }


    // ========================================================
    // ACTIVE → TP / SL
    // ========================================================

    if (trade.phase === "ACTIVE") {

        const tpHit =
            trade.direction === "LONG"
                ? price >= trade.takeProfit
                : price <= trade.takeProfit;


        const slHit =
            trade.direction === "LONG"
                ? price <= trade.stopLoss
                : price >= trade.stopLoss;


        // ----------------------------------------------------
        // TP FIRST
        // ----------------------------------------------------

        if (tpHit) {

            trade.phase = "CLOSED";

            trade.status = "CLOSED";

            trade.result = "WIN";

            trade.closedAt =
                new Date().toISOString();

            console.log(
                "🎯 TRADE CLOSED — WIN",
                {
                    price,
                    takeProfit: trade.takeProfit
                }
            );
        }


        // ----------------------------------------------------
        // SL
        // ----------------------------------------------------

        else if (slHit) {

            trade.phase = "CLOSED";

            trade.status = "CLOSED";

            trade.result = "LOSS";

            trade.closedAt =
                new Date().toISOString();

            console.log(
                "🛑 TRADE CLOSED — LOSS",
                {
                    price,
                    stopLoss: trade.stopLoss
                }
            );
        }
    }
}


    // --------------------------------------------------------
    // UPDATE TIMESTAMP
    // --------------------------------------------------------

    trade.updatedAt =
        new Date().toISOString();


    // --------------------------------------------------------
    // SAVE
    // --------------------------------------------------------

    await chrome.storage.local.set({

        [TRADE_STATE_KEY]: trade

    });


    console.log(
        "💾 TRADE STATE SAVED",
        trade
    );


    return trade;
}