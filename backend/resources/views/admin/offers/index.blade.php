@extends('admin.layout')
@section('title', 'Offers')
@section('crumbs', 'Offers')
@section('top-actions')<a href="{{ route('admin.offers.create') }}" class="btn">New offer</a>@endsection

@section('content')
    <div class="page-head"><div><h1>Offers</h1><p class="muted">Discounts the site applies automatically. If several match a piece, the single best one wins.</p></div></div>

    <section class="card">
        @if ($offers->isEmpty())
            <p class="empty">No offers yet. <a href="{{ route('admin.offers.create') }}">Create one</a> for a sale or a festival.</p>
        @else
            <div class="table-wrap"><table>
                <thead><tr><th>Offer</th><th>Discount</th><th>Runs</th><th>Applies to</th><th>Status</th><th></th></tr></thead>
                <tbody>
                @foreach ($offers as $o)
                    @php $running = $o->is_active && (! $o->starts_at || $o->starts_at->isPast()) && (! $o->ends_at || $o->ends_at->isFuture()); @endphp
                    <tr>
                        <td><b>{{ $o->name }}</b>@if ($o->badge)<br><span class="badge quiet">{{ $o->badge }}</span>@endif</td>
                        <td>{{ $o->type === 'percent' ? rtrim(rtrim($o->value, '0'), '.').'%' : '$'.number_format($o->value, 2) }} off</td>
                        <td class="muted">{{ $o->starts_at?->format('j M') ?? 'Now' }} → {{ $o->ends_at?->format('j M Y') ?? 'no end' }}</td>
                        <td>{{ $reach[$o->id] }} {{ Str::plural('product', $reach[$o->id]) }}</td>
                        <td><span class="badge {{ $running ? 'on' : 'off' }}">{{ $running ? 'Running' : ($o->is_active ? 'Scheduled / ended' : 'Off') }}</span></td>
                        <td class="num"><a href="{{ route('admin.offers.edit', $o) }}" class="btn ghost sm">Edit</a></td>
                    </tr>
                @endforeach
                </tbody>
            </table></div>
        @endif
    </section>
@endsection
