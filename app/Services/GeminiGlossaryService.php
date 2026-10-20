<?php

namespace App\Services;

use App\Models\GlossaryTerm;
use App\Models\ReadingAssignment;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiGlossaryService
{
    /**
     * Ekstrak istilah akademik dari bacaan tugas menggunakan Gemini API
     * dan simpan ke database tabel glossary_terms.
     */
    public function extractAndStore(ReadingAssignment $assignment): Collection
    {
        $rawText = $assignment->content ?? '';
        $cleanText = preg_replace('/\[IMG:[^\]]+\]/', '', $rawText);
        $cleanText = trim($cleanText);

        if (mb_strlen($cleanText) < 30) {
            return collect();
        }

        $apiKey = config('services.gemini.api_key');
        $model = config('services.gemini.model', 'gemini-1.5-flash');

        $extractedData = [];

        if (!empty($apiKey)) {
            $extractedData = $this->callGeminiApi($cleanText, $apiKey, $model);
        }

        // Jika API key belum diset atau panggilan API gagal/kosong, gunakan fallback offline parser
        if (empty($extractedData)) {
            $extractedData = $this->fallbackExtraction($cleanText);
        }

        if (empty($extractedData)) {
            return collect();
        }

        // Hapus istilah lama untuk assignment ini agar terbarui
        $assignment->glossaryTerms()->delete();

        $savedTerms = collect();
        $lowerText = strtolower($cleanText);

        foreach ($extractedData as $item) {
            $term = trim($item['term'] ?? '');
            $definition = trim($item['definition'] ?? '');
            if (!$term || !$definition) {
                continue;
            }

            $category = !empty($item['category']) ? trim($item['category']) : 'Istilah Akademik';
            $context = !empty($item['context_sentence']) ? trim($item['context_sentence']) : null;

            // Hitung frekuensi kemunculan kata dalam teks
            $termLower = strtolower($term);
            $frequency = max(1, substr_count($lowerText, $termLower));

            $saved = GlossaryTerm::create([
                'assignment_id'    => $assignment->id,
                'term'             => $term,
                'definition'       => $definition,
                'category'         => $category,
                'context_sentence' => $context,
                'frequency'        => $frequency,
            ]);

            $savedTerms->push($saved);
        }

        return $savedTerms;
    }

    /**
     * Memanggil Google Gemini GenerateContent API dengan response JSON terstruktur.
     */
    protected function callGeminiApi(string $text, string $apiKey, string $model): array
    {
        // Batasi teks maksimal 40.000 karakter untuk efisiensi request dan kecepatan respons
        $sampleText = mb_substr($text, 0, 40000);

        $prompt = <<<EOT
Anda adalah asisten akademik cerdas untuk aplikasi membaca pintar mahasiswa.
Analisis teks bacaan ilmiah/akademik berikut dan ekstrak istilah-istilah ilmiah/akademik penting (antara 15 hingga 35 istilah kunci yang paling relevan dengan materi dokumen).

Untuk setiap istilah yang diekstrak, sertakan:
1. "term": Nama istilah baku (kata tunggal atau frasa ilmiah, contoh: "Convolutional Neural Network", "Validitas", "Gaze Tracking", "Hipotesis").
2. "category": Kategori bidang/fungsi (contoh: "Metodologi", "Kecerdasan Buatan", "Statistik", "Biometri", "Teori Dasar", "Teknis").
3. "definition": Makna/penjelasan singkat, padat, dan ramah pembaca dalam Bahasa Indonesia yang disesuaikan dengan konteks pemakaian di teks ini (1-2 kalimat).
4. "context_sentence": Satu kutipan kalimat asli dari teks tempat istilah tersebut muncul atau digunakan.

Keluarkan HANYA array objek JSON valid sesuai format ini tanpa teks pembuka/penutup lainnya:
[
  {
    "term": "Istilah",
    "category": "Kategori",
    "definition": "Penjelasan kontekstual...",
    "context_sentence": "Kalimat dari teks..."
  }
]

Teks Dokumen:
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
                        'temperature' => 0.2,
                    ]
                ]);

            if (!$response->successful()) {
                Log::warning('Gemini API glossary extraction failed: ' . $response->body());
                return [];
            }

            $jsonResponse = $response->json();
            $rawJson = $jsonResponse['candidates'][0]['content']['parts'][0]['text'] ?? '';

            if (empty($rawJson)) {
                return [];
            }

            // Clean markdown code blocks if any
            $cleanedJson = preg_replace('/^```(?:json)?\s*|\s*```$/m', '', trim($rawJson));
            $parsed = json_decode($cleanedJson, true);

            return is_array($parsed) ? $parsed : [];
        } catch (\Throwable $e) {
            Log::error('Error calling Gemini API for glossary: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Fallback cerdas jika API Gemini belum diisi atau sedang offline:
     * Mendeteksi istilah akademik umum dari daftar istilah cerdas & mengambil kalimat sekitarnya.
     */
    protected function fallbackExtraction(string $text): array
    {
        $dictionary = [
            'eye tracking' => [
                'term' => 'Eye Tracking',
                'category' => 'Biometri & Sensor',
                'definition' => 'Teknologi pengukuran aktivitas mata untuk mengetahui titik pandangan (gaze) dan pergerakan bola mata seseorang.'
            ],
            'gaze tracking' => [
                'term' => 'Gaze Tracking',
                'category' => 'Biometri & Sensor',
                'definition' => 'Metode penentuan arah pandang mata secara real-time terhadap layar atau objek.'
            ],
            'fixation' => [
                'term' => 'Fixation',
                'category' => 'Psikologi & Biometri',
                'definition' => 'Kondisi saat mata berhenti bergerak dan memusatkan fokus pada suatu titik visual tertentu untuk memproses informasi.'
            ],
            'saccade' => [
                'term' => 'Saccade',
                'category' => 'Biometri & Gerak Mata',
                'definition' => 'Gerakan cepat dan mendadak bola mata antara satu titik fiksasi ke titik fiksasi lainnya.'
            ],
            'deep learning' => [
                'term' => 'Deep Learning',
                'category' => 'Kecerdasan Buatan',
                'definition' => 'Subbidang pembelajaran mesin (machine learning) yang menggunakan arsitektur jaringan saraf tiruan berlapis (deep neural networks).'
            ],
            'convolutional neural network' => [
                'term' => 'Convolutional Neural Network',
                'category' => 'Kecerdasan Buatan',
                'definition' => 'Arsitektur deep learning yang dirancang khusus untuk memproses dan mengenali pola pada data visual atau citra.'
            ],
            'machine learning' => [
                'term' => 'Machine Learning',
                'category' => 'Kecerdasan Buatan',
                'definition' => 'Sistem komputasi yang mampu belajar dari data dan meningkatkan akurasinya secara otomatis tanpa diprogram eksplisit.'
            ],
            'artificial intelligence' => [
                'term' => 'Artificial Intelligence',
                'category' => 'Kecerdasan Buatan',
                'definition' => 'Simulasi kecerdasan manusia yang dimodelkan dalam mesin komputer untuk melakukan tugas penalaran, pembelajaran, dan persepsi.'
            ],
            'neural network' => [
                'term' => 'Neural Network',
                'category' => 'Kecerdasan Buatan',
                'definition' => 'Model komputasi yang terinspirasi dari struktur jaringan saraf biologis otak manusia.'
            ],
            'benchmark' => [
                'term' => 'Benchmark',
                'category' => 'Metodologi & Pengujian',
                'definition' => 'Tolok ukur atau standar referensi yang digunakan untuk mengukur dan membandingkan performa model atau sistem.'
            ],
            'validitas' => [
                'term' => 'Validitas',
                'category' => 'Metodologi Penelitian',
                'definition' => 'Tingkat ketepatan dan kesahihan alat ukur penelitian dalam mengukur apa yang seharusnya diukur.'
            ],
            'reliabilitas' => [
                'term' => 'Reliabilitas',
                'category' => 'Metodologi Penelitian',
                'definition' => 'Konsistensi dan kestabilan hasil pengukuran instrumen penelitian jika diuji berulang kali.'
            ],
            'hipotesis' => [
                'term' => 'Hipotesis',
                'category' => 'Metodologi Penelitian',
                'definition' => 'Dugaan sementara atau proposisi yang perlu diuji kebenarannya melalui analisis empiris.'
            ],
            'variabel' => [
                'term' => 'Variabel',
                'category' => 'Metodologi Penelitian',
                'definition' => 'Karakteristik, atribut, atau objek yang nilainya dapat bervariasi dan diamati dalam suatu penelitian.'
            ],
            'korelasi' => [
                'term' => 'Korelasi',
                'category' => 'Statistik',
                'definition' => 'Ukuran hubungan statistik timbal balik antara dua variabel atau lebih.'
            ],
            'signifikansi' => [
                'term' => 'Signifikansi',
                'category' => 'Statistik',
                'definition' => 'Tingkat kepastian bahwa hasil analisis data bukan terjadi secara kebetulan semata.'
            ],
            'kuantitatif' => [
                'term' => 'Kuantitatif',
                'category' => 'Metodologi Penelitian',
                'definition' => 'Pendekatan penelitian yang berlandaskan pengukuran numerik dan analisis data statistik.'
            ],
            'kualitatif' => [
                'term' => 'Kualitatif',
                'category' => 'Metodologi Penelitian',
                'definition' => 'Pendekatan penelitian eksploratif yang bertujuan memahami fenomena, makna, dan perspektif mendalam.'
            ],
            'empiris' => [
                'term' => 'Empiris',
                'category' => 'Metodologi Penelitian',
                'definition' => 'Berdasarkan pengalaman langsung, bukti faktual, atau pengamatan nyata di lapangan.'
            ],
            'metodologi' => [
                'term' => 'Metodologi',
                'category' => 'Metodologi Penelitian',
                'definition' => 'Sistem prosedur, aturan, dan postulat yang terstruktur untuk melakukan penyelidikan ilmiah.'
            ],
            'paradigma' => [
                'term' => 'Paradigma',
                'category' => 'Teori Dasar',
                'definition' => 'Kerangka berpikir atau cara pandang fundamental yang menjadi landasan teoritis suatu disiplin ilmu.'
            ],
        ];

        $results = [];
        $lowerText = strtolower($text);

        // Ekstrak kalimat dari teks untuk context_sentence
        $sentences = preg_split('/(?<=[.?!])\s+/u', $text, -1, PREG_SPLIT_NO_EMPTY) ?: [];

        foreach ($dictionary as $keyword => $info) {
            if (str_contains($lowerText, $keyword)) {
                $contextSentence = null;
                foreach ($sentences as $sentence) {
                    if (stripos($sentence, $keyword) !== false) {
                        $contextSentence = trim($sentence);
                        if (mb_strlen($contextSentence) > 200) {
                            $contextSentence = mb_substr($contextSentence, 0, 197) . '...';
                        }
                        break;
                    }
                }

                $results[] = [
                    'term'             => $info['term'],
                    'category'         => $info['category'],
                    'definition'       => $info['definition'],
                    'context_sentence' => $contextSentence,
                ];
            }
        }

        return $results;
    }
}
