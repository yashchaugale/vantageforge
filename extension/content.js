console.log("✅ VantageForge content script loaded");

let pendingRRResponse = null;


function getPageInfo() {

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

    return {
        symbol,
        timeframe,
        exchange,
        title: document.title
    };
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.type === "GET_PAGE_INFO") {

        sendResponse(getPageInfo());

        return;
    }

    if (request.type === "GET_CURRENT_PRICE") {
        const handler = event => {
            if (event.data?.type !== "VANTAGE_CURRENT_PRICE_RESPONSE") return;
            window.removeEventListener("message", handler);
            sendResponse({ price: Number.isFinite(event.data.price) ? event.data.price : null });
        };
        window.addEventListener("message", handler);
        window.postMessage({ type: "VANTAGE_GET_CURRENT_PRICE" }, window.location.origin);
        return true;
    }

    if (request.type === "GET_CURRENT_RR") {

        if (pendingRRResponse) {

            sendResponse({
                rr: null,
                error: "A Risk/Reward request is already in progress."
            });

            return;
        }

        pendingRRResponse = sendResponse;

        window.postMessage(
            { type: "VANTAGE_GET_CURRENT_RR" },
            window.location.origin
        );

        return true;
    }
});


window.addEventListener("message", event => {

    if (
        event.source !== window ||
        event.origin !== window.location.origin ||
        event.data?.type !== "VANTAGE_CURRENT_RR_RESPONSE"
    ) {
        return;
    }

    if (!pendingRRResponse) {
        return;
    }

    pendingRRResponse({
    rr: event.data.rr || null,
    marketData: event.data.marketData || null
});

pendingRRResponse = null;
});
