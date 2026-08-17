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

    // ============================================================
    // GET TRADINGVIEW PAGE INFO
    // ============================================================

    const pageInfo = await getPageInfo();

    trade.title = pageInfo.title;
    trade.symbol = pageInfo.symbol;
    trade.timeframe = pageInfo.timeframe;
    trade.exchange = pageInfo.exchange;


    // ============================================================
    // GET CURRENT RR TOOL
    // ============================================================

    const rrResponse = await chrome.tabs.sendMessage(
        tab.id,
        {
            type: "GET_CURRENT_RR"
        }
    );

    if (!rrResponse?.rr) {

        throw new Error(
            "No Risk/Reward tool found on the TradingView chart."
        );

    }

    const rr = rrResponse.rr;

    console.log(
        "🎯 CAPTURED RR:",
        rr
    );


    // ============================================================
    // SAVE RR VALUES
    // ============================================================

    trade.direction = rr.direction;
    trade.entry = rr.entry;
    trade.stopLoss = rr.stopLoss;
    trade.takeProfit = rr.takeProfit;


    // ============================================================
    // CAPTURE SCREENSHOT
    // ============================================================

    const image = await chrome.tabs.captureVisibleTab({
        format: "png"
    });

    trade.screenshot = image;


    // ============================================================
    // SAVE TRADE
    // ============================================================

    await saveTrade(trade);

    console.log(
        "✅ TRADE CAPTURED:",
        trade
    );

    return trade;
}