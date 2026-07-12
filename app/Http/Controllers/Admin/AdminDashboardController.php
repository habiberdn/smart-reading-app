<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Classroom;
use App\Models\ReadingAssignment;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function index(): Response
    {
        $totalDosen = User::where('role', 'dosen')->count();
        $totalMahasiswa = User::where('role', 'mahasiswa')->count();
        $totalClassrooms = Classroom::count();
        $totalAssignments = ReadingAssignment::count();

        return Inertia::render('admin/dashboard', [
            'totalDosen' => $totalDosen,
            'totalMahasiswa' => $totalMahasiswa,
            'totalClassrooms' => $totalClassrooms,
            'totalAssignments' => $totalAssignments,
        ]);
    }
}
