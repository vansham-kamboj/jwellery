/* Admin feedback: tells you what is happening instead of leaving the page silent.
   - "Saving…", "Deleting…" and so on appear as soon as you press a button, and the button is locked so it cannot be pressed twice.
   - Photo and video uploads show a progress bar with a percentage.
   - Photos that are too big are refused straight away, with the reason.
   - The "saved" and error messages that used to appear at the top of the page now pop up in the corner, wherever you have scrolled to.
   Pages still work without this script: the buttons simply submit as usual. */
(() => {
  const MB = 1024 * 1024;
  const fmt = bytes => bytes >= MB ? (bytes / MB).toFixed(bytes >= 10 * MB ? 0 : 1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB';
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);

  /* ── toasts ── */
  let box = document.getElementById('toasts');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toasts';
    box.className = 'toasts';
    box.setAttribute('aria-live', 'polite');
    document.body.append(box);
  }

  const ICONS = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 7v6M12 17v.01"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 11v6M12 7v.01"/></svg>',
  };

  /** Shows a toast and returns a handle: set(text), progress(0–1), finish(text, type), close(). */
  function toast(text, { type = 'info', busy = false, sticky = false } = {}) {
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    const body = document.createElement('div');
    body.className = 'toast-body';
    const msg = document.createElement('span');
    msg.className = 'toast-text';
    body.append(msg);
    const bar = document.createElement('div');
    bar.className = 'toast-bar';
    bar.hidden = true;
    bar.innerHTML = '<i></i>';
    body.append(bar);
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'toast-close';
    close.setAttribute('aria-label', 'Dismiss');
    close.textContent = '×';
    el.append(icon, body, close);
    box.append(el);
    requestAnimationFrame(() => el.classList.add('in'));

    let timer = null;
    const setIcon = (t, spin) => { icon.innerHTML = spin ? '<i class="spin"></i>' : ICONS[t] || ICONS.info; };
    const h = {
      el,
      set(t) { msg.textContent = t; },
      progress(p) {
        bar.hidden = false;
        bar.firstChild.style.width = Math.round(Math.max(0, Math.min(1, p)) * 100) + '%';
      },
      closeSoon(ms) {
        clearTimeout(timer);
        timer = setTimeout(() => { if (!el.matches(':hover')) h.close(); else el.addEventListener('mouseleave', () => h.close(), { once: true }); }, ms);
      },
      finish(t, ty = 'info') {
        el.className = 'toast in ' + ty;
        el.setAttribute('role', ty === 'error' ? 'alert' : 'status');
        bar.hidden = true;
        msg.textContent = t;
        setIcon(ty, false);
        h.closeSoon(ty === 'error' ? 12000 : 5000);
      },
      close() {
        clearTimeout(timer);
        el.classList.remove('in');
        el.classList.add('out');
        setTimeout(() => el.remove(), 250);
      },
    };
    h.set(text);
    setIcon(type, busy);
    close.addEventListener('click', h.close);
    if (!busy && !sticky) h.closeSoon(type === 'error' ? 12000 : 5000);
    return h;
  }
  window.AdminToast = toast;

  /* ── the page's own "saved" / error banners become toasts ── */
  function bannersToToasts() {
    let firstError = false;
    document.querySelectorAll('.flash').forEach(f => {
      const type = f.classList.contains('error') ? 'error' : 'success';
      toast(f.textContent.replace(/\s+/g, ' ').trim(), { type });
      if (type === 'error') firstError = true;
      f.remove();
    });
    if (firstError) {
      // After a failed save the page reloads at the top: take the person to the first problem.
      const bad = document.querySelector('.err');
      if (bad) bad.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }
  bannersToToasts();
  try {
    const held = JSON.parse(sessionStorage.getItem('adminToasts') || '[]');
    sessionStorage.removeItem('adminToasts');
    held.forEach(n => toast(n.text, { type: n.type }));
  } catch (err) { /* nothing was held */ }

  /* ── buttons ── */
  const submitButtons = form => [...form.elements].filter(e => (e.tagName === 'BUTTON' && e.type === 'submit') || (e.tagName === 'INPUT' && e.type === 'submit'));
  function lock(form, label) {
    form.dataset.busy = '1';
    // Disable after the browser has collected the form, or the values would be left out.
    setTimeout(() => {
      form.querySelectorAll('select.status-select, select[onchange]').forEach(s => { s.disabled = true; s.dataset.lockedByFeedback = '1'; });
      submitButtons(form).forEach(b => {
        b.dataset.label = b.innerHTML;
        b.disabled = true;
        b.classList.add('is-busy');
        b.setAttribute('aria-busy', 'true');
        if (label && b.classList.contains('btn')) b.textContent = label;
      });
    }, 0);
  }
  function unlock(form) {
    delete form.dataset.busy;
    form.querySelectorAll('[data-locked-by-feedback]').forEach(s => { s.disabled = false; delete s.dataset.lockedByFeedback; });
    submitButtons(form).forEach(b => {
      if (b.dataset.label !== undefined) { b.innerHTML = b.dataset.label; delete b.dataset.label; }
      b.disabled = false;
      b.classList.remove('is-busy');
      b.removeAttribute('aria-busy');
    });
  }

  const methodOf = form => {
    const spoof = form.querySelector('input[name="_method"]');
    return (spoof ? spoof.value : form.method || 'get').toLowerCase();
  };
  const fileInputs = form => [...form.elements].filter(e => e.tagName === 'INPUT' && e.type === 'file');
  const chosenFiles = form => fileInputs(form).flatMap(i => [...i.files]);

  /* ── uploads: send with progress instead of a silent wait ── */
  function upload(form, files, submitter) {
    const total = files.reduce((a, f) => a + f.size, 0);
    const label = plural(files.length, 'file', 'files') + ' (' + fmt(total) + ')';
    const t = toast('Uploading ' + label + '…', { type: 'info', busy: true });
    t.progress(0);
    lock(form, 'Uploading…');

    const fail = message => { t.finish(message, 'error'); unlock(form); };
    const fd = new FormData(form);
    if (submitter && submitter.name) fd.append(submitter.name, submitter.value);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', form.action);
    xhr.setRequestHeader('Accept', 'text/html,application/xhtml+xml');   // not "ajax": Laravel then redirects as for a normal form
    xhr.upload.onprogress = e => {
      if (!e.lengthComputable) return;
      const p = e.loaded / e.total;
      t.progress(p);
      t.set(p >= 1 ? 'Saving… (processing ' + label + ')' : 'Uploading ' + label + '… ' + Math.round(p * 100) + '%');
    };
    xhr.onerror = () => fail('The upload didn’t go through — check your connection and try again. Nothing was saved.');
    xhr.ontimeout = xhr.onerror;
    xhr.onabort = xhr.onerror;
    xhr.onload = () => {
      if (xhr.status === 413) return fail('The files are too big to send together (' + fmt(total) + '). Upload fewer at a time.');
      if (xhr.status === 419) return fail('Your session expired. Reload the page, sign in again and retry.');
      if (xhr.status >= 500) return fail('The server hit a problem (error ' + xhr.status + '). Nothing was saved — please try again.');
      const type = xhr.getResponseHeader('Content-Type') || '';
      if (!/html/i.test(type)) return fail('Unexpected reply from the server. Reload the page to check whether it saved.');
      const target = xhr.responseURL && xhr.responseURL !== form.action ? xhr.responseURL : location.href;
      const page = new DOMParser().parseFromString(xhr.responseText, 'text/html');
      const problems = [...new Set([...page.querySelectorAll('.err')].map(e => e.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean))];
      if (page.querySelector('.flash.error') || problems.length) {
        // Not saved. Stay on this page so nothing you typed or chose is lost, and say what to fix.
        return fail(problems.length ? 'Not saved: ' + problems.join(' ') : 'Not saved — please check the form and try again.');
      }
      // Saved: open the page the server redirected to and show its message there as a toast.
      try {
        const notes = [...page.querySelectorAll('.flash')].map(f => ({ text: f.textContent.replace(/\s+/g, ' ').trim(), type: 'success' }));
        sessionStorage.setItem('adminToasts', JSON.stringify(notes));
      } catch (err) { /* storage blocked: the message is simply not repeated */ }
      location.assign(target);
    };
    xhr.send(fd);
  }

  document.addEventListener('submit', e => {
    const form = e.target;
    if (e.defaultPrevented || !(form instanceof HTMLFormElement)) return;
    if (methodOf(form) === 'get') return;                 // searches and filters just reload
    if (form.dataset.busy) { e.preventDefault(); return; } // already sending: ignore a second press

    const files = chosenFiles(form);
    if (files.length) {
      e.preventDefault();
      upload(form, files, e.submitter);
      return;
    }
    const verb = methodOf(form) === 'delete' ? 'Deleting…' : 'Saving…';
    lock(form, verb);
    toast(form.dataset.saving || verb, { type: 'info', busy: true });
  });

  /* ── choosing files: check them before the upload, not after ── */
  document.addEventListener('change', e => {
    const input = e.target;
    if (!(input instanceof HTMLInputElement) || input.type !== 'file' || !input.files.length) return;
    const limit = Number(input.dataset.maxMb || 0);
    const files = [...input.files];
    const tooBig = limit ? files.filter(f => f.size > limit * MB) : [];
    if (tooBig.length) {
      toast(tooBig.map(f => f.name + ' is ' + fmt(f.size)).join(', ') + ' — the limit is ' + limit + ' MB each. Choose a smaller file.', { type: 'error' });
      input.value = '';
      return;
    }
    const total = files.reduce((a, f) => a + f.size, 0);
    toast(plural(files.length, 'file', 'files') + ' ready (' + fmt(total) + '). Press Save to upload.', { type: 'info' });
  });

  /* ── coming back with the browser's Back button: nothing should look stuck ── */
  window.addEventListener('pageshow', e => {
    if (!e.persisted) return;
    document.querySelectorAll('form[data-busy]').forEach(unlock);
    box.querySelectorAll('.toast').forEach(el => el.remove());
  });
})();
