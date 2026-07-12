<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminDosenController extends Controller
{
    public function index(): Response
    {
        $dosenList = User::where('role', 'dosen')
            ->withCount('classroomsAsDosen')
            ->latest()
            ->get();

        return Inertia::render('admin/dosen/index', [
            'dosenList' => $dosenList,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username',
            'password' => 'required|string|min:8',
            'nidn' => 'nullable|string|max:255|unique:users,nidn',
            'program_studi' => 'nullable|string|max:255',
        ]);

        User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'password' => bcrypt($validated['password']),
            'role' => 'dosen',
            'nidn' => $validated['nidn'] ?? null,
            'program_studi' => $validated['program_studi'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Dosen berhasil ditambahkan.');
    }

    public function update(Request $request, User $user)
    {
        if ($user->role !== 'dosen') {
            abort(403, 'Action unauthorized.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username,' . $user->id,
            'password' => 'nullable|string|min:8',
            'nidn' => 'nullable|string|max:255|unique:users,nidn,' . $user->id,
            'program_studi' => 'nullable|string|max:255',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'username' => $validated['username'],
            'nidn' => $validated['nidn'] ?? null,
            'program_studi' => $validated['program_studi'] ?? null,
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = bcrypt($validated['password']);
        }

        $user->update($updateData);

        return redirect()->back()->with('success', 'Data dosen berhasil diperbarui.');
    }

    public function destroy(User $user)
    {
        if ($user->role !== 'dosen') {
            abort(403, 'Action unauthorized.');
        }

        $user->delete();

        return redirect()->back()->with('success', 'Dosen berhasil dihapus.');
    }
}
