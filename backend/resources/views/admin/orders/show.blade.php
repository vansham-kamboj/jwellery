@extends('admin.layout')
@section('title', $order->code)
@section('crumbs')<a href="{{ route('admin.orders.index') }}">Orders</a> / {{ $order->code }}@endsection
@section('top-actions')<a href="{{ $order->whatsappToCustomer() }}" target="_blank" rel="noopener" class="btn wa">Chat on WhatsApp</a>@endsection

@section('content')
    <div class="page-head">
        <div>
            <h1>Order {{ $order->code }}</h1>
            <p class="muted">Placed {{ $order->created_at->format('l j F Y, H:i') }} · <span class="badge {{ $order->status }}">{{ \App\Models\Order::STATUSES[$order->status] }}</span>
                @if ($order->needs_quote) <span class="badge new">Reserved bullion — confirm today’s price</span>@endif</p>
        </div>
    </div>

    <div class="split">
        <div class="grid">
            <section class="card">
                <div class="card-head"><h2>Items</h2></div>
                <div class="table-wrap"><table>
                    <thead><tr><th>Piece</th><th>Options</th><th class="num">Price</th><th class="num">Qty</th><th class="num">Total</th></tr></thead>
                    <tbody>
                    @foreach ($order->items as $item)
                        <tr>
                            <td>{{ $item->name }}@if ($item->needs_quote)<br><span class="badge new">Reserve</span>@endif</td>
                            <td class="muted">{{ collect([$item->finish, $item->size ? 'Size '.$item->size : null])->filter()->join(' · ') ?: '—' }}</td>
                            <td class="num">${{ number_format($item->unit_price, 2) }}@if ($item->offer_name)<br><s class="muted small">${{ number_format($item->original_price, 2) }}</s> <span class="small muted">{{ $item->offer_name }}</span>@endif</td>
                            <td class="num">{{ $item->qty }}</td>
                            <td class="num">${{ number_format($item->line_total, 2) }}</td>
                        </tr>
                    @endforeach
                    </tbody>
                </table></div>
                <div class="totals">
                    <span class="muted">Subtotal</span><span class="num">${{ number_format($order->subtotal, 2) }}</span>
                    @if ($order->discount_total > 0)<span class="muted">Offers applied</span><span class="num">−${{ number_format($order->discount_total, 2) }}</span>@endif
                    <span class="muted">Delivery ({{ $order->delivery_method }})</span><span class="num">{{ $order->delivery_fee > 0 ? '$'.number_format($order->delivery_fee, 2) : 'Free' }}</span>
                    @if ($order->gift_wrap)<span class="muted">Gift wrap</span><span class="num">${{ number_format($order->gift_wrap_fee, 2) }}</span>@endif
                    <span class="muted">Tax ({{ rtrim(rtrim(number_format($order->tax_rate, 3), '0'), '.') }}% {{ $order->province }})</span><span class="num">${{ number_format($order->tax, 2) }}</span>
                    <span class="grand">Total</span><span class="grand num">${{ number_format($order->total, 2) }} {{ $order->currency }}</span>
                </div>
            </section>
            <section class="card card-pad grid" style="gap:12px">
                <h3>WhatsApp message the customer sent</h3>
                <pre class="msg">{{ $order->whatsapp_message }}</pre>
            </section>
        </div>

        <div class="grid">
            <section class="card card-pad grid" style="gap:14px">
                <h3>Status</h3>
                <form method="post" action="{{ route('admin.orders.update', $order) }}" class="grid" style="gap:12px">
                    @csrf @method('PATCH')
                    <select name="status" aria-label="Order status">
                        @foreach (\App\Models\Order::STATUSES as $key => $label)<option value="{{ $key }}" @selected($order->status === $key)>{{ $label }}</option>@endforeach
                    </select>
                    <label class="field"><span>Private notes</span><textarea name="admin_notes" placeholder="Payment reference, tracking number…">{{ old('admin_notes', $order->admin_notes) }}</textarea></label>
                    <button class="btn">Save</button>
                </form>
                <dl class="kv small">
                    @foreach (['confirmed_at' => 'Confirmed', 'shipped_at' => 'Shipped', 'completed_at' => 'Completed', 'cancelled_at' => 'Cancelled'] as $col => $label)
                        @if ($order->{$col})<dt>{{ $label }}</dt><dd>{{ $order->{$col}->format('j M Y, H:i') }}</dd>@endif
                    @endforeach
                </dl>
            </section>
            <section class="card card-pad grid" style="gap:12px">
                <h3>Customer</h3>
                <dl class="kv">
                    <dt>Name</dt><dd>{{ $order->customer_name }}</dd>
                    <dt>Phone</dt><dd><a href="tel:{{ preg_replace('/[^0-9+]/', '', $order->customer_phone) }}">{{ $order->customer_phone }}</a></dd>
                    @if ($order->customer_email)<dt>Email</dt><dd><a href="mailto:{{ $order->customer_email }}">{{ $order->customer_email }}</a></dd>@endif
                    <dt>Address</dt><dd>{{ collect([$order->address, $order->city, trim($order->province.' '.$order->postal_code)])->filter()->join(', ') ?: '—' }}</dd>
                    @if ($order->note)<dt>Note</dt><dd>{{ $order->note }}</dd>@endif
                </dl>
            </section>
        </div>
    </div>
@endsection
