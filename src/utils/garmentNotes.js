// Why you would pick one garment over another. Three options per type, each with
// a reason taken from the mill's own spec sheet (weight, blend, yarn, fit) rather
// than sales copy, because a buyer comparing two shirts wants a difference they
// can act on. Same notes as the Olive Branch Apparel Design Studio
// (src/lib/garment-notes.ts there) and the Missouri calculator, so every path
// recommends the same three blanks.

// KEVIN'S OWN PICKS, good / better / best, emailed 2026-09-29 22:09Z (msg
// 1a0ef37143f05330). Every type listed here overrides RECOMMENDED. Sport-Tek F281 and
// Port Authority K500 are SanMar-only, so they are hand-entered in manualGarments.js
// at the cost Kevin sent 2026-10-01. Nike NKDC1963 is also sold through S&S.
export const PRINTMASTER_PICKS = {
    tshirt: ['gildan-5000', 'gildan-64000', 'comfort-colors-1717'],
    longsleeve: ['gildan-5400', 'next-level-3601', 'comfort-colors-6014'],
    hoodie: ['gildan-18500', 'independent-trading-co-ind4000', 'sport-tek-f281'],
    sweatshirt: ['gildan-18500', 'independent-trading-co-ind4000', 'sport-tek-f281'],
    polo: ['devon-jones-dg20', 'port-authority-k500', 'nike-nkdc1963'],
    hat: ['richardson-112', 'flexfit-6277', 'yp-classics-1501kc'],
};

export const RECOMMENDED = {
    tshirt: ['gildan-5000', 'bella-canvas-3001', 'comfort-colors-1717'],
    longsleeve: ['gildan-5400', 'bella-canvas-3501', 'comfort-colors-6014'],
    hoodie: ['independent-trading-co-ss4500', 'gildan-18500', 'independent-trading-co-ind4000'],
    // Embroidery "Sweatshirt" covers hoodies and crews: two hoodies and the classic crew.
    sweatshirt: ['independent-trading-co-ss4500', 'gildan-18500', 'gildan-18000'],
    crewneck: ['gildan-18000', 'bella-canvas-3945', 'comfort-colors-1566'],
    polo: ['harriton-m265', 'core365-88181', 'devon-jones-dg20'],
    hat: ['richardson-112', 'flexfit-6277', 'yp-classics-6006'],
};

/** The three slugs to show for a catalog type, Kevin's list first when he has sent one. */
export function picksFor(key) {
    if (PRINTMASTER_PICKS && Array.isArray(PRINTMASTER_PICKS[key]) && PRINTMASTER_PICKS[key].length) {
        return PRINTMASTER_PICKS[key];
    }
    return RECOMMENDED[key] || [];
}
export const GARMENT_NOTES = {
    'gildan-5000': { badge: 'Most affordable', headline: 'The budget workhorse', bullets: ['5.3 oz of 100% US cotton, the weight most people picture when they say t-shirt', '20 singles yarn gives it a sturdy hand rather than a soft one', 'Lowest cost per shirt we stock, so the money goes into the print'] },
    'bella-canvas-3001': { badge: 'Softest', headline: 'The one that feels like retail', bullets: ['Airlume combed and ring-spun cotton at 32 singles, the softest hand on this page', 'Retail fit with side seams, so it follows the body instead of hanging square', 'Pre-shrunk, which means the size someone orders is the size they keep'] },
    'comfort-colors-1717': { badge: 'Heaviest', headline: 'Heavy, soft, already broken in', bullets: ['6.1 oz ring-spun cotton, the heaviest tee here and it hangs like it', 'Garment dyed for a lived-in feel straight out of the bag, with minimal shrinkage', 'Relaxed fit, the cut people keep wearing after the event is over'] },
    'gildan-5400': { badge: 'Most affordable', headline: 'The long sleeve workhorse', bullets: ['5.3 oz of 100% US cotton, the same fabric as the 5000 with sleeves', 'Rib cuffs hold their shape wash after wash', 'Lowest cost long sleeve we stock'] },
    'bella-canvas-3501': { badge: 'Softest', headline: 'Retail feel with sleeves', bullets: ['4.2 oz Airlume combed and ring-spun cotton, light and soft', 'Retail fit with side seams and ribbed cuffs', 'Pre-shrunk, so the size someone orders is the size they keep'] },
    'comfort-colors-6014': { badge: 'Heaviest', headline: 'Heavy, garment dyed, broken in', bullets: ['6.1 oz ring-spun cotton, the heaviest long sleeve here', 'Garment dyed for a lived-in color straight out of the bag', 'Relaxed fit with ribbed cuffs'] },
    'gildan-18500': { badge: 'Most affordable', headline: 'The classic hoodie, priced to order in bulk', bullets: ['8 oz 50/50 cotton and polyester Heavy Blend fleece', 'Pill-resistant air-jet yarn keeps the face smooth for printing and embroidery', 'Lowest cost hoodie we stock, so the money goes into the decoration'] },
    'independent-trading-co-ind4000': { badge: 'Heavyweight', headline: 'The heavyweight that feels premium', bullets: ['10 oz 80/20 cotton and polyester fleece, noticeably thicker in the hand', 'Standard fit with a three-panel hood and split-stitch double-needle sewing', 'The hoodie people pay retail for, at a bulk price'] },
    'independent-trading-co-ss4500': { badge: 'Softest', headline: 'Retail feel for about the same money', bullets: ['8.5 oz of 80/20 ring-spun fleece with a full cotton face', 'Jersey-lined hood and split-stitched seams, built the way retail builds them', 'Heavier and softer than a standard 50/50 at a near-identical price'] },
    'gildan-18600': { badge: 'Full zip', headline: 'The 18500 with a zipper', bullets: ['Same 8 oz 50/50 Heavy Blend fleece as the pullover', 'Full-length zipper with a matching metal pull', 'Unlined hood, so the left chest stays the clean embroidery spot'] },
    'gildan-18000': { badge: 'Classic crew', headline: 'The classic crew, priced to order in bulk', bullets: ['8 oz 50/50 cotton and polyester Heavy Blend fleece', 'Pill-resistant air-jet yarn keeps the face smooth', 'Lowest cost crew we stock'] },
    'bella-canvas-3945': { badge: 'Softest', headline: 'The one that feels like a favorite', bullets: ['7 oz 52/48 Airlume cotton and polyester sponge fleece', 'Drop shoulder, relaxed retail cut with side seams', 'Softest hand of the three, brushed inside and out'] },
    'comfort-colors-1566': { badge: 'Heaviest', headline: 'Heavy, garment dyed, already broken in', bullets: ['9.5 oz 80/20 ring-spun cotton and polyester, the heaviest crew here', 'Garment dyed for a lived-in color straight out of the bag', 'Relaxed fit with a ribbed collar, cuffs and waistband'] },
    // SanMar styles, specs straight from SanMar's own product copy.
    'sport-tek-f281': { badge: 'Heaviest', headline: 'The warmest hoodie we print', bullets: ['12 oz cross-grain 80/20 ring spun cotton and poly fleece, the heaviest here', '100% ring spun combed cotton face, so the print sits on cotton', 'Rib cuffs, hem and side gussets with spandex hold their shape'] },
    'port-authority-k500': { badge: 'Easy care', headline: 'The uniform classic', bullets: ['5 oz 65/35 poly and cotton pique with a silky soft hand', 'Resists wrinkles and shrinking, wash after wash', 'Flat knit collar and cuffs with side vents'] },
    'harriton-m265': { badge: 'Most affordable', headline: 'The uniform polo', bullets: ['5.6 oz 60/40 cotton and polyester pique that holds up to a work week', 'Three-button placket, rib collar and cuffs, the classic shape', 'Lowest cost polo we stock, so a whole staff fits the budget'] },
    'core365-88181': { badge: 'Performance', headline: 'The one that stays dry', bullets: ['4.1 oz 100% polyester with moisture wicking and UV protection', 'Snag resistant, so it survives the truck seat and the job site', 'Easy care, out of the dryer and onto the rack'] },
    'devon-jones-dg20': { badge: 'Premium feel', headline: 'The front-desk polo', bullets: ['6.3 oz 100% pima cotton with a soft, refined hand', 'Tone-on-tone buttons and a tailored fit that reads as management', 'The polo for the people customers meet first'] },
    'richardson-112': { badge: 'Classic trucker', headline: 'The hat everyone asks for', bullets: ['Structured mid-profile with a pre-curved bill', 'Mesh back with a snapback closure, one size that fits most', 'The best-selling cap in the industry, so the front panel is proven for embroidery'] },
    'flexfit-6277': { badge: 'Fitted', headline: 'The fitted cap', bullets: ['Structured mid-profile, wool blend twill', 'Flexfit stretch band, no strap to fuss with', 'Sizes S/M and L/XL, so it fits like a cap you bought'] },
    'yp-classics-6006': { badge: 'Flat bill', headline: 'Flat bill, streetwear shape', bullets: ['Five-panel high profile with a flat bill, the modern merch hat', '74/26 poly-cotton, structured so the front panel stands up', 'Tall front panel gives embroidery more room than a six-panel'] },
};
