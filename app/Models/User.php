<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'username',
        'email',
        'google_id',
        'password',
        'role',
        'kampus',
        'nim',
        'nidn',
        'program_studi',
        'avatar',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password'          => 'hashed',
        ];
    }

    public function isSuperadmin(): bool
    {
        return $this->role === 'superadmin';
    }

    public function isMahasiswa(): bool
    {
        return $this->role === 'mahasiswa';
    }

    public function isDosen(): bool
    {
        return $this->role === 'dosen';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function classroomsAsDosen(): HasMany
    {
        return $this->hasMany(Classroom::class, 'dosen_id');
    }

    public function readingAssignments(): HasMany
    {
        return $this->hasMany(ReadingAssignment::class, 'dosen_id');
    }

    public function classrooms(): BelongsToMany
    {
        return $this->belongsToMany(Classroom::class, 'classroom_students', 'mahasiswa_id', 'classroom_id')
                    ->withPivot('joined_at')
                    ->orderByPivot('joined_at');
    }

    /** Semua sesi membaca mahasiswa */
    public function readingSessions(): HasMany
    {
        return $this->hasMany(ReadingSession::class, 'mahasiswa_id');
    }

    /** Progress terkini per assignment */
    public function readingProgresses(): HasMany
    {
        return $this->hasMany(ReadingProgress::class, 'mahasiswa_id');
    }

    /** Log harian untuk kalkulasi streak */
    public function readingDailyLogs(): HasMany
    {
        return $this->hasMany(ReadingDailyLog::class, 'mahasiswa_id');
    }

    /** Feedback rule-based yang diterima */
    public function feedbacks(): HasMany
    {
        return $this->hasMany(Feedback::class, 'mahasiswa_id');
    }

    // -------------------------------------------------------------------------
    // Streak helpers (dihitung dari daily_logs)
    // -------------------------------------------------------------------------

    /**
     * Streak hari berturut-turut aktif membaca hingga hari ini.
     * Dihitung real-time dari reading_daily_logs.
     * Pertimbangkan cache jika query mulai lambat.
     */
    public function getCurrentStreakAttribute(): int
    {
        $logs = $this->readingDailyLogs()
                     ->orderByDesc('tanggal')
                     ->pluck('tanggal')
                     ->map(fn($d) => \Carbon\Carbon::parse($d));

        $streak = 0;
        $check  = now()->startOfDay();

        foreach ($logs as $tanggal) {
            if ($tanggal->equalTo($check)) {
                $streak++;
                $check = $check->subDay();
            } else {
                break;
            }
        }

        return $streak;
    }

    public function getAvgDailyReadingMinutesAttribute(): float
    {
        $avg = $this->readingDailyLogs()->avg('total_durasi_detik') ?? 0;
        return round($avg / 60, 1);
    }
}
