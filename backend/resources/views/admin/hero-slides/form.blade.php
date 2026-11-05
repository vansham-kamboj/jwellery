@extends('admin.layout')
@php $editing = $slide->exists; @endphp
@section('title', $editing ? 'Edit slide' : 'New slide')
@section('crumbs')<a href="{{ route('admin.homepage-slides.index') }}">Homepage slides</a> / {{ $editing ? 'Edit' : 'New' }}@endsection

@php
    $photoUrl = fn ($p) => $p ? (str_starts_with($p, 'assets/') ? '/'.$p : asset('uploads/'.$p)) : null;
@endphp

@section('content')
    <form method="post" action="{{ $editing ? route('admin.homepage-slides.update', $slide) : route('admin.homepage-slides.store') }}" enctype="multipart/form-data" class="grid" style="gap:22px">
        @csrf
        @if ($editing) @method('PUT') @endif
        <div class="page-head">
            <h1>{{ $editing ? 'Edit slide' : 'New slide' }}</h1>
            <div class="form-actions"><a href="{{ route('admin.homepage-slides.index') }}" class="btn ghost">Cancel</a><button class="btn">Save slide</button></div>
        </div>

        <div class="split">
            <section class="card card-pad grid" style="gap:16px">
                <h3>Text</h3>
                <label class="field"><span>Small line above the headline</span><input type="text" name="kicker" maxlength="80" value="{{ old('kicker', $slide->kicker) }}" placeholder="Diwali &amp; festive gifting"></label>
                <label class="field"><span>Headline</span><input type="text" name="title" maxlength="160" required value="{{ old('title', $slide->title) }}" placeholder="Lakshmi gold *for the Festival of Lights.*">@error('title')<span class="err">{{ $message }}</span>@enderror<span class="hint">Put words between *stars* to show them in italics.</span></label>
                <label class="field"><span>Sentence under the headline</span><textarea name="text" rows="2" maxlength="300">{{ old('text', $slide->text) }}</textarea></label>

                <h3>Buttons</h3>
                <div class="form-grid">
                    <label class="field"><span>Button 1 text</span><input type="text" name="button_one_label" maxlength="40" value="{{ old('button_one_label', $slide->button_one_label) }}"></label>
                    <label class="field"><span>Button 1 goes to</span><input type="text" name="button_one_link" maxlength="300" value="{{ old('button_one_link', $slide->button_one_link) }}" placeholder="#/shop/silver-rings"></label>
                    <label class="field"><span>Button 2 text</span><input type="text" name="button_two_label" maxlength="40" value="{{ old('button_two_label', $slide->button_two_label) }}"></label>
                    <label class="field"><span>Button 2 goes to</span><input type="text" name="button_two_link" maxlength="300" value="{{ old('button_two_link', $slide->button_two_link) }}" placeholder="https://wa.me/16477185454"></label>
                </div>
                <span class="hint">Shop pages: <b>#/shop/silver-jewellery</b>, <b>#/shop/bullion</b>, <b>#/shop/silver-rings</b>. Other pages: a full web address. Leave both blank to show no buttons.</span>
            </section>

            <section class="card card-pad grid" style="gap:16px">
                <h3>Photo</h3>
                @if ($editing && $slide->image)
                    <div class="grid" style="gap:6px"><span class="muted">Current photo</span><img src="{{ $photoUrl($slide->image) }}" alt="" style="width:100%;max-width:360px;border-radius:8px"></div>
                @endif
                <label class="field"><span>{{ $editing ? 'Replace the photo' : 'Photo' }}</span><input type="file" name="image_file" accept="image/jpeg,image/png,image/webp" {{ $editing ? '' : 'required' }}>@error('image_file')<span class="err">{{ $message }}</span>@enderror<span class="hint">Wide landscape photo works best. Large photos are resized and saved as WebP automatically.</span></label>

                <label class="field"><span>Phone photo (optional)</span><input type="file" name="mobile_file" accept="image/jpeg,image/png,image/webp">@error('mobile_file')<span class="err">{{ $message }}</span>@enderror<span class="hint">A taller crop for phones. If you leave it empty, the main photo is used.</span></label>
                @if ($editing && $slide->mobile_image)
                    <label class="check"><input type="checkbox" name="remove_mobile" value="1"> Remove the phone photo</label>
                @endif
            </section>
        </div>

        <div class="split">
            <section class="card card-pad grid" style="gap:12px">
                <h3>Show on the site</h3>
                <label class="check"><input type="checkbox" name="is_active" value="1" @checked(old('is_active', $slide->is_active))> Show this slide</label>
                <label class="field"><span>Position</span><input type="number" name="sort_order" min="0" max="9999" value="{{ old('sort_order', $slide->sort_order) }}"><span class="hint">1 is first. Lower numbers come first.</span></label>
            </section>
        </div>
    </form>

    @if ($editing)
        <form method="post" action="{{ route('admin.homepage-slides.destroy', $slide) }}" data-confirm="Delete this slide?">@csrf @method('DELETE')<button class="btn danger">Delete slide</button></form>
    @endif
@endsection
