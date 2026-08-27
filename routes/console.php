<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('assignments:sync-pages', function () {
    $assignments = \App\Models\ReadingAssignment::all();
    $parser = new \Smalot\PdfParser\Parser();
    $count = 0;

    foreach ($assignments as $assignment) {
        if ($assignment->file_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($assignment->file_path)) {
            try {
                $fullPath = \Illuminate\Support\Facades\Storage::disk('public')->path($assignment->file_path);
                $pdf = $parser->parseFile($fullPath);
                $pages = count($pdf->getPages());

                if ($pages === 0) {
                    $raw = @file_get_contents($fullPath);
                    if ($raw) {
                        $pages = preg_match_all("/\/Type\s*\/Page\b/", $raw, $m) ?: 1;
                    }
                }

                if ($pages > 0) {
                    $assignment->total_halaman = $pages;
                    $assignment->saveQuietly();
                    $this->info("Updated '{$assignment->judul}' (ID: {$assignment->id}) -> {$pages} halaman");
                    $count++;
                }
            } catch (\Throwable $e) {
                $this->warn("Gagal update ID {$assignment->id}: " . $e->getMessage());
            }
        }
    }

    $this->info("Selesai! {$count} tugas berhasil disinkronkan jumlah halamannya.");
})->purpose('Sinkronkan jumlah total halaman PDF fisik dengan database');
