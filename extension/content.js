console.log("✅ Content Script Loaded");

window.VantageForge = window.VantageForge || {};

console.log("🧠 VantageForge initialized");


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.type === "GET_PAGE_INFO") {

        const symbol =
            document
                .querySelector("#header-toolbar-symbol-search")
                ?.textContent
                .trim() || "";

        const timeframe =
    document
        .querySelector("#header-toolbar-intervals")
        ?.textContent
        .trim() || "";

const exchange =
    document
        .querySelector('[data-qa-id="title-wrapper legend-source-exchange"]')
        ?.textContent
        .trim() || "";

sendResponse({
    symbol: symbol,
    timeframe: timeframe,
    exchange: exchange,
    title: document.title
});

    }

});
window.addEventListener("message", event => {

    if (event.source !== window) {
        return;
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

    timestamp: new Date().toISOString()
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