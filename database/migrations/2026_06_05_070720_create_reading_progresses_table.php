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
        Schema::create('reading_progresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')
                ->constrained('reading_assignments')
                ->cascadeOnDelete();
            $table->foreignId('mahasiswa_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Status & progress halaman
            $table->enum('status', ['not_started', 'in_progress', 'completed'])
                ->default('not_started');
            $table->integer('halaman_sekarang')->default(0);
            $table->decimal('persentase', 5, 2)->default(0.00)->comment('0.00 - 100.00');

            // Akumulasi waktu membaca (dijumlah dari reading_sessions)
            $table->integer('total_durasi_detik')->default(0);

            // Timestamp penting
            $table->timestamp('first_opened_at')->nullable();
            $table->timestamp('last_read_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();

            $table->unique(['assignment_id', 'mahasiswa_id']);
            $table->index('status');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reading_progresses');
    }
};
