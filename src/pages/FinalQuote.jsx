import React, { useState, useEffect, useCallback } from 'react';
import NavBtn from '../components/NavBtn';
import calculateFinalQuote from '../utils/functions';
import { sendQuote, clean, escName, artworkStatus } from '../utils/quoteDelivery';
import { throttle } from 'lodash';
import SHOP_CONFIG from '../config/shop';

const GARMENT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
const HAT_GARMENTS = ['embhat'];

export default function FinalQuote({
    onNext, onPrevious, selectedProject, selectedGarment,
    selectedSPGarment, selectedEmbGarment, selectedColor,
    selectedArtwork, artworkFile, artworkDescription, locationColorCounts,
    selectedSpecialInks, digitizing, selectedLocation, setFinalQuote
}) {
    const isHat = selectedGarment?.id && HAT_GARMENTS.includes(selectedGarment.id);
    const sizes = isHat ? null : GARMENT_SIZES;
    // Kevin, 2026-09-10: "Embroidery = 1 piece minimum / Screen printing: 12 piece minimum"
    const MOQ = selectedProject === 'screenPrinting' ? 12 : 1;

    const garmentLabel = selectedSPGarment?.label || selectedSPGarment?.name || selectedEmbGarment?.label || selectedEmbGarment?.name || selectedGarment?.name || '';
    const colorName = typeof selectedColor === 'object' && selectedColor !== null ? selectedColor.name : selectedColor || '';
    const LOCATION_LABELS = {
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
    const [formData, setFormData] = useState({ name: '', company: '', email: '', phone: '' });
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

    const fetchQuote = useCallback(throttle(async (qty) => {
        const result = await calculateFinalQuote(
            selectedGarment, qty,
            { selectedProject, selectedLocation, digitizing }
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
    }, 200), [selectedProject, selectedGarment, selectedLocation, digitizing, setFinalQuote]);

    useEffect(() => { fetchQuote(quantity); }, [quantity, fetchQuote]);

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
    const inkDetails = quote?.quotable
        ? [
            quote.lines
                .map((l) => `${l.label} @ $${l.perPiece.toFixed(2)}/pc${l.primary ? '' : ' (2nd placement, 1/2 price)'}`)
                .join(' + '),
            `Set-up: ${quote.setupLabel}${quote.setupFee ? ` ($${quote.setupFee})` : ' (no charge)'}`,
            `Tier: ${quote.tier}`,
          ].join(' | ')
        : selectedProject === 'screenPrinting'
            ? 'Screen print - priced by hand, no online rate'
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
            // Kevin's sheet prices decoration only; it carries no blank/garment cost.
            pricing_note: quote?.quotable
                ? 'Decoration only. Garments quoted separately.'
                : 'Customer used the calculator; this service needs a hand-priced quote.',
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
            { event: 'calculator_submission', totalQuote: totalPrice.toFixed(2), pricePerItem: pricePerItem.toFixed(2), quantity },
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
                {/* Service we cannot price online. Never show a guessed or $0 number;
                    the lead is still captured and emailed to the shop. */}
                {quote && !quote.quotable && quote.errorCode === 'SP_MATRIX_MISSING' && (
                    <div style={{
                        background: 'rgba(233,206,50,0.12)', border: '1px solid rgba(233,206,50,0.35)',
                        borderRadius: '8px', padding: '10px 14px', marginBottom: '10px',
                    }}>
                        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '0.8rem', color: '#e9ce32', margin: 0 }}>
                            Screen print is priced by hand
                        </p>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: '#f0ede4', margin: '4px 0 0', lineHeight: 1.5 }}>
                            Screen print pricing depends on ink colours and placement, so we quote it
                            personally rather than guess. Send your details below and we'll come back with a
                            real number, or call {SHOP_CONFIG.shop_phone}. {MOQ} piece minimum.
                        </p>
                    </div>
                )}

                {/* Kevin's sheet prices decoration only, so don't let the figure read as all-in. */}
                {quote?.quotable && quote.decorationOnly && (
                    <p style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem',
                        color: 'rgba(240,237,228,0.75)', textAlign: 'center', margin: '0 0 6px',
                    }}>
                        Embroidery price shown is for decoration. Garments quoted separately.
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
                        <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.8rem', color: '#e9ce32', fontWeight: 700 }}>${pricePerItem.toFixed(2)}/ea</span>
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
                                <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: '#0a0a0a' }}>${pricePerItem.toFixed(2)}</div>
                            </div>
                            <div style={{ width: '1px', background: 'rgba(26,31,20,0.1)', alignSelf: 'stretch' }} />
                            <div className='text-center'>
                                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6f6f66', marginBottom: '1px' }}>Total Quote</div>
                                <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: '#005a8f' }}>${totalPrice.toFixed(2)}</div>
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
                                                    <td style={{ padding: '4px 0', color: '#0a0a0a', fontWeight: 500 }}>{size}</td>
                                                    <td style={{ padding: '4px 0', textAlign: 'center' }}>
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                            <button onClick={() => handleSizeChange(size, -1)} style={{ width: '18px', height: '18px', borderRadius: '3px', border: '1px solid rgba(26,31,20,0.15)', background: 'rgba(26,31,20,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', color: '#0a0a0a', padding: 0, lineHeight: 1 }}>-</button>
                                                            <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 600, color: qty > 0 ? '#0a0a0a' : '#6f6f66' }}>{qty}</span>
                                                            <button onClick={() => handleSizeChange(size, 1)} style={{ width: '18px', height: '18px', borderRadius: '3px', border: '1px solid rgba(0, 122, 195, 0.3)', background: 'rgba(0, 122, 195, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', color: '#005a8f', padding: 0, lineHeight: 1 }}>+</button>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '4px 0', textAlign: 'right', color: qty > 0 ? '#0a0a0a' : '#6f6f66', fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>${(qty * pricePerItem).toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.6rem', color: '#6f6f66', textAlign: 'center', lineHeight: 1.4, marginBottom: '8px' }}>
                            Local pickup price. Submit to inquire about shipping. Estimate may vary slightly on final approval.
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
