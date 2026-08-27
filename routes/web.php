<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminDosenController;
use App\Http\Controllers\Admin\InvitationController;
use App\Http\Controllers\AuthenticatedSessionController;
use App\Http\Controllers\ClassroomController;
use App\Http\Controllers\DosenController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\MahasiswaController;
use App\Http\Controllers\ReadingAssignmentController;
use App\Http\Controllers\ReadingController;
use App\Http\Controllers\Superadmin\SuperadminAdminController;
use App\Http\Controllers\Superadmin\SuperadminDashboardController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['guest'])->group(function () {
    // 1. Menampilkan Halaman Login (Inertia)
    Route::get('/login', function () {
        return Inertia::render('auth/login', [
            'status' => session('status'),
        ]);
    })->name('login');
});

// Halaman Publik (Privacy Policy & Terms of Service untuk Google OAuth)
Route::get('/privacy-policy', function () {
    return Inertia::render('privacy-policy');
})->name('privacy.policy');

Route::get('/terms-of-service', function () {
    return Inertia::render('terms-of-service');
})->name('terms.of.service');

Route::middleware(['auth'])->group(function () {
    Route::get('/read/{assignment_id}', [ReadingController::class, 'show'])->name('reading.workspace');
    Route::get('/read/{assignment_id}/file', [ReadingController::class, 'streamFile'])->name('reading.file');
    Route::inertia('/dashboard', 'app')->name('dashboard');
    Route::get('/assignments', [MahasiswaController::class, 'assignmentsList'])->name('assignments');
    Route::get('/explore', [MahasiswaController::class, 'exploreList'])->name('explore');
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
});

// DOSEN
Route::middleware(['auth', 'role:dosen'])->prefix('dosen')->name('dosen.')->group(function () {
    Route::get('/dashboard', [DosenController::class, 'index'])->name('dashboard');

    Route::get('/classrooms/{kode}', [ClassroomController::class, 'show'])->name('classDetails');
    Route::get('/classrooms', [ClassroomController::class, 'index'])->name('classrooms');
    Route::post('/classrooms', [ClassroomController::class, 'store'])->name('classrooms.store');
    Route::put('/classrooms/{kode}', [ClassroomController::class, 'update'])->name('classrooms.update');
    Route::delete('/classrooms/{kode}', [ClassroomController::class, 'destroy'])->name('classrooms.destroy');
    Route::post('/classrooms/{kode}/assignments', [ReadingAssignmentController::class, 'store'])->name('classrooms.assignments.store');
    Route::delete('/assignments/{id}', [ReadingAssignmentController::class, 'destroy'])->name('assignments.destroy');
});

// MAHASISWA
Route::middleware(['auth', 'role:mahasiswa'])->prefix('mahasiswa')->name('mahasiswa.')->group(function () {
    Route::get('/dashboard', [MahasiswaController::class, 'dashboard'])->name('dashboard');
    Route::post('/classrooms/join', [MahasiswaController::class, 'joinClass'])->name('classrooms.join');
    Route::post('/read/{assignment_id}/progress', [MahasiswaController::class, 'saveProgress'])->name('read.progress');
    Route::post('/read/{assignment_id}/finish', [MahasiswaController::class, 'finishReading'])->name('read.finish');
    Route::get('/classrooms', [MahasiswaController::class, 'classroomsList'])->name('classrooms');
    Route::get('/classrooms/{kode}', [ClassroomController::class, 'show'])->name('classrooms.show');
});

Route::get('/', function () {
    if (Auth::check()) {
        $user = Auth::user();

        return match ($user->role) {
            'superadmin' => redirect()->route('superadmin.dashboard'),
            'admin' => redirect()->route('admin.dashboard'),
            'dosen' => redirect()->route('dosen.dashboard'),
            'mahasiswa' => redirect()->route('mahasiswa.dashboard'),
            default => redirect()->route('login'),
        };
    }

    return redirect()->route('login');
});

// ADMIN
Route::middleware(['auth', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
    Route::get('/dosen', [AdminDosenController::class, 'index'])->name('dosen.index');
    Route::post('/dosen', [AdminDosenController::class, 'store'])->name('dosen.store');
    Route::put('/dosen/{user}', [AdminDosenController::class, 'update'])->name('dosen.update');
    Route::delete('/dosen/{user}', [AdminDosenController::class, 'destroy'])->name('dosen.destroy');
    Route::post('/invitation/generate', [InvitationController::class, 'generateLink'])->name('invitation.generate');
});

// SUPERADMIN
Route::middleware(['auth', 'role:superadmin'])->prefix('superadmin')->name('superadmin.')->group(function () {
    Route::get('/dashboard', [SuperadminDashboardController::class, 'index'])->name('dashboard');
    Route::get('/admin', [SuperadminAdminController::class, 'index'])->name('admin.index');
    Route::post('/admin', [SuperadminAdminController::class, 'store'])->name('admin.store');
    Route::put('/admin/{user}', [SuperadminAdminController::class, 'update'])->name('admin.update');
    Route::delete('/admin/{user}', [SuperadminAdminController::class, 'destroy'])->name('admin.destroy');
});

// INVITATION & GOOGLE OAUTH (Public routes)
Route::get('/invitation/accept', [GoogleAuthController::class, 'accept'])
    ->name('invitation.accept')
    ->middleware('signed');

Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])
    ->name('auth.google.redirect')
    ->middleware('guest');

Route::get('/api/auth/callback/google', [GoogleAuthController::class, 'callback'])
    ->name('auth.google.callback');

require __DIR__.'/settings.php';
