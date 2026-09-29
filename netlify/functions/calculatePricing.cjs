const P = require("./pricing.cjs");

// Returns a quote, or an explicit non-quotable result. It never guesses a number
// and never silently returns 0. See project_calc_lookup_bug_sweep: Brian wants an
// error code plus "reach out for a quote", not a fabricated or $0 price.
const money = (n) => Math.round(n * 100) / 100;

// Screen print, Kevin's 2026-09-29 sheet. Decoration only: garment cost is not in
// here yet (see GARMENT_MARKUP in pricing.cjs).
//
// Screens per location = ink colours + 1 when the garment is dark. The white
// underbase is a real screen and is priced as one, the fleet standard since the
// Blue Cactus fix (reference_calculator_underbase_bug). The garment colour carries
// the flag (0 = light, 1 = dark) in src/garments. Kevin has NOT confirmed this rule
// in writing; it is what Brian described to him on the 2026-09-29 call.
const buildScreenPrintQuote = (input, qty) => {
    if (!P.SCREEN_PRINT_AVAILABLE) {
        return { quotable: false, errorCode: "SP_MATRIX_MISSING", minQuantity: P.SCREEN_PRINT_MIN_QTY };
    }
    if (qty < P.SCREEN_PRINT_MIN_QTY) {
        return { quotable: false, errorCode: "SP_BELOW_MIN", minQuantity: P.SCREEN_PRINT_MIN_QTY };
    }
    if (qty > P.SCREEN_PRINT_MAX_QTY) {
        return { quotable: false, errorCode: "SP_OVER_MAX", maxQuantity: P.SCREEN_PRINT_MAX_QTY };
    }
    const tierIndex = P.spTierIndexForQuantity(qty);
    if (tierIndex === null) return { quotable: false, errorCode: "SP_TIER_MISSING" };
    const row = P.SCREEN_PRINT_MATRIX[tierIndex];
    const tier = P.SCREEN_PRINT_TIERS[tierIndex];

    const needsUnderbase = Number(input.garmentUnderbase) === 1;
    const counts = input.locationColorCounts || {};
    const locations = (input.spLocations || [])
        .filter((l) => l && l.key)
        .map((l) => ({ key: l.key, label: l.label || l.key }));
    if (locations.length === 0) return { quotable: false, errorCode: "INCOMPLETE" };

    const lines = locations.map((loc) => {
        const colors = Math.max(1, parseInt(counts[loc.key], 10) || 1);
        const screens = colors + (needsUnderbase ? 1 : 0);
        // Past the sheet's width the rate is undefined, never clamped.
        const rate = screens <= P.SCREEN_PRINT_MAX_SCREENS ? row[screens - 1] : null;
        return { key: loc.key, label: loc.label, colors, underbase: needsUnderbase ? 1 : 0, screens, rate };
    });

    // null is the single gate. Summing first would coerce null to 0 and hand back a
    // cheap quote, the exact failure the underbase fix exists to kill.
    const over = lines.filter((l) => l.rate === null || typeof l.rate !== "number");
    if (over.length > 0) {
        return {
            quotable: false,
            errorCode: "SP_OVER_SCREENS",
            maxScreens: P.SCREEN_PRINT_MAX_SCREENS,
            screensRequired: Math.max(...lines.map((l) => l.screens)),
            needsUnderbase,
            lines,
        };
    }

    const decorationPerPiece = lines.reduce((s, l) => s + l.rate, 0);
    const screens = lines.reduce((s, l) => s + l.screens, 0);
    const screenFees = screens * P.SCREEN_FEE;
    const decorationTotal = decorationPerPiece * qty;
    const totalQuote = decorationTotal + screenFees;
    if (!(totalQuote > 0)) return { quotable: false, errorCode: "CALC_ERROR" };

    return {
        quotable: true,
        service: "screenPrinting",
        quantity: qty,
        tier: tier.label,
        lines,
        needsUnderbase,
        decorationPerPiece: money(decorationPerPiece),
        screens,
        screenFee: P.SCREEN_FEE,
        screenFees: money(screenFees),
        feesPerPiece: money(screenFees / qty),
        decorationTotal: money(decorationTotal),
        totalQuote: money(totalQuote),
        pricePerItem: money(totalQuote / qty),
        decorationOnly: true,
    };
};

const buildQuote = (input) => {
    const { selectedProject, quantity, selectedLocation, digitizing } = input || {};
    const qty = parseInt(quantity, 10);

    if (!selectedProject) return { quotable: false, errorCode: "INCOMPLETE" };
    if (!Number.isFinite(qty) || qty < 1) return { quotable: false, errorCode: "INCOMPLETE" };

    if (selectedProject === "screenPrinting") return buildScreenPrintQuote(input, qty);

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
