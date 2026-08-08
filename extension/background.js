console.log("🚀 VantageForge background loaded");

chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        console.log(
            "📡 BACKGROUND RECEIVED",
            message
        );


        // ====================================================
        // DRAWING EVENT
        // ====================================================

        if (message.type === "DRAWING_EVENT") {

            const event = message.event;

            console.log(
                "📐 SAVING DRAWING EVENT",
                event
            );


            chrome.storage.local.get(
                ["vantageforge_events"],
                (result) => {

                    const events =
                        result.vantageforge_events || [];


                    events.push({
                        ...event,

                        receivedAt:
                            new Date().toISOString()
                    });


                    chrome.storage.local.set(
                        {
                            vantageforge_events:
                                events
                        },
                        () => {

                            console.log(
                                "💾 DRAWING EVENT SAVED",
                                event.id
                            );

                        }
                    );

                }
            );


            sendResponse({
                status: "received"
            });

            return true;
        }

    }
);