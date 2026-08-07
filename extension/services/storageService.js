export async function saveTrade(trade) {

    const result = await chrome.storage.local.get(["trades"]);

    const trades = result.trades || [];

    trades.push(trade);

    await chrome.storage.local.set({
        trades: trades
    });

}