  /* ══ Ivory Editorial views — spliced into app.js; these declarations replace the defaults above. ══ */
  const REAL = () => PRODUCTS.filter(p => p.real);
  state.cart = state.cart.filter(l => byId(l.id) && byId(l.id).real);   // these designs sell the real pieces only
  const METALS = { Silver: ['silver', 'plainsilver', 'finesilver'], Gold: ['gold', 'finegold'], 'Rose gold': ['rose', 'rosetone'] };
  const METAL_SW = { Silver: '#D8DCDD', Gold: '#D9B46A', 'Rose gold': '#D9A28F' };
  const metalOf = p => Object.keys(METALS).filter(m => p.sw.some(k => METALS[m].includes(k)));
  const shopCats = () => ['All', ...new Set(REAL().map(p => p.cat))];
  const catLabel = c => c === 'Bullion' ? 'Gold & silver' : c === 'All' ? 'Everything' : c;
  const countIn = c => REAL().filter(p => c === 'All' || p.cat === c).length;
  Object.assign(BLURB, {
    All: 'Hand-set silver jewellery and certified Royal Canadian Mint gold and silver — chosen in our Toronto studio.',
    Rings: 'Statement pieces, solitaires and stackers in silver, set with cubic zirconia. Canadian sizes 5 to 9.',
    Earrings: 'Studs that sit close and catch the light — easy to wear from morning to evening.',
    Bullion: 'Royal Canadian Mint coins and bars in 999.9 fine gold and silver — sealed, serial-numbered and HST-exempt.'
  });
  Object.assign(state, { metal: null, review: 0 });
  const addLabel = id => state.justAdded[id] ? 'Added' : (isQuote(byId(id)) ? 'Reserve' : 'Add to bag');

  /* Contact & social — replace the placeholder profile links with the client's real accounts. */
  const WHATSAPP = '918320495754';
  const waLink = (msg = 'Hi Avya Jewels, I have a question.') => 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
  const SOCIAL = [
    ['Instagram', 'https://www.instagram.com/', svg('<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".9" fill="currentColor" stroke="none"/>', 16)],
    ['YouTube', 'https://www.youtube.com/', svg('<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor" stroke="none"/>', 16)],
    ['X (Twitter)', 'https://x.com/', svg('<path d="M4 4l16 16M20 4L4 20"/>', 14)],
    ['WhatsApp', waLink(), svg('<path d="M20 11.6a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.5-4A8.4 8.4 0 1 1 20 11.6z"/><path d="M9 8.6c.2 2.9 2.6 5.3 5.5 5.6l1.2-1.4 1.8.9-.5 1.6c-4 .3-8-3.6-7.7-7.6l1.6-.5.9 1.8z" fill="currentColor" stroke="none"/>', 16)]
  ];
  const WA_ICON = svg('<path d="M20 11.6a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.5-4A8.4 8.4 0 1 1 20 11.6z"/><path d="M9 8.6c.2 2.9 2.6 5.3 5.5 5.6l1.2-1.4 1.8.9-.5 1.6c-4 .3-8-3.6-7.7-7.6l1.6-.5.9 1.8z" fill="currentColor" stroke="none"/>', 28);
  const CART_ICON = svg('<path d="M3 4h2.4l2.3 11.2a1.6 1.6 0 0 0 1.6 1.3h8.1a1.6 1.6 0 0 0 1.6-1.2L20.6 8H6.2"/><circle cx="9.6" cy="20" r="1.3"/><circle cx="17.4" cy="20" r="1.3"/>', 22);
  const SEARCH_ICON = svg('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>', 18);

  /* Search: every word must appear in the piece's name, material, category or keywords. */
  const haystack = p => (p.name + ' ' + p.material + ' ' + catLabel(p.cat) + ' ' + p.cat + ' ' + (p.desc || '') + ' '
    + (p.bullion ? 'gold silver coin bar bullion investment rcm royal canadian mint ' + (p.metal || '') : 'jewellery jewelry')
    + (p.sw.includes('rosetone') ? ' rose gold' : '') + (/diwali/.test(p.id) ? ' diwali gift' : '')).toLowerCase();
  const matchQ = (p, q) => q.toLowerCase().split(/\s+/).filter(Boolean).every(w => haystack(p).includes(w));
  const searchHits = q => (q || '').trim() ? REAL().filter(p => matchQ(p, q.trim())) : [];
  function searchResults(q) {
    const hits = searchHits(q);
    if (!(q || '').trim()) {
      return `<div class="iv-search-sugg"><span class="iv-label">Popular searches</span>
        <div>${['Rose gold', 'Solitaire', 'Statement', 'Gold coin', 'Gold bar', 'Silver', 'Diwali'].map(t => `<button type="button" data-act="searchFor" data-arg="${t}">${t}</button>`).join('')}</div></div>`;
    }
    if (!hits.length) return `<p class="iv-search-empty">No pieces match “${esc(q.trim())}”. Try “ring”, “rose gold” or “gold bar”.</p>`;
    return `<ul class="iv-search-list">${hits.slice(0, 6).map(p => `<li><a href="#/product/${p.id}"><span class="iv-search-thumb">${photo(p.img, p.name)}</span>
        <span class="stack"><span class="iv-serif-20">${esc(p.name)}</span><span class="iv-muted">${esc(p.material)}</span></span><span class="iv-price-sm">${cad(p.price)}</span></a></li>`).join('')}</ul>
      <button type="submit" class="iv-btn ghost block sm">See all ${hits.length} result${hits.length === 1 ? '' : 's'}</button>`;
  }
  Object.assign(state, { searchOpen: false, q: '', zoom: null });

  function header() {
    const t = totals();
    if (state.route === 'checkout') {
      return `<header class="iv-head"><span class="iv-label">Secure checkout</span>
        <a href="#/" class="iv-logo" aria-label="Avya Jewels home">${logo('')}</a>
        <div class="iv-right"><a href="#/bag">Back to bag</a></div></header>`;
    }
    const inShop = state.route === 'shop';
    const nav = [['Shop', '#/shop', inShop && state.filter !== 'Bullion'], ['Gold & silver', '#/shop/Bullion', inShop && state.filter === 'Bullion'],
      ['Diwali gifts', '#/product/diwali-10g-gold-bars', false], ['Bespoke', '#/custom', state.route === 'custom']];
    return `<div class="iv-top"><span class="iv-top-msg">Complimentary insured shipping across Canada</span>
        <span class="iv-top-right"><span class="iv-top-msg">Book a private viewing · Toronto</span><span class="iv-social" aria-label="Follow Avya Jewels">${SOCIAL.map(([n, h, ic]) => `<a href="${h}" target="_blank" rel="noopener" aria-label="${n}" title="${n}">${ic}</a>`).join('')}</span></span></div>
      <header class="iv-head">
        <nav class="iv-nav ${state.navOpen ? 'open' : ''}" id="nav-links" aria-label="Main">
          ${nav.map(([l, h, on]) => `<a href="${h}" ${on ? 'aria-current="page"' : ''}>${l}</a>`).join('')}<a href="#/studio" class="iv-only-m">Studio</a></nav>
        <a href="#/" class="iv-logo" aria-label="Avya Jewels home">${logo('')}</a>
        <div class="iv-right"><button class="iv-iconbtn" data-act="openSearch" aria-label="Search" aria-haspopup="dialog">${SEARCH_ICON}<span class="iv-hide-m">Search</span></button><a href="#/studio" class="iv-hide-m" ${state.route === 'studio' ? 'aria-current="page"' : ''}>Studio</a><a href="#/bag" class="iv-cart" aria-label="Bag, ${t.count} item${t.count === 1 ? '' : 's'}" title="Bag">${CART_ICON}${t.count ? `<span class="iv-cart-count">${t.count}</span>` : ''}</a>
          <button class="iv-burger" data-act="toggleNav" aria-label="Menu" aria-expanded="${state.navOpen}" aria-controls="nav-links">${state.navOpen ? ICON.close : ICON.menu}</button></div>
      </header>
      ${state.searchOpen ? `<div class="iv-search" role="dialog" aria-modal="true" aria-label="Search the collection">
        <div class="iv-search-backdrop" data-act="closeSearch"></div>
        <form class="iv-search-panel" data-form="search" role="search">
          <div class="iv-search-row">${SEARCH_ICON}<input id="iv-q" type="search" placeholder="Search rings, coins, bars…" aria-label="Search" autocomplete="off" data-model="q" value="${esc(state.form.q || '')}">
            <button type="button" class="iv-search-close" data-act="closeSearch" aria-label="Close search">${ICON.close}</button></div>
          <div id="iv-search-results">${searchResults(state.form.q)}</div>
        </form></div>` : ''}
      <a class="iv-wa" href="${waLink()}" target="_blank" rel="noopener" aria-label="Chat with Avya Jewels on WhatsApp" title="Chat on WhatsApp">${WA_ICON}</a>`;
  }

  function footer() {
    return `<footer class="iv-foot">
      <div class="iv-foot-grid">
        <div class="iv-foot-brand">${logo('iv-foot-logo')}
          <span>Private previews of new pieces, Diwali gifting and gold-rate notes. Never more than once a month.</span>
          <form class="iv-news" data-form="newsletter"><input type="email" required placeholder="Your email address" aria-label="Email address" data-model="newsletter" value="${esc(state.form.newsletter)}"><button type="submit">Subscribe</button></form></div>
        ${CONTENT.footerCols.map(col => `<div class="iv-foot-col"><span class="iv-label light">${col.h}</span>${col.links.map(([l, h]) => `<a href="${h}">${l}</a>`).join('')}</div>`).join('')}
      </div>
      <div class="iv-foot-base"><span>© 2026 Avya Jewels Inc. · 1082 Queen St W, Toronto, ON</span><span>All prices in CAD</span></div>
    </footer>`;
  }

  /* Card used in the bestseller band: centred, outline button under it. */
  function bandCard(p) {
    return `<div class="iv-bcard">
      <a href="#/product/${p.id}" class="iv-img portrait on-ivory">${p.tag ? `<span class="iv-tag">${p.tag}</span>` : ''}${photo(p.img, p.name)}</a>
      <div class="iv-bcard-info"><a href="#/product/${p.id}" class="iv-serif-22">${esc(p.name)}</a><span class="iv-muted">${esc(p.material)}</span><span class="iv-price-sm">${cad(p.price)}</span></div>
      <button class="iv-btn ghost block sm ${state.justAdded[p.id] ? 'on' : ''}" data-act="quickAdd" data-arg="${p.id}">${addLabel(p.id)}</button>
    </div>`;
  }

  /* Card used in the collection grid: name left, price right, swatches + underline add. */
  function productCard(p) {
    return `<div class="iv-pcard">
      <a href="#/product/${p.id}" class="iv-img portrait">${p.tag ? `<span class="iv-tag">${p.tag}</span>` : ''}${photo(p.img, p.name)}</a>
      <div class="iv-pcard-row"><div class="stack" style="gap:3px"><a href="#/product/${p.id}" class="iv-serif-24">${esc(p.name)}</a><span class="iv-muted">${esc(p.material)}</span></div><span class="iv-price-sm" style="padding-top:6px">${cad(p.price)}</span></div>
      <div class="iv-pcard-row center"><span class="iv-swatches">${metalOf(p).map(m => `<span style="background:${METAL_SW[m]}" title="${m}"></span>`).join('')}</span>
        <button class="iv-underline" data-act="quickAdd" data-arg="${p.id}">${addLabel(p.id)}</button></div>
    </div>`;
  }

  function home() {
    const big = byId('starflower-ring') || byId('cluster-halo-ring') || REAL()[0];
    const side = byId('maple-leaf-1oz-coin') || REAL()[1];
    const cats = [['Rings', '#/shop/Rings'], ['Earrings', '#/shop/Earrings'], ['Gold bars', '#/shop/Bullion'], ['Gold coins', '#/product/maple-leaf-1oz-coin'], ['Silver bars', '#/shop/Bullion'], ['Diwali gifts', '#/product/diwali-10g-gold-bars']];
    const cols = [
      { n: 'No. 01', name: 'Statement rings', href: '#/shop/Rings', p: 'ruby-red-statement-ring', count: REAL().filter(p => p.cat === 'Rings' && !p.sw.includes('rosetone')).length, body: 'Bold centre stones and pavé shoulders that catch the light across a room.' },
      { n: 'No. 02', name: 'Garden & laurel', href: '#/shop/Rings', p: 'floral-halo-ring', count: REAL().filter(p => p.sw.includes('rosetone')).length, body: 'Leaf, vine and flower settings in a soft rose tone, set with tiny stones.' },
      { n: 'No. 03', name: 'Certified gold', href: '#/shop/Bullion', p: 'rcm-100g-gold-bar', count: REAL().filter(p => p.bullion).length, body: 'Royal Canadian Mint coins and bars, sealed in their assay and HST-exempt.' }
    ].filter(c => byId(c.p));
    const tabs = { Bestsellers: ['starflower-ring', 'ruby-red-statement-ring', 'ribbon-solitaire-ring', 'wing-ring'], Rings: null, 'Gold & silver': null };
    const tab = tabs[state.homeTab] !== undefined ? state.homeTab : 'Bestsellers';
    const picks = (tabs[tab] ? tabs[tab].map(byId) : REAL().filter(p => tab === 'Rings' ? p.cat === 'Rings' : p.bullion).slice(0, 4)).filter(Boolean);
    const steps = [{ n: '01', t: 'Consult', b: 'In the studio or by video, free.' }, { n: '02', t: 'Sketch & quote', b: 'Drawings and a price within a week.' }, { n: '03', t: 'Craft', b: 'Set and polished in 3–4 weeks.' }];
    const promises = [...CONTENT.promises.map(x => ({ t: x.title, b: x.body })), { t: '30-day returns', b: 'Unworn jewellery, in its original box.' }];
    const bespoke = byId('pear-crown-ring');
    return `
    <section class="iv-hero">
      <div class="iv-hero-copy">
        <div class="stack" style="gap:22px">
          <span class="iv-label accent">The Autumn Collection · 2026</span>
          <h1 class="iv-h1">Silver to wear, <i>gold to keep.</i></h1>
          <p class="iv-lead">Hand-set silver jewellery and Royal Canadian Mint gold, chosen in our Toronto studio and shipped insured across Canada.</p>
          <div class="iv-ctas"><a href="#/shop" class="iv-btn">Shop now</a><a href="#/custom" class="iv-btn ghost">Design yours</a></div>
        </div>
        <div class="iv-stats"><div><strong>RCM</strong><span>Certified gold</span></div><div><strong>$48</strong><span>Silver from</span></div><div><strong>Insured</strong><span>Across Canada</span></div></div>
      </div>
      <div class="iv-hero-duo">
        ${[[big, 'Fine jewellery', big.purple ? big.img2 : big.img], [side, 'Certified gold', side.img]].map(([p, kicker, src]) => `<a href="#/product/${p.id}" class="iv-feature">
          <div class="iv-img iv-feature-img">${photo(src, p.name, true)}</div>
          <div class="iv-feature-cap"><span class="iv-label accent">${kicker}</span><span class="iv-serif-24">${esc(p.name)}</span>
            <span class="iv-feature-row"><span class="iv-muted">${esc(p.material)}</span><span class="iv-price-sm">${cad(p.price)}</span></span></div></a>`).join('')}
      </div>
    </section>

    <nav class="iv-cats" aria-label="Shop by category">${cats.map(([n, h]) => `<a href="${h}"><span>${n}</span><span class="iv-gem" aria-hidden="true"></span></a>`).join('')}</nav>

    <section class="iv-sec">
      <div class="iv-sec-head"><div class="stack" style="gap:10px"><span class="iv-label accent">Collections</span><h2 class="iv-h2">Three stories in silver &amp; gold</h2></div><a href="#/shop" class="iv-link dark">View all</a></div>
      <div class="iv-cols">${cols.map(c => `<a href="${c.href}" class="iv-col">
        <div class="iv-img iv-col-img">${photo(byId(c.p).img, c.name)}</div>
        <div class="iv-col-row"><span class="iv-label accent tight">${c.n}</span><span class="iv-serif-28">${c.name}</span><span class="iv-muted">${c.count} pieces</span></div>
        <span class="iv-body sm">${c.body}</span></a>`).join('')}</div>
    </section>

    <section class="iv-band">
      <div class="iv-band-head"><div class="stack" style="gap:10px"><span class="iv-label accent">Most loved</span><h2 class="iv-h2">The bestsellers</h2></div>
        <div class="iv-tabs" role="tablist">${Object.keys(tabs).map(t => `<button role="tab" aria-selected="${t === tab}" class="${t === tab ? 'on' : ''}" data-act="homeTab" data-arg="${t}">${t}</button>`).join('')}</div></div>
      <div class="iv-band-grid">${picks.map(bandCard).join('')}</div>
    </section>

    <section class="iv-bespoke">
      <div class="iv-img iv-bespoke-img">${photo(PURPLE_SCENES.rings, 'Ivy Halo Ring in the studio')}</div>
      <div class="iv-bespoke-copy">
        <span class="iv-label lilac">Bespoke atelier</span>
        <h2 class="iv-h2 light">A piece that exists <i>only once.</i></h2>
        <p>Engagement rings, heirloom redesigns and engraved keepsakes — designed with you, one sketch at a time.</p>
        <div class="iv-steps">${steps.map(s => `<div><span class="n">${s.n}</span><span class="t">${s.t}</span><span class="b">${s.b}</span></div>`).join('')}</div>
        <a href="#/custom" class="iv-btn lilac">Book a consultation</a>
      </div>
    </section>

    <section class="iv-promises">${promises.map(v => `<div><span class="iv-serif-22">${v.t}</span><span class="iv-muted">${v.b}</span></div>`).join('')}</section>`;
  }

  function shop() {
    const cats = shopCats();
    if (!cats.includes(state.filter)) state.filter = 'All';
    const q = (state.q || '').trim();
    const list = REAL().filter(p => (state.filter === 'All' || p.cat === state.filter) && (!state.metal || metalOf(p).includes(state.metal)) && (!q || matchQ(p, q)));
    const cards = list.map(productCard);
    const promo = `<a href="#/custom" class="iv-promo"><span class="iv-label lilac">Bespoke</span><span class="iv-promo-title">Can’t find it?<br><i>We’ll make it.</i></span><span class="iv-link lilac">Start a design</span></a>`;
    if (cards.length >= 4 && state.filter !== 'Bullion' && !q) cards.splice(4, 0, promo);
    return `
    <section class="iv-shop-head">
      <div class="stack" style="gap:14px"><span class="iv-label">Home / Shop / ${catLabel(state.filter)}</span><h1 class="iv-h1 shop">${q ? 'Results for “' + esc(q) + '”' : state.filter === 'All' ? 'All pieces' : catLabel(state.filter)}</h1></div>
      <p class="iv-lead">${q ? list.length + ' piece' + (list.length === 1 ? '' : 's') + ' found. <button class="iv-underline" data-act="clearSearch">Clear search</button>' : BLURB[state.filter] || BLURB.All}</p>
    </section>
    <div class="iv-filterbar">
      <div class="iv-tabs">${cats.map(c => `<button class="${state.filter === c ? 'on' : ''}" data-act="filter" data-arg="${c}">${catLabel(c)} <span>${countIn(c)}</span></button>`).join('')}</div>
      <div class="iv-metals"><span>Metal</span>${Object.keys(METALS).map(m => `<button class="iv-sw ${state.metal === m ? 'on' : ''}" style="background:${METAL_SW[m]}" data-act="metal" data-arg="${m}" title="${m}" aria-label="${m}" aria-pressed="${state.metal === m}"></button>`).join('')}<span class="iv-sort">Sort: Featured</span></div>
    </div>
    <section class="iv-grid">${cards.join('')}</section>
    ${list.length ? '' : q ? `<div class="iv-empty"><span class="iv-serif-28">No pieces match “${esc(q)}”.</span><button class="iv-btn ghost" data-act="clearSearch">Clear search</button></div>`
      : `<div class="iv-empty"><span class="iv-serif-28">Nothing in that metal yet.</span><button class="iv-btn ghost" data-act="metal" data-arg="${state.metal}">Clear metal</button></div>`}`;
  }

  const ZOOM_ICON = svg('<path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"/>', 16);
  /* Full-screen image viewer for the product page. */
  function lightbox(p, imgs) {
    const n = imgs.length, i = ((state.zoom % n) + n) % n;
    return `<div class="iv-lightbox" role="dialog" aria-modal="true" aria-label="${esc(p.name)} images">
      <div class="iv-lb-backdrop" data-act="unzoom"></div>
      <figure class="iv-lb-stage"><img src="${imgs[i]}" alt="${esc(p.name)} — image ${i + 1} of ${n}"><figcaption>${esc(p.name)} <span>${i + 1} / ${n}</span></figcaption></figure>
      <button type="button" class="iv-lb-btn close" data-act="unzoom" aria-label="Close">${ICON.close}</button>
      ${n > 1 ? `<button type="button" class="iv-lb-btn prev" data-act="zoomStep" data-arg="-1" aria-label="Previous image">${svg('<path d="M15 5l-7 7 7 7"/>', 24)}</button>
      <button type="button" class="iv-lb-btn next" data-act="zoomStep" data-arg="1" aria-label="Next image">${svg('<path d="M9 5l7 7-7 7"/>', 24)}</button>
      <div class="iv-lb-thumbs">${imgs.map((src, j) => `<button type="button" class="${j === i ? 'on' : ''}" data-act="zoom" data-arg="${j}" aria-label="Image ${j + 1}">${photo(src, '')}</button>`).join('')}</div>` : ''}
    </div>`;
  }

  function product() {
    const p = byId(state.param) || REAL()[0];
    const sz = sizesOf(p);
    const fins = p.sw.map(k => ({ name: FINISH_OF[k], swatch: SW[k] }));
    const { finish, size, added } = state.pdp;
    const price = pdpPrice(p, finish, size);
    const imgs = (p.gallery || [p.img, p.img2]).slice(0, p.video ? 2 : 3);
    const pairs = REAL().filter(x => x.id !== p.id && x.bullion !== p.bullion).slice(0, 2).concat(REAL().filter(x => x.id !== p.id && x.bullion === p.bullion).slice(0, 2));
    return `
    <section class="iv-pdp">
      <div class="iv-gallery">
        ${imgs.map((s, i) => `<button type="button" class="iv-img iv-zoomable ${i ? 'half' : 'main'}" data-act="zoom" data-arg="${i}" aria-label="View ${esc(p.name)} image ${i + 1} full screen">${!i && p.tag ? `<span class="iv-tag">${p.tag}</span>` : ''}${photo(s, p.name + (i ? ' — view ' + (i + 1) : ''), !i)}<span class="iv-zoom-hint" aria-hidden="true">${ZOOM_ICON}</span></button>`).join('')}
        ${p.video ? `<div class="iv-img half"><video src="${p.video}" poster="${p.img}" autoplay muted loop playsinline aria-label="${esc(p.name)} video"></video></div>` : ''}
      </div>
      <div class="iv-buy">
        <div class="stack" style="gap:12px">
          <span class="iv-label accent">${p.bullion ? 'Royal Canadian Mint · Sealed' : catLabel(p.cat) + ' · Ready to ship'}</span>
          <h1 class="iv-h1 title">${esc(p.name)}</h1>
          <div class="iv-price-row"><span class="iv-price">${money(price)}</span><span class="iv-muted">${(p.bullion ? 'HST-exempt · insured delivery' : 'New in')}</span></div>
          <p class="iv-body">${esc(p.desc)}</p>
        </div>
        ${fins.length ? `<div class="iv-opt"><div class="iv-opt-head"><span>Metal</span><span>${finish}</span></div>
          <div class="iv-opt-row">${fins.map(f => `<label class="iv-choice"><input type="radio" name="pfin" data-pdp="finish" value="${esc(f.name)}" ${finish === f.name ? 'checked' : ''}><span class="sw" style="background:${f.swatch}"></span>${f.name}</label>`).join('')}</div></div>` : ''}
        ${sz ? `<div class="iv-opt"><div class="iv-opt-head"><span>${sz.label}${p.cat === 'Rings' ? ' (CA/US)' : ''}</span><a href="#/studio" class="iv-guide">Size guide</a></div>
          <div class="iv-sizes">${sz.opts.map(v => `<label class="iv-choice"><input type="radio" name="psize" data-pdp="size" value="${v}" ${size === v ? 'checked' : ''}>${v}</label>`).join('')}</div></div>` : ''}
        <div class="stack" style="gap:10px">
          <button class="iv-btn block lg" data-act="addToBag">${added ? 'Added — view bag (' + totals().count + ')' : (isQuote(p) ? 'Reserve at today’s rate · ' : 'Add to bag · ') + money(price)}</button>
          <a class="iv-btn ghost block lg" href="#/studio">Book a viewing in Toronto</a>
          <span class="iv-note">${p.bullion ? 'Sealed in original assay · insured, signed delivery' : 'Ships insured in 2–4 days · free resizing · 30-day returns'}</span>
        </div>
        <div class="iv-acc">${(p.accordions || CONTENT.accordions).map((a, i) => (i === 0 && p.care ? { ...a, body: p.care } : a)).map((a, i) => `<button class="iv-acc-item" data-act="acc" data-arg="${i}" aria-expanded="${state.open === i}"><span class="iv-acc-head"><span>${a.title}</span><span class="pm">${state.open === i ? '−' : '+'}</span></span>${state.open === i ? `<p>${a.body}</p>` : ''}</button>`).join('')}</div>
      </div>
    </section>
    <section class="iv-band">
      <div class="iv-band-head"><h2 class="iv-h2 sm">Wear it with</h2><a href="#/shop" class="iv-link dark">Shop all</a></div>
      <div class="iv-pairs">${pairs.map(x => `<a href="#/product/${x.id}" class="iv-pair"><div class="iv-img square on-ivory">${photo(x.img, x.name)}</div><div class="iv-pair-row"><span class="iv-serif-20">${esc(x.name)}</span><span>${cad(x.price)}</span></div></a>`).join('')}</div>
    </section>
    ${state.zoom !== null && state.zoom !== undefined ? lightbox(p, imgs) : ''}`;
  }
