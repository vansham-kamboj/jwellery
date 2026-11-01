<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

/**
 * Creates the admin account — or sets its password — from ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_NAME in .env.
 *   php artisan store:set-admin
 * Safe to run again whenever the password needs resetting. With either value empty it changes nothing.
 * Afterwards delete ADMIN_PASSWORD from .env.
 */
class SetAdmin extends Command
{
    protected $signature = 'store:set-admin';

    protected $description = 'Create the admin account, or set its password, from ADMIN_EMAIL / ADMIN_PASSWORD in .env';

    public function handle(): int
    {
        $admin = config('store.admin');
        if (! $admin['email'] || ! $admin['password']) {
            $this->warn('ADMIN_EMAIL and ADMIN_PASSWORD are not both set in .env — nothing changed.');

            return self::FAILURE;
        }

        $user = User::updateOrCreate(
            ['email' => strtolower(trim($admin['email']))],
            ['name' => $admin['name'] ?: 'Admin', 'password' => Hash::make($admin['password'])]
        );
        $this->info(($user->wasRecentlyCreated ? 'Admin created: ' : 'Admin password set: ').$user->email.' — now delete ADMIN_PASSWORD from .env.');

        return self::SUCCESS;
    }
}
