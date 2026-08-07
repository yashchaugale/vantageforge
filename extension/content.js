console.log("✅ Content Script Loaded");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.type === "GET_PAGE_INFO") {

        const symbol =
            document
                .querySelector("#header-toolbar-symbol-search")
                ?.textContent
                .trim() || "";

        sendResponse({

            symbol: symbol,

            title: document.title

        });

    }

});