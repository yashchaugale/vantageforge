import { createTrade } from "../models/trade.js";
import { saveTrade } from "./storageService.js";

export async function captureTrade() {

    const trade = createTrade();

    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    trade.url = tab.url;
    trade.title = tab.title;

    const image = await chrome.tabs.captureVisibleTab({
        format: "png"
    });

    trade.screenshot = image;

    await saveTrade(trade);

    return trade;

}