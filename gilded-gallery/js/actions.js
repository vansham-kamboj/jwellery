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
