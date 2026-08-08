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


    // ========================================================
    // DRAWING EVENTS
    // ========================================================

    if (
        event.data?.type === "VANTAGE_DRAWING_EVENT"
    ) {

        console.log(
            "📐 DRAWING RECEIVED",
            event.data.event
        );


        chrome.runtime.sendMessage({

            type: "DRAWING_EVENT",

            event: event.data.event

        });

    }


    // ========================================================
    // TRADE EVENTS
    // ========================================================

    if (
        event.data?.type === "VANTAGE_TRADE_EVENT"
    ) {

        console.log(
            "📨 TRADE RECEIVED",
            event.data.event
        );


        chrome.runtime.sendMessage({

            type: "TRADE_EVENT",

            event: event.data.event

        });

    }

});