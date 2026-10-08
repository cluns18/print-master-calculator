// PrintMaster's three shops. The quote step asks which one the customer will pick up
// from and the lead email goes to that shop's inbox, the same routing the quote form
// uses (cluns18/print-master-quote-request, src/config/locations.js).
//
// Inboxes and phones are Kevin's, emailed 2026-10-01 (msg 1a0f8a7fe68e8783):
// Norfolk tees@, North Attleborough sales@, Norwood office@. Never use
// kevin.printmaster@gmail.com, Kevin does not read it.
export const LOCATIONS = [
    {
        id: 'norwood',
        name: 'Norwood',
        address: '89 Access Road, Ste 17',
        cityLine: 'Norwood, MA 02062',
        phone: '(781) 769-6656',
        email: 'office@printmasteronline.com',
    },
    {
        id: 'norfolk',
        name: 'Norfolk',
        address: '227 Dedham Street',
        cityLine: 'Norfolk, MA 02056',
        phone: '(774) 847-9386',
        email: 'tees@printmasteronline.com',
    },
    {
        id: 'north-attleborough',
        name: 'North Attleborough',
        address: '6 East St',
        cityLine: 'North Attleborough, MA 02760',
        phone: '(508) 947-5200',
        email: 'sales@printmasteronline.com',
    },
];
