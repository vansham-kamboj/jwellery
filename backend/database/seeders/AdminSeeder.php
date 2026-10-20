<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/** Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD in .env (never overwrites an existing password). */
class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $admin = config('store.admin');
        if (! $admin['email'] || ! $admin['password']) {
            $this->command?->warn('ADMIN_EMAIL / ADMIN_PASSWORD not set in .env — no admin account created.');

            return;
        }

        $user = User::firstOrNew(['email' => $admin['email']]);
        if ($user->exists) {
            $this->command?->info("Admin {$admin['email']} already exists — password left unchanged.");

            return;
        }
        $user->fill(['name' => $admin['name'], 'password' => Hash::make($admin['password'])])->save();
        $this->command?->info("Admin {$admin['email']} created. Remove ADMIN_PASSWORD from .env after first sign-in.");
    }
}
