<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\ReadingAssignment;
use App\Models\ReadingProgress;
use App\Models\ReadingDailyLog;
use App\Models\ReadingSession;
use App\Services\RecommendationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MahasiswaController extends Controller
{
    public function dashboard(RecommendationService $recommendationService)
    {
        $user = Auth::user();

        // 1. Get classrooms joined by the student
        $classrooms = $user->classrooms()->with(['dosen'])->get();
        $classroomIds = $classrooms->pluck('id');

        // 2. Fetch assignments inside those classrooms
        $assignments = ReadingAssignment::whereIn('classroom_id', $classroomIds)
            ->published()
            ->with(['classroom.dosen'])
            ->latest()
            ->get()
            ->map(function ($assignment) {
                $assignment->is_classroom_member = true;
                return $assignment;
            });

        // 3. Compute student statistics according to READFLOW.txt
        $totalSeconds = ReadingProgress::where('mahasiswa_id', $user->id)->sum('total_durasi_detik');
        $totalReadingTimeStr = round($totalSeconds / 3600, 1) . ' jam';

        $completedProgresses = ReadingProgress::where('mahasiswa_id', $user->id)
            ->where('status', 'completed')
            ->with('assignment')
            ->get();

        $booksCount = 0;
        $articlesCount = 0;
        $papersCount = 0;

        foreach ($completedProgresses as $cp) {
            $halaman = $cp->assignment->total_halaman ?? 0;
            if ($halaman > 15) {
                $booksCount++;
            } elseif ($halaman > 5) {
                $articlesCount++;
            } else {
                $papersCount++;
            }
        }

        // Average difficulty calculated from difficulty_score of all read assignments
        $avgDiff = ReadingProgress::where('mahasiswa_id', $user->id)
            ->join('reading_assignments', 'reading_progresses.assignment_id', '=', 'reading_assignments.id')
            ->avg('reading_assignments.difficulty_score') ?? 0;

        $recommendations = $recommendationService->recommendFor($user);

        return inertia('mahasiswa/dashboard', [
            'name'              => $user->name,
            'classrooms'        => $classrooms,
            'assignments'       => \App\Http\Resources\ReadingAssignmentResource::collection($assignments)->resolve(),
            'totalReadingTime'  => $totalReadingTimeStr,
            'booksCount'        => $booksCount,
            'articlesCount'     => $articlesCount,
            'papersCount'       => $papersCount,
            'avgDifficulty'     => round($avgDiff),
            'recommendations'   => $recommendations,
        ]);
    }

    public function classroomsList()
    {
        $user = Auth::user();
        $classrooms = $user->classrooms()
            ->with(['dosen'])
            ->withCount(['mahasiswa', 'readingAssignments'])
            ->latest()
            ->get();

        return inertia('mahasiswa/classroom/index', [
            'classrooms' => $classrooms
        ]);
    }

    public function joinClass(Request $request)
    {
        $request->validate([
            'kode_kelas' => 'required|string|max:20',
        ]);

        $classroom = Classroom::where('kode_kelas', $request->kode_kelas)->first();

        if (!$classroom) {
            return redirect()->back()->withErrors(['kode_kelas' => 'Kelas tidak ditemukan.']);
        }

        // Check if student already joined
        $exists = $classroom->mahasiswa()->where('mahasiswa_id', Auth::id())->exists();
        if ($exists) {
            return redirect()->back()->withErrors(['kode_kelas' => 'Anda sudah terdaftar di kelas ini.']);
        }

        $classroom->mahasiswa()->attach(Auth::id(), ['joined_at' => now()]);

        return redirect()->route('mahasiswa.classrooms.show', $classroom->kode_kelas)
            ->with('message', 'Berhasil bergabung dengan kelas ' . $classroom->name);
    }

    public function saveProgress(Request $request, string $assignment_id)
    {
        $request->validate([
            'seconds'      => 'required|integer',
            'percentage'   => 'required|integer',
            'current_page' => 'sometimes|integer|min:0',
        ]);

        $assignment = ReadingAssignment::findOrFail($assignment_id);

        $joined = $assignment->classroom->mahasiswa()->where('mahasiswa_id', Auth::id())->exists();
        if (!$joined && !$assignment->is_published) {
            abort(403, 'Anda tidak memiliki akses ke assignment ini.');
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($request, $assignment) {
            $progress = ReadingProgress::firstOrCreate([
                'assignment_id' => $assignment->id,
                'mahasiswa_id'  => Auth::id(),
            ], [
                'status'             => 'in_progress',
                'halaman_sekarang'   => 1,
                'persentase'         => 0.00,
                'total_durasi_detik' => 0,
                'first_opened_at'    => now(),
            ]);

            $progress->total_durasi_detik += $request->seconds;
            $progress->persentase = max($progress->persentase, $request->percentage);

            if ($request->has('current_page')) {
                $progress->halaman_sekarang = $request->current_page;
            }

            if ($progress->status === 'not_started') {
                $progress->status = 'in_progress';
                $progress->first_opened_at = $progress->first_opened_at ?? now();
            }

            if ($progress->persentase >= 95 && $progress->status !== 'completed') {
                $progress->status = 'completed';
                $progress->completed_at = now();
            }

            $progress->last_read_at = now();
            $progress->save();

            $session = ReadingSession::firstOrNew([
                'assignment_id' => $assignment->id,
                'mahasiswa_id'  => Auth::id(),
                'ended_at'      => null,
            ], [
                'started_at' => $progress->first_opened_at ?? now(),
            ]);
            $session->durasi_detik = ($session->durasi_detik ?? 0) + $request->seconds;
            $session->halaman_terakhir = $request->current_page ?? $session->halaman_terakhir;
            $session->save();

            $today = now()->format('Y-m-d');
            $log = ReadingDailyLog::firstOrCreate([
                'mahasiswa_id' => Auth::id(),
                'tanggal'      => $today,
            ], [
                'total_durasi_detik' => 0,
            ]);
            $log->total_durasi_detik += $request->seconds;
            $log->save();
        });

        return redirect()->back()->with('success', 'Progress membaca berhasil disimpan!');
    }

    public function finishReading(Request $request, string $assignment_id)
    {
        $request->validate([
            'seconds'      => 'nullable|integer',
            'percentage'   => 'nullable|integer',
            'current_page' => 'nullable|integer',
        ]);

        $assignment = ReadingAssignment::findOrFail($assignment_id);
        $joined = $assignment->classroom->mahasiswa()->where('mahasiswa_id', Auth::id())->exists();
        if (!$joined && !$assignment->is_published) {
            abort(403, 'Anda tidak memiliki akses ke assignment ini.');
        }

        $progress = ReadingProgress::firstOrCreate([
            'assignment_id' => $assignment_id,
            'mahasiswa_id'  => Auth::id(),
        ], [
            'status'             => 'in_progress',
            'halaman_sekarang'   => $request->current_page ?? 1,
            'persentase'         => 0.00,
            'total_durasi_detik' => 0,
            'first_opened_at'    => now(),
        ]);

        \Illuminate\Support\Facades\DB::transaction(function () use ($request, $progress, $assignment_id) {
            $progress->status = 'completed';
            $progress->persentase = 100.00;
            $progress->completed_at = now();
            $progress->halaman_sekarang = $request->current_page ?? $progress->halaman_sekarang;
            
            if ($request->filled('seconds') && $request->seconds > 0) {
                $progress->total_durasi_detik += $request->seconds;
                
                $session = ReadingSession::firstOrNew([
                    'assignment_id' => $assignment_id,
                    'mahasiswa_id'  => Auth::id(),
                    'ended_at'      => null,
                ], [
                    'started_at' => $progress->first_opened_at ?? now(),
                ]);
                $session->durasi_detik = ($session->durasi_detik ?? 0) + $request->seconds;
                if ($request->has('current_page')) {
                    $session->halaman_terakhir = $request->current_page;
                }
                $session->ended_at = now();
                $session->save();

                $today = now()->format('Y-m-d');
                $log = ReadingDailyLog::firstOrCreate([
                    'mahasiswa_id' => Auth::id(),
                    'tanggal'      => $today,
                ], [
                    'total_durasi_detik' => 0,
                ]);
                $log->total_durasi_detik += $request->seconds;
                $log->save();
            } else {
                // Tutup session aktif
                ReadingSession::where('assignment_id', $assignment_id)
                    ->where('mahasiswa_id', Auth::id())
                    ->whereNull('ended_at')
                    ->update(['ended_at' => now()]);
            }

            $progress->save();
        });

        return redirect()->back()->with('success', 'Selesai membaca!');
    }

    public function assignmentsList(Request $request)
    {
        $user = Auth::user();
        $classroomIds = $user->classrooms()->pluck('classrooms.id');
        
        // Fetch only published assignments from classrooms the user has joined
        $assignments = ReadingAssignment::whereIn('classroom_id', $classroomIds)
            ->published()
            ->with(['classroom.dosen'])
            ->latest()
            ->get()
            ->map(function ($assignment) {
                $assignment->is_classroom_member = true;
                return $assignment;
            });

        return inertia('mahasiswa/assignment/index', [
            'assignments' => \App\Http\Resources\ReadingAssignmentResource::collection($assignments)->resolve(),
        ]);
    }

    public function exploreList(Request $request)
    {
        $user = Auth::user();
        $classroomIds = $user->classrooms()->pluck('classrooms.id');
        
        // Fetch published assignments from classrooms the user has NOT joined
        $assignments = ReadingAssignment::whereNotIn('classroom_id', $classroomIds)
            ->published()
            ->with(['classroom.dosen'])
            ->latest()
            ->get()
            ->map(function ($assignment) {
                $assignment->is_classroom_member = false;
                return $assignment;
            });

        return inertia('mahasiswa/explore/index', [
            'assignments' => \App\Http\Resources\ReadingAssignmentResource::collection($assignments)->resolve(),
        ]);
    }
}
