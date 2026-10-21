<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => strtolower(trim($validated['email'])),
            'password' => Hash::make($validated['password']),
            'onboarding_completed' => false,
            'has_seen_tutorial' => false,
        ]);

        Auth::login($user);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        // Also issue personal access token for SPA fallback flexibility
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Maligayang pagdating sa TipidTayo!',
            'user' => $user->load('activeCycle'),
            'token' => $token,
        ], 201);
    }

    /**
     * Log in existing user with rate limiting (5 attempts/min)
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $throttleKey = 'login:' . strtolower($credentials['email']) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            throw ValidationException::withMessages([
                'email' => ["Masyadong maraming login attempts. Maghintay muna ng {$seconds} segundo."],
            ]);
        }

        $remember = $request->boolean('remember', true);

        if (!Auth::attempt(['email' => strtolower($credentials['email']), 'password' => $credentials['password']], $remember)) {
            RateLimiter::hit($throttleKey, 60);
            throw ValidationException::withMessages([
                'email' => ['Maling email o password. Pakisuri ulit ang iyong detalye.'],
            ]);
        }

        RateLimiter::clear($throttleKey);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        $user = Auth::user();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Naka-login ka na!',
            'user' => $user->load('activeCycle'),
            'token' => $token,
        ]);
    }

    /**
     * Log out
     */
    public function logout(Request $request)
    {
        if ($request->user()) {
            $request->user()->tokens()->delete();
        }

        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Matagumpay na naka-logout. Ingat sa pag-tipid!']);
    }

    /**
     * Get authenticated user profile & state
     */
    public function user(Request $request)
    {
        $user = $request->user()->load('activeCycle');
        return response()->json([
            'user' => $user,
            'has_active_cycle' => (bool)$user->activeCycle,
            'onboarding_completed' => (bool)$user->onboarding_completed,
            'has_seen_tutorial' => (bool)$user->has_seen_tutorial,
        ]);
    }
}
