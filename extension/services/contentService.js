export async function getPageInfo() {

    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    return new Promise((resolve, reject) => {

        chrome.tabs.sendMessage(
            tab.id,
            {
                type: "PING"
            },
            (response) => {

                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }

                resolve(response);

            }
        );

    });

}