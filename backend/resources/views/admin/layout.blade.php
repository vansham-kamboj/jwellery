@php
    $icons = [
        'dashboard' => '<path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 4v4h6V4z"/>',
        'orders' => '<path d="M6 3h12l1 5H5zM5 8h14v12H5z"/><path d="M9 12h6"/>',
        'products' => '<path d="M12 3l7 6-7 12L5 9z"/><path d="M5 9h14"/>',
        'categories' => '<path d="M4 5h7v6H4zM13 5h7v6h-7zM4 13h7v6H4zM13 13h7v6h-7z"/>',
        'finishes' => '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor"/>',
        'offers' => '<path d="M3 12l9-9h8v8l-9 9z"/><circle cx="16" cy="8" r="1.5"/>',
        'requests' => '<path d="M4 5h16v11H8l-4 4z"/>',
        'bookings' => '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
        'reviews' => '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"/>',
        'subscribers' => '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
        'settings' => '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    ];
    $icon = fn ($n) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'.$icons[$n].'</svg>';
    $newOrders = \App\Models\Order::where('status', 'new')->count();
    $newRequests = \App\Models\CustomRequest::where('status', 'new')->count();
    $nav = [
        'Store' => [['dashboard', 'Dashboard', 'admin.dashboard', 'admin.dashboard', 0], ['orders', 'Orders', 'admin.orders.index', 'admin.orders.*', $newOrders]],
        'Catalogue' => [['products', 'Products', 'admin.products.index', 'admin.products.*', 0], ['categories', 'Categories', 'admin.categories.index', 'admin.categories.*', 0], ['finishes', 'Finishes', 'admin.finishes.index', 'admin.finishes.*', 0], ['offers', 'Offers', 'admin.offers.index', 'admin.offers.*', 0]],
        'Customers' => [['requests', 'Custom requests', 'admin.requests.index', 'admin.requests.*', $newRequests], ['reviews', 'Reviews', 'admin.reviews.index', 'admin.reviews.*', 0], ['bookings', 'Bookings', 'admin.bookings.index', 'admin.bookings.*', 0], ['subscribers', 'Subscribers', 'admin.subscribers.index', 'admin.subscribers.*', 0]],
        'Setup' => [['settings', 'Settings', 'admin.settings.edit', 'admin.settings.*', 0]],
    ];
@endphp
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>@yield('title') · {{ $storeName }} admin</title>
    <link rel="icon" href="{{ asset('admin-assets/logo.png') }}">
    @if (config('store.fonts_url'))<link rel="stylesheet" href="{{ config('store.fonts_url') }}">@endif
    <link rel="stylesheet" href="{{ asset('admin-assets/admin.css') }}?v=4">
</head>
<body>
<div class="shell">
    <aside class="side" id="side">
        <a href="{{ route('admin.dashboard') }}" class="brand"><img src="{{ asset('admin-assets/logo.png') }}" alt="{{ $storeName }}"><span>Admin</span></a>
        <nav class="nav" aria-label="Admin">
            @foreach ($nav as $group => $items)
                <span class="nav-group">{{ $group }}</span>
                @foreach ($items as [$ic, $label, $route, $match, $count])
                    <a href="{{ route($route) }}" class="{{ request()->routeIs($match) ? 'on' : '' }}" @if (request()->routeIs($match)) aria-current="page" @endif>{!! $icon($ic) !!}{{ $label }}@if ($count)<span class="count">{{ $count }}</span>@endif</a>
                @endforeach
            @endforeach
        </nav>
        <div class="side-foot">
            <div>{{ auth()->user()->name }}</div>
            <div class="small" style="color:#7fb4b7">{{ auth()->user()->email }}</div>
            <form method="post" action="{{ route('admin.logout') }}">@csrf<button type="submit">Sign out</button></form>
        </div>
    </aside>
    <div class="main">
        <header class="top">
            <div class="toolbar">
                <button class="burger" type="button" aria-label="Menu" aria-controls="side" aria-expanded="false" onclick="const s=document.getElementById('side');s.classList.toggle('open');this.setAttribute('aria-expanded',s.classList.contains('open'))">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
                </button>
                <span class="crumbs">@yield('crumbs', $storeName)</span>
            </div>
            <div class="toolbar">@yield('top-actions')</div>
        </header>
        <main class="content">
            @if (session('ok'))<div class="flash ok" role="status">{{ session('ok') }}</div>@endif
            @if (session('error'))<div class="flash error" role="alert">{{ session('error') }}</div>@endif
            @if ($errors->any())
                <div class="flash error" role="alert">Please fix the highlighted fields.@if ($errors->count() <= 4)<br>{{ implode(' ', $errors->all()) }}@endif</div>
            @endif
            @yield('content')
        </main>
    </div>
</div>
<script>
    document.addEventListener('submit', e => {
        const msg = e.target.dataset.confirm;
        if (msg && !confirm(msg)) e.preventDefault();
    });
</script>
</body>
</html>
