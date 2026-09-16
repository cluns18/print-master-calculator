const P = require("./pricing.cjs");

// Returns a quote, or an explicit non-quotable result. It never guesses a number
// and never silently returns 0. See project_calc_lookup_bug_sweep: Brian wants an
// error code plus "reach out for a quote", not a fabricated or $0 price.
const buildQuote = (input) => {
    const { selectedProject, quantity, selectedLocation, digitizing } = input || {};
    const qty = parseInt(quantity, 10);

    if (!selectedProject) return { quotable: false, errorCode: "INCOMPLETE" };
    if (!Number.isFinite(qty) || qty < 1) return { quotable: false, errorCode: "INCOMPLETE" };

    // --- Screen print: no matrix has ever been supplied by the shop. ---
    if (selectedProject === "screenPrinting") {
        if (!P.SCREEN_PRINT_AVAILABLE) {
            return {
                quotable: false,
                errorCode: "SP_MATRIX_MISSING",
                minQuantity: P.SCREEN_PRINT_MIN_QTY,
            };
        }
    }

    if (selectedProject !== "embroidery") return { quotable: false, errorCode: "INCOMPLETE" };

    const locations = (selectedLocation || []).filter((k) => P.EMBROIDERY_LOCATIONS[k]);
    if (locations.length === 0) return { quotable: false, errorCode: "INCOMPLETE" };

    const tierIndex = P.tierIndexForQuantity(qty);
    const tier = P.EMBROIDERY_TIERS[tierIndex];

    // Per-piece rate for each chosen location at this quantity tier.
    const priced = locations.map((key) => {
        const loc = P.EMBROIDERY_LOCATIONS[key];
        const rate = loc.prices[tierIndex];
        if (typeof rate !== "number") return null;    // never fall through to 0
        return { key, label: loc.label, rate };
    });
    if (priced.some((p) => p === null)) return { quotable: false, errorCode: "EMB_ROW_MISSING" };

    // Kevin's sheet: "Secondary Location On Same item = 1/2 price".
    // The dearest location is the primary; every additional one is half.
    priced.sort((a, b) => b.rate - a.rate);
    const lines = priced.map((p, i) => ({
        ...p,
        multiplier: i === 0 ? 1 : P.SECONDARY_LOCATION_MULTIPLIER,
        perPiece: i === 0 ? p.rate : p.rate * P.SECONDARY_LOCATION_MULTIPLIER,
        primary: i === 0,
    }));

    const decorationPerPiece = lines.reduce((s, l) => s + l.perPiece, 0);
    const setupKey = digitizing && P.DIGITIZING[digitizing] ? digitizing : "small";
    const setupFee = P.DIGITIZING[setupKey].fee;

    const decorationTotal = decorationPerPiece * qty;
    const totalQuote = decorationTotal + setupFee;

    return {
        quotable: true,
        service: "embroidery",
        quantity: qty,
        tier: tier.label,
        lines,
        decorationPerPiece: Math.round(decorationPerPiece * 100) / 100,
        decorationTotal: Math.round(decorationTotal * 100) / 100,
        setupLabel: P.DIGITIZING[setupKey].label,
        setupFee,
        totalQuote: Math.round(totalQuote * 100) / 100,
        pricePerItem: Math.round((totalQuote / qty) * 100) / 100,
        // Kevin's sheet prices DECORATION only. It carries no blank/garment cost,
        // so the calculator must not imply an all-in price.
        decorationOnly: true,
    };
};

exports.handler = async (event) => {
    try {
        const result = buildQuote(JSON.parse(event.body || "{}"));
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result),
        };
    } catch (error) {
        console.error("Error in calculatePricing:", error);
        return { statusCode: 500, body: JSON.stringify({ quotable: false, errorCode: "CALC_ERROR" }) };
    }
};

exports.buildQuote = buildQuote;
