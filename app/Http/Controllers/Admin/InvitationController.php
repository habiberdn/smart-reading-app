<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

class InvitationController extends Controller
{
    /**
     * Generate a temporary signed invitation URL for dosen registration.
     * The link is valid for 24 hours and contains the admin's campus.
     */
    public function generateLink(Request $request)
    {
        $admin = $request->user();

        $url = URL::temporarySignedRoute(
            'invitation.accept',
            now()->addHours(24),
            ['kampus' => $admin->kampus]
        );

        return back()->with('invitationUrl', $url);
    }
}
