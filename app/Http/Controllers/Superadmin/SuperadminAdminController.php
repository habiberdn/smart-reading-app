<?php

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SuperadminAdminController extends Controller
{
    public function index(): Response
    {
        $adminList = User::where('role', 'admin')
            ->latest()
            ->get();

        return Inertia::render('superadmin/admin/index', [
            'adminList' => $adminList,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username',
            'password' => 'required|string|min:8',
            'kampus' => 'required|string|max:255',
        ]);

        User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'password' => bcrypt($validated['password']),
            'role' => 'admin',
            'kampus' => $validated['kampus'],
        ]);

        return redirect()->back()->with('success', 'Admin Kampus berhasil ditambahkan.');
    }

    public function update(Request $request, User $user)
    {
        if ($user->role !== 'admin') {
            abort(403, 'Action unauthorized.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username,' . $user->id,
            'password' => 'nullable|string|min:8',
            'kampus' => 'required|string|max:255',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'username' => $validated['username'],
            'kampus' => $validated['kampus'],
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = bcrypt($validated['password']);
        }

        $user->update($updateData);

        return redirect()->back()->with('success', 'Data Admin Kampus berhasil diperbarui.');
    }

    public function destroy(User $user)
    {
        if ($user->role !== 'admin') {
            abort(403, 'Action unauthorized.');
        }

        $user->delete();

        return redirect()->back()->with('success', 'Admin Kampus berhasil dihapus.');
    }
}
