import React from 'react';
import SHOP_CONFIG from '../config/shop';

const SHOP_LOGO = 'https://cdn.shopify.com/s/files/1/0978/3335/3492/files/printmaster-logo-header-blue.png';

export default function ThankYou() {
    const tel = (SHOP_CONFIG.shop_phone || '').replace(/[^\d]/g, '');
    return (
        <>
            <div className='slide-header'>
                <img src={SHOP_LOGO} alt={SHOP_CONFIG.shop_name} style={{ width: '140px', height: 'auto', margin: '0 auto 10px' }} />
                <h1 className='text-3xl font-bold headingColor'>You're All Set</h1>
                <p className='mt-1 text-sm bodyColor'>
                    We've got everything we need. Your quote details are on the way to your inbox.
                </p>
            </div>
            <div className='slide-content'>
                <div className='p-6 rounded-lg' style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p className='text-base bodyColor mb-4'>
                        Someone at the shop will confirm the details and get things rolling.
                    </p>
                    <p className='text-base headingColor font-semibold'>
                        Got a question in the meantime? Call us and a real person picks up.
                    </p>
                    <p className='mt-2 text-lg'>
                        <a href={`tel:+1${tel}`} className='headingColor hover:opacity-80 transition font-semibold underline'>
                            {SHOP_CONFIG.shop_phone}
                        </a>
                    </p>
                    <p className='mt-1 text-sm'>
                        <a href={`mailto:${SHOP_CONFIG.shop_email}`} className='bodyColor hover:opacity-80 transition underline'>
                            {SHOP_CONFIG.shop_email}
                        </a>
                    </p>
                </div>
                <p className='mt-6 text-sm bodyColor text-center'>
                    Keep an eye on your email for the full breakdown.
                </p>
            </div>
            <div className='slide-nav nav-end'>
            </div>
        </>
    );
}
