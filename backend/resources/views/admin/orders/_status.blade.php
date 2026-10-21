{{-- Change an order's status straight from a list; saves as soon as a new status is picked. --}}
<form method="post" action="{{ route('admin.orders.update', $order) }}" class="status-form">
    @csrf @method('PATCH')
    <select name="status" class="status-select {{ $order->status }}" aria-label="Status of order {{ $order->code }}"
            onchange="this.className='status-select '+this.value;this.form.requestSubmit()">
        @foreach (\App\Models\Order::STATUSES as $key => $label)
            <option value="{{ $key }}" @selected($order->status === $key)>{{ $label }}</option>
        @endforeach
    </select>
    <noscript><button class="btn sm">Save</button></noscript>
</form>
