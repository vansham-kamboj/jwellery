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
    return `<div class="iv-top"><span>Complimentary insured shipping across Canada</span><span>Book a private viewing · Toronto</span></div>
      <header class="iv-head">
        <nav class="iv-nav ${state.navOpen ? 'open' : ''}" id="nav-links" aria-label="Main">
          ${nav.map(([l, h, on]) => `<a href="${h}" ${on ? 'aria-current="page"' : ''}>${l}</a>`).join('')}<a href="#/studio" class="iv-only-m">Studio</a></nav>
        <a href="#/" class="iv-logo" aria-label="Avya Jewels home">${logo('')}</a>
        <div class="iv-right"><a href="#/studio" class="iv-hide-m" ${state.route === 'studio' ? 'aria-current="page"' : ''}>Studio</a><a href="#/bag">Bag (${t.count})</a>
          <button class="iv-burger" data-act="toggleNav" aria-label="Menu" aria-expanded="${state.navOpen}" aria-controls="nav-links">${state.navOpen ? ICON.close : ICON.menu}</button></div>
      </header>`;
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
    const r = CONTENT.reviews[state.review % CONTENT.reviews.length];
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
      <a href="#/product/${big.id}" class="iv-img iv-hero-main" aria-label="${esc(big.name)}">${photo(big.purple ? big.img2 : big.img, big.name, true)}</a>
      <div class="iv-hero-side">
        <a href="#/product/${side.id}" class="iv-img iv-hero-small" aria-label="${esc(side.name)}">${photo(side.img, side.name, true)}</a>
        <span class="iv-quote">“The ${esc(side.name.replace(' · 1 oz', ''))} — single-mine Canadian gold, sealed in its assay.”</span>
        <a href="#/product/${side.id}" class="iv-link">Discover · ${cad(side.price)}</a>
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

    <section class="iv-testimonial">
      ${stars(5)}
      <blockquote>“${r.q}”</blockquote>
      <span class="iv-label">${r.n} · ${r.c}</span>
      <div class="iv-dots" role="group" aria-label="Choose a review">${CONTENT.reviews.map((x, i) => `<button class="${i === state.review % CONTENT.reviews.length ? 'on' : ''}" data-act="review" data-arg="${i}" aria-label="Review ${i + 1}"></button>`).join('')}</div>
    </section>

    <section class="iv-promises">${promises.map(v => `<div><span class="iv-serif-22">${v.t}</span><span class="iv-muted">${v.b}</span></div>`).join('')}</section>`;
  }

  function shop() {
    const cats = shopCats();
    if (!cats.includes(state.filter)) state.filter = 'All';
    const list = REAL().filter(p => (state.filter === 'All' || p.cat === state.filter) && (!state.metal || metalOf(p).includes(state.metal)));
    const cards = list.map(productCard);
    const promo = `<a href="#/custom" class="iv-promo"><span class="iv-label lilac">Bespoke</span><span class="iv-promo-title">Can’t find it?<br><i>We’ll make it.</i></span><span class="iv-link lilac">Start a design</span></a>`;
    if (cards.length >= 3 && state.filter !== 'Bullion') cards.splice(3, 0, promo);
    return `
    <section class="iv-shop-head">
      <div class="stack" style="gap:14px"><span class="iv-label">Home / Shop / ${catLabel(state.filter)}</span><h1 class="iv-h1 shop">${state.filter === 'All' ? 'All pieces' : catLabel(state.filter)}</h1></div>
      <p class="iv-lead">${BLURB[state.filter] || BLURB.All}</p>
    </section>
    <div class="iv-filterbar">
      <div class="iv-tabs">${cats.map(c => `<button class="${state.filter === c ? 'on' : ''}" data-act="filter" data-arg="${c}">${catLabel(c)} <span>${countIn(c)}</span></button>`).join('')}</div>
      <div class="iv-metals"><span>Metal</span>${Object.keys(METALS).map(m => `<button class="iv-sw ${state.metal === m ? 'on' : ''}" style="background:${METAL_SW[m]}" data-act="metal" data-arg="${m}" title="${m}" aria-label="${m}" aria-pressed="${state.metal === m}"></button>`).join('')}<span class="iv-sort">Sort: Featured</span></div>
    </div>
    <section class="iv-grid">${cards.join('')}</section>
    ${list.length ? '' : `<div class="iv-empty"><span class="iv-serif-28">Nothing in that metal yet.</span><button class="iv-btn ghost" data-act="metal" data-arg="${state.metal}">Clear metal</button></div>`}`;
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
        ${imgs.map((s, i) => `<div class="iv-img ${i ? 'half' : 'main'}">${!i && p.tag ? `<span class="iv-tag">${p.tag}</span>` : ''}${photo(s, p.name + (i ? ' — view ' + (i + 1) : ''), !i)}</div>`).join('')}
        ${p.video ? `<div class="iv-img half"><video src="${p.video}" poster="${p.img}" autoplay muted loop playsinline aria-label="${esc(p.name)} video"></video></div>` : ''}
      </div>
      <div class="iv-buy">
        <div class="stack" style="gap:12px">
          <span class="iv-label accent">${p.bullion ? 'Royal Canadian Mint · Sealed' : catLabel(p.cat) + ' · Ready to ship'}</span>
          <h1 class="iv-h1 title">${esc(p.name)}</h1>
          <div class="iv-price-row"><span class="iv-price">${money(price)}</span><span class="iv-muted">${p.rating ? stars(5) + ' ' + p.rating + ' · ' + p.reviews + ' reviews' : (p.bullion ? 'HST-exempt · insured delivery' : 'New in · no reviews yet')}</span></div>
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
    </section>`;
  }
