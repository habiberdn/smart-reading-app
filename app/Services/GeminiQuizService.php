<?php

namespace App\Services;

use App\Models\QuizQuestion;
use App\Models\ReadingAssignment;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiQuizService
{
    /**
     * Generate kuis pilihan ganda dari teks materi bacaan menggunakan Google Gemini API
     * dan simpan ke database tabel quiz_questions.
     */
    public function generateAndStore(ReadingAssignment $assignment, int $questionCount = 5): Collection
    {
        $rawText = $assignment->content ?? '';
        $cleanText = preg_replace('/\[IMG:[^\]]+\]/', '', $rawText);
        $cleanText = trim($cleanText);

        if (mb_strlen($cleanText) < 50) {
            return collect();
        }

        $apiKey = config('services.gemini.api_key');
        $model = config('services.gemini.model', 'gemini-1.5-flash');

        $questionsData = [];

        if (!empty($apiKey)) {
            $questionsData = $this->callGeminiApi($cleanText, $assignment->judul, $apiKey, $model, $questionCount);
        }

        // Jika API key tidak ada atau gagal, gunakan generator fallback berbasis teks
        if (empty($questionsData)) {
            $questionsData = $this->fallbackGeneration($cleanText, $assignment->judul, $questionCount);
        }

        if (empty($questionsData)) {
            return collect();
        }

        // Hapus soal lama untuk assignment ini jika di-generate ulang
        $assignment->quizQuestions()->delete();

        $savedQuestions = collect();
        $order = 1;

        foreach ($questionsData as $item) {
            $questionText = trim($item['question'] ?? '');
            $options = $item['options'] ?? [];
            $correct = strtoupper(trim($item['correct_answer'] ?? 'A'));
            $explanation = trim($item['explanation'] ?? '');

            if (!$questionText || empty($options) || !in_array($correct, ['A', 'B', 'C', 'D'])) {
                continue;
            }

            // Normalisasi opsi agar terstandarisasi key A, B, C, D
            $normalizedOptions = [];
            foreach ($options as $idx => $opt) {
                if (is_array($opt) && isset($opt['key']) && isset($opt['text'])) {
                    $normalizedOptions[] = [
                        'key' => strtoupper(trim($opt['key'])),
                        'text' => trim($opt['text']),
                    ];
                } elseif (is_string($opt)) {
                    $keys = ['A', 'B', 'C', 'D'];
                    $key = $keys[$idx] ?? chr(65 + $idx);
                    $normalizedOptions[] = [
                        'key' => $key,
                        'text' => trim($opt),
                    ];
                }
            }

            if (count($normalizedOptions) < 2) {
                continue;
            }

            $saved = QuizQuestion::create([
                'assignment_id'  => $assignment->id,
                'question'       => $questionText,
                'options'        => $normalizedOptions,
                'correct_answer' => $correct,
                'explanation'    => $explanation,
                'order'          => $order++,
            ]);

            $savedQuestions->push($saved);
        }

        return $savedQuestions;
    }

    /**
     * Memanggil Google Gemini API untuk membuat butir soal pilihan ganda.
     */
    protected function callGeminiApi(string $text, string $title, string $apiKey, string $model, int $count = 5): array
    {
        $sampleText = mb_substr($text, 0, 40000);

        $prompt = <<<EOT
Anda adalah pakar evaluasi akademik dan penyusun tes perguruan tinggi.
Tugas Anda adalah menyusun {$count} butir soal kuis pilihan ganda (Multiple Choice Questions) berkualitas tinggi berdasarkan materi bacaan berjudul "{$title}".

Panduan Penyusunan Soal:
1. Soal harus relevan, menguji pemahaman konsep kunci, argumen utama, analisis, atau temuan penting dari materi bacaan (tingkat Bloom C2-C4).
2. Setiap butir soal harus memiliki tepat 4 opsi pilihan jawaban: A, B, C, dan D.
3. Pengecoh (distractor) harus masuk akal secara konteks akademik, bukan opsi yang mengada-ada atau terlalu jelas salahnya.
4. Tentukan kunci jawaban yang benar ("correct_answer": "A", "B", "C", atau "D").
5. Sertakan "explanation" yang menjelaskan secara singkat dan jelas dasar kebenaran jawaban tersebut berdasarkan isi teks materi.

Keluarkan HANYA array objek JSON valid tanpa markdown pembungkus lainnya, mengikuti format tepat berikut:
[
  {
    "question": "Pertanyaan soal...",
    "options": [
      {"key": "A", "text": "Pilihan A..."},
      {"key": "B", "text": "Pilihan B..."},
      {"key": "C", "text": "Pilihan C..."},
      {"key": "D", "text": "Pilihan D..."}
    ],
    "correct_answer": "A",
    "explanation": "Penjelasan mengapa opsi tersebut benar berdasarkan materi teks..."
  }
]

Teks Dokumen Sumber:
{$sampleText}
EOT;

        try {
            $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

            $response = Http::timeout(45)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post($endpoint, [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'response_mime_type' => 'application/json',
                        'temperature' => 0.3,
                    ]
                ]);

            if (!$response->successful()) {
                Log::warning('Gemini API quiz generation failed: ' . $response->body());
                return [];
            }

            $jsonResponse = $response->json();
            $rawJson = $jsonResponse['candidates'][0]['content']['parts'][0]['text'] ?? '';

            if (empty($rawJson)) {
                return [];
            }

            $cleanedJson = preg_replace('/^```(?:json)?\s*|\s*```$/m', '', trim($rawJson));
            $parsed = json_decode($cleanedJson, true);

            return is_array($parsed) ? $parsed : [];
        } catch (\Throwable $e) {
            Log::error('Error calling Gemini API for quiz: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Fallback cerdas jika API Gemini belum diset atau offline.
     * Mengambil poin-poin kalimat penting dari teks untuk membuat pertanyaan pemahaman.
     */
    protected function fallbackGeneration(string $text, string $title, int $count = 5): array
    {
        $sentences = preg_split('/(?<=[.?!])\s+/', $text, -1, PREG_SPLIT_NO_EMPTY);
        $candidates = [];

        foreach ($sentences as $s) {
            $s = trim($s);
            $len = mb_strlen($s);
            if ($len >= 40 && $len <= 200 && !preg_match('/^(gambar|tabel|halaman|bab|daftar)/i', $s)) {
                $candidates[] = $s;
            }
        }

        if (count($candidates) < 2) {
            return [
                [
                    'question' => "Berdasarkan materi \"{$title}\", apa fokus utama yang dibahas dalam dokumen ini?",
                    'options' => [
                        ['key' => 'A', 'text' => "Pemahaman konsep mendalam dan penerapan metodologi yang dipaparkan dalam dokumen"],
                        ['key' => 'B', 'text' => "Kritik terhadap seluruh teori literasi yang telah ada sebelumnya"],
                        ['key' => 'C', 'text' => "Daftar referensi kepustakaan tanpa analisis data spesifik"],
                        ['key' => 'D', 'text' => "Laporan administratif yang tidak memuat bahasan ilmiah substantif"]
                    ],
                    'correct_answer' => 'A',
                    'explanation' => "Dokumen berfokus pada pembahasan substantif dan penjelasan materi sesuai tema bacaan."
                ]
            ];
        }

        $questions = [];
        $selectedCount = min($count, count($candidates));
        $keys = array_rand($candidates, $selectedCount);
        if (!is_array($keys)) {
            $keys = [$keys];
        }

        $idx = 1;
        foreach ($keys as $k) {
            $fact = $candidates[$k];
            $questions[] = [
                'question' => "Manakah dari pernyataan berikut yang sesuai dengan isi materi pada \"{$title}\"?",
                'options' => [
                    ['key' => 'A', 'text' => $fact],
                    ['key' => 'B', 'text' => "Topik ini dinyatakan tidak relevan dengan kebutuhan praktis mahasiswa."],
                    ['key' => 'C', 'text' => "Materi mengindikasikan bahwa data yang dikumpulkan sama sekali tidak dapat diuji kebenarannya."],
                    ['key' => 'D', 'text' => "Penulis menolak seluruh pendekatan ilmiah modern dalam analisis topik ini."]
                ],
                'correct_answer' => 'A',
                'explanation' => "Pernyataan pada opsi A diambil langsung dari fakta teks materi: \"{$fact}\""
            ];
            $idx++;
        }

        return $questions;
    }
}
