@extends('admin.layout')
@php $editing = $product->exists; @endphp
@section('title', $editing ? $product->name : 'New product')
@section('crumbs')<a href="{{ route('admin.products.index') }}">Products</a> / {{ $editing ? $product->name : 'New' }}@endsection
@section('top-actions')
    @if ($editing)
        <form method="post" action="{{ route('admin.products.duplicate', $product) }}">@csrf<button class="btn ghost">Duplicate</button></form>
    @endif
@endsection

@section('content')
    <form method="post" enctype="multipart/form-data" action="{{ $editing ? route('admin.products.update', $product) : route('admin.products.store') }}" class="grid" style="gap:22px">
        @csrf
        @if ($editing) @method('PUT') @endif

        <div class="page-head">
            <h1>{{ $editing ? $product->name : 'New product' }}</h1>
            <div class="form-actions"><a href="{{ route('admin.products.index') }}" class="btn ghost">Cancel</a><button class="btn">Save product</button></div>
        </div>

        <div class="split">
            <div class="grid">
                <section class="card card-pad grid" style="gap:16px">
                    <h3>Details</h3>
                    <div class="form-grid">
                        <label class="field full"><span>Name</span><input type="text" name="name" value="{{ old('name', $product->name) }}" required>@error('name')<span class="err">{{ $message }}</span>@enderror</label>
                        <label class="field"><span>Category</span>
                            <select name="category_id" required>
                                @foreach ($categories as $c)<option value="{{ $c->id }}" @selected(old('category_id', $product->category_id) == $c->id)>{{ $c->name }}</option>@endforeach
                            </select></label>
                        <label class="field"><span>Type</span>
                            <select name="kind">
                                <option value="jewellery" @selected(old('kind', $product->kind) === 'jewellery')>Jewellery</option>
                                <option value="bullion" @selected(old('kind', $product->kind) === 'bullion')>Bullion (coins, bars)</option>
                            </select></label>
                        <label class="field"><span>Price (before offers)</span><input type="number" name="price" step="0.01" min="0" value="{{ old('price', $product->price) }}" required>@error('price')<span class="err">{{ $message }}</span>@enderror</label>
                        <label class="field"><span>Tag</span><input type="text" name="tag" value="{{ old('tag', $product->tag) }}" placeholder="New, Bestseller…"></label>
                        <label class="field"><span>Material line</span><input type="text" name="material" value="{{ old('material', $product->material) }}" placeholder="Sterling silver · cubic zirconia"></label>
                        <label class="field"><span>Short name</span><input type="text" name="short_name" value="{{ old('short_name', $product->short_name) }}" placeholder="1 oz coin"></label>
                        <label class="field full"><span>Description</span><textarea name="description">{{ old('description', $product->description) }}</textarea></label>
                        <label class="field full"><span>Materials & care</span><textarea name="care">{{ old('care', $product->care) }}</textarea></label>
                    </div>
                </section>

                <section class="card card-pad grid" style="gap:14px">
                    <h3>Photos & videos</h3>
                    @if ($editing && $product->images->isNotEmpty())
                        <div class="media">
                            @foreach ($product->images as $m)
                                <figure>
                                    @if ($m->type === 'video')<video src="{{ $m->url() }}" muted playsinline preload="metadata"></video>@else<img src="{{ $m->url() }}" alt="" loading="lazy">@endif
                                    <figcaption>
                                        <div class="row"><label class="small">Order <input type="number" name="media[{{ $m->id }}][sort]" value="{{ $m->sort_order }}" min="0"></label>
                                            <label class="check small"><input type="checkbox" name="media[{{ $m->id }}][remove]" value="1"> Remove</label></div>
                                        <input type="text" name="media[{{ $m->id }}][alt]" value="{{ $m->alt }}" placeholder="Alt text" aria-label="Alt text">
                                    </figcaption>
                                </figure>
                            @endforeach
                        </div>
                        <span class="hint">Lowest order number shows first and is used on product cards.</span>
                    @endif
                    <label class="field"><span>Add files</span><input type="file" name="images[]" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"></label>
                    <span class="hint">JPG, PNG or WebP photos, MP4/WebM videos. Up to 50 MB each.</span>
                    @error('images.*')<span class="err">{{ $message }}</span>@enderror
                </section>

                <section class="card card-pad grid" style="gap:10px">
                    <h3>Finishes</h3>
                    <span class="hint">Tick the finishes this piece comes in. Price change is added to the base price (e.g. 12 or −5).</span>
                    @php $chosen = $product->finishes->keyBy('id'); @endphp
                    <div>
                        @forelse ($finishes as $f)
                            @php $pv = $chosen->get($f->id)?->pivot; @endphp
                            <div class="finish-row">
                                <input type="checkbox" class="check" name="finish[{{ $f->id }}][on]" value="1" @checked(old("finish.$f->id.on", (bool) $pv)) aria-label="{{ $f->name }}">
                                <span><span class="swatch" style="background:{{ $f->swatch_hex }}"></span> {{ $f->name }}</span>
                                <input type="number" step="0.01" name="finish[{{ $f->id }}][adjust]" value="{{ old("finish.$f->id.adjust", $pv?->price_adjustment ?? 0) }}" aria-label="Price change for {{ $f->name }}">
                                <label class="check small stock"><input type="checkbox" name="finish[{{ $f->id }}][in_stock]" value="1" @checked(old("finish.$f->id.in_stock", $pv ? $pv->in_stock : true))> In stock</label>
                            </div>
                        @empty
                            <p class="muted">No finishes yet — <a href="{{ route('admin.finishes.index') }}">add some</a>.</p>
                        @endforelse
                    </div>
                </section>
            </div>

            <div class="grid">
                <section class="card card-pad grid" style="gap:12px">
                    <h3>Visibility</h3>
                    <label class="check"><input type="checkbox" name="is_visible" value="1" @checked(old('is_visible', $product->is_visible))> Visible on the site</label>
                    <label class="check"><input type="checkbox" name="in_stock" value="1" @checked(old('in_stock', $product->in_stock))> In stock</label>
                    <label class="field"><span>Units in stock</span><input type="number" name="stock_qty" min="0" value="{{ old('stock_qty', $product->stock_qty) }}" placeholder="Not tracked"><span class="hint">The site shows “Only 3 left” at 5 or fewer. Leave empty to just show In stock.</span></label>
                    <label class="check"><input type="checkbox" name="is_featured" value="1" @checked(old('is_featured', $product->is_featured))> Featured on home page</label>
                    <label class="check"><input type="checkbox" name="tax_exempt" value="1" @checked(old('tax_exempt', $product->tax_exempt))> Tax-exempt (investment bullion)</label>
                    <label class="field"><span>Sort order</span><input type="number" name="sort_order" min="0" value="{{ old('sort_order', $product->sort_order ?? 0) }}"></label>
                    <label class="field"><span>URL name (slug)</span><input type="text" name="slug" value="{{ old('slug', $product->slug) }}" placeholder="made from the name">@error('slug')<span class="err">{{ $message }}</span>@enderror</label>
                </section>

                <section class="card card-pad grid" style="gap:12px">
                    <h3>Sizes</h3>
                    @php $sizes = $product->sizes ?? collect(); @endphp
                    <label class="field"><span>Size label</span><input type="text" name="size_label" value="{{ old('size_label', $product->size_label) }}" placeholder="Ring size"></label>
                    <label class="field"><span>Sizes, comma-separated</span><input type="text" name="sizes" value="{{ old('sizes', $sizes->pluck('label')->join(', ')) }}" placeholder="5, 6, 7, 8, 9"></label>
                    <label class="field"><span>Sold-out sizes</span><input type="text" name="sold_out_sizes" value="{{ old('sold_out_sizes', $sizes->where('in_stock', false)->pluck('label')->join(', ')) }}" placeholder="9"></label>
                    <label class="field"><span>Default size</span><input type="text" name="default_size" value="{{ old('default_size', $product->default_size) }}" placeholder="7"></label>
                    <span class="hint">Leave sizes empty for pieces without sizes.</span>
                </section>

                <section class="card card-pad grid" style="gap:12px">
                    <h3>Bullion details</h3>
                    <label class="field"><span>Metal</span>
                        <select name="metal"><option value="">—</option>@foreach (['gold' => 'Gold', 'silver' => 'Silver', 'platinum' => 'Platinum'] as $k => $v)<option value="{{ $k }}" @selected(old('metal', $product->metal) === $k)>{{ $v }}</option>@endforeach</select></label>
                    <label class="field"><span>Weight (grams)</span><input type="number" step="0.0001" min="0" name="weight_grams" value="{{ old('weight_grams', $product->weight_grams) }}"></label>
                    <label class="field"><span>Purity</span><input type="text" name="purity" value="{{ old('purity', $product->purity) }}" placeholder="999.9"></label>
                    <span class="hint">Bullion priced at or above the reserve limit in Settings is reserved one at a time.</span>
                </section>
            </div>
        </div>

        <div class="form-actions"><button class="btn">Save product</button></div>
    </form>

    @if ($editing)
        <form method="post" action="{{ route('admin.products.destroy', $product) }}" data-confirm="Delete {{ $product->name }}? Past orders keep their copy.">
            @csrf @method('DELETE')
            <button class="btn danger">Delete product</button>
        </form>
    @endif
@endsection
