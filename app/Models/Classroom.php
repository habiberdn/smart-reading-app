<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Support\Str;

class Classroom extends Model
{
    protected $fillable = [
        'dosen_id',
        'name',
        'semester',
        "kode_kelas",
        "deskripsi",
        "is_active"
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Classroom $classroom) {
            if (empty($classroom->kode_kelas)) {
                $classroom->kode_kelas = static::generateKode();
            }
        });
    }

    public static function generateKode(): string
    {
        do {
            $kode = strtoupper(Str::random(4)) . '-' . now()->year;
        } while (static::where('kode_kelas', $kode)->exists());

        return $kode;
    }

    public function dosen(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dosen_id');
    }

    public function mahasiswa(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'classroom_students', 'classroom_id', 'mahasiswa_id')
            ->withPivot('joined_at')
            ->orderByPivot('joined_at');
    }

    public function readingAssignments(): HasMany
    {
        return $this->hasMany(ReadingAssignment::class, 'classroom_id');
    }

    /** Shortcut: tugas yang sudah dipublish */
    public function publishedAssignments(): HasMany
    {
        return $this->readingAssignments()->where('is_published', true);
    }

    public function readingSessions(): HasManyThrough
    {
        return $this->hasManyThrough(
            ReadingSession::class,
            ReadingAssignment::class,
            'classroom_id',   // FK di reading_assignments
            'assignment_id',  // FK di reading_sessions
        );
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
