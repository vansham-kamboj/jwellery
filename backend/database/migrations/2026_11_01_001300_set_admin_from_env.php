<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Creates the admin account — or sets its password — from ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_NAME in the backend's .env.
     * The live server has no command line, so this runs from Admin → Settings → Run database updates (or on the sign-in page's
     * first update): put the two lines in .env, run the update, sign in, then delete ADMIN_PASSWORD from .env.
     * With either value empty, it does nothing. To set another password later, add a new migration like this one.
     */
    public function up(): void
    {
        $admin = config('store.admin');
        if (! $admin['email'] || ! $admin['password']) {
            return;
        }

        User::updateOrCreate(
            ['email' => strtolower(trim($admin['email']))],
            ['name' => $admin['name'] ?: 'Admin', 'password' => Hash::make($admin['password'])]
        );
    }

    public function down(): void
    {
        // Accounts are not removed automatically.
    }
};
