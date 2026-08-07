import { createTrade } from "../models/trade.js";
import { saveTrade } from "./storageService.js";
import { getPageInfo } from "./contentService.js";

export async function captureTrade() {

    const trade = createTrade();

    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    trade.url = tab.url;

    const pageInfo = await getPageInfo();

    trade.title = pageInfo.title;
    trade.symbol = pageInfo.symbol;

    const image = await chrome.tabs.captureVisibleTab({
        format: "png"
    });

    trade.screenshot = image;

    await saveTrade(trade);

    return trade;
}