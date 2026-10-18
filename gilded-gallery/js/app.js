/* Avya — tiny hash-routed storefront. State lives here; every change re-renders #app. */
(() => {
  const money = n => '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const cad = n => '$' + n.toLocaleString('en-CA');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const byId = id => PRODUCTS.find(p => p.id === id);
  const href = id => '#/product/' + id;
  const sizesOf = p => p.sizes === false ? null : (p.sizes || SIZES[p.cat] || null);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('aurelle.' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('aurelle.' + k, JSON.stringify(v)); } catch { /* storage unavailable */ } }
  };

  const DEFAULT_CART = [];

  const state = {
    route: 'home', param: null, navOpen: false, filtersOpen: false, draft: { filter: 'All', ffin: 'Any' },
    filter: 'All', ffin: 'Any', homeTab: 'All', barPick: GOLD.featured[1],
    pdp: { id: null, finish: null, size: null, added: false }, open: 0,
    justAdded: {}, gift: false, cart: store.get('cart', DEFAULT_CART).filter(l => byId(l.id)),
    ship: 'std', promo: '',
    ptype: 'Ring', bfin: 'Gold vermeil', budget: '$150–300', submitted: false,
    day: 'Sat', slot: null, booked: false,
    form: { name: '', email: '', idea: '', newsletter: '' }
  };

  function set(patch) {
    Object.assign(state, typeof patch === 'function' ? patch(state) : patch);
    store.set('cart', state.cart);
    render();
  }

  let toastTimer;
  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  /* Drawn icons — one stroke weight, currentColor. */
  const svg = (d, size = 16, extra = '') => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
  const ICON = {
    check: svg('<path d="M5 12.5l4.2 4.2L19 7"/>', 14),
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>', 16),
    menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>', 20),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>', 20),
    gem: svg('<path d="M12 3l6 9-6 9-6-9z" fill="currentColor" stroke="none"/>', 8),
    star: svg('<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z" fill="currentColor" stroke="none"/>', 15),
    shield: svg('<path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>', 18)
  };
  const stars = n => `<span class="stars" role="img" aria-label="${n} out of 5 stars">${ICON.star.repeat(n)}</span>`;

  /* High-value bullion is reserved one at a time; the team confirms the price before payment. */
  const quoteLimit = typeof QUOTE_ABOVE === 'number' ? QUOTE_ABOVE : Infinity;
  const isQuote = p => !!(p && p.bullion && p.price >= quoteLimit);
  const tooMany = id => isQuote(byId(id)) && state.cart.some(l => l.id === id);
  const quoteNote = p => `For more than one ${p.short || p.name}, request a quote — we’ll confirm today’s price.`;

  /* ── Cart maths ─────────────────────────────────────────────────────── */
  function addLine(id, variant, price) {
    const key = id + '|' + variant;
    const ex = state.cart.find(l => l.key === key);
    return ex ? state.cart.map(l => l.key === key ? { ...l, qty: l.qty + 1 } : l)
              : [...state.cart, { key, id, variant, qty: 1, price }];
  }
  function quickAdd(id) {
    const p = byId(id);
    if (tooMany(id)) { toast(quoteNote(p)); return; }
    set({ cart: addLine(id, p.material, p.price), justAdded: { ...state.justAdded, [id]: true } });
    toast(isQuote(p) ? p.name + ' reserved at today’s rate' : p.name + ' added to your bag');
  }
  function totals() {
    const lines = state.cart.map(l => ({ ...l, p: byId(l.id), sum: l.price * l.qty }));
    const goods = lines.reduce((a, l) => a + l.sum, 0);
    const giftCost = state.gift && lines.length ? 6 : 0;
    const opt = SHIP.find(o => o.id === state.ship);
    const shipCost = goods === 0 ? 0 : (opt.id === 'std' && goods >= 150 ? 0 : opt.price);
    const taxable = lines.filter(l => !(l.p && l.p.taxExempt)).reduce((a, l) => a + l.sum, 0);
    const tax = (taxable + giftCost + shipCost) * 0.13;   // investment gold bars are HST-exempt
    return {
      lines, goods, giftCost, opt, shipCost, tax,
      total: goods + giftCost + shipCost + tax,
      count: lines.reduce((a, l) => a + l.qty, 0),
      shipping: shipCost === 0 ? (opt.id === 'pick' ? 'Pickup' : 'Free') : money(shipCost)
    };
  }
  function pdpPrice(p, finish, size) {
    let price = p.price;
    const sz = sizesOf(p);
    if (sz && sz.opts.indexOf(size) === sz.opts.length - 1 && p.cat !== 'Rings') price += 10;
    if (p.sw.length > 1 && finish === 'Sterling silver' && p.fin !== 'silver') price -= 14;
    if (p.sw.length > 1 && finish !== 'Sterling silver' && p.fin === 'silver') price += 14;
    return price;
  }

  /* ── Partials ───────────────────────────────────────────────────────── */
  const photo = (src, alt, eager) => `<img src="${src}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
  const ph = (label, cls = '', extra = '', src = LABEL_IMG[label]) =>
    `<div class="ph ${cls}">${extra}${src ? photo(src, label, cls.includes('eager')) : `<span class="ph-label">${esc(label)}</span>`}</div>`;
  const eyebrow = t => `<span class="eyebrow">${t}</span>`;
  const secHead = (eb, title, right = '') => `<div class="sec-head"><div class="stack">${eyebrow(eb)}<h2>${title}</h2></div>${right}</div>`;
  const radio = (key, value, label, inner = '') =>
    `<label class="seg-opt"><input type="radio" name="${key}" data-set="${key}" value="${esc(value)}" ${state[key] === value ? 'checked' : ''}>${inner}${esc(label)}</label>`;

  const addBtn = (id, extra = '') => `<button class="btn btn-add ${state.justAdded[id] ? 'on' : ''}" ${extra} data-act="quickAdd" data-arg="${id}">${state.justAdded[id] ? 'Added ' + ICON.check : 'Add'}</button>`;

  function productCard(p) {
    return `<div class="p-card">
      <a href="#/product/${p.id}" class="ph" aria-label="${esc(p.name)}">${p.tag ? `<span class="tag tag-accent">${p.tag}</span>` : ''}${photo(p.img, p.name)}</a>
      <div class="row-info">
        <a href="#/product/${p.id}" class="info"><span class="name">${esc(p.name)}</span><span class="sub">${cad(p.price)} · ${esc(p.material)}</span></a>
        ${addBtn(p.id)}
      </div>
    </div>`;
  }

  const logo = cls => `<img src="${BRAND.logo}" alt="Avya Jewels" class="${cls}" width="420" height="191">`;

  function header() {
    const t = totals();
    const cur = r => state.route === r ? 'aria-current="page"' : '';
    if (state.route === 'checkout') {
      return `<header class="site-header"><nav class="nav">
        <a href="#/" class="nav-brand" aria-label="Avya Jewels home">${logo('')}</a>
        <span class="steps-nav"><span class="on">Bag</span><span class="line on"></span><span class="on">Details</span><span class="line"></span><span style="color:var(--color-neutral-500)">Confirmation</span></span>
        <a href="#/bag" style="margin-left:40px;font-size:14px">← Back to bag</a></nav></header>`;
    }
    return `<div class="announce">${CONTENT.announce.map(a => `<span>${a}</span>`).join(`<span class="gem">${ICON.gem}</span>`)}</div>
      <header class="site-header"><nav class="nav" aria-label="Main">
        <a href="#/" class="nav-brand" aria-label="Avya Jewels home">${logo('')}</a>
        <div class="nav-links ${state.navOpen ? 'open' : ''}" id="nav-links">
          <a href="#/shop/Rings" ${state.route === 'shop' && state.filter !== 'Bullion' ? 'aria-current="page"' : ''}>Jewellery</a><a href="#/shop/Bullion" ${state.route === 'shop' && state.filter === 'Bullion' ? 'aria-current="page"' : ''}>Gold &amp; silver</a><a href="#/gift">Diwali gifts</a><a href="#/custom" ${cur('custom')}>Bespoke</a>
          <span class="nav-sep"></span><a href="#/studio" ${cur('studio')}>Studio</a>
        </div>
        <a href="#/bag" class="btn btn-secondary btn-sm bag-btn">Bag · ${t.count}</a>
        <button class="btn btn-secondary btn-icon nav-toggle" data-act="toggleNav" aria-label="Menu" aria-expanded="${state.navOpen}" aria-controls="nav-links">${state.navOpen ? ICON.close : ICON.menu}</button>
      </nav></header>`;
  }

  function footer() {
    return `<footer class="footer">
      <div class="footer-grid">
        <div class="stack" style="gap:18px">${logo('footer-logo')}
          <span class="footer-blurb">New pieces, Diwali gifting and gold-rate notes — once a month, never more.</span>
          <form class="newsletter" data-form="newsletter"><input class="input" type="email" required placeholder="Email address" aria-label="Email address" data-model="newsletter" value="${esc(state.form.newsletter)}"><button class="btn btn-primary" type="submit">Subscribe</button></form></div>
        ${CONTENT.footerCols.map(col => `<div class="footer-col"><h3 class="footer-h">${col.h}</h3>
          ${col.links.map(([l, h]) => `<a href="${h}">${l}</a>`).join('')}</div>`).join('')}
      </div>
      <div class="footer-base"><span>© 2026 Avya Jewels · 1082 Queen St W, Toronto ON</span><nav aria-label="Legal"><a href="#/">Terms</a><a href="#/">Privacy</a><a href="#/">Returns policy</a></nav></div>
    </footer>`;
  }

  /* ── Pages ──────────────────────────────────────────────────────────── */
  function home() {
    const tab = state.homeTab;
    const picks = (CONTENT.homeTabs[tab] ? CONTENT.homeTabs[tab].map(byId) : PRODUCTS.filter(p => p.cat === tab && p.real).slice(0, 4)).filter(Boolean);
    const wear = byId('cluster-halo-ring') || PRODUCTS[0];
    const keep = byId('maple-leaf-1oz-coin') || PRODUCTS[0];
    const bar = byId(state.barPick) || byId(GOLD.featured[0]);
    const gifts = ['diwali-10g-gold-bars', 'pink-oval-ring'].map(byId).filter(Boolean);
    const quote = bar && isQuote(bar);
    return `
    <section class="paths">
      <div class="paths-intro">
        <h1>Fine silver to wear. Certified gold to keep.</h1>
        <p>Hand-set silver jewellery and Royal Canadian Mint gold and silver, chosen in our Toronto studio and shipped insured across Canada.</p>
      </div>
      <a class="path" href="#/shop/Rings">
        <div class="ph path-img">${photo(wear.img, wear.name, true)}</div>
        <div class="path-copy"><h2>Wear it</h2><p>Silver rings and earrings set with cubic zirconia, from $48.</p><span class="path-cta">Shop jewellery ${ICON.arrow}</span></div>
      </a>
      <a class="path" href="#/shop/Bullion">
        <div class="ph path-img">${photo(keep.img, keep.name, true)}</div>
        <div class="path-copy"><h2>Keep it</h2><p>Gold and silver coins and bars from the Royal Canadian Mint, sealed and HST-exempt.</p><span class="path-cta">Shop gold &amp; silver ${ICON.arrow}</span></div>
      </a>
    </section>

    <section class="section">
      <div class="sec-head"><h2>New arrivals</h2>
        <div class="seg" role="radiogroup" aria-label="Show">${Object.keys(CONTENT.homeTabs).map(t => radio('homeTab', t, t)).join('')}</div></div>
      <div class="product-grid four">${picks.map(productCard).join('')}</div>
      <a href="#/shop/Rings" class="link-more">See all jewellery ${ICON.arrow}</a>
    </section>

    ${gifts.length === 2 ? `<section class="gift" id="gift">
      <div class="gift-copy">
        <h2>Gold for Diwali, silver for every day.</h2>
        <p>A 10 g Royal Canadian Mint bar in its festive card, or a ring she’ll wear long after the lights come down. Gift-wrapped free until November 1.</p>
        <a href="#/product/${gifts[0].id}" class="btn btn-primary btn-lg">Shop Diwali gifts</a>
      </div>
      <div class="gift-picks">${gifts.map(productCard).join('')}</div>
    </section>` : ''}

    ${bar ? `<section class="gold-bars" id="gold-bars">
      <div class="stack" style="gap:24px">
        <h2>Royal Canadian Mint gold, priced at today’s rate.</h2>
        <p>999.9 fine gold coins and bars, sealed in their original assay with a serial number. Choose a size to see today’s price.</p>
        <div class="weights" role="group" aria-label="Choose a coin or bar">${GOLD.featured.map(byId).filter(Boolean).map(b => `<button class="weight" data-act="barPick" data-arg="${b.id}" aria-pressed="${b.id === bar.id}">${b.short}</button>`).join('')}</div>
        <div class="bar-buy">
          <div class="bar-price"><span class="bar-name">${esc(bar.name)}</span><strong>$${bar.price.toLocaleString('en-CA')}</strong>
            <small>${METAL.example ? 'Example rate' : 'Today’s rate'} · updated ${METAL.updated} · HST-exempt</small></div>
          <button class="btn btn-primary btn-lg" data-act="quickAdd" data-arg="${bar.id}">${state.justAdded[bar.id] ? (quote ? 'Reserved ' : 'Added ') + ICON.check : (quote ? 'Reserve at today’s rate' : 'Add to bag')}</button>
        </div>
        ${quote ? `<p class="bar-note">${ICON.shield}<span>Orders over $${quoteLimit.toLocaleString('en-CA')} are reserved, not charged. We call to confirm the final price before you pay.</span></p>` : ''}
        <a href="#/shop/Bullion" class="link-more">All gold &amp; silver ${ICON.arrow}</a>
      </div>
      <a href="#/product/${bar.id}" class="art ph" aria-label="${esc(bar.name)}">${photo(bar.img, bar.name)}</a>
    </section>` : ''}

    <section class="promise">
      <div class="ph promise-img">${photo((byId('bezel-eternity-band') || wear).img, 'Bezel Eternity Band')}</div>
      <div class="promise-copy">
        <h2>Why people buy from Avya</h2>
        <ul class="promise-list">${CONTENT.promises.map(x => `<li><h3>${x.title}</h3><p>${x.body}</p></li>`).join('')}</ul>
        <a href="#/studio" class="btn btn-secondary btn-md" style="align-self:flex-start">Visit the studio</a>
      </div>
    </section>

    <section class="reviews">
      <div class="sec-head"><h2>Worn and gifted across Canada</h2></div>
      <div class="review-grid">${CONTENT.reviews.map(r => `<figure class="review">${stars(5)}<blockquote>${r.q}</blockquote>
        <figcaption><span class="avatar">${r.i}</span><span class="stack"><span class="who">${r.n}</span><span class="what">${r.c} · ${r.p}</span></span></figcaption></figure>`).join('')}</div>
    </section>`;
  }

  const FIN_MAP = { Any: null, 'Gold vermeil': 'gold', 'Sterling silver': 'silver', 'Rose vermeil': 'rose', 'Fine gold': 'finegold', 'Fine silver': 'finesilver' };
  const matches = (filter, ffin) => PRODUCTS.filter(p => (filter === 'All' || p.cat === filter) && (!FIN_MAP[ffin] || p.sw.includes(FIN_MAP[ffin]) || (FIN_MAP[ffin] === 'silver' && p.fin === 'plainsilver')));
  const FILTER_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>';

  /* Category + finish groups. `act`/`set`/`name` let the sidebar apply instantly and the mobile sheet edit a draft. */
  function filterGroups(filter, ffin, { act, set, name }) {
    return `<div class="stack cat-list" style="gap:6px"><span class="eyebrow neutral" style="margin-bottom:6px">Category</span>
        ${CATS.map(c => `<button type="button" class="btn btn-ghost filter-btn ${filter === c ? 'on' : ''}" data-act="${act}" data-arg="${c}" aria-pressed="${filter === c}"><span>${c}</span><small>${c === 'All' ? PRODUCTS.length : PRODUCTS.filter(p => p.cat === c).length}</small></button>`).join('')}
      </div>
      <div class="stack fin-list" style="gap:10px"><span class="eyebrow neutral">Finish</span>
        ${Object.keys(FIN_MAP).map(v => `<label class="radio"><input type="radio" name="${name}" data-set="${set}" value="${v}" ${ffin === v ? 'checked' : ''}><span class="dot"></span><span>${v}</span></label>`).join('')}
      </div>`;
  }

  function filterSheet() {
    const d = state.draft;
    const n = matches(d.filter, d.ffin).length;
    return `<div class="sheet-wrap">
      <div class="sheet-backdrop" data-act="closeFilters"></div>
      <form class="sheet ${state.filtersOpen === 'opening' ? 'anim' : ''}" role="dialog" aria-modal="true" aria-labelledby="sheet-title" data-form="filters">
        <div class="between sheet-head"><h2 id="sheet-title" style="font-size:20px">Filters</h2><button type="button" class="btn btn-secondary btn-icon" data-act="closeFilters" aria-label="Close filters">${ICON.close}</button></div>
        <div class="filters sheet-body">${filterGroups(d.filter, d.ffin, { act: 'draftFilter', set: 'draft.ffin', name: 'ffin-sheet' })}</div>
        <div class="sheet-foot"><button type="button" class="btn btn-secondary" data-act="clearDraft">Clear all</button><button type="submit" class="btn btn-primary" style="flex:1;padding:12px" ${n ? '' : 'disabled'}>${n ? `Show ${n} piece${n === 1 ? '' : 's'}` : 'No matches'}</button></div>
      </form></div>`;
  }

  function shop() {
    const visible = matches(state.filter, state.ffin);
    const active = (state.filter !== 'All') + (state.ffin !== 'Any');
    return `
    <section class="coll-banner band">
      <div class="copy"><span style="font-size:13px" class="muted"><a href="#/" class="muted">Home</a> / <a href="#/shop" class="muted">Shop</a> / ${state.filter}</span>
        <h1>${state.filter === 'All' ? 'Everything' : state.filter}</h1><p class="soft" style="max-width:480px">${BLURB[state.filter]}</p></div>
      ${ph('category banner — ' + state.filter, 'accent')}
    </section>
    <section class="coll-body">
      <aside class="filters filters-side">
        ${filterGroups(state.filter, state.ffin, { act: 'filter', set: 'ffin', name: 'ffin' })}
        <div class="card" style="padding:16px;gap:8px"><span class="card-kicker">Bespoke</span><span class="card-title" style="font-size:15px">Can't find it?</span>
          <span style="font-size:13px" class="soft">Our jewellers can make it for you in 2–3 weeks.</span><a href="#/custom" class="btn btn-ghost" style="align-self:flex-start;font-size:13px">Start a request →</a></div>
      </aside>
      <div class="stack" style="gap:20px">
        <div class="between muted" style="font-size:13px"><span class="row" style="gap:12px"><button class="btn btn-secondary filter-trigger" data-act="openFilters" aria-haspopup="dialog">${FILTER_ICON}<span>Filters</span>${active ? `<span class="count">${active}</span>` : ''}</button><span>${visible.length} pieces</span></span><span>Sort by: <span style="color:var(--color-text)">Featured ▾</span></span></div>
        <div class="product-grid coll-grid">${visible.map(productCard).join('')}</div>
        ${visible.length ? '' : `<div class="card" style="padding:32px;align-items:flex-start;gap:12px"><span class="card-title">Nothing in that finish yet.</span><button class="btn btn-secondary" data-act="clearFilters">Clear filters</button></div>`}
      </div>
    </section>
    ${state.filtersOpen ? filterSheet() : ''}`;
  }

  function product() {
    const p = byId(state.param) || byId('halo');
    const sz = sizesOf(p);
    const finishes = p.sw.map(k => ({ name: FINISH_OF[k], swatch: SW[k] }));
    const { finish, size, added } = state.pdp;
    const price = pdpPrice(p, finish, size);
    const count = totals().count;
    return `
    <section class="pdp">
      <div class="gallery ${p.gallery ? 'real' : ''} ${p.video ? 'has-video' : ''}">
        ${p.gallery
          ? p.gallery.map((src, i) => ph(p.name + (i ? ' — view ' + (i + 1) : ''), i ? 'tall' : 'eager', !i && p.tag ? `<span class="tag tag-accent">${p.tag}</span>` : '', src)).join('')
          : `${ph(`${p.name} — ${finish}, ${size}`, 'eager', p.tag ? `<span class="tag tag-accent">${p.tag}</span>` : '', p.img)}
             ${ph(p.name + ' styled', 'accent', '', p.img === IMG.model ? IMG.gift : IMG.model)}
             ${ph(p.name + ' detail', '', '', p.img2)}`}
        ${p.video ? `<div class="ph tall"><video src="${p.video}" poster="${p.img}" autoplay muted loop playsinline aria-label="${esc(p.name)} video"></video></div>` : ''}
      </div>
      <div class="buybox">
        <div class="stack" style="gap:10px"><span style="font-size:13px" class="muted"><a href="#/shop" class="muted">Shop</a> / <a href="#/shop/${p.cat}" class="muted">${p.cat}</a></span>
          <h1>${esc(p.name)}</h1>
          <div class="row" style="gap:14px;flex-wrap:wrap"><span style="font-size:24px;font-weight:500">${money(price)}</span>${p.rating ? `<span style="font-size:13px" class="muted">${stars(5)} ${p.rating} · ${p.reviews} reviews</span>` : `<span style="font-size:13px" class="muted">${p.bullion ? 'HST-exempt · insured shipping' : 'New in · no reviews yet'}</span>`}</div>
          <p class="soft">${esc(p.desc)}</p></div>
        <div class="stack" style="gap:10px"><div class="between" style="font-size:13px"><span class="muted">Finish</span><span style="font-weight:500">${finish}</span></div>
          <div class="seg">${finishes.map(f => `<label class="seg-opt"><input type="radio" name="pfin" data-pdp="finish" value="${f.name}" ${finish === f.name ? 'checked' : ''}><span class="swatch" style="background:${f.swatch}"></span>${f.name}</label>`).join('')}</div></div>
        ${sz ? `<div class="stack" style="gap:10px"><div class="between" style="font-size:13px"><span class="muted">${sz.label}</span><a href="#/studio" style="color:var(--color-accent-300)">Size guide</a></div>
          <div class="seg">${sz.opts.map(v => `<label class="seg-opt"><input type="radio" name="psize" data-pdp="size" value="${v}" ${size === v ? 'checked' : ''}>${v}</label>`).join('')}</div></div>` : ''}
        <div class="row" style="gap:8px;align-items:stretch">
          <button class="btn btn-primary" data-act="addToBag" style="flex:1;padding:14px;font-size:15px">${added ? `Added — view bag (${count})` : 'Add to bag · ' + money(price)}</button>
          <button class="btn btn-secondary" data-act="save" style="padding:0 18px;font-size:13px">Save</button></div>
        <div class="perks">${(p.perks || CONTENT.perks).map(k => `<div><span style="font-size:13px;font-weight:500">${k.t}</span><span style="font-size:12px" class="muted">${k.b}</span></div>`).join('')}</div>
        <div class="stack">${(p.accordions || CONTENT.accordions).map((a, i) => (i === 0 && p.care ? { ...a, body: p.care } : a)).map((a, i) => `<button class="acc fade-rule" data-act="acc" data-arg="${i}" aria-expanded="${state.open === i}"><span class="between"><span>${a.title}</span><span>${state.open === i ? '−' : '+'}</span></span>${state.open === i ? `<p>${a.body}</p>` : ''}</button>`).join('')}</div>
      </div>
    </section>
    <section class="pairs">
      <div class="stack" style="gap:6px">${eyebrow('Complete the look')}<h2 style="font-size:30px;letter-spacing:-.025em">Pairs well with ${esc(p.name.split(' ')[0])}</h2></div>
      <div class="pair-grid">${PRODUCTS.filter(x => x.id !== p.id && x.cat !== p.cat).slice(0, 4).map(x => `<div class="card elev-sm on-bg" style="padding:10px;gap:10px">
        <a href="#/product/${x.id}" class="ph md">${photo(x.img, x.name)}</a>
        <div class="between" style="padding:0 4px 4px"><a href="#/product/${x.id}" class="stack"><span style="font-size:14px;font-weight:500">${x.name}</span><span style="font-size:13px" class="muted">${cad(x.price)}</span></a>
        ${addBtn(x.id)}</div></div>`).join('')}</div>
    </section>`;
  }

  function summaryRows(t) {
    return `<div class="between"><span class="soft">Subtotal</span><span>${money(t.goods)}</span></div>
      ${t.giftCost ? `<div class="between"><span class="soft">Gift wrapping</span><span>$6.00</span></div>` : ''}
      <div class="between"><span class="soft">Shipping</span><span>${t.shipping}</span></div>
      <div class="between"><span class="soft">HST (ON, 13%)</span><span>${money(t.tax)}</span></div>`;
  }

  function bag() {
    const t = totals();
    const pct = Math.min(100, t.goods / 150 * 100);
    return `
    <section class="bag">
      <div class="stack" style="gap:16px">
        <div class="between" style="align-items:baseline"><h1 style="font-size:42px;letter-spacing:-.035em">Your bag</h1><span class="muted" style="font-size:14px">${t.count} item${t.count === 1 ? '' : 's'}</span></div>
        <div class="ship-meter"><span>${t.goods >= 150 ? 'You’ve unlocked free shipping across Canada.' : 'You’re ' + money(150 - t.goods) + ' away from free shipping.'}</span><div class="track"><div class="fill" style="width:${pct}%"></div></div></div>
        ${t.lines.length ? '' : `<div class="stack" style="gap:16px;align-items:flex-start;padding:24px 0"><p class="soft">Your bag is empty.</p><a href="#/shop" class="btn btn-primary">Continue shopping</a></div>`}
        ${t.lines.map(l => `<div class="line-item fade-rule">
          <a href="${href(l.id)}" class="ph md">${photo(l.p.img, l.p.name)}</a>
          <div class="stack" style="gap:4px"><a href="${href(l.id)}" style="font-size:17px;font-weight:500">${l.p.name}</a><span style="font-size:13px" class="muted">${esc(l.variant)}</span>${isQuote(l.p) ? `<span class="line-note">${ICON.shield} Reserved — price confirmed by our team before payment</span>` : ''}
            <div class="row" style="gap:12px;margin-top:auto;padding-top:8px"><div class="qty"><button class="btn btn-icon" data-act="qty" data-arg="${esc(l.key)}" data-d="-1" aria-label="Decrease">−</button><span>${l.qty}</span><button class="btn btn-icon" data-act="qty" data-arg="${esc(l.key)}" data-d="1" aria-label="Increase">+</button></div>
            <button class="btn btn-ghost" style="font-size:13px" data-act="remove" data-arg="${esc(l.key)}">Remove</button></div></div>
          <span class="price" style="font-size:16px;font-weight:500">${money(l.sum)}</span></div>`).join('')}
        <button class="option-box radio check ${state.gift ? 'on' : ''}" data-act="gift" style="background:transparent;border:0;font:inherit;color:inherit;text-align:left" aria-pressed="${state.gift}">
          <span class="row" style="gap:12px"><span class="dot"></span><span class="stack"><span>Add gift wrapping &amp; a handwritten note</span><span style="font-size:12px" class="muted">Lavender box, ribbon, card — prices hidden</span></span></span><span>$6.00</span></button>
        <div class="stack" style="gap:12px;margin-top:12px">${eyebrow('You might also like')}
          <div class="mini-grid">${PRODUCTS.filter(p => p.real && !p.bullion && !state.cart.some(l => l.id === p.id)).slice(0, 3).map(p => p.id).map(id => { const p = byId(id); return `<div class="mini"><a href="#/product/${id}" class="ph sm">${photo(p.img, p.name)}</a><span class="stack" style="align-items:flex-start"><span style="font-size:14px;font-weight:500">${p.name}</span><span style="font-size:12px" class="muted">${cad(p.price)}</span>${addBtn(id, 'style="min-height:32px;font-size:13px;margin-top:4px"')}</span></div>`; }).join('')}</div></div>
      </div>
      <aside class="card elev-md on-bg summary">
        <span class="card-title">Order summary</span>
        ${summaryRows(t)}
        <div class="rule"></div>
        <div class="between total"><span>Total</span><span>${money(t.total)} <span style="font-size:13px" class="muted">CAD</span></span></div>
        <form class="row" style="gap:8px" data-form="promo"><input class="input" placeholder="Promo code" aria-label="Promo code" data-model="promo" value="${esc(state.form.promo || '')}"><button class="btn btn-secondary" type="submit">Apply</button></form>
        <a href="#/checkout" class="btn btn-primary btn-block ${t.count ? '' : 'disabled'}" style="padding:14px;font-size:15px;${t.count ? '' : 'pointer-events:none;opacity:.45'}">Secure checkout</a>
        <div class="assure"><span>${ICON.check} 30-day returns on jewellery</span><span>${ICON.check} Insured delivery</span><span>${ICON.check} Bullion is HST-exempt</span><span>${ICON.check} Pay by e-Transfer or card</span></div>
      </aside>
    </section>`;
  }

  function checkout() {
    const t = totals();
    const field = (label, ph, attrs = '', span = '') => `<div class="field" ${span}><label>${label}</label><input class="input" placeholder="${ph}" ${attrs}></div>`;
    return `
    <section class="checkout">
      <form class="checkout-form" data-form="checkout">
        <div class="stack" style="gap:12px"><span class="eyebrow neutral">Express checkout</span>
          <div class="grid-3"><button type="button" class="btn btn-secondary" style="padding:12px" data-act="express">Apple Pay</button><button type="button" class="btn btn-secondary" style="padding:12px" data-act="express">Google Pay</button><button type="button" class="btn btn-secondary" style="padding:12px" data-act="express">PayPal</button></div>
          <div class="or-rule">or continue below</div></div>
        <div class="stack" style="gap:12px"><h3>Contact</h3>${field('Email', 'you@example.com', 'type="email" required autocomplete="email"')}</div>
        <div class="stack" style="gap:12px"><h3>Shipping address</h3>
          <div class="grid-2">
            ${field('First name', 'Maya', 'required autocomplete="given-name"')}
            ${field('Last name', 'Chen', 'required autocomplete="family-name"')}
            ${field('Address', '45 Harbord St, Apt 3', 'required autocomplete="street-address"', 'style="grid-column:1/-1"')}
            ${field('City', 'Toronto', 'required autocomplete="address-level2"')}
            <div class="grid-2">${field('Province', 'ON', 'required autocomplete="address-level1"')}${field('Postal code', 'M5S 1G1', 'required autocomplete="postal-code"')}</div>
          </div></div>
        <div class="stack" style="gap:10px"><h3>Delivery</h3>
          ${SHIP.map(o => `<label class="radio option-box tinted ${state.ship === o.id ? 'on' : ''}"><span class="row" style="gap:12px"><input type="radio" name="ship" data-set="ship" value="${o.id}" ${state.ship === o.id ? 'checked' : ''}><span class="dot"></span><span class="stack"><span>${o.name}</span><span style="font-size:12px" class="muted">${o.eta}</span></span></span><span>${o.id === 'std' && t.goods >= 150 ? 'Free' : (o.price ? money(o.price) : 'Free')}</span></label>`).join('')}</div>
        <div class="stack" style="gap:12px"><h3>Payment</h3>
          ${field('Card number', '1234 1234 1234 1234', 'inputmode="numeric" autocomplete="cc-number"')}
          <div class="grid-2">${field('Expiry', 'MM / YY', 'autocomplete="cc-exp"')}${field('CVC', '123', 'inputmode="numeric" autocomplete="cc-csc"')}</div></div>
        <button type="submit" class="btn btn-primary" style="padding:15px;font-size:15px" ${t.count ? '' : 'disabled'}>Place order · ${money(t.total)} CAD</button>
      </form>
      <aside class="checkout-side">
        <span class="card-title">In your bag (${t.count})</span>
        ${t.lines.map(l => `<div class="co-line"><div class="ph md">${photo(l.p.img, l.p.name)}<span class="badge">${l.qty}</span></div><span class="stack" style="font-size:14px"><span style="font-weight:500">${l.p.name}</span><span style="font-size:12px" class="muted">${esc(l.variant)}</span></span><span style="font-size:14px">${money(l.sum)}</span></div>`).join('')}
        <div class="rule" style="margin:6px 0"></div>
        ${summaryRows(t)}
        <div class="between" style="font-size:20px;font-weight:500"><span>Total</span><span>${money(t.total)} <span style="font-size:13px" class="muted">CAD</span></span></div>
        <div class="card on-brand" style="padding:14px;gap:4px;margin-top:auto"><span style="font-size:13px;font-weight:500">Every order is insured and signed for.</span><span style="font-size:12px" class="muted">Questions? hello@avya.ca · (416) 555-0182</span></div>
      </aside>
    </section>`;
  }

  function custom() {
    const firstName = (state.form.name.trim().split(/\s+/)[0]) || 'there';
    const form = state.submitted
      ? `<div class="card elev-md on-bg" style="padding:40px;gap:16px;align-items:flex-start"><span class="tag tag-accent">Request #CR-2214 received</span><h2>Thank you, ${esc(firstName)}.</h2>
          <p class="soft">We'll email a sketch and quote for your ${esc(state.bfin.toLowerCase() + ' ' + state.ptype.toLowerCase())} by Friday, October 9. No payment until you approve the design.</p>
          <button class="btn btn-secondary" data-act="resetBespoke">Start another request</button></div>`
      : `<form class="card elev-md on-bg bespoke-form" style="padding:28px;gap:20px" data-form="bespoke">
          <div class="stack" style="gap:8px"><span style="font-size:12px" class="soft">What would you like?</span><div class="seg">${['Ring', 'Necklace', 'Earrings', 'Bracelet', 'Other'].map(v => radio('ptype', v, v)).join('')}</div></div>
          <div class="stack" style="gap:8px"><span style="font-size:12px" class="soft">Finish</span><div class="seg">${['Gold vermeil', 'Sterling silver', 'Solid 14k gold'].map(v => radio('bfin', v, v)).join('')}</div></div>
          <div class="stack" style="gap:8px"><span style="font-size:12px" class="soft">Budget (CAD)</span><div class="seg">${['Under $150', '$150–300', '$300–600', '$600+'].map(v => radio('budget', v, v)).join('')}</div></div>
          <div class="field"><label for="idea">Describe your idea</label><textarea id="idea" class="input" required data-model="idea" placeholder="e.g. A thin signet with my daughter's initial, about ring size 6">${esc(state.form.idea)}</textarea></div>
          <label class="dropzone"><input type="file" accept="image/*,.pdf" multiple hidden data-files><span style="font-weight:500" id="drop-label">Drop reference photos or sketches</span><span style="font-size:12px" class="muted">JPG, PNG or PDF · up to 10 MB</span></label>
          <div class="grid-2"><div class="field"><label for="bn">Name</label><input id="bn" class="input" required placeholder="Maya Chen" data-model="name" value="${esc(state.form.name)}"></div>
            <div class="field"><label for="be">Email</label><input id="be" class="input" type="email" required placeholder="you@example.com" data-model="email" value="${esc(state.form.email)}"></div></div>
          <button type="submit" class="btn btn-primary" style="padding:14px;font-size:15px">Send request</button></form>`;
    return `
    <section class="bespoke">
      <div class="stack" style="gap:20px">
        ${eyebrow('Bespoke · made to order')}
        <h1>Something only you'll wear.</h1>
        <p class="soft" style="max-width:420px">Engraved initials, a birthstone, a reworked heirloom or something new entirely. A jeweller replies within two days with a sketch and a quote.</p>
        <div class="stack" style="margin-top:4px">${CONTENT.steps.map(s => `<div class="step"><span class="avatar">${s.n}</span><span class="stack"><span style="font-weight:500">${s.title}</span><span style="font-size:13px" class="muted">${s.body}</span></span></div>`).join('')}</div>
        <div class="grid-3">${CONTENT.commissions.map(c => `<div class="stack" style="gap:6px">${ph(c.ph, 'md').replace('class="ph md"', 'class="ph md" style="aspect-ratio:1"')}<span style="font-size:12px" class="muted">${c.t}</span></div>`).join('')}</div>
      </div>
      ${form}
    </section>`;
  }

  function studio() {
    const taken = CONTENT.takenBy[state.day];
    const label = state.booked ? 'Booked · ' + CONTENT.dayFull[state.day] + ', ' + state.slot
      : (state.slot ? 'Book ' + CONTENT.dayFull[state.day] + ' at ' + state.slot : 'Choose a time');
    return `
    <section class="studio">
      <div class="stack" style="gap:18px">
        ${eyebrow('Since 2019 · Queen West, Toronto')}
        <h1>A two-person studio above a bakery.</h1>
        <p class="soft" style="max-width:460px">Avya began at a kitchen table in Parkdale. Every piece is still cast, polished and plated by hand on Queen Street West — and the door is open six days a week to try things on.</p>
        <div class="grid-3" style="margin-top:6px">${CONTENT.timeline.map(t => `<div class="stack" style="gap:4px;padding:14px;border-radius:var(--radius-md);background:var(--color-surface)"><span style="font-size:20px;font-weight:500;color:var(--color-accent)">${t.y}</span><span style="font-size:13px" class="soft">${t.b}</span></div>`).join('')}</div>
      </div>
      <div class="studio-media">
        ${ph('studio bench, warm lamp')}
        <div class="stack">${ph('founders portrait', 'accent')}${ph('storefront, Queen W')}</div>
      </div>
    </section>
    <section class="studio-cards">
      <div class="card elev-sm on-bg" style="padding:24px;gap:10px"><span class="card-kicker">Visit us</span><span class="card-title">1082 Queen St W, 2nd floor</span>
        <span style="font-size:14px" class="soft">Toronto, ON M6J 1H8<br>501 streetcar to Ossington</span>
        <div class="ph md" style="flex:1;min-height:90px;margin-top:6px"><span class="ph-label">map</span></div>
        <a href="https://www.google.com/maps/search/?api=1&query=1082+Queen+St+W+Toronto" target="_blank" rel="noopener" class="btn btn-ghost" style="align-self:flex-start">Get directions →</a></div>
      <div class="card elev-sm on-bg" style="padding:24px;gap:12px"><span class="card-kicker">Hours</span>
        ${CONTENT.hours.map(h => `<div class="hours-row"><span class="soft">${h.d}</span><span style="font-weight:500">${h.t}</span></div>`).join('')}
        <span style="font-size:13px;color:var(--color-accent-300);margin-top:auto">Open now · closes 7 PM</span></div>
      <div class="card elev-md booking"><span class="card-kicker">Book a fitting · 30 min, free</span>
        <div class="row" style="gap:8px">${CONTENT.days.map(([w, n]) => `<button class="btn ${state.day === w ? 'btn-primary' : 'btn-secondary'} day-btn" data-act="day" data-arg="${w}" aria-pressed="${state.day === w}"><small>${w}</small><span>${n}</span></button>`).join('')}</div>
        <div class="slot-grid">${CONTENT.slotTimes.map(s => `<button class="btn ${state.slot === s ? 'btn-primary' : 'btn-secondary'}" data-act="slot" data-arg="${s}" ${taken.includes(s) ? 'disabled aria-label="' + s + ' unavailable"' : ''}>${s}</button>`).join('')}</div>
        <button class="btn btn-primary btn-block" style="padding:12px" data-act="confirmSlot" ${state.slot && !state.booked ? '' : 'disabled'}>${label}</button></div>
    </section>`;
  }

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

  const PAGES = { home, shop, product, bag, checkout, custom, studio };
  const TITLES = { home: 'Avya Jewels — Fine silver jewellery & certified gold, Toronto', shop: 'Shop', product: '', bag: 'Your bag', checkout: 'Checkout', custom: 'Bespoke', studio: 'The studio' };

  /* ── Render & routing ───────────────────────────────────────────────── */
  function render() {
    const app = document.getElementById('app');
    const focusId = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.model : null;
    app.innerHTML = `<div class="page">${header()}<main>${PAGES[state.route]()}</main>${state.route === 'checkout' ? '' : footer()}</div>`;
    document.body.style.overflow = state.filtersOpen ? 'hidden' : '';
    if (state.filtersOpen === 'opening') { state.filtersOpen = true; app.querySelector('.sheet [data-act="closeFilters"]').focus(); }
    if (focusId) { const el = app.querySelector(`[data-model="${focusId}"]`); if (el) { el.focus(); const v = el.value; el.value = ''; el.value = v; } }
  }

  function route() {
    const [r, param] = location.hash.replace(/^#\/?/, '').split('/');
    const name = PAGES[r] ? r : 'home';
    const anchor = r === 'gold-bars' || r === 'gift' ? r : null;
    const patch = { route: name, param: param ? decodeURIComponent(param) : null, navOpen: false, filtersOpen: false };
    if (name === 'shop' && param && CATS.includes(param)) patch.filter = param;
    if (name === 'product') {
      const p = byId(param) || byId('halo');
      if (state.pdp.id !== p.id) patch.pdp = { id: p.id, finish: FINISH_OF[p.fin], size: sizesOf(p) ? sizesOf(p).def : null, added: false };
    }
    set(patch);
    document.title = name === 'home' ? TITLES.home : (name === 'product' ? byId(state.pdp.id).name : TITLES[name]) + ' · Avya Jewels';
    if (anchor && document.getElementById(anchor)) document.getElementById(anchor).scrollIntoView({ block: 'start' });
    else window.scrollTo(0, 0);
  }

  /* ── Events ─────────────────────────────────────────────────────────── */
  const ACTIONS = {
    toggleNav: () => set({ navOpen: !state.navOpen }),
    newIn: () => set({ filter: 'All', ffin: 'Any' }),
    quickAdd: id => quickAdd(id),
    filter: c => { history.replaceState(null, '', '#/shop' + (c === 'All' ? '' : '/' + c)); set({ filter: c }); },
    clearFilters: () => set({ filter: 'All', ffin: 'Any' }),
    openFilters: () => set({ filtersOpen: 'opening', draft: { filter: state.filter, ffin: state.ffin } }),
    closeFilters: () => { set({ filtersOpen: false }); document.querySelector('.filter-trigger')?.focus(); },
    draftFilter: c => set({ draft: { ...state.draft, filter: c } }),
    clearDraft: () => set({ draft: { filter: 'All', ffin: 'Any' } }),
    acc: i => set({ open: state.open === +i ? -1 : +i }),
    addToBag: () => {
      const { id, finish, size, added } = state.pdp;
      if (added) { location.hash = '#/bag'; return; }
      const p = byId(id);
      set({ cart: addLine(id, size ? finish + ' · ' + size : finish, pdpPrice(p, finish, size)), pdp: { ...state.pdp, added: true } });
      toast(p.name + ' added to your bag');
    },
    save: () => toast('Saved to your wishlist'),
    qty: (key, el) => {
      const line = state.cart.find(l => l.key === key);
      if (+el.dataset.d > 0 && line && isQuote(byId(line.id))) { toast(quoteNote(byId(line.id))); return; }
      set({ cart: state.cart.map(l => l.key === key ? { ...l, qty: l.qty + +el.dataset.d } : l).filter(l => l.qty > 0) });
    },
    remove: key => set({ cart: state.cart.filter(l => l.key !== key) }),
    gift: () => set({ gift: !state.gift }),
    express: () => toast('Express checkout isn’t connected in this demo'),
    resetBespoke: () => set({ submitted: false, form: { ...state.form, idea: '' } }),
    barPick: id => set({ barPick: id }),
    day: w => set({ day: w, slot: null, booked: false }),
    slot: s => set({ slot: s, booked: false }),
    confirmSlot: () => { set({ booked: true }); toast('Fitting booked — see you soon!'); }
  };

  const FORMS = {
    newsletter: () => { set({ form: { ...state.form, newsletter: '' } }); toast("You’re on the list — see you next month."); },
    promo: () => toast(state.form.promo ? 'That code isn’t valid' : 'Enter a promo code'),
    checkout: () => { set({ cart: [], gift: false, justAdded: {} }); location.hash = '#/'; toast('Order placed — our team will contact you shortly.'); },
    bespoke: () => set({ submitted: true }),
    filters: () => {
      const { filter, ffin } = state.draft;
      history.replaceState(null, '', '#/shop' + (filter === 'All' ? '' : '/' + filter));
      set({ filter, ffin, filtersOpen: false });
      document.querySelector('.coll-body')?.scrollIntoView({ block: 'start' });
    }
  };

  /* ══ Gilded Gallery actions — spliced into app.js after ACTIONS/FORMS. ══ */
  Object.assign(ACTIONS, {
    metal: m => set({ metal: m }),
    view: i => set({ view: +i }),
    scrollEdit: d => {
      const rail = document.getElementById('gg-rail');
      if (rail) rail.scrollBy({ left: +d * rail.clientWidth * 0.8, behavior: 'smooth' });
    },
    addToBag: () => {
      const { id, finish, size, added } = state.pdp;
      if (added) { location.hash = '#/bag'; return; }
      if (tooMany(id)) { toast(quoteNote(byId(id))); return; }
      const p = byId(id);
      set({ cart: addLine(id, size ? finish + ' · ' + size : finish, pdpPrice(p, finish, size)), pdp: { ...state.pdp, added: true } });
      toast(isQuote(p) ? p.name + ' reserved at today’s rate' : p.name + ' added to your bag');
    }
  });
  /* A new product page starts on its first image. */
  window.addEventListener('hashchange', () => { if (/^#\/product\//.test(location.hash)) state.view = 0; });

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    if (el.tagName === 'BUTTON' || el.dataset.act !== 'newIn') e.preventDefault();
    if (el.dataset.act === 'newIn') { ACTIONS.newIn(); return; }
    ACTIONS[el.dataset.act](el.dataset.arg, el);
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.set === 'draft.ffin') set({ draft: { ...state.draft, ffin: t.value } });
    else if (t.dataset.set) set({ [t.dataset.set]: t.value });
    else if (t.dataset.pdp) set({ pdp: { ...state.pdp, [t.dataset.pdp]: t.value, added: false } });
    else if (t.matches('[data-files]')) {
      const n = t.files.length;
      document.getElementById('drop-label').textContent = n ? n + ' file' + (n > 1 ? 's' : '') + ' attached' : 'Drop reference photos or sketches';
    }
  });
  document.addEventListener('input', e => {
    const k = e.target.dataset.model;
    if (k) state.form[k] = e.target.value;
  });
  document.addEventListener('submit', e => {
    const f = e.target.dataset.form;
    if (f && FORMS[f]) { e.preventDefault(); FORMS[f](); }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && state.filtersOpen) ACTIONS.closeFilters();
  });

  window.addEventListener('hashchange', route);
  route();
})();
