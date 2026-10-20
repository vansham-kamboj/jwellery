<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index()
    {
        return view('admin.reviews.index', ['reviews' => Review::with('product')->orderBy('sort_order')->latest('id')->paginate(30)]);
    }

    public function create()
    {
        return $this->form(new Review(['rating' => 5, 'is_visible' => true, 'is_featured' => true]));
    }

    public function edit(Review $review)
    {
        return $this->form($review);
    }

    public function store(Request $request)
    {
        $review = $this->save($request, new Review);

        return redirect()->route('admin.reviews.index')->with('ok', 'Review by '.$review->author_name.' added.');
    }

    public function update(Request $request, Review $review)
    {
        $this->save($request, $review);

        return redirect()->route('admin.reviews.index')->with('ok', 'Review by '.$review->author_name.' saved.');
    }

    public function destroy(Review $review)
    {
        $review->delete();

        return redirect()->route('admin.reviews.index')->with('ok', 'Review deleted.');
    }

    private function form(Review $review)
    {
        return view('admin.reviews.form', ['review' => $review, 'products' => Product::orderBy('name')->get(['id', 'name'])]);
    }

    private function save(Request $request, Review $review): Review
    {
        $d = $request->validate([
            'author_name' => 'required|string|max:80',
            'city' => 'nullable|string|max:80',
            'rating' => 'required|integer|between:1,5',
            'body' => 'required|string|max:2000',
            'reviewed_on' => 'nullable|date',
            'product_id' => 'nullable|exists:products,id',
            'sort_order' => 'nullable|integer|min:0',
        ]);
        $review->fill(array_merge($d, [
            'sort_order' => $d['sort_order'] ?? 0,
            'is_visible' => $request->boolean('is_visible'),
            'is_featured' => $request->boolean('is_featured'),
        ]))->save();

        return $review;
    }
}
