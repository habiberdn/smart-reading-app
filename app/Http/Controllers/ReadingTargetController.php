<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReadingTargetController extends Controller
{
    /**
     * Ambil target membaca saat ini.
     */
    public function show(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        return response()->json([
            'daily_target_minutes'    => (int) $user->daily_target_minutes,
            'weekly_target_minutes'   => (int) $user->weekly_target_minutes,
            'target_type'             => $user->target_type ?? 'daily',
            'today_reading_minutes'   => $user->today_reading_minutes,
            'week_reading_minutes'    => $user->week_reading_minutes,
            'daily_percent'           => $user->daily_achievement_percent,
            'weekly_percent'          => $user->weekly_achievement_percent,
        ]);
    }

    /**
     * Simpan / perbarui target membaca mahasiswa.
     */
    public function update(Request $request): RedirectResponse
    {
        $rules = [
            'target_type'           => 'required|in:daily,weekly,both',
            'daily_target_minutes'  => 'required|integer|min:0|max:1440',
            'weekly_target_minutes' => 'required|integer|min:0|max:10080',
        ];

        if (in_array($request->target_type, ['daily', 'both'])) {
            $rules['daily_target_minutes'] = 'required|integer|min:1|max:1440';
        }

        if (in_array($request->target_type, ['weekly', 'both'])) {
            $rules['weekly_target_minutes'] = 'required|integer|min:1|max:10080';
        }

        $validated = $request->validate($rules);

        /** @var \App\Models\User $user */
        $user = Auth::user();
        $user->update($validated);

        return back()->with('success', 'Target membaca berhasil diperbarui!');
    }
}
