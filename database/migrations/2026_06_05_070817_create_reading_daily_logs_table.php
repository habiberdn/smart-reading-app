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
        Schema::create('reading_daily_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->date('tanggal');
            $table->integer('total_durasi_detik')->default(0)->comment('total baca hari itu');
            $table->integer('jumlah_sesi')->default(0);

            $table->unique(['mahasiswa_id', 'tanggal']);
            $table->index(['mahasiswa_id', 'tanggal']);

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reading_daily_logs');
    }
};
