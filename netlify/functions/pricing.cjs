// PrintMaster pricing.
//
// SOURCE OF TRUTH: Kevin Nee's own sheet, emailed 2026-09-10 (thread 19d575a82fce7dca).
// Do not "improve" these numbers. They are the shop's, verbatim, including the
// Names/Personalization row going UP from 7.00 (12-24) to 7.50 (25+). That is what
// the sheet says.
//
// Kevin's model is NOT stitch-count based. His words, 2026-09-10: "Our embroidery
// pricing is a little different from the typical stitch-count structure. We use more
// of a flat-rate pricing model." It is a flat per-piece rate by DECORATION LOCATION,
// bracketed by quantity.
//
// SCREEN PRINT IS DELIBERATELY ABSENT. Kevin attached two files named "Screen Print
// Pricing.xlsx" and "Embroidery Pricing.xlsx"; their cell contents are byte-identical
// and both are the embroidery sheet. No screen-print matrix has ever been supplied
// (checked: local disk, Drive folder 1akQDG..., Monday board 8535819952, legacy
// Typeform wgoPw7E1, Gmail). Screen print therefore returns quotable:false with
// SP_MATRIX_MISSING rather than a guessed number. Fill SCREEN_PRINT_MATRIX in and
// flip SCREEN_PRINT_AVAILABLE to true when the real sheet arrives; nothing else
// needs to change.

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

const SCREEN_PRINT_AVAILABLE = false;
const SCREEN_PRINT_MATRIX = null;
const SCREEN_PRINT_MIN_QTY = 12;   // Kevin, 2026-09-10 and the 2025-10-29 onboarding form
const EMBROIDERY_MIN_QTY = 1;      // Kevin, 2026-09-10: "Embroidery = 1 piece minimum"

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
    SCREEN_PRINT_MATRIX,
    SCREEN_PRINT_MIN_QTY,
    EMBROIDERY_MIN_QTY,
    tierIndexForQuantity,
};
