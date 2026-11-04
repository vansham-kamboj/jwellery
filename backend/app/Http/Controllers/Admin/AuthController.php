<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function form()
    {
        return view('admin.login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate(['email' => 'required|email', 'password' => 'required|string']);
        $credentials['email'] = strtolower(trim($credentials['email']));
        $this->syncAdminFromEnv($credentials);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages(['email' => 'That email and password do not match.']);
        }
        $request->session()->regenerate();

        return redirect()->intended(route('admin.dashboard'));
    }

    /**
     * ADMIN_EMAIL and ADMIN_PASSWORD in .env always work: when both are set and the sign-in matches them,
     * the admin account is created or its password updated before signing in. Without this, changing
     * .env did nothing, because the account lives in the database. Leave ADMIN_PASSWORD empty to turn it off.
     */
    private function syncAdminFromEnv(array $credentials): void
    {
        $admin = config('store.admin');
        $email = strtolower(trim((string) $admin['email']));
        $password = (string) $admin['password'];
        if ($email === '' || $password === '' || ! hash_equals($email, $credentials['email']) || ! hash_equals($password, $credentials['password'])) {
            return;
        }
        $user = User::firstOrNew(['email' => $email]);
        if (! $user->exists || ! Hash::check($password, $user->password)) {
            $user->name = $user->name ?: ($admin['name'] ?: 'Admin');
            $user->password = Hash::make($password);
            $user->save();
        }
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login');
    }
}
