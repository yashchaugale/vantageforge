import { createTrade } from "../models/trade.js";
import { saveTrade } from "./storageService.js";
import { getPageInfo } from "./contentService.js";


function hasValidRiskReward(rr) {

    const values = [
        rr?.entry,
        rr?.stopLoss,
        rr?.takeProfit
    ];

    if (!values.every(Number.isFinite)) {
        return false;
    }

    if (rr.direction === "LONG") {
        return rr.stopLoss < rr.entry && rr.entry < rr.takeProfit;
    }

    if (rr.direction === "SHORT") {
        return rr.takeProfit < rr.entry && rr.entry < rr.stopLoss;
    }

    return false;
}

export async function captureTrade() {

    const trade = createTrade();

    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    if (!tab?.id || !tab.url?.includes("tradingview.com")) {

        throw new Error(
            "Open a TradingView chart before capturing a trade."
        );
    }

    trade.url = tab.url;

    // ============================================================
    // GET TRADINGVIEW PAGE INFO
    // ============================================================

    const pageInfo = await getPageInfo();

    if (!pageInfo) {

        throw new Error(
            "VantageForge could not read this TradingView chart. Refresh the page and try again."
        );
    }

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

    if (!hasValidRiskReward(rr)) {

        throw new Error(
            "The Risk/Reward levels are invalid. Check that entry sits between stop loss and take profit."
        );
    }

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
    trade.chartAnchorTime = rr.chartAnchorTime;
    trade.chartAnchorInterval = rr.chartAnchorInterval;


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
