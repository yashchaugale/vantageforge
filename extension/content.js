console.log("✅ Content Script Loaded");

window.VantageForge = window.VantageForge || {};

let pendingRRResponse = null;

console.log("🧠 VantageForge initialized");


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    // ============================================================
    // GET PAGE INFO
    // ============================================================

    if (request.type === "GET_PAGE_INFO") {

        const symbol =
            document
                .querySelector("#header-toolbar-symbol-search")
                ?.textContent
                .trim() || "";

        const activeTimeframe =
    document.querySelector(
        '#header-toolbar-intervals [role="radio"][aria-checked="true"]'
    );

const timeframe =
    activeTimeframe
        ?.querySelector(".value-EzLGe8ai")
        ?.textContent
        .trim() || "";

        const exchange =
            document
                .querySelector(
                    '[data-qa-id="title-wrapper legend-source-exchange"]'
                )
                ?.textContent
                .trim() || "";

        sendResponse({
            symbol: symbol,
            timeframe: timeframe,
            exchange: exchange,
            title: document.title
        });

        return;
    }


    // ============================================================
    // GET CURRENT RR
    // ============================================================

    if (request.type === "GET_CURRENT_RR") {

    console.log(
        "📡 CONTENT REQUESTING CURRENT RR"
    );

    pendingRRResponse = sendResponse;

    window.postMessage({
        type: "VANTAGE_GET_CURRENT_RR"
    }, "*");

    return true;
}

});
window.addEventListener("message", event => {

    if (event.source !== window) {
        return;
    }

        // ============================================================
    // CURRENT RR RESPONSE
    // ============================================================

    if (event.data?.type === "VANTAGE_CURRENT_RR_RESPONSE") {

    console.log(
        "🎯 CONTENT RECEIVED CURRENT RR:",
        event.data.rr
    );


    // ============================================================
    // RESPOND TO captureTrade()
    // ============================================================

    if (pendingRRResponse) {

        pendingRRResponse({
            rr: event.data.rr || null
        });

        pendingRRResponse = null;

        console.log(
            "📤 CURRENT RR SENT BACK TO CAPTURE TRADE"
        );

    }

}

    // ============================================================
// PRICE UPDATE
// ============================================================

if (event.data?.type === "VANTAGE_PRICE_UPDATE") {

    console.log(
        "💰 CONTENT RECEIVED PRICE:",
        event.data.price
    );

    chrome.runtime.sendMessage({

        type: "PRICE_UPDATE",

        price: event.data.price,

        timestamp: event.data.timestamp

    });

}

    // ============================================================
    // DRAWING CHANGE
    // ============================================================

    if (event.data?.type === "VANTAGE_DRAWING_CHANGE") {

        console.log(
            "📨 CONTENT RECEIVED DRAWING CHANGE",
            event.data.changes
        );

        const changes = event.data.changes || [];

        for (const change of changes) {

            let eventType;

            if (change.action === "CREATED") {
                eventType = "DRAWING_CREATED";
            }
            else if (change.action === "MODIFIED") {
                eventType = "DRAWING_MODIFIED";
            }
            else if (change.action === "DELETED") {
                eventType = "DRAWING_DELETED";
            }
            else {
                console.warn(
                    "⚠️ Unknown drawing action:",
                    change.action
                );

                continue;
            }

           // ============================================================
// GET CURRENT CHART CONTEXT
// ============================================================

const symbol =
    document
        .querySelector("#header-toolbar-symbol-search")
        ?.textContent
        .trim() || "";

const activeTimeframe =
    document.querySelector(
        '#header-toolbar-intervals [role="radio"][aria-checked="true"]'
    );

const timeframe =
    activeTimeframe
        ?.querySelector(".value-EzLGe8ai")
        ?.textContent
        .trim() || "";

const exchange =
    document
        .querySelector(
            '[data-qa-id="title-wrapper legend-source-exchange"]'
        )
        ?.textContent
        .trim() || "";

const drawingEvent = {
    event: eventType,

    id: change.id,

    drawing: change.drawing,

    symbol: symbol,

    timeframe: timeframe,

    exchange: exchange,

    title: document.title,

    timestamp: new Date().toISOString(),

    creationPrice:
        change.action === "CREATED"
            ? change.creationPrice
            : undefined,
    
    preCreationAnalysis:
        change.action === "CREATED"
            ? change.preCreationAnalysis
            : undefined
};

            console.log(
                "📤 SENDING DRAWING EVENT",
                drawingEvent
            );

            chrome.runtime.sendMessage({

                type: "DRAWING_EVENT",

                event: drawingEvent

            });

        }

    }

});