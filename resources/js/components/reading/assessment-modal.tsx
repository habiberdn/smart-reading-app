import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    HelpCircle,
    FileText,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Sparkles,
    Loader2,
    RefreshCw,
    Award,
    TrendingUp,
    Check,
    Lightbulb,
} from 'lucide-react';

interface QuizOption {
    key: string;
    text: string;
}

interface QuizQuestion {
    id: number;
    assignment_id: number;
    question: string;
    options: QuizOption[];
    correct_answer?: string;
    explanation?: string;
    order: number;
}

interface QuizAttempt {
    id: number;
    score: number | string;
    total_questions: number;
    correct_count: number;
    answers?: Record<string, {
        question_id: number;
        question_text: string;
        selected_key: string;
        correct_key: string;
        is_correct: boolean;
        explanation?: string;
    }>;
    completed_at?: string;
}

interface ReadingSummaryData {
    id: number;
    summary_text: string;
    word_count: number;
    overall_score: number | string;
    rubric_scores?: {
        comprehension?: number;
        factual_accuracy?: number;
        coherence?: number;
        originality?: number;
    };
    ai_feedback?: string;
    strengths?: string[];
    improvements?: string[];
    submitted_at?: string;
}

interface AssessmentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assignmentId: number | string;
    assignmentTitle: string;
    isDosen?: boolean;
}

export function AssessmentModal({
    open,
    onOpenChange,
    assignmentId,
    assignmentTitle,
    isDosen = false,
}: AssessmentModalProps) {
    const [activeTab, setActiveTab] = useState<'quiz' | 'summary'>('quiz');
    const [isLoading, setIsLoading] = useState(false);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [latestAttempt, setLatestAttempt] = useState<QuizAttempt | null>(null);
    const [latestSummary, setLatestSummary] = useState<ReadingSummaryData | null>(null);

    // Quiz form state
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
    const [isRetakingQuiz, setIsRetakingQuiz] = useState(false);

    // Summary form state
    const [summaryText, setSummaryText] = useState('');
    const [isSubmittingSummary, setIsSubmittingSummary] = useState(false);
    const [isEditingSummary, setIsEditingSummary] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const wordCount = summaryText.trim() ? summaryText.trim().split(/\s+/).length : 0;

    // Load data from server
    const fetchAssessmentData = async () => {
        setIsLoading(true);
        setErrorMsg(null);
        try {
            const res = await fetch(`/read/${assignmentId}/assessment`);
            const data = await res.json();
            if (data.success) {
                setQuestions(data.questions || []);
                setLatestAttempt(data.latest_attempt || null);
                setLatestSummary(data.latest_summary || null);

                if (data.latest_summary?.summary_text && !summaryText) {
                    setSummaryText(data.latest_summary.summary_text);
                }
            }
        } catch (err) {
            console.error('Failed to load assessment data:', err);
            setErrorMsg('Gagal memuat data asesmen. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchAssessmentData();
        }
    }, [open, assignmentId]);

    // Handle submit quiz
    const handleSubmitQuiz = async () => {
        const unanswered = questions.filter((q) => !userAnswers[q.id]);
        if (unanswered.length > 0) {
            if (!confirm(`Masih ada ${unanswered.length} soal yang belum dijawab. Yakin ingin mengumpulkan kuis?`)) {
                return;
            }
        }

        setIsSubmittingQuiz(true);
        setErrorMsg(null);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch(`/read/${assignmentId}/quiz/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ answers: userAnswers }),
            });

            const data = await res.json();
            if (data.success) {
                setLatestAttempt(data.attempt);
                if (data.questions) {
                    setQuestions(data.questions);
                }
                setIsRetakingQuiz(false);
            } else {
                setErrorMsg(data.message || 'Gagal mengirim jawaban kuis.');
            }
        } catch (err) {
            console.error('Error submitting quiz:', err);
            setErrorMsg('Terjadi kesalahan koneksi saat mengirim jawaban kuis.');
        } finally {
            setIsSubmittingQuiz(false);
        }
    };

    // Handle submit summary for AI evaluation
    const handleSubmitSummary = async () => {
        if (wordCount < 30) {
            setErrorMsg('Ringkasan minimal berisi 30 kata agar evaluasi AI dapat menilai dengan akurat.');
            return;
        }

        setIsSubmittingSummary(true);
        setErrorMsg(null);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch(`/read/${assignmentId}/summary/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ summary_text: summaryText }),
            });

            const data = await res.json();
            if (data.success) {
                setLatestSummary(data.summary);
                setIsEditingSummary(false);
            } else {
                setErrorMsg(data.message || 'Gagal mengevaluasi ringkasan.');
            }
        } catch (err) {
            console.error('Error submitting summary:', err);
            setErrorMsg('Terjadi kesalahan koneksi saat mengirim ringkasan.');
        } finally {
            setIsSubmittingSummary(false);
        }
    };

    const hasAttemptedQuiz = !!latestAttempt && !isRetakingQuiz;
    const hasSummaryFeedback = !!latestSummary && !isEditingSummary;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] w-[95vw] max-w-3xl overflow-y-auto p-4 sm:p-6 sm:max-h-[85vh]">
                <DialogHeader className="border-b pb-3 sm:pb-4 text-left">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1 border-primary/30 text-primary text-[10px] sm:text-xs">
                            <Sparkles className="h-3 w-3 shrink-0" /> Asesmen Pembelajaran AI
                        </Badge>
                    </div>
                    <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                        Uji Pemahaman & Ringkasan Bacaan
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
                        Materi: <span className="font-semibold text-foreground">{assignmentTitle}</span>
                    </DialogDescription>
                </DialogHeader>

                {errorMsg && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs sm:text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-3 text-xs sm:text-sm">Menyiapkan butir asesmen & evaluasi...</p>
                    </div>
                ) : (
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-auto p-1">
                            <TabsTrigger value="quiz" className="flex items-center justify-center gap-1 sm:gap-2 py-2 px-1 text-xs font-semibold sm:text-sm">
                                <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                <span className="hidden sm:inline">Kuis Pilihan Ganda</span>
                                <span className="sm:hidden">Kuis</span>
                                {latestAttempt && (
                                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] shrink-0 font-bold">
                                        {Math.round(Number(latestAttempt.score))}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="summary" className="flex items-center justify-center gap-1 sm:gap-2 py-2 px-1 text-xs font-semibold sm:text-sm">
                                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                <span className="hidden sm:inline">Evaluasi Ringkasan AI</span>
                                <span className="sm:hidden">Ringkasan</span>
                                {latestSummary && (
                                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] shrink-0 font-bold">
                                        {Math.round(Number(latestSummary.overall_score))}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        {/* ================= TAB 1: KUIS PILIHAN GANDA ================= */}
                        <TabsContent value="quiz" className="mt-4 space-y-5">
                            {questions.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                                    <HelpCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                                    Belum ada soal kuis yang digenerate untuk materi ini.
                                </div>
                            ) : hasAttemptedQuiz ? (
                                /* INSTANT FEEDBACK KUIS */
                                <div className="space-y-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shrink-0">
                                                <Award className="h-5 w-5 sm:h-6 sm:w-6" />
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                                    <h4 className="text-sm sm:text-base font-bold text-foreground">Hasil Kuis Selesai</h4>
                                                    <Badge className="bg-emerald-600 text-white text-[10px] sm:text-xs">Instant Feedback</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {latestAttempt?.correct_count} dari {latestAttempt?.total_questions} soal dijawab dengan benar.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between w-full sm:w-auto sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0">
                                            <span className="text-xs font-medium text-muted-foreground sm:block">Skor Anda</span>
                                            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                                {Math.round(Number(latestAttempt?.score))}<span className="text-sm font-semibold text-muted-foreground">/100</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-foreground">Pembahasan & Penjelasan Butir Soal:</h4>
                                        {questions.map((q, idx) => {
                                            const savedAns = latestAttempt?.answers?.[q.id];
                                            const userKey = savedAns ? savedAns.selected_key : (userAnswers[q.id] || '-');
                                            const correctKey = q.correct_answer || savedAns?.correct_key || 'A';
                                            const isCorrect = userKey.toUpperCase() === correctKey.toUpperCase();

                                            return (
                                                <div
                                                    key={q.id}
                                                    className={`rounded-lg border p-3.5 sm:p-4 transition-colors ${
                                                        isCorrect
                                                            ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/10'
                                                            : 'border-destructive/20 bg-destructive/5 dark:border-destructive/30 dark:bg-destructive/10'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <span className="text-xs font-bold text-muted-foreground">
                                                            Soal #{idx + 1}
                                                        </span>
                                                        {isCorrect ? (
                                                            <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                                                                <CheckCircle2 className="h-3 w-3" /> Benar
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 rounded bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                                                                <XCircle className="h-3 w-3" /> Salah
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="mt-2 text-xs sm:text-sm font-semibold text-foreground">
                                                        {q.question}
                                                    </p>

                                                    <div className="mt-3 grid gap-2">
                                                        {q.options.map((opt) => {
                                                            const isThisCorrect = opt.key.toUpperCase() === correctKey.toUpperCase();
                                                            const isThisUser = opt.key.toUpperCase() === userKey.toUpperCase();

                                                            let optStyle = 'border-border bg-background/50 text-foreground';
                                                            if (isThisCorrect) {
                                                                optStyle = 'border-emerald-500 bg-emerald-100/60 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200 font-semibold';
                                                            } else if (isThisUser && !isThisCorrect) {
                                                                optStyle = 'border-destructive bg-destructive/15 text-destructive font-medium';
                                                            }

                                                            return (
                                                                <div
                                                                    key={opt.key}
                                                                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2.5 rounded-md border p-2.5 text-xs ${optStyle}`}
                                                                >
                                                                    <div className="flex items-start gap-2 min-w-0">
                                                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-bold mt-0.5 sm:mt-0">
                                                                            {opt.key}
                                                                        </span>
                                                                        <span className="break-words leading-relaxed">{opt.text}</span>
                                                                    </div>
                                                                    {isThisCorrect && (
                                                                        <span className="self-end sm:self-auto shrink-0 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                                                                            Kunci Jawaban
                                                                        </span>
                                                                    )}
                                                                    {isThisUser && !isThisCorrect && (
                                                                        <span className="self-end sm:self-auto shrink-0 text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                                                                            Pilihan Anda
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {q.explanation && (
                                                        <div className="mt-3 flex items-start gap-2 rounded-md bg-muted/60 p-2.5 text-xs text-muted-foreground">
                                                            <Lightbulb className="h-4 w-4 shrink-0 text-amber-500" />
                                                            <div>
                                                                <span className="font-semibold text-foreground">Dasar Jawaban Teks: </span>
                                                                {q.explanation}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2 border-t">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setUserAnswers({});
                                                setIsRetakingQuiz(true);
                                            }}
                                            className="gap-1.5 text-xs"
                                        >
                                            <RefreshCw className="h-3.5 w-3.5" /> Kerjakan Ulang Kuis
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                /* FORM PENGERJAAN KUIS */
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Jawab seluruh pertanyaan pilihan ganda di bawah ini:</span>
                                        <span className="font-semibold text-primary">
                                            {Object.keys(userAnswers).length} dari {questions.length} dijawab
                                        </span>
                                    </div>

                                    {questions.map((q, idx) => (
                                        <div key={q.id} className="rounded-lg border bg-card p-4 shadow-2xs">
                                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                                <Badge variant="secondary" className="text-[10px]">
                                                    No. {idx + 1}
                                                </Badge>
                                            </div>
                                            <p className="mt-2 text-sm font-semibold text-foreground">
                                                {q.question}
                                            </p>

                                            <div className="mt-3 grid gap-2">
                                                {q.options.map((opt) => {
                                                    const isSelected = userAnswers[q.id] === opt.key;
                                                    return (
                                                        <button
                                                            key={opt.key}
                                                            type="button"
                                                            onClick={() =>
                                                                setUserAnswers((prev) => ({
                                                                    ...prev,
                                                                    [q.id]: opt.key,
                                                                }))
                                                            }
                                                            className={`flex items-start gap-3 rounded-md border p-3 text-left text-xs transition-colors min-h-[44px] ${
                                                                isSelected
                                                                    ? 'border-primary bg-primary/10 font-semibold text-primary'
                                                                    : 'border-border bg-background hover:bg-muted/50 text-foreground'
                                                            }`}
                                                        >
                                                            <span
                                                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5 ${
                                                                    isSelected
                                                                        ? 'bg-primary text-primary-foreground'
                                                                        : 'bg-muted text-muted-foreground'
                                                                }`}
                                                            >
                                                                {opt.key}
                                                            </span>
                                                            <span className="flex-1 break-words leading-relaxed">{opt.text}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex items-center justify-between border-t pt-4">
                                        {latestAttempt && isRetakingQuiz && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsRetakingQuiz(false)}
                                                className="text-xs"
                                            >
                                                Batal & Lihat Skor Sebelumnya
                                            </Button>
                                        )}
                                        <Button
                                            onClick={handleSubmitQuiz}
                                            disabled={isSubmittingQuiz}
                                            className="ml-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            {isSubmittingQuiz ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Menilai Jawaban...
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="h-4 w-4" />
                                                    Kirim Jawaban Kuis
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* ================= TAB 2: EVALUASI RINGKASAN AI ================= */}
                        <TabsContent value="summary" className="mt-4 space-y-5">
                            {hasSummaryFeedback ? (
                                /* INSTANT FEEDBACK RINGKASAN */
                                <div className="space-y-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm shrink-0">
                                                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                                    <h4 className="text-sm sm:text-base font-bold text-foreground">Evaluasi AI Selesai</h4>
                                                    <Badge className="gap-1 bg-primary text-primary-foreground text-[10px] sm:text-xs">
                                                        <Sparkles className="h-3 w-3" /> Analisis Gemini
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Panjang ringkasan: {latestSummary?.word_count} kata
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between w-full sm:w-auto sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0">
                                            <span className="text-xs font-medium text-muted-foreground sm:block">Skor Akhir Ringkasan</span>
                                            <div className="text-2xl font-black text-primary">
                                                {Math.round(Number(latestSummary?.overall_score))}<span className="text-sm font-semibold text-muted-foreground">/100</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4 Rubrik Penilaian */}
                                    {latestSummary?.rubric_scores && (
                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                            <div className="rounded-lg border bg-card p-3 text-center shadow-2xs">
                                                <span className="text-[11px] font-medium text-muted-foreground">Pemahaman (35%)</span>
                                                <div className="mt-1 text-lg font-bold text-foreground">
                                                    {latestSummary.rubric_scores.comprehension ?? 0}%
                                                </div>
                                            </div>
                                            <div className="rounded-lg border bg-card p-3 text-center shadow-2xs">
                                                <span className="text-[11px] font-medium text-muted-foreground">Akurasi Fakta (30%)</span>
                                                <div className="mt-1 text-lg font-bold text-foreground">
                                                    {latestSummary.rubric_scores.factual_accuracy ?? 0}%
                                                </div>
                                            </div>
                                            <div className="rounded-lg border bg-card p-3 text-center shadow-2xs">
                                                <span className="text-[11px] font-medium text-muted-foreground">Koherensi (20%)</span>
                                                <div className="mt-1 text-lg font-bold text-foreground">
                                                    {latestSummary.rubric_scores.coherence ?? 0}%
                                                </div>
                                            </div>
                                            <div className="rounded-lg border bg-card p-3 text-center shadow-2xs">
                                                <span className="text-[11px] font-medium text-muted-foreground">Originalitas (15%)</span>
                                                <div className="mt-1 text-lg font-bold text-foreground">
                                                    {latestSummary.rubric_scores.originality ?? 0}%
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Ulasan Naratif AI */}
                                    {latestSummary?.ai_feedback && (
                                        <div className="rounded-lg border border-primary/20 bg-muted/30 p-4">
                                            <h5 className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                                <Sparkles className="h-4 w-4 text-primary" /> Ulasan Naratif AI:
                                            </h5>
                                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                                                {latestSummary.ai_feedback}
                                            </p>
                                        </div>
                                    )}

                                    {/* Strengths & Improvements */}
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {latestSummary?.strengths && latestSummary.strengths.length > 0 && (
                                            <div className="rounded-lg border border-emerald-500/20 bg-emerald-50/20 p-3.5 dark:bg-emerald-950/10">
                                                <h6 className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> Poin Keunggulan:
                                                </h6>
                                                <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                                                    {latestSummary.strengths.map((str, i) => (
                                                        <li key={i} className="flex items-start gap-1.5">
                                                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                                            <span>{str}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {latestSummary?.improvements && latestSummary.improvements.length > 0 && (
                                            <div className="rounded-lg border border-amber-500/20 bg-amber-50/20 p-3.5 dark:bg-amber-950/10">
                                                <h6 className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                                                    <Lightbulb className="h-3.5 w-3.5" /> Saran Perbaikan:
                                                </h6>
                                                <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                                                    {latestSummary.improvements.map((imp, i) => (
                                                        <li key={i} className="flex items-start gap-1.5">
                                                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                                                            <span>{imp}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Teks Ringkasan Mahasiswa */}
                                    <div className="rounded-lg border p-4 bg-background">
                                        <h6 className="text-xs font-bold text-muted-foreground">Ringkasan Anda:</h6>
                                        <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-foreground/90">
                                            {latestSummary?.summary_text}
                                        </p>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2 border-t">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsEditingSummary(true)}
                                            className="gap-1.5 text-xs"
                                        >
                                            <RefreshCw className="h-3.5 w-3.5" /> Perbaiki & Nilai Ulang Ringkasan
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                /* FORM INPUT RINGKASAN */
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-foreground">
                                            Tuliskan ringkasan pemahaman Anda mengenai dokumen bacaan ini:
                                        </label>
                                        <p className="text-[11px] text-muted-foreground">
                                            Jelaskan ide utama, konsep kunci, dan kesimpulan menggunakan kalimat Anda sendiri. AI akan mengevaluasi berdasarkan kelengkapan pemahaman, akurasi, koherensi, dan originalitas.
                                        </p>
                                    </div>

                                    <Textarea
                                        value={summaryText}
                                        onChange={(e) => setSummaryText(e.target.value)}
                                        placeholder="Tulis ringkasan Anda di sini (minimal 30 kata)..."
                                        rows={8}
                                        className="resize-y text-xs sm:text-sm"
                                    />

                                    <div className="flex items-center justify-between text-xs">
                                        <span className={`font-medium ${wordCount < 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            Jumlah kata: {wordCount} {wordCount < 30 ? '(minimal 30 kata)' : '✓ Memenuhi syarat'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between border-t pt-4">
                                        {latestSummary && isEditingSummary && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsEditingSummary(false)}
                                                className="text-xs"
                                            >
                                                Batal & Lihat Hasil Sebelumnya
                                            </Button>
                                        )}
                                        <Button
                                            onClick={handleSubmitSummary}
                                            disabled={isSubmittingSummary || wordCount < 30}
                                            className="ml-auto gap-2 bg-primary text-primary-foreground"
                                        >
                                            {isSubmittingSummary ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Mengevaluasi dengan AI...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="h-4 w-4" />
                                                    Kirim untuk Evaluasi AI
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
}
