<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Offer;
use App\Models\Product;
use Illuminate\Http\Request;

class OfferController extends Controller
{
    public function index()
    {
        $offers = Offer::with(['categories', 'products'])->latest()->get();
        $products = Product::all();

        return view('admin.offers.index', [
            'offers' => $offers,
            'reach' => $offers->mapWithKeys(fn ($o) => [$o->id => $products->filter(fn ($p) => $o->appliesTo($p))->count()]),
        ]);
    }

    public function create()
    {
        return $this->form(new Offer(['type' => 'percent', 'is_active' => true]));
    }

    public function edit(Offer $offer)
    {
        return $this->form($offer->load(['categories', 'products']));
    }

    public function store(Request $request)
    {
        $offer = $this->save($request, new Offer);

        return redirect()->route('admin.offers.index')->with('ok', $offer->name.' created.');
    }

    public function update(Request $request, Offer $offer)
    {
        $this->save($request, $offer);

        return redirect()->route('admin.offers.index')->with('ok', $offer->name.' saved.');
    }

    public function destroy(Offer $offer)
    {
        $offer->delete();

        return redirect()->route('admin.offers.index')->with('ok', 'Offer deleted.');
    }

    private function form(Offer $offer)
    {
        return view('admin.offers.form', [
            'offer' => $offer,
            'categories' => Category::orderBy('sort_order')->get(),
            'products' => Product::orderBy('name')->get(['id', 'name']),
        ]);
    }

    private function save(Request $request, Offer $offer): Offer
    {
        $d = $request->validate([
            'name' => 'required|string|max:120',
            'badge' => 'nullable|string|max:40',
            'type' => 'required|in:percent,fixed',
            'value' => 'required|numeric|min:0.01|'.($request->input('type') === 'percent' ? 'max:100' : 'max:999999'),
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
            'min_price' => 'nullable|numeric|min:0',
            'max_price' => 'nullable|numeric|min:0',
            'categories' => 'array',
            'categories.*' => 'exists:categories,id',
            'products' => 'array',
            'products.*' => 'exists:products,id',
        ]);
        $offer->fill(collect($d)->except(['categories', 'products'])->all())->fill([
            'is_active' => $request->boolean('is_active'),
            'applies_to_all' => $request->boolean('applies_to_all'),
        ])->save();
        $offer->categories()->sync($d['categories'] ?? []);
        $offer->products()->sync($d['products'] ?? []);

        return $offer;
    }
}
