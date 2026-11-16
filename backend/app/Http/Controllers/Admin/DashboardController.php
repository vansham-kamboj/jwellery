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
    /** Period filter on the dashboard: key => label. Orders are counted by the day they were placed. */
    public const PERIODS = [
        'today' => 'Today',
        '7d' => 'Last 7 days',
        'month' => 'This month',
        'last_month' => 'Last month',
        'year' => 'This year',
        'all' => 'All time',
    ];

    /** Statuses that count as a sale (paid / on its way / done). */
    public const SOLD = ['confirmed', 'shipped', 'completed'];

    public function __invoke(Request $request)
    {
        $period = array_key_exists($request->query('period'), self::PERIODS) ? $request->query('period') : 'month';
        [$from, $to] = $this->range($period);

        // Every order placed in the period, whatever its status.
        $inPeriod = fn () => Order::query()
            ->when($from, fn ($q) => $q->where('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->where('created_at', '<', $to));

        $byStatus = $inPeriod()->selectRaw('status, count(*) as n, coalesce(sum(total), 0) as amount')->groupBy('status')->get()->keyBy('status');
        $count = fn (array $statuses) => (int) collect($statuses)->sum(fn ($s) => $byStatus[$s]->n ?? 0);
        $amount = fn (array $statuses) => (float) collect($statuses)->sum(fn ($s) => $byStatus[$s]->amount ?? 0);

        $active = array_values(array_diff(array_keys(Order::STATUSES), ['cancelled']));
        $activeCount = $count($active);
        $soldCount = $count(self::SOLD);
        $soldAmount = $amount(self::SOLD);

        return view('admin.dashboard', [
            'period' => $period,
            'periodLabel' => self::PERIODS[$period],
            'rangeText' => $this->rangeText($from, $to),
            'counts' => collect(Order::STATUSES)->mapWithKeys(fn ($label, $key) => [$key => (int) ($byStatus[$key]->n ?? 0)]),
            'stats' => [
                'orders' => $activeCount,
                'orderValue' => $amount($active),
                'sales' => $soldAmount,
                'salesCount' => $soldCount,
                'pending' => $amount(['new']),
                'pendingCount' => $count(['new']),
                'average' => $soldCount ? $soldAmount / $soldCount : 0,
                'cancelled' => $count(['cancelled']),
                'cancelledAmount' => $amount(['cancelled']),
            ],
            'ordersToday' => Order::whereDate('created_at', today())->count(),
            'latest' => $inPeriod()->latest()->limit(8)->get(),
            'openRequests' => CustomRequest::where('status', 'new')->count(),
            'upcoming' => Booking::where('status', 'booked')->whereDate('date', '>=', today())->orderBy('date')->orderBy('time_slot')->limit(5)->get(),
            'products' => ['total' => Product::count(), 'soldOut' => Product::where('in_stock', false)->count(), 'hidden' => Product::where('is_visible', false)->count()],
        ]);
    }

    /** Start (inclusive) and end (exclusive) of a period; null means open-ended. */
    private function range(string $period): array
    {
        $now = now();

        return match ($period) {
            'today' => [$now->copy()->startOfDay(), null],
            '7d' => [$now->copy()->subDays(6)->startOfDay(), null],
            'last_month' => [$now->copy()->subMonthNoOverflow()->startOfMonth(), $now->copy()->startOfMonth()],
            'year' => [$now->copy()->startOfYear(), null],
            'all' => [null, null],
            default => [$now->copy()->startOfMonth(), null],
        };
    }

    private function rangeText($from, $to): string
    {
        if (! $from) {
            return 'Every order since the shop opened';
        }
        $end = $to ? $to->copy()->subDay() : now();

        return $from->isSameDay($end) ? $from->format('j M Y') : $from->format('j M Y').' – '.$end->format('j M Y');
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
