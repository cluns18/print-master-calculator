// Asserts the pricing function against Kevin Nee's own sheets. Run: node scripts/verify-sp-pricing.cjs
// Screen print rows are from "UPDATED PRICING MATRIX.xlsx" (2026-09-29 evening, light + dark
// tables, no underbase screen), embroidery from the 2026-09-10 sheet, blanks at wholesale x 2.
const { buildQuote } = require("../netlify/functions/calculatePricing.cjs");

const near = (a, b) => Math.abs(a - b) < 0.005;
let failed = 0;
const check = (name, cond, detail) => {
    console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
    if (!cond) failed += 1;
};
const sp = (quantity, locs, garmentUnderbase = 0, selectedGarmentCost = 0) => buildQuote({
    selectedProject: "screenPrinting",
    quantity,
    spLocations: locs.map(([key, label]) => ({ key, label })),
    locationColorCounts: Object.fromEntries(locs.map(([key, , colors]) => [key, colors])),
    garmentUnderbase,
    selectedGarmentCost,
});

// (a) 24 pcs, Front 2 colours, LIGHT garment: 24 x 3.82 + 2 screens x $25 = 141.68
let q = sp(24, [["front", "Front", 2]], 0);
check("a. 24pc front 2col light total 141.68", q.quotable && near(q.totalQuote, 141.68), `got ${q.totalQuote}`);
check("a. 24pc front 2col light per piece 5.90", q.quotable && near(q.pricePerItem, 5.9), `got ${q.pricePerItem}`);
check("a. tier label", q.tier === "24-47 pieces", q.tier);

// (a2) same job on a DARK garment reads the dark table: 24 x 4.48 + 2 x 25 = 157.52
q = sp(24, [["front", "Front", 2]], 1);
check("a2. 24pc front 2col dark total 157.52", q.quotable && near(q.totalQuote, 157.52) && q.dark === true, `got ${q.totalQuote}`);

// (b) DARK 1 colour: no underbase screen. 1 screen, dark 1-colour column, 24 x 3.83 + 25 = 116.92
q = sp(24, [["front", "Front", 1]], 1);
check("b. 24pc front 1col dark = 1 screen, total 116.92", q.quotable && near(q.totalQuote, 24 * 3.83 + 25), `got ${q.totalQuote}`);
check("b. line reports 1 screen, no underbase", q.quotable && q.lines[0].screens === 1 && q.lines[0].underbase === undefined, JSON.stringify(q.lines && q.lines[0]));

// (c) 100 pcs Front 3 + Back 1, light: 100 x (2.44 + 1.19) + 4 x 25 = 463.00
q = sp(100, [["front", "Front", 3], ["back", "Back", 1]], 0);
check("c. 100pc front 3 + back 1 light total 463.00", q.quotable && near(q.totalQuote, 100 * (2.44 + 1.19) + 100), `got ${q.totalQuote}`);
check("c. screen fees 100", q.quotable && near(q.screenFees, 100) && q.screens === 4, `fees ${q.screenFees} screens ${q.screens}`);

// (c2) blank on top at wholesale x 2: Gildan 5000 at $2.45, 24pc 2col light = 141.68 + 24 x 4.90 = 259.28
q = sp(24, [["front", "Front", 2]], 0, 2.45);
check("c2. 24pc 2col light + G5000 blank = 259.28", q.quotable && near(q.totalQuote, 259.28) && q.garmentIncluded && !q.decorationOnly, `got ${q.totalQuote}`);
q = sp(24, [["front", "Front", 2]], 0, 0);
check("c3. no blank cost -> decorationOnly", q.quotable && q.decorationOnly && !q.garmentIncluded, `${q.decorationOnly}`);

// (d) 11 pcs: below Kevin's 12 piece minimum
q = sp(11, [["front", "Front", 1]], 0);
check("d. 11pc -> SP_BELOW_MIN", !q.quotable && q.errorCode === "SP_BELOW_MIN", q.errorCode);

// (e) 501 pcs: over the top row of the sheet
q = sp(501, [["front", "Front", 1]], 0);
check("e. 501pc -> SP_OVER_MAX", !q.quotable && q.errorCode === "SP_OVER_MAX", q.errorCode);

// (f) 6 colours on a dark garment is on the sheet now (no underbase screen): dark 48-72 6col = 4.46
q = sp(48, [["front", "Front", 6]], 1);
check("f. 6col dark quotable at 4.46", q.quotable && near(q.decorationPerPiece, 4.46), `got ${q.decorationPerPiece}`);
q = sp(48, [["front", "Front", 7]], 1);
check("f1. 7col -> SP_OVER_SCREENS", !q.quotable && q.errorCode === "SP_OVER_SCREENS" && q.screensRequired === 7, `${q.errorCode} ${q.screensRequired}`);

// (f2) 6 colours on a light garment: light 48-72 6col = 3.96
q = sp(48, [["front", "Front", 6]], 0);
check("f2. 6col light quotable at 3.96", q.quotable && near(q.decorationPerPiece, 3.96), `got ${q.decorationPerPiece}`);

// (f3) boundary rows: 500 and 12 both quote
q = sp(500, [["front", "Front", 1]], 0);
check("f3. 500pc light quotes at 0.78", q.quotable && near(q.decorationPerPiece, 0.78), `got ${q.decorationPerPiece}`);
q = sp(12, [["front", "Front", 1]], 0);
check("f3. 12pc light quotes at 3.82", q.quotable && near(q.decorationPerPiece, 3.82), `got ${q.decorationPerPiece}`);
q = sp(289, [["front", "Front", 1]], 1);
check("f3. 289pc dark lands in the last tier at 1.32", q.quotable && near(q.decorationPerPiece, 1.32), `got ${q.decorationPerPiece}`);

// (f4) no placements picked: never a number
q = sp(24, [], 0);
check("f4. no placement -> INCOMPLETE", !q.quotable && q.errorCode === "INCOMPLETE", q.errorCode);

// (g) embroidery: 24 left chest + small digitizing = 24 x 10 + 65 = 305
q = buildQuote({ selectedProject: "embroidery", quantity: 24, selectedLocation: ["left_chest"], digitizing: "small" });
check("g. embroidery 24 left chest small digitizing = 305", q.quotable && near(q.totalQuote, 305), `got ${q.totalQuote}`);
// (g2) embroidery with a Richardson 112 at $6.95: 305 + 24 x 13.90 = 638.60
q = buildQuote({ selectedProject: "embroidery", quantity: 24, selectedLocation: ["left_chest"], digitizing: "small", selectedGarmentCost: 6.95 });
check("g2. embroidery + R112 blank = 638.60", q.quotable && near(q.totalQuote, 638.6) && q.garmentIncluded, `got ${q.totalQuote}`);

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
