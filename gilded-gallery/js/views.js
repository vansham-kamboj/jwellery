  /* ══ Gilded Gallery views — spliced into app.js; these declarations replace the defaults above. ══ */
  const REAL = () => PRODUCTS.filter(p => p.real);
  state.cart = state.cart.filter(l => byId(l.id) && byId(l.id).real);   // this design sells the real pieces only
  /* This design uses the warm cream studio backdrop instead of lavender. */
  const toCream = src => src.replace('-cut.jpg', '-cut-cream.jpg');
  REAL().forEach(p => { p.img = toCream(p.img); if (p.gallery) p.gallery = p.gallery.map(toCream); });
  const METALS = { Silver: ['silver', 'plainsilver', 'finesilver'], Gold: ['gold', 'finegold'], 'Rose gold': ['rose', 'rosetone'] };
  const metalOf = p => Object.keys(METALS).filter(m => p.sw.some(k => METALS[m].includes(k)));
  const shopCats = () => ['All', ...new Set(REAL().map(p => p.cat))];
  const catLabel = c => c === 'Bullion' ? 'Gold & silver' : c === 'All' ? 'Everything' : c;
  const countIn = c => REAL().filter(p => c === 'All' || p.cat === c).length;
  const no = n => '№ ' + String(n).padStart(2, '0');
  const SORTS = { Featured: null, 'Price: low to high': (a, b) => a.price - b.price, 'Price: high to low': (a, b) => b.price - a.price };
  Object.assign(BLURB, {
    All: 'Hand-set silver jewellery and Royal Canadian Mint gold and silver, chosen piece by piece in our Toronto studio.',
    Rings: 'Statement pieces, solitaires and stackers in silver, set with cubic zirconia. Canadian sizes 5 to 9.',
    Earrings: 'Studs that sit close and catch the light — easy from morning to evening.',
    Bullion: 'Royal Canadian Mint coins and bars in 999.9 fine gold and silver — sealed, serial-numbered and HST-exempt.'
  });
  Object.assign(state, { metal: 'All', sort: 'Featured', homeTab: 'All' });
  const ggAdd = id => state.justAdded[id] ? 'Added ' + ICON.check : (isQuote(byId(id)) ? 'Reserve' : '+ Add');
  const SPARK = svg('<path d="M12 2l1.8 6.6L20 10l-6.2 1.6L12 18l-1.8-6.4L4 10l6.2-1.4z" fill="currentColor" stroke="none"/>', 14);
  const GG_ICONS = {
    seal: svg('<path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>', 24),
    truck: svg('<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>', 24),
    back: svg('<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 010 10h-3"/>', 24),
    ring: svg('<circle cx="12" cy="14" r="6"/><path d="M9 5l3-3 3 3-3 3z"/>', 24)
  };

  /* Rotating seal: text on a circle, drawn as SVG. */
  const seal = text => `<svg class="gg-seal" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="gg-circ" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"/></defs>
    <text><textPath href="#gg-circ" startOffset="0">${text}</textPath></text><g transform="translate(48 48)" class="gg-seal-core">${SPARK.replace('width="14" height="14"', 'width="24" height="24"')}</g></svg>`;

  function header() {
    const t = totals();
    if (state.route === 'checkout') {
      return `<header class="gg-head slim"><a href="#/" class="gg-logo" aria-label="Avya Jewels home">${logo('')}</a><span class="gg-small-caps">Secure checkout</span><a href="#/bag" class="gg-textlink">Back to bag</a></header>`;
    }
    const inShop = state.route === 'shop';
    const nav = [['Jewellery', '#/shop/Rings', inShop && state.filter !== 'Bullion'], ['Gold & silver', '#/shop/Bullion', inShop && state.filter === 'Bullion'],
      ['Diwali', '#/product/diwali-10g-gold-bars', false], ['Bespoke', '#/custom', state.route === 'custom'], ['Studio', '#/studio', state.route === 'studio']];
    const tick = CONTENT.announce.map(a => `<span>${a}</span>${SPARK}`).join('');
    return `<div class="gg-ticker" aria-label="${CONTENT.announce.join(' · ')}"><div class="gg-ticker-track" aria-hidden="true">${tick}${tick}${tick}</div></div>
      <header class="gg-head">
        <a href="#/" class="gg-logo" aria-label="Avya Jewels home">${logo('')}</a>
        <nav class="gg-nav ${state.navOpen ? 'open' : ''}" id="nav-links" aria-label="Main">${nav.map(([l, h, on]) => `<a href="${h}" ${on ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
        <div class="gg-tools">
          <a href="#/shop" class="gg-icon" aria-label="Browse everything">${svg('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>', 20)}</a>
          <a href="#/bag" class="gg-bagbtn" aria-label="Bag, ${t.count} items">${svg('<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6a3 3 0 016 0v2"/>', 20)}<span>${t.count}</span></a>
          <button class="gg-burger" data-act="toggleNav" aria-label="Menu" aria-expanded="${state.navOpen}" aria-controls="nav-links">${state.navOpen ? ICON.close : ICON.menu}</button>
        </div>
      </header>`;
  }

  function footer() {
    return `<footer class="gg-foot">
      <div class="gg-foot-top">
        <div class="gg-foot-news"><h2 class="gg-h2">Letters from the studio</h2><p>New pieces, Diwali gifting and gold-rate notes — once a month, never more.</p>
          <form class="gg-news" data-form="newsletter"><input type="email" required placeholder="Your email" aria-label="Email address" data-model="newsletter" value="${esc(state.form.newsletter)}"><button class="gg-btn gold" type="submit">Subscribe</button></form></div>
        ${CONTENT.footerCols.map(col => `<div class="gg-foot-col"><span class="gg-small-caps">${col.h}</span>${col.links.map(([l, h]) => `<a href="${h}">${l}</a>`).join('')}</div>`).join('')}
      </div>
      <div class="gg-foot-mark">${logo('')}</div>
      <div class="gg-foot-base"><span>© 2026 Avya Jewels · 1082 Queen St W, Toronto</span><span>Prices in CAD</span></div>
    </footer>`;
  }

  function productCard(p, i) {
    return `<div class="gg-card">
      <a href="#/product/${p.id}" class="gg-arch">${p.tag ? `<span class="gg-tag">${p.tag}</span>` : ''}${photo(p.img, p.name)}</a>
      <div class="gg-card-meta">${typeof i === 'number' ? `<span class="gg-no">${no(i + 1)}</span>` : ''}<a href="#/product/${p.id}" class="gg-card-name">${esc(p.name)}</a>
        <span class="gg-card-mat">${esc(p.material)}</span>
        <span class="gg-card-row"><span class="gg-price">${cad(p.price)}</span><button class="gg-add ${state.justAdded[p.id] ? 'on' : ''}" data-act="quickAdd" data-arg="${p.id}">${ggAdd(p.id)}</button></span></div>
    </div>`;
  }

  function home() {
    const big = byId('starflower-ring') || byId('cluster-halo-ring') || REAL()[0];
    const coin = byId('maple-leaf-1oz-coin') || REAL()[1];
    const edit = ['floral-halo-ring', 'ruby-red-statement-ring', 'ribbon-solitaire-ring', 'wing-ring', 'ivy-halo-band', 'swirl-solitaire-ring', 'pear-laurel-ring', 'crossover-statement-ring'].map(byId).filter(Boolean);
    const index = [
      ['Rings', '#/shop/Rings', 'laurel-halo-ring', countIn('Rings')],
      ['Earrings', '#/shop/Earrings', 'emerald-halo-studs', countIn('Earrings')],
      ['Gold bars', '#/shop/Bullion', 'rcm-100g-gold-bar', REAL().filter(p => p.bullion && p.metal === 'gold' && !/coin/.test(p.id)).length],
      ['Gold coins', '#/product/maple-leaf-1oz-coin', 'maple-leaf-1oz-coin', REAL().filter(p => /coin/.test(p.id)).length],
      ['Silver bars', '#/shop/Bullion', 'rcm-100oz-silver-bar', REAL().filter(p => p.bullion && p.metal === 'silver').length],
      ['Diwali gifts', '#/product/diwali-10g-gold-bars', 'diwali-10g-gold-bars', REAL().filter(p => /diwali/.test(p.id)).length]
    ].filter(r => byId(r[2]));
    const bar = byId(state.barPick) || byId(GOLD.featured[0]);
    const gifts = ['diwali-10g-gold-bars', 'pear-branch-ring'].map(byId).filter(Boolean);
    const promises = [['seal', 'Certified gold', 'Royal Canadian Mint, sealed in assay'], ['truck', 'Insured delivery', 'Free across Canada over $150'], ['back', '30-day returns', 'On unworn jewellery'], ['ring', 'Free resizing', 'Within 60 days of delivery']];
    return `
    <section class="gg-hero">
      <div class="gg-hero-copy">
        <span class="gg-small-caps gold">Avya Jewels · Toronto</span>
        <h1 class="gg-h1">Jewels to wear.<br><span class="gg-gilt">Gold to keep.</span></h1>
        <p class="gg-lead">Hand-set silver jewellery and Royal Canadian Mint gold — chosen piece by piece, shipped insured across Canada.</p>
        <div class="gg-ctas"><a href="#/shop/Rings" class="gg-btn gold">Shop jewellery</a><a href="#/shop/Bullion" class="gg-btn line">Gold &amp; silver</a></div>
      </div>
      <div class="gg-hero-stage">
        <span class="gg-halo" aria-hidden="true"></span>
        <a href="#/product/${big.id}" class="gg-arch gg-hero-arch" aria-label="${esc(big.name)}">${photo(big.img2 && big.img2.includes('/ivory/') ? big.img2 : big.img, big.name, true)}</a>
        <a href="#/product/${big.id}" class="gg-hero-label"><span class="gg-no">${no(1)}</span><span>${esc(big.name)}</span><span class="gg-price">${cad(big.price)}</span></a>
      </div>
      <div class="gg-hero-side">
        <div class="gg-side-wrap">
          <a href="#/product/${coin.id}" class="gg-arch gg-side-arch" aria-label="${esc(coin.name)}">${photo(coin.img, coin.name, true)}</a>
          ${seal('ROYAL CANADIAN MINT · CERTIFIED GOLD · ')}
        </div>
        <p class="gg-side-cap">The ${esc(coin.name.replace(' · 1 oz', ''))}, 1 oz of single-mine Canadian gold.</p>
        <a href="#/product/${coin.id}" class="gg-textlink">Discover · ${cad(coin.price)}</a>
      </div>
    </section>

    <div class="gg-marquee" aria-hidden="true"><div class="gg-marquee-track">${[0, 1].map(() => index.map(r => `<span>${r[0]}</span>${SPARK}`).join('')).join('')}</div></div>

    <section class="gg-sec">
      <div class="gg-sec-head">
        <div><span class="gg-small-caps gold">The edit · ${edit.length} pieces</span><h2 class="gg-h2">Chosen this season</h2></div>
        <div class="gg-arrows"><button class="gg-round" data-act="scrollEdit" data-arg="-1" aria-label="Previous pieces">${svg('<path d="M15 6l-6 6 6 6"/>', 18)}</button><button class="gg-round" data-act="scrollEdit" data-arg="1" aria-label="Next pieces">${svg('<path d="M9 6l6 6-6 6"/>', 18)}</button></div>
      </div>
      <div class="gg-rail" id="gg-rail">${edit.map(productCard).join('')}</div>
    </section>

    <section class="gg-sec gg-index-sec">
      <div class="gg-sec-head"><div><span class="gg-small-caps gold">Index</span><h2 class="gg-h2">Browse the collection</h2></div><a href="#/shop" class="gg-textlink">View everything</a></div>
      <ol class="gg-index">${index.map(([n, h, id, c], i) => `<li><a href="${h}"><span class="gg-no">${no(i + 1)}</span><span class="gg-index-name">${n}</span><span class="gg-index-count">${c} piece${c === 1 ? '' : 's'}</span><span class="gg-index-peek">${photo(byId(id).img, n)}</span><span class="gg-index-arrow">${ICON.arrow}</span></a></li>`).join('')}</ol>
    </section>

    ${bar ? `<section class="gg-desk" id="gold-bars">
      <div class="gg-desk-copy">
        <span class="gg-small-caps gold">The gold desk</span>
        <h2 class="gg-h2">Royal Canadian Mint gold, at today’s rate.</h2>
        <div class="gg-weights" role="group" aria-label="Choose a coin or bar">${GOLD.featured.map(byId).filter(Boolean).map(b => `<button class="${b.id === bar.id ? 'on' : ''}" data-act="barPick" data-arg="${b.id}" aria-pressed="${b.id === bar.id}">${b.short}</button>`).join('')}</div>
        <div class="gg-desk-price"><span class="gg-desk-name">${esc(bar.name)}</span><strong>${cad(bar.price)}</strong><small>${METAL.example ? 'Example rate' : 'Today’s rate'} · updated ${METAL.updated} · HST-exempt</small></div>
        <div class="gg-ctas"><button class="gg-btn gold" data-act="quickAdd" data-arg="${bar.id}">${state.justAdded[bar.id] ? (isQuote(bar) ? 'Reserved ' : 'Added ') + ICON.check : (isQuote(bar) ? 'Reserve at today’s rate' : 'Add to bag')}</button><a href="#/shop/Bullion" class="gg-btn line">All gold &amp; silver</a></div>
        ${isQuote(bar) ? `<p class="gg-note">${ICON.shield}<span>Orders over $${quoteLimit.toLocaleString('en-CA')} are reserved, not charged — we confirm the final price before you pay.</span></p>` : ''}
      </div>
      <a href="#/product/${bar.id}" class="gg-arch gg-desk-arch" aria-label="${esc(bar.name)}">${photo(bar.img, bar.name)}</a>
    </section>` : ''}

    ${gifts.length === 2 ? `<section class="gg-diwali">
      <div class="gg-diwali-copy"><span class="gg-small-caps gold">Diwali · Festival of lights</span><h2 class="gg-h2">A little gold for every lamp you light.</h2>
        <p class="gg-lead">A 10 g Royal Canadian Mint bar in its festive card, or a silver ring she’ll wear long after the season. Gift-wrapped free until November 1.</p>
        <a href="#/product/${gifts[0].id}" class="gg-btn gold">Shop Diwali gifts</a></div>
      <div class="gg-diwali-picks">${gifts.map(p => productCard(p)).join('')}</div>
    </section>` : ''}

    <section class="gg-promises">${promises.map(([ic, t, b]) => `<div><span class="gg-promise-ic">${GG_ICONS[ic]}</span><span class="gg-promise-t">${t}</span><span class="gg-promise-b">${b}</span></div>`).join('')}</section>

    <section class="gg-sec">
      <div class="gg-sec-head center"><span class="gg-small-caps gold">Kind words</span><h2 class="gg-h2">Worn and gifted across Canada</h2></div>
      <div class="gg-quotes">${CONTENT.reviews.map(r => `<figure class="gg-quote"><span class="gg-quote-mark" aria-hidden="true">“</span>${stars(5)}<blockquote>${r.q}</blockquote><figcaption><b>${r.n}</b> · ${r.c}<br><span>${r.p}</span></figcaption></figure>`).join('')}</div>
    </section>`;
  }

  function shop() {
    const cats = shopCats();
    if (!cats.includes(state.filter)) state.filter = 'All';
    let list = REAL().filter(p => (state.filter === 'All' || p.cat === state.filter) && (state.metal === 'All' || metalOf(p).includes(state.metal)));
    if (SORTS[state.sort]) list = list.slice().sort(SORTS[state.sort]);
    return `
    <section class="gg-shop-head">
      <span class="gg-small-caps gold">Shop · ${catLabel(state.filter)}</span>
      <h1 class="gg-h1 shop">${state.filter === 'All' ? 'The collection' : catLabel(state.filter)}</h1>
      <p class="gg-lead">${BLURB[state.filter] || BLURB.All}</p>
    </section>
    <div class="gg-toolbar">
      <div class="gg-tabs">${cats.map(c => `<button class="${state.filter === c ? 'on' : ''}" data-act="filter" data-arg="${c}">${catLabel(c)}<sup>${countIn(c)}</sup></button>`).join('')}</div>
      <div class="gg-tool-right">
        <div class="gg-toggle" role="group" aria-label="Metal">${['All', ...Object.keys(METALS)].map(m => `<button class="${state.metal === m ? 'on' : ''}" data-act="metal" data-arg="${m}" aria-pressed="${state.metal === m}">${m === 'All' ? 'All metals' : m}</button>`).join('')}</div>
        <label class="gg-sort"><span class="gg-small-caps">Sort</span><select data-set="sort" aria-label="Sort">${Object.keys(SORTS).map(s => `<option ${state.sort === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
      </div>
    </div>
    <section class="gg-grid">${list.map(productCard).join('')}</section>
    ${list.length ? '' : `<div class="gg-empty"><h2 class="gg-h2 sm">Nothing in that metal yet.</h2><button class="gg-btn line" data-act="metal" data-arg="All">Show all metals</button></div>`}`;
  }

  function product() {
    const p = byId(state.param) || REAL()[0];
    const sz = sizesOf(p);
    const fins = p.sw.map(k => ({ name: FINISH_OF[k], swatch: SW[k] }));
    const { finish, size, added } = state.pdp;
    const price = pdpPrice(p, finish, size);
    const media = (p.gallery || [p.img, p.img2]).map(src => ({ src })).concat(p.video ? [{ src: p.img, video: p.video }] : []);
    const cur = Math.min(state.view || 0, media.length - 1);
    const m = media[cur];
    const more = REAL().filter(x => x.id !== p.id).sort((a, b) => (a.bullion === p.bullion ? -1 : 1) - (b.bullion === p.bullion ? -1 : 1)).slice(0, 4);
    return `
    <section class="gg-pdp">
      <div class="gg-thumbs" role="group" aria-label="Images">${media.map((x, i) => `<button class="${i === cur ? 'on' : ''}" data-act="view" data-arg="${i}" aria-label="${x.video ? 'Play video' : 'View image ' + (i + 1)}">${photo(x.src, '')}${x.video ? `<span class="gg-play">${svg('<path d="M8 5l11 7-11 7z" fill="currentColor" stroke="none"/>', 14)}</span>` : ''}</button>`).join('')}</div>
      <div class="gg-arch gg-pdp-arch">${p.tag ? `<span class="gg-tag">${p.tag}</span>` : ''}${m.video ? `<video src="${m.video}" poster="${m.src}" autoplay muted loop playsinline aria-label="${esc(p.name)} video"></video>` : photo(m.src, p.name, true)}</div>
      <div class="gg-buy">
        <span class="gg-small-caps gold">${p.bullion ? 'Royal Canadian Mint · Sealed' : catLabel(p.cat) + ' · Ready to ship'}</span>
        <h1 class="gg-h1 title">${esc(p.name)}</h1>
        <div class="gg-price-line"><span class="gg-price lg">${money(price)}</span><span class="gg-muted">${p.rating ? '★ ' + p.rating + ' · ' + p.reviews + ' reviews' : (p.bullion ? 'HST-exempt · insured delivery' : 'New in · no reviews yet')}</span></div>
        <p class="gg-body">${esc(p.desc)}</p>
        ${fins.length ? `<div class="gg-opt"><span class="gg-small-caps">Metal — <b>${finish}</b></span><div class="gg-chips">${fins.map(f => `<label class="gg-chip"><input type="radio" name="pfin" data-pdp="finish" value="${esc(f.name)}" ${finish === f.name ? 'checked' : ''}><span class="sw" style="background:${f.swatch}"></span>${f.name}</label>`).join('')}</div></div>` : ''}
        ${sz ? `<div class="gg-opt"><span class="gg-small-caps">${sz.label} — <b>${size}</b> <a href="#/studio" class="gg-textlink sm">Size guide</a></span><div class="gg-chips">${sz.opts.map(v => `<label class="gg-chip round"><input type="radio" name="psize" data-pdp="size" value="${v}" ${size === v ? 'checked' : ''}>${v}</label>`).join('')}</div></div>` : ''}
        <button class="gg-btn gold block lg" data-act="addToBag">${added ? 'Added — view bag (' + totals().count + ')' : (isQuote(p) ? 'Reserve at today’s rate · ' : 'Add to bag · ') + money(price)}</button>
        <ul class="gg-perks">${(p.perks || CONTENT.perks).map(k => `<li>${SPARK}<span><b>${k.t}</b> — ${k.b}</span></li>`).join('')}</ul>
        <div class="gg-acc">${(p.accordions || CONTENT.accordions).map((a, i) => (i === 0 && p.care ? { ...a, body: p.care } : a)).map((a, i) => `<button class="gg-acc-item" data-act="acc" data-arg="${i}" aria-expanded="${state.open === i}"><span class="gg-acc-head"><span>${a.title}</span><span class="pm">${state.open === i ? '−' : '+'}</span></span>${state.open === i ? `<p>${a.body}</p>` : ''}</button>`).join('')}</div>
      </div>
    </section>
    <section class="gg-sec">
      <div class="gg-sec-head"><div><span class="gg-small-caps gold">You may also love</span><h2 class="gg-h2">From the same case</h2></div><a href="#/shop" class="gg-textlink">View everything</a></div>
      <div class="gg-grid four">${more.map(x => productCard(x)).join('')}</div>
    </section>`;
  }

  function bag() {
    const t = totals();
    const pct = Math.min(100, t.goods / 150 * 100);
    return `
    <section class="gg-bagpage">
      <div class="gg-bag-list">
        <div class="gg-bag-title"><h1 class="gg-h1 title">Your bag</h1><span class="gg-muted">${t.count} item${t.count === 1 ? '' : 's'}</span></div>
        <div class="gg-meter"><span>${t.goods >= 150 ? 'Free insured shipping unlocked.' : money(150 - t.goods) + ' away from free insured shipping.'}</span><span class="gg-meter-bar"><span style="width:${pct}%"></span></span></div>
        ${t.lines.length ? '' : `<div class="gg-empty"><h2 class="gg-h2 sm">Your bag is waiting.</h2><a href="#/shop" class="gg-btn gold">Browse the collection</a></div>`}
        ${t.lines.map(l => `<div class="gg-line">
          <a href="#/product/${l.id}" class="gg-arch gg-line-arch">${photo(l.p.img, l.p.name)}</a>
          <div class="gg-line-info"><a href="#/product/${l.id}" class="gg-card-name">${esc(l.p.name)}</a><span class="gg-muted">${esc(l.variant)}</span>
            ${isQuote(l.p) ? `<span class="line-note">${ICON.shield} Reserved — price confirmed before payment</span>` : ''}
            <span class="gg-line-ctrl"><span class="gg-qty"><button data-act="qty" data-arg="${esc(l.key)}" data-d="-1" aria-label="Decrease">−</button><span>${l.qty}</span><button data-act="qty" data-arg="${esc(l.key)}" data-d="1" aria-label="Increase">+</button></span>
              <button class="gg-textlink sm" data-act="remove" data-arg="${esc(l.key)}">Remove</button></span></div>
          <span class="gg-price">${money(l.sum)}</span></div>`).join('')}
        <button class="gg-giftwrap ${state.gift ? 'on' : ''}" data-act="gift" aria-pressed="${state.gift}"><span class="gg-box">${state.gift ? ICON.check : ''}</span><span class="stack"><b>Gift-wrap in our gold-ribbon box</b><span class="gg-muted">Handwritten note · prices hidden · $6.00</span></span></button>
      </div>
      <aside class="gg-receipt">
        <div class="gg-receipt-head">${logo('')}<span class="gg-small-caps">Order summary</span></div>
        ${t.lines.map(l => `<div class="gg-rrow"><span>${esc(l.p.name)} × ${l.qty}</span><i></i><span>${money(l.sum)}</span></div>`).join('')}
        <div class="gg-rule"></div>
        <div class="gg-rrow"><span>Subtotal</span><i></i><span>${money(t.goods)}</span></div>
        ${t.giftCost ? `<div class="gg-rrow"><span>Gift wrap</span><i></i><span>${money(t.giftCost)}</span></div>` : ''}
        <div class="gg-rrow"><span>Shipping</span><i></i><span>${t.shipping}</span></div>
        <div class="gg-rrow"><span>HST (ON, 13%)</span><i></i><span>${money(t.tax)}</span></div>
        <div class="gg-rule"></div>
        <div class="gg-rtotal"><span>Total</span><span>${money(t.total)} <small>CAD</small></span></div>
        <form class="gg-promo" data-form="promo"><input placeholder="Promo code" aria-label="Promo code" data-model="promo" value="${esc(state.form.promo || '')}"><button type="submit">Apply</button></form>
        <a href="#/checkout" class="gg-btn gold block lg ${t.count ? '' : 'disabled'}" ${t.count ? '' : 'aria-disabled="true" tabindex="-1"'}>Secure checkout</a>
        <p class="gg-receipt-foot">Insured, signed delivery · 30-day returns on jewellery · Bullion is HST-exempt</p>
      </aside>
    </section>`;
  }
