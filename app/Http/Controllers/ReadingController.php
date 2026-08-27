<?php

namespace App\Http\Controllers;

use App\Models\ReadingAssignment;
use App\Models\ReadingProgress;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ReadingController extends Controller
{
    public function streamFile(int $assignment_id)
    {
        $assignment = ReadingAssignment::with(['classroom'])->findOrFail($assignment_id);

        $isDosen = Auth::user()->role === 'dosen';
        $isMahasiswa = Auth::user()->role === 'mahasiswa';

        if ($isMahasiswa) {
            $joined = $assignment->classroom->mahasiswa()->where('mahasiswa_id', Auth::id())->exists();
            if (!$joined && !$assignment->is_published) {
                abort(403, 'Anda belum terdaftar di kelas ini.');
            }
        } elseif ($isDosen) {
            if ($assignment->dosen_id !== Auth::id()) {
                abort(403, 'Anda tidak diizinkan mengakses file ini.');
            }
        } else {
            abort(403);
        }

        if (!$assignment->file_path || !Storage::disk('public')->exists($assignment->file_path)) {
            abort(404, 'File PDF tidak ditemukan di server.');
        }

        $fullPath = Storage::disk('public')->path($assignment->file_path);

        return response()->file($fullPath, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . basename($assignment->file_path) . '"',
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
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

        // Auto-correct total_halaman if PDF exists and real count differs
        if ($assignment->file_path && Storage::disk('public')->exists($assignment->file_path)) {
            try {
                $fullPath = Storage::disk('public')->path($assignment->file_path);
                $parser = new \Smalot\PdfParser\Parser();
                $pdf = $parser->parseFile($fullPath);
                $realCount = count($pdf->getPages());
                if ($realCount > 0 && $assignment->total_halaman !== $realCount) {
                    $assignment->total_halaman = $realCount;
                    $assignment->saveQuietly();
                }
            } catch (\Throwable $e) {
                // ignore
            }
        }

        // Ambil halaman terakhir yang dibaca oleh mahasiswa (jika ada)
        $halamanSekarang = 1;
        $totalDurasiDetik = 0;
        if ($isMahasiswa) {
            $progress = ReadingProgress::where('assignment_id', $assignment->id)
                ->where('mahasiswa_id', Auth::id())
                ->first();
            if ($progress && $progress->halaman_sekarang) {
                $halamanSekarang = max(1, (int) $progress->halaman_sekarang);
            }
            $totalDurasiDetik = $progress->total_durasi_detik ?? 0;
        }

        $document = [
            'id'              => $assignment->id,
            'title'           => $assignment->judul,
            'fileName'        => $assignment->file_path ? basename($assignment->file_path) : 'Tidak ada lampiran',
            'fileUrl'         => $assignment->file_path ? route('reading.file', $assignment->id) : null,
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
            'content'         => '',
        ];

        return inertia('dosen/classroom/reading_workspace', [
            'document' => $document
        ]);
    }
}
