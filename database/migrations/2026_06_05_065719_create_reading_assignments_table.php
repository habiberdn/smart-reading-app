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
        Schema::create('reading_assignments', function (Blueprint $table) {
            $table->id();
                        $table->foreignId('classroom_id')
                              ->constrained('classrooms')
                              ->cascadeOnDelete();
                        $table->foreignId('dosen_id')
                              ->constrained('users')
                              ->restrictOnDelete();
            
                        $table->string('judul');
                        $table->text('deskripsi')->nullable();
                        $table->string('file_path')->nullable();       // path PDF/artikel
                        $table->string('file_url')->nullable();        // jika link eksternal
                        $table->string('file_type', 10)->nullable();   // pdf, url, doc
                        $table->integer('total_halaman')->nullable();
            
                        $table->timestamp('deadline')->nullable();
                        $table->integer('estimasi_durasi')->nullable()->comment('dalam menit');
                        $table->enum('tingkat_kesulitan', ['easy', 'medium', 'hard'])->default('medium');
            
                        $table->boolean('is_published')->default(false);
                        $table->timestamp('published_at')->nullable();
                        $table->timestamps();
                        $table->softDeletes();
            
                        $table->index('classroom_id');
                        $table->index('deadline');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reading_assignments');
    }
};
