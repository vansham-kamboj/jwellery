@extends('admin.layout')
@section('title', 'Subscribers')
@section('crumbs', 'Subscribers')
@section('top-actions')<a href="{{ route('admin.subscribers.export') }}" class="btn ghost">Download CSV</a>@endsection

@section('content')
    <div class="page-head"><div><h1>Subscribers</h1><p class="muted">{{ $subscribers->total() }} newsletter {{ Str::plural('sign-up', $subscribers->total()) }}.</p></div></div>
    <section class="card">
        @if ($subscribers->isEmpty())
            <p class="empty">No sign-ups yet.</p>
        @else
            <div class="table-wrap"><table>
                <thead><tr><th>Email</th><th>Source</th><th>Joined</th><th></th></tr></thead>
                <tbody>
                @foreach ($subscribers as $s)
                    <tr>
                        <td>{{ $s->email }}</td>
                        <td class="muted">{{ $s->source ?: '—' }}</td>
                        <td class="muted">{{ $s->created_at->format('j M Y') }}</td>
                        <td class="num"><form method="post" action="{{ route('admin.subscribers.destroy', $s) }}" data-confirm="Remove {{ $s->email }}?">@csrf @method('DELETE')<button class="link-btn danger">Remove</button></form></td>
                    </tr>
                @endforeach
                </tbody>
            </table></div>
            {{ $subscribers->links() }}
        @endif
    </section>
@endsection
