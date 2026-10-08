#!/usr/bin/env node
/**
 * Regenerates netlify/functions/sizeCosts.cjs, the blank cost at 2XL and up for every
 * apparel style in the calculator's catalog.
 *
 * Why this exists. The catalog carries one base_cost per style, so a 3XL quoted at the
 * same blank as a medium. Kevin caught it testing before launch (2026-10-07): "the
 * calculator is using the standard blank garment price regardless of size". On a Gildan
 * 5000 that is $2.45 against $4.66 for a 2XL, before his x2.
 *
 * Source is the S&S API, customerPrice, the same number the catalog's base_cost is
 * synced from. The cost kept for a size is the cheapest colourway at that size, which
 * is how base_cost is picked too, so the step from XL to 2XL is like for like. Only
 * sizes that cost more than the regular run (XS to XL) are written.
 *
 * This table lives in netlify/functions/ and only the server reads it. Nothing under
 * src/ may import it.
 *
 * S&S prices move. Re-run and redeploy when they do:
 *
 *   SS_ACCOUNT=... SS_API_KEY=... VITE_SUPABASE_URL=... VITE_SUPABASE_PUBLISHABLE_KEY=... \
 *     node scripts/build-size-costs.cjs
 *
 * Pass --check to compare against the committed table WITHOUT writing it. Exits 1 and
 * prints what moved if any cost drifted, 0 if nothing did.
 */

const fs = require('fs');
const path = require('path');

const { SS_ACCOUNT, SS_API_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY } = process.env;
const CHECK_ONLY = process.argv.includes('--check');
const OUT = path.join(__dirname, '..', 'netlify', 'functions', 'sizeCosts.cjs');

// Hats are one size or S/M and L/XL bands, and the quote step asks a plain quantity for them.
const APPAREL_TYPES = ['tshirt', 'longsleeve', 'hoodie', 'crewneck', 'polo'];
const REGULAR = ['XS', 'S', 'M', 'L', 'XL'];
const BIG = ['2XL', '3XL', '4XL', '5XL', '6XL'];
const BATCH = 25;          // styles per S&S call
const SPACING_MS = 1100;   // S&S allows 60 requests a minute

if (!SS_ACCOUNT || !SS_API_KEY || !VITE_SUPABASE_URL || !VITE_SUPABASE_PUBLISHABLE_KEY) {
    console.error('Set SS_ACCOUNT, SS_API_KEY, VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
    process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (size) => {
    const s = String(size || '').trim().toUpperCase().replace(/\s+/g, '');
    return { XXL: '2XL', XXXL: '3XL', XXXXL: '4XL', XXXXXL: '5XL', XXXXXXL: '6XL' }[s] || s;
};

async function catalogStyleIds() {
    const ids = new Set();
    for (let from = 0; ; from += 1000) {
        const url = `${VITE_SUPABASE_URL}/rest/v1/calculator_catalog?select=ss_style_id`
            + `&garment_type=in.(${APPAREL_TYPES.join(',')})&ss_style_id=not.is.null&order=id&limit=1000&offset=${from}`;
        const res = await fetch(url, { headers: { apikey: VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${VITE_SUPABASE_PUBLISHABLE_KEY}` } });
        if (!res.ok) throw new Error(`catalog ${res.status}`);
        const rows = await res.json();
        rows.forEach((r) => ids.add(Number(r.ss_style_id)));
        if (rows.length < 1000) break;
    }
    return [...ids].sort((a, b) => a - b);
}

const AUTH = 'Basic ' + Buffer.from(`${SS_ACCOUNT}:${SS_API_KEY}`).toString('base64');

// One warehouse keeps the payload a quarter of the size. Price does not vary by
// warehouse, but a style the warehouse does not stock comes back empty, so those are
// asked for again without the filter.
async function ssProducts(styleIds, oneWarehouse) {
    const url = `https://api.ssactivewear.com/v2/products/?styleid=${styleIds.join(',')}`
        + `&fields=StyleID,SizeName,CustomerPrice&mediatype=json${oneWarehouse ? '&Warehouses=IL' : ''}`;
    for (let attempt = 0; attempt < 4; attempt++) {
        const res = await fetch(url, { headers: { Authorization: AUTH, 'User-Agent': 'OBG print-master-size-costs' } });
        if (res.status === 404) return [];
        if (res.ok) return res.json();
        await sleep(3000 * (attempt + 1));
    }
    throw new Error(`S&S failed for styles ${styleIds.join(',')}`);
}

function costsByStyle(rows, into) {
    for (const r of rows) {
        const price = Number(r.customerPrice);
        if (!(price > 0)) continue;
        const size = norm(r.sizeName);
        const style = (into[r.styleID] = into[r.styleID] || {});
        if (!(style[size] <= price)) style[size] = price;
    }
}

function bigSizeCosts(sizes) {
    const regular = Math.min(...REGULAR.map((s) => sizes[s]).filter((v) => v > 0));
    if (!Number.isFinite(regular)) return null;
    const out = {};
    for (const s of BIG) {
        if (sizes[s] > regular + 0.005) out[s] = Math.round(sizes[s] * 100) / 100;
    }
    return Object.keys(out).length ? out : null;
}

(async () => {
    const ids = await catalogStyleIds();
    console.error(`${ids.length} apparel styles in the catalog`);
    const raw = {};
    for (let i = 0; i < ids.length; i += BATCH) {
        costsByStyle(await ssProducts(ids.slice(i, i + BATCH), true), raw);
        await sleep(SPACING_MS);
    }
    const missed = ids.filter((id) => !raw[id]);
    for (let i = 0; i < missed.length; i += BATCH) {
        costsByStyle(await ssProducts(missed.slice(i, i + BATCH), false), raw);
        await sleep(SPACING_MS);
    }

    const styles = {};
    for (const id of ids) {
        const big = raw[id] && bigSizeCosts(raw[id]);
        if (big) styles[id] = big;
    }
    const unpriced = ids.filter((id) => !raw[id]);
    console.error(`${Object.keys(styles).length} styles cost more at 2XL and up, ${unpriced.length} came back with no price`);

    if (CHECK_ONLY) {
        const committed = fs.existsSync(OUT) ? require(OUT).STYLES : {};
        const moved = [];
        for (const id of new Set([...Object.keys(styles), ...Object.keys(committed)])) {
            for (const s of BIG) {
                const was = (committed[id] || {})[s];
                const now = (styles[id] || {})[s];
                if (was !== now) moved.push(`style ${id} ${s}: ${was ?? 'none'} -> ${now ?? 'none'}`);
            }
        }
        if (moved.length) {
            console.log(`SIZE COST DRIFT: ${moved.length} prices moved since the table was generated.`);
            moved.slice(0, 60).forEach((m) => console.log('  ' + m));
            process.exit(1);
        }
        console.log('Size costs match the committed table.');
        return;
    }

    const lines = Object.keys(styles).sort((a, b) => a - b)
        .map((id) => `    ${id}: ${JSON.stringify(styles[id])},`);
    fs.writeFileSync(OUT, [
        '// GENERATED by scripts/build-size-costs.cjs. Do not edit by hand, re-run the script.',
        '// Blank cost at 2XL and up, keyed by S&S styleID. S&S customerPrice, cheapest colourway',
        '// per size, only where the size costs more than the XS to XL run. Server-side only.',
        `const GENERATED_AT = ${JSON.stringify(new Date().toISOString().slice(0, 10))};`,
        'const STYLES = {',
        ...lines,
        '};',
        '',
        'module.exports = { GENERATED_AT, STYLES };',
        '',
    ].join('\n'));
    console.error(`wrote ${OUT}`);
})().catch((e) => { console.error(e); process.exit(1); });
