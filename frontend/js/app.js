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
        <p>999.9 fine gold coins and bars, sealed in their original assay. Choose a size to see today’s price.</p>
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
          <div class="row" style="gap:14px;flex-wrap:wrap"><span style="font-size:24px;font-weight:500">${money(price)}</span><span style="font-size:13px" class="muted">${p.bullion ? 'HST-exempt · insured shipping' : 'New in'}</span></div>
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

  /* ══ Ivory Editorial views — spliced into app.js; these declarations replace the defaults above. ══ */
  const REAL = () => PRODUCTS.filter(p => p.real);

  /* ── Store details (client questionnaire, Oct 2026). When the store API is connected
        (js/api-loader.js), Admin → Settings overrides each value. ── */
  const SITE = window.AVYA_API ? window.AVYA_API.site.settings : {};
  const STORE = {
    whatsapp: SITE.whatsapp_number || '16477185454',
    phone: SITE.contact_phone || '+1 647-718-5454',
    email: SITE.contact_email || 'avyajewels0210@gmail.com',
    area: 'Mississauga, Ontario',
    hours: SITE.hours || 'Mon–Sun · 11 am – 7 pm · visits by appointment',
    announcement: SITE.announcement || 'Free home delivery across the GTA on orders over $200',
    instagram: (SITE.social || {}).instagram || 'https://www.instagram.com/avyajewels.ca',
    giftMin: SITE.gift_wrap_min != null ? +SITE.gift_wrap_min : 150,
    taxIncluded: SITE.prices_include_tax !== false,
    showBullionPrices: SITE.show_bullion_prices === true,
    spot: SITE.spot || {},
    shipping: SITE.shipping_methods || [
      { code: 'gta', name: 'Free home delivery (GTA, 3–5 days)', fee: 0, free_over: null, min_order: 200 },
      { code: 'pickup', name: 'Pick up in Mississauga', fee: 0, free_over: null, min_order: null }
    ]
  };
  SHIP.length = 0;
  SHIP.push(...STORE.shipping.map(m => ({ id: m.code, name: m.name, price: +m.fee, freeOver: m.free_over, minOrder: m.min_order,
    eta: m.min_order ? 'On orders over $' + m.min_order : (m.code === 'pickup' ? STORE.area + ' · during opening hours' : '') })));

  const WA_BASE = ((window.AVYA_ENV || {}).WHATSAPP_API_URL || 'https://wa.me').replace(/\/+$/, '');
  const waLink = (msg = 'Hi Avya Jewels, I have a question.') => WA_BASE + '/' + STORE.whatsapp + '?text=' + encodeURIComponent(msg);
  const telLink = 'tel:' + STORE.phone.replace(/[^0-9+]/g, '');

  /* ── Categories: menu sections (Silver Jewellery, Gold Jewellery, Bullion, Silver Utensils, Kids) and their shop categories ── */
  const GROUP_ORDER = ['silver jewellery', 'gold jewellery', 'bullion', 'silver utensils', 'kids'];
  const keyOfGroup = g => g.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  // Sections before Oct 2026 (Women, Men…) are mapped to the new menu until Admin → Settings → Run database updates.
  const OLD_SECTIONS = ['Women', 'Men', 'Gold & silver', 'Silver utensils'];
  const sectionOf = c => (!c.group || OLD_SECTIONS.includes(c.group)) ? ((CATEGORY_LIST.find(x => x.slug === c.slug) || {}).group || (c.kind === 'bullion' ? 'Bullion' : 'Silver Jewellery')) : c.group;
  const CAT_LIST = (window.AVYA_API ? window.AVYA_API.site.categories : CATEGORY_LIST)
    .map(c => ({ slug: c.slug, name: c.name, kind: c.kind, description: c.description, image: c.image || null, group: sectionOf(c) }));
  const rank = g => (GROUP_ORDER.indexOf(g.toLowerCase()) + 1) || 99;
  const GROUPS = [...new Set(CAT_LIST.map(c => c.group))].sort((a, b) => rank(a) - rank(b))
    .map(name => ({ key: keyOfGroup(name), name, cats: CAT_LIST.filter(c => c.group === name), bullion: CAT_LIST.some(c => c.group === name && c.kind === 'bullion') }));
  const GROUP_COPY = {
    'silver-jewellery': 'Pendant sets, necklaces, earrings, bracelets and rings in 925 sterling silver, hallmarked and stamped.',
    'gold-jewellery': 'Gold earrings and chains. Gold jewellery follows today’s gold rate — ask us for the price.',
    bullion: '99.99% pure gold and silver bars and coins from RCM, PAMP and Valcambi. Prices follow the live market — ask us for today’s rate.',
    'silver-utensils': 'Pure silver bowls and spoons for ceremonies, first feeds and gifting.',
    kids: 'Silver nazariya and kada for little ones — a blessing to wear and a gift to keep.'
  };
  // Without the API, the built-in pieces carry simple categories — map them to the shop categories.
  if (!window.AVYA_API) {
    REAL().forEach(p => {
      p.cat = p.bullion ? (p.metal === 'silver' ? 'silver-' : 'gold-') + (/bar/i.test(p.name + ' ' + (p.short || '')) ? 'bars' : 'coins')
        : ({ Rings: 'silver-rings', Earrings: 'silver-earrings' }[p.cat] || p.cat);
    });
  }
  CATS.push(...GROUPS.map(g => g.key), ...CAT_LIST.map(c => c.slug));   // valid #/shop/<key> routes

  const catOf = slug => CAT_LIST.find(c => c.slug === slug);
  const groupOf = key => GROUPS.find(g => g.key === key);
  const groupOfCat = slug => GROUPS.find(g => g.cats.some(c => c.slug === slug));
  const inFilter = (p, f) => f === 'All' || p.cat === f || !!(groupOf(f) && groupOf(f).cats.some(c => c.slug === p.cat));
  const catLabel = f => f === 'All' ? 'Everything' : (catOf(f) || groupOf(f) || { name: f }).name;
  const countIn = f => REAL().filter(p => inFilter(p, f)).length;
  const bullionKey = (GROUPS.find(g => g.bullion) || { key: 'bullion' }).key;
  const jewelleryKey = (GROUPS.find(g => !g.bullion) || { key: 'All' }).key;

  /* ── Prices, stock and actions per piece ── */
  const onRequest = p => p.priceOnRequest || (p.bullion ? !STORE.showBullionPrices : p.metal === 'gold');
  const soldOut = p => p.inStock === false || p.stock === 0;
  const priceHtml = p => onRequest(p) ? 'Price on request'
    : (p.wasPrice && p.wasPrice > p.price ? `<s class="iv-was">${cad(p.wasPrice)}</s> ` : '') + cad(p.price);
  const stockNote = p => soldOut(p) ? 'Sold out' : 'In stock';
  const askLink = p => waLink(`Hi Avya Jewels, could you share today’s price for the ${p.name}?`);
  /* Customer reviews come only from Admin → Reviews; with none, no reviews section is shown. */
  const REVIEWS = window.AVYA_API ? (window.AVYA_API.site.reviews || []) : [];
  function reviewsBlock(list, heading) {
    if (!list.length) return '';
    const r = list[(state.review || 0) % list.length];
    return `<section class="iv-testimonial" aria-label="Customer reviews">
      <span class="iv-label accent">${esc(heading)}</span>
      ${stars(Math.max(1, Math.min(5, r.rating || 5)))}
      <blockquote>“${esc(r.body)}”</blockquote>
      <span class="iv-label">${esc([r.name, r.city].filter(Boolean).join(' · '))}${r.product_name ? ' — ' + esc(r.product_name) : ''}</span>
      ${list.length > 1 ? `<div class="iv-dots" role="group" aria-label="Choose a review">${list.map((x, i) => `<button class="${x === r ? 'on' : ''}" data-act="review" data-arg="${i}" aria-label="Review ${i + 1}"></button>`).join('')}</div>` : ''}
    </section>`;
  }
  const addLabel = id => state.justAdded[id] ? 'Added' : 'Add to bag';
  const perGram = oz => oz / 31.1035;
  function pdpPrice(p) { return p.price; }   // finishes and sizes don't change the price

  const WA_PATH = 'M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.41z';
  const svgWA = size => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${WA_PATH}"/></svg>`;
  const SOCIAL = [
    ['Instagram', STORE.instagram, svg('<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".9" fill="currentColor" stroke="none"/>', 16)],
    ['WhatsApp', waLink(), svgWA(16)],
    ['Call ' + STORE.phone, telLink, svg('<path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2z"/>', 15)]
  ].filter(s => s[1]);
  const WA_ICON = svgWA(30);
  const PHONE_ICON = svg('<path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2z"/>', 18);
  const CART_ICON = svg('<path d="M3 4h2.4l2.3 11.2a1.6 1.6 0 0 0 1.6 1.3h8.1a1.6 1.6 0 0 0 1.6-1.2L20.6 8H6.2"/><circle cx="9.6" cy="20" r="1.3"/><circle cx="17.4" cy="20" r="1.3"/>', 22);
  const SEARCH_ICON = svg('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>', 18);
  const METALS = { Silver: ['silver', 'plainsilver', 'finesilver'], Gold: ['gold', 'finegold'], 'Rose gold': ['rose', 'rosetone'] };
  const METAL_SW = { Silver: '#D8DCDD', Gold: '#D9B46A', 'Rose gold': '#D9A28F' };
  const metalOf = p => Object.keys(METALS).filter(m => p.sw.some(k => METALS[m].includes(k)));
  Object.assign(state, { review: 0, metal: null, searchOpen: false, q: '', zoom: null, placed: null, placing: false });
  Object.assign(state.form, { name: '', phone: '', email: '', address: '', city: '', postal: '', note: '' });
  state.cart = state.cart.filter(l => byId(l.id) && byId(l.id).real && !onRequest(byId(l.id)));
  if (!SHIP.some(o => o.id === state.ship)) state.ship = (SHIP[SHIP.length - 1] || {}).id;

  /* ── Search: every word must appear in the piece's name, material, category or keywords ── */
  const haystack = p => [p.name, p.material, catLabel(p.cat), (groupOfCat(p.cat) || {}).name, p.desc,
    p.bullion ? 'gold silver coin bar bullion investment rcm pamp valcambi ' + (p.metal || '') : 'jewellery jewelry silver 925',
    p.sw.includes('rosetone') ? 'rose gold' : '', /diwali|lakshmi/.test(p.id) ? 'diwali lakshmi gift festive' : ''].join(' ').toLowerCase();
  const matchQ = (p, q) => q.toLowerCase().split(/\s+/).filter(Boolean).every(w => haystack(p).includes(w));
  const searchHits = q => (q || '').trim() ? REAL().filter(p => matchQ(p, q.trim())) : [];
  function searchResults(q) {
    const hits = searchHits(q);
    if (!(q || '').trim()) {
      return `<div class="iv-search-sugg"><span class="iv-label">Popular searches</span>
        <div>${['Rings', 'Earrings', 'Rose gold', 'Gold bar', 'Gold coin', 'Silver bar', 'Diwali'].map(t => `<button type="button" data-act="searchFor" data-arg="${t}">${t}</button>`).join('')}</div></div>`;
    }
    if (!hits.length) return `<p class="iv-search-empty">No pieces match “${esc(q.trim())}”. Try “ring”, “earrings” or “gold bar” — or <a href="${waLink('Hi Avya Jewels, do you have ' + q.trim() + '?')}" target="_blank" rel="noopener">ask us on WhatsApp</a>.</p>`;
    return `<ul class="iv-search-list">${hits.slice(0, 6).map(p => `<li><a href="#/product/${p.id}"><span class="iv-search-thumb">${photo(p.img, p.name)}</span>
        <span class="stack"><span class="iv-serif-20">${esc(p.name)}</span><span class="iv-muted">${esc(p.material)}</span></span><span class="iv-price-sm">${priceHtml(p)}</span></a></li>`).join('')}</ul>
      <button type="submit" class="iv-btn ghost block sm">See all ${hits.length} result${hits.length === 1 ? '' : 's'}</button>`;
  }

  /* Top bar messages take turns: delivery offer, then today's gold & silver rate (per ounce) when set in the admin. */
  let topAt = 0;
  function topMessages() {
    const sp = STORE.spot || {};
    const rate = [sp.gold_oz && 'Gold ' + cad(Math.round(sp.gold_oz)) + ' / oz', sp.silver_oz && 'Silver ' + money(sp.silver_oz) + ' / oz'].filter(Boolean);
    return [STORE.announcement, rate.length ? 'Today’s rate · ' + rate.join(' · ') : null].filter(Boolean);
  }
  setInterval(() => {
    const el = document.getElementById('iv-top-msg'), msgs = topMessages();
    if (!el || msgs.length < 2 || document.hidden) return;
    topAt = (topAt + 1) % msgs.length;
    el.classList.add('swap');
    setTimeout(() => { el.textContent = msgs[topAt]; el.classList.remove('swap'); }, 300);
  }, 5000);

  function header() {
    const t = totals();
    if (state.route === 'checkout') {
      return `<header class="iv-head"><span class="iv-label">Checkout</span>
        <a href="#/" class="iv-logo" aria-label="Avya Jewels home">${logo('')}</a>
        <div class="iv-right"><a href="#/bag">Back to bag</a></div></header>`;
    }
    const inShop = state.route === 'shop';
    const active = g => inShop && (state.filter === g.key || g.cats.some(c => c.slug === state.filter));
    const msgs = topMessages();
    return `<div class="iv-top"><span class="iv-top-msg" id="iv-top-msg" aria-live="polite">${esc(msgs[topAt % msgs.length])}</span>
        <span class="iv-top-right"><a class="iv-top-phone" href="${telLink}">${esc(STORE.phone)}</a><span class="iv-social" aria-label="Contact Avya Jewels">${SOCIAL.map(([n, h, ic]) => `<a href="${h}" ${h.startsWith('http') ? 'target="_blank" rel="noopener"' : ''} aria-label="${esc(n)}" title="${esc(n)}">${ic}</a>`).join('')}</span></span></div>
      <header class="iv-head">
        <nav class="iv-nav ${state.navOpen ? 'open' : ''}" id="nav-links" aria-label="Main">
          ${GROUPS.map(g => `<div class="iv-nav-item ${g.bullion ? 'is-gold' : ''}"><a href="#/shop/${g.key}" ${active(g) ? 'aria-current="page"' : ''}>${esc(g.name)}</a>
            <div class="iv-drop">${g.cats.map(c => `<a href="#/shop/${c.slug}">${esc(c.name)}</a>`).join('')}</div></div>`).join('')}</nav>
        <a href="#/" class="iv-logo" aria-label="Avya Jewels home">${logo('')}</a>
        <div class="iv-right"><button class="iv-iconbtn" data-act="openSearch" aria-label="Search" aria-haspopup="dialog">${SEARCH_ICON}<span class="iv-hide-m">Search</span></button>
          <a href="${waLink()}" class="iv-iconbtn iv-hide-m" target="_blank" rel="noopener" aria-label="WhatsApp" title="WhatsApp">${svgWA(19)}</a>
          <a href="${telLink}" class="iv-iconbtn iv-call" aria-label="Call ${esc(STORE.phone)}">${PHONE_ICON}</a>
          <a href="#/bag" class="iv-cart" aria-label="Bag, ${t.count} item${t.count === 1 ? '' : 's'}" title="Bag">${CART_ICON}${t.count ? `<span class="iv-cart-count">${t.count}</span>` : ''}</a>
          <button class="iv-burger" data-act="toggleNav" aria-label="Menu" aria-expanded="${state.navOpen}" aria-controls="nav-links">${state.navOpen ? ICON.close : ICON.menu}</button></div>
      </header>
      ${state.searchOpen ? `<div class="iv-search" role="dialog" aria-modal="true" aria-label="Search the collection">
        <div class="iv-search-backdrop" data-act="closeSearch"></div>
        <form class="iv-search-panel" data-form="search" role="search">
          <div class="iv-search-row">${SEARCH_ICON}<input id="iv-q" type="search" placeholder="Search rings, earrings, gold bars…" aria-label="Search" autocomplete="off" data-model="q" value="${esc(state.form.q || '')}">
            <button type="button" class="iv-search-close" data-act="closeSearch" aria-label="Close search">${ICON.close}</button></div>
          <div id="iv-search-results">${searchResults(state.form.q)}</div>
        </form></div>` : ''}
      <a class="iv-wa" href="${waLink()}" target="_blank" rel="noopener" aria-label="Chat with Avya Jewels on WhatsApp" title="Chat on WhatsApp">${WA_ICON}</a>`;
  }

  function footer() {
    const cols = [
      { h: 'Shop', links: GROUPS.map(g => [g.name, '#/shop/' + g.key]) },
      { h: 'Avya', links: [['Our story', '#/studio'], ['Visit us', '#/studio'], ['Bridal & bulk orders', waLink('Hi Avya Jewels, I’d like to ask about a bridal or bulk order.')]] },
      { h: 'Help', links: [['Delivery & pick-up', '#/policies'], ['Payment', '#/policies'], ['Returns', '#/policies'], ['Privacy policy', '#/policies']] }
    ];
    return `<footer class="iv-foot">
      <div class="iv-foot-grid">
        <div class="iv-foot-brand">${logo('iv-foot-logo')}
          <span><i>First rays of the sun.</i> 925 sterling silver jewellery and 99.99% pure gold and silver bars and coins, from our family in Mississauga.</span>
          <span class="iv-foot-contact"><a href="${waLink()}" target="_blank" rel="noopener">WhatsApp ${esc(STORE.phone)}</a><a href="mailto:${esc(STORE.email)}">${esc(STORE.email)}</a><span>${esc(STORE.hours)}</span><span>Pay by Interac e-Transfer or cash</span></span></div>
        ${cols.map(col => `<div class="iv-foot-col"><span class="iv-label light">${col.h}</span>${col.links.map(([l, h]) => `<a href="${h}" ${h.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>${esc(l)}</a>`).join('')}</div>`).join('')}
      </div>
      <div class="iv-foot-base"><span>© 2026 Avya Jewels · ${esc(STORE.area)}</span><span>All prices in CAD${STORE.taxIncluded ? ', taxes included' : ''} · All sales final</span></div>
    </footer>`;
  }

  /* Card used in the bestseller band: centred, outline button under it. */
  function bandCard(p) {
    const action = onRequest(p) ? `<a class="iv-btn ghost block sm" href="${askLink(p)}" target="_blank" rel="noopener">Ask today’s price</a>`
      : soldOut(p) ? `<button class="iv-btn ghost block sm" disabled>Sold out</button>`
        : `<button class="iv-btn ghost block sm ${state.justAdded[p.id] ? 'on' : ''}" data-act="quickAdd" data-arg="${p.id}">${addLabel(p.id)}</button>`;
    return `<div class="iv-bcard">
      <a href="#/product/${p.id}" class="iv-img portrait on-ivory">${p.tag ? `<span class="iv-tag">${esc(p.tag)}</span>` : ''}${photo(p.img, p.name)}</a>
      <div class="iv-bcard-info"><a href="#/product/${p.id}" class="iv-serif-22">${esc(p.name)}</a><span class="iv-muted">${esc(p.material)}</span><span class="iv-price-sm">${priceHtml(p)}</span></div>
      ${action}
    </div>`;
  }

  /* Card used in the collection grid: name left, price right, swatches + underline action. */
  function productCard(p) {
    const action = onRequest(p) ? `<a class="iv-underline" href="${askLink(p)}" target="_blank" rel="noopener">Ask today’s price</a>`
      : soldOut(p) ? `<span class="iv-muted">Sold out</span>` : `<button class="iv-underline" data-act="quickAdd" data-arg="${p.id}">${addLabel(p.id)}</button>`;
    return `<div class="iv-pcard">
      <a href="#/product/${p.id}" class="iv-img portrait">${p.tag ? `<span class="iv-tag">${esc(p.tag)}</span>` : ''}${photo(p.img, p.name)}</a>
      <div class="iv-pcard-row"><div class="stack" style="gap:3px"><a href="#/product/${p.id}" class="iv-serif-24">${esc(p.name)}</a><span class="iv-muted">${esc(p.material)}</span></div><span class="iv-price-sm" style="padding-top:6px;text-align:right">${priceHtml(p)}</span></div>
      <div class="iv-pcard-row center"><span class="iv-swatches">${metalOf(p).map(m => `<span style="background:${METAL_SW[m]}" title="${m}"></span>`).join('')}</span>${action}</div>
    </div>`;
  }

  /* Today's gold and silver rate, if the team has set it in Admin → Settings. */
  function rates(light, buyback) {
    const sp = STORE.spot;
    const rate = (label, oz) => `<div><span class="n">${label}</span>${oz ? `<span class="t">${label === 'Gold' ? cad(Math.round(oz)) : money(oz)} / oz</span><span class="b">Spot price, CAD</span>` : `<span class="t">Ask for today’s rate</span><span class="b">Live market price</span>`}</div>`;
    const when = sp.updated_at ? new Date(sp.updated_at).toLocaleString('en-CA', { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : null;
    return `<div class="iv-steps iv-rates ${light ? 'light' : ''} ${buyback ? '' : 'two'}">${rate('Gold', sp.gold_oz)}${rate('Silver', sp.silver_oz)}
      ${buyback ? '<div><span class="n">We buy</span><span class="t">Gold &amp; silver bullion</span><span class="b">Sealed, or purity-tested first</span></div>' : ''}</div>
      ${when ? `<span class="iv-rates-note">Updated ${esc(when)}. Bar and coin prices are confirmed on WhatsApp.</span>` : ''}`;
  }

  /* Round category buttons under the hero: a line icon per category (chosen from its name),
     gold-toned for gold, silver-toned for silver bullion, teal for jewellery. */
  const CAT_ICONS = {
    ring: '<circle cx="12" cy="15" r="5.5"/><path d="M9.2 4.5h5.6l1.7 2.4L12 10.3 7.5 6.9z"/><path d="M7.5 6.9h9"/>',
    earring: '<circle cx="12" cy="4.6" r="1.6"/><path d="M12 6.2v2.4"/><path d="M12 8.6c-2.4 2.9-3.6 5-3.6 6.9a3.6 3.6 0 0 0 7.2 0c0-1.9-1.2-4-3.6-6.9z"/>',
    pendant: '<path d="M3.5 3.5c1.6 5.6 4.6 8.5 8.5 8.5s6.9-2.9 8.5-8.5"/><path d="M12 12v1.4"/><path d="M12 13.4l-2.7 3.3 2.7 3.8 2.7-3.8z"/>',
    bracelet: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="4.5" r="1.6"/><circle cx="19.5" cy="12" r="1.6"/><circle cx="12" cy="19.5" r="1.6"/><circle cx="4.5" cy="12" r="1.6"/>',
    beads: '<circle cx="12" cy="4.8" r="1.7"/><circle cx="17.1" cy="6.9" r="1.7"/><circle cx="19.2" cy="12" r="1.7"/><circle cx="17.1" cy="17.1" r="1.7"/><circle cx="12" cy="19.2" r="1.7" fill="currentColor"/><circle cx="6.9" cy="17.1" r="1.7"/><circle cx="4.8" cy="12" r="1.7"/><circle cx="6.9" cy="6.9" r="1.7"/>',
    kada: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="5.5"/><path d="M12 4v2.5M12 17.5V20M4 12h2.5M17.5 12H20"/>',
    chain: '<rect x="2.5" y="9" width="8.5" height="6" rx="3"/><rect x="13" y="9" width="8.5" height="6" rx="3"/><path d="M9 12h6"/>',
    bowl: '<path d="M3 10.5h18c0 4.6-4 8-9 8s-9-3.4-9-8z"/><path d="M9 20.5h6"/><path d="M8.5 7c.8-1 .8-2 0-3M12 7c.8-1 .8-2 0-3M15.5 7c.8-1 .8-2 0-3"/>',
    spoon: '<ellipse cx="12" cy="6.8" rx="3.4" ry="4.3"/><path d="M12 11.1V21"/>',
    bar: '<path d="M3.5 17.5l3-8.5h11l3 8.5z"/><path d="M8.5 13.5h7"/><path d="M6.5 9l1-2.5h9l1 2.5"/>',
    coin: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="6"/><path d="M12 8.6l1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z"/>',
    diamond: '<path d="M6.5 4h11l3.5 5-9 11L3 9z"/><path d="M3 9h18M9.5 4L12 9l2.5-5M8 9l4 11 4-11"/>',
    all: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>'
  };
  const iconOf = c => {
    const t = (c.name + ' ' + c.slug).toLowerCase();
    return /spoon/.test(t) ? 'spoon' : /bowl|utensil/.test(t) ? 'bowl' : /coin/.test(t) ? 'coin' : /\bbars?\b|bullion/.test(t) ? 'bar'
      : /nazar/.test(t) ? 'beads' : /kada|bangle/.test(t) ? 'kada' : /chain/.test(t) ? 'chain' : /bracelet/.test(t) ? 'bracelet'
        : /pendant|necklace/.test(t) ? 'pendant' : /earring|stud|hoop/.test(t) ? 'earring' : /ring/.test(t) ? 'ring' : 'diamond';
  };
  const toneOf = c => /gold/i.test(c.name + ' ' + c.slug) ? 'gold' : (c.kind === 'bullion' && /silver/i.test(c.name + ' ' + c.slug)) ? 'silver' : 'teal';
  function categoryCircles() {
    const cats = GROUPS.flatMap(g => g.cats);
    const circle = (href, name, icon, tone) => `<a href="${href}" class="iv-circle"><span class="iv-circle-img tone-${tone}">${svg(CAT_ICONS[icon], 34)}</span><span class="iv-circle-name">${esc(name)}</span></a>`;
    return `<nav class="iv-cats iv-circles" aria-label="Shop by category"><div class="iv-circle-wrap at-start">
      <button type="button" class="iv-circle-btn prev" data-act="circleScroll" data-arg="-1" aria-label="Scroll categories left">${svg('<path d="M15 5l-7 7 7 7"/>', 20)}</button>
      <div class="iv-circle-track">
      ${cats.map(c => circle('#/shop/' + c.slug, c.name, iconOf(c), toneOf(c))).join('')}
      ${circle('#/shop', 'View all', 'all', 'dark')}
      </div>
      <button type="button" class="iv-circle-btn next" data-act="circleScroll" data-arg="1" aria-label="Scroll categories right">${svg('<path d="M9 5l7 7-7 7"/>', 20)}</button>
    </div></nav>`;
  }

  /* ── Home hero: full-width photo carousel — slides by itself, arrows, dots and swipe ── */
  const HERO_IMG = f => '../assets/web/hero/' + f;
  const heroSlides = () => [
    { img: 'jewellery', kicker: 'Avya Jewels · Mississauga', title: 'Silver jewellery. <i>Gold &amp; silver bars.</i>',
      text: '925 sterling silver jewellery, and 99.99% pure gold and silver bars and coins — all in one place.',
      ctas: [['Shop jewellery', '#/shop/' + jewelleryKey], ['Shop gold & silver', '#/shop/' + bullionKey]] },
    { img: 'gold-bar', kicker: '99.99% pure gold', title: 'Gold bars, <i>at today’s rate.</i>',
      text: 'RCM, PAMP and Valcambi bars from 1 g to 100 g — sealed and certified.',
      ctas: [['Shop gold bars', '#/shop/gold-bars'], ['Ask today’s price', waLink('Hi Avya Jewels, could you share today’s gold price?')]] },
    { img: 'diwali', kicker: 'Diwali & festive gifting', title: 'Lakshmi gold <i>for the Festival of Lights.</i>',
      text: 'Lakshmi Diwali gold bars and Ganpati silver coins — a blessing that keeps its value.',
      ctas: [['Shop festive gold', '#/shop/gold-bars'], ['Silver coins', '#/shop/silver-coins']] },
    { img: 'silver-ring', kicker: '925 sterling silver', title: 'Rings that <i>catch the light.</i>',
      text: 'Hallmarked, stamped and set by hand — in Canadian sizes 5 to 14.',
      ctas: [['Shop rings', '#/shop/silver-rings'], ['All jewellery', '#/shop/' + jewelleryKey]] },
    { img: 'silver-bars', kicker: '99.99% pure silver', title: 'Silver bars <i>and coins.</i>',
      text: 'Royal Canadian Mint 1 kg and 100 oz bars, plus 1 oz coins.',
      ctas: [['Shop silver bars', '#/shop/silver-bars'], ['Ask today’s price', waLink('Hi Avya Jewels, could you share today’s silver price?')]] }
  ];
  let heroAt = 0;
  function heroCarousel() {
    const slides = heroSlides(), n = slides.length;
    return `<section class="iv-hero-car" aria-roledescription="carousel" aria-label="Featured at Avya Jewels">
      <div class="iv-car-track" style="transform:translateX(-${heroAt * 100}%)">
        ${slides.map((s, i) => { const on = i === heroAt, h = i ? 'h2' : 'h1'; return `<div class="iv-slide ${on ? 'on' : ''}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${n}" ${on ? '' : 'aria-hidden="true"'}>
          <picture><source media="(max-width: 760px)" srcset="${HERO_IMG(s.img + '-m.webp')}"><img src="${HERO_IMG(s.img + '.webp')}" alt="" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"></picture>
          <div class="iv-slide-copy"><span class="iv-label">${s.kicker}</span><${h} class="iv-slide-title">${s.title}</${h}><p>${s.text}</p>
            <div class="iv-ctas">${s.ctas.map(([l, href], j) => `<a href="${href}" class="iv-btn on-dark ${j ? 'ghost' : ''}" ${href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''} ${on ? '' : 'tabindex="-1"'}>${l}</a>`).join('')}</div></div>
        </div>`; }).join('')}
      </div>
      <button type="button" class="iv-car-btn prev" data-act="heroStep" data-arg="-1" aria-label="Previous slide">${svg('<path d="M15 5l-7 7 7 7"/>', 22)}</button>
      <button type="button" class="iv-car-btn next" data-act="heroStep" data-arg="1" aria-label="Next slide">${svg('<path d="M9 5l7 7-7 7"/>', 22)}</button>
      <div class="iv-car-dots">${slides.map((s, i) => `<button type="button" class="${i === heroAt ? 'on' : ''}" data-act="heroGo" data-arg="${i}" aria-label="Show slide ${i + 1}" ${i === heroAt ? 'aria-current="true"' : ''}></button>`).join('')}</div>
    </section>`;
  }

  function groupCard(g) {
    const pics = REAL().filter(p => inFilter(p, g.key));
    const cover = pics.find(p => !p.bullion && p.sw.includes('rosetone')) || pics[0];
    return `<article class="iv-group">
      <a href="#/shop/${g.key}" class="iv-img iv-group-img ${cover ? '' : 'empty'}" aria-label="${esc(g.name)}">${cover ? photo(cover.img, g.name) : `<span class="iv-group-mark" aria-hidden="true">${esc(g.name[0])}</span><span class="iv-label accent">New pieces arriving</span>`}</a>
      <div class="iv-group-body">
        <a href="#/shop/${g.key}" class="iv-serif-28">${esc(g.name)}</a>
        <ul>${g.cats.map(c => { const n = countIn(c.slug); return `<li><a href="#/shop/${c.slug}">${esc(c.name)}</a><span>${n ? n : 'Soon'}</span></li>`; }).join('')}</ul>
      </div></article>`;
  }

  function home() {
    const big = byId('starflower-ring') || REAL().find(p => !p.bullion) || REAL()[0];
    const side = byId('rcm-100g-gold-bar') || byId('maple-leaf-1oz-coin') || REAL().find(p => p.bullion) || REAL()[1];
    const tabs = { 'Silver jewellery': p => !p.bullion, 'Gold & silver': p => p.bullion };
    const tab = tabs[state.homeTab] ? state.homeTab : 'Silver jewellery';
    const featured = REAL().filter(tabs[tab]);
    const picks = [...featured.filter(p => p.tag), ...featured.filter(p => !p.tag)].slice(0, 4);
    const bar = byId('rcm-100g-gold-bar') || side;
    const promises = [
      { t: '925 hallmarked silver', b: 'Stamped on every piece of jewellery.' },
      { t: '99.99% pure bullion', b: 'Sealed, with assay certificates where applicable.' },
      { t: 'Free GTA delivery', b: 'On orders over $200 — or pick up in Mississauga.' },
      { t: 'Quick replies', b: 'On WhatsApp, usually within 15 to 30 minutes.' }
    ];
    return `
    ${heroCarousel()}

    ${categoryCircles()}

    <section class="iv-band">
      <div class="iv-band-head"><div class="stack" style="gap:10px"><span class="iv-label accent">Most loved</span><h2 class="iv-h2">Our bestsellers</h2></div>
        <div class="iv-tabs" role="tablist">${Object.keys(tabs).map(t => `<button role="tab" aria-selected="${t === tab}" class="${t === tab ? 'on' : ''}" data-act="homeTab" data-arg="${t}">${t}</button>`).join('')}</div></div>
      <div class="iv-band-grid">${picks.map(bandCard).join('')}</div>
    </section>

    <section class="iv-bespoke" id="bullion">
      <div class="iv-img iv-bespoke-img">${photo(bar.img2 || bar.img, bar.name)}</div>
      <div class="iv-bespoke-copy">
        <span class="iv-label lilac">Gold &amp; silver bullion</span>
        <h2 class="iv-h2 light">Pure gold and silver, <i>at today’s rate.</i></h2>
        <p>99.99% pure bars and coins from RCM, PAMP and Valcambi — plus Lakshmi Diwali gold bars and Lakshmi Ganpati silver coins. Every bar and coin comes sealed, with an assay certificate where applicable.</p>
        <p class="iv-weights"><b>Gold bars</b> 1 g · 2.5 g · 5 g · 10 g · 1 oz · 50 g · 100 g<br><b>Silver</b> 1 kg and 100 oz bars · 1 oz, 5 g and 10 g coins</p>
        ${rates(false, true)}
        <div class="iv-ctas"><a href="${waLink('Hi Avya Jewels, could you share today’s gold and silver prices?')}" target="_blank" rel="noopener" class="iv-btn lilac">Ask today’s price</a><a href="#/shop/${bullionKey}" class="iv-link lilac">Browse bars &amp; coins</a></div>
      </div>
    </section>

    <section class="iv-sec iv-festive">
      <div class="stack" style="gap:12px"><span class="iv-label accent">Diwali &amp; Christmas</span><h2 class="iv-h2">Gifts that <i>hold their value</i></h2>
        <p class="iv-lead">Lakshmi gold bars and Ganpati silver coins for Diwali, silver for little ones, and jewellery for the people you love. Free gift wrapping on request for orders over $${STORE.giftMin}.</p></div>
      <div class="iv-festive-links">${[['Gold bars', 'gold-bars'], ['Silver coins', 'silver-coins'], ['Kids', 'kids'], ['Earrings', 'silver-earrings']].filter(([, k]) => CATS.includes(k)).map(([l, k]) => `<a href="#/shop/${k}" class="iv-btn ghost">${l}</a>`).join('')}</div>
    </section>

    ${reviewsBlock(REVIEWS, 'What our customers say')}

    <section class="iv-story-teaser">
      <div class="stack" style="gap:14px"><span class="iv-label accent">Our story</span>
        <h2 class="iv-h2">From India to Canada, <i>a journey of passion</i></h2>
        <p class="iv-body">Avya Jewels is rooted in more than ten years in gold and silver, a journey that began in India alongside our founder’s father. Today it is a family venture in Mississauga — fine jewellery for life’s milestones, and pure gold and silver bars and coins to save, invest and gift.</p>
        <a href="#/studio" class="iv-link dark">Read our story &amp; visit us</a></div>
    </section>

    <section class="iv-promises">${promises.map(v => `<div><span class="iv-serif-22">${v.t}</span><span class="iv-muted">${v.b}</span></div>`).join('')}</section>`;
  }

  function shop() {
    if (!CATS.includes(state.filter)) state.filter = 'All';
    const f = state.filter;
    const group = groupOf(f) || groupOfCat(f);
    const isBullion = !!(group && group.bullion);
    const q = (state.q || '').trim();
    const list = REAL().filter(p => inFilter(p, f) && (!state.metal || metalOf(p).includes(state.metal)) && (!q || matchQ(p, q)));
    const tabs = group ? [[group.key, 'All ' + group.name.toLowerCase()], ...group.cats.map(c => [c.slug, c.name])] : [['All', 'Everything'], ...GROUPS.map(g => [g.key, g.name])];
    const lead = q ? `${list.length} piece${list.length === 1 ? '' : 's'} found. <button class="iv-underline" data-act="clearSearch">Clear search</button>`
      : esc((catOf(f) || {}).description || (group && GROUP_COPY[group.key]) || 'Silver jewellery for women, men and kids, silver utensils, and 99.99% pure gold and silver bars and coins.');
    const crumbs = ['Home', 'Shop', group && group.name, catOf(f) && catOf(f).name].filter(Boolean).join(' / ');
    return `
    <section class="iv-shop-head">
      <div class="stack" style="gap:14px"><span class="iv-label">${esc(crumbs)}</span><h1 class="iv-h1 shop">${q ? 'Results for “' + esc(q) + '”' : esc(catLabel(f === 'All' ? 'All' : f))}</h1></div>
      <p class="iv-lead">${lead}</p>
    </section>
    <div class="iv-filterbar">
      <div class="iv-tabs">${tabs.map(([k, l]) => `<button class="${f === k ? 'on' : ''}" data-act="filter" data-arg="${k}">${esc(l)} <span>${countIn(k)}</span></button>`).join('')}</div>
      ${isBullion ? `<span class="iv-muted">Prices follow the live market · <a href="${waLink('Hi Avya Jewels, could you share today’s gold and silver prices?')}" target="_blank" rel="noopener">ask on WhatsApp</a></span>`
        : `<div class="iv-metals"><span>Metal</span>${Object.keys(METALS).map(m => `<button class="iv-sw ${state.metal === m ? 'on' : ''}" style="background:${METAL_SW[m]}" data-act="metal" data-arg="${m}" title="${m}" aria-label="${m}" aria-pressed="${state.metal === m}"></button>`).join('')}</div>`}
    </div>
    ${isBullion && !q ? `<section class="iv-rate-strip">${rates(true)}</section>` : ''}
    <section class="iv-grid">${list.map(productCard).join('')}</section>
    ${list.length ? '' : q ? `<div class="iv-empty"><span class="iv-serif-28">No pieces match “${esc(q)}”.</span><button class="iv-btn ghost" data-act="clearSearch">Clear search</button></div>`
      : state.metal ? `<div class="iv-empty"><span class="iv-serif-28">Nothing in that metal yet.</span><button class="iv-btn ghost" data-act="metal" data-arg="${state.metal}">Clear metal</button></div>`
        : `<div class="iv-empty"><span class="iv-serif-28">New pieces are on their way.</span><p class="iv-body">We’re photographing our ${esc(catLabel(f).toLowerCase())} now. Message us to see what’s in stock today.</p><a class="iv-btn" href="${waLink('Hi Avya Jewels, what do you have in ' + catLabel(f) + '?')}" target="_blank" rel="noopener">Ask on WhatsApp</a></div>`}`;
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
    const fins = p.sw.map(k => ({ name: FINISH_OF[k], swatch: SW[k] })).filter(f => f.name);
    const { finish, size, added } = state.pdp;
    const imgs = (p.gallery || [p.img, p.img2]).slice(0, p.video ? 2 : 3);
    const group = groupOfCat(p.cat);
    const same = REAL().filter(x => x.id !== p.id && x.cat === p.cat).slice(0, 2);
    const pairs = same.concat(REAL().filter(x => x.id !== p.id && x.cat !== p.cat && x.bullion !== p.bullion).slice(0, 4 - same.length));
    const ask = onRequest(p);
    const orderMsg = 'Hi Avya Jewels, I’d like to order the ' + p.name + (size ? ' (size ' + size + ')' : '') + (finish && !ask ? ' in ' + finish : '') + '.';
    const extra = [
      ...(ask ? [] : [['Order on WhatsApp', waLink(orderMsg)]]),
      ['Ask a question', waLink('Hi Avya Jewels, I have a question about the ' + p.name + '.')],
      ['Book a visit', waLink('Hi Avya Jewels, I’d like to book a visit to see the ' + p.name + '.')]
    ];
    const buy = (ask
      ? `<a class="iv-btn block lg" href="${askLink(p)}" target="_blank" rel="noopener">Ask today’s price on WhatsApp</a>`
      : soldOut(p) ? `<button class="iv-btn block lg" disabled>Sold out</button>`
        : `<button class="iv-btn block lg" data-act="addToBag">${added ? 'Added — view bag (' + totals().count + ')' : 'Add to bag · ' + money(p.price)}</button>`)
      + `<div class="iv-pdp-links">${extra.map(([l, h]) => `<a href="${h}" target="_blank" rel="noopener">${l}</a>`).join('')}<button type="button" data-act="share">Share</button></div>`;
    const weight = g => !g ? null : Math.abs(g / 31.1035 - Math.round(g / 31.1035)) < 0.01 ? Math.round(g / 31.1035) + ' oz' : (g >= 1000 ? g / 1000 + ' kg' : +(+g).toFixed(1) + ' g');
    const details = (p.bullion
      ? [['Weight', weight(p.grams)], ['Purity', p.purity ? p.purity + '% pure' : '99.99% pure'], ['Brand / mint', p.brand], ['Design', p.design], ['Packaging', p.packaging], ['Assay certificate', p.certificate ? 'Included' : null], ['Product code', p.sku]]
      : [['Metal', (p.metal || (/gold/i.test(p.material || '') && !/silver/i.test(p.material || '') ? 'gold' : 'silver')).replace(/^./, m => m.toUpperCase())], ['Purity', p.metal === 'gold' ? (p.purity || 'Hallmarked gold') : (p.purity || '925') + ' · hallmarked & stamped'], ['Product code', p.sku]]
    ).filter(([, v]) => v);
    const notes = [p.bullion ? 'Certified 99.99%' : p.metal === 'gold' ? 'Hallmarked gold' : 'Hallmarked 925 silver', 'Free GTA delivery over $200', 'Pick-up in Mississauga', 'All sales final'];
    return `
    <section class="iv-pdp">
      <div class="iv-gallery">
        ${imgs.map((s, i) => `<button type="button" class="iv-img iv-zoomable ${i ? 'half' : 'main'}" data-act="zoom" data-arg="${i}" aria-label="View ${esc(p.name)} image ${i + 1} full screen">${!i && p.tag ? `<span class="iv-tag">${esc(p.tag)}</span>` : ''}${photo(s, p.name + (i ? ' — view ' + (i + 1) : ''), !i)}<span class="iv-zoom-hint" aria-hidden="true">${ZOOM_ICON}</span></button>`).join('')}
        ${p.video ? `<div class="iv-img half"><video src="${p.video}" poster="${p.img}" autoplay muted loop playsinline aria-label="${esc(p.name)} video"></video></div>` : ''}
      </div>
      <div class="iv-buy">
        <div class="stack" style="gap:12px">
          <span class="iv-label accent">${esc([group && group.name, catLabel(p.cat)].filter(Boolean).join(' · '))}</span>
          <h1 class="iv-h1 title">${esc(p.name)}</h1>
          <div class="iv-price-row"><span class="iv-price">${priceHtml(p)}</span><span class="iv-muted">${ask ? 'Live market price · confirmed on WhatsApp' : stockNote(p) + (STORE.taxIncluded ? ' · tax included' : '')}</span></div>
          <p class="iv-body">${esc(p.desc)}</p>
          ${details.length ? `<dl class="iv-specs">${details.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
        </div>
        ${fins.length && !ask ? `<div class="iv-opt"><div class="iv-opt-head"><span>Metal</span><span>${esc(finish || '')}</span></div>
          <div class="iv-opt-row">${fins.map(f => `<label class="iv-choice"><input type="radio" name="pfin" data-pdp="finish" value="${esc(f.name)}" ${finish === f.name ? 'checked' : ''}><span class="sw" style="background:${f.swatch}"></span>${esc(f.name)}</label>`).join('')}</div></div>` : ''}
        ${sz && !ask ? `<div class="iv-opt"><div class="iv-opt-head"><span>${esc(sz.label)}${/ring/i.test(sz.label) ? ' (CA/US)' : ''}</span><span>${esc(size || '')}</span></div>
          <div class="iv-sizes">${sz.opts.map(v => `<label class="iv-choice"><input type="radio" name="psize" data-pdp="size" value="${esc(v)}" ${size === v ? 'checked' : ''}>${esc(v)}</label>`).join('')}</div></div>` : ''}
        ${ask ? rates(true) : ''}
        <div class="stack" style="gap:10px">
          ${buy}
          <span class="iv-note">${notes.join(' · ')}</span>
        </div>
        <div class="iv-acc">${(p.accordions || CONTENT.accordions).map((a, i) => (i === 0 && p.care ? { ...a, body: p.care } : a)).map((a, i) => `<button class="iv-acc-item" data-act="acc" data-arg="${i}" aria-expanded="${state.open === i}"><span class="iv-acc-head"><span>${esc(a.title)}</span><span class="pm">${state.open === i ? '−' : '+'}</span></span>${state.open === i ? `<p>${esc(a.body)}</p>` : ''}</button>`).join('')}</div>
      </div>
    </section>
    <section class="iv-band">
      <div class="iv-band-head"><h2 class="iv-h2 sm">You may also like</h2><a href="#/shop" class="iv-link dark">Shop all</a></div>
      <div class="iv-pairs">${pairs.map(x => `<a href="#/product/${x.id}" class="iv-pair"><div class="iv-img square on-ivory">${photo(x.img, x.name)}</div><div class="iv-pair-row"><span class="iv-serif-20">${esc(x.name)}</span><span>${priceHtml(x)}</span></div></a>`).join('')}</div>
    </section>
    ${state.zoom !== null && state.zoom !== undefined ? lightbox(p, imgs) : ''}`;
  }

  /* ── Bag & checkout: orders are confirmed and paid over WhatsApp (e-Transfer or cash). ── */
  function totals() {
    const lines = state.cart.map(l => ({ ...l, p: byId(l.id), sum: l.price * l.qty })).filter(l => l.p);
    const goods = lines.reduce((a, l) => a + l.sum, 0);
    const gift = !!state.gift && lines.length > 0 && goods >= STORE.giftMin;
    const giftCost = gift ? +(SITE.gift_wrap_fee || 0) : 0;
    const usable = SHIP.filter(o => !o.minOrder || goods >= o.minOrder);
    const opt = usable.find(o => o.id === state.ship) || usable[0] || SHIP[0];
    const shipCost = !goods || (opt.freeOver != null && goods >= opt.freeOver) ? 0 : opt.price;
    const rate = STORE.taxIncluded ? 0 : +((SITE.tax_rates || {})[SITE.default_province || 'ON'] || 0);
    const taxable = lines.filter(l => !(l.p && l.p.taxExempt)).reduce((a, l) => a + l.sum, 0);
    const tax = Math.round((taxable + giftCost + shipCost) * rate) / 100;
    return {
      lines, goods, gift, giftCost, opt, shipCost, tax, rate,
      total: goods + giftCost + shipCost + tax,
      count: lines.reduce((a, l) => a + l.qty, 0),
      shipping: shipCost ? money(shipCost) : 'Free'
    };
  }

  function summaryRows(t) {
    return `<div class="between"><span class="soft">Subtotal</span><span>${money(t.goods)}</span></div>
      ${t.gift ? `<div class="between"><span class="soft">Gift wrapping</span><span>${t.giftCost ? money(t.giftCost) : 'Free'}</span></div>` : ''}
      <div class="between"><span class="soft">${esc(t.opt ? t.opt.name : 'Delivery')}</span><span>${t.shipping}</span></div>
      <div class="between"><span class="soft">Taxes</span><span>${STORE.taxIncluded ? 'Included' : money(t.tax)}</span></div>`;
  }

  function bag() {
    const t = totals();
    const gta = SHIP.find(o => o.minOrder);
    const pct = gta ? Math.min(100, t.goods / gta.minOrder * 100) : 100;
    return `
    <section class="bag">
      <div class="stack" style="gap:16px">
        <div class="between" style="align-items:baseline"><h1 style="font-size:42px;letter-spacing:-.035em">Your bag</h1><span class="muted" style="font-size:14px">${t.count} item${t.count === 1 ? '' : 's'}</span></div>
        ${gta && t.count ? `<div class="ship-meter"><span>${t.goods >= gta.minOrder ? 'Free home delivery across the GTA is unlocked.' : 'Add ' + money(gta.minOrder - t.goods) + ' for free home delivery across the GTA — or pick up in Mississauga.'}</span><div class="track"><div class="fill" style="width:${pct}%"></div></div></div>` : ''}
        ${t.lines.length ? '' : `<div class="stack" style="gap:16px;align-items:flex-start;padding:24px 0"><p class="soft">Your bag is empty.</p><a href="#/shop" class="btn btn-primary">Continue shopping</a></div>`}
        ${t.lines.map(l => `<div class="line-item fade-rule">
          <a href="${href(l.id)}" class="ph md">${photo(l.p.img, l.p.name)}</a>
          <div class="stack" style="gap:4px"><a href="${href(l.id)}" style="font-size:17px;font-weight:500">${esc(l.p.name)}</a><span style="font-size:13px" class="muted">${esc(l.variant)}</span>
            <div class="row" style="gap:12px;margin-top:auto;padding-top:8px"><div class="qty"><button class="btn btn-icon" data-act="qty" data-arg="${esc(l.key)}" data-d="-1" aria-label="Decrease">−</button><span>${l.qty}</span><button class="btn btn-icon" data-act="qty" data-arg="${esc(l.key)}" data-d="1" aria-label="Increase">+</button></div>
            <button class="btn btn-ghost" style="font-size:13px" data-act="remove" data-arg="${esc(l.key)}">Remove</button></div></div>
          <span class="price" style="font-size:16px;font-weight:500">${money(l.sum)}</span></div>`).join('')}
        ${t.count ? (t.goods >= STORE.giftMin
          ? `<button class="option-box radio check ${state.gift ? 'on' : ''}" data-act="gift" style="background:transparent;border:0;font:inherit;color:inherit;text-align:left" aria-pressed="${!!state.gift}">
              <span class="row" style="gap:12px"><span class="dot"></span><span class="stack"><span>Add free gift wrapping</span><span style="font-size:12px" class="muted">On request for orders over $${STORE.giftMin}</span></span></span><span>Free</span></button>`
          : `<p class="muted" style="font-size:13px;margin:0">Free gift wrapping on request for orders over $${STORE.giftMin}.</p>`) : ''}
      </div>
      <aside class="card elev-md on-bg summary">
        <span class="card-title">Order summary</span>
        ${summaryRows(t)}
        <div class="rule"></div>
        <div class="between total"><span>Total</span><span>${money(t.total)} <span style="font-size:13px" class="muted">CAD</span></span></div>
        <a href="#/checkout" class="btn btn-primary btn-block ${t.count ? '' : 'disabled'}" style="padding:14px;font-size:15px;${t.count ? '' : 'pointer-events:none;opacity:.45'}">Checkout</a>
        <div class="assure"><span>${ICON.check} Pay by e-Transfer or cash</span><span>${ICON.check} Confirmed on WhatsApp in 15–30 min</span><span>${ICON.check} ${STORE.taxIncluded ? 'Prices include tax' : 'Bullion carries no tax'}</span><span>${ICON.check} All sales final</span></div>
      </aside>
    </section>`;
  }

  function checkout() {
    const done = state.placed;
    if (done) {
      return `<section class="checkout"><div class="checkout-form" style="gap:18px">
        <span class="eyebrow neutral">${done.code ? 'Order request ' + esc(done.code) : 'Almost done'}</span>
        <h2>Send your order on WhatsApp</h2>
        <p class="soft">${esc(done.message)}</p>
        <p class="soft">Total ${money(done.total)} CAD · we reply within 15–30 minutes with e-Transfer details, or arrange cash on pick-up.</p>
        ${done.whatsapp_url ? `<a class="btn btn-primary" style="padding:15px;font-size:15px;align-self:flex-start" href="${esc(done.whatsapp_url)}" target="_blank" rel="noopener">Open WhatsApp to send order</a>` : ''}
        <a href="#/shop" class="btn btn-secondary" style="align-self:flex-start">Keep shopping</a></div></section>`;
    }
    const t = totals();
    const f = state.form;
    const delivering = t.opt && t.opt.id !== 'pickup';
    const field = (label, key, attrs = '', span = '') => `<div class="field" ${span}><label for="co-${key}">${label}</label><input id="co-${key}" class="input" data-model="${key}" value="${esc(f[key] || '')}" ${attrs}></div>`;
    return `
    <section class="checkout">
      <form class="checkout-form" data-form="checkout">
        <div class="stack" style="gap:6px"><h3>Your details</h3><span class="soft" style="font-size:13px">Place your order and WhatsApp opens with it ready to send. We reply within 15–30 minutes to confirm — pay in full by e-Transfer, or cash on pick-up. Nothing is charged here.</span></div>
        <div class="grid-2">
          ${field('Full name', 'name', 'required autocomplete="name"')}
          ${field('Phone (WhatsApp)', 'phone', 'required type="tel" autocomplete="tel" pattern="[0-9+()\\-\\s.]{7,}"')}
          ${field('Email for a confirmation (optional)', 'email', 'type="email" autocomplete="email"', 'style="grid-column:1/-1"')}
        </div>
        <div class="stack" style="gap:10px"><h3>Delivery</h3>
          ${SHIP.map(o => { const ok = !o.minOrder || t.goods >= o.minOrder; return `<label class="radio option-box tinted ${t.opt && t.opt.id === o.id ? 'on' : ''} ${ok ? '' : 'disabled'}" ${ok ? '' : 'style="opacity:.5"'}><span class="row" style="gap:12px"><input type="radio" name="ship" data-set="ship" value="${esc(o.id)}" ${t.opt && t.opt.id === o.id ? 'checked' : ''} ${ok ? '' : 'disabled'}><span class="dot"></span><span class="stack"><span>${esc(o.name)}</span><span style="font-size:12px" class="muted">${esc(ok ? o.eta : 'Available on orders over $' + o.minOrder)}</span></span></span><span>${o.price ? money(o.price) : 'Free'}</span></label>`; }).join('')}</div>
        ${delivering ? `<div class="stack" style="gap:12px"><h3>Delivery address</h3><div class="grid-2">
            ${field('Address', 'address', 'required autocomplete="street-address"', 'style="grid-column:1/-1"')}
            ${field('City', 'city', 'required autocomplete="address-level2"')}
            ${field('Postal code', 'postal', 'required autocomplete="postal-code"')}
          </div></div>` : ''}
        <div class="field"><label for="co-note">Note (optional)</label><textarea id="co-note" class="input" data-model="note" placeholder="Gift message, preferred delivery or pick-up time…">${esc(f.note || '')}</textarea></div>
        <input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">
        <button type="submit" class="btn btn-primary" style="padding:15px;font-size:15px" ${t.count && !state.placing ? '' : 'disabled'}>${state.placing ? 'Saving your order…' : 'Place order on WhatsApp · ' + money(t.total) + ' CAD'}</button>
      </form>
      <aside class="checkout-side">
        <span class="card-title">In your bag (${t.count})</span>
        ${t.lines.map(l => `<div class="co-line"><div class="ph md">${photo(l.p.img, l.p.name)}<span class="badge">${l.qty}</span></div><span class="stack" style="font-size:14px"><span style="font-weight:500">${esc(l.p.name)}</span><span style="font-size:12px" class="muted">${esc(l.variant)}</span></span><span style="font-size:14px">${money(l.sum)}</span></div>`).join('')}
        <div class="rule" style="margin:6px 0"></div>
        ${summaryRows(t)}
        <div class="between" style="font-size:20px;font-weight:500"><span>Total</span><span>${money(t.total)} <span style="font-size:13px" class="muted">CAD</span></span></div>
        <span class="muted" style="font-size:12px">All sales are final. Questions? WhatsApp ${esc(STORE.phone)}.</span>
      </aside>
    </section>`;
  }

  /* Order message for WhatsApp when the store API isn't connected. */
  function orderMessage(t) {
    const f = state.form;
    return ['Hi Avya Jewels! I would like to place an order.', '',
      ...t.lines.map((l, i) => `${i + 1}. ${l.p.name} — ${l.variant} × ${l.qty} — ${money(l.sum)}`), '',
      'Subtotal: ' + money(t.goods), (t.opt ? t.opt.name : 'Delivery') + ': ' + t.shipping, t.gift ? 'Gift wrapping: yes' : '',
      'Total: ' + money(t.total) + ' CAD' + (STORE.taxIncluded ? ' (taxes included)' : ''), '',
      'Name: ' + f.name, 'Phone: ' + f.phone, f.email ? 'Email: ' + f.email : '',
      f.address ? 'Address: ' + [f.address, f.city, f.postal].filter(Boolean).join(', ') : '', f.note ? 'Note: ' + f.note : ''
    ].filter((line, i, all) => line !== '' || all[i - 1] !== '').join('\n');
  }

  /* ── Our story & visits ── */
  function studio() {
    const cover = byId('floral-halo-ring') || REAL()[0];
    return `
    <section class="iv-page-hero">
      <div class="stack" style="gap:18px">
        <span class="iv-label accent">Our story</span>
        <h1 class="iv-h1 title">From India to Canada, <i>a journey of passion.</i></h1>
        <p class="iv-lead">Avya means <i>the first rays of the sun</i> — the light that starts every new day.</p>
        <p class="iv-body">Avya Jewels is rooted in more than ten years of experience in gold and silver jewellery. Our founder’s journey began in India with the support of her father, where she developed a deep appreciation for craftsmanship and for the memories each piece can hold.</p>
        <p class="iv-body">Today she is building a new chapter in Canada alongside her husband, bringing that experience and passion to Avya Jewels. As a family venture, we believe jewellery is more than a luxury — it is a celebration of love, milestones and moments to cherish.</p>
        <p class="iv-body">Every piece we choose is premium, elegant and affordable: 925 sterling silver jewellery, hallmarked and stamped — and 99.99% pure gold and silver bars and coins from RCM, PAMP and Valcambi, for saving, investing and gifting.</p>
      </div>
      <div class="iv-img iv-page-img">${photo(cover.img2 || cover.img, 'Avya Jewels in the studio', true)}</div>
    </section>
    <section class="iv-info-grid three">
      <div class="iv-info"><span class="iv-label accent">Visit us</span><span class="iv-serif-28">${esc(STORE.area)}</span>
        <p class="iv-body">We welcome you by appointment, or on a video call from anywhere. Message us to choose a time.</p>
        <span class="iv-muted">${esc(STORE.hours)}</span>
        <a class="iv-btn" href="${waLink('Hi Avya Jewels, I’d like to book a visit.')}" target="_blank" rel="noopener">Book a visit on WhatsApp</a></div>
      <div class="iv-info"><span class="iv-label accent">Contact</span><span class="iv-serif-28">We reply in 15–30 minutes</span>
        <a href="${waLink()}" target="_blank" rel="noopener">WhatsApp ${esc(STORE.phone)}</a>
        <a href="${telLink}">Call ${esc(STORE.phone)}</a>
        <a href="mailto:${esc(STORE.email)}">${esc(STORE.email)}</a>
        <a href="${esc(STORE.instagram)}" target="_blank" rel="noopener">Instagram @avyajewels.ca</a></div>
      <div class="iv-info"><span class="iv-label accent">Bridal &amp; bulk orders</span><span class="iv-serif-28">For the whole family</span>
        <p class="iv-body">Bridal sets, bridesmaid gifts and corporate or festive gifting in larger quantities — tell us what you need.</p>
        <a class="iv-btn ghost" href="${waLink('Hi Avya Jewels, I’d like to ask about a bridal or bulk order.')}" target="_blank" rel="noopener">Ask about an order</a></div>
    </section>`;
  }

  /* ── Delivery, payment, returns and privacy ── */
  function policies() {
    const sections = [
      ['delivery', 'Delivery & pick-up', ['Free home delivery across the Greater Toronto Area on orders over $200, usually within 3–5 days.',
        `Pick up from us in ${STORE.area} during opening hours (${STORE.hours.replace(/ · visits by appointment/, '')}).`,
        'We don’t ship outside the GTA yet — it’s in our plans.']],
      ['payment', 'Payment', ['Pay in full by Interac e-Transfer, or in cash on pick-up. After you place an order, we confirm it on WhatsApp within 15–30 minutes with payment details.',
        STORE.taxIncluded ? 'Listed prices include all taxes. Investment-grade gold and silver bullion carries no sales tax.' : 'Tax is added at checkout. Investment-grade gold and silver bullion carries no sales tax.']],
      ['bullion', 'Gold & silver bullion', ['Bar and coin prices follow the live market, so we share today’s price on WhatsApp before you order.',
        'Bars and coins come sealed, with their stated weight and purity and an assay certificate where applicable.']],
      ['returns', 'Returns & exchanges', ['All sales are final — we don’t accept returns or exchanges.',
        'If you experience any issue with your purchase, please reach out. We’re happy to help, and we’ll do our best with any concern.']],
      ['care', 'Care', ['Care instructions are included with every jewellery purchase. Keep silver in its pouch, wipe it with a soft cloth, and keep it away from perfume, chlorine and salt water.']],
      ['privacy', 'Privacy policy', ['At Avya Jewels, we respect your privacy. We collect the contact, delivery and order information needed to process purchases, answer enquiries and provide customer service.',
        'We do not sell your personal information. We share it only with service providers needed to operate our website and deliver orders, or where required by law.',
        'We use appropriate safeguards to protect your information and keep it only as long as necessary for these purposes or legal requirements.',
        'Promotional messages are sent only with your consent, and you can unsubscribe at any time.',
        `To request access to or correction of your personal information, or to raise a privacy concern, contact us at ${STORE.phone} or ${STORE.email}.`,
        'Any updates to this policy will be posted on this page. Last updated: October 20, 2026.']]
    ];
    return `
    <section class="iv-shop-head"><div class="stack" style="gap:14px"><span class="iv-label">Help</span><h1 class="iv-h1 shop">Delivery, returns &amp; privacy</h1></div>
      <p class="iv-lead">${sections.map(([id, title]) => `<a href="#/policies" data-act="jump" data-arg="${id}" class="iv-jump">${esc(title)}</a>`).join(' · ')}</p></section>
    <div class="iv-policies">${sections.map(([id, title, paras]) => `<section id="${id}"><h2 class="iv-serif-28">${esc(title)}</h2>${paras.map(t => `<p class="iv-body">${esc(t)}</p>`).join('')}</section>`).join('')}</div>`;
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

  /* ══ Ivory Editorial actions — spliced into app.js after ACTIONS/FORMS. ══ */
  Object.assign(PAGES, { studio, custom: studio, policies });   // no custom orders — the old link shows our story
  Object.assign(TITLES, { home: 'Avya Jewels — Silver jewellery & gold and silver bullion, Mississauga', shop: 'Shop', studio: 'Our story & visits', custom: 'Our story & visits', policies: 'Delivery, returns & privacy', checkout: 'Checkout' });

  Object.assign(ACTIONS, {
    metal: m => set({ metal: state.metal === m ? null : m }),
    homeTab: t => set({ homeTab: t }),
    review: i => set({ review: +i }),
    jump: id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    quickAdd: id => {
      const p = byId(id);
      if (!p || onRequest(p) || soldOut(p)) return;
      set({ cart: addLine(id, p.material, p.price), justAdded: { ...state.justAdded, [id]: true } });
      toast(p.name + ' added to your bag');
    },
    addToBag: () => {
      const { id, finish, size, added } = state.pdp;
      if (added) { location.hash = '#/bag'; return; }
      const p = byId(id);
      if (!p || onRequest(p) || soldOut(p)) return;
      set({ cart: addLine(id, [finish, size].filter(Boolean).join(' · ') || p.material, pdpPrice(p)), pdp: { ...state.pdp, added: true } });
      toast(p.name + ' added to your bag');
    }
  });

  /* Checkout: with the store API the order is saved first (and gets a code); either way WhatsApp opens with it. */
  FORMS.checkout = async () => {
    if (state.placing || !state.cart.length) return;
    const t = totals();
    const f = state.form;
    const win = window.open('', '_blank');   // opened during the click so pop-up blockers allow it
    if (!window.AVYA_API) {
      const url = waLink(orderMessage(t));
      if (win) win.location = url;
      set({ placed: { message: 'WhatsApp has opened with your order — press send and we’ll confirm it.', whatsapp_url: url, total: t.total }, cart: [], gift: false, justAdded: {} });
      return;
    }
    const finishSlug = Object.fromEntries(window.AVYA_API.site.finishes.map(x => [x.name, x.slug]));
    const items = state.cart.map(l => {
      const p = byId(l.id), parts = String(l.variant || '').split(' · '), sz = p && sizesOf(p);
      return { product: l.id, finish: finishSlug[parts[0]] || null, size: (sz && parts.find(x => sz.opts.includes(x))) || null, qty: l.qty };
    });
    set({ placing: true });
    try {
      const res = await fetch(window.AVYA_API.base + '/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items, delivery: t.opt && t.opt.id, gift_wrap: t.gift,
          customer: { name: f.name, phone: f.phone, email: f.email || null, address: f.address || null, city: f.city || null, postal_code: f.postal || null, note: f.note || null } })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (win) win.close();
        const errors = body.errors ? Object.values(body.errors).flat() : (body.problems || []).map(x => x.message);
        set({ placing: false });
        toast(errors[0] || body.message || 'We couldn’t save your order — please try again.');
        return;
      }
      if (win && body.whatsapp_url) win.location = body.whatsapp_url; else if (win) win.close();
      set({ placing: false, placed: body, cart: [], gift: false, justAdded: {} });
    } catch (err) {
      if (win) win.close();
      set({ placing: false });
      toast('We couldn’t reach the store — please try again, or message us on WhatsApp.');
    }
  };
  window.addEventListener('hashchange', () => { if (location.hash !== '#/checkout') state.placed = null; });

  Object.assign(ACTIONS, {
    share: () => {
      const data = { title: document.title, url: location.href };
      if (navigator.share) navigator.share(data).catch(() => {});
      else navigator.clipboard?.writeText(location.href).then(() => toast('Link copied'), () => toast(location.href));
    },
    circleScroll: d => {
      const track = document.querySelector('.iv-circle-track');
      if (track) track.scrollBy({ left: Number(d) * Math.max(track.clientWidth * 0.75, 240), behavior: 'smooth' });
    }
  });
  /* Category circles: show the arrows and fade only on the sides that have more to scroll to. */
  function updateCircles() {
    const wrap = document.querySelector('.iv-circle-wrap'), track = wrap && wrap.querySelector('.iv-circle-track');
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    wrap.classList.toggle('scrolls', max > 4);
    wrap.classList.toggle('at-start', track.scrollLeft <= 4);
    wrap.classList.toggle('at-end', track.scrollLeft >= max - 4);
  }
  document.addEventListener('scroll', e => { if (e.target.classList && e.target.classList.contains('iv-circle-track')) updateCircles(); }, true);
  window.addEventListener('resize', updateCircles);
  const renderPage = render;
  render = function () { renderPage(); updateCircles(); };

  /* Hero carousel: moves the track directly (no page redraw), slides every 6 s, pauses while hovered,
     focused or hidden, and for a while after someone uses the arrows, dots or a swipe. */
  const HERO_EVERY = 6000;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let heroTouched = 0;
  function heroShow(i) {
    const car = document.querySelector('.iv-hero-car');
    if (!car) return;
    const slides = car.querySelectorAll('.iv-slide');
    heroAt = ((i % slides.length) + slides.length) % slides.length;
    car.querySelector('.iv-car-track').style.transform = 'translateX(-' + heroAt * 100 + '%)';
    slides.forEach((el, j) => {
      const on = j === heroAt;
      el.classList.toggle('on', on);
      el.toggleAttribute('aria-hidden', !on);
      el.querySelectorAll('a').forEach(a => { a.tabIndex = on ? 0 : -1; });
    });
    car.querySelectorAll('.iv-car-dots button').forEach((b, j) => { b.classList.toggle('on', j === heroAt); b.toggleAttribute('aria-current', j === heroAt); });
  }
  Object.assign(ACTIONS, {
    heroStep: d => { heroTouched = Date.now(); heroShow(heroAt + Number(d)); },
    heroGo: i => { heroTouched = Date.now(); heroShow(Number(i)); }
  });
  setInterval(() => {
    const car = document.querySelector('.iv-hero-car');
    if (!car || reduceMotion || document.hidden || car.matches(':hover') || car.contains(document.activeElement)) return;
    if (Date.now() - heroTouched < HERO_EVERY * 1.5) return;
    heroShow(heroAt + 1);
  }, HERO_EVERY);
  let heroX = null;
  document.addEventListener('touchstart', e => { heroX = e.target.closest('.iv-hero-car') ? e.touches[0].clientX : null; }, { passive: true });
  document.addEventListener('touchend', e => {
    if (heroX === null) return;
    const dx = e.changedTouches[0].clientX - heroX;
    heroX = null;
    if (Math.abs(dx) > 45) { heroTouched = Date.now(); heroShow(heroAt + (dx < 0 ? 1 : -1)); }
  });
  // Fresh product data from the store API (js/api-loader.js): redraw, except mid-checkout.
  window.addEventListener('avya:products', () => { if (state.route !== 'checkout' && state.zoom == null) set({}); });

  /* Search overlay */
  let fromSearch = false;
  const focusSearch = () => { const i = document.getElementById('iv-q'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } };
  Object.assign(ACTIONS, {
    openSearch: () => { set({ searchOpen: true, navOpen: false }); focusSearch(); },
    closeSearch: () => { set({ searchOpen: false }); document.querySelector('[data-act="openSearch"]')?.focus(); },
    searchFor: t => { state.form.q = t; const i = document.getElementById('iv-q'); if (i) i.value = t; const box = document.getElementById('iv-search-results'); if (box) box.innerHTML = searchResults(t); focusSearch(); },
    clearSearch: () => { state.form.q = ''; set({ q: '' }); }
  });
  FORMS.search = () => {
    const q = (state.form.q || '').trim();
    if (!q) return;
    state.q = q; state.metal = null;
    if (location.hash === '#/shop') set({ q, filter: 'All', searchOpen: false });
    else { fromSearch = true; state.filter = 'All'; state.searchOpen = false; location.hash = '#/shop'; }
  };
  document.addEventListener('input', e => {
    if (e.target.id !== 'iv-q') return;
    const box = document.getElementById('iv-search-results');
    if (box) box.innerHTML = searchResults(e.target.value);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.searchOpen) ACTIONS.closeSearch(); });
  /* Registered before the router: leaving via any link closes search; only a search keeps the query. */
  window.addEventListener('hashchange', () => {
    state.searchOpen = false;
    if (!fromSearch) state.q = '';
    fromSearch = false;
  });

  /* Full-screen product images */
  const lockScroll = () => { document.body.style.overflow = state.zoom !== null && state.zoom !== undefined ? 'hidden' : ''; };
  Object.assign(ACTIONS, {
    zoom: i => { set({ zoom: +i }); lockScroll(); document.querySelector('.iv-lb-btn.close')?.focus(); },
    zoomStep: d => { set({ zoom: (state.zoom || 0) + +d }); lockScroll(); document.querySelector(`.iv-lb-btn.${+d > 0 ? 'next' : 'prev'}`)?.focus(); },
    unzoom: () => { const i = state.zoom; set({ zoom: null }); lockScroll(); document.querySelector(`.iv-zoomable[data-arg="${i}"]`)?.focus(); }
  });
  document.addEventListener('keydown', e => {
    if (state.zoom === null || state.zoom === undefined) return;
    if (e.key === 'Escape') ACTIONS.unzoom();
    else if (e.key === 'ArrowRight') ACTIONS.zoomStep(1);
    else if (e.key === 'ArrowLeft') ACTIONS.zoomStep(-1);
  });
  window.addEventListener('hashchange', () => { state.zoom = null; document.body.style.overflow = ''; });


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
