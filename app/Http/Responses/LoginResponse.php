<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Fortify;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        $user = $request->user();

        $redirectTo = match ($user->role) {
            'superadmin' => '/superadmin/dashboard',
            'admin' => '/admin/dashboard',
            'dosen' => '/dosen/dashboard',
            'mahasiswa' => '/mahasiswa/dashboard',
            default => Fortify::redirects('login', '/dashboard'),
        };

        return $request->wantsJson()
            ? new JsonResponse(['two_factor' => false])
            : redirect()->intended($redirectTo);
    }
}
