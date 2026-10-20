<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Tabel Soal Kuis Pilihan Ganda per Reading Assignment
        Schema::create('quiz_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')
                ->constrained('reading_assignments')
                ->cascadeOnDelete();
            $table->text('question');
            $table->json('options'); // array: [{"key": "A", "text": "..."}, {"key": "B", "text": "..."}]
            $table->string('correct_answer', 10); // "A", "B", "C", "D"
            $table->text('explanation')->nullable(); // Penjelasan / kutipan materi sumber
            $table->integer('order')->default(1);
            $table->timestamps();

            $table->index('assignment_id');
        });

        // 2. Tabel Riwayat Pengerjaan Kuis oleh Mahasiswa
        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')
                ->constrained('reading_assignments')
                ->cascadeOnDelete();
            $table->foreignId('mahasiswa_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->decimal('score', 5, 2)->default(0); // 0 - 100
            $table->integer('total_questions')->default(0);
            $table->integer('correct_count')->default(0);
            $table->json('answers')->nullable(); // detail jawaban mahasiswa per butir soal: {question_id: selected_key, is_correct: bool}
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['assignment_id', 'mahasiswa_id']);
        });

        // 3. Tabel Penilaian Ringkasan Bacaan Mahasiswa dengan Evaluasi AI
        Schema::create('reading_summaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')
                ->constrained('reading_assignments')
                ->cascadeOnDelete();
            $table->foreignId('mahasiswa_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->longText('summary_text');
            $table->integer('word_count')->default(0);
            $table->decimal('overall_score', 5, 2)->default(0); // 0 - 100
            $table->json('rubric_scores')->nullable(); // {comprehension: 85, factual_accuracy: 90, coherence: 80, originality: 85}
            $table->text('ai_feedback')->nullable(); // Ulasan naratif menyeluruh
            $table->json('strengths')->nullable(); // Kelebihan tulisan
            $table->json('improvements')->nullable(); // Rekomendasi/saran perbaikan
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->index(['assignment_id', 'mahasiswa_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reading_summaries');
        Schema::dropIfExists('quiz_attempts');
        Schema::dropIfExists('quiz_questions');
    }
};
