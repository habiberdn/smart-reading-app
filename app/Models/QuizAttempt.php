<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'assignment_id',
        'mahasiswa_id',
        'score',
        'total_questions',
        'correct_count',
        'answers',
        'completed_at',
    ];

    protected $casts = [
        'score' => 'decimal:2',
        'total_questions' => 'integer',
        'correct_count' => 'integer',
        'answers' => 'array',
        'completed_at' => 'datetime',
    ];

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(ReadingAssignment::class, 'assignment_id');
    }

    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mahasiswa_id');
    }
}
