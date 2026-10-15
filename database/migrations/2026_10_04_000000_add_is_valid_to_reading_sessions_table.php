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
        Schema::table('reading_sessions', function (Blueprint $table) {
            $table->boolean('is_valid')->default(false)->after('halaman_terakhir')->comment('Apakah sesi membaca valid memenuhi threshold');
            $table->index(['mahasiswa_id', 'is_valid']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reading_sessions', function (Blueprint $table) {
            $table->dropIndex(['mahasiswa_id', 'is_valid']);
            $table->dropColumn('is_valid');
        });
    }
};
