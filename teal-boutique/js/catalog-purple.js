/* Avya — lavender studio photography (assets/purple → assets/web/purple).
   Loaded only by the purple designs (ivory-editorial, teal-boutique), after catalog-real.js.
   New-piece NAMES AND PRICES ARE PLACEHOLDERS until the owner confirms them. */
const PUR = n => '../assets/web/purple/ring-' + n + '.jpg';          // close crop, 4:5
const PUR_FULL = n => '../assets/web/purple/ring-' + n + '-full.jpg'; // whole styled scene

/* Pieces already in the catalogue → their lavender studio shots (first = main image). */
const PURPLE_SHOTS = {
  'bypass-pave-ring': ['02'],
  'midnight-open-ring': ['08'],
  'swirl-solitaire-ring': ['14', '23'],
  'wing-ring': ['18', '20'],
  'crossover-statement-ring': ['12'],
  'ruby-red-statement-ring': ['16']
};
Object.entries(PURPLE_SHOTS).forEach(([id, shots]) => {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  const studio = shots.map(PUR);
  p.img = studio[0];
  p.gallery = p.video ? [...studio, PUR_FULL(shots[0])].slice(0, 2) : [...studio, PUR_FULL(shots[0]), p.img2].slice(0, 3);
});

/* New pieces photographed in the lavender studio — [shot, slug, name, price, tone, description] */
SW.rosetone = '#D9A28F';
FINISH_OF.rosetone = 'Rose gold tone';
const PURPLE_NEW = [
  ['17', 'starflower-ring', 'Starflower Ring', 112, 'rose', 'Marquise and pear stones open like a flower around a round centre, on a pavé band.'],
  ['13', 'floral-halo-ring', 'Floral Halo Ring', 108, 'rose', 'A round centre stone in a halo, with leaves of pavé winding along both shoulders.'],
  ['22', 'ribbon-solitaire-ring', 'Ribbon Solitaire Ring', 96, 'rose', 'A round solitaire held where two pavé ribbons cross.'],
  ['21', 'ivy-halo-band', 'Ivy Halo Ring', 106, 'rose', 'A haloed centre stone on a band of trailing pavé ivy.'],
  ['15', 'laurel-halo-ring', 'Laurel Halo Ring', 104, 'rose', 'A soft halo framed by laurel leaves set with tiny stones.'],
  ['04', 'pear-laurel-ring', 'Pear Laurel Ring', 98, 'rose', 'A pear-cut centre stone crowned with a wreath of pavé leaves.'],
  ['07', 'pear-branch-ring', 'Pear Branch Ring', 96, 'rose', 'A pear-cut stone resting on two slender pavé branches.'],
  ['03', 'laurel-solitaire-ring', 'Laurel Solitaire Ring', 92, 'rose', 'A round solitaire with marquise leaves rising on either side.'],
  ['05', 'willow-halo-ring', 'Willow Halo Ring', 94, 'rose', 'A round centre stone between sweeping willow-leaf shoulders.'],
  ['10', 'garden-cluster-ring', 'Garden Cluster Ring', 102, 'rose', 'A round cluster set among pavé leaves on a split band.'],
  ['19', 'fern-solitaire-ring', 'Fern Solitaire Ring', 90, 'rose', 'A round solitaire on a band that unfurls into pavé fern leaves.'],
  ['06', 'vine-twist-ring', 'Vine Twist Ring', 88, 'rose', 'A twisting pavé vine that wraps a single round stone.'],
  ['09', 'leaf-spray-ring', 'Leaf Spray Ring', 84, 'rose', 'An asymmetric spray of marquise leaves beside a round stone.'],
  ['01', 'twin-pear-wrap-ring', 'Twin Pear Wrap Ring', 86, 'silver', 'Two haloed pear motifs, one with baguettes, wrapping a polished open band.'],
  ['11', 'orbit-pear-ring', 'Orbit Pear Ring', 72, 'silver', 'A pavé circle with a round stone and a small pear accent, on a slim band.']
].map(([shot, id, name, price, tone, desc]) => ({
  id, real: true, purple: true, name, cat: 'Rings', price, tag: 'New', desc,
  img: PUR(shot), img2: PUR_FULL(shot), gallery: [PUR(shot), PUR_FULL(shot)], video: null,
  fin: tone === 'rose' ? 'rosetone' : 'plainsilver', sw: [tone === 'rose' ? 'rosetone' : 'plainsilver'],
  material: (tone === 'rose' ? 'Rose gold tone' : 'Silver') + ' · cubic zirconia', care: CARE.silver,
  sizes: RING_SIZES, rating: null, reviews: 0,
  perks: JEWELLERY_PERKS, accordions: JEWELLERY_DETAILS
}));
PRODUCTS.unshift(...PURPLE_NEW);

/* Scene shots the designs use for heroes and banners. */
const PURPLE_SCENES = { hero: PUR_FULL('17'), heroAlt: PUR_FULL('13'), rings: PUR_FULL('21'), statement: PUR_FULL('16'), everyday: PUR_FULL('22'), wing: PUR_FULL('18') };
