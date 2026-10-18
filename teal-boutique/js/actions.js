  /* ══ Teal Boutique actions — spliced into app.js after ACTIONS/FORMS. ══ */
  Object.assign(ACTIONS, {
    metal: m => set({ metal: m }),
    band: b => set({ band: b }),
    prov: c => set({ prov: c }),
    homeTab: t => set({ homeTab: t }),
    clearAll: () => { state.form.q = ''; set({ metal: 'Any', band: 'Any', q: '', filter: 'All' }); },
    filter: c => { history.replaceState(null, '', '#/shop' + (c === 'All' ? '' : '/' + c)); state.form.q = ''; set({ filter: c, q: '' }); },
    addToBag: () => {
      const { id, finish, size, added } = state.pdp;
      if (added) { location.hash = '#/bag'; return; }
      if (tooMany(id)) { toast(quoteNote(byId(id))); return; }
      const p = byId(id);
      set({ cart: addLine(id, size ? finish + ' · ' + size : finish, pdpPrice(p, finish, size)), pdp: { ...state.pdp, added: true } });
      toast(isQuote(p) ? p.name + ' reserved at today’s rate' : p.name + ' added to your bag');
    }
  });
  let fromSearch = false;
  FORMS.search = () => {
    const q = (state.form.q || '').trim();
    state.q = q;
    if (state.route === 'shop' && location.hash === '#/shop') set({ q, filter: 'All' });
    else { fromSearch = true; state.filter = 'All'; location.hash = '#/shop'; }
  };
  /* Registered before the router's own listener: any navigation that isn't a search clears the query. */
  window.addEventListener('hashchange', () => {
    if (!fromSearch) { state.q = ''; state.form.q = ''; }
    fromSearch = false;
  });
