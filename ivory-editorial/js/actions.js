  /* ══ Ivory Editorial actions — spliced into app.js after ACTIONS/FORMS. ══ */
  Object.assign(ACTIONS, {
    metal: m => set({ metal: state.metal === m ? null : m }),
    homeTab: t => set({ homeTab: t }),
    review: i => set({ review: +i }),
    addToBag: () => {
      const { id, finish, size, added } = state.pdp;
      if (added) { location.hash = '#/bag'; return; }
      if (tooMany(id)) { toast(quoteNote(byId(id))); return; }
      const p = byId(id);
      set({ cart: addLine(id, size ? finish + ' · ' + size : finish, pdpPrice(p, finish, size)), pdp: { ...state.pdp, added: true } });
      toast(isQuote(p) ? p.name + ' reserved at today’s rate' : p.name + ' added to your bag');
    }
  });

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

