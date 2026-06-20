<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReadingProgress extends Model
{
    use HasFactory;

       protected $fillable = [
           'assignment_id',
           'mahasiswa_id',
           'status',
           'halaman_sekarang',
           'persentase',
           'total_durasi_detik',
           'first_opened_at',
           'last_read_at',
           'completed_at',
       ];

       protected function casts(): array
       {
           return [
               'persentase'      => 'float',
               'first_opened_at' => 'datetime',
               'last_read_at'    => 'datetime',
               'completed_at'    => 'datetime',
           ];
       }

       public function assignment(): BelongsTo
       {
           return $this->belongsTo(ReadingAssignment::class, 'assignment_id');
       }

       public function mahasiswa(): BelongsTo
       {
           return $this->belongsTo(User::class, 'mahasiswa_id');
       }


       public function scopeCompleted($query)
       {
           return $query->where('status', 'completed');
       }

       public function scopeInProgress($query)
       {
           return $query->where('status', 'in_progress');
       }

       public function scopeNotStarted($query)
       {
           return $query->where('status', 'not_started');
       }

       public function getTotalDurasiMenitAttribute(): float
       {
           return round($this->total_durasi_detik / 60, 1);
       }

       public function isCompleted(): bool
       {
           return $this->status === 'completed';
       }
}
