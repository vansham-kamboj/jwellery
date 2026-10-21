<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Finish;
use App\Services\ImageOptimizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** Categories and finishes — small lists edited inline. */
class CatalogController extends Controller
{
    public function categories()
    {
        return view('admin.categories', ['categories' => Category::withCount('products')->orderBy('sort_order')->get()]);
    }

    public function saveCategory(Request $request, ?Category $category = null)
    {
        $category ??= new Category;
        $d = $request->validate([
            'name' => 'required|string|max:80',
            'slug' => ['nullable', 'alpha_dash', 'max:80', Rule::unique('categories', 'slug')->ignore($category->id)],
            'kind' => 'required|in:jewellery,bullion',
            'group' => 'nullable|string|max:60',
            'description' => 'nullable|string|max:1000',
            'sort_order' => 'nullable|integer|min:0',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:8192',
        ]);
        unset($d['image']);
        $category->fill(array_merge($d, ['sort_order' => $d['sort_order'] ?? 0]))->fill([
            'slug' => ($d['slug'] ?? null) ?: Str::slug($d['name']),
            'is_visible' => $request->boolean('is_visible'),
        ]);

        // Photo for the round category button on the home page (resized to WebP like product photos).
        if ($request->hasFile('image') || $request->boolean('remove_image')) {
            if ($category->image) {
                Storage::disk('public')->delete($category->image);
            }
            $category->image = $request->hasFile('image') ? app(ImageOptimizer::class)->store($request->file('image'), 'categories') : null;
        }
        $category->save();

        return back()->with('ok', $category->name.' saved.');
    }

    public function deleteCategory(Category $category)
    {
        if ($category->products()->withTrashed()->exists()) {
            return back()->with('error', 'Move or delete the products in '.$category->name.' first.');
        }
        $category->delete();

        return back()->with('ok', 'Category deleted.');
    }

    public function finishes()
    {
        return view('admin.finishes', ['finishes' => Finish::withCount('products')->orderBy('sort_order')->get()]);
    }

    public function saveFinish(Request $request, ?Finish $finish = null)
    {
        $finish ??= new Finish;
        $d = $request->validate([
            'name' => 'required|string|max:80',
            'slug' => ['nullable', 'alpha_dash', 'max:80', Rule::unique('finishes', 'slug')->ignore($finish->id)],
            'swatch_hex' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'sort_order' => 'nullable|integer|min:0',
        ]);
        $finish->fill(array_merge($d, ['sort_order' => $d['sort_order'] ?? 0]))->fill(['slug' => ($d['slug'] ?? null) ?: Str::slug($d['name'])])->save();

        return back()->with('ok', $finish->name.' saved.');
    }

    public function deleteFinish(Finish $finish)
    {
        $finish->delete();

        return back()->with('ok', 'Finish deleted.');
    }
}
