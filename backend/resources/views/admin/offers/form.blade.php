@extends('admin.layout')
@php $editing = $offer->exists; @endphp
@section('title', $editing ? $offer->name : 'New offer')
@section('crumbs')<a href="{{ route('admin.offers.index') }}">Offers</a> / {{ $editing ? $offer->name : 'New' }}@endsection

@section('content')
    <form method="post" action="{{ $editing ? route('admin.offers.update', $offer) : route('admin.offers.store') }}" class="grid" style="gap:22px">
        @csrf
        @if ($editing) @method('PUT') @endif
        <div class="page-head">
            <h1>{{ $editing ? $offer->name : 'New offer' }}</h1>
            <div class="form-actions"><a href="{{ route('admin.offers.index') }}" class="btn ghost">Cancel</a><button class="btn">Save offer</button></div>
        </div>

        <div class="split">
            <section class="card card-pad grid" style="gap:16px">
                <div class="form-grid">
                    <label class="field"><span>Name</span><input type="text" name="name" value="{{ old('name', $offer->name) }}" required placeholder="Diwali 2026"></label>
                    <label class="field"><span>Badge on the site</span><input type="text" name="badge" value="{{ old('badge', $offer->badge) }}" placeholder="Diwali −15%"></label>
                    <label class="field"><span>Type</span><select name="type"><option value="percent" @selected(old('type', $offer->type) === 'percent')>Percent off</option><option value="fixed" @selected(old('type', $offer->type) === 'fixed')>Fixed $ off</option></select></label>
                    <label class="field"><span>Value</span><input type="number" step="0.01" min="0.01" name="value" value="{{ old('value', $offer->value) }}" required>@error('value')<span class="err">{{ $message }}</span>@enderror</label>
                    <label class="field"><span>Starts</span><input type="datetime-local" name="starts_at" value="{{ old('starts_at', $offer->starts_at?->format('Y-m-d\TH:i')) }}"></label>
                    <label class="field"><span>Ends</span><input type="datetime-local" name="ends_at" value="{{ old('ends_at', $offer->ends_at?->format('Y-m-d\TH:i')) }}">@error('ends_at')<span class="err">{{ $message }}</span>@enderror</label>
                    <label class="field"><span>Only pieces priced from</span><input type="number" step="0.01" min="0" name="min_price" value="{{ old('min_price', $offer->min_price) }}"></label>
                    <label class="field"><span>…up to</span><input type="number" step="0.01" min="0" name="max_price" value="{{ old('max_price', $offer->max_price) }}"></label>
                </div>
                <h3>Applies to</h3>
                <label class="check"><input type="checkbox" name="applies_to_all" value="1" @checked(old('applies_to_all', $offer->applies_to_all))> Every product (within the price range above)</label>
                <div class="field"><span>Or these categories</span>
                    <div class="toolbar">@foreach ($categories as $c)<label class="check"><input type="checkbox" name="categories[]" value="{{ $c->id }}" @checked(in_array($c->id, old('categories', $offer->categories->pluck('id')->all())))> {{ $c->name }}</label>@endforeach</div>
                </div>
                <label class="field"><span>And/or these products</span>
                    <select name="products[]" multiple size="8">
                        @foreach ($products as $p)<option value="{{ $p->id }}" @selected(in_array($p->id, old('products', $offer->products->pluck('id')->all())))>{{ $p->name }}</option>@endforeach
                    </select><span class="hint">Hold Ctrl (Cmd on Mac) to pick several.</span></label>
            </section>
            <section class="card card-pad grid" style="gap:12px">
                <h3>Status</h3>
                <label class="check"><input type="checkbox" name="is_active" value="1" @checked(old('is_active', $offer->is_active))> Offer is on</label>
                <span class="hint">An offer runs while it’s on and today is between its start and end. Prices on the site and in orders update automatically.</span>
            </section>
        </div>
    </form>

    @if ($editing)
        <form method="post" action="{{ route('admin.offers.destroy', $offer) }}" data-confirm="Delete {{ $offer->name }}?">@csrf @method('DELETE')<button class="btn danger">Delete offer</button></form>
    @endif
@endsection
