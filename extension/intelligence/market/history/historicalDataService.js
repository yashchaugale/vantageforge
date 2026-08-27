/**
 * VantageForge
 * Historical market data loader
 *
 * Loads additional historical candles from TradingView's
 * existing main series without changing the chart timeframe.
 */

const DEFAULT_TARGET_BARS = 5000;
const DEFAULT_BATCH_SIZE = 500;
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_WAIT_MS = 500;


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function getSeries() {

    const model = window.VantageForge?.getChartModel?.();

    if (!model?._mainSeries) {
        throw new Error("TradingView main series is not available");
    }

    return model._mainSeries;
}


function getBarCount(series) {

    return series.bars()?._items?.length || 0;
}


export async function loadHistoricalBars(options = {}) {

    const targetBars =
        options.targetBars ?? DEFAULT_TARGET_BARS;

    const batchSize =
        options.batchSize ?? DEFAULT_BATCH_SIZE;

    const timeoutMs =
        options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    const waitMs =
        options.waitMs ?? DEFAULT_WAIT_MS;


    if (!Number.isFinite(targetBars) || targetBars <= 0) {
        throw new Error("targetBars must be a positive number");
    }


    const series = getSeries();

    let currentBars = getBarCount(series);

    console.log(
        "📚 HISTORICAL DATA:",
        `currently ${currentBars} bars, target ${targetBars}`
    );


    if (currentBars >= targetBars) {

        console.log(
            "✅ HISTORICAL DATA:",
            "target already satisfied"
        );

        return getBarCount(series);
    }


    while (currentBars < targetBars) {

        console.log(
            "📥 REQUESTING MORE DATA:",
            batchSize,
            "bars"
        );

        series.requestMoreData(batchSize);


        const startTime = Date.now();

        let newBarCount = currentBars;


        while (Date.now() - startTime < timeoutMs) {

            await sleep(waitMs);

            newBarCount = getBarCount(series);

            if (newBarCount > currentBars) {
                break;
            }
        }


        if (newBarCount <= currentBars) {

            console.warn(
                "⚠️ HISTORICAL DATA:",
                "TradingView did not provide additional bars"
            );

            break;
        }


        currentBars = newBarCount;

        console.log(
            "📈 HISTORICAL DATA:",
            `loaded ${currentBars} bars`
        );
    }


    console.log(
        "✅ HISTORICAL DATA COMPLETE:",
        currentBars,
        "bars"
    );


    return currentBars;
}