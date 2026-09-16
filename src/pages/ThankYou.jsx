import React from 'react';

const OBG_LOGO = 'https://olivebranchapparel.co/cdn/shop/files/OliveBranchLogo7-22-24_800x800_4c028e5b-777e-482f-b913-7dea35212eb5.png';

export default function ThankYou() {
    return (
        <>
            <div className='slide-header'>
                <img src={OBG_LOGO} alt='Olive Branch' style={{ width: '48px', height: 'auto', margin: '0 auto 10px' }} />
                <h1 className='text-3xl font-bold headingColor'>You're All Set</h1>
                <p className='mt-1 text-sm bodyColor'>
                    We've got everything we need. Your quote details are on the way to your inbox.
                </p>
            </div>
            <div className='slide-content'>
                <div className='p-6 rounded-lg' style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p className='text-base bodyColor mb-4'>
                        We'll be in touch soon to confirm the details and get things rolling.
                    </p>
                    <p className='text-base headingColor font-semibold'>
                        Questions? Reach out anytime:
                    </p>
                    <p className='mt-2 text-lg'>
                        <a href='mailto:hello@olivebranchgrowth.com' className='headingColor hover:opacity-80 transition font-semibold underline'>
                            hello@olivebranchgrowth.com
                        </a>
                    </p>
                </div>
                <p className='mt-6 text-sm bodyColor text-center'>
                    Keep an eye on your email for your full quote breakdown.
                </p>
            </div>
            <div className='slide-nav nav-end'>
            </div>
        </>
    );
}
