<?php

namespace App\Http\Controllers;

use App\Models\ReadingAssignment;
use App\Models\ReadingProgress;
use Illuminate\Support\Facades\Auth;

class ReadingController extends Controller
{
    public function show(int $assignment_id)
    {
        $assignment = ReadingAssignment::with(['classroom'])->findOrFail($assignment_id);

        $isDosen = Auth::user()->role === 'dosen';
        $isMahasiswa = Auth::user()->role === 'mahasiswa';

        if ($isMahasiswa) {
            // Check if student joined this classroom
            $joined = $assignment->classroom->mahasiswa()->where('mahasiswa_id', Auth::id())->exists();
            if (!$joined) {
                // Allow reading if the assignment is published
                if (!$assignment->is_published) {
                    abort(403, 'Anda belum terdaftar di kelas ini.');
                }
            }
        } elseif ($isDosen) {
            // Check if this assignment belongs to the logged-in dosen
            if ($assignment->dosen_id !== Auth::id()) {
                abort(403, 'Anda tidak diizinkan mengakses pratinjau kelas ini.');
            }
        } else {
            abort(403);
        }

        $content = $assignment->content ?? '';
        $content = @iconv('UTF-8', 'UTF-8//IGNORE//TRANSLIT', $content) ?: $content;

        // Ambil halaman terakhir yang dibaca oleh mahasiswa (jika ada)
        $halamanSekarang = 0;
        $totalDurasiDetik = 0;
        if ($isMahasiswa) {
            $progress = ReadingProgress::where('assignment_id', $assignment->id)
                ->where('mahasiswa_id', Auth::id())
                ->first();
            $halamanSekarang = $progress->halaman_sekarang ?? 0;
            $totalDurasiDetik = $progress->total_durasi_detik ?? 0;
        }

        $document = [
            'id'              => $assignment->id,
            'title'           => $assignment->judul,
            'fileName'        => $assignment->file_path ? basename($assignment->file_path) : 'Tidak ada lampiran',
            'fileUrl'         => $assignment->file_path ? asset('storage/' . $assignment->file_path) : null,
            'difficultyScore' => $assignment->difficulty_score ?? 50,
            'totalHalaman'    => $assignment->total_halaman ?? 1,
            'halamanSekarang' => $halamanSekarang,
            'totalDurasiDetik' => $totalDurasiDetik,
            'metrics'         => [
                'word_count'              => $assignment->word_count ?? 0,
                'sentence_count'          => $assignment->sentence_count ?? 0,
                'average_sentence_length' => $assignment->average_sentence_length ?? 0.0,
                'technical_word_count'    => $assignment->technical_word_count ?? 0,
            ],
            'content'         => $content,
        ];

        return inertia('dosen/classroom/reading_workspace', [
            'document' => $document
        ]);
    }
}
