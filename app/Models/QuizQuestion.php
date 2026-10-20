<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'assignment_id',
        'question',
        'options',
        'correct_answer',
        'explanation',
        'order',
    ];

    protected $casts = [
        'options' => 'array',
        'order' => 'integer',
    ];

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(ReadingAssignment::class, 'assignment_id');
    }
}
