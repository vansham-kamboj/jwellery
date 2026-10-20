<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\CatalogController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\InboxController;
use App\Http\Controllers\Admin\OfferController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\ReviewController;
use App\Http\Controllers\Admin\SettingsController;
use Illuminate\Support\Facades\Route;

/* Admin panel — mounted at /{ADMIN_PATH} (see bootstrap/app.php). */

Route::middleware('guest')->group(function () {
    Route::get('login', [AuthController::class, 'form'])->name('login');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:admin-login')->name('login.attempt');
});

Route::middleware('auth')->group(function () {
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/', DashboardController::class)->name('dashboard');

    Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::patch('orders/{order}', [OrderController::class, 'update'])->name('orders.update');

    Route::resource('products', ProductController::class)->except('show');
    Route::post('products/{product}/duplicate', [ProductController::class, 'duplicate'])->name('products.duplicate');

    Route::get('categories', [CatalogController::class, 'categories'])->name('categories.index');
    Route::post('categories', [CatalogController::class, 'saveCategory'])->name('categories.store');
    Route::patch('categories/{category}', [CatalogController::class, 'saveCategory'])->name('categories.update');
    Route::delete('categories/{category}', [CatalogController::class, 'deleteCategory'])->name('categories.destroy');
    Route::get('finishes', [CatalogController::class, 'finishes'])->name('finishes.index');
    Route::post('finishes', [CatalogController::class, 'saveFinish'])->name('finishes.store');
    Route::patch('finishes/{finish}', [CatalogController::class, 'saveFinish'])->name('finishes.update');
    Route::delete('finishes/{finish}', [CatalogController::class, 'deleteFinish'])->name('finishes.destroy');

    Route::resource('offers', OfferController::class)->except('show');
    Route::resource('reviews', ReviewController::class)->except('show');

    Route::get('requests', [InboxController::class, 'requests'])->name('requests.index');
    Route::patch('requests/{customRequest}', [InboxController::class, 'updateRequest'])->name('requests.update');
    Route::get('bookings', [InboxController::class, 'bookings'])->name('bookings.index');
    Route::patch('bookings/{booking}', [InboxController::class, 'updateBooking'])->name('bookings.update');
    Route::get('subscribers', [InboxController::class, 'subscribers'])->name('subscribers.index');
    Route::get('subscribers/export', [InboxController::class, 'exportSubscribers'])->name('subscribers.export');
    Route::delete('subscribers/{subscriber}', [InboxController::class, 'deleteSubscriber'])->name('subscribers.destroy');

    Route::get('settings', [SettingsController::class, 'edit'])->name('settings.edit');
    Route::put('settings', [SettingsController::class, 'update'])->name('settings.update');
    Route::put('account', [SettingsController::class, 'password'])->name('account.password');
});
