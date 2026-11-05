<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class HeroSlide extends Model
{
    protected $fillable = [
        'image', 'mobile_image', 'kicker', 'title', 'text',
        'button_one_label', 'button_one_link', 'button_two_label', 'button_two_link',
        'is_active', 'sort_order',
    ];

    protected $casts = ['is_active' => 'boolean'];

    /** Slides shown on the home page, in the order the admin set. */
    public static function visibleList(): Collection
    {
        return static::where('is_active', true)->orderBy('sort_order')->orderBy('id')->get();
    }

    /** What the storefront receives. Every text field is escaped here, so the page can insert it as HTML safely. */
    public function toPublic(): array
    {
        $buttons = collect([[$this->button_one_label, $this->button_one_link], [$this->button_two_label, $this->button_two_link]])
            ->filter(fn ($b) => filled($b[0]) && filled($b[1]))
            ->map(fn ($b) => [e($b[0]), e($b[1])])
            ->values()->all();

        return [
            'id' => $this->id,
            'image' => self::url($this->image),
            'mobile_image' => self::url($this->mobile_image ?: $this->image),
            'kicker' => e((string) $this->kicker),
            'title' => self::italics(e($this->title)),
            'text' => e((string) $this->text),
            'buttons' => $buttons,
        ];
    }

    /** Built-in photos live in assets/ on the site; uploaded ones are served from /uploads. */
    private static function url(?string $path): string
    {
        if (! $path) {
            return '';
        }

        return str_starts_with($path, 'assets/') ? '/'.$path : asset('uploads/'.$path);
    }

    /** "Silver jewellery. *Gold & silver bars.*" → the part between stars is italic. Input is already escaped. */
    private static function italics(string $escaped): string
    {
        return preg_replace('/\*(.+?)\*/', '<i>$1</i>', $escaped);
    }
}
