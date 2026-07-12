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
        Schema::table('reading_assignments', function (Blueprint $table) {
            $table->longText('content')->nullable();
            $table->integer('word_count')->nullable();
            $table->integer('sentence_count')->nullable();
            $table->decimal('average_sentence_length', 8, 2)->nullable();
            $table->integer('technical_word_count')->nullable();
            $table->integer('difficulty_score')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reading_assignments', function (Blueprint $table) {
            $table->dropColumn([
                'content',
                'word_count',
                'sentence_count',
                'average_sentence_length',
                'technical_word_count',
                'difficulty_score'
            ]);
        });
    }
};
