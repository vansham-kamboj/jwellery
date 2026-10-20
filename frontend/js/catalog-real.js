/* Avya — real inventory photographed in assets/images (web crops in assets/web/products).
   PRICES ARE PLACEHOLDERS until the admin panel sets them. Bullion is priced from METAL rates below. */
const PIMG = slug => '../assets/web/products/' + slug + '.jpg';
const PFULL = slug => '../assets/web/products/' + slug + '-full.jpg';
const PVID = slug => '../assets/web/products/' + slug + '.mp4';
const PCUT = slug => '../assets/web/products/' + slug + '-cut-cream.jpg';   // piece on the lavender studio backdrop
const gallery = (slug, video) => video ? [PCUT(slug), PIMG(slug)] : [PCUT(slug), PIMG(slug), PFULL(slug)];

/* Placeholder CAD rates per gram — replace with the live rate (admin setting). */
const METAL = { gold: { ratePerGram: 152, label: '99.99% fine gold' }, silver: { ratePerGram: 1.95, label: '99.99% fine silver' },
  updated: 'Oct 16, 10:30 a.m. ET', example: true };   // example rate — the admin panel will set the live one
const QUOTE_ABOVE = 2500;   // bullion over this value is reserved and price-confirmed by the team
const OZ = 31.1035;

const CARE = {
  silver: '925 sterling silver, hallmarked and stamped. Care instructions come with every piece: keep it in its pouch, wipe it with a soft polishing cloth, and keep it away from perfume, chlorine and salt water.',
  bullion: 'Sealed in its original packaging, with the manufacturer’s serial number and assay certificate where applicable. 99.99% pure. Investment-grade gold and silver carries no sales tax in Canada.'
};

const RING_SIZES = { label: 'Ring size', opts: ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14'], def: '7' };

/* Jewellery — [slug, name, category, price, tag, description, hasVideo] */
const REAL_JEWELLERY = [
  ['cluster-halo-ring', 'Cluster Halo Ring', 'Rings', 96, 'New', 'A round centre stone in a halo, set high on a wide band of pavé and marquise-cut stones.'],
  ['emerald-halo-studs', 'Emerald Halo Studs', 'Earrings', 58, 'New', 'Square green-stone studs framed in a fine halo of sparkle. Push backs, everyday size.', true],
  ['pink-oval-ring', 'Blush Oval Ring', 'Rings', 78, 'New', 'A pink cushion-cut centre stone on a sweeping pavé shank.'],
  ['bezel-eternity-band', 'Bezel Eternity Band', 'Rings', 68, '', 'Round stones in polished bezels all the way around — stacks beautifully.', true],
  ['heart-solitaire-ring', 'Heart Solitaire Ring', 'Rings', 72, '', 'A heart-cut solitaire on a slim, softly tapered band.'],
  ['ruby-red-statement-ring', 'Scarlet Statement Ring', 'Rings', 98, 'Statement', 'A bold red centre stone with baguette shoulders and red enamel detail.'],
  ['pear-crown-ring', 'Pear Crown Ring', 'Rings', 84, '', 'A pear-cut solitaire paired with a matching pavé band for a bridal-set look.'],
  ['bypass-pave-ring', 'Bypass Pear Ring', 'Rings', 88, '', 'Two pavé pear motifs crossing over a chain-link shank.'],
  ['crossover-statement-ring', 'Crossover Statement Ring', 'Rings', 92, '', 'Ribbed wrap bands finished with pavé bars — big presence, comfortable fit.'],
  ['aria-open-ring', 'Aria Open Ring', 'Rings', 64, '', 'An open double band tipped with two pear-cut stones and a line of pavé.'],
  ['square-pave-band', 'Square Pavé Ring', 'Rings', 48, '', 'A slim polished band with a square of nine pavé stones at the centre.'],
  ['twist-wave-band', 'Twist Wave Ring', 'Rings', 52, '', 'An open, wave-shaped twist with a pavé centre.'],
  ['infinity-bow-ring', 'Infinity Bow Ring', 'Rings', 54, '', 'An infinity loop finished with a pavé heart — a small, sweet everyday ring.'],
  ['twist-solitaire-ring', 'Twist Solitaire Ring', 'Rings', 66, '', 'A round solitaire held in a twisting pavé band.'],
  ['geo-link-ring', 'Geo Link Ring', 'Rings', 62, '', 'Open rectangular links outlined in pavé for a modern, architectural look.'],
  ['baguette-trio-band', 'Baguette Trio Band', 'Rings', 58, '', 'Three baguette stones spaced along a fine pavé band.', true],
  ['wing-ring', 'Wing Wrap Ring', 'Rings', 56, '', 'Two pavé chevrons that wrap the finger like folded wings.', true],
  ['swirl-solitaire-ring', 'Swirl Halo Ring', 'Rings', 58, '', 'A round stone circled by a swirl of pavé, on a slim open band.', true],
  ['midnight-open-ring', 'Moonrise Open Ring', 'Rings', 54, '', 'An open band with a pavé circle and a single round stone.', true]
].map(([slug, name, cat, price, tag, desc, video]) => ({
  id: slug, real: true, name, cat, price, tag, desc,
  img: PCUT(slug), img2: PIMG(slug), gallery: gallery(slug, video), video: video ? PVID(slug) : null,
  fin: 'plainsilver', sw: ['plainsilver'], material: '925 sterling silver', care: CARE.silver,
  sizes: cat === 'Rings' ? RING_SIZES : false, rating: null, reviews: 0
}));

/* Bullion — [slug, name, metal, grams, premium, short label, description] */
const REAL_BULLION = [
  ['maple-leaf-1oz-coin', 'Gold Maple Leaf · 1 oz', 'gold', OZ, .05, '1 oz coin', 'Royal Canadian Mint 1 oz Gold Maple Leaf in a sealed assay card — single-mine gold from Newmont Éléonore, Québec.'],
  ['rcm-1oz-gold-bar', 'RCM Gold Bar · 1 oz', 'gold', OZ, .04, '1 oz bar', 'Royal Canadian Mint 1 oz 99.99% fine gold bar, serial-numbered and sealed in its original assay.'],
  ['rcm-100g-gold-bar', 'RCM Gold Bar · 100 g', 'gold', 100, .03, '100 g bar', 'Royal Canadian Mint 100 g 99.99% fine gold bar, serial-numbered in original packaging.'],
  ['diwali-10g-gold-bars', 'RCM Diwali Gold Bar · 10 g', 'gold', 10, .06, '10 g Diwali', 'Royal Canadian Mint Diwali 10 g fine gold bar in a festive card — a traditional gift for the Festival of Lights.'],
  ['diwali-lakshmi-gold-bar', 'Diwali Lakshmi Gold Bar', 'gold', 10, .06, 'Lakshmi bar', 'A Lakshmi gold bar in a Diwali “Festival of Lights” card. Weight shown as 10 g — please confirm before ordering.'],
  ['bmo-gold-bar', 'BMO Gold Bar', 'gold', OZ, .04, 'BMO bar', 'BMO Capital Markets fine gold bar, sealed. Weight shown as 1 oz — please confirm before ordering.'],
  ['rcm-1kg-silver-bars', 'RCM Silver Bar · 1 kg', 'silver', 1000, .08, '1 kg silver', 'Royal Canadian Mint 1 kilo 99.9% fine silver bar, serial-numbered.'],
  ['rcm-100oz-silver-bar', 'RCM Silver Bar · 100 oz', 'silver', 100 * OZ, .06, '100 oz silver', 'Royal Canadian Mint 100 oz 99.99% fine silver bar, serial-numbered.']
].map(([slug, name, metal, grams, premium, short, desc]) => ({
  id: slug, real: true, bullion: true, name, short, cat: 'Bullion', metal, grams, premium, desc,
  price: Math.round(grams * METAL[metal].ratePerGram * (1 + premium)),
  img: PCUT(slug), img2: PIMG(slug), gallery: gallery(slug), video: null, confirmed: !/confirm before ordering/.test(desc),
  fin: 'fine' + metal, sw: ['fine' + metal], material: METAL[metal].label, care: CARE.bullion,
  tag: '', sizes: false, rating: null, reviews: 0, taxExempt: true
}));

/* Real pieces go first, ahead of the sample catalogue. */
/* Bars whose weight isn't confirmed stay off the site until the owner verifies them. */
PRODUCTS.unshift(...REAL_JEWELLERY, ...REAL_BULLION.filter(b => b.confirmed));
SW.finegold = '#d4af37'; SW.finesilver = '#c9ccd3'; SW.plainsilver = '#cfd3e5';
FINISH_OF.finegold = '999.9 fine gold'; FINISH_OF.finesilver = 'Fine silver'; FINISH_OF.plainsilver = 'Silver';
CATS.push('Bullion');
BLURB.Bullion = 'Royal Canadian Mint coins and bars in gold and silver — sealed, serial-numbered and HST-exempt.';
BLURB.Rings = 'Statement pieces, solitaires and stackers — sizes 5 to 9.';

/* Homepage content — EXAMPLE COPY until the owner supplies final wording. */
GOLD.featured = ['diwali-10g-gold-bars', 'maple-leaf-1oz-coin', 'rcm-1oz-gold-bar', 'rcm-100g-gold-bar'];
CONTENT.announce = ['Free insured shipping across Canada over $150', 'Royal Canadian Mint certified gold & silver', '30-day returns on jewellery'];
CONTENT.homeTabs = { All: ['cluster-halo-ring', 'pink-oval-ring', 'bezel-eternity-band', 'twist-solitaire-ring'], Rings: null, Earrings: null };
CONTENT.categories = [
  { name: 'Rings', img: PCUT('pear-crown-ring'), href: '#/shop/Rings' },
  { name: 'Earrings', img: PCUT('emerald-halo-studs'), href: '#/shop/Earrings' },
  { name: 'Gold bars', img: PCUT('rcm-100g-gold-bar'), href: '#/shop/Bullion' },
  { name: 'Gold coins', img: PCUT('maple-leaf-1oz-coin'), href: '#/product/maple-leaf-1oz-coin' },
  { name: 'Silver bars', img: PCUT('rcm-100oz-silver-bar'), href: '#/shop/Bullion' }
];
CONTENT.promises = [
  { title: 'Certified, never guessed', body: 'Every coin and bar comes from the Royal Canadian Mint, sealed in its assay with a serial number you can check.' },
  { title: 'Set and checked by hand', body: 'Each silver piece is inspected stone by stone and polished before it is boxed.' },
  { title: 'Insured to your door', body: 'Orders ship fully insured with signature on delivery, anywhere in Canada.' }
];
CONTENT.reviews = [
  { q: 'The Cluster Halo Ring catches the light from across the room. Sized perfectly and arrived in two days.', n: 'Priya S.', i: 'PS', c: 'Brampton, ON', p: 'Cluster Halo Ring' },
  { q: 'Bought a Gold Maple Leaf for my son’s first birthday. Sealed, certified, and the team called to confirm the price.', n: 'Daniel K.', i: 'DK', c: 'Calgary, AB', p: 'Gold Maple Leaf · 1 oz' },
  { q: 'The Diwali bar in its festive card was the gift of the evening. Already planning next year’s.', n: 'Anjali M.', i: 'AM', c: 'Surrey, BC', p: 'RCM Diwali Gold Bar · 10 g' }
];
CONTENT.footerCols = [
  { h: 'Shop', links: [['Rings', '#/shop/Rings'], ['Earrings', '#/shop/Earrings'], ['Gold & silver', '#/shop/Bullion'], ['Diwali gifts', '#/gift']] },
  { h: 'Avya', links: [['Our story', '#/studio'], ['Visit the studio', '#/studio'], ['Bespoke', '#/custom']] },
  { h: 'Help', links: [['Shipping & returns', '#/bag'], ['Ring size guide', '#/product/pear-crown-ring'], ['Care', '#/product/cluster-halo-ring'], ['Contact', '#/studio']] }
];
Object.assign(LABEL_IMG, {
  'category banner — Rings': PCUT('pear-crown-ring'),
  'category banner — Earrings': PCUT('emerald-halo-studs'),
  'category banner — Bullion': PCUT('rcm-100g-gold-bar'),
  'category banner — All': PCUT('cluster-halo-ring')
});

/* Product-page small print for the real pieces — EXAMPLE COPY. */
const JEWELLERY_PERKS = [{ t: '925 sterling silver', b: 'Hallmarked & stamped' }, { t: 'Free GTA delivery', b: 'On orders over $200' }, { t: 'Pick up', b: 'Mississauga, by appointment' }];
const BULLION_PERKS = [{ t: '99.99% pure', b: 'Serial-numbered' }, { t: 'No sales tax', b: 'Investment-grade' }, { t: 'We buy bullion', b: 'Sealed or purity-tested' }];
const JEWELLERY_DETAILS = [
  { title: 'Materials & care', body: '' },
  { title: 'Delivery & pick-up', body: 'Free home delivery across the GTA on orders over $200, usually within 3–5 days. Or pick up from us in Mississauga, Monday to Sunday, 11 am – 7 pm.' },
  { title: 'Returns', body: 'All sales are final — we don’t accept returns or exchanges. If anything isn’t right with your purchase, message us and we’ll do our best to help.' }
];
const BULLION_DETAILS = [
  { title: 'Certification & packaging', body: '' },
  { title: 'How pricing works', body: 'Gold and silver follow the live market, so we share today’s price on WhatsApp — usually within 15 to 30 minutes. Pay in full by e-Transfer or cash to confirm your order.' },
  { title: 'Delivery & pick-up', body: 'Free delivery across the GTA on orders over $200, or pick up from us in Mississauga. We don’t ship bullion outside the GTA yet.' },
  { title: 'Selling your gold or silver', body: 'We buy bullion in its sealed packaging. Uncarded bars and coins are welcome too — we test their purity first.' }
];
PRODUCTS.filter(p => p.real).forEach(p => {
  p.perks = p.bullion ? BULLION_PERKS : JEWELLERY_PERKS;
  p.accordions = p.bullion ? BULLION_DETAILS : JEWELLERY_DETAILS;
});
