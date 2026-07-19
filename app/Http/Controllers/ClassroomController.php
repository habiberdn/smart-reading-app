<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\ReadingProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ClassroomController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Mengambil semua kelas yang diampu oleh dosen yang sedang login
        $classrooms = Classroom::where('dosen_id', Auth::id())
            ->withCount(['mahasiswa', 'readingAssignments']) // Menghitung jumlah mahasiswa dan tugas di kelas tersebut
            ->latest()
            ->get();

        return inertia('dosen/classroom/index', [
            'classrooms' => $classrooms,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'semester' => 'required|numeric', // Menggunakan numeric/integer (bukan number)
            'kode_kelas' => 'nullable|string|max:20|unique:classrooms,kode_kelas', // Validasi unik agar tidak bentrok
            'deskripsi' => 'nullable|string',
        ]);

        // Otomatis masukkan dosen_id dari user yang sedang login
        $validated['dosen_id'] = Auth::id();
        $validated['is_active'] = true;

        Classroom::create($validated);

        return redirect()->back()
            ->with('message', 'Kelas berhasil dibuat!');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $kode)
    {
        $classroom = Classroom::where('kode_kelas', $kode)
            ->with(['dosen'])
            ->firstOrFail();

        if (Auth::user()->role === 'dosen' && $classroom->dosen_id !== Auth::id()) {
            abort(403, 'Anda tidak diizinkan mengakses kelas ini.');
        }

        if (Auth::user()->role === 'mahasiswa') {
            // Check if student joined this classroom
            $joined = $classroom->mahasiswa()->where('mahasiswa_id', Auth::id())->exists();
            if (! $joined) {
                abort(403, 'Anda belum terdaftar di kelas ini.');
            }

            // Get assignments with progress for this student
            $assignments = $classroom->readingAssignments()
                ->where('is_published', true)
                ->get()
                ->map(function ($assignment) {
                    $assignment->is_classroom_member = true;
                    return $assignment;
                });

            return inertia('mahasiswa/classroom/details', [
                'classroom' => $classroom,
                'assignments' => \App\Http\Resources\ReadingAssignmentResource::collection($assignments)->resolve(),
            ]);
        }

        // Get all reading assignments for this classroom
        $assignments = $classroom->readingAssignments()->latest()->get();
        $assignmentIds = $assignments->pluck('id');

        $formattedAssignments = $assignments->map(function ($assignment) {
            return [
                'id' => $assignment->id,
                'judul' => $assignment->judul,
                'file_path' => basename($assignment->file_path),
                'deadline' => $assignment->deadline ? $assignment->deadline->format('d-m-Y') : 'Tanpa Batas',
                'tingkat_kesulitan' => $assignment->tingkat_kesulitan,
            ];
        });

        $classroom->setRelation('reading_assignments', $formattedAssignments);

        // Get all mahasiswa in the classroom (Lecturer role)
        $joinedStudentIds = $classroom->mahasiswa()->pluck('users.id');

        // Fetch students who have reading progress for assignments of this class
        $progressStudentIds = ReadingProgress::whereIn('assignment_id', $assignmentIds)
            ->pluck('mahasiswa_id');

        // Union both lists of students
        $allStudentIds = $joinedStudentIds->merge($progressStudentIds)->unique();
        $mahasiswaList = \App\Models\User::whereIn('id', $allStudentIds)->get();

        $studentsData = $mahasiswaList->map(function ($student) use ($assignmentIds, $joinedStudentIds, $assignments) {
            $progresses = ReadingProgress::where('mahasiswa_id', $student->id)
                ->whereIn('assignment_id', $assignmentIds)
                ->get();

            $isJoined = $joinedStudentIds->contains($student->id);

            $totalSeconds = $progresses->sum('total_durasi_detik');
            $hours = floor($totalSeconds / 3600);
            $minutes = floor(($totalSeconds % 3600) / 60);
            $timeSpentStr = "{$hours}j {$minutes}m";

            $totalAssignments = $assignmentIds->count();
            $avgPercentage = 0;
            $status = 'Membaca';

            if ($totalAssignments > 0) {
                $avgPercentage = round($progresses->sum('persentase') / $totalAssignments, 1);

                $completedCount = $progresses->where('status', 'completed')->count();

                $lateAssignments = $assignments->filter(function ($assignment) use ($progresses) {
                    if (!$assignment->deadline) return false;
                    if ($assignment->deadline->isPast()) {
                        $prog = $progresses->firstWhere('assignment_id', $assignment->id);
                        if (!$prog || $prog->status !== 'completed') {
                            return true;
                        }
                    }
                    return false;
                })->count();

                if ($lateAssignments > 0) {
                    $status = 'Terlambat';
                } elseif ($completedCount === $totalAssignments) {
                    $status = 'Selesai';
                } elseif ($isJoined && $avgPercentage < 20 && $completedCount === 0) {
                    $status = 'Belum Selesai';
                } else {
                    $status = 'Membaca';
                }
            } else {
                $status = 'Membaca';
            }

            return [
                'id' => $student->id,
                'nim' => $student->nim ?? '-',
                'name' => $student->name . ($isJoined ? '' : ' (Luar Kelas)'),
                'readingProgress' => $avgPercentage . '%',
                'timeSpent' => $timeSpentStr,
                'status' => $status,
            ];
        });

        return inertia('dosen/classroom/details', [
            'classroom' => $classroom,
            'students' => $studentsData,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $kode)
    {
        // Cari kelas berdasarkan kode_kelas dan pastikan ini milik dosen yang login
        $classroom = Classroom::where('kode_kelas', $kode)
            ->where('dosen_id', Auth::id())
            ->firstOrFail();

        return inertia('dosen/classroom/edit', [
            'classroom' => $classroom,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $kode)
    {
        $classroom = Classroom::where('kode_kelas', $kode)
            ->where('dosen_id', Auth::id())
            ->firstOrFail();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'semester' => 'required|numeric',
            'kode_kelas' => 'required|string|max:20|unique:classrooms,kode_kelas,' . $classroom->id, // Abaikan pengecekan unik untuk kelas ini sendiri
            'deskripsi' => 'nullable|string',
            'is_active' => 'required|boolean',
        ]);

        $classroom->update($validated);

        return redirect()->route('dosen.classDetails', $classroom->kode_kelas)
            ->with('message', 'Kelas berhasil diperbarui!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $kode)
    {
        $classroom = Classroom::where('kode_kelas', $kode)
            ->where('dosen_id', Auth::id())
            ->firstOrFail();

        // Menggunakan soft delete sesuai dengan cetakan migrasi kamu
        $classroom->delete();

        return redirect()->route('dosen.classrooms')
            ->with('message', 'Kelas berhasil dihapus!');
    }
}
