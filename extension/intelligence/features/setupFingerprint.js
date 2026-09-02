const FINGERPRINT_VERSION = 1;

function addFeature(features, value) {
    if (
        typeof value === "string" &&
        value.length > 0 &&
        !features.includes(value)
    ) {
        features.push(value);
    }
}

function getLatestChoch(structure, chartAnchorTime = null) {
    const events = Array.isArray(structure?.events)
        ? structure.events
        : [];

    const chochEvents = events.filter(event => {
        if (
            event?.event !== "BULLISH_CHOCH" &&
            event?.event !== "BEARISH_CHOCH"
        ) {
            return false;
        }

        if (chartAnchorTime == null) {
            return true;
        }

        const eventTime = Number(event.time);
        const anchorTime = Number(chartAnchorTime);

        if (
            !Number.isFinite(eventTime) ||
            !Number.isFinite(anchorTime)
        ) {
            return false;
        }

        const normalizedAnchor =
            anchorTime > 1e11
                ? anchorTime / 1000
                : anchorTime;

        return eventTime <= normalizedAnchor;
    });

    if (chochEvents.length === 0) {
        return null;
    }

    return chochEvents.reduce(
        (latest, event) => {
            if (!latest) return event;

            return Number(event.time) > Number(latest.time)
                ? event
                : latest;
        },
        null
    );
}

export function calculateSetupFingerprint({
    trade,
    marketContext = null,
    structure = null
} = {}) {
    const features = [];
    const tags = [];

    if (!trade) {
        return {
            version: FINGERPRINT_VERSION,
            features,
            tags,
            marketRegime: null
        };
    }

    // ------------------------------------------------------------
    // 1. TRADE DIRECTION
    // ------------------------------------------------------------

    if (trade.direction === "LONG") {
        addFeature(features, "LONG");
    } else if (trade.direction === "SHORT") {
        addFeature(features, "SHORT");
    }

    // ------------------------------------------------------------
    // 2. MARKET REGIME
    // ------------------------------------------------------------

    const regime =
        typeof marketContext?.regime === "string"
            ? marketContext.regime
            : marketContext?.regime?.regime || null;

    if (regime) {
        addFeature(features, regime);
    }

    // ------------------------------------------------------------
    // 3. STRUCTURE STATE
    // ------------------------------------------------------------

    const structureState = structure?.state || null;

    if (structureState) {
        addFeature(
            features,
            `${structureState}_STRUCTURE`
        );
    }

    // ------------------------------------------------------------
    // 4. MOST RECENT CHOCH
    // ------------------------------------------------------------

    const lastCHOCH =
    getLatestChoch(
        structure,
        trade.chartAnchorTime
    );

    if (lastCHOCH?.event) {
        addFeature(
            features,
            `POST_${lastCHOCH.event}`
        );
    }

    // ------------------------------------------------------------
    // 5. STRUCTURE ALIGNMENT
    // ------------------------------------------------------------

    if (trade.direction && structureState) {
        const aligned =
            (
                trade.direction === "LONG" &&
                structureState === "BULLISH"
            ) ||
            (
                trade.direction === "SHORT" &&
                structureState === "BEARISH"
            );

        if (aligned) {
            tags.push("STRUCTURE_ALIGNED");
        } else {
            tags.push("COUNTER_STRUCTURE");
        }
    }

    return {
        version: FINGERPRINT_VERSION,
        features,
        tags,
        marketRegime: regime
    };
}