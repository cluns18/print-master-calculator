import React, { useState, useEffect } from 'react';
import NavBtn from '../components/NavBtn';

// Kevin charges for digitizing. His sheet: up to 4.75" = $65, 4.75" and up = $160,
// personalization name set-up = $35. This is a ONE-TIME order charge, not per piece.
const OPTIONS = [
    { key: 'small', label: 'Logo up to 4.75"',        fee: 65,  hint: 'Standard left chest, sleeve or cap logo.' },
    { key: 'large', label: 'Logo 4.75" and up',       fee: 160, hint: 'Larger decoration, typically a full back.' },
    { key: 'name',  label: 'Names only',              fee: 35,  hint: 'Name or number set-up, no logo.' },
    { key: 'none',  label: 'Already digitized with us', fee: 0, hint: "We've stitched this logo for you before." },
];

export default function DigitizingSelect({ onNext, onPrevious, digitizing, setDigitizing }) {
    const [selected, setSelected] = useState(digitizing || null);
    useEffect(() => { setDigitizing(selected); }, [selected, setDigitizing]);

    return (
        <>
            <div className='slide-header'>
                <h1 className='text-3xl font-bold headingColor'>Artwork Set-Up</h1>
                <p className='mt-1 text-sm bodyColor'>Embroidery needs your logo converted to a stitch file. This is a one-time charge, not per piece.</p>
            </div>
            <div className='slide-content'>
                <div className='grid grid-cols-1 gap-2 w-full'>
                    {OPTIONS.map(({ key, label, fee, hint }) => (
                        <button
                            key={key}
                            type='button'
                            aria-pressed={selected === key}
                            className={`w-full py-3 px-5 rounded-lg cursor-pointer text-left transition duration-300 ${
                                selected === key ? 'btnColor' : 'btnInactive'
                            }`}
                            onClick={() => setSelected(key)}
                        >
                            <span className='flex items-baseline justify-between gap-3'>
                                <span className='text-base font-semibold'>{label}</span>
                                <span className='text-sm font-bold'>{fee === 0 ? 'No charge' : `$${fee}`}</span>
                            </span>
                            <span className='block text-xs opacity-80 mt-0.5'>{hint}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className='slide-nav'>
                <NavBtn onClick={onPrevious} direction='prev'>&larr; Prev</NavBtn>
                <NavBtn onClick={() => { if (selected) onNext(); }}>Next &rarr;</NavBtn>
            </div>
        </>
    );
}
