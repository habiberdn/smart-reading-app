<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\ReadingReminderService;
use Illuminate\Console\Command;

class GenerateReadingReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reminders:generate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate notifikasi dan pengingat aktivitas membaca untuk mahasiswa';

    /**
     * Execute the console command.
     */
    public function handle(ReadingReminderService $service): int
    {
        $mahasiswas = User::where('role', 'mahasiswa')->get();

        if ($mahasiswas->isEmpty()) {
            $this->info('Tidak ada mahasiswa ditemukan.');
            return Command::SUCCESS;
        }

        $this->info("Menjalankan reminder untuk {$mahasiswas->count()} mahasiswa...");

        $bar = $this->output->createProgressBar($mahasiswas->count());

        foreach ($mahasiswas as $user) {
            $service->generateForUser($user);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Selesai! Pengingat membaca berhasil diperbarui.');

        return Command::SUCCESS;
    }
}
