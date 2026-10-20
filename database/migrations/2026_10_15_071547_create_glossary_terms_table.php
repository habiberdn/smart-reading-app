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
        Schema::create('glossary_terms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained('reading_assignments')->cascadeOnDelete();
            $table->string('term');
            $table->text('definition');
            $table->string('category')->nullable();
            $table->text('context_sentence')->nullable();
            $table->integer('frequency')->default(1);
            $table->timestamps();

            $table->index(['assignment_id', 'term']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('glossary_terms');
    }
};
