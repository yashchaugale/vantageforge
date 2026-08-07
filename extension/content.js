console.log("✅ Content Script Loaded");

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