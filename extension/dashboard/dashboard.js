import {
    getTrades,
    getStorageUsage,
    updateTrade
} from "../services/storageService.js";

let trades = [];
let selectedTradeId = null;
let selectedResult = null;

const modal = document.getElementById("tradeModal");
const tradeGrid = document.getElementById("tradeGrid");
const emptyState = document.getElementById("emptyState");
const weeklyReviewContent = document.getElementById("weeklyReviewContent");
const onboarding = document.getElementById("onboarding");

const filterControls = {
    symbol: document.getElementById("filterSymbol"),
    timeframe: document.getElementById("filterTimeframe"),
    result: document.getElementById("filterResult"),
    setup: document.getElementById("filterSetup"),
    session: document.getElementById("filterSession")
};


function calculatePlannedR(trade) {

    if (
        trade.entry == null ||
        trade.stopLoss == null ||
        trade.takeProfit == null
    ) {
        return null;
    }

    const risk = Math.abs(trade.entry - trade.stopLoss);

    if (risk === 0) {
        return null;
    }

    return Math.abs(trade.takeProfit - trade.entry) / risk;
}


function calculateActualR(trade) {

    if (
        trade.entry == null ||
        trade.stopLoss == null ||
        trade.exitPrice == null ||
        !trade.direction
    ) {
        return null;
    }

    const risk = Math.abs(trade.entry - trade.stopLoss);

    if (risk === 0) {
        return null;
    }

    const profit = trade.direction === "LONG"
        ? trade.exitPrice - trade.entry
        : trade.entry - trade.exitPrice;

    return profit / risk;
}


function formatNumber(value) {

    return value == null
        ? "—"
        : Number(value).toLocaleString(undefined, {
            maximumFractionDigits: 6
        });
}


function formatR(value) {

    return value == null
        ? "—"
        : `${value.toFixed(2)}R`;
}


function formatDate(value) {

    if (!value) {
        return "Unknown date";
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? "Unknown date"
        : date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
}


function formatDateTime(value) {

    if (value == null) {
        return "Unavailable";
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? "Unavailable"
        : date.toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
}


function formatMegabytes(bytes) {

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


function getResultLabel(result) {

    if (result === "WIN") {
        return "Win";
    }

    if (result === "LOSS") {
        return "Loss";
    }

    if (result === "BE") {
        return "Break even";
    }

    return "Captured";
}


function getResultClass(result) {

    if (result === "WIN") {
        return "badge badge-win";
    }

    if (result === "LOSS") {
        return "badge badge-loss";
    }

    if (result === "BE") {
        return "badge badge-be";
    }

    return "badge badge-captured";
}


function getWeekTrades() {

    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);

    return trades.filter(trade => {
        const timestamp = new Date(trade.timestamp).getTime();

        return Number.isFinite(timestamp) && timestamp >= cutoff;
    });
}


function createReviewBlock(className, label, text) {

    const block = document.createElement("article");
    block.className = className;

    const heading = document.createElement("span");
    heading.className = "review-label";
    heading.textContent = label;

    const content = document.createElement("p");
    content.textContent = text;

    block.append(heading, content);

    return block;
}


function renderWeeklyReview() {

    const weekTrades = getWeekTrades();
    const reviewedTrades = weekTrades.filter(
        trade => trade.result !== null
    );

    weeklyReviewContent.replaceChildren();

    if (weekTrades.length < 3) {
        weeklyReviewContent.append(
            createReviewBlock(
                "review-insight",
                "Evidence status",
                `You captured ${weekTrades.length} trade${weekTrades.length === 1 ? "" : "s"} in the last 7 days. Capture and review at least 3 trades before looking for a pattern.`
            ),
            createReviewBlock(
                "review-focus",
                "This week’s focus",
                "Capture the finished chart and add one short review while the reason for the trade is still fresh."
            )
        );

        return;
    }

    const deviations = reviewedTrades.filter(
        trade =>
            trade.planAdherence === "DEVIATED" ||
            (
                trade.executionTag &&
                trade.executionTag !== "FOLLOWED_PLAN"
            )
    );

    if (deviations.length >= 2) {
        weeklyReviewContent.append(
            createReviewBlock(
                "review-insight",
                "Observed pattern",
                `${deviations.length} of ${reviewedTrades.length} reviewed trades this week were marked as a plan deviation or execution issue. This is based on your own review tags, not inferred from P&L.`
            ),
            createReviewBlock(
                "review-focus",
                "This week’s focus",
                "Before your next trade, name the setup and decide whether you followed the plan when reviewing it. Aim to reduce untagged deviations."
            )
        );

        return;
    }

    const setupCounts = new Map();

    reviewedTrades.forEach(trade => {
        if (!trade.setup) {
            return;
        }

        setupCounts.set(
            trade.setup,
            (setupCounts.get(trade.setup) || 0) + 1
        );
    });

    const mostReviewedSetup = [...setupCounts.entries()]
        .sort(([, firstCount], [, secondCount]) => secondCount - firstCount)[0];

    if (mostReviewedSetup && mostReviewedSetup[1] >= 2) {
        weeklyReviewContent.append(
            createReviewBlock(
                "review-insight",
                "Most reviewed setup",
                `“${mostReviewedSetup[0]}” appears in ${mostReviewedSetup[1]} of ${reviewedTrades.length} reviewed trades this week. That is a sample to study—not proof that the setup is profitable.`
            ),
            createReviewBlock(
                "review-focus",
                "This week’s focus",
                "Keep naming this setup consistently and record whether you followed the plan. Consistent labels create evidence for a useful review."
            )
        );

        return;
    }

    weeklyReviewContent.append(
        createReviewBlock(
            "review-insight",
            "Review consistency",
            `${reviewedTrades.length} of ${weekTrades.length} captured trades have a recorded outcome this week. More structured tags are needed before VantageForge can identify a reliable behaviour pattern.`
        ),
        createReviewBlock(
            "review-focus",
            "This week’s focus",
            "For each completed trade, add an outcome plus one setup or execution tag. Keep the reflection short and consistent."
        )
    );
}


function renderStats() {

    const wins = trades.filter(trade => trade.result === "WIN").length;
    const losses = trades.filter(trade => trade.result === "LOSS").length;
    const reviewed = trades.filter(trade => trade.result !== null).length;
    const decidedTrades = wins + losses;
    const completedTrades = trades.filter(
        trade => calculateActualR(trade) !== null
    );
    const totalR = completedTrades.reduce(
        (sum, trade) => sum + calculateActualR(trade),
        0
    );

    document.getElementById("totalTrades").textContent = trades.length;
    document.getElementById("winRate").textContent = decidedTrades > 0
        ? `${((wins / decidedTrades) * 100).toFixed(1)}%`
        : "0.0%";
    document.getElementById("totalR").textContent = `${totalR.toFixed(2)}R`;
    document.getElementById("reviewedTrades").textContent = reviewed;
}


function renderStorageUsage(usage) {

    document.getElementById("storageUsage").textContent =
        `${formatMegabytes(usage.bytes)} of ${formatMegabytes(usage.limitBytes)} stored locally`;
}


function setFilterOptions(select, values, fallbackLabel) {

    const currentValue = select.value;

    while (select.options.length > 1) {
        select.remove(1);
    }

    [...values]
        .sort((first, second) => first.localeCompare(second))
        .forEach(value => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value || fallbackLabel;
            select.appendChild(option);
        });

    select.value = currentValue;
}


function populateFilters() {

    setFilterOptions(
        filterControls.symbol,
        new Set(trades.map(trade => trade.symbol).filter(Boolean)),
        "Untitled"
    );
    setFilterOptions(
        filterControls.timeframe,
        new Set(trades.map(trade => trade.timeframe).filter(Boolean)),
        "No timeframe"
    );
    setFilterOptions(
        filterControls.setup,
        new Set(trades.map(trade => trade.setup).filter(Boolean)),
        "Not tagged"
    );
}


function getFilteredTrades() {

    return trades.filter(trade => {
        if (
            filterControls.symbol.value &&
            trade.symbol !== filterControls.symbol.value
        ) {
            return false;
        }

        if (
            filterControls.timeframe.value &&
            trade.timeframe !== filterControls.timeframe.value
        ) {
            return false;
        }

        if (filterControls.result.value === "CAPTURED" && trade.result) {
            return false;
        }

        if (
            filterControls.result.value &&
            filterControls.result.value !== "CAPTURED" &&
            trade.result !== filterControls.result.value
        ) {
            return false;
        }

        if (
            filterControls.setup.value &&
            trade.setup !== filterControls.setup.value
        ) {
            return false;
        }

        if (
            filterControls.session.value &&
            trade.session !== filterControls.session.value
        ) {
            return false;
        }

        return true;
    });
}


function createTradeCard(trade) {

    const card = document.createElement("article");
    card.className = "trade-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute(
        "aria-label",
        `Open review for ${trade.symbol || "captured trade"}`
    );

    if (trade.screenshot) {
        const image = document.createElement("img");
        image.className = "card-image";
        image.src = trade.screenshot;
        image.alt = `Captured chart for ${trade.symbol || "trade"}`;
        card.appendChild(image);
    } else {
        const placeholder = document.createElement("div");
        placeholder.className = "image-placeholder";
        placeholder.textContent = "No chart screenshot";
        card.appendChild(placeholder);
    }

    const content = document.createElement("div");
    content.className = "card-content";

    const topline = document.createElement("div");
    topline.className = "card-topline";

    const title = document.createElement("h3");
    title.className = "card-title";
    title.textContent = trade.symbol || "Untitled trade";

    const result = document.createElement("span");
    result.className = getResultClass(trade.result);
    result.textContent = getResultLabel(trade.result);

    topline.append(title, result);

    const meta = document.createElement("p");
    meta.className = "card-meta";
    meta.textContent = [
        trade.timeframe || "No timeframe",
        trade.direction || "No direction",
        trade.setup || null,
        trade.chartAnchorTime
            ? `Chart ${formatDate(trade.chartAnchorTime)}`
            : null,
        formatDate(trade.timestamp)
    ].filter(Boolean).join(" · ");

    const footer = document.createElement("div");
    footer.className = "card-footer";

    const plannedR = document.createElement("span");
    plannedR.textContent = `Plan ${formatR(calculatePlannedR(trade))}`;

    const actualR = document.createElement("span");
    actualR.textContent = `Actual ${formatR(calculateActualR(trade))}`;

    footer.append(plannedR, actualR);
    content.append(topline, meta, footer);
    card.appendChild(content);

    card.addEventListener("click", () => openTrade(trade.id));
    card.addEventListener("keydown", event => {

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openTrade(trade.id);
        }
    });

    return card;
}


function renderTradeGrid() {

    tradeGrid.replaceChildren();
    const filteredTrades = getFilteredTrades();

    emptyState.hidden = filteredTrades.length > 0;

    if (trades.length > 0 && filteredTrades.length === 0) {
        emptyState.querySelector("h3").textContent = "No trades match these filters.";
        emptyState.querySelector("p").textContent = "Clear one or more filters to return to your full trade library.";
    } else {
        emptyState.querySelector("h3").textContent = "Your first review starts on the chart.";
        emptyState.querySelector("p").textContent = "Finish a trade in TradingView, leave its Risk/Reward tool visible, then use Capture Trade from the extension.";
    }

    document.getElementById("libraryCount").textContent =
        filteredTrades.length === trades.length
            ? `${trades.length} ${trades.length === 1 ? "trade" : "trades"}`
            : `${filteredTrades.length} of ${trades.length} trades`;

    [...filteredTrades]
        .reverse()
        .forEach(trade => {
            tradeGrid.appendChild(createTradeCard(trade));
        });
}


async function loadTrades() {

    const [storedTrades, storageUsage] = await Promise.all([
        getTrades(),
        getStorageUsage()
    ]);

    trades = storedTrades;
    populateFilters();
    renderStats();
    renderStorageUsage(storageUsage);
    onboarding.hidden = trades.length >= 3;
    renderWeeklyReview();
    renderTradeGrid();
}


function setResultButtons() {

    document
        .querySelectorAll(".result-button")
        .forEach(button => {
            const selected = button.dataset.result === selectedResult;
            button.classList.toggle("selected", selected);
            button.setAttribute("aria-pressed", String(selected));
        });
}


function openTrade(tradeId) {

    const trade = trades.find(item => item.id === tradeId);

    if (!trade) {
        return;
    }

    selectedTradeId = trade.id;
    selectedResult = trade.result;

    document.getElementById("modalTitle").textContent =
        `${trade.symbol || "Trade"} review`;
    document.getElementById("detailSymbol").textContent = trade.symbol || "—";
    document.getElementById("detailTimeframe").textContent = trade.timeframe || "—";
    document.getElementById("detailDirection").textContent = trade.direction || "—";
    document.getElementById("detailEntry").textContent = formatNumber(trade.entry);
    document.getElementById("detailSL").textContent = formatNumber(trade.stopLoss);
    document.getElementById("detailTP").textContent = formatNumber(trade.takeProfit);
    document.getElementById("detailPlannedR").textContent = formatR(calculatePlannedR(trade));
    document.getElementById("detailActualR").textContent = formatR(calculateActualR(trade));
    document.getElementById("detailChartTime").textContent = formatDateTime(
        trade.chartAnchorTime
    );
    document.getElementById("detailCaptureTime").textContent = formatDateTime(
        trade.timestamp
    );
    document.getElementById("tradeExitPrice").value = trade.exitPrice ?? "";
    document.getElementById("tradeSetup").value = trade.setup;
    document.getElementById("tradeSession").value = trade.session || "";
    document.getElementById("tradePlanAdherence").value = trade.planAdherence || "";
    document.getElementById("tradeExecutionTag").value = trade.executionTag || "";
    document.getElementById("tradeNotes").value = trade.notes;
    document.getElementById("tradeEmotions").value = trade.emotions.join(", ");

    const screenshot = document.getElementById("tradeScreenshot");
    const missingScreenshot = document.getElementById("missingScreenshot");

    screenshot.hidden = !trade.screenshot;
    missingScreenshot.hidden = Boolean(trade.screenshot);

    if (trade.screenshot) {
        screenshot.src = trade.screenshot;
    } else {
        screenshot.removeAttribute("src");
    }

    setResultButtons();
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.getElementById("closeModal").focus();
}


function closeModal() {

    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    selectedTradeId = null;
    selectedResult = null;
}


async function saveCurrentTrade() {

    if (!selectedTradeId) {
        return;
    }

    const exitPriceText = document.getElementById("tradeExitPrice").value.trim();
    const exitPrice = exitPriceText === ""
        ? null
        : Number(exitPriceText);

    if (exitPrice !== null && !Number.isFinite(exitPrice)) {
        alert("Enter a valid exit price or leave the field blank.");
        return;
    }

    const changes = {
        result: selectedResult,
        exitPrice,
        setup: document.getElementById("tradeSetup").value.trim(),
        session: document.getElementById("tradeSession").value || null,
        planAdherence:
            document.getElementById("tradePlanAdherence").value || null,
        executionTag:
            document.getElementById("tradeExecutionTag").value || null,
        notes: document.getElementById("tradeNotes").value.trim(),
        emotions: document
            .getElementById("tradeEmotions")
            .value
            .split(",")
            .map(emotion => emotion.trim())
            .filter(Boolean)
    };

    try {

        const updatedTrade = await updateTrade(
            selectedTradeId,
            changes
        );

        if (!updatedTrade) {
            throw new Error("This trade no longer exists in local storage.");
        }

        trades = trades.map(trade =>
            trade.id === updatedTrade.id
                ? updatedTrade
                : trade
        );

        renderStats();
        populateFilters();
        renderWeeklyReview();
        renderTradeGrid();
        closeModal();

    } catch (error) {

        console.error("❌ TRADE REVIEW SAVE FAILED", error);
        alert(
            error?.message ||
            "VantageForge could not save this review."
        );
    }
}


document
    .querySelectorAll(".result-button")
    .forEach(button => {
        button.addEventListener("click", () => {
            selectedResult = button.dataset.result;
            setResultButtons();
        });
    });

document
    .getElementById("saveTradeButton")
    .addEventListener("click", saveCurrentTrade);

document
    .getElementById("closeModal")
    .addEventListener("click", closeModal);

Object.values(filterControls).forEach(control => {
    control.addEventListener("change", renderTradeGrid);
});

document
    .getElementById("clearFilters")
    .addEventListener("click", () => {
        Object.values(filterControls).forEach(control => {
            control.value = "";
        });

        renderTradeGrid();
    });

document
    .getElementById("exportJournal")
    .addEventListener("click", async () => {
        const exportData = {
            product: "VantageForge Experimental",
            exportedAt: new Date().toISOString(),
            tradeCount: trades.length,
            trades: await getTrades()
        };
        const file = new Blob(
            [JSON.stringify(exportData, null, 2)],
            { type: "application/json" }
        );
        const downloadUrl = URL.createObjectURL(file);
        const link = document.createElement("a");

        link.href = downloadUrl;
        link.download = `vantageforge-journal-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(downloadUrl);
    });

modal.addEventListener("click", event => {

    if (event.target === modal) {
        closeModal();
    }
});

document.addEventListener("keydown", event => {

    if (event.key === "Escape" && modal.classList.contains("active")) {
        closeModal();
    }
});

loadTrades().catch(error => {
    console.error("❌ DASHBOARD LOAD FAILED", error);
});
