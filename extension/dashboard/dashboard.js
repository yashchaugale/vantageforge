const TRADE_HISTORY_KEY =
    "vantageforge_trade_history";


async function loadTrades() {

    const result =
        await chrome.storage.local.get(
            [TRADE_HISTORY_KEY]
        );

    const trades =
        result[TRADE_HISTORY_KEY] || [];

    console.log(
        "📚 LOADED TRADES",
        trades
    );

    renderStats(trades);
    renderTrades(trades);
}


// ============================================================
// STATS
// ============================================================

function renderStats(trades) {

    const wins =
        trades.filter(
            trade => trade.result === "WIN"
        ).length;

    const losses =
        trades.filter(
            trade => trade.result === "LOSS"
        ).length;

    document.getElementById(
        "totalTrades"
    ).textContent = trades.length;

    document.getElementById(
        "wins"
    ).textContent = wins;

    document.getElementById(
        "losses"
    ).textContent = losses;
}


// ============================================================
// TRADE TABLE
// ============================================================

function renderTrades(trades) {

    const tbody =
        document.getElementById(
            "tradeTableBody"
        );

    tbody.innerHTML = "";

    if (trades.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty">
                    No completed trades yet.
                </td>
            </tr>
        `;

        return;
    }

    for (
        const trade of [...trades].reverse()
    ) {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>
                ${formatDate(trade.closedAt)}
            </td>

            <td>
                ${trade.symbol || "-"}
            </td>

            <td>
                ${trade.direction || "-"}
            </td>

            <td>
                ${trade.entry ?? "-"}
            </td>

            <td>
                ${trade.stopLoss ?? "-"}
            </td>

            <td>
                ${trade.takeProfit ?? "-"}
            </td>

            <td>
                ${trade.exitPrice ?? "-"}
            </td>

            <td>
                ${trade.result || "-"}
            </td>
        `;

        tbody.appendChild(row);
    }
}


// ============================================================
// DATE
// ============================================================

function formatDate(date) {

    if (!date) {
        return "-";
    }

    return new Date(date)
        .toLocaleString();
}


// ============================================================
// START
// ============================================================

loadTrades();