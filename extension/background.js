import {
    processDrawingEvent,
    processPriceUpdate
} from "./services/tradeStateService.js";


console.log(
    "🚀 VantageForge background loaded"
);


chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        console.log(
            "📡 BACKGROUND RECEIVED",
            message
        );

        // ====================================================
        // PRICE UPDATE
        // ====================================================

        if (message.type === "PRICE_UPDATE") {

            processPriceUpdate(message);

            return;
        }


        // ====================================================
        // DRAWING EVENT
        // ====================================================

        if (message.type === "DRAWING_EVENT") {

            const event = message.event;

            console.log(
                "📐 SAVING DRAWING EVENT",
                event
            );

            (async () => {

                try {

                    const tradeState =
                        await processDrawingEvent(event);

                    console.log(
                        "🧠 CURRENT TRADE STATE:",
                        tradeState
                    );


                    const result =
                        await chrome.storage.local.get(
                            ["vantageforge_events"]
                        );

                    const events =
                        result.vantageforge_events || [];

                    events.push({
                        ...event,
                        receivedAt:
                            new Date().toISOString()
                    });

                    await chrome.storage.local.set({

                        vantageforge_events:
                            events

                    });

                    console.log(
                        "💾 DRAWING EVENT SAVED",
                        event.id
                    );

                } catch (error) {

                    console.error(
                        "❌ DRAWING EVENT PROCESSING FAILED",
                        error
                    );

                }

            })();

            sendResponse({
                status: "received"
            });

            return true;
        }

    }
);