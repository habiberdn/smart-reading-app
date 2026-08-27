<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    /**
     * Accept the signed invitation URL.
     * Validates the signature (via 'signed' middleware), stores kampus in session,
     * then renders the invitation landing page.
     */
    public function accept(Request $request)
    {
        $kampus = $request->query('kampus');

        // Store invitation data in session for use after Google callback
        $request->session()->put('invitation_kampus', $kampus);

        return Inertia::render('auth/invitation-accept', [
            'kampus' => $kampus,
        ]);
    }

    /**
     * Redirect to Google OAuth consent screen.
     */
    public function redirect()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    /**
     * Handle the Google OAuth callback.
     * - If user already exists (by google_id) → login directly.
     * - If invitation_kampus in session → create as dosen with that kampus.
     * - Otherwise → create as mahasiswa (default role).
     */
    public function callback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Google OAuth Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return redirect()->route('login')->with('status', 'Gagal login dengan Google: ' . $e->getMessage());
        }

        $kampus = $request->session()->pull('invitation_kampus');

        // 1. Check if user already exists with this google_id
        $existingUser = User::where('google_id', $googleUser->getId())->first();

        if ($existingUser) {
            if ($existingUser->role === 'mahasiswa') {
                return redirect()->route('login')->with('status', 'Login ke google hanya untuk dosen yang terdaftar');
            }

            Auth::login($existingUser, true);

            return redirect()->intended($this->getRedirectPath($existingUser));
        }

        // 2. Check if email is already taken by a non-Google user → link accounts
        $emailUser = User::where('email', $googleUser->getEmail())->first();

        if ($emailUser) {
            if ($emailUser->role === 'mahasiswa') {
                return redirect()->route('login')->with('status', 'Login ke google hanya untuk dosen yang terdaftar');
            }

            $emailUser->update([
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
            ]);

            Auth::login($emailUser, true);

            return redirect()->intended($this->getRedirectPath($emailUser));
        }

        // 3. Create new user — role depends on whether there's an invitation
        if ($kampus) {
            // Came from invitation link → create as dosen
            $user = User::create([
                'name' => $googleUser->getName(),
                'username' => $this->generateUniqueUsername($googleUser->getEmail(), $kampus),
                'email' => $googleUser->getEmail(),
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
                'role' => 'dosen',
                'kampus' => $kampus,
                'password' => null,
            ]);

            Auth::login($user, true);

            return redirect()->route($this->getRedirectRoute($user));
        } else {
            // No invitation → reject, mahasiswa should not be able to use Google Login
            return redirect()->route('login')->with('status', 'Login ke google hanya untuk dosen yang terdaftar');
        }
    }

    /**
     * Generate a unique username from email and optional campus prefix.
     * Dosen format: KAMPUS_emailprefix (e.g., UPI_johndoe)
     * Mahasiswa format: emailprefix (e.g., johndoe)
     */
    private function generateUniqueUsername(string $email, ?string $kampus = null): string
    {
        $emailPrefix = explode('@', $email)[0];

        $baseUsername = $kampus
            ? strtoupper($kampus).'_'.$emailPrefix
            : $emailPrefix;

        $username = $baseUsername;
        $counter = 1;

        while (User::where('username', $username)->exists()) {
            $username = $baseUsername.'_'.$counter;
            $counter++;
        }

        return $username;
    }

    /**
     * Get the redirect path based on user role.
     */
    private function getRedirectPath(User $user): string
    {
        return match ($user->role) {
            'superadmin' => '/superadmin/dashboard',
            'admin' => '/admin/dashboard',
            'dosen' => '/dosen/dashboard',
            'mahasiswa' => '/mahasiswa/dashboard',
            default => '/dashboard',
        };
    }

    /**
     * Get the redirect route name based on user role.
     */
    private function getRedirectRoute(User $user): string
    {
        return match ($user->role) {
            'superadmin' => 'superadmin.dashboard',
            'admin' => 'admin.dashboard',
            'dosen' => 'dosen.dashboard',
            'mahasiswa' => 'mahasiswa.dashboard',
            default => 'dashboard',
        };
    }
}
