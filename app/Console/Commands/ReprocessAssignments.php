<?php

namespace App\Console\Commands;

use App\Models\ReadingAssignment;
use Illuminate\Console\Command;
use Smalot\PdfParser\Parser;

class ReprocessAssignments extends Command
{
    protected $signature = 'assignments:reprocess';

    protected $description = 'Re-extract text from all existing PDF assignments using smalot/pdfparser';

    public function handle()
    {
        $assignments = ReadingAssignment::whereNotNull('file_path')->get();

        if ($assignments->isEmpty()) {
            $this->info('No assignments found to reprocess.');

            return 0;
        }

        $this->info("Reprocessing {$assignments->count()} assignment(s)...");

        $bar = $this->output->createProgressBar($assignments->count());

        foreach ($assignments as $assignment) {
            $fullPath = storage_path('app/public/'.$assignment->file_path);

            if (! file_exists($fullPath)) {
                $this->warn("  File not found: {$assignment->file_path}, skipping.");
                $bar->advance();

                continue;
            }

            try {
                $extractor = new \App\Services\PdfExtractionService();
                $extraction = $extractor->extract($fullPath);

                $text = $extraction['content'];
                $wordCount = $extraction['word_count'];
                $sentenceCount = $extraction['sentence_count'];
                $averageSentenceLength = $extraction['average_sentence_length'];
                $technicalWordCount = $extraction['technical_word_count'];

                $totalHalaman = max(1, ceil($wordCount / 250));
                $tingkatKesulitan = 'easy';
                $difficultyScore = 15;

                if ($totalHalaman > 5) {
                    $tingkatKesulitan = 'medium';
                    $difficultyScore = 50;
                }
                if ($totalHalaman > 15) {
                    $tingkatKesulitan = 'hard';
                    $difficultyScore = 85;
                }

                $assignment->update([
                    'content' => $text,
                    'word_count' => $wordCount,
                    'sentence_count' => $sentenceCount,
                    'average_sentence_length' => $averageSentenceLength,
                    'technical_word_count' => $technicalWordCount,
                    'difficulty_score' => $difficultyScore,
                    'tingkat_kesulitan' => $tingkatKesulitan,
                    'total_halaman' => $totalHalaman,
                    'estimasi_durasi' => max(1, ceil($wordCount / 200)),
                ]);
            } catch (\Exception $e) {
                $this->error("  Error processing {$assignment->judul}: {$e->getMessage()}");
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('All assignments reprocessed successfully!');

        return 0;
    }
}
