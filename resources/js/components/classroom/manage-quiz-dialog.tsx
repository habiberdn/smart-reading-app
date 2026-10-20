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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    HelpCircle,
    Plus,
    Pencil,
    Trash2,
    Sparkles,
    Loader2,
    Check,
    X,
    Users,
    Lightbulb,
    CheckCircle2,
    AlertCircle,
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
    correct_answer: string;
    explanation?: string;
    order: number;
}

interface StudentRecap {
    mahasiswa_id: number;
    name: string;
    nim: string;
    quiz_score: number | null;
    quiz_completed: string | null;
    summary_score: number | null;
    summary_submitted: string | null;
    summary_feedback: string | null;
}

interface ManageQuizDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assignmentId: number | string;
    assignmentTitle: string;
}

export function ManageQuizDialog({
    open,
    onOpenChange,
    assignmentId,
    assignmentTitle,
}: ManageQuizDialogProps) {
    const [activeTab, setActiveTab] = useState<'questions' | 'recap'>('questions');
    const [isLoading, setIsLoading] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [studentsRecap, setStudentsRecap] = useState<StudentRecap[]>([]);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Question Editing / Creation State
    const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
    const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
    const [questionForm, setQuestionForm] = useState({
        question: '',
        options: [
            { key: 'A', text: '' },
            { key: 'B', text: '' },
            { key: 'C', text: '' },
            { key: 'D', text: '' },
        ],
        correct_answer: 'A',
        explanation: '',
    });

    const getCsrfToken = () =>
        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

    // Load data
    const loadQuizData = async () => {
        setIsLoading(true);
        setStatusMsg(null);
        try {
            const [qRes, rRes] = await Promise.all([
                fetch(`/read/${assignmentId}/assessment`),
                fetch(`/dosen/assignments/${assignmentId}/assessment-recap`),
            ]);

            const qData = await qRes.json();
            const rData = await rRes.json();

            if (qData.success) {
                setQuestions(qData.questions || []);
            }
            if (rData.success) {
                setStudentsRecap(rData.students || []);
            }
        } catch (err) {
            console.error('Error fetching quiz data:', err);
            setStatusMsg({ type: 'error', text: 'Gagal memuat daftar soal.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            loadQuizData();
            setIsCreatingQuestion(false);
            setEditingQuestionId(null);
        }
    }, [open, assignmentId]);

    // Regenerate via AI
    const handleRegenerate = async () => {
        if (!confirm('Apakah Anda yakin ingin membuat ulang soal kuis menggunakan AI? Soal kuis sebelumnya akan digantikan.')) {
            return;
        }

        setIsRegenerating(true);
        setStatusMsg(null);
        try {
            const res = await fetch(`/dosen/assignments/${assignmentId}/quiz/regenerate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ count: 5 }),
            });
            const data = await res.json();
            if (data.success) {
                setQuestions(data.questions || []);
                setStatusMsg({ type: 'success', text: 'Soal kuis berhasil dibuat ulang oleh AI!' });
            } else {
                setStatusMsg({ type: 'error', text: data.message || 'Gagal membuat ulang kuis.' });
            }
        } catch (err) {
            console.error('Error regenerating quiz:', err);
            setStatusMsg({ type: 'error', text: 'Terjadi kesalahan saat memanggil AI.' });
        } finally {
            setIsRegenerating(false);
        }
    };

    // Save edited question
    const handleSaveEdit = async (id: number) => {
        try {
            const res = await fetch(`/dosen/quiz/questions/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
                body: JSON.stringify(questionForm),
            });
            const data = await res.json();
            if (data.success) {
                setQuestions((prev) => prev.map((q) => (q.id === id ? data.question : q)));
                setEditingQuestionId(null);
                setStatusMsg({ type: 'success', text: 'Soal berhasil diperbarui.' });
            } else {
                setStatusMsg({ type: 'error', text: data.message || 'Gagal menyimpan soal.' });
            }
        } catch (err) {
            console.error('Error saving question:', err);
            setStatusMsg({ type: 'error', text: 'Terjadi kesalahan saat menyimpan perubahan.' });
        }
    };

    // Create new question
    const handleCreateQuestion = async () => {
        if (!questionForm.question.trim()) {
            setStatusMsg({ type: 'error', text: 'Teks pertanyaan wajib diisi.' });
            return;
        }

        try {
            const res = await fetch(`/dosen/assignments/${assignmentId}/quiz/questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
                body: JSON.stringify(questionForm),
            });
            const data = await res.json();
            if (data.success) {
                setQuestions((prev) => [...prev, data.question]);
                setIsCreatingQuestion(false);
                setStatusMsg({ type: 'success', text: 'Soal baru berhasil ditambahkan.' });
                setQuestionForm({
                    question: '',
                    options: [
                        { key: 'A', text: '' },
                        { key: 'B', text: '' },
                        { key: 'C', text: '' },
                        { key: 'D', text: '' },
                    ],
                    correct_answer: 'A',
                    explanation: '',
                });
            } else {
                setStatusMsg({ type: 'error', text: data.message || 'Gagal menambahkan soal.' });
            }
        } catch (err) {
            console.error('Error creating question:', err);
            setStatusMsg({ type: 'error', text: 'Terjadi kesalahan saat menambahkan soal.' });
        }
    };

    // Delete question
    const handleDeleteQuestion = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus butir soal ini?')) {
            return;
        }

        try {
            const res = await fetch(`/dosen/quiz/questions/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
            });
            const data = await res.json();
            if (data.success) {
                setQuestions((prev) => prev.filter((q) => q.id !== id));
                setStatusMsg({ type: 'success', text: 'Soal berhasil dihapus.' });
            } else {
                setStatusMsg({ type: 'error', text: data.message || 'Gagal menghapus soal.' });
            }
        } catch (err) {
            console.error('Error deleting question:', err);
            setStatusMsg({ type: 'error', text: 'Terjadi kesalahan saat menghapus soal.' });
        }
    };

    const startEditing = (q: QuizQuestion) => {
        setIsCreatingQuestion(false);
        setEditingQuestionId(q.id);
        setQuestionForm({
            question: q.question,
            options: q.options || [
                { key: 'A', text: '' },
                { key: 'B', text: '' },
                { key: 'C', text: '' },
                { key: 'D', text: '' },
            ],
            correct_answer: q.correct_answer || 'A',
            explanation: q.explanation || '',
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] w-[95vw] max-w-4xl overflow-y-auto p-4 sm:p-6 sm:max-h-[85vh]">
                <DialogHeader className="border-b pb-3 sm:pb-4 text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <Badge variant="outline" className="w-fit gap-1 border-primary/30 text-primary text-[10px] sm:text-xs">
                            <HelpCircle className="h-3 w-3 shrink-0" /> Manajemen Asesmen & Kuis Dosen
                        </Badge>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRegenerate}
                            disabled={isRegenerating || isLoading}
                            className="w-full sm:w-auto gap-1.5 text-xs text-primary hover:text-primary"
                        >
                            {isRegenerating ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Sparkles className="h-3.5 w-3.5" />
                            )}
                            Buat Ulang via AI (Regenerate)
                        </Button>
                    </div>
                    <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                        Kelola Butir Soal Kuis & Rekap Nilai
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
                        Tugas: <span className="font-semibold text-foreground">{assignmentTitle}</span>
                    </DialogDescription>
                </DialogHeader>

                {statusMsg && (
                    <div
                        className={`flex items-center gap-2 rounded-lg p-3 text-xs ${
                            statusMsg.type === 'success'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-destructive/10 text-destructive border border-destructive/20'
                        }`}
                    >
                        {statusMsg.type === 'success' ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                        ) : (
                            <AlertCircle className="h-4 w-4 shrink-0" />
                        )}
                        <span>{statusMsg.text}</span>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-3 text-xs sm:text-sm">Memuat daftar soal & rekap...</p>
                    </div>
                ) : (
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-auto p-1">
                            <TabsTrigger value="questions" className="flex items-center justify-center gap-1 sm:gap-2 py-2 px-1 text-xs font-semibold sm:text-sm">
                                <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                <span className="hidden sm:inline">Daftar Soal Kuis</span>
                                <span className="sm:hidden">Soal</span>
                                <span className="text-muted-foreground text-[10px] sm:text-xs font-normal">({questions.length})</span>
                            </TabsTrigger>
                            <TabsTrigger value="recap" className="flex items-center justify-center gap-1 sm:gap-2 py-2 px-1 text-xs font-semibold sm:text-sm">
                                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                <span className="hidden sm:inline">Rekap Nilai Mahasiswa</span>
                                <span className="sm:hidden">Rekap Nilai</span>
                                <span className="text-muted-foreground text-[10px] sm:text-xs font-normal">({studentsRecap.length})</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* ================= TAB 1: DAFTAR SOAL ================= */}
                        <TabsContent value="questions" className="mt-4 space-y-4">
                            {!isCreatingQuestion && (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                    <p className="text-xs text-muted-foreground">
                                        Anda dapat mengedit, menambah, atau menyesuaikan kunci jawaban kuis sebelum dikerjakan mahasiswa.
                                    </p>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setEditingQuestionId(null);
                                            setIsCreatingQuestion(true);
                                            setQuestionForm({
                                                question: '',
                                                options: [
                                                    { key: 'A', text: '' },
                                                    { key: 'B', text: '' },
                                                    { key: 'C', text: '' },
                                                    { key: 'D', text: '' },
                                                ],
                                                correct_answer: 'A',
                                                explanation: '',
                                            });
                                        }}
                                        className="w-full sm:w-auto shrink-0 gap-1.5 text-xs"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Tambah Soal Manual
                                    </Button>
                                </div>
                            )}

                            {/* FORM CREATE SOAL */}
                            {isCreatingQuestion && (
                                <div className="rounded-lg border-2 border-primary/30 bg-card p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-foreground">Tambah Soal Kuis Baru</h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsCreatingQuestion(false)}
                                            className="h-7 text-xs text-muted-foreground"
                                        >
                                            Batal
                                        </Button>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-foreground">Teks Pertanyaan</label>
                                        <Textarea
                                            value={questionForm.question}
                                            onChange={(e) =>
                                                setQuestionForm({ ...questionForm, question: e.target.value })
                                            }
                                            placeholder="Tulis pertanyaan..."
                                            rows={2}
                                            className="mt-1 text-xs"
                                        />
                                    </div>

                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {questionForm.options.map((opt, idx) => (
                                            <div key={opt.key} className="flex items-center gap-2">
                                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                                                    {opt.key}
                                                </span>
                                                <Input
                                                    value={opt.text}
                                                    onChange={(e) => {
                                                        const newOpts = [...questionForm.options];
                                                        newOpts[idx].text = e.target.value;
                                                        setQuestionForm({ ...questionForm, options: newOpts });
                                                    }}
                                                    placeholder={`Opsi ${opt.key}`}
                                                    className="h-8 text-xs"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-foreground">Kunci Jawaban:</span>
                                            {['A', 'B', 'C', 'D'].map((k) => (
                                                <button
                                                    key={k}
                                                    type="button"
                                                    onClick={() =>
                                                        setQuestionForm({ ...questionForm, correct_answer: k })
                                                    }
                                                    className={`h-7 w-7 rounded-full text-xs font-bold transition-colors ${
                                                        questionForm.correct_answer === k
                                                            ? 'bg-emerald-600 text-white'
                                                            : 'bg-muted hover:bg-muted/80 text-foreground'
                                                    }`}
                                                >
                                                    {k}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-foreground">Penjelasan / Sumber Jawaban (Opsional)</label>
                                        <Input
                                            value={questionForm.explanation}
                                            onChange={(e) =>
                                                setQuestionForm({ ...questionForm, explanation: e.target.value })
                                            }
                                            placeholder="Alasan mengapa kunci jawaban tersebut benar..."
                                            className="h-8 mt-1 text-xs"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button size="sm" onClick={handleCreateQuestion} className="text-xs">
                                            Simpan Soal
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* LIST SOAL */}
                            {questions.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                                    Belum ada butir soal kuis. Klik "Buat Ulang via AI" atau "Tambah Soal Manual".
                                </div>
                            ) : (
                                questions.map((q, idx) => {
                                    const isEditing = editingQuestionId === q.id;

                                    if (isEditing) {
                                        return (
                                            <div key={q.id} className="rounded-lg border-2 border-primary/30 bg-card p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-foreground">Edit Soal #{idx + 1}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setEditingQuestionId(null)}
                                                        className="h-7 text-xs text-muted-foreground"
                                                    >
                                                        Batal
                                                    </Button>
                                                </div>

                                                <Textarea
                                                    value={questionForm.question}
                                                    onChange={(e) =>
                                                        setQuestionForm({ ...questionForm, question: e.target.value })
                                                    }
                                                    rows={2}
                                                    className="text-xs"
                                                />

                                                <div className="grid gap-2 sm:grid-cols-2">
                                                    {questionForm.options.map((opt, optIdx) => (
                                                        <div key={opt.key} className="flex items-center gap-2">
                                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                                                                {opt.key}
                                                            </span>
                                                            <Input
                                                                value={opt.text}
                                                                onChange={(e) => {
                                                                    const newOpts = [...questionForm.options];
                                                                    newOpts[optIdx].text = e.target.value;
                                                                    setQuestionForm({ ...questionForm, options: newOpts });
                                                                }}
                                                                className="h-8 text-xs"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex items-center gap-2 pt-1">
                                                    <span className="text-xs font-medium text-foreground">Kunci Jawaban:</span>
                                                    {['A', 'B', 'C', 'D'].map((k) => (
                                                        <button
                                                            key={k}
                                                            type="button"
                                                            onClick={() =>
                                                                setQuestionForm({ ...questionForm, correct_answer: k })
                                                            }
                                                            className={`h-7 w-7 rounded-full text-xs font-bold transition-colors ${
                                                                questionForm.correct_answer === k
                                                                    ? 'bg-emerald-600 text-white'
                                                                    : 'bg-muted hover:bg-muted/80 text-foreground'
                                                            }`}
                                                        >
                                                            {k}
                                                        </button>
                                                    ))}
                                                </div>

                                                <Input
                                                    value={questionForm.explanation}
                                                    onChange={(e) =>
                                                        setQuestionForm({ ...questionForm, explanation: e.target.value })
                                                    }
                                                    placeholder="Penjelasan kunci jawaban..."
                                                    className="h-8 text-xs"
                                                />

                                                <div className="flex justify-end gap-2 pt-2">
                                                    <Button size="sm" onClick={() => handleSaveEdit(q.id)} className="text-xs">
                                                        Simpan Perubahan
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={q.id} className="rounded-lg border bg-card p-4 shadow-2xs space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        Soal #{idx + 1}
                                                    </Badge>
                                                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                        Kunci: Opsi {q.correct_answer}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                                                        onClick={() => startEditing(q)}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                        onClick={() => handleDeleteQuestion(q.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <p className="text-xs font-semibold text-foreground">{q.question}</p>

                                            <div className="grid gap-1.5 sm:grid-cols-2 pt-1">
                                                {q.options.map((opt) => {
                                                    const isCorrect = opt.key.toUpperCase() === q.correct_answer.toUpperCase();
                                                    return (
                                                        <div
                                                            key={opt.key}
                                                            className={`flex items-center gap-2 rounded border px-2.5 py-1.5 text-xs ${
                                                                isCorrect
                                                                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300 font-medium'
                                                                    : 'border-border bg-background text-muted-foreground'
                                                            }`}
                                                        >
                                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                                                                {opt.key}
                                                            </span>
                                                            <span className="truncate">{opt.text}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {q.explanation && (
                                                <p className="text-[11px] text-muted-foreground italic pt-1">
                                                    <span className="font-semibold text-foreground">Penjelasan:</span> {q.explanation}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </TabsContent>

                        {/* ================= TAB 2: REKAP MAHASISWA ================= */}
                        <TabsContent value="recap" className="mt-4">
                            <div className="rounded-lg border bg-background overflow-x-auto">
                                <Table className="min-w-[520px]">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-xs whitespace-nowrap">NIM & Mahasiswa</TableHead>
                                            <TableHead className="text-xs text-center whitespace-nowrap">Skor Kuis</TableHead>
                                            <TableHead className="text-xs text-center whitespace-nowrap">Skor Ringkasan AI</TableHead>
                                            <TableHead className="text-xs whitespace-nowrap">Waktu Submit</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {studentsRecap.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center text-xs text-muted-foreground">
                                                    Belum ada mahasiswa yang terdaftar di kelas ini.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            studentsRecap.map((s) => (
                                                <TableRow key={s.mahasiswa_id}>
                                                    <TableCell className="py-2.5">
                                                        <div className="font-medium text-xs text-foreground">{s.name}</div>
                                                        <div className="text-[11px] text-muted-foreground font-mono">{s.nim || '-'}</div>
                                                    </TableCell>
                                                    <TableCell className="text-center py-2.5">
                                                        {s.quiz_score !== null ? (
                                                            <Badge className="bg-emerald-600 text-white font-bold text-xs">
                                                                {Math.round(Number(s.quiz_score))} / 100
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">Belum Mengerjakan</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center py-2.5">
                                                        {s.summary_score !== null ? (
                                                            <Badge className="bg-primary text-primary-foreground font-bold text-xs">
                                                                {Math.round(Number(s.summary_score))} / 100
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">Belum Mengumpulkan</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 text-[11px] text-muted-foreground">
                                                        {s.quiz_completed || s.summary_submitted || '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
}
