<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReadingDailyLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'mahasiswa_id',
        'tanggal',
        'total_durasi_detik',
        'jumlah_sesi',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
        ];
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mahasiswa_id');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    public function getDurasiMenitAttribute(): float
    {
        return round($this->total_durasi_detik / 60, 1);
    }

}
