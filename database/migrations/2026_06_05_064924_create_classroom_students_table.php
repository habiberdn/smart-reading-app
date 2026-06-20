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
        Schema::create('classroom_students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classroom_id')
                             ->constrained('classrooms')
                             ->cascadeOnDelete();
            $table->foreignId('mahasiswa_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->timestamp('joined_at')->useCurrent();

            $table->unique(['classroom_id', 'mahasiswa_id']);

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('classroom_students');
    }
};
