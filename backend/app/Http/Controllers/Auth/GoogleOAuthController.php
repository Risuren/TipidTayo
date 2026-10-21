<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleOAuthController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    public function callback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();

            $user = User::where('google_id', $googleUser->getId())
                ->orWhere('email', strtolower($googleUser->getEmail()))
                ->first();

            if (!$user) {
                $user = User::create([
                    'name' => $googleUser->getName() ?: 'Student User',
                    'email' => strtolower($googleUser->getEmail()),
                    'google_id' => $googleUser->getId(),
                    'avatar_url' => $googleUser->getAvatar(),
                    'email_verified_at' => now(),
                    'onboarding_completed' => false,
                    'has_seen_tutorial' => false,
                ]);
            } else {
                if (empty($user->google_id)) {
                    $user->update([
                        'google_id' => $googleUser->getId(),
                        'avatar_url' => $googleUser->getAvatar() ?: $user->avatar_url,
                        'email_verified_at' => $user->email_verified_at ?: now(),
                    ]);
                }
            }

            Auth::login($user);
            $token = $user->createToken('google_auth_token')->plainTextToken;
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

            return redirect("{$frontendUrl}/auth/callback?token={$token}&onboarded=" . ($user->onboarding_completed ? '1' : '0'));
        } catch (\Exception $e) {
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            return redirect("{$frontendUrl}/login?error=" . urlencode('Hindi natuloy ang Google sign in.'));
        }
    }
}
