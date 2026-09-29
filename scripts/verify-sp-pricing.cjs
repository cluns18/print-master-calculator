// Asserts the pricing function against Kevin Nee's own sheets. Run: node scripts/verify-sp-pricing.cjs
// Screen print rows are from "SP Prices.xlsx" (2026-09-29), embroidery from the 2026-09-10 sheet.
const { buildQuote } = require("../netlify/functions/calculatePricing.cjs");

const near = (a, b) => Math.abs(a - b) < 0.005;
let failed = 0;
const check = (name, cond, detail) => {
    console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
    if (!cond) failed += 1;
};
const sp = (quantity, locs, garmentUnderbase = 0) => buildQuote({
    selectedProject: "screenPrinting",
    quantity,
    spLocations: locs.map(([key, label]) => ({ key, label })),
    locationColorCounts: Object.fromEntries(locs.map(([key, , colors]) => [key, colors])),
    garmentUnderbase,
});

// (a) 24 pcs, Front 2 colours, light garment: 24 x 4.48 + 2 screens x $25 = 157.52
let q = sp(24, [["front", "Front", 2]], 0);
check("a. 24pc front 2col light total 157.52", q.quotable && near(q.totalQuote, 157.52), `got ${q.totalQuote}`);
check("a. 24pc front 2col light per piece 6.56", q.quotable && near(q.pricePerItem, 6.56), `got ${q.pricePerItem}`);
check("a. tier label", q.tier === "24-47 pieces", q.tier);

// (b) 24 pcs, Front 1 colour, DARK: underbase adds a screen, so the 2-screen column, 24 x 4.48 + 2 x 25
q = sp(24, [["front", "Front", 1]], 1);
check("b. 24pc front 1col dark = 2 screens, total 157.52", q.quotable && near(q.totalQuote, 24 * 4.48 + 50), `got ${q.totalQuote}`);
check("b. line reports 2 screens with underbase", q.quotable && q.lines[0].screens === 2 && q.lines[0].underbase === 1, JSON.stringify(q.lines && q.lines[0]));

// (c) 100 pcs Front 3 + Back 1, light: 100 x (2.57 + 1.78) + 4 x 25 = 535.00
q = sp(100, [["front", "Front", 3], ["back", "Back", 1]], 0);
check("c. 100pc front 3 + back 1 light total 535.00", q.quotable && near(q.totalQuote, 100 * (2.57 + 1.78) + 100), `got ${q.totalQuote}`);
check("c. screen fees 100", q.quotable && near(q.screenFees, 100) && q.screens === 4, `fees ${q.screenFees} screens ${q.screens}`);

// (d) 11 pcs: below Kevin's 12 piece minimum
q = sp(11, [["front", "Front", 1]], 0);
check("d. 11pc -> SP_BELOW_MIN", !q.quotable && q.errorCode === "SP_BELOW_MIN", q.errorCode);

// (e) 501 pcs: over the top row of the sheet
q = sp(501, [["front", "Front", 1]], 0);
check("e. 501pc -> SP_OVER_MAX", !q.quotable && q.errorCode === "SP_OVER_MAX", q.errorCode);

// (f) 6 colours on a dark garment = 7 screens, past the sheet
q = sp(48, [["front", "Front", 6]], 1);
check("f. 6col dark -> SP_OVER_SCREENS", !q.quotable && q.errorCode === "SP_OVER_SCREENS" && q.screensRequired === 7, `${q.errorCode} ${q.screensRequired}`);

// (f2) 6 colours on a light garment is still on the sheet
q = sp(48, [["front", "Front", 6]], 0);
check("f2. 6col light quotable at 4.46", q.quotable && near(q.decorationPerPiece, 4.46), `got ${q.decorationPerPiece}`);

// (f3) boundary rows: 500 and 12 both quote, 289 lands in the last tier
q = sp(500, [["front", "Front", 1]], 0);
check("f3. 500pc quotes at 1.32", q.quotable && near(q.decorationPerPiece, 1.32), `got ${q.decorationPerPiece}`);
q = sp(12, [["front", "Front", 1]], 0);
check("f3. 12pc quotes at 5.33", q.quotable && near(q.decorationPerPiece, 5.33), `got ${q.decorationPerPiece}`);

// (f4) no placements picked: never a number
q = sp(24, [], 0);
check("f4. no placement -> INCOMPLETE", !q.quotable && q.errorCode === "INCOMPLETE", q.errorCode);

// (g) embroidery untouched: 24 left chest + small digitizing = 24 x 10 + 65 = 305
q = buildQuote({ selectedProject: "embroidery", quantity: 24, selectedLocation: ["left_chest"], digitizing: "small" });
check("g. embroidery 24 left chest small digitizing = 305", q.quotable && near(q.totalQuote, 305), `got ${q.totalQuote}`);

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
