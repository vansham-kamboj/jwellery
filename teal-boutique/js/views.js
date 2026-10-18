  /* ══ Teal Boutique views — spliced into app.js; these declarations replace the defaults above. ══ */
  const REAL = () => PRODUCTS.filter(p => p.real);
  state.cart = state.cart.filter(l => byId(l.id) && byId(l.id).real);   // these designs sell the real pieces only
  const METALS = { Silver: ['silver', 'plainsilver', 'finesilver'], Gold: ['gold', 'finegold'], Rose: ['rose', 'rosetone'] };
  const METAL_SW = { Silver: '#D8DCDD', Gold: '#D9B46A', Rose: '#D9A28F' };
  const PRICE_BANDS = { 'Under $100': p => p.price < 100, '$100–$2,500': p => p.price >= 100 && p.price < 2500, '$2,500+': p => p.price >= 2500 };
  const TAX = { ON: ['HST (ON) 13%', .13], QC: ['GST + QST (QC) 14.975%', .14975], BC: ['GST + PST (BC) 12%', .12], AB: ['GST (AB) 5%', .05], NS: ['HST (NS) 14%', .14], MB: ['GST + PST (MB) 12%', .12] };
  const metalOf = p => Object.keys(METALS).filter(m => p.sw.some(k => METALS[m].includes(k)));
  const shopCats = () => ['All', ...new Set(REAL().map(p => p.cat))];
  const catLabel = c => c === 'Bullion' ? 'Gold & silver' : c === 'All' ? 'All pieces' : c;
  const countIn = c => REAL().filter(p => c === 'All' || p.cat === c).length;
  Object.assign(BLURB, {
    All: 'Hand-set silver jewellery and certified Royal Canadian Mint gold and silver — chosen in our Toronto studio.',
    Rings: 'Statement pieces, solitaires and stackers in silver, set with cubic zirconia. Canadian sizes 5 to 9.',
    Earrings: 'Studs that sit close and catch the light — easy to wear from morning to evening.',
    Bullion: 'Royal Canadian Mint coins and bars in 999.9 fine gold and silver — sealed, serial-numbered and HST-exempt.'
  });
  Object.assign(state, { metal: 'Any', band: 'Any', q: '', prov: 'ON', homeTab: 'All' });
  const tbAdd = id => state.justAdded[id] ? 'Added ' + ICON.check : (isQuote(byId(id)) ? 'Reserve' : 'Add');

  /* Province-aware totals (Teal Boutique bag shows tax per province). Bullion stays tax-exempt. */
  function totals() {
    const lines = state.cart.map(l => ({ ...l, p: byId(l.id), sum: l.price * l.qty })).filter(l => l.p);
    const goods = lines.reduce((a, l) => a + l.sum, 0);
    const giftCost = state.gift && lines.length ? 6 : 0;
    const opt = SHIP.find(o => o.id === state.ship);
    const shipCost = goods === 0 ? 0 : (opt.id === 'std' && goods >= 150 ? 0 : opt.price);
    const [taxLabel, rate] = TAX[state.prov] || TAX.ON;
    const taxable = lines.filter(l => !l.p.taxExempt).reduce((a, l) => a + l.sum, 0);
    const tax = (taxable + giftCost + shipCost) * rate;
    return { lines, goods, giftCost, opt, shipCost, tax, taxLabel, total: goods + giftCost + shipCost + tax,
      count: lines.reduce((a, l) => a + l.qty, 0), shipping: shipCost === 0 ? (opt.id === 'pick' ? 'Pickup' : 'Free') : money(shipCost) };
  }
  function summaryRows(t) {
    return `<div class="between"><span class="soft">Subtotal</span><span>${money(t.goods)}</span></div>
      ${t.giftCost ? `<div class="between"><span class="soft">Gift wrap</span><span>${money(t.giftCost)}</span></div>` : ''}
      <div class="between"><span class="soft">Shipping</span><span>${t.shipping}</span></div>
      <div class="between"><span class="soft">${t.taxLabel}</span><span>${money(t.tax)}</span></div>`;
  }

  function header() {
    const t = totals();
    if (state.route === 'bag' || state.route === 'checkout') {
      const step = state.route === 'bag' ? 1 : 2;
      const dot = (n, label) => `<span class="tb-step ${n < step ? 'done' : n === step ? 'cur' : ''}"><span>${n}</span>${label}</span>`;
      return `<header class="tb-head is-checkout">
        <a href="#/" class="tb-logo" aria-label="Avya Jewels home">${logo('')}</a>
        <div class="tb-steps">${dot(1, 'Bag')}<span class="tb-line ${step > 1 ? 'on' : ''}"></span>${dot(2, 'Delivery')}<span class="tb-line"></span>${dot(3, 'Payment')}</div>
        <a href="${state.route === 'bag' ? '#/shop' : '#/bag'}" class="tb-back">← ${state.route === 'bag' ? 'Continue shopping' : 'Back to bag'}</a>
      </header>`;
    }
    const inShop = state.route === 'shop';
    const nav = [['Shop', '#/shop', inShop && state.filter === 'All'], ['Rings', '#/shop/Rings', inShop && state.filter === 'Rings'], ['Earrings', '#/shop/Earrings', inShop && state.filter === 'Earrings'],
      ['Gold & silver', '#/shop/Bullion', inShop && state.filter === 'Bullion'], ['Bespoke', '#/custom', state.route === 'custom']];
    return `<header class="tb-head">
      <a href="#/" class="tb-logo" aria-label="Avya Jewels home">${logo('')}</a>
      <nav class="tb-nav ${state.navOpen ? 'open' : ''}" id="nav-links" aria-label="Main">${nav.map(([l, h, on]) => `<a href="${h}" class="${on ? 'on' : ''}" ${on ? 'aria-current="page"' : ''}>${l}</a>`).join('')}<a href="#/studio" class="tb-only-m">Studio</a></nav>
      <form class="tb-search" data-form="search" role="search">${svg('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>', 16)}<input type="search" placeholder="Search rings, coins, gifts…" aria-label="Search" data-model="q" value="${esc(state.form.q || '')}"></form>
      <a href="#/bag" class="tb-bag">Bag <span>${t.count}</span></a>
      <button class="tb-burger" data-act="toggleNav" aria-label="Menu" aria-expanded="${state.navOpen}" aria-controls="nav-links">${state.navOpen ? ICON.close : ICON.menu}</button>
    </header>`;
  }

  function footer() {
    return `<footer class="tb-foot">
      <div class="tb-foot-grid">
        <div class="tb-foot-brand">${logo('tb-foot-logo')}
          <span>Join the list for early access to new pieces, Diwali gifting and gold-rate notes.</span>
          <form class="tb-news" data-form="newsletter"><input type="email" required placeholder="Email address" aria-label="Email address" data-model="newsletter" value="${esc(state.form.newsletter)}"><button type="submit">Join</button></form></div>
        ${CONTENT.footerCols.map(col => `<div class="tb-foot-col"><span class="tb-kicker light">${col.h}</span>${col.links.map(([l, h]) => `<a href="${h}">${l}</a>`).join('')}</div>`).join('')}
      </div>
      <div class="tb-foot-base"><span>© 2026 Avya Jewels Inc. · Toronto, Canada</span><span>CAD · English / Français</span></div>
    </footer>`;
  }

  function productCard(p) {
    const on = state.justAdded[p.id];
    return `<div class="tb-card">
      <a href="#/product/${p.id}" class="tb-img square">${p.tag ? `<span class="tb-tag">${p.tag}</span>` : ''}${photo(p.img, p.name)}</a>
      <div class="tb-card-info"><div class="tb-card-row"><a href="#/product/${p.id}" class="tb-name">${esc(p.name)}</a>${p.rating ? `<span class="tb-rating">★ ${p.rating}</span>` : ''}</div><span class="tb-muted">${esc(p.material)}</span></div>
      <div class="tb-card-row foot"><span class="tb-price">${cad(p.price)}</span><button class="tb-pill-btn ${on ? 'on' : ''}" data-act="quickAdd" data-arg="${p.id}">${tbAdd(p.id)}</button></div>
    </div>`;
  }

  function home() {
    const hero = byId('floral-halo-ring') || byId('cluster-halo-ring') || REAL()[0];
    const chip = byId('ribbon-solitaire-ring') || byId('pink-oval-ring') || REAL()[1];
    const gift = byId('diwali-10g-gold-bars');
    const cats = [
      ['Rings', '#/shop/Rings', 'laurel-halo-ring', REAL().filter(p => p.cat === 'Rings').length],
      ['Earrings', '#/shop/Earrings', 'emerald-halo-studs', REAL().filter(p => p.cat === 'Earrings').length],
      ['Gold bars', '#/shop/Bullion', 'rcm-100g-gold-bar', REAL().filter(p => p.bullion && p.metal === 'gold' && !/coin/.test(p.id)).length],
      ['Gold coins', '#/product/maple-leaf-1oz-coin', 'maple-leaf-1oz-coin', REAL().filter(p => /coin/.test(p.id)).length],
      ['Silver bars', '#/shop/Bullion', 'rcm-100oz-silver-bar', REAL().filter(p => p.bullion && p.metal === 'silver').length],
      ['Diwali gifts', '#/product/diwali-10g-gold-bars', 'diwali-10g-gold-bars', REAL().filter(p => /diwali/.test(p.id)).length]
    ].filter(c => byId(c[2]));
    const tabs = { All: ['starflower-ring', 'ruby-red-statement-ring', 'ivy-halo-band', 'maple-leaf-1oz-coin'], Rings: null, 'Gold & silver': null };
    const tab = tabs[state.homeTab] !== undefined ? state.homeTab : 'All';
    const picks = (tabs[tab] ? tabs[tab].map(byId) : REAL().filter(p => tab === 'Rings' ? p.cat === 'Rings' : p.bullion).slice(0, 4)).filter(Boolean);
    const promises = [['01', 'Free insured shipping', 'Across Canada over $150'], ['02', '30-day returns', 'On unworn jewellery'], ['03', 'Certified gold', 'Royal Canadian Mint, sealed'], ['04', 'Free resizing', 'Within 60 days']];
    return `
    <section class="tb-hero">
      <div class="tb-hero-copy">
        <span class="tb-badge">New · Autumn collection</span>
        <h1 class="tb-h1">Silver that shines, gold that <i>lasts.</i></h1>
        <p>Hand-set silver jewellery and Royal Canadian Mint gold. Chosen in Toronto, delivered insured across Canada.</p>
        <div class="tb-ctas"><a href="#/shop/Rings" class="tb-btn lilac">Shop jewellery</a><a href="#/shop/Bullion" class="tb-btn outline-light">Explore gold &amp; silver</a></div>
        <div class="tb-proof"><span class="tb-faces"><span></span><span></span><span></span></span><span><b>Insured, signed delivery</b> to every province</span></div>
      </div>
      <div class="tb-hero-media">
        <a href="#/product/${hero.id}" class="tb-img tb-hero-img" aria-label="${esc(hero.name)}">${photo(hero.purple ? hero.img2 : hero.img, hero.name, true)}</a>
        ${chip ? `<div class="tb-float"><a href="#/product/${chip.id}" class="tb-img tb-float-img">${photo(chip.img, chip.name, true)}</a>
          <a href="#/product/${chip.id}" class="tb-float-info"><span class="tb-name sm">${esc(chip.name)}</span><span class="tb-muted">${esc(chip.material.split(' · ')[0])} · ${cad(chip.price)}</span></a>
          <button class="tb-round-btn" data-act="quickAdd" data-arg="${chip.id}" aria-label="${state.justAdded[chip.id] ? 'Added' : 'Add ' + esc(chip.name) + ' to bag'}">${state.justAdded[chip.id] ? ICON.check : svg('<path d="M12 5v14M5 12h14"/>', 18)}</button></div>` : ''}
      </div>
    </section>

    <section class="tb-sec">
      <div class="tb-sec-head"><h2 class="tb-h2">Shop by category</h2><a href="#/shop" class="tb-more">See everything →</a></div>
      <div class="tb-cats">${cats.map(([n, h, id, c]) => `<a href="${h}" class="tb-cat"><span class="tb-circle">${photo(byId(id).img, n)}</span><span class="tb-name">${n}</span><span class="tb-muted">${c} piece${c === 1 ? '' : 's'}</span></a>`).join('')}</div>
    </section>

    <section class="tb-tiles">
      <div class="tb-tile light">
        <div class="tb-tile-copy"><span class="tb-kicker">Diwali gifting</span><span class="tb-tile-title">Gold for Diwali, in its festive card.</span><a href="#/product/${gift ? gift.id : ''}" class="tb-btn dark sm">Find a gift</a></div>
        ${gift ? `<a href="#/product/${gift.id}" class="tb-img tb-tile-img">${photo(gift.img, gift.name)}</a>` : ''}
      </div>
      <div class="tb-tile dark">
        <span class="tb-kicker light">Gifts under $100</span><span class="tb-tile-title">Silver rings, wrapped in our signature lilac box.</span>
        <div class="tb-tile-foot"><a href="#/shop/Rings" class="tb-btn lilac sm">Shop gifts</a><span>Free gift note</span></div>
      </div>
    </section>

    <section class="tb-sec">
      <div class="tb-sec-head"><h2 class="tb-h2">Trending this week</h2>
        <div class="tb-seg" role="tablist">${Object.keys(tabs).map(t => `<button role="tab" aria-selected="${t === tab}" class="${t === tab ? 'on' : ''}" data-act="homeTab" data-arg="${t}">${t}</button>`).join('')}</div></div>
      <div class="tb-grid four">${picks.map(productCard).join('')}</div>
    </section>

    <section class="tb-promises">${promises.map(([n, t, b]) => `<div><span class="tb-num">${n}</span><span class="stack"><span class="tb-name sm">${t}</span><span class="tb-muted">${b}</span></span></div>`).join('')}</section>

    <section class="tb-sec">
      <div class="tb-sec-head"><h2 class="tb-h2">Loved coast to coast</h2></div>
      <div class="tb-reviews">${CONTENT.reviews.map(r => `<figure class="tb-review">${stars(5)}<blockquote>“${r.q}”</blockquote>
        <figcaption><span class="tb-avatar">${r.i}</span><span class="stack"><span class="tb-name sm">${r.n}</span><span class="tb-muted">${r.c} · ${r.p}</span></span></figcaption></figure>`).join('')}</div>
    </section>`;
  }

  function shop() {
    const cats = shopCats();
    if (!cats.includes(state.filter)) state.filter = 'All';
    const q = (state.q || '').trim().toLowerCase();
    const list = REAL().filter(p => (state.filter === 'All' || p.cat === state.filter)
      && (state.metal === 'Any' || metalOf(p).includes(state.metal))
      && (state.band === 'Any' || PRICE_BANDS[state.band](p))
      && (!q || (p.name + ' ' + p.material + ' ' + p.cat + (p.bullion ? ' gold silver coin bar bullion' : '')).toLowerCase().includes(q)));
    const banner = { All: 'starflower-ring', Rings: 'ivy-halo-band', Earrings: 'emerald-halo-studs', Bullion: 'rcm-100g-gold-bar' }[state.filter];
    const metals = ['Any', ...Object.keys(METALS).filter(m => REAL().some(p => metalOf(p).includes(m)))];
    return `
    <section class="tb-banner">
      <div class="tb-banner-copy"><span class="tb-crumb">Home / Shop / ${catLabel(state.filter)}</span><h1 class="tb-h1 shop">${q ? 'Results for “' + esc(state.q) + '”' : catLabel(state.filter)}</h1><p>${BLURB[state.filter] || BLURB.All}</p></div>
      ${byId(banner) ? `<div class="tb-img tb-banner-img">${photo(byId(banner).img, catLabel(state.filter), true)}</div>` : ''}
    </section>
    <section class="tb-shop">
      <aside class="tb-side">
        <div class="tb-group"><span class="tb-kicker grey">Category</span>
          ${cats.map(c => `<button class="tb-catbtn ${state.filter === c ? 'on' : ''}" data-act="filter" data-arg="${c}"><span>${catLabel(c)}</span><span>${countIn(c)}</span></button>`).join('')}</div>
        <div class="tb-group"><span class="tb-kicker grey">Metal</span><div class="tb-chips">${metals.map(m => `<button class="tb-chip ${state.metal === m ? 'on' : ''}" data-act="metal" data-arg="${m}"><span class="sw" style="background:${m === 'Any' ? 'linear-gradient(135deg,#D9B46A,#D8DCDD,#D9A28F)' : METAL_SW[m]}"></span>${m}</button>`).join('')}</div></div>
        <div class="tb-group"><span class="tb-kicker grey">Price</span><div class="tb-chips">${['Any', ...Object.keys(PRICE_BANDS)].map(b => `<button class="tb-chip ${state.band === b ? 'on' : ''}" data-act="band" data-arg="${b}">${b}</button>`).join('')}</div></div>
        <div class="tb-help"><span class="tb-tile-title sm">Need help choosing?</span><span class="tb-muted dark">Chat with us on WhatsApp or book a visit to the studio.</span><a href="#/studio" class="tb-btn dark xs">Book a call</a></div>
      </aside>
      <div class="stack" style="gap:18px;min-width:0">
        <div class="tb-shop-bar"><span>${list.length} piece${list.length === 1 ? '' : 's'}</span><span class="tb-sort">Sort: Featured ▾</span></div>
        ${list.length ? '' : `<div class="tb-empty"><span class="tb-tile-title sm">Nothing matches those filters yet.</span><button class="tb-btn dark sm" data-act="clearAll">Clear filters</button></div>`}
        <div class="tb-grid three">${list.map(productCard).join('')}</div>
      </div>
    </section>`;
  }

  function product() {
    const p = byId(state.param) || REAL()[0];
    const sz = sizesOf(p);
    const fins = p.sw.map(k => ({ name: FINISH_OF[k], swatch: SW[k] }));
    const { finish, size, added } = state.pdp;
    const price = pdpPrice(p, finish, size);
    const imgs = (p.gallery || [p.img, p.img2]).slice(0, p.video ? 2 : 3);
    const pairs = REAL().filter(x => x.id !== p.id).sort((a, b) => (a.bullion === p.bullion) - (b.bullion === p.bullion)).slice(0, 4);
    return `
    <section class="tb-pdp">
      <div class="tb-gallery">
        ${imgs.map((s, i) => `<div class="tb-img ${i ? 'half' : 'main'}">${!i && p.tag ? `<span class="tb-tag">${p.tag}</span>` : ''}${photo(s, p.name + (i ? ' — view ' + (i + 1) : ''), !i)}</div>`).join('')}
        ${p.video ? `<div class="tb-img half"><video src="${p.video}" poster="${p.img}" autoplay muted loop playsinline aria-label="${esc(p.name)} video"></video></div>` : ''}
      </div>
      <div class="tb-buy">
        <span class="tb-crumb dark"><a href="#/shop">Shop</a> / <a href="#/shop/${p.cat}">${catLabel(p.cat)}</a></span>
        <h1 class="tb-h1 title">${esc(p.name)}</h1>
        <div class="tb-price-row"><span class="tb-price lg">${money(price)}</span><span class="tb-muted">${p.rating ? '★ ' + p.rating + ' · ' + p.reviews + ' reviews' : (p.bullion ? 'HST-exempt · insured delivery' : 'New in · no reviews yet')}</span></div>
        <p class="tb-body">${esc(p.desc)}</p>
        ${fins.length ? `<div class="tb-group"><div class="tb-opt-head"><span class="tb-kicker grey">Metal</span><span>${finish}</span></div>
          <div class="tb-chips">${fins.map(f => `<label class="tb-chip"><input type="radio" name="pfin" data-pdp="finish" value="${esc(f.name)}" ${finish === f.name ? 'checked' : ''}><span class="sw" style="background:${f.swatch}"></span>${f.name}</label>`).join('')}</div></div>` : ''}
        ${sz ? `<div class="tb-group"><div class="tb-opt-head"><span class="tb-kicker grey">${sz.label}${p.cat === 'Rings' ? ' (CA/US)' : ''}</span><a href="#/studio">Size guide</a></div>
          <div class="tb-chips">${sz.opts.map(v => `<label class="tb-chip size"><input type="radio" name="psize" data-pdp="size" value="${v}" ${size === v ? 'checked' : ''}>${v}</label>`).join('')}</div></div>` : ''}
        <button class="tb-btn dark block lg" data-act="addToBag">${added ? 'Added — view bag (' + totals().count + ')' : (isQuote(p) ? 'Reserve at today’s rate · ' : 'Add to bag · ') + money(price)}</button>
        <div class="tb-assure">${(p.perks || CONTENT.perks).map(k => `<span>${ICON.check}<span><b>${k.t}</b> · ${k.b}</span></span>`).join('')}</div>
        <div class="tb-acc">${(p.accordions || CONTENT.accordions).map((a, i) => (i === 0 && p.care ? { ...a, body: p.care } : a)).map((a, i) => `<button class="tb-acc-item" data-act="acc" data-arg="${i}" aria-expanded="${state.open === i}"><span class="tb-acc-head"><span>${a.title}</span><span>${state.open === i ? '−' : '+'}</span></span>${state.open === i ? `<p>${a.body}</p>` : ''}</button>`).join('')}</div>
      </div>
    </section>
    <section class="tb-sec">
      <div class="tb-sec-head"><h2 class="tb-h2">Pairs well with</h2><a href="#/shop" class="tb-more">See everything →</a></div>
      <div class="tb-grid four">${pairs.map(productCard).join('')}</div>
    </section>`;
  }

  function bag() {
    const t = totals();
    const pct = Math.min(100, t.goods / 150 * 100);
    return `
    <section class="tb-bagpage">
      <div class="stack" style="gap:20px;min-width:0">
        <div class="tb-bag-title"><h1 class="tb-h1 is-bag">Your bag</h1><span class="tb-muted">${t.count} item${t.count === 1 ? '' : 's'}</span></div>
        <div class="tb-meter"><span>${t.goods >= 150 ? 'You’ve unlocked free insured shipping across Canada.' : 'You’re ' + money(150 - t.goods) + ' away from free insured shipping.'}</span><div class="tb-meter-track"><div style="width:${pct}%"></div></div></div>
        ${t.lines.length ? '' : `<div class="tb-empty plain"><span class="tb-muted">Your bag is empty.</span><a href="#/shop" class="tb-btn dark sm">Shop the collection</a></div>`}
        ${t.lines.map(l => `<div class="tb-line-item">
          <a href="#/product/${l.id}" class="tb-img sq116">${photo(l.p.img, l.p.name)}</a>
          <div class="tb-line-info"><a href="#/product/${l.id}" class="tb-name">${esc(l.p.name)}</a><span class="tb-muted">${esc(l.variant)}</span>
            ${isQuote(l.p) ? `<span class="line-note">${ICON.shield} Reserved — price confirmed before payment</span>` : ''}
            <div class="tb-line-ctrl"><div class="tb-qty"><button data-act="qty" data-arg="${esc(l.key)}" data-d="-1" aria-label="Decrease">−</button><span>${l.qty}</span><button data-act="qty" data-arg="${esc(l.key)}" data-d="1" aria-label="Increase">+</button></div>
              <button class="tb-remove" data-act="remove" data-arg="${esc(l.key)}">Remove</button></div></div>
          <span class="tb-name">${money(l.sum)}</span></div>`).join('')}
        <button class="tb-gift ${state.gift ? 'on' : ''}" data-act="gift" aria-pressed="${state.gift}">
          <span class="tb-gift-l"><span class="tb-check">${state.gift ? ICON.check : ''}</span><span class="stack"><span class="tb-name sm">Gift wrap in our signature lilac box</span><span class="tb-muted">Ribbon + handwritten note · prices hidden</span></span></span><span class="tb-name sm">$6.00</span></button>
      </div>
      <aside class="tb-summary">
        <span class="tb-summary-title">Order summary</span>
        <div class="stack" style="gap:10px"><span class="tb-kicker light">Ship to province</span>
          <div class="tb-provs">${Object.keys(TAX).map(c => `<button class="${state.prov === c ? 'on' : ''}" data-act="prov" data-arg="${c}" aria-pressed="${state.prov === c}">${c}</button>`).join('')}</div></div>
        <div class="tb-rule"></div>
        <div class="tb-sumrow"><span>Subtotal</span><span>${money(t.goods)}</span></div>
        ${t.giftCost ? `<div class="tb-sumrow"><span>Gift wrap</span><span>${money(t.giftCost)}</span></div>` : ''}
        <div class="tb-sumrow"><span>Shipping · Canada Post</span><span>${t.shipping}</span></div>
        <div class="tb-sumrow"><span>${t.taxLabel}</span><span>${money(t.tax)}</span></div>
        <div class="tb-rule"></div>
        <div class="tb-total"><span>Total</span><span>${money(t.total)} <small>CAD</small></span></div>
        <form class="tb-promo" data-form="promo"><input placeholder="Promo code" aria-label="Promo code" data-model="promo" value="${esc(state.form.promo || '')}"><button type="submit">Apply</button></form>
        <a href="#/checkout" class="tb-btn lilac block lg ${t.count ? '' : 'disabled'}" ${t.count ? '' : 'aria-disabled="true" tabindex="-1"'}>Secure checkout</a>
        <div class="tb-summary-assure"><span>${ICON.check} Insured, signed delivery</span><span>${ICON.check} 30-day returns on jewellery</span><span>${ICON.check} Bullion is tax-exempt</span><span>${ICON.check} Pay by e-Transfer or card</span></div>
      </aside>
    </section>`;
  }
