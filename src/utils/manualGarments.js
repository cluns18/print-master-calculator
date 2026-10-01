// SanMar styles Kevin sells that the S&S-backed calculator_catalog cannot carry
// (reference_sanmar_not_in_ss_catalog). Rows are shaped exactly like a
// calculator_catalog row so mapRow, the colour step and pricing treat them the same.
//
// base_cost is KEVIN'S OWN SanMar cost, emailed 2026-10-01 (msg 1a0f8a7fe68e8783):
// Sport-Tek F281 $25.69, Port Authority K500 $10.04. SanMar cost is per account, so
// these never refresh on their own. When SanMar moves a price, Kevin has to send the
// new number. Colours, titles, fabric specs and photos are SanMar's catalog file
// (SanMar_SDL_N.csv, 2026-08-24); hex is the average of each SanMar swatch gif.
// price_tier is where the cost falls in the catalog's own bands for the type.
export const MANUAL_GARMENTS = [
    {
        "id": "manual-sport-tek-f281",
        "slug": "sport-tek-f281",
        "brand": "Sport-Tek",
        "style_name": "F281",
        "style_number": "F281",
        "garment_type": "hoodie",
        "base_cost": 25.69,
        "image_url": "https://cdnm.sanmar.com/imglib/mresjpg/2020/f7/F281_athleticheather_form_front.jpg",
        "popularity_qty": 0,
        "title": "Super Heavyweight Pullover Hooded Sweatshirt",
        "blurb": "12 oz \u00b7 80/20 ring spun cotton/poly fleece",
        "price_tier": 3,
        "colors": [
            {
                "name": "Athletic Heather",
                "hex": "#9d9d9d",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2020/f7/F281_athleticheather_form_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/sporttek_athleticheather.gif"
            },
            {
                "name": "Black",
                "hex": "#2a2a2a",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2020/f12/F281_black_form_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/sporttek_black.gif"
            },
            {
                "name": "Brown",
                "hex": "#4e362c",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2020/f12/F281_brown_form_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/sporttek_brown.gif"
            },
            {
                "name": "Red",
                "hex": "#aa1428",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2020/f12/F281_red_form_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/SportTek_truered.gif"
            },
            {
                "name": "Royal",
                "hex": "#253a92",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2020/f12/F281_royal_form_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/SportTek_trueroyal.gif"
            },
            {
                "name": "Dark Green",
                "hex": "#1e4d47",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2020/f12/F281_darkgreen_form_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/sporttek_darkgreen.gif"
            },
            {
                "name": "Maroon",
                "hex": "#4f282a",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2020/f12/F281_maroon_form_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/SportTek_maroon.gif"
            },
            {
                "name": "Orange",
                "hex": "#fc6913",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2020/f12/F281_orange_form_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/SportTek_orange.gif"
            },
            {
                "name": "True Navy",
                "hex": "#15223a",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2020/f12/F281_truenavy_form_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/SportTek_truenavy.gif"
            },
            {
                "name": "Graphite Heather",
                "hex": "#4e5258",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2020/f12/F281_graphiteheather_form_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/sporttek_graphiteheather_F281.gif"
            }
        ]
    },
    {
        "id": "manual-port-authority-k500",
        "slug": "port-authority-k500",
        "brand": "Port Authority",
        "style_name": "K500",
        "style_number": "K500",
        "garment_type": "polo",
        "base_cost": 10.04,
        "image_url": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_black_flat_front.jpg",
        "popularity_qty": 0,
        "title": "Silk Touch Polo",
        "blurb": "5 oz \u00b7 65/35 poly/cotton pique",
        "price_tier": 1,
        "colors": [
            {
                "name": "Black",
                "hex": "#282828",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_black_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_black.gif"
            },
            {
                "name": "Burgundy",
                "hex": "#712234",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_burgundy_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_burgundy.gif"
            },
            {
                "name": "Dark Green",
                "hex": "#14352e",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_darkgreen_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_darkgreen.gif"
            },
            {
                "name": "Navy",
                "hex": "#0e2f4a",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_navy_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_navy.gif"
            },
            {
                "name": "Cool Grey",
                "hex": "#999999",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_coolgrey_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_gray.gif"
            },
            {
                "name": "Red",
                "hex": "#832a37",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_red_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_red.gif"
            },
            {
                "name": "Royal",
                "hex": "#2f4c93",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_royal_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_royal.gif"
            },
            {
                "name": "Stone",
                "hex": "#e6dfd0",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_stone_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_stone.gif"
            },
            {
                "name": "White",
                "hex": "#fdfdfc",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_white_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_white.gif"
            },
            {
                "name": "Banana",
                "hex": "#ffeba6",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_banana_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_banana.gif"
            },
            {
                "name": "Light Blue",
                "hex": "#a7bde4",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_lightblue_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_lightblue.gif"
            },
            {
                "name": "Hibiscus",
                "hex": "#ef6469",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_hibiscus_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_hibiscus.gif"
            },
            {
                "name": "Eggplant",
                "hex": "#494f69",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_eggplant_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_eggplant.gif"
            },
            {
                "name": "Gold",
                "hex": "#b37e40",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_gold_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/PA_K500_Gold_swatch.gif"
            },
            {
                "name": "Mint Green",
                "hex": "#b5ceb0",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f14/K500_mintgreen_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_mintgreen.gif"
            },
            {
                "name": "Coffee Bean",
                "hex": "#513827",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f14/K500_coffeebean_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_coffeebean.gif"
            },
            {
                "name": "Light Stone",
                "hex": "#efebe2",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2014/f20/K500_lightstone_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_lightstone.gif"
            },
            {
                "name": "Mediterranean Blue",
                "hex": "#3b5b99",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_mediterraneanblue_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_mediterraneanblue.gif"
            },
            {
                "name": "Steel Grey",
                "hex": "#6b6f78",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_steelgrey_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_steelgray.gif"
            },
            {
                "name": "Texas Orange",
                "hex": "#c05b27",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_texasorange_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_texasorange.gif"
            },
            {
                "name": "Tropical Pink",
                "hex": "#f45c93",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_tropicalpink_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_tropicalpink.gif"
            },
            {
                "name": "Light Pink",
                "hex": "#edc1c4",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_lightpink_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_lightpink.gif"
            },
            {
                "name": "Clover Green",
                "hex": "#535b3e",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_clover_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_clovergreen.gif"
            },
            {
                "name": "Kelly Green",
                "hex": "#008559",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_kellygreen_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_kelly.gif"
            },
            {
                "name": "Maroon",
                "hex": "#5b2032",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_maroon_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_maroon.gif"
            },
            {
                "name": "Maui Blue",
                "hex": "#30a2b8",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_mauiblue_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_mauiblue.gif"
            },
            {
                "name": "Purple",
                "hex": "#2d2a6b",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_purple_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_purple.gif"
            },
            {
                "name": "Ultramarine Blue",
                "hex": "#4a70b0",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_ultramarineblue_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_ultramarine.gif"
            },
            {
                "name": "Lime",
                "hex": "#a6c241",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_lime_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_lime.gif"
            },
            {
                "name": "Orange",
                "hex": "#df5217",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_orange_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_orange.gif"
            },
            {
                "name": "Deep Berry",
                "hex": "#702c5f",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_deepberry_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_deepberry.gif"
            },
            {
                "name": "Teal Green",
                "hex": "#017d79",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_tealgreen_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_tealgreen.gif"
            },
            {
                "name": "Bright Lavender",
                "hex": "#d9d2e9",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_brightlavender_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_brightlavender.gif"
            },
            {
                "name": "Strong Blue",
                "hex": "#226baf",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2013/f6/K500_strongblue_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/PA_K500_StrongBlue_swatch.gif"
            },
            {
                "name": "Sunflower Yellow",
                "hex": "#ffd844",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2015/f21/K500_sunflower_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_sunflower_K500.gif"
            },
            {
                "name": "Turquoise",
                "hex": "#59c0e1",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2015/f21/K500_turquoise_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/port_turquoise.gif"
            },
            {
                "name": "Charcoal Heather Grey",
                "hex": "#5c5754",
                "image": "https://cdnm.sanmar.com/imglib/mresjpg/2019/f9/K500_charcoalgreyhthr_flat_front.jpg",
                "swatch": "https://cdnm.sanmar.com/swatch/gifs/PA_K500_CharcoalHeatherGrey_swatch.gif"
            }
        ]
    }
];

/** Manual rows for the given catalog types, keyed by slug. */
export function manualBySlug(types) {
    return new Map(MANUAL_GARMENTS.filter((g) => types.includes(g.garment_type)).map((g) => [g.slug, g]));
}
