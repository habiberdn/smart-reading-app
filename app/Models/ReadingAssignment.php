<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ReadingAssignment extends Model
{
    use HasFactory, SoftDeletes;
  
      protected $fillable = [
          'classroom_id',
          'dosen_id',
          'judul',
          'deskripsi',
          'file_path',
          'file_url',
          'file_type',
          'total_halaman',
          'deadline',
          'estimasi_durasi',
          'tingkat_kesulitan',
          'is_published',
          'published_at',
          'content',
          'word_count',
          'sentence_count',
          'average_sentence_length',
          'technical_word_count',
          'difficulty_score',
      ];
  
      protected function casts(): array
      {
          return [
              'deadline'     => 'datetime',
              'published_at' => 'datetime',
              'is_published' => 'boolean',
          ];
      }

      public function getContentAttribute(?string $value): ?string
      {
          if ($value === null) return null;
          $cleaned = @iconv('UTF-8', 'UTF-8//IGNORE//TRANSLIT', $value);
          return $cleaned !== false ? $cleaned : $value;
      }
  
  
      public function classroom(): BelongsTo
      {
          return $this->belongsTo(Classroom::class, 'classroom_id');
      }
  
      public function dosen(): BelongsTo
      {
          return $this->belongsTo(User::class, 'dosen_id');
      }
  
      public function readingSessions(): HasMany
      {
          return $this->hasMany(ReadingSession::class, 'assignment_id');
      }
  
      public function readingProgresses(): HasMany
      {
          return $this->hasMany(ReadingProgress::class, 'assignment_id');
      }
  
      /**
       * Progress mahasiswa tertentu untuk tugas ini.
       * Contoh penggunaan: $assignment->progressOf($mahasiswaId)
       */
      public function progressOf(int $mahasiswaId): HasOne
      {
          return $this->hasOne(ReadingProgress::class, 'assignment_id')
                      ->where('mahasiswa_id', $mahasiswaId);
      }
  
      /** Feedback yang terkait tugas ini */
      public function feedbacks(): HasMany
      {
          return $this->hasMany(Feedback::class, 'assignment_id');
      }
  
      public function scopePublished($query)
      {
          return $query->where('is_published', true);
      }
  
      public function scopeActive($query)
      {
          return $query->where(function ($q) {
              $q->whereNull('deadline')->orWhere('deadline', '>=', now());
          });
      }
  
      public function isOverdue(): bool
      {
          return $this->deadline && $this->deadline->isPast();
      }
  
      public function completionRate(): float
      {
          $total = $this->readingProgresses()->count();
          if ($total === 0) return 0.0;
  
          $completed = $this->readingProgresses()
                            ->where('status', 'completed')
                            ->count();
  
          return round(($completed / $total) * 100, 1);
      }

}
