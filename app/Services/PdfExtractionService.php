<?php

namespace App\Services;

use Smalot\PdfParser\Parser;

class PdfExtractionService
{
    /**
     * Extracts text page-by-page and runs pdfimages to extract images.
     * Inserts inline [IMG:url] tags at page boundaries.
     *
     * @param string $filePath Absolute path to the PDF file
     * @return array Array containing extracted content and calculated NLP metrics
     */
    public function extract(string $filePath): array
    {
        if (!file_exists($filePath)) {
            return [
                'content' => '',
                'word_count' => 0,
                'sentence_count' => 0,
                'average_sentence_length' => 0.0,
                'technical_word_count' => 0,
            ];
        }

        try {
            $parser = new Parser();
            $pdf = $parser->parseFile($filePath);
            $pages = $pdf->getPages();
            
            $pdfBasename = pathinfo($filePath, PATHINFO_FILENAME);
            $imageSubdir = "assignments/images/{$pdfBasename}";
            $imagePublicPath = storage_path("app/public/{$imageSubdir}");
            
            if (!file_exists($imagePublicPath)) {
                mkdir($imagePublicPath, 0755, true);
            }

            $combinedContent = '';
            
            foreach ($pages as $index => $page) {
                $p = $index + 1;
                $pageText = $page->getText();
                
                // Sanitize UTF-8 first
                $pageText = @iconv('UTF-8', 'UTF-8//IGNORE', $pageText) ?: $pageText;
                $pageText = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $pageText);
                $pageText = preg_replace('/\r\n|\r/', "\n", $pageText);
                $pageText = preg_replace('/[ \t]+/', ' ', $pageText);
                $pageText = preg_replace('/\n{3,}/', "\n\n", $pageText);
                $pageText = trim($pageText);
                
                // Extract images for this specific page
                $command = "pdfimages -png -f {$p} -l {$p} " . escapeshellarg($filePath) . " " . escapeshellarg("{$imagePublicPath}/page-{$p}");
                shell_exec($command);
                
                // Find all generated images for this page
                $images = glob("{$imagePublicPath}/page-{$p}-*.png");
                
                if (!empty($images)) {
                    natsort($images);
                    $imageTags = "";
                    foreach ($images as $imagePath) {
                        $filename = basename($imagePath);
                        $url = asset("storage/{$imageSubdir}/{$filename}");
                        $imageTags .= "\n\n[IMG:{$url}]";
                    }
                    if ($pageText) {
                        $pageText .= $imageTags;
                    } else {
                        $pageText = trim($imageTags);
                    }
                }
                
                if ($pageText) {
                    $combinedContent .= $pageText . "\n\n";
                }
            }
            
            $text = trim($combinedContent);
            
            // Fallback if extraction yielded too little
            if (mb_strlen($text) < 50) {
                $text = 'Konten PDF tidak dapat diekstrak secara otomatis. Silakan baca file PDF secara langsung.';
            }
            
            // Final safety net: replace any remaining invalid sequences
            $clean = @iconv('UTF-8', 'UTF-8//IGNORE//TRANSLIT', $text);
            $text = $clean !== false ? $clean : $text;

        } catch (\Exception $e) {
            $text = '';
        }

        // Metrics calculations
        // Remove image tags from metrics to avoid skewing word/sentence counts
        $textForMetrics = preg_replace('/\[IMG:[^\]]+\]/', '', $text);
        
        $wordArray = @preg_split('/\s+/u', trim($textForMetrics), -1, PREG_SPLIT_NO_EMPTY);
        if ($wordArray === false) {
            $wordArray = preg_split('/\s+/', trim($textForMetrics), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        }
        $wordCount = count($wordArray);

        $sentenceArray = @preg_split('/[.!?]+/u', $textForMetrics, -1, PREG_SPLIT_NO_EMPTY);
        if ($sentenceArray === false) {
            $sentenceArray = preg_split('/[.!?]+/', $textForMetrics, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        }
        $sentenceCount = max(1, count($sentenceArray));

        $averageSentenceLength = round($wordCount / $sentenceCount, 1);

        $words = @preg_split('/\s+/u', strtolower($textForMetrics));
        if ($words === false) {
            $words = preg_split('/\s+/', strtolower($textForMetrics)) ?: [];
        }
        
        $technicalKeywords = ['programming', 'database', 'system', 'analysis', 'literature', 'parameter', 'framework', 'controller', 'migration', 'application', 'technology', 'academic', 'scientific', 'methods', 'research', 'algorithm', 'function', 'structure', 'development', 'software', 'hardware', 'network', 'security', 'protocol', 'interface'];
        $technicalWordCount = 0;
        foreach ($words as $w) {
            $w = trim($w, '.,()[]{}!?"\';:');
            if (mb_strlen($w) > 8 || in_array($w, $technicalKeywords)) {
                $technicalWordCount++;
            }
        }

        return [
            'content' => $text,
            'word_count' => $wordCount,
            'sentence_count' => $sentenceCount,
            'average_sentence_length' => $averageSentenceLength,
            'technical_word_count' => $technicalWordCount,
        ];
    }
}
