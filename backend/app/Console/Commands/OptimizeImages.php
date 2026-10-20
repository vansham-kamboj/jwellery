<?php

namespace App\Console\Commands;

use App\Models\ProductImage;
use App\Services\ImageOptimizer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/** Re-encodes product photos stored before the optimiser existed (anything not yet WebP). */
class OptimizeImages extends Command
{
    protected $signature = 'store:optimize-images';

    protected $description = 'Resize stored product photos to at most 1600 px and convert them to WebP';

    public function handle(ImageOptimizer $optimizer): int
    {
        $disk = Storage::disk('public');
        $before = $after = $done = 0;
        foreach (ProductImage::where('type', 'image')->where('path', 'not like', '%.webp')->get() as $image) {
            if (! $disk->exists($image->path)) {
                $this->warn("Missing file: {$image->path}");

                continue;
            }
            $old = $image->path;
            $bytes = $disk->get($old);
            $new = $optimizer->storeBytes($bytes, dirname($old), $disk->path($old));
            $image->update(['path' => $new]);
            if (! ProductImage::where('path', $old)->exists()) {
                $disk->delete($old);
            }
            $before += strlen($bytes);
            $after += $disk->size($new);
            $done++;
        }
        $this->info(sprintf('%d photos optimised: %.1f MB → %.1f MB.', $done, $before / 1048576, $after / 1048576));

        return self::SUCCESS;
    }
}
