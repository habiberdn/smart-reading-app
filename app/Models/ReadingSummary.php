<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReadingSummary extends Model
{
    use HasFactory;

    protected $fillable = [
        'assignment_id',
        'mahasiswa_id',
        'summary_text',
        'word_count',
        'overall_score',
        'rubric_scores',
        'ai_feedback',
        'strengths',
        'improvements',
        'submitted_at',
    ];

    protected $casts = [
        'word_count' => 'integer',
        'overall_score' => 'decimal:2',
        'rubric_scores' => 'array',
        'strengths' => 'array',
        'improvements' => 'array',
        'submitted_at' => 'datetime',
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
