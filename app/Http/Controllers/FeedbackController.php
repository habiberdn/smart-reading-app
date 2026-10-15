<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FeedbackController extends Controller
{
    /**
     * Tandai notifikasi / reminder tertentu sebagai telah dibaca.
     */
    public function markRead(Feedback $feedback): JsonResponse
    {
        if ($feedback->mahasiswa_id !== Auth::id()) {
            abort(403, 'Akses tidak diizinkan.');
        }

        $feedback->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi ditandai telah dibaca.',
        ]);
    }

    /**
     * Tandai semua reminder milik mahasiswa saat ini sebagai telah dibaca.
     */
    public function markAllRead(): JsonResponse
    {
        Feedback::where('mahasiswa_id', Auth::id())
            ->unread()
            ->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Semua notifikasi ditandai telah dibaca.',
        ]);
    }
}
