import React from 'react';
import NavBtn from '../components/NavBtn';

const OBG_LOGO = 'https://olivebranchapparel.co/cdn/shop/files/OliveBranchLogo7-22-24_800x800_4c028e5b-777e-482f-b913-7dea35212eb5.png';

const IntroSlide = ({ selectedProject, setSelectedProject, onNext }) => {
    return (
        <>
            <div className='slide-header'>
                <img src={OBG_LOGO} alt='Olive Branch' className='intro-logo' style={{ width: '64px', height: 'auto', margin: '0 auto 12px' }} />
                <h1 className='text-3xl font-bold headingColor'>Let's Build Your Custom Order</h1>
                <p className='mt-1 text-sm bodyColor'>
                    Walk through a few quick steps and we'll put together a quote for you.
                </p>
            </div>
            <div className='slide-content'>
                <div>
                    <h2 className='text-lg font-semibold headingColor mb-3 text-center'>What are we making?</h2>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                        <button
                            className={`w-full py-3 px-5 rounded-xl cursor-pointer text-base font-semibold transition duration-300 ${
                                selectedProject === 'screenPrinting' ? 'btnColor' : 'btnInactive'
                            }`}
                            onClick={() => setSelectedProject('screenPrinting')}
                        >
                            Screen Printing
                        </button>
                        <button
                            className={`w-full py-3 px-5 rounded-xl cursor-pointer text-base font-semibold transition duration-300 ${
                                selectedProject === 'embroidery' ? 'btnColor' : 'btnInactive'
                            }`}
                            onClick={() => setSelectedProject('embroidery')}
                        >
                            Embroidery
                        </button>
                    </div>
                </div>
            </div>
            <div className='slide-nav nav-end'>
                <NavBtn onClick={onNext}>Next &rarr;</NavBtn>
            </div>
        </>
    );
};

export default IntroSlide;
