/* Turns the client's product sheet (Excel) into backend/database/seeders/data/product-sheet.json,
   which ProductSheetSeeder loads into the store. Run it again whenever the client sends an updated sheet:

     node tools/product-sheet.js "C:/path/Avya Jewels Products.xlsx"

   Needs no packages: the .xlsx is unzipped with the system's tar (Windows 10+, macOS, Linux). */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const src = process.argv[2];
if (!src || !fs.existsSync(src)) { console.error('Usage: node tools/product-sheet.js <sheet.xlsx>'); process.exit(1); }
const out = path.join(__dirname, '..', 'backend', 'database', 'seeders', 'data', 'product-sheet.json');

/* ── Read every tab as rows of { header: value } ── */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'avya-sheet-'));
execFileSync('tar', ['-xf', path.resolve(src), '-C', tmp]);
const read = f => fs.readFileSync(path.join(tmp, f), 'utf8');
const dec = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const strings = [...read('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)]
  .map(m => dec([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(t => t[1]).join('')));
const tabs = [...read('xl/workbook.xml').matchAll(/<sheet [^>]*name="([^"]+)"/g)].map((m, i) => {
  const rows = [...read(`xl/worksheets/sheet${i + 1}.xml`).matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map(r => {
    const cells = {};
    for (const c of r[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const v = (c[3] || '').match(/<v>([\s\S]*?)<\/v>/), inline = (c[3] || '').match(/<t[^>]*>([\s\S]*?)<\/t>/);
      const val = /t="s"/.test(c[2]) && v ? strings[+v[1]] : v ? dec(v[1]) : inline ? dec(inline[1]) : '';
      if (val.trim()) cells[c[1]] = val.replace(/\s+/g, ' ').trim();
    }
    return cells;
  }).filter(r => Object.keys(r).length);
  const head = rows.shift() || {};
  return { name: dec(m[1]), rows: rows.map(r => Object.fromEntries(Object.entries(r).map(([col, v]) => [head[col] || col, v]))) };
});
fs.rmSync(tmp, { recursive: true, force: true });

/* ── Helpers ── */
const num = v => { const n = parseFloat(String(v || '').replace(/[^0-9.]/g, '')); return Number.isFinite(n) ? n : null; };
const OZ = 31.1035;
const slug = s => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const no = sku => String(parseInt(sku.split('-').pop(), 10));
const stockOf = r => {
  const raw = String(r['Stock quantity'] || '').trim();
  if (/coming soon/i.test(raw)) return { stock_qty: 0, in_stock: false, tag: 'Coming soon' };
  const n = num(raw);
  return n === null ? { stock_qty: null, in_stock: true, tag: null } : { stock_qty: Math.round(n), in_stock: n > 0, tag: null };
};
const priceOf = r => num(r['Price (CAD)']);
const weightOf = r => num(r['Weight Gm']);

/* ── Jewellery: the sheet gives generic names, so each piece is numbered; descriptions are written per type ── */
const JEWELLERY = {
  'Woman Rings': {
    category: 'silver-rings', name: r => `Silver Ring No. ${no(r.SKU)}`,
    sizes: r => { const s = String(r['Size / dimensions'] || ''); const size = (s.match(/[\d.]+/) || [])[0]; return size ? { label: 'Ring size', size, adjustable: /adjust/i.test(s) } : null; },
    desc: (r, sz) => `A 925 sterling silver ring, hallmarked and stamped${sz ? ` — Canadian size ${sz.size}${sz.adjustable ? ', adjustable' : ''}` : ''}. Elegant on its own, lovely stacked, and made to be worn every day.`
  },
  Bracelets: {
    category: 'silver-bracelets', name: r => `Silver Bracelet No. ${no(r.SKU)}`,
    desc: () => 'A 925 sterling silver bracelet, hallmarked and stamped — easy to wear from morning to evening, and a thoughtful gift.'
  },
  'Kids Kada': {
    category: 'kids-kada', name: r => `Kids Silver Kada No. ${no(r.SKU)}`,
    desc: () => 'A 925 sterling silver kada for little ones. A traditional blessing to wear, and a keepsake to treasure.'   // the weight is a separate field the admin can show or hide
  },
  'Kids Nazariya': {
    category: 'kids-nazariya', name: () => 'Kids Silver Nazariya',
    desc: () => 'A traditional nazariya bracelet in 925 sterling silver with protective evil-eye beads — a blessing for little ones, and a favourite gift for a new arrival.'
  }
};
const CARE_SILVER = 'Store in its pouch, away from air and moisture. Wipe gently with a soft cloth; keep away from perfume, chlorine and salt water.';

/* ── Bullion: names come straight from the sheet; brand and design are read from the name ── */
const BRANDS = [[/pamp/i, 'PAMP Suisse'], [/valcambi/i, 'Valcambi Suisse'], [/\brcm\b|maple/i, 'Royal Canadian Mint'], [/\bbmo\b/i, 'BMO'],
  [/kookaburra|kangaroo|koala/i, 'The Perth Mint'], [/britannia/i, 'The Royal Mint']];
const DESIGNS = [[/lady fortuna/i, 'Lady Fortuna'], [/laxmi ganpati/i, 'Laxmi Ganpati'], [/laxmi/i, 'Goddess Laxmi'], [/diwali/i, 'Diwali'],
  [/ultra high relief/i, 'Ultra High Relief Maple Leaf'], [/maplegram/i, 'Maplegram'], [/maple leaf/i, 'Maple Leaf'], [/kookaburra/i, 'Kookaburra'],
  [/kangaroo/i, 'Kangaroo'], [/koala/i, 'Koala'], [/britannia/i, 'Britannia']];
const pick = (list, s) => (list.find(([re]) => re.test(s)) || [])[1] || null;
const tidyName = s => s.replace(/\s*-\s*/g, ' – ').replace(/\bGOLD MAPLE LEAF Coin\b/, 'Gold Maple Leaf Coin').replace(/\bcoin\b/, 'Coin').replace(/\bOZ\b/g, 'oz').replace(/\bKG\b/g, 'kg').replace(/\s+/g, ' ').trim();
const weightLabel = g => g >= 1000 && g % 1000 === 0 ? `${g / 1000} kg` : Math.abs(g - OZ) < 0.1 ? '1 oz' : Math.abs(g - 100 * OZ) < 1 ? '100 oz' : `${g} g`;

const products = [];
let order = 0;
for (const tab of tabs) {
  const kind = JEWELLERY[tab.name];
  for (const r of tab.rows) {
    if (!/^AVY-/i.test(r.SKU || '')) continue;   // section headings such as "GOLD BAR"
    const base = { sku: r.SKU.toUpperCase(), sort_order: order++, ...stockOf(r), photos: String(r['Photo filename'] || r['Photo filename/File Series'] || '') };
    if (kind) {
      const sz = kind.sizes ? kind.sizes(r) : null;
      products.push({ ...base, kind: 'jewellery', category: kind.category, name: kind.name(r), slug: slug(kind.name(r)),
        metal: 'silver', purity: '925', material: '925 sterling silver', finish: 'plainsilver', price: priceOf(r) || 0,
        weight_grams: weightOf(r), size: sz, description: kind.desc(r, sz), care: CARE_SILVER, brand: null, design: null, certificate: false });
      continue;
    }
    const name = tidyName(r['Product name']);
    const gold = /gold/i.test(tab.name + ' ' + name);
    const isBar = /bar/i.test(r['Product type'] || name);
    let grams = weightOf(r);
    if (!grams) grams = /1\s*kg/i.test(name) ? 1000 : /100\s*oz/i.test(name) ? 100 * OZ : /1\s*oz/i.test(name) ? OZ : null;
    if (grams && Math.abs(grams - 31.1) < 0.05) grams = OZ;   // the sheet rounds 1 oz to 31.1 g
    const brand = pick(BRANDS, name), design = pick(DESIGNS, name);
    const metalWord = gold ? 'gold' : 'silver';
    products.push({ ...base, kind: 'bullion', category: `${metalWord}-${isBar ? 'bars' : 'coins'}`, name, slug: slug(name),
      metal: metalWord, purity: '99.99', material: `99.99% pure ${metalWord}`, finish: gold ? 'finegold' : 'finesilver', price: priceOf(r) || 0,
      weight_grams: grams ? +grams.toFixed(4) : null, size: null, brand, design, certificate: /pamp|valcambi/i.test(name),
      description: `${name} — 99.99% pure ${metalWord}${brand ? ` from ${brand}` : ''}${/collectible/i.test(r['Product type'] || '') ? ', a collector’s coin' : ''}. ` +
        `${isBar ? 'Sealed as issued by the refiner' : 'In mint condition'}, for saving, investing and gifting.` + (base.tag ? ' Coming soon.' : ` Price follows the live ${metalWord} market — we confirm today’s price on WhatsApp.`),
      care: 'Keep in its original sealed packaging or capsule, and handle by the edges.' });
  }
}

const slugs = new Set();
for (const p of products) { if (slugs.has(p.slug)) p.slug += '-' + p.sku.toLowerCase(); slugs.add(p.slug); }

fs.writeFileSync(out, JSON.stringify({ source: path.basename(src), generated: new Date().toISOString().slice(0, 10), products }, null, 1) + '\n');
const count = products.reduce((m, p) => (m[p.category] = (m[p.category] || 0) + 1, m), {});
console.log(`${products.length} products written to ${path.relative(process.cwd(), out)}`, count);
