<?php

namespace App\Services;

use App\Models\ReadingAssignment;
use App\Models\ReadingProgress;
use App\Models\User;
use Illuminate\Support\Collection;

class RecommendationService
{
    private array $weights;

    public function __construct()
    {
        $this->weights = [
            'difficulty' => config('services.recommendation.difficulty_weight', 0.35),
            'deadline'   => config('services.recommendation.deadline_weight', 0.25),
            'similarity' => config('services.recommendation.similarity_weight', 0.25),
            'capacity'   => config('services.recommendation.capacity_weight', 0.15),
        ];
    }

    public function recommendFor(User $user, int $limit = 5): Collection
    {
        $classroomIds = $user->classrooms()->pluck('classrooms.id');

        $completedIds = ReadingProgress::where('mahasiswa_id', $user->id)
            ->where('status', 'completed')
            ->pluck('assignment_id');

        $inProgressIds = ReadingProgress::where('mahasiswa_id', $user->id)
            ->where('status', 'in_progress')
            ->pluck('assignment_id');

        // Recommend any published assignment from any class, excluding classrooms the user has joined
        $candidates = ReadingAssignment::where('is_published', true)
            ->whereNotIn('classroom_id', $classroomIds)
            ->whereNotIn('id', $completedIds)
            ->with(['classroom'])
            ->get();

        if ($candidates->isEmpty()) {
            return collect();
        }

        $avgDifficulty = ReadingProgress::where('mahasiswa_id', $user->id)
            ->join('reading_assignments', 'reading_progresses.assignment_id', '=', 'reading_assignments.id')
            ->where('reading_progresses.status', 'completed')
            ->avg('reading_assignments.difficulty_score');

        $avgDifficulty = $avgDifficulty ?? 50;

        $avgDailyMinutes = $user->avg_daily_reading_minutes;
        $avgDailyMinutes = $avgDailyMinutes > 0 ? $avgDailyMinutes : 10;

        $completedKeywords = $this->extractKeywordsFromAssignments($completedIds);

        $scored = $candidates->map(function ($assignment) use ($avgDifficulty, $avgDailyMinutes, $completedKeywords, $inProgressIds, $classroomIds) {
            $isMember = $classroomIds->contains($assignment->classroom_id);

            $difficultyScore = $this->scoreDifficulty($assignment, $avgDifficulty);
            $deadlineScore   = $isMember ? $this->scoreDeadline($assignment) : 30.0;
            $similarityScore = $this->scoreSimilarity($assignment, $completedKeywords);
            $capacityScore   = $this->scoreCapacity($assignment, $avgDailyMinutes);

            $total = $difficultyScore * $this->weights['difficulty']
                   + $deadlineScore   * $this->weights['deadline']
                   + $similarityScore * $this->weights['similarity']
                   + $capacityScore   * $this->weights['capacity'];

            $reasons = $this->generateReasons(
                $assignment, $difficultyScore, $deadlineScore, $similarityScore, $capacityScore, $isMember
            );

            // Format deadline only if they are a member of the class
            $formattedDeadline = ($isMember && $assignment->deadline) 
                ? $assignment->deadline->format('Y-m-d') 
                : null;

            return [
                'assignment' => [
                    'id' => $assignment->id,
                    'judul' => $assignment->judul,
                    'tingkat_kesulitan' => $assignment->tingkat_kesulitan,
                    'estimasi_durasi' => $assignment->estimasi_durasi,
                    'total_halaman' => $assignment->total_halaman,
                    'deadline' => $formattedDeadline,
                    'classroom' => $assignment->classroom ? [
                        'name' => $assignment->classroom->name,
                    ] : null,
                ],
                'total_score' => round($total, 1),
                'reasons' => $reasons,
                'scores' => [
                    'difficulty' => round($difficultyScore),
                    'deadline'   => round($deadlineScore),
                    'similarity' => round($similarityScore),
                    'capacity'   => round($capacityScore),
                ],
            ];
        });

        $inProgressIdsSet = $inProgressIds->toArray();

        $scored = $scored->sortByDesc(function ($item) use ($inProgressIdsSet) {
            $boost = in_array($item['assignment']['id'], $inProgressIdsSet) ? 10 : 0;
            return $item['total_score'] + $boost;
        });

        return $scored->take($limit)->values();
    }

    private function scoreDifficulty(ReadingAssignment $assignment, float $avgDifficulty): float
    {
        $diff = $assignment->difficulty_score ?? 50;
        $difference = abs($diff - $avgDifficulty);

        if ($difference <= 10) {
            return 100;
        } elseif ($difference <= 25) {
            return 75;
        } elseif ($difference <= 40) {
            return 50;
        } elseif ($difference <= 60) {
            return 25;
        }

        return 10;
    }

    private function scoreDeadline(ReadingAssignment $assignment): float
    {
        if (!$assignment->deadline) {
            return 30;
        }

        $daysLeft = now()->diffInDays($assignment->deadline, false);

        if ($daysLeft < 0) {
            return 0;
        }

        if ($daysLeft <= 1) {
            return 100;
        } elseif ($daysLeft <= 3) {
            return 90;
        } elseif ($daysLeft <= 7) {
            return 80;
        } elseif ($daysLeft <= 14) {
            return 60;
        } elseif ($daysLeft <= 30) {
            return 40;
        }

        return 20;
    }

    private function scoreSimilarity(ReadingAssignment $assignment, array $completedKeywords): float
    {
        if (empty($completedKeywords)) {
            return 50;
        }

        $content = $assignment->content ?? '';
        if (empty($content)) {
            return 30;
        }

        $words = $this->tokenize($content);
        if (empty($words)) {
            return 30;
        }

        $wordFreq = array_count_values($words);
        arsort($wordFreq);
        $topWords = array_slice(array_keys($wordFreq), 0, 50);

        $matches = count(array_intersect($topWords, $completedKeywords));
        $maxPossible = min(50, count($completedKeywords));

        if ($maxPossible === 0) {
            return 30;
        }

        return min(100, ($matches / $maxPossible) * 100);
    }

    private function scoreCapacity(ReadingAssignment $assignment, float $avgDailyMinutes): float
    {
        $estimasi = $assignment->estimasi_durasi ?? 60;

        if ($estimasi <= 0) {
            return 50;
        }

        $ratio = $avgDailyMinutes / $estimasi;

        if ($ratio >= 1.0) {
            return 100;
        } elseif ($ratio >= 0.5) {
            return 80;
        } elseif ($ratio >= 0.25) {
            return 60;
        } elseif ($ratio >= 0.1) {
            return 40;
        }

        return 20;
    }

    private function generateReasons(
        ReadingAssignment $assignment,
        float $difficultyScore,
        float $deadlineScore,
        float $similarityScore,
        float $capacityScore,
        bool $isMember = true
    ): array {
        $reasons = [];

        if ($difficultyScore >= 75) {
            $reasons[] = 'Tingkat kesulitan sesuai dengan kemampuan membaca Anda';
        } elseif ($difficultyScore < 30) {
            $reasons[] = 'Cocok untuk variasi tingkat kesulitan bacaan Anda';
        }

        if ($isMember && $deadlineScore >= 80) {
            $daysLeft = now()->diffInDays($assignment->deadline);
            if ($daysLeft <= 1) {
                $reasons[] = 'Tenggat waktu kurang dari 1 hari lagi — prioritaskan!';
            } else {
                $reasons[] = "Tenggat waktu {$daysLeft} hari lagi — segera selesaikan";
            }
        } elseif ($isMember && $deadlineScore >= 40) {
            $daysLeft = now()->diffInDays($assignment->deadline);
            $reasons[] = "Mempunyai tenggat waktu {$daysLeft} hari lagi";
        }

        if ($similarityScore >= 70) {
            $reasons[] = 'Topiknya mirip dengan bacaan yang sudah Anda selesaikan';
        }

        if ($capacityScore >= 80) {
            $reasons[] = 'Estimasi durasi sesuai dengan waktu baca harian Anda';
        } elseif ($capacityScore < 40) {
            $reasons[] = 'Butuh waktu lebih — siapkan jadwal khusus';
        }

        return $reasons;
    }

    private function extractKeywordsFromAssignments(Collection $assignmentIds): array
    {
        if ($assignmentIds->isEmpty()) {
            return [];
        }

        $contents = ReadingAssignment::whereIn('id', $assignmentIds)
            ->pluck('content')
            ->implode(' ');

        return $this->extractKeywords($contents);
    }

    private function extractKeywords(string $text): array
    {
        $words = $this->tokenize($text);
        if (empty($words)) {
            return [];
        }

        $stopWords = [
            'dan', 'di', 'ke', 'dari', 'yang', 'ini', 'itu', 'dengan', 'untuk',
            'pada', 'adalah', 'dalam', 'akan', 'tidak', 'ada', 'saya', 'dia',
            'kami', 'kita', 'mereka', 'anda', 'juga', 'telah', 'sudah', 'belum',
            'bisa', 'dapat', 'oleh', 'sebagai', 'atau', 'karena', 'jika', 'saat',
            'the', 'and', 'of', 'to', 'in', 'is', 'it', 'that', 'for', 'was',
            'are', 'be', 'has', 'have', 'with', 'this', 'from', 'not', 'but',
            'yang', 'dari', 'dengan', 'untuk', 'pada', 'dalam', 'akan', 'tidak',
            'dapat', 'yang', 'telah', 'oleh', 'sebagai', 'atau', 'karena', 'jika',
        ];

        $wordFreq = array_count_values($words);

        foreach ($stopWords as $stop) {
            unset($wordFreq[$stop]);
        }

        $filtered = array_filter($wordFreq, fn($freq) => $freq >= 2);

        arsort($filtered);

        return array_keys(array_slice($filtered, 0, 100));
    }

    private function tokenize(string $text): array
    {
        $text = mb_strtolower($text);

        $text = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $text);

        $text = preg_replace('/\s+/u', ' ', $text);
        $text = trim($text);

        if (empty($text)) {
            return [];
        }

        $words = preg_split('/\s+/u', $text, -1, PREG_SPLIT_NO_EMPTY);

        $minLength = 3;
        $maxLength = 30;

        return array_values(array_filter($words, function ($w) use ($minLength, $maxLength) {
            $len = mb_strlen($w);
            return $len >= $minLength && $len <= $maxLength;
        }));
    }
}
