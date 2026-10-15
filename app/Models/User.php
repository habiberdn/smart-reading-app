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
        'daily_target_minutes',
        'weekly_target_minutes',
        'target_type',
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
                     ->where(function ($query) {
                         $query->where('jumlah_sesi', '>', 0)
                               ->orWhere('total_durasi_detik', '>=', 60);
                     })
                     ->orderByDesc('tanggal')
                     ->pluck('tanggal')
                     ->map(fn($d) => \Carbon\Carbon::parse($d)->startOfDay())
                     ->unique(fn($d) => $d->toDateString())
                     ->values();

        if ($logs->isEmpty()) {
            return 0;
        }

        $streak = 0;
        $check  = now()->startOfDay();

        // If today has no log yet, start checking from yesterday
        if (!$logs->first()->equalTo($check)) {
            $check = $check->subDay();
        }

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

    /** Menit baca hari ini (dari reading_daily_logs) */
    public function getTodayReadingMinutesAttribute(): float
    {
        $log = $this->readingDailyLogs()
                    ->where('tanggal', now()->toDateString())
                    ->first();
        return $log ? round($log->total_durasi_detik / 60, 1) : 0.0;
    }

    /** Total menit baca minggu ini (Senin s/d hari ini) */
    public function getWeekReadingMinutesAttribute(): float
    {
        $total = $this->readingDailyLogs()
                      ->whereBetween('tanggal', [
                          now()->startOfWeek()->toDateString(),
                          now()->toDateString(),
                      ])
                      ->sum('total_durasi_detik');
        return round($total / 60, 1);
    }

    /** Persentase pencapaian target harian (0–100+) */
    public function getDailyAchievementPercentAttribute(): float
    {
        if ($this->daily_target_minutes <= 0) {
            return 0.0;
        }
        return round(($this->today_reading_minutes / $this->daily_target_minutes) * 100, 1);
    }

    /** Persentase pencapaian target mingguan (0–100+) */
    public function getWeeklyAchievementPercentAttribute(): float
    {
        if ($this->weekly_target_minutes <= 0) {
            return 0.0;
        }
        return round(($this->week_reading_minutes / $this->weekly_target_minutes) * 100, 1);
    }
}
