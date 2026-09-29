import React, { useEffect, useState } from 'react';
import NavBtn from '../components/NavBtn';
import { fetchRecommended, searchCatalog, countCatalog, catalogEnabled, PAGE_SIZE } from '../utils/catalog';
import { GARMENT_NOTES } from '../utils/garmentNotes';

// One garment step for every type, built to look and feel like the garment step
// in the Olive Branch Apparel Design Studio (src/app/order/garment/page.tsx there):
// three cards, each with a badge that says what sets it apart, a tall product
// photo, brand in small caps, the style name, a headline in the accent colour and
// three check-mark bullets off the mill's spec sheet. Everything else sits one
// tap away behind "Explore all options", sorted by what sells most.
//
// Never a garment price. The $ band ranks the blank inside its category instead
// (feedback_never_show_garment_cost). Without the catalog (no Supabase env, or
// the query fails) it falls back to the hand-built list this step used to show,
// so the calculator never goes dark.

function PriceTier({ tier }) {
    if (!tier) return null;
    const level = Math.min(4, Math.max(1, tier));
    return (
        <div className='price-tier' role='img' aria-label={`Price level ${level} of 4`}>
            {[1, 2, 3, 4].map((i) => (
                <span key={i} aria-hidden='true' className={i <= level ? 'price-tier-on' : 'price-tier-off'}>$</span>
            ))}
        </div>
    );
}

function Swatches({ colors, max = 8 }) {
    if (!colors?.length) return null;
    const shown = colors.slice(0, max);
    const more = colors.length - shown.length;
    return (
        <div className='pick-swatches' role='img' aria-label={`${colors.length} colors available`}>
            {shown.map((c) => (
                <span
                    key={c.name}
                    title={c.name}
                    className='pick-swatch'
                    style={c.hex ? { backgroundColor: c.hex } : { backgroundImage: `url(${c.swatch || c.image})`, backgroundSize: 'cover' }}
                />
            ))}
            {more > 0 && <span className='pick-swatch-more'>+{more}</span>}
        </div>
    );
}

function Check() {
    return (
        <svg viewBox='0 0 16 16' fill='none' aria-hidden='true' className='pick-check'>
            <path d='M3 8.5L6.5 12L13 4' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
    );
}

function PickCard({ garment, active, onClick, index = 0, rank, searching }) {
    const note = garment.slug ? GARMENT_NOTES[garment.slug] : null;
    const badge = note ? note.badge : rank === 1 && !searching ? 'Best seller' : null;
    const brand = garment.brand || '';
    const styleName = garment.styleName || garment.label || garment.name;
    return (
        <button
            type='button'
            className={`pick-card ${active ? 'is-active' : ''}`}
            onClick={onClick}
            aria-pressed={active}
            style={{ animation: `fadeSlideUp 0.5s ease-out ${index * 80}ms both` }}
        >
            {badge && <span className='pick-badge'>{badge}</span>}
            <div className='pick-card-img'>
                {garment.stockImage
                    ? <img src={garment.stockImage} alt={`${brand} ${styleName}`.trim()} loading='lazy' />
                    : <span className='pick-card-noimg'>No photo</span>}
            </div>
            {brand && <div className='pick-card-brand'>{brand}</div>}
            <div className='pick-card-style'>{styleName}</div>
            {note ? (
                <>
                    <div className='pick-card-head'>{note.headline}</div>
                    <ul className='pick-card-bullets'>
                        {note.bullets.map((b) => <li key={b}><Check />{b}</li>)}
                    </ul>
                </>
            ) : (
                <>
                    {garment.title && <div className='pick-card-title'>{garment.title}</div>}
                    {garment.blurb && <div className='pick-card-blurb'>{garment.blurb}</div>}
                </>
            )}
            <div className='pick-card-foot'>
                <Swatches colors={garment.colors} />
                {garment.colors?.length > 0 && <div className='pick-card-count'>{garment.colors.length} {garment.colors.length === 1 ? 'color' : 'colors'}</div>}
                <PriceTier tier={garment.priceTier} />
            </div>
            {active && (
                <span className='pick-card-tick' aria-hidden='true'><Check /></span>
            )}
        </button>
    );
}

const isTouch = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
const isEmbedded = typeof window !== 'undefined' && window.parent !== window;

const SEARCH_HINT = {
    sptshirt: 'Try "Comfort Colors" or "3001"',
    splongsleeve: 'Try "Gildan" or "2400"',
    sphoodie: 'Try "Independent" or "18500"',
    sppolo: 'Try "Harriton" or "88181"',
    embsweatshirt: 'Try "Independent" or "18000"',
    embpolo: 'Try "Harriton" or "88181"',
    embhat: 'Try "Richardson" or "112"',
};

export default function GarmentPickSlide({ typeId, typeName, fallbackGarments, selected, setSelected, onNext, onPrevious }) {
    const [recommended, setRecommended] = useState([]);
    const [recLoading, setRecLoading] = useState(catalogEnabled);
    const [recError, setRecError] = useState(false);
    const [catalogTotal, setCatalogTotal] = useState(0);

    const [browsing, setBrowsing] = useState(false);
    const [results, setResults] = useState([]);
    const [resultTotal, setResultTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load the three picks (or fall back to the hand-built list) and the catalog size.
    useEffect(() => {
        let cancelled = false;
        if (!catalogEnabled) {
            setRecommended([]);
            setRecLoading(false);
            return;
        }
        setRecLoading(true);
        setRecError(false);
        fetchRecommended(typeId)
            .then((rows) => { if (!cancelled) { setRecommended(rows); setRecLoading(false); } })
            .catch(() => { if (!cancelled) { setRecError(true); setRecLoading(false); } });
        countCatalog(typeId).then((n) => { if (!cancelled) setCatalogTotal(n); });
        return () => { cancelled = true; };
    }, [typeId]);

    // Default the selection so Next never lands on an empty pick. Waits for the
    // catalog picks to settle first, otherwise the hand-built fallback gets
    // chosen for a moment and then rides along as a fourth card.
    const shortlist = recommended.length > 0 ? recommended : fallbackGarments;
    useEffect(() => {
        if (recLoading) return;
        if (!selected && shortlist.length > 0) setSelected(shortlist[0]);
    }, [shortlist, selected, setSelected, recLoading]);

    useEffect(() => {
        const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(0); }, 250);
        return () => clearTimeout(t);
    }, [searchInput]);

    useEffect(() => {
        if (!browsing) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        searchCatalog({ typeId, search, page })
            .then(({ garments, total }) => { if (!cancelled) { setResults(garments); setResultTotal(total); setLoading(false); } })
            .catch((e) => { if (!cancelled) { setError(e.message); setResults([]); setResultTotal(0); setLoading(false); } });
        return () => { cancelled = true; };
    }, [browsing, typeId, search, page]);

    const lastPage = Math.max(0, Math.ceil(resultTotal / PAGE_SIZE) - 1);
    const lower = (typeName || 'garment').toLowerCase();
    const scrollParent = () => { if (isEmbedded) window.parent.postMessage({ type: 'bc-embed-scroll' }, '*'); };

    if (browsing) {
        return (
            <>
                <div className='slide-header'>
                    <h1 className='text-3xl font-bold headingColor'>Every {lower} we can get</h1>
                    <p className='mt-1 text-sm pick-sub'>{resultTotal || catalogTotal} options, most popular first. Search by brand or style number.</p>
                </div>
                <div className='slide-content pick-content'>
                    <label htmlFor='catalogSearch' className='sr-only'>Search the {lower} catalog</label>
                    <input
                        id='catalogSearch'
                        type='search'
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder={SEARCH_HINT[typeId] || 'Search by brand or style number'}
                        className='catalog-search'
                        autoFocus={!isTouch && !isEmbedded}
                    />
                    {error && <p className='pick-note'>We could not load the full catalog right now. Pick one of our regulars and we will sort the rest out on the quote.</p>}
                    {!error && loading && <p className='pick-note'>Loading styles...</p>}
                    {!error && !loading && results.length === 0 && <p className='pick-note'>Nothing matched that. Try a brand name or a style number.</p>}
                    {!error && !loading && results.length > 0 && (
                        <div className='pick-grid pick-grid--catalog'>
                            {results.map((g, i) => (
                                <PickCard key={g.id} garment={g} index={i} rank={page * PAGE_SIZE + i + 1} searching={Boolean(search)} active={selected?.id === g.id} onClick={() => { setSelected(g); setBrowsing(false); scrollParent(); }} />
                            ))}
                        </div>
                    )}
                    {!error && resultTotal > PAGE_SIZE && (
                        <div className='catalog-pager'>
                            <button type='button' onClick={() => { setPage((p) => Math.max(0, p - 1)); scrollParent(); }} disabled={page === 0}>&larr; Back</button>
                            <span>{page + 1} of {lastPage + 1}</span>
                            <button type='button' onClick={() => { setPage((p) => Math.min(lastPage, p + 1)); scrollParent(); }} disabled={page >= lastPage}>Next &rarr;</button>
                        </div>
                    )}
                </div>
                <div className='slide-nav'>
                    <NavBtn onClick={() => setBrowsing(false)} direction='prev'>&larr; Our picks</NavBtn>
                    <NavBtn onClick={() => onNext()}>Next &rarr;</NavBtn>
                </div>
            </>
        );
    }

    // A catalog pick is not one of the three, so it rides along at the front of
    // the row instead of leaving nothing on the page looking chosen.
    const pickedElsewhere = selected && !shortlist.find((g) => g.id === selected.id) ? selected : null;

    return (
        <>
            <div className='slide-header'>
                <h1 className='text-3xl font-bold headingColor'>Pick Your {typeName}</h1>
                <p className='mt-1 text-sm pick-sub'>Three we recommend, and the reason for each. Every one comes in the colors shown.</p>
            </div>
            <div className='slide-content pick-content'>
                {recLoading && <p className='pick-note'>Loading our picks...</p>}
                {!recLoading && pickedElsewhere && (
                    <div className='pick-picked'>
                        <p className='pick-picked-label'>Your pick from the full catalog</p>
                        <div className='pick-grid pick-grid--picked'>
                            <PickCard garment={pickedElsewhere} active onClick={() => {}} />
                        </div>
                    </div>
                )}
                {!recLoading && (
                    <div className='pick-grid'>
                        {shortlist.map((g, i) => (
                            <PickCard key={g.id} garment={g} index={i} active={selected?.id === g.id} onClick={() => setSelected(g)} />
                        ))}
                    </div>
                )}
                {recError && <p className='pick-note'>Our picks did not load, so here is the regular list.</p>}
                {catalogEnabled && catalogTotal > 0 && (
                    <div className='pick-actions'>
                        <button type='button' className='catalog-open' onClick={() => { setSearchInput(''); setSearch(''); setPage(0); setResults([]); setLoading(true); setBrowsing(true); }}>
                            Explore all {catalogTotal} options &rarr;
                        </button>
                        <p className='pick-actions-note'>The full catalog is sorted by what sells most.</p>
                    </div>
                )}
            </div>
            <div className='slide-nav'>
                <NavBtn onClick={onPrevious} direction='prev'>&larr; Prev</NavBtn>
                <NavBtn onClick={() => onNext()}>Next &rarr;</NavBtn>
            </div>
        </>
    );
}
