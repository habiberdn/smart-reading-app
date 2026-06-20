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
        Schema::create('reading_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')
                ->constrained('reading_assignments')
                ->cascadeOnDelete();
            $table->foreignId('mahasiswa_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->integer('durasi_detik')->default(0)->comment('durasi sesi ini dalam detik');
            $table->integer('halaman_terakhir')->nullable()->comment('halaman saat sesi berakhir');

            $table->timestamps();

            $table->index(['assignment_id', 'mahasiswa_id']);
            $table->index('mahasiswa_id');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reading_sessions');
    }
};
