@extends('admin.layout')
@section('title', 'Settings')
@section('crumbs', 'Settings')

@section('content')
    <form method="post" action="{{ route('admin.settings.update') }}" class="grid" style="gap:22px">
        @csrf @method('PUT')
        <div class="page-head">
            <div><h1>Settings</h1><p class="muted">Shown on every storefront that uses this backend.</p></div>
            <button class="btn">Save settings</button>
        </div>

        <div class="grid g2">
            <section class="card card-pad grid" style="gap:14px">
                <h3>Store & contact</h3>
                <div class="form-grid">
                    <label class="field"><span>Store name</span><input type="text" name="store_name" value="{{ old('store_name', $s['store_name']) }}" required></label>
                    <label class="field"><span>WhatsApp number — receives orders and powers every WhatsApp button on the site</span><input type="text" name="whatsapp_number" value="{{ old('whatsapp_number', $s['whatsapp_number']) }}" placeholder="918320495754">@error('whatsapp_number')<span class="err">Digits only, with country code.</span>@enderror</label>
                    <label class="field"><span>Email</span><input type="email" name="contact_email" value="{{ old('contact_email', $s['contact_email']) }}"></label>
                    <label class="field"><span>Phone</span><input type="text" name="contact_phone" value="{{ old('contact_phone', $s['contact_phone']) }}"></label>
                    <label class="field full"><span>Address</span><input type="text" name="address" value="{{ old('address', $s['address']) }}"></label>
                    <label class="field full"><span>Opening hours</span><input type="text" name="hours" value="{{ old('hours', $s['hours']) }}"></label>
                    <label class="field full"><span>Announcement bar</span><input type="text" name="announcement" value="{{ old('announcement', $s['announcement']) }}"></label>
                </div>
            </section>

            <section class="card card-pad grid" style="gap:14px">
                <h3>Social links</h3>
                @foreach (['social_instagram' => 'Instagram', 'social_youtube' => 'YouTube', 'social_x' => 'X (Twitter)', 'social_facebook' => 'Facebook'] as $key => $label)
                    <label class="field"><span>{{ $label }}</span><input type="url" name="{{ $key }}" value="{{ old($key, $s[$key]) }}" placeholder="https://">@error($key)<span class="err">{{ $message }}</span>@enderror</label>
                @endforeach
            </section>

            <section class="card card-pad grid" style="gap:14px">
                <h3>Orders</h3>
                <div class="form-grid">
                    <label class="field"><span>Order code prefix</span><input type="text" name="order_prefix" value="{{ old('order_prefix', $s['order_prefix']) }}" maxlength="6" required></label>
                    <label class="field"><span>Gift wrap fee ($)</span><input type="number" step="0.01" min="0" name="gift_wrap_fee" value="{{ old('gift_wrap_fee', $s['gift_wrap_fee']) }}" required></label>
                    <label class="field"><span>Gift wrap offered from order value ($)</span><input type="number" step="0.01" min="0" name="gift_wrap_min" value="{{ old('gift_wrap_min', $s['gift_wrap_min']) }}" required></label>
                    <label class="field"><span>Reserve bullion at or above ($)</span><input type="number" step="0.01" min="0" name="quote_above" value="{{ old('quote_above', $s['quote_above']) }}" required><span class="hint">One per order; price confirmed by the team.</span></label>
                    <label class="field"><span>Most of one piece per order</span><input type="number" min="1" max="99" name="max_qty_per_line" value="{{ old('max_qty_per_line', $s['max_qty_per_line']) }}" required></label>
                </div>
                <h3>Delivery options</h3>
                @foreach (old('shipping', $s['shipping_methods']) as $i => $m)
                    <div class="form-grid ship-row">
                        <input type="text" name="shipping[{{ $i }}][code]" value="{{ $m['code'] }}" aria-label="Code" placeholder="code">
                        <input type="text" name="shipping[{{ $i }}][name]" value="{{ $m['name'] }}" aria-label="Name">
                        <input type="number" step="0.01" min="0" name="shipping[{{ $i }}][fee]" value="{{ $m['fee'] }}" aria-label="Fee">
                        <input type="number" step="0.01" min="0" name="shipping[{{ $i }}][free_over]" value="{{ $m['free_over'] }}" aria-label="Free over" placeholder="free over">
                        <input type="number" step="0.01" min="0" name="shipping[{{ $i }}][min_order]" value="{{ $m['min_order'] ?? '' }}" aria-label="Minimum order" placeholder="min order">
                    </div>
                @endforeach
                <span class="hint">Code · name · fee · free when the bag is over this amount · only offered from this order value (blanks = no limit).</span>
            </section>

            <section class="card card-pad grid" style="gap:14px">
                <h3>Prices & tax</h3>
                <label class="check"><input type="checkbox" name="prices_include_tax" value="1" @checked(old('prices_include_tax', $s['prices_include_tax']))> Listed prices already include tax (nothing added at checkout)</label>
                <h3>Tax by province (%)</h3>
                <span class="hint">Used only when prices do not include tax.</span>
                <label class="field"><span>Default province</span><input type="text" name="default_province" value="{{ old('default_province', $s['default_province']) }}" maxlength="2" required></label>
                <div class="grid g4" style="gap:10px">
                    @foreach (old('tax_rates', $s['tax_rates']) as $prov => $rate)
                        <label class="field"><span>{{ $prov }}</span><input type="number" step="0.001" min="0" max="30" name="tax_rates[{{ $prov }}]" value="{{ $rate }}"></label>
                    @endforeach
                </div>
                <span class="hint">Pieces marked tax-exempt (investment bullion) are never taxed.</span>
            </section>

            <section class="card card-pad grid" style="gap:14px">
                <h3>Gold & silver</h3>
                <label class="check"><input type="checkbox" name="show_bullion_prices" value="1" @checked(old('show_bullion_prices', $s['show_bullion_prices']))> Show bar and coin prices on the site</label>
                <span class="hint">When off, bars and coins show “Price on request” and customers ask for today’s price on WhatsApp.</span>
                <div class="form-grid">
                    <label class="field"><span>Today’s gold rate (CAD per oz)</span><input type="number" step="0.01" min="0" name="spot_gold_oz" value="{{ old('spot_gold_oz', $s['spot_gold_oz']) }}" placeholder="e.g. 3650"></label>
                    <label class="field"><span>Today’s silver rate (CAD per oz)</span><input type="number" step="0.01" min="0" name="spot_silver_oz" value="{{ old('spot_silver_oz', $s['spot_silver_oz']) }}" placeholder="e.g. 44.50"></label>
                </div>
                <span class="hint">Shown on the site with the time you saved it{{ $s['spot_updated_at'] ? ' — last updated '.\Illuminate\Support\Carbon::parse($s['spot_updated_at'])->timezone(config('app.timezone'))->format('D j M, g:i a') : '' }}. Leave empty to show “Ask for today’s rate”.</span>
            </section>

            <section class="card card-pad grid" style="gap:14px">
                <h3>Studio bookings</h3>
                <div class="field"><span>Open days</span>
                    <div class="toolbar">
                        @foreach ([1 => 'Mon', 2 => 'Tue', 3 => 'Wed', 4 => 'Thu', 5 => 'Fri', 6 => 'Sat', 0 => 'Sun'] as $d => $label)
                            <label class="check"><input type="checkbox" name="booking_days[]" value="{{ $d }}" @checked(in_array($d, old('booking_days', $s['booking_days'])))> {{ $label }}</label>
                        @endforeach
                    </div>
                </div>
                <label class="field"><span>Time slots, comma-separated</span><input type="text" name="booking_slots" value="{{ old('booking_slots', implode(', ', $s['booking_slots'])) }}" placeholder="11:00, 12:30, 14:00"></label>
            </section>
        </div>
        <div class="form-actions"><button class="btn">Save settings</button></div>
    </form>

    <section class="card card-pad grid" style="gap:12px;max-width:560px">
        <h3>Database updates</h3>
        @if (count($pending))
            <p class="muted">{{ count($pending) }} update{{ count($pending) === 1 ? '' : 's' }} waiting after the last deploy. Run {{ count($pending) === 1 ? 'it' : 'them' }} once so new features work on the site.</p>
        @else
            <p class="muted">The database is up to date.</p>
        @endif
        <form method="post" action="{{ route('admin.settings.migrate') }}">@csrf<button class="btn {{ count($pending) ? '' : 'ghost' }}">Run database updates</button></form>
    </section>

    <section class="card card-pad grid" style="gap:14px;max-width:560px">
        <h3>Your password</h3>
        <form method="post" action="{{ route('admin.account.password') }}" class="grid" style="gap:12px">
            @csrf @method('PUT')
            <label class="field"><span>Current password</span><input type="password" name="current_password" autocomplete="current-password" required>@error('current_password')<span class="err">{{ $message }}</span>@enderror</label>
            <label class="field"><span>New password</span><input type="password" name="password" autocomplete="new-password" required>@error('password')<span class="err">{{ $message }}</span>@enderror<span class="hint">At least 10 characters, with letters and numbers.</span></label>
            <label class="field"><span>Repeat new password</span><input type="password" name="password_confirmation" autocomplete="new-password" required></label>
            <div><button class="btn ghost">Change password</button></div>
        </form>
    </section>
@endsection
