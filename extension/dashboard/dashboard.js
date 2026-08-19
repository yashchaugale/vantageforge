const TRADE_KEY = "trades";

let trades = [];

let selectedTradeIndex = null;

let selectedResult = null;


// ============================================================
// R-MULTIPLE CALCULATIONS
// ============================================================

function calculatePlannedR(trade) {

    if (
        trade.entry == null ||
        trade.stopLoss == null ||
        trade.takeProfit == null
    ) {
        return null;
    }

    const risk =
        Math.abs(trade.entry - trade.stopLoss);

    if (risk === 0) {
        return null;
    }

    const reward =
        Math.abs(trade.takeProfit - trade.entry);

    return reward / risk;
}


function calculateActualR(trade) {

    if (
        trade.entry == null ||
        trade.stopLoss == null ||
        trade.exitPrice == null
    ) {
        return null;
    }

    const risk =
        Math.abs(trade.entry - trade.stopLoss);

    if (risk === 0) {
        return null;
    }

    let profit;

    if (trade.direction === "LONG") {

        profit =
            trade.exitPrice - trade.entry;

    } else {

        profit =
            trade.entry - trade.exitPrice;

    }

    return profit / risk;
}


// ============================================================
// LOAD TRADES
// ============================================================

async function loadTrades() {

    const result =
        await chrome.storage.local.get(
            [TRADE_KEY]
        );

    trades =
        result[TRADE_KEY] || [];

    console.log(
        "📚 DASHBOARD LOADED TRADES:",
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


    const completedTrades =
        trades.filter(
            trade => calculateActualR(trade) !== null
        );


    const totalR =
        completedTrades.reduce(
            (sum, trade) =>
                sum + calculateActualR(trade),
            0
        );


    const winRate =
        trades.length > 0
            ? (wins / trades.length) * 100
            : 0;


    document.getElementById(
        "totalTrades"
    ).textContent =
        trades.length;


    document.getElementById(
        "wins"
    ).textContent =
        wins;


    document.getElementById(
        "losses"
    ).textContent =
        losses;


    document.getElementById(
        "winRate"
    ).textContent =
        winRate.toFixed(1) + "%";


    document.getElementById(
        "totalR"
    ).textContent =
        totalR.toFixed(2) + "R";
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

                <td
                    colspan="11"
                    class="empty"
                >
                    No trades captured yet.
                </td>

            </tr>
        `;

        return;
    }


    /*
        Reverse the array so newest trades
        appear first.

        We keep the ORIGINAL index so that
        clicking a row opens the correct trade.
    */

    for (
        let i = trades.length - 1;
        i >= 0;
        i--
    ) {

        const trade =
            trades[i];


        const row =
    document.createElement("tr");


const plannedR =
    calculatePlannedR(trade);


const actualR =
    calculateActualR(trade);


row.innerHTML = `

            <td>
                ${formatDate(trade.timestamp)}
            </td>

            <td>
                ${trade.symbol || "-"}
            </td>

            <td>
                ${trade.timeframe || "-"}
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
    ${
        plannedR !== null
            ? plannedR.toFixed(2) + "R"
            : "-"
    }
</td>

<td>
    ${
        actualR !== null
            ? actualR.toFixed(2) + "R"
            : "-"
    }
</td>

<td>
    ${trade.result || "Captured"}
</td>

        `;


        row.addEventListener(
            "click",
            () => openTrade(i)
        );


        tbody.appendChild(row);
    }
}


// ============================================================
// OPEN TRADE
// ============================================================

function openTrade(index) {

    const trade =
        trades[index];


    if (!trade) {
        return;
    }


    selectedTradeIndex =
        index;


    selectedResult =
        trade.result || null;


    console.log(
        "🔎 OPENING TRADE:",
        trade
    );


    // --------------------------------------------------------
    // BASIC INFO
    // --------------------------------------------------------

    document.getElementById(
        "modalTitle"
    ).textContent =
        `${trade.symbol || "Trade"} • ${trade.direction || "-"}`;


    document.getElementById(
        "detailSymbol"
    ).textContent =
        trade.symbol || "-";


    document.getElementById(
        "detailDirection"
    ).textContent =
        trade.direction || "-";


    document.getElementById(
        "detailTimeframe"
    ).textContent =
        trade.timeframe || "-";


    document.getElementById(
        "detailEntry"
    ).textContent =
        trade.entry ?? "-";


    document.getElementById(
        "detailSL"
    ).textContent =
        trade.stopLoss ?? "-";


    document.getElementById(
        "detailTP"
    ).textContent =
        trade.takeProfit ?? "-";

    document.getElementById(
    "detailExit"
).textContent =
    trade.exitPrice ?? "-";


    // --------------------------------------------------------
    // NOTES
    // --------------------------------------------------------

    document.getElementById(
        "tradeNotes"
    ).value =
        trade.notes || "";

    document.getElementById(
    "tradeExitPrice"
).value =
    trade.exitPrice ?? "";


    // --------------------------------------------------------
    // EMOTIONS
    // --------------------------------------------------------

    document.getElementById(
        "tradeEmotions"
    ).value =
        Array.isArray(trade.emotions)
            ? trade.emotions.join(", ")
            : trade.emotions || "";


    // --------------------------------------------------------
    // SCREENSHOT
    // --------------------------------------------------------

    const screenshot =
        document.getElementById(
            "tradeScreenshot"
        );


    const screenshotContainer =
        document.getElementById(
            "screenshotContainer"
        );


    if (trade.screenshot) {

        screenshot.src =
            trade.screenshot;

        screenshotContainer.style.display =
            "block";

    }
    else {

        screenshot.src =
            "";

        screenshotContainer.style.display =
            "none";

    }


    // --------------------------------------------------------
    // RESULT BUTTONS
    // --------------------------------------------------------

    updateResultButtons();


    // --------------------------------------------------------
    // SHOW MODAL
    // --------------------------------------------------------

    document.getElementById(
        "tradeModal"
    ).classList.add("active");
}


// ============================================================
// RESULT BUTTONS
// ============================================================

function updateResultButtons() {

    const buttons =
        document.querySelectorAll(
            ".result-button"
        );


    buttons.forEach(button => {

        if (
            button.dataset.result ===
            selectedResult
        ) {

            button.classList.add(
                "selected"
            );

        }
        else {

            button.classList.remove(
                "selected"
            );

        }

    });
}


document
    .querySelectorAll(".result-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                selectedResult =
                    button.dataset.result;

                updateResultButtons();

            }
        );

    });


// ============================================================
// SAVE TRADE
// ============================================================

async function saveCurrentTrade() {

    if (
        selectedTradeIndex === null
    ) {
        return;
    }


    const trade =
        trades[selectedTradeIndex];


    if (!trade) {
        return;
    }


    // --------------------------------------------------------
    // NOTES
    // --------------------------------------------------------

    trade.notes =
        document.getElementById(
            "tradeNotes"
        ).value;


    // --------------------------------------------------------
    // EMOTIONS
    // --------------------------------------------------------

    const emotionsText =
        document.getElementById(
            "tradeEmotions"
        ).value;


    trade.emotions =
        emotionsText
            .split(",")
            .map(
                emotion =>
                    emotion.trim()
            )
            .filter(Boolean);


    // --------------------------------------------------------
// EXIT PRICE
// --------------------------------------------------------

const exitPrice =
    document.getElementById(
        "tradeExitPrice"
    ).value;


trade.exitPrice =
    exitPrice === ""
        ? null
        : Number(exitPrice);


// --------------------------------------------------------
// RESULT
// --------------------------------------------------------

trade.result =
    selectedResult;


    // --------------------------------------------------------
    // SAVE
    // --------------------------------------------------------

    await chrome.storage.local.set({

        [TRADE_KEY]:
            trades

    });


    console.log(
        "💾 TRADE UPDATED:",
        trade
    );


    // --------------------------------------------------------
    // REFRESH DASHBOARD
    // --------------------------------------------------------

    renderStats(trades);

    renderTrades(trades);


    // --------------------------------------------------------
    // CLOSE MODAL
    // --------------------------------------------------------

    closeModal();
}


// ============================================================
// SAVE BUTTON
// ============================================================

document
    .getElementById("saveTradeButton")
    .addEventListener(
        "click",
        saveCurrentTrade
    );


// ============================================================
// CLOSE MODAL
// ============================================================

function closeModal() {

    document.getElementById(
        "tradeModal"
    ).classList.remove(
        "active"
    );


    selectedTradeIndex =
        null;

    selectedResult =
        null;
}


document
    .getElementById("closeModal")
    .addEventListener(
        "click",
        closeModal
    );


// ============================================================
// CLICK OUTSIDE MODAL
// ============================================================

document
    .getElementById("tradeModal")
    .addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "tradeModal"
            ) {

                closeModal();

            }

        }
    );


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