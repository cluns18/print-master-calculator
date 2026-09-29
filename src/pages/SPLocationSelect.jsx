import React, { useState, useEffect } from 'react';
import NavBtn from '../components/NavBtn';

// Screen print placements. Kevin's 2026-09-29 sheet is "price per location", so every
// placement picked here is priced as its own location with its own screens.
export const SP_PLACEMENTS = [
    { key: 'front',      label: 'Front',      hint: 'Full front or centre chest.' },
    { key: 'back',       label: 'Back',       hint: 'Full back.' },
    { key: 'left_chest', label: 'Left Chest', hint: 'Small logo, pocket area.' },
    { key: 'sleeve',     label: 'Sleeve',     hint: 'One sleeve. Pick again for the other on the next step.' },
];

export default function SPLocationSelect({ onNext, onPrevious, selectedLocation, setSelectedLocation }) {
    const [selected, setSelected] = useState(Array.isArray(selectedLocation) ? selectedLocation : []);

    const toggle = (key) =>
        setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

    useEffect(() => { setSelectedLocation(selected); }, [selected, setSelectedLocation]);

    return (
        <>
            <div className='slide-header'>
                <h1 className='text-3xl font-bold headingColor'>Where Should It Print?</h1>
                <p className='mt-1 text-sm bodyColor'>Pick every placement. Each one is priced on its own and needs its own screens.</p>
            </div>
            <div className='slide-content'>
                <div className='grid grid-cols-1 gap-2 w-full'>
                    {SP_PLACEMENTS.map(({ key, label, hint }) => (
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
