<?php

use App\Http\Controllers\AuthenticatedSessionController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;

Route::middleware(['auth'])->group(function () {
    Route::inertia('/dashboard', 'app')->name('dashboard');
});

Route::middleware(['auth'])->prefix('dosen')->name('dosen.')->group(function () {
    Route::inertia('/dashboard', 'dosen/dashboard')->name('dashboard');
    Route::inertia('/classrooms', 'dosen/classrooms')->name('classrooms');
    Route::inertia('/assignments', 'dosen/assignments')->name('assignments');
    Route::inertia('/students', 'dosen/students')->name('students');
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
            ->name('logout');
});

Route::middleware(['auth'])->prefix('mahasiswa')->name('mahasiswa.')->group(function () {
    Route::inertia('/dashboard', 'mahasiswa/dashboard')->name('home');
});

Route::get('/', function () {
    if (Auth::check()) {
        $user = Auth::user();
        return match ($user->role) {
            'dosen' => redirect()->route('dosen.dashboard'),
            'mahasiswa' => redirect()->route('mahasiswa.home'),
            default => redirect()->route('dashboard'),
        };
    }
    return redirect()->route('login');
});

require __DIR__.'/settings.php';
