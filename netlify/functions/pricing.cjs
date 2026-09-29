// PrintMaster pricing.
//
// SOURCE OF TRUTH: Kevin Nee's own sheets. Do not "improve" these numbers. They are
// the shop's, verbatim.
//
// EMBROIDERY: emailed 2026-09-10 (thread 19d575a82fce7dca). Kevin's model is NOT
// stitch-count based. His words: "Our embroidery pricing is a little different from
// the typical stitch-count structure. We use more of a flat-rate pricing model." It is
// a flat per-piece rate by DECORATION LOCATION, bracketed by quantity. The
// Names/Personalization row goes UP from 7.00 (12-24) to 7.50 (25+). That is what the
// sheet says.
//
// SCREEN PRINT: "SP Prices.xlsx", emailed 2026-09-29 07:04 MT (same thread, msg
// 1a0ed447c6d3f8e4), saved at print-master-site/pricing/SP Prices 2026-09-29.xlsx.
// Kevin's earlier 9/10 "Screen Print Pricing.xlsx" was a duplicate of the embroidery
// sheet, which is why this block was empty until now. The sheet is a per-piece
// decoration rate by quantity tier and ink-colour count, headed "PRICE PER LOCATION
// + $25 PER SCREEN". It runs 12 to 500 pieces and 1 to 6 colours. Outside that the
// calculator withholds the number rather than extrapolating.
//
// BOTH SHEETS ARE DECORATION ONLY. Neither carries a blank garment cost. Kevin said on
// the 2026-09-29 call he will send his garment markup and good/better/best garment
// picks; GARMENT_MARKUP below is the hook for that and stays null until he does.

// Bracketed tiers. min/max inclusive; max null == open ended.
const EMBROIDERY_TIERS = [
    { min: 1,  max: 5,    label: '1-5 pieces'   },
    { min: 6,  max: 11,   label: '6-11 pieces'  },
    { min: 12, max: 24,   label: '12-24 pieces' },
    { min: 25, max: 49,   label: '25-49 pieces' },
    { min: 50, max: null, label: '50+ pieces'   },
];

// Per-piece decoration price, indexed to EMBROIDERY_TIERS above.
const EMBROIDERY_LOCATIONS = {
    left_chest: { label: 'Left Chest / Sleeve / Hat', prices: [16, 13, 10, 8, 6] },
    full_back:  { label: 'Full Back',                 prices: [38, 36, 32, 30, 28] },
    names:      { label: 'Names / Personalization',   prices: [13, 8, 7, 7.5, 7.5] },
};

// "Secondary Location On Same item = 1/2 price" (sheet row 6).
const SECONDARY_LOCATION_MULTIPLIER = 0.5;

// One-time setup, charged per order not per piece.
const DIGITIZING = {
    small: { label: 'Logo up to 4.75"', fee: 65  },
    large: { label: 'Logo 4.75" and up', fee: 160 },
    name:  { label: 'Personalization name set-up', fee: 35 },
    none:  { label: 'Already digitized with us', fee: 0 },
};

// ---------------------------------------------------------------------------
// Screen print. Kevin's "SP Prices.xlsx", 2026-09-29, verbatim.
// ---------------------------------------------------------------------------
const SCREEN_PRINT_AVAILABLE = true;

// min/max inclusive. 500 is the top of the sheet; there is no open-ended row, so
// anything above 500 is quoted by hand, never extrapolated.
const SCREEN_PRINT_TIERS = [
    { min: 12,  max: 23,  label: '12-23 pieces'   },
    { min: 24,  max: 47,  label: '24-47 pieces'   },
    { min: 48,  max: 72,  label: '48-72 pieces'   },
    { min: 73,  max: 144, label: '73-144 pieces'  },
    { min: 145, max: 288, label: '145-288 pieces' },
    { min: 289, max: 500, label: '289-500 pieces' },
];

// Per-piece decoration price PER LOCATION, rows indexed to SCREEN_PRINT_TIERS,
// columns are 1 to 6 screens. Kevin's header says colours; the fleet standard
// (reference_calculator_underbase_bug) indexes by SCREENS so a white underbase on a
// dark garment costs its real screen. Column 0 = 1 screen ... column 5 = 6 screens.
const SCREEN_PRINT_MATRIX = [
    [5.33, 5.98, 6.53, 6.79, 7.13, 7.50],
    [3.83, 4.48, 5.03, 5.25, 5.75, 6.00],
    [2.34, 3.30, 3.58, 3.71, 4.09, 4.46],
    [1.78, 2.44, 2.57, 2.70, 3.06, 3.42],
    [1.58, 1.98, 2.11, 2.24, 2.60, 2.96],
    [1.32, 1.60, 1.84, 1.99, 2.25, 2.46],
];
const SCREEN_PRINT_MAX_SCREENS = 6;

// "+ $25 PER SCREEN". A one-time order charge, one per screen across every location.
const SCREEN_FEE = 25;

const SCREEN_PRINT_MIN_QTY = 12;   // Kevin, 2026-09-10 and the 2025-10-29 onboarding form
const SCREEN_PRINT_MAX_QTY = 500;  // top row of the 2026-09-29 sheet
const EMBROIDERY_MIN_QTY = 1;      // Kevin, 2026-09-10: "Embroidery = 1 piece minimum"

// GARMENT HOOK. Kevin's sheets price decoration only. When he sends his garment
// markup (a multiplier on blank cost, e.g. 1.5) set it here and add the garment line
// in calculatePricing.cjs; until then every quote stays decorationOnly: true and the
// quote screen says garments are quoted separately. Deliberately NOT implemented yet.
const GARMENT_MARKUP = null;

// Screen print tier lookup. Returns null under the minimum or over the ceiling so a
// caller can withhold the quote. Never clamps to the nearest row.
const spTierIndexForQuantity = (quantity) => {
    for (let i = 0; i < SCREEN_PRINT_TIERS.length; i++) {
        const t = SCREEN_PRINT_TIERS[i];
        if (quantity >= t.min && quantity <= t.max) return i;
    }
    return null;
};

// Walk brackets properly (min/max), never Array.find on an ascending list.
// See project_calc_lookup_bug_sweep: find() returns the FIRST match and silently
// quotes every order at the smallest, most expensive tier.
const tierIndexForQuantity = (quantity) => {
    for (let i = 0; i < EMBROIDERY_TIERS.length; i++) {
        const t = EMBROIDERY_TIERS[i];
        if (quantity >= t.min && (t.max === null || quantity <= t.max)) return i;
    }
    return quantity < EMBROIDERY_TIERS[0].min ? 0 : EMBROIDERY_TIERS.length - 1;
};

module.exports = {
    EMBROIDERY_TIERS,
    EMBROIDERY_LOCATIONS,
    SECONDARY_LOCATION_MULTIPLIER,
    DIGITIZING,
    SCREEN_PRINT_AVAILABLE,
    SCREEN_PRINT_TIERS,
    SCREEN_PRINT_MATRIX,
    SCREEN_PRINT_MAX_SCREENS,
    SCREEN_FEE,
    SCREEN_PRINT_MIN_QTY,
    SCREEN_PRINT_MAX_QTY,
    EMBROIDERY_MIN_QTY,
    GARMENT_MARKUP,
    tierIndexForQuantity,
    spTierIndexForQuantity,
};
