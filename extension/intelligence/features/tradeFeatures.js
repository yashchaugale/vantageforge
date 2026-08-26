export function calculateTradeFeatures(trade) {

    if (!trade) {
        return null;
    }

    const {
        direction,
        entry,
        stopLoss,
        takeProfit,
        exitPrice
    } = trade;

    const features = {};

    if (
        typeof entry !== "number" ||
        typeof stopLoss !== "number" ||
        typeof takeProfit !== "number"
    ) {
        return features;
    }

    // ============================================================
    // PLANNED RISK / REWARD
    // ============================================================

    let risk;
    let reward;

    if (direction === "LONG") {

        risk = entry - stopLoss;
        reward = takeProfit - entry;

    }
    else if (direction === "SHORT") {

        risk = stopLoss - entry;
        reward = entry - takeProfit;

    }

    if (
        Number.isFinite(risk) &&
        Number.isFinite(reward)
    ) {

        features.riskDistance = risk;
        features.rewardDistance = reward;

        if (risk > 0) {

            features.plannedRR =
                reward / risk;

        }

    }


    // ============================================================
    // ACTUAL RESULT
    // ============================================================

    if (
        typeof exitPrice === "number" &&
        typeof risk === "number" &&
        risk > 0
    ) {

        let profitDistance;

        if (direction === "LONG") {

            profitDistance =
                exitPrice - entry;

        }
        else if (direction === "SHORT") {

            profitDistance =
                entry - exitPrice;

        }

        if (Number.isFinite(profitDistance)) {

            features.actualR =
                profitDistance / risk;

        }

    }

    return features;
}