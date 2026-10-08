import React, { useState, useEffect } from 'react';
import NavBtn from '../components/NavBtn';
import { SP_PLACEMENTS } from './SPLocationSelect';

// Kevin's sheet runs 1 to 6 colours per location and charges $25 a screen, one screen
// per colour. Dark garments have their own price table with the white base already
// in it (Kevin, 2026-09-29: "we do eat the cost of a base and do not charge for a base
// screen"), so light and dark both cap at 6 and neither adds an underbase screen.
const MAX_COLORS = 6;
const SCREEN_FEE = 25;

const labelFor = (key) => (SP_PLACEMENTS.find((p) => p.key === key) || {}).label || key;

export default function ColorCount({ onNext, onPrevious, selectedLocations, setColorCounts, screensOnFile, setScreensOnFile }) {
    const [colorCounts, setLocalColorCounts] = useState({});
    const maxColors = MAX_COLORS;

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

    const totalScreens = selectedLocations.reduce((sum, loc) => sum + (colorCounts[loc] || 1), 0);

    return (
        <>
            <div className='slide-header'>
                <h1 className='text-3xl font-bold headingColor'>How Many Ink Colors?</h1>
                <p className='mt-1 text-sm bodyColor'>
                    Each color is a screen, and screens are ${SCREEN_FEE} each, one time per order.
                </p>
            </div>
            <div className='slide-content'>
                <div>
                    {selectedLocations.map((location) => {
                        const colors = colorCounts[location] || 1;
                        const screens = colors;
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
                                    {colors} {colors === 1 ? 'color' : 'colors'} = {screens} {screens === 1 ? 'screen' : 'screens'}
                                </p>
                            </div>
                        );
                    })}
                    {/* Kevin, 2026-10-07: "We don't charge a setup fee for reorders". */}
                    <label className='flex items-center gap-3 mt-5 text-sm bodyColor text-left' style={{ cursor: 'pointer' }}>
                        <input type='checkbox' checked={!!screensOnFile} onChange={(e) => setScreensOnFile(e.target.checked)}
                            style={{ width: '18px', height: '18px', accentColor: '#007ac3', flexShrink: 0 }} />
                        <span>This is a reorder and PrintMaster already has my screens on file</span>
                    </label>
                    <p className='text-sm headingColor mt-3'>
                        {screensOnFile
                            ? `${totalScreens} ${totalScreens === 1 ? 'screen' : 'screens'} on file, no screen fees on a reorder.`
                            : `${totalScreens} ${totalScreens === 1 ? 'screen' : 'screens'} total, $${totalScreens * SCREEN_FEE} in screen fees on this order.`}
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
