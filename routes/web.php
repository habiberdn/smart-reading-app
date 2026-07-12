<?php

use App\Http\Controllers\AuthenticatedSessionController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\ClassroomController;
use App\Http\Controllers\ReadingAssignmentController;
use App\Http\Controllers\MahasiswaController;
use App\Http\Controllers\ReadingController;
use App\Http\Controllers\DosenController;
use Inertia\Inertia;

Route::middleware(['guest'])->group(function () {
    // 1. Menampilkan Halaman Login (Inertia)
    Route::get('/login', function () {
        return Inertia::render('auth/login');
    })->name('login');
});

Route::middleware(['auth'])->group(function () {
    Route::get('/read/{assignment_id}', [ReadingController::class, 'show'])->name('reading.workspace');
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
    Route::get('/dashboard', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'index'])->name('dashboard');
    Route::get('/dosen', [\App\Http\Controllers\Admin\AdminDosenController::class, 'index'])->name('dosen.index');
    Route::post('/dosen', [\App\Http\Controllers\Admin\AdminDosenController::class, 'store'])->name('dosen.store');
    Route::put('/dosen/{user}', [\App\Http\Controllers\Admin\AdminDosenController::class, 'update'])->name('dosen.update');
    Route::delete('/dosen/{user}', [\App\Http\Controllers\Admin\AdminDosenController::class, 'destroy'])->name('dosen.destroy');
});

require __DIR__ . '/settings.php';
