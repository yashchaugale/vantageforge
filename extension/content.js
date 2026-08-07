console.log("✅ Content Script Loaded");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    console.log("📨 Received:", request);

    if (request.type === "PING") {

        sendResponse({
            title: document.title
        });

    }

});