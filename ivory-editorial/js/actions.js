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
