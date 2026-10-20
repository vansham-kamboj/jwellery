/* Hero colour trial — lets the client try background colours for the hero + category strip.
   Choice is remembered in this browser and can be shared with ?hero=<id>. Remove once a colour is chosen. */
(() => {
  const TINTS = [
    { id: 'ivory', name: 'Ivory', c: '#fbfbfe' },
    { id: 'sage', name: 'Sage mist', c: '#e6eee8' },
    { id: 'seaglass', name: 'Sea glass', c: '#d8ebe9' },
    { id: 'champagne', name: 'Champagne', c: '#f4ead9' },
    { id: 'sand', name: 'Sand', c: '#ebdfca' },
    { id: 'blush', name: 'Blush', c: '#f5e6e0' },
    { id: 'teal', name: 'Deep teal', c: '#0f454d', dark: true },
    { id: 'forest', name: 'Forest', c: '#1d3530', dark: true }
  ];
  const KEY = 'avya.heroTint';
  const root = document.documentElement;
  const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const save = id => { try { localStorage.setItem(KEY, id); } catch { /* storage unavailable */ } };

  function apply(id) {
    const t = TINTS.find(x => x.id === id) || TINTS[0];
    if (t.id === 'ivory') { root.removeAttribute('data-hero'); root.removeAttribute('data-hero-tone'); root.style.removeProperty('--hero-bg'); }
    else {
      root.dataset.hero = t.id;
      root.dataset.heroTone = t.dark ? 'dark' : 'light';
      root.style.setProperty('--hero-bg', t.c);
      root.style.setProperty('--hero-line', t.dark ? 'rgba(246, 241, 230, .16)' : 'rgba(13, 61, 69, .12)');
    }
    document.querySelectorAll('.hp-sw').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === t.id)));
    const label = document.querySelector('.hp-label');
    if (label) label.textContent = 'Hero colour · ' + t.name;
    save(t.id);
  }

  const box = document.createElement('div');
  box.className = 'hp';
  box.innerHTML = `<div class="hp-panel" id="hp-panel" hidden><span class="hp-title">Try a hero colour</span>
      <div class="hp-grid">${TINTS.map(t => `<button type="button" class="hp-sw" data-id="${t.id}" style="--c:${t.c}" aria-pressed="false"><span></span><span>${t.name}</span></button>`).join('')}</div></div>
    <button type="button" class="hp-toggle" aria-expanded="false" aria-controls="hp-panel"><span class="hp-dot"></span><span class="hp-label">Hero colour</span></button>`;
  document.body.appendChild(box);

  const panel = box.querySelector('.hp-panel'), toggle = box.querySelector('.hp-toggle');
  toggle.addEventListener('click', () => { panel.hidden = !panel.hidden; toggle.setAttribute('aria-expanded', String(!panel.hidden)); });
  box.querySelectorAll('.hp-sw').forEach(b => b.addEventListener('click', () => apply(b.dataset.id)));
  const showOnHome = () => { box.style.display = /^#?\/?$/.test(location.hash) ? '' : 'none'; };
  window.addEventListener('hashchange', showOnHome);
  showOnHome();

  apply(new URLSearchParams(location.search).get('hero') || read() || 'ivory');
})();
