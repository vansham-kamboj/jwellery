/* Avya — real inventory photographed in assets/images (web crops in assets/web/products).
   PRICES ARE PLACEHOLDERS until the admin panel sets them. Bullion is priced from METAL rates below. */
const PIMG = slug => 'assets/web/products/' + slug + '.jpg';
const PFULL = slug => 'assets/web/products/' + slug + '-full.jpg';
const PVID = slug => 'assets/web/products/' + slug + '.mp4';

/* Placeholder CAD rates per gram — replace with the live rate (admin setting). */
const METAL = { gold: { ratePerGram: 152, label: '999.9 fine gold' }, silver: { ratePerGram: 1.95, label: '999 fine silver' } };
const OZ = 31.1035;

const CARE = {
  silver: 'Silver set with cubic zirconia. Store in the pouch provided, wipe with a soft polishing cloth, and keep away from perfume, chlorine and salt water.',
  bullion: 'Supplied sealed in its original mint packaging with assay certificate. Investment-grade gold and silver is HST-exempt in Canada. Shipped fully insured, signature required.'
};

const RING_SIZES = { label: 'Ring size', opts: ['5', '6', '7', '8', '9'], def: '7' };

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
  img: PIMG(slug), img2: PFULL(slug), gallery: [PIMG(slug), PFULL(slug)], video: video ? PVID(slug) : null,
  fin: 'plainsilver', sw: ['plainsilver'], material: 'Silver · cubic zirconia', care: CARE.silver,
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
  img: PIMG(slug), img2: PFULL(slug), gallery: [PIMG(slug), PFULL(slug)], video: null,
  fin: 'fine' + metal, sw: ['fine' + metal], material: METAL[metal].label, care: CARE.bullion,
  tag: '', sizes: false, rating: null, reviews: 0, taxExempt: true
}));

/* Real pieces go first, ahead of the sample catalogue. */
PRODUCTS.unshift(...REAL_JEWELLERY, ...REAL_BULLION);
SW.finegold = '#d4af37'; SW.finesilver = '#c9ccd3'; SW.plainsilver = '#cfd3e5';
FINISH_OF.finegold = '999.9 fine gold'; FINISH_OF.finesilver = 'Fine silver'; FINISH_OF.plainsilver = 'Silver';
CATS.push('Bullion');
BLURB.Bullion = 'Royal Canadian Mint coins and bars in gold and silver — sealed, serial-numbered and HST-exempt.';
BLURB.Rings = 'Statement pieces, solitaires and stackers — sizes 5 to 9.';

/* Homepage: feature real pieces. */
GOLD.featured = ['diwali-10g-gold-bars', 'maple-leaf-1oz-coin', 'rcm-1oz-gold-bar', 'rcm-100g-gold-bar'];
CONTENT.homeTabs.All = ['cluster-halo-ring', 'emerald-halo-studs', 'pink-oval-ring', 'bezel-eternity-band'];
CONTENT.categories = [
  { name: 'Rings', ph: 'stacked rings', filter: 'Rings' },
  { name: 'Earrings', ph: 'earrings on model', filter: 'Earrings' },
  { name: 'Necklaces', ph: 'layered necklaces', filter: 'Necklaces' },
  { name: 'Bracelets', ph: 'bracelets on wrist', filter: 'Bracelets' },
  { name: 'Gold & silver bullion', ph: 'bullion', filter: 'Bullion' }
];
Object.assign(LABEL_IMG, {
  'stacked rings': PIMG('cluster-halo-ring'),
  'bullion': PIMG('maple-leaf-1oz-coin'),
  'category banner — Rings': PIMG('pear-crown-ring'),
  'category banner — Bullion': PIMG('rcm-100g-gold-bar')
});
