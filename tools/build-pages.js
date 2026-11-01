/* Builds the crawlable pages of the website — plain HTML with real text — so that search engines, link scanners and
   company web filters (which read the page's HTML and do not run JavaScript) can see what Avya Jewels is:

     node tools/build-pages.js

   It writes frontend/<page>/index.html for each page below, the text shown while the store loads inside
   frontend/index.html, plus robots.txt and sitemap.xml at the project root.
   The shop itself (frontend/js/app.js) is unchanged; these pages link into it. Edit the business details or wording
   here, run the command again, and upload the changed files. */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const SITE = 'https://avyajewels.ca';
const B = {
  name: 'Avya Jewels',
  area: 'Mississauga, Ontario',
  phone: '+1 647-718-5454', phoneHref: '+16477185454',
  email: 'avyajewels0210@gmail.com',
  whatsapp: 'https://wa.me/16477185454',
  instagram: 'https://www.instagram.com/avyajewels.ca',
  hours: 'Monday to Sunday, 11 am to 7 pm, by appointment',
  updated: '2026-10-31'
};
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ── Pages ─────────────────────────────────────────────────────────────── */
const NAV = [
  ['Silver jewellery', '/silver-jewellery/'],
  ['Gold & silver bullion', '/gold-and-silver-bullion/'],
  ['Kids', '/kids/'],
  ['Our story', '/our-story/'],
  ['Contact', '/contact/']
];
const shopLink = (href, label) => `<a class="sp-btn" href="${href}">${esc(label)}</a>`;

const PAGES = [
  {
    slug: 'silver-jewellery', title: 'Silver Jewellery — Rings & Bracelets in 925 Sterling Silver', crumb: 'Silver jewellery',
    desc: '925 sterling silver rings and bracelets, hallmarked and stamped, from Avya Jewels in Mississauga, Ontario. Free home delivery across the GTA on orders over $200.',
    h1: 'Silver jewellery', lead: 'Rings and bracelets in 925 sterling silver, hallmarked and stamped — made to be worn every day and kept for a lifetime.',
    body: `
      <h2>What we have</h2>
      <p>Avya Jewels sells women’s silver jewellery in 925 sterling silver. Every piece is hallmarked and stamped, and each one is one of a kind, in its own Canadian size.</p>
      <ul class="sp-list">
        <li><a href="/#/shop/silver-rings">Woman rings</a> — solitaires, stackable bands and statement rings, in Canadian sizes.</li>
        <li><a href="/#/shop/silver-bracelets">Woman bracelets</a> — chain and bangle bracelets for every day and every occasion.</li>
      </ul>
      <h2>Care</h2>
      <p>Keep silver in its pouch, wipe it with a soft cloth, and keep it away from perfume, chlorine and salt water.</p>
      <p>${shopLink('/#/shop/silver-jewellery', 'Shop silver jewellery')}</p>`
  },
  {
    slug: 'gold-and-silver-bullion', title: 'Gold & Silver Bullion — Bars and Coins, 99.99% Pure', crumb: 'Gold & silver bullion',
    desc: '99.99% pure gold and silver bars and coins from the Royal Canadian Mint, PAMP, Valcambi and more, for saving, investing and gifting. Avya Jewels, Mississauga, Ontario.',
    h1: 'Gold & silver bullion', lead: '99.99% pure gold and silver bars and coins for saving, investing and gifting — sealed, with their stated weight and purity.',
    body: `
      <h2>Gold bars and coins</h2>
      <ul class="sp-list">
        <li><a href="/#/shop/gold-bars">Gold bars</a> from 1 g to 100 g and 1 oz — PAMP Suisse Lady Fortuna, Royal Canadian Mint, Valcambi, BMO and Diwali Laxmi bars.</li>
        <li><a href="/#/shop/gold-coins">Gold coins</a> — the Royal Canadian Mint Gold Maple Leaf (1 oz) and the 1 g Maplegram.</li>
      </ul>
      <h2>Silver bars and coins</h2>
      <ul class="sp-list">
        <li><a href="/#/shop/silver-coins">Silver coins</a> — 1 oz Maple Leaf, Australian Kookaburra, Kangaroo and Koala, Britannia and the Ultra High Relief Maple Leaf, with Laxmi Ganpati coins coming soon.</li>
        <li><a href="/#/shop/silver-bars">Silver bars</a> — Royal Canadian Mint 1 kg and 100 oz bars.</li>
      </ul>
      <h2>How pricing works</h2>
      <p>Bar and coin prices follow the live gold and silver market. Today’s gold and silver price in Canadian dollars is shown on the shop, and we confirm the exact price on WhatsApp before you order. Investment-grade gold and silver bullion carries no sales tax.</p>
      <p>${shopLink('/#/shop/bullion', 'Shop gold & silver bullion')}</p>`
  },
  {
    slug: 'kids', title: 'Kids’ Silver — Kada & Nazariya for Little Ones', crumb: 'Kids',
    desc: 'Silver kada and nazariya for babies and children from Avya Jewels in Mississauga, Ontario — a blessing to wear and a gift to keep.',
    h1: 'Kids’ silver', lead: 'Silver kada and nazariya for little ones — a blessing to wear and a gift to keep.',
    body: `
      <h2>What we have</h2>
      <ul class="sp-list">
        <li><a href="/#/shop/kids-kada">Kids’ kada</a> — solid 925 sterling silver kada for babies and children.</li>
        <li><a href="/#/shop/kids-nazariya">Nazariya</a> — a traditional nazariya bracelet in 925 sterling silver with protective evil-eye beads.</li>
      </ul>
      <p>They are a favourite gift for a new arrival, a naming ceremony or a first birthday.</p>
      <p>${shopLink('/#/shop/kids', 'Shop kids’ silver')}</p>`
  },
  {
    slug: 'our-story', title: 'Our Story — From India to Canada, a Journey of Passion', crumb: 'Our story',
    desc: 'Avya Jewels is a family jewellery business in Mississauga, Ontario, rooted in more than ten years of experience in gold and silver jewellery.',
    h1: 'From India to Canada, a journey of passion', lead: 'Avya means the first rays of the sun — the light that starts every new day.',
    body: `
      <p>Avya Jewels is rooted in more than ten years of experience in gold and silver jewellery. Our founder’s journey began in India with the support of her father, where she developed a deep appreciation for craftsmanship and for the memories each piece can hold.</p>
      <p>Today she is building a new chapter in Canada alongside her husband, bringing that experience and passion to Avya Jewels. As a family venture, we believe jewellery is more than a luxury — it is a celebration of love, milestones and moments to cherish.</p>
      <p>Every piece we choose is premium, elegant and affordable: 925 sterling silver jewellery, gold jewellery, and 99.99% pure gold and silver bars and coins for saving, investing and gifting.</p>
      <h2>Visit us</h2>
      <p>We welcome you in ${esc(B.area)} by appointment, or on a video call from anywhere. Message us to choose a time. ${esc(B.hours)}.</p>
      <p>${shopLink('/#/shop', 'Visit the shop')} <a class="sp-btn sp-ghost" href="/contact/">Contact us</a></p>`
  },
  {
    slug: 'delivery-payment-returns', title: 'Delivery, Payment & Returns', crumb: 'Delivery, payment & returns',
    desc: 'Free home delivery across the Greater Toronto Area on orders over $200, pick-up in Mississauga, payment by Interac e-Transfer, and our returns policy.',
    h1: 'Delivery, payment & returns', lead: 'How ordering, paying and delivery work at Avya Jewels.',
    body: `
      <h2 id="delivery">Delivery &amp; pick-up</h2>
      <p>Free home delivery across the Greater Toronto Area on orders over $200, usually within 3–5 days.</p>
      <p>Pick up from us in ${esc(B.area)} during opening hours (Monday to Sunday, 11 am to 7 pm).</p>
      <p>We don’t ship outside the GTA yet — it’s in our plans.</p>
      <h2 id="payment">Payment</h2>
      <p>Pay in full by Interac e-Transfer. After you place an order, we confirm it on WhatsApp within 15–30 minutes with payment details.</p>
      <p>Listed prices include all taxes. Investment-grade gold and silver bullion carries no sales tax.</p>
      <h2 id="bullion">Gold &amp; silver bullion</h2>
      <p>Bar and coin prices follow the live market, so we share today’s price on WhatsApp before you order.</p>
      <p>Bars and coins come sealed, with their stated weight and purity and an assay certificate where applicable.</p>
      <h2 id="returns">Returns &amp; exchanges</h2>
      <p>All sales are final — we don’t accept returns or exchanges.</p>
      <p>If you experience any issue with your purchase, please reach out. We’re happy to help, and we’ll do our best with any concern.</p>
      <h2 id="care">Care</h2>
      <p>Care instructions are included with every jewellery purchase. Keep silver in its pouch, wipe it with a soft cloth, and keep it away from perfume, chlorine and salt water.</p>`
  },
  {
    slug: 'privacy-policy', title: 'Privacy Policy', crumb: 'Privacy policy',
    desc: 'How Avya Jewels collects, uses and protects your information.',
    h1: 'Privacy policy', lead: 'Last updated: October 20, 2026.',
    body: `
      <p>At Avya Jewels, we respect your privacy. We collect the contact, delivery and order information needed to process purchases, answer enquiries and provide customer service.</p>
      <p>We do not sell your personal information. We share it only with service providers needed to operate our website and deliver orders, or where required by law.</p>
      <p>We use appropriate safeguards to protect your information and keep it only as long as necessary for these purposes or legal requirements.</p>
      <p>Promotional messages are sent only with your consent, and you can unsubscribe at any time.</p>
      <p>If you have any questions about this Privacy Policy, please <a href="/contact/">contact us</a>.</p>
      <p>Any updates to this policy will be posted on this page. Last updated: October 20, 2026.</p>`
  },
  {
    slug: 'contact', title: 'Contact & Visit Us', crumb: 'Contact',
    desc: 'Contact Avya Jewels in Mississauga, Ontario by WhatsApp, phone or email, and book a visit.',
    h1: 'Contact &amp; visit us', lead: 'We reply in 15–30 minutes.',
    body: `
      <div class="sp-card">
        <p><strong>${esc(B.name)}</strong><br>${esc(B.area)}</p>
        <p>WhatsApp and phone: <a href="tel:${B.phoneHref}">${esc(B.phone)}</a><br>
        Email: <a href="mailto:${B.email}">${esc(B.email)}</a><br>
        Instagram: <a href="${B.instagram}" rel="noopener">@avyajewels.ca</a></p>
        <p>Opening hours: ${esc(B.hours)}.</p>
      </div>
      <h2>Book a visit</h2>
      <p>We welcome you by appointment, or on a video call from anywhere. Message us on WhatsApp to choose a time.</p>
      <h2>Bridal &amp; bulk orders</h2>
      <p>Bridal sets, bridesmaid gifts and corporate or festive gifting in larger quantities — tell us what you need.</p>
      <p><a class="sp-btn" href="${B.whatsapp}" rel="noopener">Message us on WhatsApp</a> <a class="sp-btn sp-ghost" href="/delivery-payment-returns/">Delivery &amp; returns</a></p>`
  }
];

/* ── Shared pieces ─────────────────────────────────────────────────────── */
const jsonLd = () => JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'JewelryStore',
  name: B.name,
  url: SITE + '/',
  logo: SITE + '/assets/brand/avya-logo.png',
  image: SITE + '/assets/brand/avya-logo.png',
  description: '925 sterling silver jewellery and 99.99% pure gold and silver bars and coins, from a family jewellery business in Mississauga, Ontario.',
  telephone: B.phone,
  email: B.email,
  address: { '@type': 'PostalAddress', addressLocality: 'Mississauga', addressRegion: 'ON', addressCountry: 'CA' },
  areaServed: 'Greater Toronto Area',
  openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '11:00', closes: '19:00' }],
  sameAs: [B.instagram],
  currenciesAccepted: 'CAD',
  paymentAccepted: 'Interac e-Transfer'
}, null, 2);

const header = () => `<header class="sp-head">
    <a class="sp-logo" href="/" aria-label="Avya Jewels home"><img src="/assets/brand/avya-logo.png?v=20261102" alt="Avya Jewels" width="112" height="46"></a>
    <nav class="sp-nav" aria-label="Main">${NAV.map(([l, h]) => `<a href="${h}">${esc(l)}</a>`).join('')}<a class="sp-shop" href="/#/shop">Shop</a></nav>
  </header>`;

const footer = () => `<footer class="sp-foot">
    <div class="sp-foot-grid">
      <div><strong>${esc(B.name)}</strong><p>925 sterling silver jewellery and 99.99% pure gold and silver bars and coins, from our family in ${esc(B.area)}.</p></div>
      <div><strong>Shop</strong>${NAV.slice(0, 3).map(([l, h]) => `<a href="${h}">${esc(l)}</a>`).join('')}</div>
      <div><strong>Help</strong><a href="/delivery-payment-returns/">Delivery, payment &amp; returns</a><a href="/privacy-policy/">Privacy policy</a><a href="/our-story/">Our story</a><a href="/contact/">Contact</a></div>
      <div><strong>Contact</strong><a href="tel:${B.phoneHref}">${esc(B.phone)}</a><a href="mailto:${B.email}">${esc(B.email)}</a><span>${esc(B.hours)}</span></div>
    </div>
    <p class="sp-copy">© 2026 ${esc(B.name)} · ${esc(B.area)} · All prices in CAD</p>
  </footer>`;

const head = ({ title, desc, canonical }) => `<meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="theme-color" content="#0d3d45">
  <link rel="canonical" href="${SITE}${canonical}">
  <link rel="icon" type="image/svg+xml" href="/assets/brand/favicon.svg">
  <link rel="icon" sizes="64x64" href="/favicon.ico">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(B.name)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${SITE}${canonical}">
  <meta property="og:image" content="${SITE}/assets/brand/avya-logo.png">
  <meta property="og:locale" content="en_CA">
  <meta name="twitter:card" content="summary">`;

const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Jost:wght@300;400;500&display=swap">`;

function pageHtml(p) {
  const canonical = `/${p.slug}/`;
  return `<!DOCTYPE html>
<html lang="en-CA">
<head>
  ${head({ title: `${p.title} | ${B.name}`, desc: p.desc, canonical })}
  ${fonts}
  <link rel="stylesheet" href="/css/pages.css?v=${B.updated.replace(/-/g, '')}">
  <script type="application/ld+json">
${jsonLd()}
  </script>
</head>
<body class="sp">
  ${header()}
  <main class="sp-main">
    <nav class="sp-crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <span>${esc(p.crumb)}</span></nav>
    <h1>${p.h1}</h1>
    <p class="sp-lead">${p.lead}</p>
    ${p.body.trim()}
  </main>
  ${footer()}
</body>
</html>
`;
}

/* The text shown inside frontend/index.html until the store has loaded; the shop replaces it. */
const shell = () => `<!--shell:start-->
    <div class="sp sp-shell">
      ${header()}
      <main class="sp-main">
        <h1>Silver jewellery, gold and silver bullion in ${esc(B.area)}</h1>
        <p class="sp-lead">Avya Jewels is a family jewellery business. We sell 925 sterling silver jewellery, kids’ silver, and 99.99% pure gold and silver bars and coins for saving, investing and gifting. Free home delivery across the GTA on orders over $200, or pick up in Mississauga.</p>
        <div class="sp-cards">
          <a class="sp-card" href="/silver-jewellery/"><strong>Silver jewellery</strong><span>Rings and bracelets in 925 sterling silver, hallmarked and stamped.</span></a>
          <a class="sp-card" href="/gold-and-silver-bullion/"><strong>Gold &amp; silver bullion</strong><span>99.99% pure bars and coins from the Royal Canadian Mint, PAMP, Valcambi and more.</span></a>
          <a class="sp-card" href="/kids/"><strong>Kids’ silver</strong><span>Kada and nazariya for little ones.</span></a>
        </div>
        <p class="sp-loading" role="status">Loading the shop…</p>
        <noscript><p class="sp-note">The shop needs JavaScript. You can read about Avya Jewels on the pages above, or message us on <a href="${B.whatsapp}">WhatsApp</a>.</p></noscript>
      </main>
      ${footer()}
    </div>
    <!--shell:end-->`;

const SEO_BLOCK = () => `<!--seo:start-->
  ${head({ title: 'Avya Jewels — Silver jewellery & gold and silver bullion, Mississauga', desc: '925 sterling silver jewellery and 99.99% pure gold and silver bars and coins from Avya Jewels, Mississauga. Free home delivery across the GTA on orders over $200.', canonical: '/' })}
  <script type="application/ld+json">
${jsonLd()}
  </script>
  <!--seo:end-->`;

/* ── Write everything ──────────────────────────────────────────────────── */
for (const p of PAGES) {
  const dir = path.join(root, 'frontend', p.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), pageHtml(p));
}

const indexFile = path.join(root, 'frontend', 'index.html');
let index = fs.readFileSync(indexFile, 'utf8');
// first run: replace the plain <meta charset> … <meta description> head lines and the empty app div with marked blocks
if (!index.includes('<!--seo:start-->')) {
  index = index.replace(/<meta charset="utf-8">[\s\S]*?<meta name="description"[^>]*>/, '<!--seo:start--><!--seo:end-->');
  index = index.replace('<link rel="stylesheet" href="css/styles.css', '<link rel="stylesheet" href="css/pages.css">\n  <link rel="stylesheet" href="css/styles.css');
  index = index.replace('<div id="app"></div>', '<div id="app"><!--shell:start--><!--shell:end--></div>');
}
index = index.replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, SEO_BLOCK());
index = index.replace(/<!--shell:start-->[\s\S]*?<!--shell:end-->/, shell());
fs.writeFileSync(indexFile, index);

fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *
Allow: /
Disallow: /admin
Disallow: /backend/

Sitemap: ${SITE}/sitemap.xml
`);
fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${['/', ...PAGES.map(p => `/${p.slug}/`)].map(u => `  <url><loc>${SITE}${u}</loc><lastmod>${B.updated}</lastmod></url>`).join('\n')}
</urlset>
`);

console.log(`Built ${PAGES.length} pages, the store loading text, robots.txt and sitemap.xml`);
