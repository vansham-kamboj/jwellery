<?php

namespace App\Support;

use App\Models\Booking;
use App\Models\CustomRequest;
use App\Models\Order;

/**
 * A tiny snapshot the admin pages poll every few seconds (see public/admin-assets/live.js).
 * The signature changes whenever an order, request or booking is added or edited,
 * which tells open list pages to refresh themselves.
 */
class LiveStatus
{
    public static function latestOrderId(): int
    {
        return (int) Order::max('id');
    }

    public static function signature(): string
    {
        return md5(implode('|', [
            Order::count(), Order::max('updated_at'),
            CustomRequest::count(), CustomRequest::max('updated_at'),
            Booking::count(), Booking::max('updated_at'),
        ]));
    }

    public static function counts(): array
    {
        return [
            'orders' => Order::where('status', 'new')->count(),
            'requests' => CustomRequest::where('status', 'new')->count(),
        ];
    }

    public static function newOrdersSince(int $id): array
    {
        return Order::where('id', '>', $id)->orderBy('id')->limit(10)->get()
            ->map(fn (Order $o) => [
                'id' => $o->id,
                'code' => $o->code,
                'name' => $o->customer_name,
                'total' => '$'.number_format((float) $o->total, 2),
                'url' => route('admin.orders.show', $o),
            ])->all();
    }
}
