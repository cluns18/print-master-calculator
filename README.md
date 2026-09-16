# PrintMaster Calculator

Embroidery pricing calculator for **PrintMaster** (Kevin Nee), Norwood / Norfolk /
North Attleborough MA. Built and maintained by Olive Branch Growth.

Embedded on the PrintMaster Shopify site. Quotes POST to the central OBG mail
service (`obg-mail-api` on OBG's Vercel), which owns the email templates and the
per-shop brand kit. No secrets live in this repo or in the built bundle.

## Pricing

`netlify/functions/pricing.cjs` holds the shop's own numbers, taken verbatim from
Kevin's sheet (emailed 2026-09-10). Flat rate per decoration placement, bracketed
by quantity, plus a one-time digitizing set-up. It is **not** stitch-count based.

Two things to know before changing anything in there:

- **The rates price decoration only.** Kevin's sheet carries no blank/garment cost,
  so the calculator says so on the quote screen. Do not fold a garment price in
  without a garment matrix from the shop.
- **Screen print is deliberately not quotable.** Kevin sent two attachments named
  "Screen Print Pricing.xlsx" and "Embroidery Pricing.xlsx" whose cell contents are
  identical, and both are the embroidery sheet. No screen-print matrix has ever been
  supplied. The calculator returns `SP_MATRIX_MISSING` and routes the customer to a
  hand-priced quote rather than inventing a number. When the real sheet arrives, fill
  in `SCREEN_PRINT_MATRIX` and set `SCREEN_PRINT_AVAILABLE = true`.

## Local

```bash
npm install
npm run build
netlify dev      # needed for the pricing function; plain `npm run dev` will not price
```

Artwork uploads need `VITE_FIREBASE_*` in `.env.local` (gitignored) and on the
Netlify site. Firebase web config is public by design and is the only thing that
ships client-side.
