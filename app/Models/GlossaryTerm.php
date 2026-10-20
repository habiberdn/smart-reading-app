<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GlossaryTerm extends Model
{
    use HasFactory;

    protected $fillable = [
        'assignment_id',
        'term',
        'definition',
        'category',
        'context_sentence',
        'frequency',
    ];

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(ReadingAssignment::class, 'assignment_id');
    }
}
