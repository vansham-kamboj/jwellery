@extends('admin.layout')
@section('title', 'Reviews')
@section('crumbs', 'Reviews')
@section('top-actions')<a href="{{ route('admin.reviews.create') }}" class="btn">Add review</a>@endsection

@section('content')
    <div class="page-head"><div><h1>Reviews</h1><p class="muted">Real customer reviews only. The site shows the reviews section only when at least one review is visible.</p></div></div>
    <section class="card">
        @if ($reviews->isEmpty())
            <p class="empty">No reviews yet — the site isn’t showing a reviews section. <a href="{{ route('admin.reviews.create') }}">Add the first one</a> when a customer shares feedback.</p>
        @else
            <div class="table-wrap"><table>
                <thead><tr><th>Customer</th><th>Review</th><th>Rating</th><th>Piece</th><th>Shown</th><th></th></tr></thead>
                <tbody>
                @foreach ($reviews as $r)
                    <tr>
                        <td><b>{{ $r->author_name }}</b>@if ($r->city)<br><span class="muted small">{{ $r->city }}</span>@endif</td>
                        <td style="max-width:420px">{{ Str::limit($r->body, 140) }}</td>
                        <td style="white-space:nowrap;color:var(--gold)">{{ str_repeat('★', $r->rating) }}<span style="color:#d5dede">{{ str_repeat('★', 5 - $r->rating) }}</span></td>
                        <td class="muted">{{ $r->product?->name ?? '—' }}</td>
                        <td><span class="badge {{ $r->is_visible ? 'on' : 'off' }}">{{ $r->is_visible ? 'Visible' : 'Hidden' }}</span>@if ($r->is_visible && $r->is_featured) <span class="badge new">Home page</span>@endif</td>
                        <td class="num"><a href="{{ route('admin.reviews.edit', $r) }}" class="btn ghost sm">Edit</a></td>
                    </tr>
                @endforeach
                </tbody>
            </table></div>
            {{ $reviews->links() }}
        @endif
    </section>
@endsection
