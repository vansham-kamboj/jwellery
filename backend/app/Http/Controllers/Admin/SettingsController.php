<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\Settings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class SettingsController extends Controller
{
    public function edit()
    {
        return view('admin.settings', ['s' => Settings::all()]);
    }

    public function update(Request $request)
    {
        $d = $request->validate([
            'store_name' => 'required|string|max:80',
            'whatsapp_number' => ['nullable', 'regex:/^\+?[0-9\s]{8,20}$/'],
            'contact_email' => 'nullable|email|max:160',
            'contact_phone' => 'nullable|string|max:40',
            'address' => 'nullable|string|max:200',
            'hours' => 'nullable|string|max:200',
            'announcement' => 'nullable|string|max:200',
            'social_instagram' => 'nullable|url|max:200',
            'social_youtube' => 'nullable|url|max:200',
            'social_x' => 'nullable|url|max:200',
            'social_facebook' => 'nullable|url|max:200',
            'order_prefix' => 'required|alpha|max:6',
            'gift_wrap_fee' => 'required|numeric|min:0',
            'gift_wrap_min' => 'required|numeric|min:0',
            'spot_gold_oz' => 'nullable|numeric|min:0',
            'spot_silver_oz' => 'nullable|numeric|min:0',
            'quote_above' => 'required|numeric|min:0',
            'max_qty_per_line' => 'required|integer|min:1|max:99',
            'default_province' => 'required|string|size:2',
            'tax_rates' => 'required|array',
            'tax_rates.*' => 'required|numeric|min:0|max:30',
            'shipping' => 'required|array|min:1',
            'shipping.*.code' => 'required|alpha_dash|max:30',
            'shipping.*.name' => 'required|string|max:60',
            'shipping.*.fee' => 'required|numeric|min:0',
            'shipping.*.free_over' => 'nullable|numeric|min:0',
            'shipping.*.min_order' => 'nullable|numeric|min:0',
            'booking_days' => 'array',
            'booking_days.*' => 'integer|between:0,6',
            'booking_slots' => 'nullable|string|max:300',
        ]);

        $d['shipping_methods'] = array_values(array_map(fn ($m) => [
            'code' => $m['code'], 'name' => $m['name'], 'fee' => (float) $m['fee'],
            'free_over' => ($m['free_over'] ?? null) === null ? null : (float) $m['free_over'],
            'min_order' => ($m['min_order'] ?? null) === null ? null : (float) $m['min_order'],
        ], $d['shipping']));
        $d['prices_include_tax'] = $request->boolean('prices_include_tax');
        $d['show_bullion_prices'] = $request->boolean('show_bullion_prices');
        foreach (['spot_gold_oz', 'spot_silver_oz'] as $k) {
            $d[$k] = isset($d[$k]) ? (float) $d[$k] : null;
        }
        $old = Settings::all();
        if ($d['spot_gold_oz'] !== $old['spot_gold_oz'] || $d['spot_silver_oz'] !== $old['spot_silver_oz']) {
            $d['spot_updated_at'] = now()->toIso8601String();
        }
        $d['tax_rates'] = array_map('floatval', $d['tax_rates']);
        $d['booking_days'] = array_map('intval', $d['booking_days'] ?? []);
        $d['booking_slots'] = array_values(array_filter(array_map('trim', explode(',', $d['booking_slots'] ?? '')), fn ($t) => preg_match('/^\d{1,2}:\d{2}$/', $t)));
        $d['default_province'] = strtoupper($d['default_province']);
        $d['order_prefix'] = strtoupper($d['order_prefix']);
        unset($d['shipping']);

        Settings::put($d);

        return back()->with('ok', 'Settings saved.');
    }

    public function password(Request $request)
    {
        $request->validate([
            'current_password' => 'required|current_password',
            'password' => ['required', 'confirmed', Password::min(10)->letters()->numbers()],
        ]);
        $request->user()->update(['password' => Hash::make($request->input('password'))]);

        return back()->with('ok', 'Password changed.');
    }
}
