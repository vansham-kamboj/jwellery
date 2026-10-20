@extends('admin.layout')
@section('title', 'Finishes')
@section('crumbs', 'Finishes')

@section('content')
    <div class="page-head"><div><h1>Finishes</h1><p class="muted">Metal colours a piece can come in. Each product picks its own finishes and price changes.</p></div></div>

    @foreach ($finishes as $f)<form method="post" action="{{ route('admin.finishes.update', $f) }}" id="fin-{{ $f->id }}" hidden>@csrf @method('PATCH')</form>@endforeach
    <section class="card">
        <div class="table-wrap"><table>
            <thead><tr><th>Swatch</th><th>Name</th><th>Slug</th><th>Order</th><th>Products</th><th></th></tr></thead>
            <tbody>
            @foreach ($finishes as $f)
                <tr>
                    <td style="width:90px"><input form="fin-{{ $f->id }}" type="color" name="swatch_hex" value="{{ $f->swatch_hex }}" aria-label="Swatch colour"></td>
                    <td><input form="fin-{{ $f->id }}" type="text" name="name" value="{{ $f->name }}" required aria-label="Name"></td>
                    <td><input form="fin-{{ $f->id }}" type="text" name="slug" value="{{ $f->slug }}" aria-label="Slug"></td>
                    <td style="width:90px"><input form="fin-{{ $f->id }}" type="number" name="sort_order" value="{{ $f->sort_order }}" min="0" aria-label="Order"></td>
                    <td>{{ $f->products_count }}</td>
                    <td class="num" style="white-space:nowrap">
                        <button form="fin-{{ $f->id }}" class="btn sm">Save</button>
                        <form method="post" action="{{ route('admin.finishes.destroy', $f) }}" style="display:inline" data-confirm="Delete {{ $f->name }}? It will be removed from {{ $f->products_count }} products.">@csrf @method('DELETE')<button class="btn danger sm">Delete</button></form>
                    </td>
                </tr>
            @endforeach
            </tbody>
        </table></div>
    </section>

    <section class="card card-pad grid" style="gap:14px">
        <h3>Add a finish</h3>
        <form method="post" action="{{ route('admin.finishes.store') }}" class="form-grid">
            @csrf
            <label class="field"><span>Name</span><input type="text" name="name" required placeholder="Rose gold"></label>
            <label class="field"><span>Swatch</span><input type="color" name="swatch_hex" value="#d8a48f"></label>
            <div class="form-actions full"><button class="btn">Add finish</button></div>
        </form>
    </section>
@endsection
