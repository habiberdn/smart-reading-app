<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReadingSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'assignment_id',
        'mahasiswa_id',
        'started_at',
        'ended_at',
        'durasi_detik',
        'halaman_terakhir',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at'   => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::updated(function (ReadingSession $session) {
            // Hanya proses jika sesi baru saja diselesaikan
            if ($session->isDirty('ended_at') && $session->ended_at !== null) {
                $session->syncProgress();
                $session->syncDailyLog();
            }
        });
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(ReadingAssignment::class, 'assignment_id');
    }

    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mahasiswa_id');
    }

    // -------------------------------------------------------------------------
    // Sync helpers — dipanggil dari booted()
    // -------------------------------------------------------------------------

    /**
     * Agregasi semua sesi ke reading_progresses.
     * Menghitung total_durasi, halaman_sekarang, persentase, dan status.
     */
    public function syncProgress(): void
    {
        $assignment = $this->assignment;

        $aggregates = ReadingSession::where('assignment_id', $this->assignment_id)
                                    ->where('mahasiswa_id', $this->mahasiswa_id)
                                    ->whereNotNull('ended_at')
                                    ->selectRaw('SUM(durasi_detik) as total_detik, MAX(halaman_terakhir) as halaman_max')
                                    ->first();

        $halamanSekarang = $aggregates->halaman_max ?? 0;
        $totalHalaman    = $assignment->total_halaman ?? 0;
        $persentase      = ($totalHalaman > 0)
                           ? min(round(($halamanSekarang / $totalHalaman) * 100, 2), 100)
                           : 0;

        $status = match(true) {
            $persentase >= 100   => 'completed',
            $halamanSekarang > 0 => 'in_progress',
            default              => 'not_started',
        };

        $progress = ReadingProgress::firstOrNew([
            'assignment_id' => $this->assignment_id,
            'mahasiswa_id'  => $this->mahasiswa_id,
        ]);

        $progress->fill([
            'status'              => $status,
            'halaman_sekarang'    => $halamanSekarang,
            'persentase'          => $persentase,
            'total_durasi_detik'  => $aggregates->total_detik ?? 0,
            'last_read_at'        => $this->ended_at,
            'first_opened_at'     => $progress->first_opened_at ?? $this->started_at,
            'completed_at'        => ($status === 'completed' && !$progress->completed_at)
                                     ? now() : $progress->completed_at,
        ]);

        $progress->save();
    }

    /**
     * Upsert ke reading_daily_logs untuk kalkulasi streak.
     */
    public function syncDailyLog(): void
    {
        $tanggal = $this->started_at->toDateString();

        $log = ReadingDailyLog::firstOrNew([
            'mahasiswa_id' => $this->mahasiswa_id,
            'tanggal'      => $tanggal,
        ]);

        $log->total_durasi_detik += $this->durasi_detik;
        $log->jumlah_sesi        += 1;
        $log->save();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    public function getDurasiMenitAttribute(): float
    {
        return round($this->durasi_detik / 60, 1);
    }
}
