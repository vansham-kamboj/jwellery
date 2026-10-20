<?php

use Illuminate\Support\Facades\Route;

// The backend has no public pages of its own: storefronts use /api, staff use the admin panel.
Route::get('/', fn () => response()->json(['name' => config('app.name'), 'api' => url('/api/site')]));
