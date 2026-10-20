<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status');
        $search = trim((string) $request->query('q'));
        $orders = Order::query()
            ->when(isset(Order::STATUSES[$status]), fn ($q) => $q->where('status', $status))
            ->when($search !== '', fn ($q) => $q->where(fn ($w) => $w->where('code', 'like', "%{$search}%")
                ->orWhere('customer_name', 'like', "%{$search}%")->orWhere('customer_phone', 'like', "%{$search}%")))
            ->withCount('items')->latest()->paginate(25)->withQueryString();

        return view('admin.orders.index', ['orders' => $orders, 'status' => $status, 'search' => $search]);
    }

    public function show(Order $order)
    {
        return view('admin.orders.show', ['order' => $order->load('items')]);
    }

    public function update(Request $request, Order $order)
    {
        $d = $request->validate(['status' => ['nullable', Rule::in(array_keys(Order::STATUSES))], 'admin_notes' => 'nullable|string|max:5000']);
        if ($request->has('admin_notes')) {
            $order->admin_notes = $d['admin_notes'];
        }
        if (! empty($d['status']) && $d['status'] !== $order->status) {
            $order->setStatus($d['status']);
        } else {
            $order->save();
        }

        return back()->with('ok', 'Order '.$order->code.' updated.');
    }
}
