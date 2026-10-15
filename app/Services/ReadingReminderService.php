<?php

namespace App\Services;

use App\Models\Feedback;
use App\Models\ReadingAssignment;
use App\Models\ReadingDailyLog;
use App\Models\ReadingProgress;
use App\Models\User;

class ReadingReminderService
{
    /**
     * Generate reminder notifikasi untuk user mahasiswa.
     */
    public function generateForUser(User $user): void
    {
        if ($user->role !== 'mahasiswa') {
            return;
        }

        $today = now()->toDateString();

        $this->checkNoReadingToday($user, $today);
        $this->checkTargetAtRisk($user, $today);
        $this->checkStreakAtRisk($user, $today);
        $this->checkUrgentAssignments($user, $today);
    }

    /**
     * Rule 1: Jika sudah sore/malam (>= 16:00) dan belum ada sesi baca valid hari ini.
     */
    protected function checkNoReadingToday(User $user, string $today): void
    {
        if (now()->hour < 16) {
            return;
        }

        $hasRead = ReadingDailyLog::where('mahasiswa_id', $user->id)
            ->where('tanggal', $today)
            ->where(function ($q) {
                $q->where('total_durasi_detik', '>=', 60)
                  ->orWhere('jumlah_sesi', '>', 0);
            })
            ->exists();

        if ($hasRead) {
            return;
        }

        $this->createReminderIfNotExists(
            $user->id,
            $today,
            'no_reading_today',
            'Belum membaca hari ini! Luangkan waktu sejenak untuk melatih pemahaman dan menjaga kebiasaan membaca.',
            null
        );
    }

    /**
     * Rule 2: Jika mahasiswa punya target harian aktif, tapi sudah malam (>= 20:00) dan capaian < 50%.
     */
    protected function checkTargetAtRisk(User $user, string $today): void
    {
        $hasDailyTarget = in_array($user->target_type, ['daily', 'both']) && $user->daily_target_minutes > 0;
        if (!$hasDailyTarget) {
            return;
        }

        if (now()->hour < 20) {
            return;
        }

        if ($user->daily_achievement_percent >= 50) {
            return;
        }

        $todayMinutes = $user->today_reading_minutes;
        $targetMinutes = $user->daily_target_minutes;

        $this->createReminderIfNotExists(
            $user->id,
            $today,
            'target_at_risk',
            "Target harianmu baru tercapai {$todayMinutes} dari {$targetMinutes} menit. Masih ada waktu untuk melanjutkannya malam ini!",
            null
        );
    }

    /**
     * Rule 3: Jika mahasiswa memiliki streak aktif (> 0), sudah malam (>= 19:00), dan belum membaca hari ini.
     */
    protected function checkStreakAtRisk(User $user, string $today): void
    {
        $streak = $user->current_streak;
        if ($streak <= 0) {
            return;
        }

        if (now()->hour < 19) {
            return;
        }

        $hasReadToday = ReadingDailyLog::where('mahasiswa_id', $user->id)
            ->where('tanggal', $today)
            ->where(function ($q) {
                $q->where('total_durasi_detik', '>=', 60)
                  ->orWhere('jumlah_sesi', '>', 0);
            })
            ->exists();

        if ($hasReadToday) {
            return;
        }

        $this->createReminderIfNotExists(
            $user->id,
            $today,
            'streak_at_risk',
            "Streak membaca {$streak} hari berturut-turut bisa putus hari ini! Yuk baca sedikit sebelum hari berganti.",
            null
        );
    }

    /**
     * Rule 4: Tugas bacaan dari kelas yang diikutinya dengan deadline <= 2 hari lagi dan belum selesai.
     */
    protected function checkUrgentAssignments(User $user, string $today): void
    {
        $classroomIds = $user->classrooms()->pluck('classrooms.id');
        if ($classroomIds->isEmpty()) {
            return;
        }

        $urgentAssignments = ReadingAssignment::whereIn('classroom_id', $classroomIds)
            ->published()
            ->whereNotNull('deadline')
            ->where('deadline', '>=', now())
            ->where('deadline', '<=', now()->addDays(2))
            ->get();

        foreach ($urgentAssignments as $assignment) {
            $isCompleted = ReadingProgress::where('assignment_id', $assignment->id)
                ->where('mahasiswa_id', $user->id)
                ->where('status', 'completed')
                ->exists();

            if ($isCompleted) {
                continue;
            }

            $ruleKey = "urgent_deadline_{$assignment->id}";
            $deadlineDiff = $assignment->deadline->diffForHumans();

            $this->createReminderIfNotExists(
                $user->id,
                $today,
                $ruleKey,
                "Tugas bacaan '{$assignment->judul}' akan berakhir {$deadlineDiff}! Segera selesaikan bacaan Anda.",
                $assignment->id
            );
        }
    }

    /**
     * Helper untuk membuat reminder tanpa duplikasi per hari & per rule.
     */
    protected function createReminderIfNotExists(
        int $mahasiswaId,
        string $today,
        string $triggerRule,
        string $pesan,
        ?int $assignmentId = null
    ): void {
        $exists = Feedback::where('mahasiswa_id', $mahasiswaId)
            ->where('tanggal', $today)
            ->where('trigger_rule', $triggerRule)
            ->exists();

        if (!$exists) {
            Feedback::create([
                'mahasiswa_id'  => $mahasiswaId,
                'assignment_id' => $assignmentId,
                'type'          => 'reminder',
                'trigger_rule'  => $triggerRule,
                'pesan'         => $pesan,
                'tanggal'       => $today,
            ]);
        }
    }
}
