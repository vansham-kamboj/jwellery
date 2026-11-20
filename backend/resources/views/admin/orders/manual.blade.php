@extends('admin.layout')
@section('title', 'Manual order')
@section('crumbs')<a href="{{ route('admin.orders.index') }}">Orders</a> / Manual order @endsection

@section('content')
    <div class="page-head">
        <div>
            <h1>Manual order</h1>
            <p class="muted">For sales that didn’t come through the website. Pick the products, add a note if you like, and it is saved as a confirmed order.</p>
        </div>
    </div>

    <form method="post" action="{{ route('admin.manual-orders.store') }}" id="manual-form" class="split manual" data-saving="Saving the order…">
        @csrf
        <section class="card">
            <div class="card-head pick-tools">
                <input type="search" id="pick-search" placeholder="Search products by name or SKU" aria-label="Search products" autocomplete="off">
                <select id="pick-category" aria-label="Filter by category"><option value="">All categories</option></select>
            </div>
            <div class="pick-count muted small" id="pick-count"></div>
            <div class="pick-list" id="pick-list"></div>
        </section>

        <aside class="card card-pad manual-order">
            <h3>Order</h3>
            <div id="lines" class="lines"><p class="empty-lines muted" id="lines-empty">Nothing added yet. Click a product to add it.</p></div>
            <div class="manual-total"><span>Total</span><b id="grand">$0.00</b></div>
            <label class="field"><span>Note <em class="muted">(optional)</em></span>
                <textarea name="note" id="note" maxlength="2000" placeholder="Anything worth keeping — a name, how it was paid…">{{ old('note') }}</textarea>
            </label>
            <button class="btn" id="submit" disabled>Save as confirmed order</button>
            <p class="muted small">No customer details are asked for. The order is saved as <b>Confirmed</b> and counts in sales.</p>
        </aside>
    </form>

    <script>
    (() => {
        const PRODUCTS = @json($products);
        const RESTORE = @json(old('lines', []));
        const byId = new Map(PRODUCTS.map(p => [p.id, p]));
        const money = n => '$' + (Math.round(n * 100) / 100).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const el = (tag, props = {}, ...kids) => {
            const e = Object.assign(document.createElement(tag), props);
            kids.flat().forEach(k => e.append(k));
            return e;
        };

        const list = document.getElementById('pick-list');
        const search = document.getElementById('pick-search');
        const category = document.getElementById('pick-category');
        const count = document.getElementById('pick-count');
        const lines = document.getElementById('lines');
        const empty = document.getElementById('lines-empty');
        const grand = document.getElementById('grand');
        const submit = document.getElementById('submit');
        let counter = 0;

        /* ── product picker ── */
        [...new Set(PRODUCTS.map(p => p.category))].forEach(c => category.append(el('option', { value: c, textContent: c })));
        const rows = PRODUCTS.map(p => {
            const row = el('button', { type: 'button', className: 'pick-row', title: 'Add to order' },
                el('span', { className: 'pick-main' },
                    el('span', { className: 'pick-name', textContent: p.name }),
                    el('span', { className: 'pick-sub muted small', textContent: [p.sku, p.category].filter(Boolean).join(' · ') })),
                el('span', { className: 'pick-side' },
                    !p.inStock ? el('span', { className: 'badge cancelled', textContent: 'Sold out' }) : '',
                    !p.visible ? el('span', { className: 'badge quiet', textContent: 'Hidden' }) : '',
                    el('span', { className: 'pick-price', textContent: p.price > 0 ? money(p.price) : 'No price' }),
                    el('span', { className: 'pick-add', textContent: '+ Add' })));
            row.addEventListener('click', () => addLine(p));
            row.dataset.text = [p.name, p.sku, p.category].join(' ').toLowerCase();
            row.dataset.category = p.category;
            list.append(row);
            return row;
        });
        function filter() {
            const q = search.value.trim().toLowerCase();
            let shown = 0;
            rows.forEach(r => {
                const ok = (!q || r.dataset.text.includes(q)) && (!category.value || r.dataset.category === category.value);
                r.hidden = !ok;
                if (ok) shown++;
            });
            count.textContent = !shown ? 'No products match.' : (shown === rows.length ? rows.length + ' products' : shown + ' of ' + rows.length + ' products');
        }
        search.addEventListener('input', filter);
        category.addEventListener('change', filter);
        filter();

        /* ── order lines ── */
        function lineTotal(line) {
            const qty = parseInt(line.querySelector('[data-qty]').value, 10) || 0;
            const price = parseFloat(line.querySelector('[data-price]').value) || 0;
            return qty * price;
        }
        function refresh() {
            const all = [...lines.querySelectorAll('.line')];
            let sum = 0;
            all.forEach(l => {
                const t = lineTotal(l);
                l.querySelector('[data-line-total]').textContent = money(t);
                sum += t;
            });
            grand.textContent = money(sum);
            empty.hidden = all.length > 0;
            submit.disabled = all.length === 0;
        }
        function addLine(p, saved = null) {
            // The same piece with the same options just goes up by one.
            if (!saved) {
                const same = [...lines.querySelectorAll('.line')].find(l => +l.dataset.product === p.id && !l.dataset.touched);
                if (same) {
                    const q = same.querySelector('[data-qty]');
                    q.value = Math.min(999, (parseInt(q.value, 10) || 0) + 1);
                    same.classList.add('bump'); setTimeout(() => same.classList.remove('bump'), 400);
                    return refresh();
                }
            }
            const i = counter++;
            const n = f => 'lines[' + i + '][' + f + ']';
            const base = p.price;
            const price = el('input', { type: 'number', name: n('price'), min: 0, max: 1000000, step: '0.01', required: true, value: saved ? saved.price : base.toFixed(2), className: 'line-price' });
            price.setAttribute('data-price', ''); price.setAttribute('aria-label', 'Price each');
            const qty = el('input', { type: 'number', name: n('qty'), min: 1, max: 999, step: '1', required: true, value: saved ? saved.qty : 1, className: 'line-qty' });
            qty.setAttribute('data-qty', ''); qty.setAttribute('aria-label', 'Quantity');
            const options = [];
            let line = null;
            if (p.finishes.length) {
                const finish = el('select', { name: n('finish_id') }, p.finishes.map(f => el('option', { value: f.id, textContent: f.name })));
                finish.setAttribute('aria-label', 'Finish');
                if (saved && saved.finish_id) finish.value = saved.finish_id;
                finish.addEventListener('change', () => {
                    const f = p.finishes.find(x => String(x.id) === finish.value);
                    if (f && !price.dataset.edited) price.value = (base + f.adjust).toFixed(2);
                    line.dataset.touched = '1'; refresh();
                });
                const f0 = p.finishes[0];
                if (!saved && f0 && f0.adjust) price.value = (base + f0.adjust).toFixed(2);
                options.push(finish);
            }
            if (p.sizes.length) {
                const size = el('select', { name: n('size') }, p.sizes.map(s => el('option', { value: s, textContent: 'Size ' + s })));
                size.setAttribute('aria-label', 'Size');
                if (saved && saved.size) size.value = saved.size;
                size.addEventListener('change', () => { line.dataset.touched = '1'; });
                options.push(size);
            }
            price.addEventListener('input', () => { price.dataset.edited = '1'; line.dataset.touched = '1'; refresh(); });
            qty.addEventListener('input', refresh);
            const remove = el('button', { type: 'button', className: 'line-remove', title: 'Remove', textContent: '×' });
            remove.setAttribute('aria-label', 'Remove ' + p.name);
            const sum = el('b', { textContent: '$0.00' });
            sum.setAttribute('data-line-total', '');
            line = el('div', { className: 'line' },
                el('input', { type: 'hidden', name: n('product_id'), value: p.id }),
                el('div', { className: 'line-head' }, el('span', { className: 'line-name', textContent: p.name }), remove),
                options.length ? el('div', { className: 'line-options' }, options) : '',
                el('div', { className: 'line-nums' },
                    el('label', {}, el('span', { className: 'small muted', textContent: 'Qty' }), qty),
                    el('label', {}, el('span', { className: 'small muted', textContent: 'Price each' }), price),
                    el('span', { className: 'line-sum' }, el('span', { className: 'small muted', textContent: 'Line total' }), sum)));
            line.dataset.product = p.id;
            remove.addEventListener('click', () => { line.remove(); refresh(); });
            if (saved && saved.price !== undefined && +saved.price !== base) price.dataset.edited = '1';
            lines.append(line);
            refresh();
        }

        (RESTORE || []).forEach(s => { const p = byId.get(parseInt(s.product_id, 10)); if (p) addLine(p, s); });
        refresh();
    })();
    </script>
@endsection
