@extends('admin.layout')
@section('title', 'Dashboard')
@section('crumbs', 'Dashboard')
@section('top-actions')<a href="{{ route('admin.products.create') }}" class="btn">Add product</a>@endsection

@section('live', '1')
@section('content')
    <div class="page-head">
        <div><h1>Good {{ now()->hour < 12 ? 'morning' : (now()->hour < 17 ? 'afternoon' : 'evening') }}</h1>
            <p class="muted">{{ now()->format('l, j F Y') }} · {{ $ordersToday }} {{ Str::plural('order', $ordersToday) }} today</p></div>
    </div>

    <nav class="tabs" aria-label="Show figures for">
        @foreach (\App\Http\Controllers\Admin\DashboardController::PERIODS as $key => $label)
            <a href="{{ route('admin.dashboard', ['period' => $key]) }}" class="{{ $period === $key ? 'on' : '' }}">{{ $label }}</a>
        @endforeach
    </nav>
    <p class="muted" style="margin:-6px 0 14px">{{ $periodLabel }} · {{ $rangeText }} · counted by the day each order was placed</p>

    <div class="grid g3">
        <div class="card stat accent"><b>${{ number_format($stats['sales'], 2) }}</b><span>Sales · {{ $stats['salesCount'] }} confirmed, shipped or completed {{ Str::plural('order', $stats['salesCount']) }}</span></div>
        <a href="{{ route('admin.orders.index', ['status' => 'new']) }}" class="card stat"><b>${{ number_format($stats['pending'], 2) }}</b><span>Waiting to confirm · {{ $stats['pendingCount'] }} new {{ Str::plural('order', $stats['pendingCount']) }}</span></a>
        <div class="card stat"><b>${{ number_format($stats['orderValue'], 2) }}</b><span>All orders · {{ $stats['orders'] }} {{ Str::plural('order', $stats['orders']) }}, not counting cancelled</span></div>
    </div>

    <div class="grid g3">
        <div class="card stat"><b>${{ number_format($stats['average'], 2) }}</b><span>Average sale</span></div>
        <a href="{{ route('admin.orders.index', ['status' => 'cancelled']) }}" class="card stat"><b>{{ $stats['cancelled'] }}</b><span>Cancelled · ${{ number_format($stats['cancelledAmount'], 2) }}</span></a>
        <a href="{{ route('admin.requests.index', ['status' => 'new']) }}" class="card stat"><b>{{ $openRequests }}</b><span>New custom requests</span></a>
    </div>

    <div class="grid g5">
        @foreach (\App\Models\Order::STATUSES as $key => $label)
            <a href="{{ route('admin.orders.index', ['status' => $key]) }}" class="card stat {{ $key === 'new' ? 'accent' : '' }}"><b>{{ $counts[$key] }}</b><span>{{ $label }}</span></a>
        @endforeach
    </div>

    <div class="grid g3">
        <a href="{{ route('admin.products.index') }}" class="card stat"><b>{{ $products['total'] }}</b><span>Products · {{ $products['soldOut'] }} sold out · {{ $products['hidden'] }} hidden</span></a>
    </div>

    <div class="split">
        <section class="card">
            <div class="card-head"><h2>Latest orders · {{ $periodLabel }}</h2><a href="{{ route('admin.orders.index') }}">All orders →</a></div>
            @if ($latest->isEmpty())
                <p class="empty">No orders in this period. They appear here as soon as a customer places one.</p>
            @else
                <div class="table-wrap"><table>
                    <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th class="num">Total</th><th>Placed</th></tr></thead>
                    <tbody>
                    @foreach ($latest as $o)
                        <tr>
                            <td><a href="{{ route('admin.orders.show', $o) }}" class="mono">{{ $o->code }}</a></td>
                            <td>{{ $o->customer_name }}</td>
                            <td>@include('admin.orders._status', ['order' => $o])</td>
                            <td class="num">${{ number_format($o->total, 2) }}</td>
                            <td class="muted">{{ $o->created_at->diffForHumans() }}</td>
                        </tr>
                    @endforeach
                    </tbody>
                </table></div>
            @endif
        </section>
        <section class="card">
            <div class="card-head"><h2>Upcoming bookings</h2><a href="{{ route('admin.bookings.index') }}">All →</a></div>
            @forelse ($upcoming as $b)
                <div class="card-pad" style="padding:14px 24px;border-bottom:1px solid var(--line)">
                    <b>{{ $b->date->format('D j M') }} · {{ $b->time_slot }}</b><br>
                    <span class="muted">{{ $b->name }} · {{ $b->phone }}</span>
                </div>
            @empty
                <p class="empty">No upcoming bookings.</p>
            @endforelse
        </section>
    </div>
@endsection
