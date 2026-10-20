@extends('admin.layout')
@section('title', 'Bookings')
@section('crumbs', 'Bookings')

@section('content')
    <div class="page-head"><div><h1>Bookings</h1><p class="muted">Private viewings and fittings booked from the site. Opening days and times are in Settings.</p></div></div>
    <nav class="tabs"><a href="{{ route('admin.bookings.index') }}" class="{{ $past ? '' : 'on' }}">Upcoming</a><a href="{{ route('admin.bookings.index', ['past' => 1]) }}" class="{{ $past ? 'on' : '' }}">Past</a></nav>

    <section class="card">
        @if ($bookings->isEmpty())
            <p class="empty">No {{ $past ? 'past' : 'upcoming' }} bookings.</p>
        @else
            <div class="table-wrap"><table>
                <thead><tr><th>When</th><th>Customer</th><th>Purpose</th><th>Note</th><th>Status</th></tr></thead>
                <tbody>
                @foreach ($bookings as $b)
                    <tr>
                        <td><b>{{ $b->date->format('D j M Y') }}</b><br><span class="muted">{{ $b->time_slot }}</span></td>
                        <td>{{ $b->name }}<br><a href="tel:{{ preg_replace('/[^0-9+]/', '', $b->phone) }}" class="small">{{ $b->phone }}</a>@if ($b->email)<br><span class="small muted">{{ $b->email }}</span>@endif</td>
                        <td>{{ $b->purpose ?: '—' }}</td>
                        <td class="muted" style="max-width:260px">{{ $b->note ?: '—' }}</td>
                        <td>
                            <form method="post" action="{{ route('admin.bookings.update', $b) }}" class="inline-form">@csrf @method('PATCH')
                                <select name="status" onchange="this.form.submit()" aria-label="Status">@foreach (\App\Models\Booking::STATUSES as $k => $label)<option value="{{ $k }}" @selected($b->status === $k)>{{ $label }}</option>@endforeach</select>
                                <noscript><button class="btn sm">Save</button></noscript>
                            </form>
                        </td>
                    </tr>
                @endforeach
                </tbody>
            </table></div>
            {{ $bookings->links() }}
        @endif
    </section>
@endsection
