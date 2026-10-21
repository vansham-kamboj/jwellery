<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Sign in · {{ $storeName }} admin</title>
    <link rel="icon" href="{{ asset('admin-assets/logo.png') }}">
    @if (config('store.fonts_url'))<link rel="stylesheet" href="{{ config('store.fonts_url') }}">@endif
    <link rel="stylesheet" href="{{ asset('admin-assets/admin.css') }}?v=4">
</head>
<body>
<div class="login-page">
    <section class="login-art" aria-hidden="true">
        <img src="{{ asset('admin-assets/logo.png') }}" alt="">
        <span class="ring"></span>
        <div>
            <h2>Every piece, <i>in one place.</i></h2>
            <p>Orders, products, offers and customer requests for {{ $storeName }}.</p>
        </div>
        <span class="small" style="color:#7fb4b7">© {{ date('Y') }} {{ $storeName }}</span>
    </section>
    <main class="login-box">
        <form method="post" action="{{ route('admin.login.attempt') }}">
            @csrf
            <div>
                <span class="label" style="letter-spacing:.24em;text-transform:uppercase;color:var(--teal-600)">Admin</span>
                <h1>Sign in</h1>
            </div>
            @if ($errors->any())<div class="flash error" role="alert">{{ $errors->first() }}</div>@endif
            <label class="field"><span>Email</span>
                <input type="email" name="email" value="{{ old('email') }}" autocomplete="username" required autofocus>
            </label>
            <label class="field"><span>Password</span>
                <input type="password" name="password" autocomplete="current-password" required>
            </label>
            <label class="check"><input type="checkbox" name="remember" value="1"> Keep me signed in on this device</label>
            <button class="btn" type="submit">Sign in</button>
            <span class="hint">Too many wrong tries locks sign-in for a minute.</span>
        </form>
    </main>
</div>
</body>
</html>
