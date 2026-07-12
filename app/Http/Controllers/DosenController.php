<?php

namespace App\Http\Controllers;


use App\Http\Controllers\Controller;

class DosenController extends Controller
{
    public function index()
    {
        $classrooms = \App\Models\Classroom::where('dosen_id', auth()->id())
            ->withCount(['mahasiswa', 'readingAssignments'])
            ->latest()
            ->take(4)
            ->get();

        $classroomIds = \App\Models\Classroom::where('dosen_id', auth()->id())->pluck('id');
        $classroomsCount = $classroomIds->count();

        $totalStudents = \Illuminate\Support\Facades\DB::table('classroom_students')
            ->whereIn('classroom_id', $classroomIds)
            ->distinct('mahasiswa_id')
            ->count('mahasiswa_id');

        $assignmentIds = \App\Models\ReadingAssignment::whereIn('classroom_id', $classroomIds)->pluck('id');
        $totalAssignments = $assignmentIds->count();


        $avgCompletionRate = '0%';
        if ($assignmentIds->count() > 0) {
            $avgProgress = \App\Models\ReadingProgress::whereIn('assignment_id', $assignmentIds)->avg('persentase') ?? 0;
            $avgCompletionRate = round($avgProgress) . '%';
        }

        $assignments = \App\Models\ReadingAssignment::where('dosen_id', auth()->id())
            ->with(['classroom'])
            ->latest()
            ->get()
            ->map(function ($assignment) {
                $totalClassroomStudents = $assignment->classroom ? $assignment->classroom->mahasiswa()->count() : 0;
                
                $completedCount = $assignment->readingProgresses()->where('status', 'completed')->count();
                $sumPercentage = $assignment->readingProgresses()->sum('persentase');
                
                $completionRate = $totalClassroomStudents > 0 
                    ? round(($completedCount / $totalClassroomStudents) * 100, 1) 
                    : 0;
                    
                $averageProgress = $totalClassroomStudents > 0 
                    ? round($sumPercentage / $totalClassroomStudents, 1) 
                    : 0;
                
                return [
                    'id' => $assignment->id,
                    'title' => $assignment->judul,
                    'dueDate' => $assignment->deadline ? $assignment->deadline->format('d/m/Y') : 'Tanpa Batas',
                    'completionRate' => $completionRate,
                    'averageProgress' => $averageProgress,
                    'classroomKode' => $assignment->classroom ? $assignment->classroom->kode_kelas : null,
                ];
            });

        return inertia('dosen/dashboard', [
            'name' => auth()->user()->name,
            'classrooms' => $classrooms,
            'totalStudents' => $totalStudents,
            'totalAssignments' => $totalAssignments,
            'classroomsCount' => $classroomsCount,
            'avgCompletionRate' => $avgCompletionRate,
            'assignments' => $assignments,
        ]);
    }
}
