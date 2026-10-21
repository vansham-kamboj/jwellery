@extends('admin.layout')
@section('title', 'Custom requests')
@section('crumbs', 'Custom requests')

@section('live', '1')
@section('content')
    <div class="page-head"><div><h1>Custom requests</h1><p class="muted">Bespoke pieces customers asked about through the design form.</p></div></div>
    <nav class="tabs" aria-label="Filter by status">
        <a href="{{ route('admin.requests.index') }}" class="{{ $status ? '' : 'on' }}">All</a>
        @foreach (\App\Models\CustomRequest::STATUSES as $k => $label)<a href="{{ route('admin.requests.index', ['status' => $k]) }}" class="{{ $status === $k ? 'on' : '' }}">{{ $label }}</a>@endforeach
    </nav>

    @forelse ($requests as $r)
        <section class="card">
            <div class="card-head">
                <div><h3>{{ $r->name }} <span class="badge {{ $r->status }}">{{ \App\Models\CustomRequest::STATUSES[$r->status] }}</span></h3>
                    <span class="muted small">{{ $r->created_at->format('j M Y, H:i') }} · <a href="tel:{{ preg_replace('/[^0-9+]/', '', $r->phone) }}">{{ $r->phone }}</a>@if ($r->email) · <a href="mailto:{{ $r->email }}">{{ $r->email }}</a>@endif</span></div>
            </div>
            <div class="card-pad split" style="grid-template-columns:minmax(0,1fr) 300px">
                <div class="grid" style="gap:10px">
                    <dl class="kv">
                        @foreach (['piece_type' => 'Piece', 'metal' => 'Metal', 'budget' => 'Budget'] as $col => $label)@if ($r->{$col})<dt>{{ $label }}</dt><dd>{{ $r->{$col} }}</dd>@endif @endforeach
                    </dl>
                    <p style="margin:0;white-space:pre-line">{{ $r->details }}</p>
                    @if ($r->reference_image)<a href="{{ asset('uploads/'.$r->reference_image) }}" target="_blank" rel="noopener"><img src="{{ asset('uploads/'.$r->reference_image) }}" alt="Reference photo" style="max-width:220px;border-radius:8px"></a>@endif
                </div>
                <form method="post" action="{{ route('admin.requests.update', $r) }}" class="grid" style="gap:10px">
                    @csrf @method('PATCH')
                    <select name="status" aria-label="Status">@foreach (\App\Models\CustomRequest::STATUSES as $k => $label)<option value="{{ $k }}" @selected($r->status === $k)>{{ $label }}</option>@endforeach</select>
                    <textarea name="admin_notes" placeholder="Notes" aria-label="Notes">{{ $r->admin_notes }}</textarea>
                    <button class="btn sm">Save</button>
                </form>
            </div>
        </section>
    @empty
        <section class="card"><p class="empty">No requests here yet.</p></section>
    @endforelse
    {{ $requests->links() }}
@endsection
