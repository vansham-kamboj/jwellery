<?php

/*
 | Store configuration. Every external value (URLs, numbers, accounts) comes from .env.
 | Business values here are only first-run defaults: once saved in Admin → Settings,
 | the database copy wins (see App\Support\Settings).
 */

$list = fn (?string $v) => array_values(array_filter(array_map('trim', explode(',', (string) $v))));

return [

    // External services.
    'whatsapp_url' => rtrim((string) env('WHATSAPP_API_URL'), '/'),   // click-to-chat base, e.g. wa.me
    'fonts_url' => env('ADMIN_FONTS_URL'),                            // admin panel web fonts stylesheet

    // Frontend sites allowed to call the API (CORS), comma-separated.
    'frontend_urls' => $list(env('FRONTEND_URLS')),

    // Admin panel lives at APP_URL/{admin_path}. Keep it non-obvious in production.
    'admin_path' => trim(env('ADMIN_PATH', 'admin'), '/'),

    // First admin account, created by `php artisan db:seed`. Change the password after first login.
    'admin' => [
        'name' => env('ADMIN_NAME', 'Admin'),
        'email' => env('ADMIN_EMAIL'),
        'password' => env('ADMIN_PASSWORD'),
    ],

    // Copy the frontend's images into storage when seeding (path relative to backend/).
    'seed_assets_path' => env('SEED_ASSETS_PATH', '../'),

    'defaults' => [
        'store_name' => env('APP_NAME', 'Store'),
        'whatsapp_number' => env('STORE_WHATSAPP'),
        'contact_email' => env('STORE_EMAIL'),
        'contact_phone' => env('STORE_PHONE'),
        'address' => env('STORE_ADDRESS'),
        'social_instagram' => env('SOCIAL_INSTAGRAM'),
        'social_youtube' => env('SOCIAL_YOUTUBE'),
        'social_x' => env('SOCIAL_X'),
        'social_facebook' => env('SOCIAL_FACEBOOK'),
        'currency' => env('STORE_CURRENCY', 'CAD'),
        'order_prefix' => env('ORDER_PREFIX', 'ORD'),
        'announcement' => 'Free home delivery across the GTA on orders over $200',
        'hours' => 'Mon–Sun · 11 am – 7 pm · visits by appointment',
        'prices_include_tax' => true,   // listed prices already include tax; nothing is added at checkout
        'show_bullion_prices' => false, // bars and coins show "price on request" (today's rate via WhatsApp)
        'spot_gold_oz' => null,         // today's gold rate, CAD per troy ounce (set in Admin → Settings)
        'spot_silver_oz' => null,       // today's silver rate, CAD per troy ounce
        'spot_updated_at' => null,
        'gift_wrap_fee' => 0,
        'gift_wrap_min' => 150,         // gift wrapping offered on orders at or above this value
        'quote_above' => 2500,          // bullion at or above this price is reserved, one per order
        'max_qty_per_line' => 10,
        'default_province' => 'ON',
        'tax_rates' => [                // % per province (HST or GST+PST); used only when prices exclude tax
            'AB' => 5, 'BC' => 12, 'MB' => 12, 'NB' => 15, 'NL' => 15, 'NS' => 14, 'NT' => 5,
            'NU' => 5, 'ON' => 13, 'PE' => 15, 'QC' => 14.975, 'SK' => 11, 'YT' => 5,
        ],
        'shipping_methods' => [
            ['code' => 'gta', 'name' => 'Free home delivery (GTA, 3–5 days)', 'fee' => 0, 'free_over' => null, 'min_order' => 200],
            ['code' => 'pickup', 'name' => 'Pick up in Mississauga', 'fee' => 0, 'free_over' => null, 'min_order' => null],
        ],
        'booking_days' => [2, 3, 4, 5, 6, 0], // 0 = Sunday
        'booking_slots' => ['11:00', '12:30', '14:00', '15:30', '17:00'],
    ],
];
