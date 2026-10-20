<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Shrinks uploaded photos before they are stored: fixes phone rotation, scales the longest side
 * down to MAX_SIDE pixels and re-encodes as WebP. Files go to the public disk; only the
 * returned path is saved in the database (the API turns it into a full URL).
 */
class ImageOptimizer
{
    public const MAX_SIDE = 1600;

    public const QUALITY = 80;

    /** Store an uploaded file; photos are optimised, anything else (e.g. video) is stored as-is. */
    public function store(UploadedFile $file, string $folder): string
    {
        if (! str_starts_with((string) $file->getMimeType(), 'image/')) {
            return $file->store($folder, 'public');
        }

        return $this->storeBytes(file_get_contents($file->getRealPath()), $folder, $file->getRealPath());
    }

    /** Optimise raw image bytes and store them as <folder>/<random>.webp. */
    public function storeBytes(string $bytes, string $folder, ?string $sourcePath = null): string
    {
        $path = trim($folder, '/').'/'.Str::random(24).'.webp';
        Storage::disk('public')->put($path, $this->toWebp($bytes, $sourcePath));

        return $path;
    }

    public function toWebp(string $bytes, ?string $sourcePath = null): string
    {
        $img = @imagecreatefromstring($bytes);
        if (! $img) {
            throw new RuntimeException('This file is not a readable image.');
        }
        $img = $this->orient($img, $sourcePath);

        [$w, $h] = [imagesx($img), imagesy($img)];
        $scale = min(1, self::MAX_SIDE / max($w, $h));
        if ($scale < 1) {
            [$nw, $nh] = [max(1, (int) round($w * $scale)), max(1, (int) round($h * $scale))];
            $resized = imagecreatetruecolor($nw, $nh);
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            imagecopyresampled($resized, $img, 0, 0, 0, 0, $nw, $nh, $w, $h);
            imagedestroy($img);
            $img = $resized;
        } elseif (! imageistruecolor($img)) {
            imagepalettetotruecolor($img);
        }
        imagesavealpha($img, true);

        ob_start();
        imagewebp($img, null, self::QUALITY);
        imagedestroy($img);

        return (string) ob_get_clean();
    }

    /** Phone photos are often stored sideways with an EXIF "rotate me" flag — apply it. */
    private function orient(\GdImage $img, ?string $sourcePath): \GdImage
    {
        if (! $sourcePath || ! function_exists('exif_read_data')) {
            return $img;
        }
        $exif = @exif_read_data($sourcePath);
        $angle = [3 => 180, 6 => -90, 8 => 90][$exif['Orientation'] ?? 1] ?? 0;
        if ($angle) {
            $rotated = imagerotate($img, $angle, 0);
            if ($rotated) {
                imagedestroy($img);

                return $rotated;
            }
        }

        return $img;
    }
}
