@extends('admin.layout')
@php $editing = $review->exists; @endphp
@section('title', $editing ? 'Edit review' : 'Add review')
@section('crumbs')<a href="{{ route('admin.reviews.index') }}">Reviews</a> / {{ $editing ? $review->author_name : 'New' }}@endsection

@section('content')
    <form method="post" action="{{ $editing ? route('admin.reviews.update', $review) : route('admin.reviews.store') }}" class="grid" style="gap:22px">
        @csrf
        @if ($editing) @method('PUT') @endif
        <div class="page-head">
            <h1>{{ $editing ? 'Edit review' : 'Add review' }}</h1>
            <div class="form-actions"><a href="{{ route('admin.reviews.index') }}" class="btn ghost">Cancel</a><button class="btn">Save review</button></div>
        </div>
        <div class="split">
            <section class="card card-pad grid" style="gap:16px">
                <div class="form-grid">
                    <label class="field"><span>Customer name</span><input type="text" name="author_name" value="{{ old('author_name', $review->author_name) }}" required placeholder="Priya S.">@error('author_name')<span class="err">{{ $message }}</span>@enderror</label>
                    <label class="field"><span>City</span><input type="text" name="city" value="{{ old('city', $review->city) }}" placeholder="Brampton, ON"></label>
                    <label class="field full"><span>Review</span><textarea name="body" required>{{ old('body', $review->body) }}</textarea>@error('body')<span class="err">{{ $message }}</span>@enderror</label>
                    <label class="field"><span>Rating</span>
                        <select name="rating">@for ($i = 5; $i >= 1; $i--)<option value="{{ $i }}" @selected((int) old('rating', $review->rating) === $i)>{{ str_repeat('★', $i) }} ({{ $i }})</option>@endfor</select></label>
                    <label class="field"><span>Date</span><input type="date" name="reviewed_on" value="{{ old('reviewed_on', $review->reviewed_on?->toDateString()) }}"></label>
                    <label class="field full"><span>About a piece (optional)</span>
                        <select name="product_id"><option value="">— General review —</option>@foreach ($products as $p)<option value="{{ $p->id }}" @selected(old('product_id', $review->product_id) == $p->id)>{{ $p->name }}</option>@endforeach</select>
                        <span class="hint">Linked reviews also show on that product’s page.</span></label>
                </div>
            </section>
            <section class="card card-pad grid" style="gap:12px">
                <h3>Where it shows</h3>
                <label class="check"><input type="checkbox" name="is_visible" value="1" @checked(old('is_visible', $review->is_visible))> Visible on the site</label>
                <label class="check"><input type="checkbox" name="is_featured" value="1" @checked(old('is_featured', $review->is_featured))> Show on the home page</label>
                <label class="field"><span>Order</span><input type="number" name="sort_order" min="0" value="{{ old('sort_order', $review->sort_order ?? 0) }}"></label>
                <span class="hint">Only publish genuine reviews with the customer’s permission.</span>
            </section>
        </div>
    </form>
    @if ($editing)
        <form method="post" action="{{ route('admin.reviews.destroy', $review) }}" data-confirm="Delete this review?">@csrf @method('DELETE')<button class="btn danger">Delete review</button></form>
    @endif
@endsection
