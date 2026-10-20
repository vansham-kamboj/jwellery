@extends('admin.layout')
@section('title', 'Products')
@section('crumbs', 'Products')
@section('top-actions')<a href="{{ route('admin.products.create') }}" class="btn">Add product</a>@endsection

@section('content')
    <div class="page-head">
        <div><h1>Products</h1><p class="muted">{{ $products->total() }} {{ Str::plural('piece', $products->total()) }}. Hidden pieces don’t appear on the site; sold-out pieces show without an Add button.</p></div>
        <form method="get" class="inline-form">
            <select name="category" aria-label="Category" onchange="this.form.submit()" style="width:180px">
                <option value="">All categories</option>
                @foreach ($categories as $c)<option value="{{ $c->id }}" @selected(request('category') == $c->id)>{{ $c->name }}</option>@endforeach
            </select>
            <input type="search" name="q" value="{{ $search }}" placeholder="Search" aria-label="Search products" style="width:200px">
            <button class="btn ghost">Search</button>
        </form>
    </div>

    <section class="card">
        @if ($products->isEmpty())
            <p class="empty">No products yet. <a href="{{ route('admin.products.create') }}">Add the first one</a>.</p>
        @else
            <div class="table-wrap"><table>
                <thead><tr><th></th><th>Name</th><th>Category</th><th class="num">Price</th><th>Status</th><th></th></tr></thead>
                <tbody>
                @foreach ($products as $p)
                    @php $img = $p->images->firstWhere('type', 'image'); @endphp
                    <tr>
                        <td style="width:64px">@if ($img)<img src="{{ $img->url() }}" alt="" class="thumb" loading="lazy">@else<span class="thumb"></span>@endif</td>
                        <td><a href="{{ route('admin.products.edit', $p) }}"><b>{{ $p->name }}</b></a><br><span class="muted small">{{ $p->material }}</span></td>
                        <td>{{ $p->category->name }}@if ($p->kind === 'bullion') <span class="badge quiet">Bullion</span>@endif</td>
                        <td class="num">${{ number_format($p->price, 2) }}</td>
                        <td>
                            <span class="badge {{ $p->is_visible ? 'on' : 'off' }}">{{ $p->is_visible ? 'Visible' : 'Hidden' }}</span>
                            @unless ($p->in_stock)<span class="badge off">Sold out</span>@endunless
                            @if ($p->is_featured)<span class="badge new">Featured</span>@endif
                            @if ($p->tag)<span class="badge quiet">{{ $p->tag }}</span>@endif
                        </td>
                        <td class="num"><a href="{{ route('admin.products.edit', $p) }}" class="btn ghost sm">Edit</a></td>
                    </tr>
                @endforeach
                </tbody>
            </table></div>
            {{ $products->links() }}
        @endif
    </section>
@endsection
