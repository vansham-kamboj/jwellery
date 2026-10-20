<?php

use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\FormController;
use App\Http\Controllers\Api\OrderController;
use Illuminate\Support\Facades\Route;

/*
 | Public storefront API (/api/...). No login: any frontend design can use it.
 | Reads are open; every write is validated and rate-limited.
 */

Route::middleware('throttle:api-read')->group(function () {
    Route::get('site', [CatalogController::class, 'site']);
    Route::get('products', [CatalogController::class, 'index']);
    Route::get('products/{slug}', [CatalogController::class, 'show']);
    Route::post('cart/quote', [OrderController::class, 'quote']);
    Route::get('bookings/slots', [FormController::class, 'slots']);
});

Route::middleware('throttle:api-write')->group(function () {
    Route::post('orders', [OrderController::class, 'store']);
    Route::post('custom-requests', [FormController::class, 'customRequest']);
    Route::post('bookings', [FormController::class, 'book']);
    Route::post('subscribe', [FormController::class, 'subscribe']);
});
