import React, { useState, useEffect } from 'react';
import NavBtn from '../components/NavBtn';
import { SP_PLACEMENTS } from './SPLocationSelect';

// Kevin's sheet runs 1 to 6 screens per location and charges $25 a screen. A dark
// garment takes a white underbase first, which is a real screen, so the picker caps
// at 5 colours on a dark blank and 6 on a light one. The maths is shown inline so the
// customer sees why a 2 colour print on black is 3 screens.
const MAX_SCREENS = 6;
const SCREEN_FEE = 25;

const labelFor = (key) => (SP_PLACEMENTS.find((p) => p.key === key) || {}).label || key;

export default function ColorCount({ onNext, onPrevious, selectedLocations, setColorCounts, needsUnderbase = false }) {
    const [colorCounts, setLocalColorCounts] = useState({});
    const maxColors = needsUnderbase ? MAX_SCREENS - 1 : MAX_SCREENS;

    useEffect(() => {
        const defaultCounts = {};
        selectedLocations.forEach((location) => {
            if (!colorCounts[location]) defaultCounts[location] = 1;
        });
        if (Object.keys(defaultCounts).length > 0) setLocalColorCounts((prev) => ({ ...prev, ...defaultCounts }));
    }, [selectedLocations]);

    const handleColorChange = (location, value) => {
        setLocalColorCounts((prev) => ({ ...prev, [location]: Math.min(Math.max(value, 1), maxColors) }));
    };

    const totalScreens = selectedLocations.reduce((sum, loc) => sum + (colorCounts[loc] || 1) + (needsUnderbase ? 1 : 0), 0);

    return (
        <>
            <div className='slide-header'>
                <h1 className='text-3xl font-bold headingColor'>How Many Ink Colors?</h1>
                <p className='mt-1 text-sm bodyColor'>
                    Each color is a screen, and screens are ${SCREEN_FEE} each, one time per order.
                    {needsUnderbase ? ' Your garment color is dark, so it gets a white underbase screen first.' : ''}
                </p>
            </div>
            <div className='slide-content'>
                <div>
                    {selectedLocations.map((location) => {
                        const colors = colorCounts[location] || 1;
                        const screens = colors + (needsUnderbase ? 1 : 0);
                        return (
                            <div key={location} className='mt-4 text-left'>
                                <label className='text-lg font-semibold bodyColor'>{labelFor(location)}</label>
                                <div className='flex items-center gap-4 mt-2'>
                                    <input
                                        type='number' min='1' max={maxColors}
                                        value={colors}
                                        onChange={(e) => handleColorChange(location, parseInt(e.target.value) || 1)}
                                        className='w-20 p-2 border-b-2 text-center text-lg bg-transparent focus:outline-none'
                                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                                    />
                                    <input type='range' min='1' max={maxColors} value={colors}
                                        onChange={(e) => handleColorChange(location, parseInt(e.target.value))} className='w-full cursor-pointer' />
                                </div>
                                <p className='text-xs bodyColor mt-1'>
                                    {colors} {colors === 1 ? 'color' : 'colors'}{needsUnderbase ? ' + white underbase' : ''} = {screens} {screens === 1 ? 'screen' : 'screens'}
                                </p>
                            </div>
                        );
                    })}
                    <p className='text-sm headingColor mt-5'>
                        {totalScreens} {totalScreens === 1 ? 'screen' : 'screens'} total, ${totalScreens * SCREEN_FEE} in screen fees on this order.
                    </p>
                </div>
            </div>
            <div className='slide-nav'>
                <NavBtn onClick={onPrevious} direction='prev'>&larr; Prev</NavBtn>
                <NavBtn onClick={() => { setColorCounts(colorCounts); onNext(); }}>Next &rarr;</NavBtn>
            </div>
        </>
    );
}
