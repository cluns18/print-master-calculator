import React, { useState, useEffect } from 'react';
import NavBtn from '../components/NavBtn';

// These are Kevin's own three price rows, verbatim from his 2026-09-10 sheet.
// They are deliberately NOT a prettier list of placements mapped onto his rows:
// any mapping we invented would quote a number his sheet does not contain.
const PRICE_ROWS = [
    { key: 'left_chest', label: 'Left Chest / Sleeve / Hat', hint: 'Standard logo size. Also covers cuffs, pockets and caps.' },
    { key: 'full_back',  label: 'Full Back',                 hint: 'Large decoration across the back or full front.' },
    { key: 'names',      label: 'Names / Personalization',   hint: 'Individual names or numbers per piece.' },
];

export default function LocationSelect({ onNext, onPrevious, setSelectedLocation }) {
    const [selected, setSelected] = useState([]);

    const toggle = (key) =>
        setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

    useEffect(() => { setSelectedLocation(selected); }, [selected, setSelectedLocation]);

    return (
        <>
            <div className='slide-header'>
                <h1 className='text-3xl font-bold headingColor'>Where Should It Go?</h1>
                <p className='mt-1 text-sm bodyColor'>Pick every placement. Additional placements on the same piece are half price.</p>
            </div>
            <div className='slide-content'>
                <div className='grid grid-cols-1 gap-2 w-full'>
                    {PRICE_ROWS.map(({ key, label, hint }) => (
                        <button
                            key={key}
                            type='button'
                            aria-pressed={selected.includes(key)}
                            className={`w-full py-3 px-5 rounded-lg cursor-pointer text-left transition duration-300 ${
                                selected.includes(key) ? 'btnColor' : 'btnInactive'
                            }`}
                            onClick={() => toggle(key)}
                        >
                            <span className='block text-base font-semibold'>{label}</span>
                            <span className='block text-xs opacity-80 mt-0.5'>{hint}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className='slide-nav'>
                <NavBtn onClick={onPrevious} direction='prev'>&larr; Prev</NavBtn>
                <NavBtn onClick={() => { if (selected.length > 0) onNext(); }}>Next &rarr;</NavBtn>
            </div>
        </>
    );
}
