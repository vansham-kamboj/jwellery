<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HeroSlide;
use App\Services\ImageOptimizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class HeroSlideController extends Controller
{
    public function index()
    {
        return view('admin.hero-slides.index', ['slides' => HeroSlide::orderBy('sort_order')->orderBy('id')->get()]);
    }

    public function create()
    {
        return $this->form(new HeroSlide(['is_active' => true, 'sort_order' => (int) HeroSlide::max('sort_order') + 1]));
    }

    public function edit(HeroSlide $heroSlide)
    {
        return $this->form($heroSlide);
    }

    public function store(Request $request)
    {
        $this->save($request, new HeroSlide);

        return redirect()->route('admin.homepage-slides.index')->with('ok', 'Slide added.');
    }

    public function update(Request $request, HeroSlide $heroSlide)
    {
        $this->save($request, $heroSlide);

        return redirect()->route('admin.homepage-slides.index')->with('ok', 'Slide saved.');
    }

    public function destroy(HeroSlide $heroSlide)
    {
        $this->removeUploads($heroSlide, ['image', 'mobile_image']);
        $heroSlide->delete();

        return redirect()->route('admin.homepage-slides.index')->with('ok', 'Slide deleted.');
    }

    private function form(HeroSlide $slide)
    {
        return view('admin.hero-slides.form', ['slide' => $slide]);
    }

    private function save(Request $request, HeroSlide $slide): HeroSlide
    {
        $photo = $slide->exists ? 'nullable' : 'required';
        $d = $request->validate([
            'image_file' => [$photo, 'file', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
            'mobile_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
            'kicker' => 'nullable|string|max:80',
            'title' => 'required|string|max:160',
            'text' => 'nullable|string|max:300',
            'button_one_label' => 'nullable|string|max:40',
            'button_one_link' => 'nullable|string|max:300',
            'button_two_label' => 'nullable|string|max:40',
            'button_two_link' => 'nullable|string|max:300',
            'sort_order' => 'nullable|integer|min:0|max:9999',
        ]);

        $optimizer = app(ImageOptimizer::class);
        if ($request->hasFile('image_file')) {
            $this->removeUploads($slide, ['image']);
            $slide->image = $optimizer->store($request->file('image_file'), 'hero');
        }
        if ($request->hasFile('mobile_file')) {
            $this->removeUploads($slide, ['mobile_image']);
            $slide->mobile_image = $optimizer->store($request->file('mobile_file'), 'hero');
        }
        if ($request->boolean('remove_mobile') && ! $request->hasFile('mobile_file')) {
            $this->removeUploads($slide, ['mobile_image']);
            $slide->mobile_image = null;
        }

        $slide->fill([
            'kicker' => $d['kicker'] ?? null,
            'title' => $d['title'],
            'text' => $d['text'] ?? null,
            'button_one_label' => $d['button_one_label'] ?? null,
            'button_one_link' => $d['button_one_link'] ?? null,
            'button_two_label' => $d['button_two_label'] ?? null,
            'button_two_link' => $d['button_two_link'] ?? null,
            'sort_order' => $d['sort_order'] ?? 0,
            'is_active' => $request->boolean('is_active'),
        ])->save();

        return $slide;
    }

    /** Deletes uploaded files (never the built-in photos in assets/). */
    private function removeUploads(HeroSlide $slide, array $fields): void
    {
        foreach ($fields as $field) {
            $path = $slide->getOriginal($field);
            if ($path && ! str_starts_with($path, 'assets/') && Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }
    }
}
