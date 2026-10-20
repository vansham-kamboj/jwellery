/* Avya — catalogue and static content. */
const IMG = {
  diamond: '../assets/web/diamond-hoops.jpg',
  hoops: '../assets/web/gold-hoops.jpg',
  signet: '../assets/web/signet.jpg',
  flatlay: '../assets/web/flatlay.jpg',
  model: '../assets/web/model-chains.jpg',
  gift: '../assets/web/gift-bracelet.jpg'
};
const BRAND = { logo: '../assets/brand/avya-logo.png', bars: '../assets/brand/gold-bars.webp' };

/* Gold bars & coins shown on the homepage — filled in catalog-real.js. */
const GOLD = { featured: [] };

/* Which photo fills each named image slot. Slots not listed (maps) keep their placeholder. */
const LABEL_IMG = {
  'model portrait — hoops + layered chains': IMG.model, 'ring stack, macro': IMG.signet, 'pendant on linen': IMG.flatlay,
  'earrings on model': IMG.diamond, 'layered necklaces': IMG.model, 'stacked rings': IMG.flatlay, 'bracelets on wrist': IMG.gift, 'gift box, ribbon': IMG.hoops,
  'studio — hand-polishing a hoop': IMG.hoops,
  'hoops, mirror selfie': IMG.hoops, 'ring stack, coffee': IMG.signet, 'layered chains': IMG.model, 'ear party': IMG.diamond, 'cuff, beach': IMG.gift, 'pendant, sweater': IMG.flatlay,
  'category banner — All': IMG.gift, 'category banner — Earrings': IMG.diamond, 'category banner — Necklaces': IMG.model,
  'category banner — Rings': IMG.signet, 'category banner — Bracelets': IMG.gift,
  'initial signet': IMG.signet, 'birthstone stack': IMG.flatlay, 'heirloom rework': IMG.diamond,
  'studio bench, warm lamp': IMG.flatlay, 'founders portrait': IMG.model, 'storefront, Queen W': IMG.gift
};
const SW = { gold: '#d9b56a', silver: '#cfd3e5', rose: '#d8a08f' };
const FINISH_OF = { gold: 'Gold vermeil', silver: 'Sterling silver', rose: 'Rose vermeil' };

const PRODUCTS = [
  { id: 'halo', img: IMG.hoops, img2: IMG.diamond, name: 'Halo Hoops', cat: 'Earrings', fin: 'gold', material: '18k gold vermeil', price: 68, ph: 'gold hoops', tag: 'Bestseller', rating: '4.9', reviews: 312, sw: ['gold', 'silver', 'rose'],
    desc: 'Slim hollow hoops with a hidden hinge that clicks shut. Light enough to forget — sleep, shower and swim friendly.' },
  { id: 'fil', img: IMG.model, img2: IMG.flatlay, name: 'Fil Chain', cat: 'Necklaces', fin: 'silver', material: 'Sterling silver', price: 82, ph: 'fine chain', rating: '4.8', reviews: 204, sw: ['silver', 'gold'],
    desc: 'A whisper-fine cable chain with an adjustable length. The layering base everything else sits on.' },
  { id: 'tide', img: IMG.signet, img2: IMG.flatlay, name: 'Tide Signet', cat: 'Rings', fin: 'gold', material: '18k gold vermeil', price: 94, ph: 'signet ring', tag: 'Engravable', rating: '4.9', reviews: 168, sw: ['gold', 'silver'],
    desc: 'A softly domed oval signet, ready for up to three engraved initials at no extra cost.' },
  { id: 'pebble', img: IMG.diamond, img2: IMG.hoops, name: 'Pebble Studs', cat: 'Earrings', fin: 'silver', material: 'Sterling silver', price: 42, ph: 'stud earrings', rating: '4.7', reviews: 141, sw: ['silver', 'gold'],
    desc: 'Organic, hand-shaped studs that look like tiny river stones. Butterfly backs, nickel-free posts.' },
  { id: 'orbit', img: IMG.flatlay, img2: IMG.signet, name: 'Orbit Stacker', cat: 'Rings', fin: 'gold', material: '18k gold vermeil', price: 38, ph: 'stacking ring', rating: '4.8', reviews: 230, sw: ['gold', 'silver', 'rose'],
    desc: 'A 1.5 mm band made for stacking. Wear one, or wear five.' },
  { id: 'lumen', img: IMG.model, img2: IMG.flatlay, name: 'Lumen Pendant', cat: 'Necklaces', fin: 'gold', material: 'Vermeil, white topaz', price: 96, ph: 'drop pendant', tag: 'New', rating: '5.0', reviews: 58, sw: ['gold'],
    desc: 'A single white topaz in a bezel drop, on a fine chain that catches the light at the collarbone.' },
  { id: 'wren', img: IMG.gift, img2: IMG.flatlay, name: 'Wren Cuff', cat: 'Bracelets', fin: 'silver', material: 'Sterling silver', price: 110, ph: 'open cuff', rating: '4.8', reviews: 87, sw: ['silver', 'gold'],
    desc: 'A sculpted open cuff that adjusts gently to your wrist. Substantial without the weight.' },
  { id: 'seed', img: IMG.flatlay, img2: IMG.model, name: 'Seed Pearl Drops', cat: 'Earrings', fin: 'gold', material: 'Vermeil, freshwater pearl', price: 74, ph: 'pearl drops', rating: '4.9', reviews: 119, sw: ['gold'],
    desc: 'Tiny freshwater pearls on a vermeil drop. Each pearl is a little different — that’s the point.' },
  { id: 'tennis', img: IMG.gift, img2: IMG.diamond, name: 'Line Bracelet', cat: 'Bracelets', fin: 'gold', material: 'Vermeil, white topaz', price: 128, ph: 'tennis bracelet', rating: '4.9', reviews: 96, sw: ['gold', 'silver'],
    desc: 'A delicate line of white topaz with a secure box clasp. Everyday sparkle, no occasion required.' },
  { id: 'arc', img: IMG.diamond, img2: IMG.model, name: 'Arc Ear Cuff', cat: 'Earrings', fin: 'rose', material: 'Rose vermeil', price: 36, ph: 'ear cuff', tag: 'New', rating: '4.7', reviews: 64, sw: ['rose', 'gold', 'silver'],
    desc: 'No piercing needed. Slides onto the mid-ear and stays put.' },
  { id: 'knot', img: IMG.signet, img2: IMG.flatlay, name: 'Knot Ring', cat: 'Rings', fin: 'silver', material: 'Sterling silver', price: 54, ph: 'knot ring', rating: '4.8', reviews: 102, sw: ['silver', 'rose'],
    desc: 'A small hand-tied knot on a fine band — a quiet reminder, worn every day.' },
  { id: 'link', img: IMG.gift, img2: IMG.model, name: 'Paper Link Chain', cat: 'Bracelets', fin: 'gold', material: '18k gold vermeil', price: 88, ph: 'link bracelet', rating: '4.9', reviews: 133, sw: ['gold', 'silver'],
    desc: 'Flat, elongated links with a lobster clasp and a 2 cm extender.' }
];

const SIZES = {
  Earrings: { label: 'Diameter', opts: ['15 mm', '20 mm', '28 mm'], def: '20 mm' },
  Necklaces: { label: 'Length', opts: ['40 cm', '45 cm', '50 cm'], def: '45 cm' },
  Rings: { label: 'Ring size', opts: ['5', '6', '7', '8', '9'], def: '7' },
  Bracelets: { label: 'Wrist', opts: ['S', 'M', 'L'], def: 'M' }
};

const SHIP = [
  { id: 'std', name: 'Canada Post Standard', eta: '4–7 business days · free over $150', price: 12 },
  { id: 'exp', name: 'Canada Post Expedited', eta: '2–3 business days', price: 22 },
  { id: 'pick', name: 'Pick up at the studio', eta: 'Ready tomorrow · Queen St W', price: 0 }
];

const CATS = ['All', 'Earrings', 'Necklaces', 'Rings', 'Bracelets'];

const BLURB = {
  All: 'Fifty-odd small, solid pieces made to be worn every day — and layered, stacked and mixed.',
  Earrings: 'Hoops, studs and cuffs light enough to sleep in.',
  Necklaces: 'Fine chains and pendants built for layering.',
  Rings: 'Stackers and signets in CA/US sizes 4–10.',
  Bracelets: 'Cuffs and chains with secure, easy clasps.'
};

const CONTENT = {
  categories: [
    { name: 'Earrings', count: 18, ph: 'earrings on model', filter: 'Earrings' },
    { name: 'Necklaces', count: 12, ph: 'layered necklaces', filter: 'Necklaces' },
    { name: 'Rings', count: 15, ph: 'stacked rings', filter: 'Rings' },
    { name: 'Bracelets', count: 9, ph: 'bracelets on wrist', filter: 'Bracelets' },
    { name: 'Gifts under $100', count: 24, ph: 'gift box, ribbon', filter: 'All' }
  ],
  standards: [
    { n: '01', title: 'Five times the gold', body: '2.5 µm of 18k over sterling — the industry minimum is 0.5.' },
    { n: '02', title: 'Recycled, made locally', body: '100% recycled silver, cast and finished in Toronto.' },
    { n: '03', title: 'Replated for life', body: 'Send it back once a year, we restore it free.' }
  ],
  announce: ['Free insured shipping across Canada over $150', 'Lifetime replating', '60-day returns'],
  homeTabs: { All: ['halo', 'tide', 'lumen', 'seed'], Earrings: null, Rings: null, Necklaces: null },
  reviews: [
    { q: 'I haven’t taken the Halos off in eight months — showers, hot yoga, sleeping. Still bright gold.', n: 'Priya S.', i: 'PS', c: 'Vancouver, BC', p: 'Halo Hoops' },
    { q: 'Ordered a custom signet with my grandmother’s initials. The sketch came back in a day and it’s perfect.', n: 'Émilie R.', i: 'ÉR', c: 'Montréal, QC', p: 'Custom signet' },
    { q: 'Beautiful packaging, arrived in three days to Halifax. Already ordered the matching chain.', n: 'Jordan M.', i: 'JM', c: 'Halifax, NS', p: 'Fil Chain' }
  ],
  footerCols: [
    { h: 'Shop', links: [['New in', '#/shop'], ['Earrings', '#/shop/Earrings'], ['Rings', '#/shop/Rings'], ['Necklaces', '#/shop/Necklaces'], ['Gold bars & coins', '#/gold-bars']] },
    { h: 'Avya', links: [['Our story', '#/studio'], ['The studio', '#/studio'], ['Bespoke', '#/custom'], ['Book a fitting', '#/studio']] },
    { h: 'Help', links: [['Size guide', '#/product/tide'], ['Shipping & returns', '#/bag'], ['Care guide', '#/product/halo'], ['Contact', '#/studio']] }
  ],
  perks: [{ t: 'Free shipping', b: 'Over $150 CAD' }, { t: '60-day returns', b: 'Anywhere in Canada' }, { t: 'Replated for life', b: 'Once a year, free' }],
  accordions: [
    { title: 'Materials & care', body: '2.5 µm of 18k gold over recycled 925 sterling silver. Hypoallergenic and nickel-free. Wipe with the included cloth; keep perfume off the metal.' },
    { title: 'Shipping & returns', body: 'Free Canada Post Standard over $150 CAD, otherwise $12. Free 60-day returns and exchanges anywhere in Canada.' },
    { title: 'Lifetime replating', body: 'When the gold starts to soften, send it back. We replate it free once a year for as long as you own it.' }
  ],
  steps: [
    { n: '1', title: 'Share your idea', body: 'A few words and any reference photos.' },
    { n: '2', title: 'Sketch & quote', body: 'Within 2 business days, no obligation.' },
    { n: '3', title: 'Approve & pay', body: '50% deposit, the rest on completion.' },
    { n: '4', title: 'Made in Toronto', body: 'Ready in 2–3 weeks, shipped insured.' }
  ],
  commissions: [{ ph: 'initial signet', t: 'Initial signet · $210' }, { ph: 'birthstone stack', t: 'Birthstone stack · $165' }, { ph: 'heirloom rework', t: 'Heirloom rework · $340' }],
  timeline: [{ y: '2019', b: 'First hoops, Parkdale kitchen' }, { y: '2022', b: 'Studio opens on Queen W' }, { y: '40k+', b: 'Pieces shipped across Canada' }],
  hours: [{ d: 'Tue – Fri', t: '11 – 7' }, { d: 'Saturday', t: '10 – 6' }, { d: 'Sunday', t: '12 – 5' }, { d: 'Monday', t: 'Closed' }],
  days: [['Thu', '8'], ['Fri', '9'], ['Sat', '10'], ['Sun', '11']],
  dayFull: { Thu: 'Thursday, Oct 8', Fri: 'Friday, Oct 9', Sat: 'Saturday, Oct 10', Sun: 'Sunday, Oct 11' },
  slotTimes: ['10:00', '10:30', '11:00', '12:30', '1:00', '2:30', '3:00', '4:30'],
  takenBy: { Thu: ['11:00', '2:30'], Fri: ['10:00', '12:30', '4:30'], Sat: ['10:30', '1:00', '3:00'], Sun: ['10:00', '10:30', '11:00'] }
};
