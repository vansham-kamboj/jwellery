<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\CustomRequest;
use App\Models\Order;
use App\Models\Product;
use App\Support\LiveStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke()
    {
        $counts = Order::selectRaw('status, count(*) as n')->groupBy('status')->pluck('n', 'status');

        return view('admin.dashboard', [
            'counts' => collect(Order::STATUSES)->mapWithKeys(fn ($label, $key) => [$key => (int) ($counts[$key] ?? 0)]),
            'ordersToday' => Order::whereDate('created_at', today())->count(),
            'salesMonth' => (float) Order::whereIn('status', ['confirmed', 'shipped', 'completed'])->where('created_at', '>=', now()->startOfMonth())->sum('total'),
            'latest' => Order::latest()->limit(8)->get(),
            'openRequests' => CustomRequest::where('status', 'new')->count(),
            'upcoming' => Booking::where('status', 'booked')->whereDate('date', '>=', today())->orderBy('date')->orderBy('time_slot')->limit(5)->get(),
            'products' => ['total' => Product::count(), 'soldOut' => Product::where('in_stock', false)->count(), 'hidden' => Product::where('is_visible', false)->count()],
        ]);
    }

    /** Polled by the admin every few seconds: new orders since `since`, badge counts and a change signature. */
    public function live(Request $request): JsonResponse
    {
        return response()->json([
            'latest_id' => LiveStatus::latestOrderId(),
            'new_orders' => LiveStatus::newOrdersSince($request->integer('since')),
            'counts' => LiveStatus::counts(),
            'signature' => LiveStatus::signature(),
        ])->header('Cache-Control', 'no-store');
    }
}
