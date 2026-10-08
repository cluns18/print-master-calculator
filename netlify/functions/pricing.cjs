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
// Both sheets price decoration. Blanks come on top at Kevin's markup (GARMENT_MARKUP
// below), sent the evening of the 2026-09-29 call with his good/better/best picks.

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
// columns are 1 to 6 ink colours. Two tables since Kevin's "UPDATED PRICING
// MATRIX.xlsx" (2026-09-29 22:09Z, msg 1a0ef37143f05330, saved at
// print-master-site/client-inputs-2026-09-29/): the top table is LIGHT garments and
// the bottom one DARK, which is byte-identical to the "SP Prices.xlsx" rows this file
// carried before. Kevin: "Using the dark pricing list we do eat the cost of a base
// and do not charge for a base screen." So the columns are colours, not screens, and
// a dark garment never adds an underbase screen or a $25 fee for one.
const SCREEN_PRINT_MATRIX_LIGHT = [
    [3.82, 5.32, 5.98, 6.52, 6.75, 7.00],
    [2.32, 3.82, 4.47, 5.03, 5.25, 5.50],
    [1.51, 2.34, 3.30, 3.58, 3.71, 3.96],
    [1.19, 1.78, 2.44, 2.57, 2.70, 2.94],
    [0.98, 1.58, 1.98, 2.11, 2.24, 2.48],
    [0.78, 1.32, 1.50, 1.74, 1.86, 2.10],
];
const SCREEN_PRINT_MATRIX_DARK = [
    [5.33, 5.98, 6.53, 6.79, 7.13, 7.50],
    [3.83, 4.48, 5.03, 5.25, 5.75, 6.00],
    [2.34, 3.30, 3.58, 3.71, 4.09, 4.46],
    [1.78, 2.44, 2.57, 2.70, 3.06, 3.42],
    [1.58, 1.98, 2.11, 2.24, 2.60, 2.96],
    [1.32, 1.60, 1.84, 1.99, 2.25, 2.46],
];
const SCREEN_PRINT_MAX_COLORS = 6;

// "+ $25 PER SCREEN". A one-time order charge, one per screen across every location.
const SCREEN_FEE = 25;

const SCREEN_PRINT_MIN_QTY = 12;   // Kevin, 2026-09-10 and the 2025-10-29 onboarding form
const SCREEN_PRINT_MAX_QTY = 500;  // top row of the 2026-09-29 sheet
const EMBROIDERY_MIN_QTY = 1;      // Kevin, 2026-09-10: "Embroidery = 1 piece minimum"

// "MARKUP ON BLANK APPAREL WHOLESALE PRICE X 2", the last line of Kevin's 2026-09-29
// updated matrix. Applies to every blank, screen print and embroidery alike. The blank
// cost is the S&S wholesale base_cost from the calculator_catalog view. It is folded
// into the per-piece price and never shown on its own (feedback_never_show_garment_cost).
const GARMENT_MARKUP = 2;

// Kevin's two SanMar picks are hand-entered at his own cost (src/utils/manualGarments.js),
// so the S&S size table cannot know them. SanMar's case price steps up $1 at 2XL, $3 at
// 3XL and $4 at 4XL on both styles (SanMar_SDL_N.csv, 2026-08-24), and Kevin's XS to XL
// cost matches that file's case price to the cent, so the same steps ride on his cost.
// The Nike NKDC1963 polo, Kevin's third polo pick, sits in the catalog without an S&S
// styleID, so the size table misses it too. SanMar sells the same polo with the same
// $1 / $3 / $4 steps, so it takes them rather than quoting a 3XL at the price of a medium.
const MANUAL_SIZE_STEPS = {
    "sport-tek-f281": { "2XL": 1, "3XL": 3, "4XL": 4 },
    "port-authority-k500": { "2XL": 1, "3XL": 3, "4XL": 4 },
    "nike-nkdc1963": { "2XL": 1, "3XL": 3, "4XL": 4 },
};

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
    SCREEN_PRINT_MATRIX_LIGHT,
    SCREEN_PRINT_MATRIX_DARK,
    SCREEN_PRINT_MAX_COLORS,
    SCREEN_FEE,
    SCREEN_PRINT_MIN_QTY,
    SCREEN_PRINT_MAX_QTY,
    EMBROIDERY_MIN_QTY,
    GARMENT_MARKUP,
    MANUAL_SIZE_STEPS,
    tierIndexForQuantity,
    spTierIndexForQuantity,
};
