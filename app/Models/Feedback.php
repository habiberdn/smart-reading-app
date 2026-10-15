<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class Feedback extends Model
{
    protected $fillable = [
        'mahasiswa_id',
        'assignment_id',
        'type',
        'trigger_rule',
        'pesan',
        'tanggal',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'read_at' => 'datetime',
        ];
    }

       public function mahasiswa(): BelongsTo
       {
           return $this->belongsTo(User::class, 'mahasiswa_id');
       }

       public function assignment(): BelongsTo
       {
           return $this->belongsTo(ReadingAssignment::class, 'assignment_id');
       }


       public function scopeUnread($query)
       {
           return $query->whereNull('read_at');
       }

       public function markAsRead(): void
       {
           if (!$this->read_at) {
               $this->update(['read_at' => now()]);
           }
       }

       public function isRead(): bool
       {
           return $this->read_at !== null;
       }

}
