/* Avya — shop categories, grouped into the sections shown on the home page and in the menu.
   Used by the designs when they run without the store API, and by tools/export-catalog.js to seed the backend
   (after that, categories are managed in Admin → Categories). */
const CATEGORY_LIST = [
  { slug: 'silver-pendant-sets', name: 'Pendant sets & necklaces', group: 'Silver Jewellery', kind: 'jewellery',
    description: 'Pendant sets and necklaces in 925 sterling silver, hallmarked and stamped.' },
  { slug: 'silver-earrings', name: 'Silver earrings', group: 'Silver Jewellery', kind: 'jewellery',
    description: 'Studs, drops and hoops in 925 sterling silver — easy to wear from morning to evening.' },
  { slug: 'silver-bracelets', name: 'Bracelets', group: 'Silver Jewellery', kind: 'jewellery',
    description: 'Silver bracelets for every day and every occasion.' },
  { slug: 'silver-rings', name: 'Rings', group: 'Silver Jewellery', kind: 'jewellery',
    description: 'Solitaires, halos and statement rings in 925 sterling silver. Canadian sizes 5 to 14.' },
  { slug: 'gold-earrings', name: 'Gold earrings', group: 'Gold Jewellery', kind: 'jewellery',
    description: 'Gold earrings for festive days and the moments worth remembering.' },
  { slug: 'mens-gold-chains', name: 'Gold chains', group: 'Gold Jewellery', kind: 'jewellery',
    description: 'Gold chains for men, in classic and everyday weights.' },
  { slug: 'gold-bars', name: 'Gold bars', group: 'Bullion', kind: 'bullion',
    description: '99.99% pure gold bars from RCM, PAMP and Valcambi, plus Lakshmi Diwali bars — 1 g to 100 g and 1 oz.' },
  { slug: 'gold-coins', name: 'Gold coins', group: 'Bullion', kind: 'bullion',
    description: '99.99% pure gold coins, sealed with the mint’s certificate.' },
  { slug: 'silver-bars', name: 'Silver bars', group: 'Bullion', kind: 'bullion',
    description: 'Royal Canadian Mint 99.99% pure silver bars in 1 kg and 100 oz.' },
  { slug: 'silver-coins', name: 'Silver coins', group: 'Bullion', kind: 'bullion',
    description: '99.99% pure silver coins — 1 oz, and 5 g and 10 g Lakshmi Ganpati coins.' },
  { slug: 'silver-bowls', name: 'Silver bowls', group: 'Silver Utensils', kind: 'jewellery',
    description: 'Pure silver bowls for gifting, ceremonies and first feeds.' },
  { slug: 'silver-spoons', name: 'Silver spoons', group: 'Silver Utensils', kind: 'jewellery',
    description: 'Silver spoons — a classic gift for a new arrival.' },
  { slug: 'kids-nazariya', name: 'Nazariya', group: 'Kids', kind: 'jewellery',
    description: 'Traditional nazariya bracelets for little ones — a blessing to wear.' },
  { slug: 'kids-kada', name: 'Kada', group: 'Kids', kind: 'jewellery',
    description: 'Silver kada for babies and children.' }
];
