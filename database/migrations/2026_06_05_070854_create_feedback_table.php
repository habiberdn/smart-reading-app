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
        Schema::create('feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->foreignId('assignment_id')
                ->nullable()
                ->constrained('reading_assignments')
                ->nullOnDelete();

            $table->enum('type', [
                'warning',    
                'suggestion', 
                'praise',     
                'reminder',   
            ]);

            $table->string('trigger_rule')->comment('rule yang memicu, e.g. duration_too_short');
            $table->text('pesan');

            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['mahasiswa_id', 'read_at']);

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feedback');
    }
};
