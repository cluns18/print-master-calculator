import React, { useState, useEffect, useCallback } from 'react';
import NavBtn from '../components/NavBtn';
import calculateFinalQuote from '../utils/functions';
import { sendQuote, clean, escName, artworkStatus } from '../utils/quoteDelivery';
import { throttle } from 'lodash';
import SHOP_CONFIG from '../config/shop';
import { LOCATIONS } from '../config/locations';
import { SP_PLACEMENTS } from './SPLocationSelect';

const GARMENT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
const HAT_GARMENTS = ['embhat'];

export default function FinalQuote({
    onNext, onPrevious, selectedProject, selectedGarment,
    selectedSPGarment, selectedEmbGarment, selectedColor,
    selectedArtwork, artworkFile, artworkDescription, locationColorCounts,
    selectedSpecialInks, digitizing, selectedLocation, screensOnFile, setFinalQuote
}) {
    const isHat = selectedGarment?.id && HAT_GARMENTS.includes(selectedGarment.id);
    const sizes = isHat ? null : GARMENT_SIZES;
    // Kevin, 2026-09-10: "Embroidery = 1 piece minimum / Screen printing: 12 piece minimum"
    const MOQ = selectedProject === 'screenPrinting' ? 12 : 1;

    const garmentLabel = selectedSPGarment?.label || selectedSPGarment?.name || selectedEmbGarment?.label || selectedEmbGarment?.name || selectedGarment?.name || '';
    const colorName = typeof selectedColor === 'object' && selectedColor !== null ? selectedColor.name : selectedColor || '';
    const LOCATION_LABELS = selectedProject === 'screenPrinting'
        ? Object.fromEntries(SP_PLACEMENTS.map((p) => [p.key, p.label]))
        : {
            left_chest: 'Left Chest / Sleeve / Hat',
            full_back: 'Full Back',
            names: 'Names / Personalization',
        };
    const locationList = selectedLocation?.length > 0
        ? selectedLocation.map((k) => LOCATION_LABELS[k] || k).join(', ')
        : '';

    const [sizeBreakdown, setSizeBreakdown] = useState(
        isHat ? null : Object.fromEntries(GARMENT_SIZES.map(s => [s, 0]))
    );
    const [quantity, setQuantity] = useState(MOQ);
    const [pricePerItem, setPricePerItem] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);
    const [formData, setFormData] = useState({ name: '', company: '', email: '', phone: '', pickup: '' });
    const [isFormValid, setIsFormValid] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [pricingRevealed, setPricingRevealed] = useState(false);
    const [quote, setQuote] = useState(null);

    const handleSizeChange = (size, delta) => {
        const current = sizeBreakdown[size] || 0;
        const val = Math.max(0, current + delta);
        const updated = { ...sizeBreakdown, [size]: val };
        setSizeBreakdown(updated);
        const total = Object.values(updated).reduce((sum, v) => sum + v, 0);
        if (total > 0) setQuantity(total);
    };

    const fetchQuote = useCallback(throttle(async (qty, sizes) => {
        const result = await calculateFinalQuote(
            selectedGarment, qty,
            { selectedProject, selectedLocation, digitizing, locationColorCounts, selectedColor,
              pickedGarment: selectedProject === 'screenPrinting' ? selectedSPGarment : selectedEmbGarment,
              sizeBreakdown: sizes, screensOnFile }
        );
        setQuote(result);
        if (result?.quotable) {
            setPricePerItem(result.pricePerItem);
            setTotalPrice(result.totalQuote);
            setFinalQuote({ pricePerItem: result.pricePerItem, totalPrice: result.totalQuote, quantity: qty });
        } else {
            // Never render a guessed or $0 price. The screen shows "we'll price this by
            // hand" and the lead is still captured and emailed.
            setPricePerItem(0);
            setTotalPrice(0);
            setFinalQuote({ pricePerItem: 0, totalPrice: 0, quantity: qty, errorCode: result?.errorCode });
        }
    }, 200), [selectedProject, selectedGarment, selectedSPGarment, selectedEmbGarment, selectedLocation, digitizing, locationColorCounts, selectedColor, screensOnFile, setFinalQuote]);

    // The breakdown is part of the price now (2XL and up cost more), so moving a piece
    // from L to 2XL re-prices even though the quantity did not change.
    useEffect(() => { fetchQuote(quantity, sizeBreakdown); }, [quantity, sizeBreakdown, fetchQuote]);

    // What a regular size costs per piece and what each bigger size adds, for the
    // size-by-size subtotals.
    const basePerItem = quote?.quotable ? (quote.basePerItem ?? pricePerItem) : 0;
    const sizeAdders = (quote?.quotable && quote.sizeAdders) || {};
    const adderSizes = Object.keys(sizeAdders);
    const pickup = LOCATIONS.find((l) => l.id === formData.pickup) || null;

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePhone = (phone) => /^\d{10}$|^\d{3}-\d{3}-\d{4}$|^\(\d{3}\)\s\d{3}-\d{4}$|^\+\d{1,3}\d{7,14}$/.test(phone.replace(/\s/g, ''));

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (formErrors[name]) setFormErrors({ ...formErrors, [name]: '' });
    };

    useEffect(() => {
        const errors = {};
        if (formData.name.trim() === '') errors.name = 'Name is required';
        if (formData.email.trim() === '') errors.email = 'Email is required';
        else if (!validateEmail(formData.email)) errors.email = 'Please enter a valid email address';
        if (formData.phone.trim() === '') errors.phone = 'Phone number is required';
        else if (!validatePhone(formData.phone)) errors.phone = 'Please enter a valid phone number';
        if (!formData.pickup) errors.pickup = 'Pickup location is required';
        setFormErrors(errors);
        setIsFormValid(Object.keys(errors).length === 0);
    }, [formData]);

    const handleSubmit = async () => {
        if (!isFormValid) return;
        setIsSubmitting(true);

    const sizeBreakdownString = sizeBreakdown
        ? Object.entries(sizeBreakdown)
            .filter(([, qty]) => qty > 0)
            .map(([size, qty]) => `${size} × ${qty}`)
            .join('&nbsp;&nbsp;·&nbsp;&nbsp;')
        : 'N/A (hat)';

    // --- Decoration / set-up detail for the shop's lead email ---
    // Kevin prices a flat rate per placement by quantity tier, so the useful detail is the
    // per-placement rate and the one-time set-up, not a colour or stitch count.
    // Screen print (Kevin's 2026-09-29 updated matrix): one screen per colour per placement
    // off the light or dark table, then the one-time screen fees. Kevin prices the white
    // base into the dark table, so there is no underbase screen.
    const spLineText = (l) =>
        `${l.label}: ${l.colors} ${l.colors === 1 ? 'color' : 'colors'} = ${l.screens} ${l.screens === 1 ? 'screen' : 'screens'}`;
    const spReasonText = {
        SP_BELOW_MIN: `Screen print - below the ${MOQ} piece minimum, quote by hand`,
        SP_OVER_MAX: 'Screen print - over 500 pieces, above the sheet, quote by hand',
        SP_OVER_SCREENS: quote?.lines
            ? `Screen print - ${quote.screensRequired} screens needed on one placement (sheet stops at ${quote.maxScreens}), quote by hand | ${quote.lines.map(spLineText).join(' + ')}`
            : 'Screen print - too many screens, quote by hand',
        SP_MATRIX_MISSING: 'Screen print - priced by hand, no online rate',
    };
    // This string prints in the customer's copy too, so it says what is included and
    // never how the blank is marked up (Kevin, 2026-10-07).
    const garmentText = !quote?.garmentIncluded
        ? 'DECORATION ONLY - garments quoted separately'
        : adderSizes.length > 0
            ? `Garment included, ${adderSizes.map((s) => `${s} +$${sizeAdders[s].toFixed(2)}/pc`).join(', ')}`
            : 'Garment included';
    const pickupText = pickup ? [`Pickup: ${pickup.name}`] : [];
    const inkDetails = quote?.quotable
        ? quote.service === 'screenPrinting'
            ? [
                quote.lines.map((l) => `${spLineText(l)} @ $${l.rate.toFixed(2)}/pc`).join(' + '),
                quote.screensOnFile
                    ? `Screens: ${quote.screens} on file, REORDER per customer, no screen fees`
                    : `Screens: ${quote.screens} x $${quote.screenFee} = $${quote.screenFees.toFixed(2)} one-time`,
                `Tier: ${quote.tier} (${quote.dark ? 'dark' : 'light'} garment pricing)`,
                garmentText,
                ...pickupText,
              ].join(' | ')
            : [
                quote.lines
                    .map((l) => `${l.label} @ $${l.perPiece.toFixed(2)}/pc${l.primary ? '' : ' (2nd placement, 1/2 price)'}`)
                    .join(' + '),
                `Set-up: ${quote.setupLabel}${quote.setupFee ? ` ($${quote.setupFee})` : ' (no charge)'}`,
                `Tier: ${quote.tier}`,
                garmentText,
                ...pickupText,
              ].join(' | ')
        : selectedProject === 'screenPrinting'
            ? [spReasonText[quote?.errorCode] || 'Screen print - could not price online, quote by hand', ...pickupText].join(' | ')
            : 'Incomplete selection';

    // --- Artwork status ---
    const artworkUploaded = selectedArtwork && !selectedArtwork.startsWith('pending:');
    const pendingFilename = selectedArtwork && selectedArtwork.startsWith('pending:')
        ? selectedArtwork.slice('pending:'.length)
        : null;

    // --- One payload -> central OBG mail service (obg-mail-api on Vercel) ---
    // shop_id selects this shop's brand kit (colors, logo, recipients, copy) from the mail
    // service registry. No EmailJS, no secrets in this front end. Override URL via env.
    const payload = {
        shop_id: SHOP_CONFIG.shop_id,
        // The mail service lets an inline shop block override the registry, so the lead
        // lands in the picked shop's inbox and the customer's copy carries that shop's
        // phone and address. Same routing as the quote form.
        shop: pickup
            ? { shop_email: pickup.email, shop_phone: pickup.phone, shop_address: `${pickup.address}, ${pickup.cityLine}` }
            : undefined,
        customer: {
            name: escName(clean(formData.name, 120)),
            email: clean(formData.email, 200),
            company: clean(formData.company, 200) || 'N/A',
            phone: clean(formData.phone, 40),
        },
        quote: {
            project: selectedProject === 'screenPrinting' ? 'Screen Printing' : 'Embroidery',
            garment_name: garmentLabel,
            color: colorName,
            locations: locationList || 'None',
            ink_details: inkDetails,
            special_inks: selectedSpecialInks.length > 0 ? selectedSpecialInks.join(', ') : 'None',
            size_breakdown: sizeBreakdownString,
            quantity,
            price_per_item: quote?.quotable ? pricePerItem.toFixed(2) : 'Quote requested',
            total_price: quote?.quotable ? totalPrice.toFixed(2) : 'Quote requested',

            artwork_status: artworkStatus({
                artworkUrl: artworkUploaded ? selectedArtwork : null,
                pendingFilename,
            }),
            artwork_description: clean(artworkDescription, 4000) || 'No description provided',
        },
    };

    try {
        // Attaches the artwork when we have both the file and a confirmed upload,
        // and falls back to the link-only payload rather than losing the quote.
        await sendQuote(payload, { file: artworkFile, artworkUrl: artworkUploaded ? selectedArtwork : null });

        window.parent.postMessage(
            { event: 'calculator_submission', quotable: !!quote?.quotable, totalQuote: quote?.quotable ? totalPrice.toFixed(2) : '', pricePerItem: quote?.quotable ? pricePerItem.toFixed(2) : '', quantity },
            '*'
        );
        onNext();
    } catch (error) {
        console.error('Quote submission failed:', error);
        alert('Error submitting project. Please try again.');
    }

        setIsSubmitting(false);
    };

    const belowMOQ = quantity < MOQ;

    return (
        <>
            <div className='slide-header' style={{ padding: '8px 24px 2px' }}>
                <h1 className='text-2xl font-bold headingColor' style={{ marginBottom: '1px', fontSize: '1.15rem' }}>Finalize Your Order</h1>
                <p className='bodyColor' style={{ fontSize: '0.7rem', color: 'rgba(240,237,228,0.7)' }}>
                    {garmentLabel}{colorName ? ` - ${colorName}` : ''}
                </p>
            </div>
            <div className='slide-content final-quote-content'>
                {/* Screen print we cannot price online. Never show a guessed or $0 number;
                    the lead is still captured and emailed to the shop. */}
                {quote && !quote.quotable && ['SP_OVER_SCREENS', 'SP_OVER_MAX', 'SP_BELOW_MIN', 'SP_MATRIX_MISSING'].includes(quote.errorCode) && (
                    <div style={{
                        background: 'rgba(233,206,50,0.12)', border: '1px solid rgba(233,206,50,0.35)',
                        borderRadius: '8px', padding: '10px 14px', marginBottom: '10px',
                    }}>
                        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '0.8rem', color: '#e9ce32', margin: 0 }}>
                            {quote.errorCode === 'SP_OVER_SCREENS' && 'That many colors needs a hand quote'}
                            {quote.errorCode === 'SP_OVER_MAX' && 'Over 500 pieces? We price that personally'}
                            {quote.errorCode === 'SP_BELOW_MIN' && `Screen print starts at ${MOQ} pieces`}
                            {quote.errorCode === 'SP_MATRIX_MISSING' && 'Screen print is priced by hand'}
                        </p>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: '#f0ede4', margin: '4px 0 0', lineHeight: 1.5 }}>
                            {quote.errorCode === 'SP_OVER_SCREENS' && (
                                <>Our online pricing covers up to {quote.maxScreens} colors per placement and this design needs {quote.screensRequired}. Drop a color, or send it through and we'll price it by hand. Or call {SHOP_CONFIG.shop_phone}.</>
                            )}
                            {quote.errorCode === 'SP_OVER_MAX' && (
                                <>Big runs get better numbers than any chart. Send your details below and we'll come back with a real quote, or call {SHOP_CONFIG.shop_phone}.</>
                            )}
                            {quote.errorCode === 'SP_BELOW_MIN' && (
                                <>Bump the quantity to {MOQ} or more to see a price. Under that, send it through and we'll talk options, or call {SHOP_CONFIG.shop_phone}.</>
                            )}
                            {quote.errorCode === 'SP_MATRIX_MISSING' && (
                                <>Send your details below and we'll come back with a real number, or call {SHOP_CONFIG.shop_phone}. {MOQ} piece minimum.</>
                            )}
                        </p>
                    </div>
                )}

                {/* Without a blank cost the figure is decoration only, so don't let it read as all-in. */}
                {quote?.quotable && quote.decorationOnly && (
                    <p style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem',
                        color: 'rgba(240,237,228,0.75)', textAlign: 'center', margin: '0 0 6px',
                    }}>
                        {quote.service === 'screenPrinting'
                            ? (quote.screensOnFile
                                ? 'Print price shown is for decoration with your screens on file. Garments quoted separately.'
                                : `Print price shown is for decoration and includes $${quote.screenFees.toFixed(2)} in screen fees. Garments quoted separately.`)
                            : 'Embroidery price shown is for decoration. Garments quoted separately.'}
                    </p>
                )}

                {/* Running counter pill + MOQ */}
                <div className='text-center mb-1'>
                    <div className='counter-pill' style={{
                        display: 'inline-flex', alignItems: 'center', gap: '12px',
                        background: 'rgba(0, 122, 195, 0.15)', border: '1px solid rgba(0, 122, 195, 0.3)',
                        borderRadius: '999px', padding: '5px 16px',
                    }}>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', color: '#f0ede4', fontWeight: 600 }}>{quantity} Items</span>
                        <span style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.15)' }}></span>
                        <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.8rem', color: '#e9ce32', fontWeight: 700 }}>
                            {quote?.quotable ? `$${pricePerItem.toFixed(2)}/ea` : 'Quoted by hand'}
                        </span>
                    </div>
                    {belowMOQ && (
                        <p style={{ color: '#c4a24e', fontSize: '0.7rem', fontFamily: "'DM Sans', sans-serif", marginTop: '4px' }}>
                            Minimum order: {MOQ} units
                        </p>
                    )}
                </div>

                {/* Size selectors */}
                {sizes ? (
                    <div style={{ marginBottom: '10px', display: pricingRevealed ? 'none' : 'block' }}>
                        <div className='size-grid' style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                            {sizes.map((size) => {
                                const qty = sizeBreakdown[size] || 0;
                                const isActive = qty > 0;
                                return (
                                    <div key={size} className='text-center size-cell' style={{
                                        background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                                        borderRadius: '6px', padding: '6px 2px 4px',
                                        border: isActive ? '2px solid #007ac3' : '2px solid rgba(255,255,255,0.08)',
                                        transition: 'all 0.2s ease',
                                    }}>
                                        <div className='size-label' style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.6rem', color: '#f0ede4', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{size}</div>
                                        <div className='flex items-center justify-center gap-0.5'>
                                            <button className='size-btn' onClick={() => handleSizeChange(size, -1)} style={{ width: '16px', height: '16px', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', color: '#f0ede4', padding: 0, lineHeight: 1 }}>-</button>
                                            <input className='size-input' type='number' style={{ width: '38px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '3px', padding: '1px 2px', fontSize: '0.7rem', fontFamily: "'Poppins', sans-serif", fontWeight: 700, background: 'rgba(255,255,255,0.06)', color: '#f0ede4' }} value={qty} onChange={(e) => { const v = parseInt(e.target.value) || 0; setSizeBreakdown(prev => { const u = { ...prev, [size]: Math.max(0, v) }; const t = Object.values(u).reduce((s, x) => s + x, 0); if (t > 0) setQuantity(t); return u; }); }} min='0' max='1000' />
                                            <button className='size-btn' onClick={() => handleSizeChange(size, 1)} style={{ width: '16px', height: '16px', borderRadius: '3px', border: '1px solid rgba(0, 122, 195, 0.3)', background: 'rgba(0, 122, 195, 0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', color: '#f0ede4', padding: 0, lineHeight: 1 }}>+</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className='mb-4 text-center'>
                        <label className='text-lg font-semibold headingColor block mb-3'>Quantity</label>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                style={{
                                    width: '32px', height: '32px', borderRadius: '6px',
                                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,240,232,0.12)',
                                    color: '#f0ede4', cursor: 'pointer', fontSize: '18px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >-</button>
                            <span className='headingColor text-2xl font-bold' style={{ minWidth: '48px', textAlign: 'center' }}>{quantity}</span>
                            <button
                                onClick={() => setQuantity(Math.min(5000, quantity + 1))}
                                style={{
                                    width: '32px', height: '32px', borderRadius: '6px',
                                    background: 'rgba(0, 122, 195, 0.25)', border: '1px solid rgba(0, 122, 195, 0.3)',
                                    color: '#f0ede4', cursor: 'pointer', fontSize: '18px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >+</button>
                        </div>
                    </div>
                )}

                {/* Light contrast breakdown card */}
                {!pricingRevealed ? (
                    <div className='light-card' style={{
                        background: '#f4f1ea', borderRadius: '10px', padding: '10px 12px', textAlign: 'center',
                    }}>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.55rem', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#007ac3', marginBottom: '2px' }}>Almost There</p>
                        <h3 style={{ color: '#0a0a0a', fontSize: '0.9rem', fontWeight: '700', fontFamily: "'Poppins', sans-serif", marginBottom: '2px' }}>
                            See Your Full Breakdown
                        </h3>
                        <p style={{ color: '#6f6f66', fontSize: '0.65rem', fontFamily: "'DM Sans', sans-serif", marginBottom: '8px', lineHeight: 1.35 }}>
                            Drop your info to see the full size-by-size breakdown and total.
                        </p>

                        <div className='form-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '6px' }}>
                            <input type='text' name='name' placeholder='Your Name *' value={formData.name} onChange={handleChange} style={inputStyle} />
                            <input type='text' name='company' placeholder='Company (optional)' value={formData.company} onChange={handleChange} style={inputStyle} />
                            <input type='email' name='email' placeholder='Your Best Email *' value={formData.email} onChange={handleChange} style={inputStyle} />
                            <input type='tel' name='phone' placeholder='Phone Number *' value={formData.phone} onChange={handleChange} style={inputStyle} />
                            {/* Kevin, 2026-10-07: pick the shop so the lead goes to the right PrintMaster. */}
                            <select name='pickup' value={formData.pickup} onChange={handleChange} aria-label='Pickup location'
                                style={{ ...inputStyle, gridColumn: '1 / -1', color: formData.pickup ? '#0a0a0a' : '#6f6f66', cursor: 'pointer' }}>
                                <option value='' disabled>Pickup Location *</option>
                                {LOCATIONS.map((l) => (
                                    <option key={l.id} value={l.id}>{l.name} - {l.address}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={() => { if (isFormValid && !belowMOQ) setPricingRevealed(true); }}
                            style={{
                                background: isFormValid && !belowMOQ ? '#007ac3' : '#6f6f66',
                                color: '#f0ede4', border: 'none', borderRadius: '999px',
                                padding: '7px 22px', fontSize: '0.72rem', fontWeight: '600',
                                fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase',
                                cursor: isFormValid && !belowMOQ ? 'pointer' : 'not-allowed',
                                transition: 'all 0.25s ease',
                                opacity: isFormValid && !belowMOQ ? 1 : 0.5,
                            }}
                            onMouseEnter={(e) => { if (isFormValid && !belowMOQ) { e.target.style.background = '#3b8ecc'; e.target.style.transform = 'translateY(-1px)'; } }}
                            onMouseLeave={(e) => { e.target.style.background = '#007ac3'; e.target.style.transform = 'translateY(0)'; }}
                        >
                            See Your Full Breakdown
                        </button>
                    </div>
                ) : (
                    <div className='light-card' style={{ background: '#f4f1ea', borderRadius: '10px', padding: '14px', animation: 'fadeIn 0.4s ease' }}>
                        {/* Price highlights */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '10px', flexWrap: 'wrap' }}>
                            <div className='text-center'>
                                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6f6f66', marginBottom: '1px' }}>Per Item</div>
                                <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: '#0a0a0a' }}>{quote?.quotable ? `$${pricePerItem.toFixed(2)}` : '-'}</div>
                            </div>
                            <div style={{ width: '1px', background: 'rgba(26,31,20,0.1)', alignSelf: 'stretch' }} />
                            <div className='text-center'>
                                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6f6f66', marginBottom: '1px' }}>Total Quote</div>
                                <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: '#005a8f' }}>{quote?.quotable ? `$${totalPrice.toFixed(2)}` : 'By quote'}</div>
                            </div>
                            <div style={{ width: '1px', background: 'rgba(26,31,20,0.1)', alignSelf: 'stretch' }} />
                            <div className='text-center'>
                                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6f6f66', marginBottom: '1px' }}>Total Items</div>
                                <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: '#0a0a0a' }}>{quantity}</div>
                            </div>
                        </div>

                        {/* Breakdown table with inline +/- */}
                        {sizes && sizeBreakdown && (
                            <div style={{ marginBottom: '8px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(26,31,20,0.1)' }}>
                                            <th style={{ padding: '3px 0', textAlign: 'left', color: '#6f6f66', fontWeight: 500, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Size</th>
                                            <th style={{ padding: '3px 0', textAlign: 'center', color: '#6f6f66', fontWeight: 500, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Qty</th>
                                            <th style={{ padding: '3px 0', textAlign: 'right', color: '#6f6f66', fontWeight: 500, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sizes.map(size => {
                                            const qty = sizeBreakdown[size] || 0;
                                            return (
                                                <tr key={size} style={{ borderBottom: '1px solid rgba(26,31,20,0.06)' }}>
                                                    <td style={{ padding: '4px 0', color: '#0a0a0a', fontWeight: 500 }}>
                                                        {size}
                                                        {sizeAdders[size] > 0 && (
                                                            <span style={{ color: '#005a8f', fontWeight: 600, marginLeft: '6px' }}>+${sizeAdders[size].toFixed(2)} ea</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '4px 0', textAlign: 'center' }}>
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                            <button onClick={() => handleSizeChange(size, -1)} style={{ width: '18px', height: '18px', borderRadius: '3px', border: '1px solid rgba(26,31,20,0.15)', background: 'rgba(26,31,20,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', color: '#0a0a0a', padding: 0, lineHeight: 1 }}>-</button>
                                                            <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 600, color: qty > 0 ? '#0a0a0a' : '#6f6f66' }}>{qty}</span>
                                                            <button onClick={() => handleSizeChange(size, 1)} style={{ width: '18px', height: '18px', borderRadius: '3px', border: '1px solid rgba(0, 122, 195, 0.3)', background: 'rgba(0, 122, 195, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', color: '#005a8f', padding: 0, lineHeight: 1 }}>+</button>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '4px 0', textAlign: 'right', color: qty > 0 ? '#0a0a0a' : '#6f6f66', fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>{quote?.quotable ? `$${(qty * (basePerItem + (sizeAdders[size] || 0))).toFixed(2)}` : '-'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.6rem', color: '#6f6f66', textAlign: 'center', lineHeight: 1.4, marginBottom: '8px' }}>
                            {pickup ? `Pickup at PrintMaster ${pickup.name}.` : 'Local pickup price.'} Submit to inquire about shipping. Estimate may vary slightly on final approval.
                        </p>

                        <div className='text-center'>
                            <button
                                onClick={handleSubmit}
                                disabled={!isFormValid || isSubmitting || belowMOQ}
                                style={{
                                    background: (isFormValid && !belowMOQ) ? '#007ac3' : '#6f6f66',
                                    color: '#f0ede4', border: 'none', padding: '8px 28px', borderRadius: '999px',
                                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', fontWeight: 600,
                                    letterSpacing: '0.06em', textTransform: 'uppercase',
                                    cursor: (isFormValid && !belowMOQ) ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.25s ease',
                                    opacity: (isFormValid && !belowMOQ) ? 1 : 0.5,
                                }}
                                onMouseEnter={(e) => { if (isFormValid && !belowMOQ) { e.target.style.background = '#3b8ecc'; e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 20px rgba(0, 122, 195, 0.3)'; } }}
                                onMouseLeave={(e) => { e.target.style.background = '#007ac3'; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
                            >
                                {isSubmitting ? 'Sending...' : 'Save & Send to Me'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div className='slide-nav'>
                <NavBtn onClick={onPrevious} direction='prev'>&larr; Prev</NavBtn>
                <div></div>
            </div>
        </>
    );
}

const inputStyle = {
    width: '100%',
    background: '#fff',
    border: '1px solid rgba(26,31,20,0.2)',
    borderRadius: '6px',
    padding: '6px 9px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.7rem',
    fontWeight: 400,
    color: '#0a0a0a',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};
