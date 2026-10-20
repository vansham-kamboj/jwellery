<?php

namespace App\Providers;

use App\Services\CartPricer;
use App\Support\Settings;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->scoped(CartPricer::class);
    }

    public function boot(): void
    {
        RateLimiter::for('api-read', fn (Request $r) => Limit::perMinute(120)->by($r->ip()));
        RateLimiter::for('api-write', fn (Request $r) => [Limit::perMinute(6)->by($r->ip()), Limit::perDay(60)->by($r->ip())]);
        RateLimiter::for('admin-login', fn (Request $r) => Limit::perMinute(5)->by(strtolower((string) $r->input('email')).'|'.$r->ip()));

        Paginator::defaultView('admin.partials.pagination');
        View::composer('admin.*', fn ($view) => $view->with('storeName', Settings::get('store_name')));
    }
}
