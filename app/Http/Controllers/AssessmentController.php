<?php

namespace App\Http\Controllers;

use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use App\Models\ReadingAssignment;
use App\Models\ReadingSummary;
use App\Services\GeminiQuizService;
use App\Services\GeminiSummaryEvaluatorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AssessmentController extends Controller
{
    /**
     * Mengambil status kuis dan ringkasan untuk reading workspace mahasiswa/dosen.
     */
    public function getAssessmentData(int $assignment_id)
    {
        $assignment = ReadingAssignment::findOrFail($assignment_id);
        $user = Auth::user();
        $isDosen = $user->role === 'dosen';

        // Auto-generate kuis jika belum ada soal dan materi tersedia
        if ($assignment->quizQuestions()->count() === 0 && !empty($assignment->content)) {
            try {
                $service = new GeminiQuizService();
                $service->generateAndStore($assignment, 5);
            } catch (\Throwable $e) {
                // ignore
            }
        }

        $latestAttempt = QuizAttempt::where('assignment_id', $assignment->id)
            ->where('mahasiswa_id', $user->id)
            ->latest()
            ->first();

        $latestSummary = ReadingSummary::where('assignment_id', $assignment->id)
            ->where('mahasiswa_id', $user->id)
            ->latest()
            ->first();

        $questionsQuery = $assignment->quizQuestions()->orderBy('order');

        // Jika mahasiswa belum menyelesaikan kuis, sembunyikan kunci jawaban & pembahasan
        if (!$isDosen && !$latestAttempt) {
            $questions = $questionsQuery->select(['id', 'assignment_id', 'question', 'options', 'order'])->get();
        } else {
            $questions = $questionsQuery->get();
        }

        return response()->json([
            'success' => true,
            'is_dosen' => $isDosen,
            'questions' => $questions,
            'latest_attempt' => $latestAttempt,
            'latest_summary' => $latestSummary,
        ]);
    }

    /**
     * Mahasiswa mengirimkan jawaban kuis pilihan ganda.
     */
    public function submitQuiz(Request $request, int $assignment_id)
    {
        $request->validate([
            'answers' => 'required|array',
        ]);

        $assignment = ReadingAssignment::findOrFail($assignment_id);
        $user = Auth::user();

        $questions = $assignment->quizQuestions()->get()->keyBy('id');
        $totalQuestions = $questions->count();

        if ($totalQuestions === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Belum ada soal kuis yang tersedia untuk materi ini.',
            ], 422);
        }

        $correctCount = 0;
        $detailedAnswers = [];

        foreach ($questions as $qId => $question) {
            $userAnswer = strtoupper(trim($request->answers[$qId] ?? ''));
            $isCorrect = ($userAnswer !== '' && $userAnswer === strtoupper($question->correct_answer));

            if ($isCorrect) {
                $correctCount++;
            }

            $detailedAnswers[$qId] = [
                'question_id' => $qId,
                'question_text' => $question->question,
                'selected_key' => $userAnswer,
                'correct_key' => $question->correct_answer,
                'is_correct' => $isCorrect,
                'explanation' => $question->explanation,
            ];
        }

        $score = round(($correctCount / $totalQuestions) * 100, 2);

        $attempt = QuizAttempt::create([
            'assignment_id'   => $assignment->id,
            'mahasiswa_id'    => $user->id,
            'score'           => $score,
            'total_questions' => $totalQuestions,
            'correct_count'   => $correctCount,
            'answers'         => $detailedAnswers,
            'completed_at'    => now(),
        ]);

        // Kirim kembali pertanyaan lengkap dengan penjelasan untuk instant feedback
        $allQuestions = $assignment->quizQuestions()->orderBy('order')->get();

        return response()->json([
            'success' => true,
            'message' => "Kuis selesai! Skor Anda: {$score}/100 ({$correctCount} benar dari {$totalQuestions} soal).",
            'attempt' => $attempt,
            'questions' => $allQuestions,
        ]);
    }

    /**
     * Mahasiswa mengirimkan teks ringkasan untuk dinilai AI secara instan.
     */
    public function submitSummary(Request $request, int $assignment_id)
    {
        $request->validate([
            'summary_text' => 'required|string|min:30',
        ], [
            'summary_text.min' => 'Ringkasan minimal berisi 30 karakter agar dapat dievaluasi secara komprehensif.',
        ]);

        $assignment = ReadingAssignment::findOrFail($assignment_id);
        $user = Auth::user();

        $evaluator = new GeminiSummaryEvaluatorService();
        $summary = $evaluator->evaluateAndStore($assignment, $user, $request->summary_text);

        return response()->json([
            'success' => true,
            'message' => "Ringkasan berhasil dievaluasi oleh AI dengan skor {$summary->overall_score}/100.",
            'summary' => $summary,
        ]);
    }

    /**
     * Dosen me-regenerate soal kuis menggunakan AI Gemini.
     */
    public function regenerateQuiz(Request $request, int $assignment_id)
    {
        $assignment = ReadingAssignment::findOrFail($assignment_id);

        if (Auth::user()->role !== 'dosen' || $assignment->dosen_id !== Auth::id()) {
            return response()->json(['success' => false, 'message' => 'Hanya dosen pengajar yang dapat membuat ulang soal kuis.'], 403);
        }

        $count = $request->input('count', 5);
        $service = new GeminiQuizService();
        $questions = $service->generateAndStore($assignment, (int) $count);

        return response()->json([
            'success' => true,
            'message' => 'Soal kuis berhasil dibuat ulang oleh AI!',
            'questions' => $questions,
        ]);
    }

    /**
     * Dosen menambahkan butir soal kuis manual baru.
     */
    public function storeQuestion(Request $request, int $assignment_id)
    {
        $assignment = ReadingAssignment::findOrFail($assignment_id);

        if (Auth::user()->role !== 'dosen' || $assignment->dosen_id !== Auth::id()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'question' => 'required|string',
            'options' => 'required|array|min:2',
            'options.*.key' => 'required|string',
            'options.*.text' => 'required|string',
            'correct_answer' => 'required|string|in:A,B,C,D',
            'explanation' => 'nullable|string',
        ]);

        $lastOrder = $assignment->quizQuestions()->max('order') ?? 0;

        $question = QuizQuestion::create([
            'assignment_id' => $assignment->id,
            'question' => $request->question,
            'options' => $request->options,
            'correct_answer' => strtoupper($request->correct_answer),
            'explanation' => $request->explanation,
            'order' => $lastOrder + 1,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Soal baru berhasil ditambahkan.',
            'question' => $question,
        ]);
    }

    /**
     * Dosen memperbarui butir soal kuis.
     */
    public function updateQuestion(Request $request, int $id)
    {
        $question = QuizQuestion::with('assignment')->findOrFail($id);

        if (Auth::user()->role !== 'dosen' || $question->assignment->dosen_id !== Auth::id()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'question' => 'sometimes|required|string',
            'options' => 'sometimes|required|array|min:2',
            'correct_answer' => 'sometimes|required|string|in:A,B,C,D',
            'explanation' => 'nullable|string',
        ]);

        $question->update([
            'question' => $request->input('question', $question->question),
            'options' => $request->input('options', $question->options),
            'correct_answer' => strtoupper($request->input('correct_answer', $question->correct_answer)),
            'explanation' => $request->input('explanation', $question->explanation),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Soal kuis berhasil diperbarui.',
            'question' => $question,
        ]);
    }

    /**
     * Dosen menghapus butir soal kuis.
     */
    public function destroyQuestion(int $id)
    {
        $question = QuizQuestion::with('assignment')->findOrFail($id);

        if (Auth::user()->role !== 'dosen' || $question->assignment->dosen_id !== Auth::id()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $question->delete();

        return response()->json([
            'success' => true,
            'message' => 'Soal kuis berhasil dihapus.',
        ]);
    }

    /**
     * Rekap hasil asesmen kuis & ringkasan untuk kelas / dosen.
     */
    public function getAssessmentRecap(int $assignment_id)
    {
        $assignment = ReadingAssignment::with(['classroom.mahasiswa'])->findOrFail($assignment_id);

        if (Auth::user()->role !== 'dosen' || $assignment->dosen_id !== Auth::id()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $attempts = QuizAttempt::where('assignment_id', $assignment->id)
            ->with('mahasiswa:id,name,nim')
            ->latest()
            ->get()
            ->unique('mahasiswa_id')
            ->keyBy('mahasiswa_id');

        $summaries = ReadingSummary::where('assignment_id', $assignment->id)
            ->with('mahasiswa:id,name,nim')
            ->latest()
            ->get()
            ->unique('mahasiswa_id')
            ->keyBy('mahasiswa_id');

        $students = $assignment->classroom->mahasiswa->map(function ($mhs) use ($attempts, $summaries) {
            $attempt = $attempts->get($mhs->id);
            $summary = $summaries->get($mhs->id);

            return [
                'mahasiswa_id'    => $mhs->id,
                'name'            => $mhs->name,
                'nim'             => $mhs->nim,
                'quiz_score'      => $attempt ? $attempt->score : null,
                'quiz_completed'  => $attempt ? $attempt->completed_at?->format('d M Y, H:i') : null,
                'summary_score'   => $summary ? $summary->overall_score : null,
                'summary_submitted' => $summary ? $summary->submitted_at?->format('d M Y, H:i') : null,
                'summary_feedback'=> $summary ? $summary->ai_feedback : null,
            ];
        });

        return response()->json([
            'success' => true,
            'students' => $students,
            'total_questions' => $assignment->quizQuestions()->count(),
        ]);
    }
}
