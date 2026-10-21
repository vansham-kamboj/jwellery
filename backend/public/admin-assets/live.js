/* Live admin: every few seconds ask the server what changed.
   New orders → pop-up, chime, tab title and (if allowed) a desktop notification.
   Any change to orders, requests or bookings → list pages refresh their content in place. */
(() => {
  const body = document.body;
  const url = body.dataset.liveUrl;
  if (!url) return;

  const EVERY = 5000;                       // check every 5 seconds while the tab is open
  let latest = Number(body.dataset.latestOrder) || 0;
  let signature = body.dataset.signature;
  let unseen = 0;
  let busy = false;
  let pendingRefresh = false;
  const baseTitle = document.title;
  const toasts = document.getElementById('live-toasts');
  const dot = document.querySelector('.live-dot');

  /* ── pop-up for each new order ── */
  function toast(o) {
    const el = document.createElement('a');
    el.className = 'live-toast';
    el.href = o.url;
    el.innerHTML = '<b>New order</b><span></span><small></small>';
    el.querySelector('span').textContent = o.code + ' · ' + o.name;
    el.querySelector('small').textContent = o.total + ' — open order';
    toasts.prepend(el);
    setTimeout(() => el.classList.add('out'), 15000);
    setTimeout(() => el.remove(), 15600);
  }

  /* ── short two-note chime (browsers allow sound once you've clicked on the page) ── */
  let audio;
  function chime() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      [880, 1320].forEach((f, i) => {
        const osc = audio.createOscillator(), gain = audio.createGain(), t = audio.currentTime + i * 0.18;
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        osc.connect(gain).connect(audio.destination);
        osc.start(t); osc.stop(t + 0.4);
      });
    } catch (e) { /* sound not available */ }
  }

  /* ── desktop notifications (asked once, from a button — browsers require a click) ── */
  const alertsBtn = document.getElementById('alerts-btn');
  if ('Notification' in window && Notification.permission === 'default' && alertsBtn) {
    alertsBtn.hidden = false;
    alertsBtn.addEventListener('click', () => Notification.requestPermission().then(() => { alertsBtn.hidden = true; }));
  }
  function desktopAlert(orders) {
    if (!('Notification' in window) || Notification.permission !== 'granted' || !document.hidden) return;
    const o = orders[orders.length - 1];
    const n = new Notification(orders.length > 1 ? orders.length + ' new orders' : 'New order ' + o.code, {
      body: orders.length > 1 ? 'Latest: ' + o.code + ' · ' + o.name + ' · ' + o.total : o.name + ' · ' + o.total,
      icon: document.querySelector('link[rel="icon"]')?.href, tag: 'avya-order'
    });
    n.onclick = () => { window.focus(); location.href = o.url; };
  }

  /* ── sidebar badges ── */
  function updateCounts(counts) {
    document.querySelectorAll('[data-live-count]').forEach(el => {
      const n = counts[el.dataset.liveCount] || 0;
      el.textContent = n;
      el.hidden = !n;
    });
  }

  /* ── refresh list pages in place (skipped while you're typing or choosing something) ── */
  async function refreshRegion() {
    const region = document.querySelector('[data-live-region]');
    if (!region) return;
    const active = document.activeElement;
    if (active && region.contains(active) && /^(INPUT|SELECT|TEXTAREA)$/.test(active.tagName)) return;
    const res = await fetch(location.href, { headers: { 'X-Live-Refresh': '1' }, cache: 'no-store' });
    if (!res.ok || res.redirected) return;
    const fresh = new DOMParser().parseFromString(await res.text(), 'text/html').getElementById('live-region');
    if (fresh) region.innerHTML = fresh.innerHTML;
  }

  async function tick() {
    if (busy) return;
    busy = true;
    try {
      const res = await fetch(url + '?since=' + latest, { headers: { Accept: 'application/json' }, cache: 'no-store' });
      if (res.redirected || res.status === 401 || res.status === 419) { location.reload(); return; }   // signed out
      if (!res.ok) throw new Error(res.status);
      const d = await res.json();
      dot?.classList.remove('off');
      if (d.new_orders.length && latest) {
        d.new_orders.forEach(toast);
        chime();
        desktopAlert(d.new_orders);
        unseen += d.new_orders.length;
        document.title = '(' + unseen + ') New order · ' + baseTitle;
      }
      latest = d.latest_id;
      updateCounts(d.counts);
      if (d.signature !== signature) {
        signature = d.signature;
        if (document.hidden) pendingRefresh = true; else await refreshRegion();
      }
    } catch (e) {
      dot?.classList.add('off');           // connection problem — keep trying
    } finally {
      busy = false;
    }
  }

  setInterval(tick, EVERY);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    unseen = 0;
    document.title = baseTitle;
    if (pendingRefresh) { pendingRefresh = false; refreshRegion(); }
    tick();
  });
  // Background tabs: browsers slow timers down, so also check when the window regains focus.
  window.addEventListener('focus', tick);
})();
