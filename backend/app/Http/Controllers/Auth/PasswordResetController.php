<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    public function sendLink(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);
        $email = strtolower(trim($request->email));

        $user = User::where('email', $email)->first();
        if (!$user) {
            // Keep generic message for security
            return response()->json([
                'message' => 'Kung may account para sa email na ito, nagpadala kami ng recovery instructions.',
            ]);
        }

        $token = Str::random(60);
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            ['token' => Hash::make($token), 'created_at' => now()]
        );

        // For local/demo environment, we also return the token/link in json for seamless testing
        return response()->json([
            'message' => 'Nagawa na ang password reset token.',
            'reset_token' => $token,
            'reset_url' => env('FRONTEND_URL', 'http://localhost:5173') . "/reset-password?token={$token}&email=" . urlencode($email),
        ]);
    }

    public function reset(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $email = strtolower(trim($request->email));
        $record = DB::table('password_reset_tokens')->where('email', $email)->first();

        if (!$record || !Hash::check($request->token, $record->token)) {
            return response()->json(['error' => 'Invalid or expired password reset token.'], 422);
        }

        $user = User::where('email', $email)->first();
        if ($user) {
            $user->update(['password' => Hash::make($request->password)]);
            DB::table('password_reset_tokens')->where('email', $email)->delete();
        }

        return response()->json(['message' => 'Matagumpay na napalitan ang iyong password! Maaari ka nang mag-login.']);
    }
}
