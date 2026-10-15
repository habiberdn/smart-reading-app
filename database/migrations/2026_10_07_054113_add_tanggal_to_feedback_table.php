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
        Schema::table('feedback', function (Blueprint $table) {
            $table->date('tanggal')->nullable()->after('pesan');
            $table->index(['mahasiswa_id', 'tanggal', 'trigger_rule'], 'feedback_daily_rule_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('feedback', function (Blueprint $table) {
            $table->dropIndex('feedback_daily_rule_idx');
            $table->dropColumn('tanggal');
        });
    }
};
