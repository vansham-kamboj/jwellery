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

    <div class="period-bar">
        <nav class="tabs" aria-label="Show figures for">
            @foreach (\App\Http\Controllers\Admin\DashboardController::PERIODS as $key => $label)
                <a href="{{ route('admin.dashboard', ['period' => $key]) }}" class="{{ $period === $key ? 'on' : '' }}" @if ($period === $key) aria-current="page" @endif>{{ $label }}</a>
            @endforeach
        </nav>
        <p class="muted">{{ $rangeText }}</p>
    </div>

    <div class="grid g4">
        <div class="card stat accent"><span>Sales</span><b>${{ number_format($stats['sales'], 2) }}</b><small>{{ $stats['salesCount'] }} confirmed, shipped or completed</small></div>
        <a href="{{ route('admin.orders.index', ['status' => 'new']) }}" class="card stat"><span>Waiting to confirm</span><b>${{ number_format($stats['pending'], 2) }}</b><small>{{ $stats['pendingCount'] }} new {{ Str::plural('order', $stats['pendingCount']) }}</small></a>
        <a href="{{ route('admin.orders.index') }}" class="card stat"><span>All orders</span><b>${{ number_format($stats['orderValue'], 2) }}</b><small>{{ $stats['orders'] }} {{ Str::plural('order', $stats['orders']) }}, not counting cancelled</small></a>
        <div class="card stat"><span>Average sale</span><b>${{ number_format($stats['average'], 2) }}</b><small>Per confirmed order</small></div>
    </div>

    <section class="card">
        <div class="card-head"><h2>Orders by status</h2><span class="muted">{{ $periodLabel }}</span></div>
        <div class="status-strip">
            @foreach (\App\Models\Order::STATUSES as $key => $label)
                <a href="{{ route('admin.orders.index', ['status' => $key]) }}" class="{{ $key }}"><b>{{ $counts[$key] }}</b><span>{{ $label }}</span>@if ($key === 'cancelled')<small>${{ number_format($stats['cancelledAmount'], 2) }}</small>@endif</a>
            @endforeach
        </div>
    </section>

    <div class="grid g2">
        <a href="{{ route('admin.requests.index', ['status' => 'new']) }}" class="card stat"><span>New custom requests</span><b>{{ $openRequests }}</b><small>Waiting for a reply</small></a>
        <a href="{{ route('admin.products.index') }}" class="card stat"><span>Products</span><b>{{ $products['total'] }}</b><small>{{ $products['soldOut'] }} sold out · {{ $products['hidden'] }} hidden</small></a>
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
