/* Backend connection — loads settings and products from the store API before the app starts.
   The API address comes from js/site-env.js, which frontend/build-env.js writes from frontend/.env.
   If there is no address or the API can't be reached, the built-in catalogue is used instead. */
(() => {
  const startApp = () => {
    const s = document.createElement('script');
    s.src = 'js/app.js?v=20261022';   // bump with the script tags in index.html after each update
    document.body.appendChild(s);
  };

  // Finish names → the keys the design already understands (colour filters, swatches).
  const keyOf = f => /rose/i.test(f.name) ? 'rosetone' : /fine gold/i.test(f.name) ? 'finegold'
    : /fine silver/i.test(f.name) ? 'finesilver' : /silver/i.test(f.name) ? 'plainsilver' : /gold/i.test(f.name) ? 'gold' : f.slug;

  const toProduct = d => {
    const bullion = d.kind === 'bullion';
    const pics = (d.gallery || []).filter(m => m.type === 'image').map(m => m.url);
    const video = (d.gallery || []).find(m => m.type === 'video');
    const sizes = d.sizes && d.sizes.options.some(o => o.in_stock)
      ? { label: d.sizes.label, opts: d.sizes.options.filter(o => o.in_stock).map(o => o.label), def: d.sizes.default } : false;
    const sw = d.finishes.filter(f => f.in_stock).map(keyOf);
    return {
      id: d.slug, real: true, name: d.name, cat: d.category.slug, price: d.price || 0, wasPrice: d.original_price,
      priceOnRequest: !!d.price_on_request, stock: d.stock, inStock: d.in_stock,
      tag: d.in_stock ? (d.offer_badge || d.tag || '') : 'Sold out', desc: d.description || '',
      img: d.image || pics[0], img2: d.image_alt || d.image || pics[0], gallery: pics.length ? pics : [d.image], video: video ? video.url : null,
      fin: sw[0] || 'plainsilver', sw: sw.length ? sw : ['plainsilver'], material: d.material || '', care: d.care || '',
      sizes, rating: null, reviews: 0, bullion, short: d.short_name, metal: d.metal, grams: d.weight_grams,
      taxExempt: d.tax_exempt, confirmed: true, customerReviews: d.reviews || [],
      perks: bullion ? BULLION_PERKS : JEWELLERY_PERKS, accordions: bullion ? BULLION_DETAILS : JEWELLERY_DETAILS
    };
  };

  async function connect() {
    const base = ((window.AVYA_ENV || {}).AVYA_API_URL || '').replace(/\/+$/, '');
    if (!base) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const get = path => fetch(base + path, { signal: ctrl.signal, headers: { Accept: 'application/json' } })
      .then(r => { if (!r.ok) throw new Error(path + ' → ' + r.status); return r.json(); });
    try {
      const [site, list] = await Promise.all([get('/site'), get('/products?full=1&per_page=100')]);
      site.finishes.forEach(f => { const k = keyOf(f); SW[k] = f.swatch_hex; FINISH_OF[k] = f.name; });
      PRODUCTS.length = 0;
      PRODUCTS.push(...list.data.map(toProduct));
      window.AVYA_API = { base, site };
    } finally {
      clearTimeout(timer);
    }
  }

  const env = document.createElement('script');
  env.src = 'js/site-env.js?t=' + Date.now();   // never cached: it holds the API address
  env.onload = env.onerror = () => connect()
    .catch(err => console.warn('Store API unavailable — showing the built-in catalogue.', err))
    .finally(startApp);
  document.head.appendChild(env);
})();
