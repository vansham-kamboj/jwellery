<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

    public function updateDetails(Request $request, Order $order)
    {
        $d = $request->validate([
            'customer_name' => 'required|string|max:120',
            'customer_phone' => 'required|string|max:40',
            'customer_email' => 'nullable|email|max:120',
            'address' => 'nullable|string|max:200',
            'city' => 'nullable|string|max:80',
            'province' => 'nullable|string|max:40',
            'postal_code' => 'nullable|string|max:10',
            'note' => 'nullable|string|max:1000',
        ]);
        $order->update($d);

        return back()->with('ok', 'Order '.$order->code.' details saved.');
    }

    /** Removes the order and its items. Orders never change stock, so nothing is put back. */
    public function destroy(Order $order)
    {
        $code = $order->code;
        DB::transaction(function () use ($order) {
            $order->items()->delete();
            $order->delete();
        });

        return redirect()->route('admin.orders.index')->with('ok', 'Order '.$code.' deleted.');
    }
}
