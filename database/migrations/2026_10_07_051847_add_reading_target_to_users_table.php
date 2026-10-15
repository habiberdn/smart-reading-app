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
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedSmallInteger('daily_target_minutes')->default(0)->after('avatar');
            $table->unsignedSmallInteger('weekly_target_minutes')->default(0)->after('daily_target_minutes');
            $table->enum('target_type', ['daily', 'weekly', 'both'])->default('daily')->after('weekly_target_minutes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['daily_target_minutes', 'weekly_target_minutes', 'target_type']);
        });
    }
};
