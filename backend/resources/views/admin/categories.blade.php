@extends('admin.layout')
@section('title', 'Categories')
@section('crumbs', 'Categories')

@section('content')
    <div class="page-head"><div><h1>Categories</h1><p class="muted">Shop categories, grouped into the menu sections (Silver Jewellery, Gold Jewellery, Bullion, Silver Utensils, Kids). Edit a row and press Save. The home page shows each category as a round icon, picked from its name (ring, earrings, bar, coin…).</p></div></div>

    @foreach ($categories as $c)<form method="post" action="{{ route('admin.categories.update', $c) }}" id="cat-{{ $c->id }}" enctype="multipart/form-data" hidden>@csrf @method('PATCH')</form>@endforeach
    <section class="card">
        <div class="table-wrap"><table>
            <thead><tr><th>Photo</th><th>Name</th><th>Slug</th><th>Section</th><th>Type</th><th>Description</th><th>Order</th><th>Visible</th><th>Products</th><th></th></tr></thead>
            <tbody>
            @foreach ($categories as $c)
                <tr>
                    <td style="width:150px">
                        @if ($c->image)<img src="{{ asset('uploads/'.$c->image) }}" alt="" class="thumb" style="border-radius:50%;margin-bottom:6px">@endif
                        <input form="cat-{{ $c->id }}" type="file" name="image" accept="image/jpeg,image/png,image/webp" aria-label="Photo for {{ $c->name }}" style="max-width:140px;font-size:11px">
                        @if ($c->image)<label class="check small"><input form="cat-{{ $c->id }}" type="checkbox" name="remove_image" value="1"> Remove</label>@endif
                    </td>
                    <td><input form="cat-{{ $c->id }}" type="text" name="name" value="{{ $c->name }}" required aria-label="Name"></td>
                    <td><input form="cat-{{ $c->id }}" type="text" name="slug" value="{{ $c->slug }}" aria-label="Slug"></td>
                    <td><input form="cat-{{ $c->id }}" type="text" name="group" value="{{ $c->group }}" list="groups" aria-label="Section" placeholder="Silver Jewellery"></td>
                    <td><select form="cat-{{ $c->id }}" name="kind" aria-label="Type"><option value="jewellery" @selected($c->kind === 'jewellery')>Jewellery</option><option value="bullion" @selected($c->kind === 'bullion')>Bullion</option></select></td>
                    <td><input form="cat-{{ $c->id }}" type="text" name="description" value="{{ $c->description }}" aria-label="Description"></td>
                    <td style="width:90px"><input form="cat-{{ $c->id }}" type="number" name="sort_order" value="{{ $c->sort_order }}" min="0" aria-label="Order"></td>
                    <td><input form="cat-{{ $c->id }}" type="checkbox" class="check" name="is_visible" value="1" @checked($c->is_visible) aria-label="Visible"></td>
                    <td>{{ $c->products_count }}</td>
                    <td class="num" style="white-space:nowrap">
                        <button form="cat-{{ $c->id }}" class="btn sm">Save</button>
                        <form method="post" action="{{ route('admin.categories.destroy', $c) }}" style="display:inline" data-confirm="Delete {{ $c->name }}?">@csrf @method('DELETE')<button class="btn danger sm">Delete</button></form>
                    </td>
                </tr>
            @endforeach
            </tbody>
        </table></div>
    </section>

    <section class="card card-pad grid" style="gap:14px">
        <h3>Add a category</h3>
        <form method="post" action="{{ route('admin.categories.store') }}" class="form-grid" enctype="multipart/form-data">
            @csrf
            <label class="field"><span>Name</span><input type="text" name="name" required></label>
            <label class="field"><span>Section on the site</span><input type="text" name="group" list="groups" placeholder="Silver Jewellery, Gold Jewellery, Bullion, Silver Utensils, Kids"></label>
            <label class="field"><span>Type</span><select name="kind"><option value="jewellery">Jewellery</option><option value="bullion">Bullion</option></select></label>
            <label class="field full"><span>Description</span><input type="text" name="description"></label>
            <label class="field full"><span>Photo (optional, kept for later use)</span><input type="file" name="image" accept="image/jpeg,image/png,image/webp"><span class="hint">Not shown on the site at the moment — the home page uses icons.</span></label>
            <input type="hidden" name="is_visible" value="1">
            <div class="form-actions full"><button class="btn">Add category</button></div>
        </form>
    </section>
    <datalist id="groups">@foreach ($categories->pluck('group')->filter()->unique() as $g)<option value="{{ $g }}">@endforeach</datalist>
@endsection
