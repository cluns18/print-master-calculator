const P = require("./pricing.cjs");

// Returns a quote, or an explicit non-quotable result. It never guesses a number
// and never silently returns 0. See project_calc_lookup_bug_sweep: Brian wants an
// error code plus "reach out for a quote", not a fabricated or $0 price.
const money = (n) => Math.round(n * 100) / 100;

// The blank, marked up per Kevin's sheet. 0 when the page sent no cost (the hand-built
// fallback garments before a pick, or a customer's own blanks), and then the quote says
// garments are separate rather than pretending the figure is all-in.
const garmentPerPiece = (input) => {
    const cost = Number(input.selectedGarmentCost);
    return cost > 0 ? cost * P.GARMENT_MARKUP : 0;
};

// Screen print, Kevin's 2026-09-29 updated matrix. Light and dark garments each have
// their own table, indexed by ink colours per location. Kevin prices the white base
// into the dark table, so there is no underbase screen and no $25 fee for one. The
// garment colour carries the dark flag (0 = light, 1 = dark) in the field the page
// has always sent as garmentUnderbase.
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
    const dark = Number(input.garmentUnderbase) === 1;
    const row = (dark ? P.SCREEN_PRINT_MATRIX_DARK : P.SCREEN_PRINT_MATRIX_LIGHT)[tierIndex];
    const tier = P.SCREEN_PRINT_TIERS[tierIndex];

    const counts = input.locationColorCounts || {};
    const locations = (input.spLocations || [])
        .filter((l) => l && l.key)
        .map((l) => ({ key: l.key, label: l.label || l.key }));
    if (locations.length === 0) return { quotable: false, errorCode: "INCOMPLETE" };

    const lines = locations.map((loc) => {
        const colors = Math.max(1, parseInt(counts[loc.key], 10) || 1);
        // One screen per colour. Past the sheet's width the rate is undefined, never clamped.
        const rate = colors <= P.SCREEN_PRINT_MAX_COLORS ? row[colors - 1] : null;
        return { key: loc.key, label: loc.label, colors, screens: colors, rate };
    });

    // null is the single gate. Summing first would coerce null to 0 and hand back a
    // cheap quote, the exact failure the underbase fix exists to kill.
    const over = lines.filter((l) => l.rate === null || typeof l.rate !== "number");
    if (over.length > 0) {
        return {
            quotable: false,
            errorCode: "SP_OVER_SCREENS",
            maxScreens: P.SCREEN_PRINT_MAX_COLORS,
            screensRequired: Math.max(...lines.map((l) => l.screens)),
            dark,
            lines,
        };
    }

    const decorationPerPiece = lines.reduce((s, l) => s + l.rate, 0);
    const screens = lines.reduce((s, l) => s + l.screens, 0);
    const screenFees = screens * P.SCREEN_FEE;
    const garment = garmentPerPiece(input);
    const decorationTotal = decorationPerPiece * qty;
    const totalQuote = (decorationPerPiece + garment) * qty + screenFees;
    if (!(totalQuote > 0)) return { quotable: false, errorCode: "CALC_ERROR" };

    return {
        quotable: true,
        service: "screenPrinting",
        quantity: qty,
        tier: tier.label,
        lines,
        dark,
        decorationPerPiece: money(decorationPerPiece),
        screens,
        screenFee: P.SCREEN_FEE,
        screenFees: money(screenFees),
        feesPerPiece: money(screenFees / qty),
        decorationTotal: money(decorationTotal),
        totalQuote: money(totalQuote),
        pricePerItem: money(totalQuote / qty),
        garmentIncluded: garment > 0,
        decorationOnly: !(garment > 0),
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

    const garment = garmentPerPiece(input);
    const decorationTotal = decorationPerPiece * qty;
    const totalQuote = (decorationPerPiece + garment) * qty + setupFee;

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
        // With no blank cost the figure is decoration only and must not read as all-in.
        garmentIncluded: garment > 0,
        decorationOnly: !(garment > 0),
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
