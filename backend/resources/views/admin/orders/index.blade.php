@extends('admin.layout')
@section('title', 'Orders')
@section('crumbs', 'Orders')

@section('content')
    <div class="page-head">
        <div><h1>Orders</h1><p class="muted">Customers send each order on WhatsApp. Change the status right in the list once it’s paid, shipped or done — it saves straight away.</p></div>
        <form method="get" class="inline-form">
            @if ($status)<input type="hidden" name="status" value="{{ $status }}">@endif
            <input type="search" name="q" value="{{ $search }}" placeholder="Code, name or phone" aria-label="Search orders" style="width:240px">
            <button class="btn ghost">Search</button>
        </form>
    </div>

    <nav class="tabs" aria-label="Filter by status">
        <a href="{{ route('admin.orders.index', array_filter(['q' => $search])) }}" class="{{ $status ? '' : 'on' }}">All</a>
        @foreach (\App\Models\Order::STATUSES as $key => $label)
            <a href="{{ route('admin.orders.index', array_filter(['status' => $key, 'q' => $search])) }}" class="{{ $status === $key ? 'on' : '' }}">{{ $label }}</a>
        @endforeach
    </nav>

    <section class="card">
        @if ($orders->isEmpty())
            <p class="empty">No orders{{ $search ? ' match “'.$search.'”' : '' }}.</p>
        @else
            <div class="table-wrap"><table>
                <thead><tr><th>Order</th><th>Customer</th><th>Phone</th><th>Items</th><th>Status</th><th class="num">Total</th><th>Placed</th></tr></thead>
                <tbody>
                @foreach ($orders as $o)
                    <tr>
                        <td><a href="{{ route('admin.orders.show', $o) }}" class="mono">{{ $o->code }}</a>@if ($o->needs_quote) <span class="badge new" title="Contains reserved bullion">Quote</span>@endif</td>
                        <td>{{ $o->customer_name }}</td>
                        <td class="muted">{{ $o->customer_phone }}</td>
                        <td>{{ $o->items_count }}</td>
                        <td>@include('admin.orders._status', ['order' => $o])</td>
                        <td class="num">${{ number_format($o->total, 2) }}</td>
                        <td class="muted">{{ $o->created_at->format('j M Y, H:i') }}</td>
                    </tr>
                @endforeach
                </tbody>
            </table></div>
            {{ $orders->links() }}
        @endif
    </section>
@endsection
