<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\ReadingAssignment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReadingAssignmentController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, $kode)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'dueDate' => 'nullable|date',
            'pdfFile' => 'required|file|mimes:pdf|max:10240', // Max 10MB PDF
        ]);

        $classroom = Classroom::where('kode_kelas', $kode)->firstOrFail();
        if ($classroom->dosen_id !== Auth::id()) {
            abort(403, 'Anda tidak memiliki akses untuk menambahkan tugas ke kelas ini.');
        }

        // 1. Store the PDF file
        $path = $request->file('pdfFile')->store('assignments', 'public');

        // 2. Extract Text and Metrics using PdfExtractionService
        $fullPath = storage_path('app/public/'.$path);
        $extractor = new \App\Services\PdfExtractionService();
        $extraction = $extractor->extract($fullPath);

        $extractedText = $extraction['content'];
        $wordCount = $extraction['word_count'];
        $sentenceCount = $extraction['sentence_count'];
        $averageSentenceLength = $extraction['average_sentence_length'];
        $technicalWordCount = $extraction['technical_word_count'];

        // Difficulty berdasarkan jumlah halaman
        $totalHalaman = max(1, ceil($wordCount / 250));
        $tingkatKesulitan = 'easy';
        $difficultyScore = 15;

        if ($totalHalaman > 5) {
            $tingkatKesulitan = 'medium';
            $difficultyScore = 50;
        }
        if ($totalHalaman > 15) {
            $tingkatKesulitan = 'hard';
            $difficultyScore = 85;
        }

        // Estimate duration
        $estimasiDurasi = max(1, ceil($wordCount / 200)); // 200 words per minute average reading speed

        // 4. Store Metrics & Data
        ReadingAssignment::create([
            'classroom_id' => $classroom->id,
            'dosen_id' => Auth::id(),
            'judul' => $request->title,
            'deskripsi' => $request->description ?? '',
            'file_path' => $path,
            'file_type' => 'pdf',
            'total_halaman' => $totalHalaman,
            'deadline' => $request->dueDate ? Carbon::parse($request->dueDate) : null,
            'estimasi_durasi' => $estimasiDurasi,
            'tingkat_kesulitan' => $tingkatKesulitan,
            'is_published' => true,
            'published_at' => now(),
            'content' => $extractedText,
            'word_count' => $wordCount,
            'sentence_count' => $sentenceCount,
            'average_sentence_length' => $averageSentenceLength,
            'technical_word_count' => $technicalWordCount,
            'difficulty_score' => $difficultyScore,
        ]);

        return redirect()->back()->with('message', 'Tugas bacaan berhasil ditambahkan!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $assignment = ReadingAssignment::findOrFail($id);

        if ($assignment->dosen_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $assignment->delete();

        return redirect()->back()->with('message', 'Tugas bacaan berhasil dihapus!');
    }
}

