// Live S&S catalog for the garment picker, read from the shared OBG garment
// database through the `calculator_catalog` view (in-stock, priced, at least one
// photographed colorway, colorways rolled up as jsonb). Sorted by popularity,
// measured as the units S&S currently stocks across every SKU of the style: they
// stock deep on what sells, so Gildan 5000 and Comfort Colors 1717 float up and
// the long tail sits behind them.
//
// Ported to PrintMaster 2026-09-29 so the garment step looks and feels like the
// Olive Branch Apparel Design Studio's: three reasoned picks, then the whole catalog.
// Same pattern as the Missouri and Local Threads calculators.

import { supabase, catalogEnabled } from '../lib/supabase';
import { picksFor } from './garmentNotes';
import { manualBySlug } from './manualGarments';

export { catalogEnabled };

// The calculator's slide ids map onto the catalog's S&S categories. The embroidery
// "sweatshirt" step lists hoodies AND crewnecks (crews were unreachable before 9/16).
export const TYPE_MAP = {
    sptshirt: ['tshirt'],
    splongsleeve: ['longsleeve'],
    sphoodie: ['hoodie'],
    sppolo: ['polo'],
    embsweatshirt: ['hoodie', 'crewneck'],
    embpolo: ['polo'],
    embhat: ['hat'],
};
const PICKS_KEY = { embsweatshirt: 'sweatshirt' };

export const PAGE_SIZE = 12;

// Screen print pricing needs to know whether a garment takes an underbase, which
// is really "is this shirt dark". Every colorway carries a hex, so derive it. The
// 0.59 cutoff was fitted against the colorways tagged by hand in src/garments/
// and errs toward calling a color dark, which quotes high rather than low.
const UNDERBASE_LUMINANCE_CUTOFF = 0.59;

export function needsUnderbase(hex) {
    if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return 1;
    const channel = (v) => {
        const c = parseInt(v, 16) / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    const r = channel(hex.slice(1, 3));
    const g = channel(hex.slice(3, 5));
    const b = channel(hex.slice(5, 7));
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance >= UNDERBASE_LUMINANCE_CUTOFF ? 0 : 1;
}

// S&S serves a thumbnail by default; `_fl` is the 1000x1250 variant.
function large(url) {
    return url ? url.replace(/_fm\.(jpg|jpeg|png)$/i, '_fl.$1') : url;
}

// Shape a catalog row like the hand-built garment modules, so ColorSelect,
// FinalQuote and the pricing payload (cost + color.underbase) treat both
// sources identically.
function mapRow(row) {
    const colors = (row.colors || []).map((c) => ({
        name: c.name,
        hex: c.hex,
        image: large(c.image) || c.swatch,
        swatch: c.swatch || c.image,
        underbase: needsUnderbase(c.hex),
    }));
    const label = `${row.brand} ${row.style_name}`.trim();
    return {
        id: row.slug || String(row.id),
        slug: row.slug,
        label,
        name: label,
        brand: row.brand,
        styleName: row.style_name,
        title: row.title || null,
        blurb: row.blurb || null,
        priceTier: Number(row.price_tier) || 1,
        cost: Number(row.base_cost),
        // S&S styleID, what the server keys its 2XL and up costs on. Null for Kevin's
        // hand-entered SanMar picks, which the server prices by slug.
        styleId: row.ss_style_id || null,
        stockImage: large(row.image_url) || colors[0]?.image || null,
        colors,
        popularity: Number(row.popularity_qty || 0),
        fromCatalog: true,
    };
}

const SELECT = 'id, ss_style_id, slug, brand, style_name, style_number, base_cost, image_url, popularity_qty, colors, title, blurb, price_tier';

// Supabase hands back the occasional 503 when a project wakes up, so retry once, but
// never let a dead connection hold the slide on "Loading" (supabase-js retries 503s on
// its own for 10+ seconds). Each attempt is cut off, and a second failure throws so the
// slide can say so and fall back straight away.
async function withRetry(run, timeoutMs = 3500) {
    const attempt = async (ms) => {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), ms);
        try {
            return await run(ctrl.signal);
        } catch (e) {
            return { data: null, error: e };
        } finally {
            clearTimeout(timer);
        }
    };
    const first = await attempt(timeoutMs);
    if (!first.error) return first;
    await new Promise((r) => setTimeout(r, 300));
    const second = await attempt(2000);
    if (second.error) throw new Error(second.error.message || 'Catalog unavailable');
    return second;
}

/** The three curated picks for a type, padded from the most popular if a curated slug is missing. */
export async function fetchRecommended(typeId) {
    const types = TYPE_MAP[typeId];
    if (!catalogEnabled || !types) return [];
    const slugs = picksFor(PICKS_KEY[typeId] || types[0]);
    const [curated, popular] = await Promise.all([
        slugs.length
            ? withRetry((signal) => supabase.from('calculator_catalog').select(SELECT).in('garment_type', types).in('slug', slugs).abortSignal(signal))
            : Promise.resolve({ data: [] }),
        withRetry((signal) => supabase.from('calculator_catalog').select(SELECT).in('garment_type', types)
            .order('popularity_qty', { ascending: false }).order('base_cost', { ascending: true }).limit(6).abortSignal(signal)),
    ]);
    // Kevin's SanMar picks are hand-entered rows; they slot in by slug like any other.
    const bySlug = new Map([...manualBySlug(types), ...(curated.data || []).map((r) => [r.slug, r])]);
    const picked = slugs.map((s) => bySlug.get(s)).filter(Boolean);
    for (const r of popular.data || []) {
        if (picked.length >= 3) break;
        if (!picked.find((p) => p.id === r.id)) picked.push(r);
    }
    return picked.slice(0, 3).map(mapRow);
}

/** Page through the whole catalog for one type, most popular first, with search. */
export async function searchCatalog({ typeId, search = '', page = 0, pageSize = PAGE_SIZE }) {
    const types = TYPE_MAP[typeId];
    if (!catalogEnabled || !types) return { garments: [], total: 0 };
    const from = page * pageSize;
    // Every word has to match somewhere (brand, style or S&S title), so "gildan 5000" finds
    // the Gildan 5000 instead of nothing.
    const terms = search.replace(/[%,().*:"']/g, ' ').split(/\s+/).filter(Boolean).slice(0, 5);
    const { data, error, count } = await withRetry((signal) => {
        let query = supabase.from('calculator_catalog').select(SELECT, { count: 'exact' }).in('garment_type', types);
        for (const t of terms) query = query.or(`brand.ilike.%${t}%,style_name.ilike.%${t}%,style_number.ilike.%${t}%,title.ilike.%${t}%`);
        return query.order('popularity_qty', { ascending: false }).order('base_cost', { ascending: true }).range(from, from + pageSize - 1).abortSignal(signal);
    });
    if (error) throw new Error(error.message);
    return { garments: (data || []).map(mapRow), total: count || 0 };
}

/** How many styles sit behind "View all". */
export async function countCatalog(typeId) {
    const types = TYPE_MAP[typeId];
    if (!catalogEnabled || !types) return 0;
    try {
        const { count } = await withRetry((signal) => supabase.from('calculator_catalog').select('id', { count: 'exact', head: true }).in('garment_type', types).abortSignal(signal));
        return count || 0;
    } catch {
        return 0;
    }
}
