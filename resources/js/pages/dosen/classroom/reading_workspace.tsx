import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    Clock,
    Gauge,
    FileText,
    AlertCircle,
    Eye,
    UserCheck,
    BookOpen,
    Check,
    ZoomIn,
    X,
    Loader2,
    Sparkles,
    Award,
    HelpCircle,
} from 'lucide-react';
import { useState, useEffect, useMemo, useCallback, useRef, Component, type ReactNode } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { Button } from '@/components/ui/button';
import { AcademicHighlightedText } from '@/components/reading/academic-highlighted-text';
import { StructuredTextRenderer } from '@/components/reading/structured-text-renderer';
import { AssessmentModal } from '@/components/reading/assessment-modal';
import type { GlossaryTerm } from '@/components/reading/vocab-popover';

if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';


interface Metrics {
    word_count: number;
    sentence_count: number;
    average_sentence_length: number;
    technical_word_count: number;
}

interface DocumentData {
    id: string;
    title: string;
    fileName: string;
    fileUrl?: string;
    difficultyScore: number;
    totalHalaman: number;
    halamanSekarang: number;
    totalDurasiDetik?: number;
    metrics: Metrics;
    content: string;
    glossaryTerms?: GlossaryTerm[];
}

interface User {
    id: number;
    name: string;
    role: 'dosen' | 'mahasiswa';
}

interface AuthProps {
    user: User;
}

interface ReadingWorkspaceProps {
    auth: AuthProps;
    document?: DocumentData;
}

/**
 * Membagi teks konten menjadi potongan halaman yang proporsional sesuai total halaman dokumen.
 */
function splitContentByPageCount(content: string, pageCount: number): string[] {
    if (!content || !content.trim()) return [];
    const cleanContent = content.replace(/\[IMG:[^\]]+\]/g, '').trim();
    if (!cleanContent) return [];
    const paragraphs = cleanContent.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    if (paragraphs.length === 0 || pageCount <= 1) return [cleanContent];

    const totalWords = paragraphs.reduce((acc, p) => acc + p.split(/\s+/).length, 0);
    const wordsPerPage = Math.max(50, Math.ceil(totalWords / Math.max(1, pageCount)));
    const pages: string[] = [];
    let currentParas: string[] = [];
    let currentWords = 0;

    for (let i = 0; i < paragraphs.length; i++) {
        const para = paragraphs[i];
        const paraWords = para.split(/\s+/).length;
        if (
            pages.length < pageCount - 1 &&
            currentWords > 0 &&
            currentWords + paraWords > wordsPerPage
        ) {
            pages.push(currentParas.join('\n\n'));
            currentParas = [para];
            currentWords = paraWords;
        } else {
            currentParas.push(para);
            currentWords += paraWords;
        }
    }
    if (currentParas.length > 0) pages.push(currentParas.join('\n\n'));
    while (pages.length < pageCount && pages.length > 0) pages.push('');
    return pages;
}

function ReadingWorkspaceInner({
    auth,
    document: backendDocument,
}: ReadingWorkspaceProps) {
    // TypeScript otomatis tahu bahwa setelah baris ini, backendDocument pasti ada (aman)
    const doc = backendDocument;
    const isDosen = auth?.user?.role === 'dosen';

    // Client-side PDF rendering state (PDF.js)
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [pdfLoading, setPdfLoading] = useState<boolean>(() => !!doc?.fileUrl);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const [pageCache, setPageCache] = useState<{ [page: number]: string }>({});
    const [renderingPage, setRenderingPage] = useState<boolean>(false);
    const [clientTotalPages, setClientTotalPages] = useState<number>(doc?.totalHalaman || 1);

    // Total pages calculation: PDF.js numPages -> clientTotalPages -> backend total_halaman -> 1
    const totalPages = useMemo(() => {
        if (pdfDoc) return pdfDoc.numPages;
        if (clientTotalPages > 0) return clientTotalPages;
        return Math.max(doc?.totalHalaman || 1, 1);
    }, [pdfDoc, clientTotalPages, doc?.totalHalaman]);

    // Text content pages derived from extracted text
    const textPages = useMemo(() => {
        return splitContentByPageCount(doc?.content || '', totalPages);
    }, [doc?.content, totalPages]);

    // View mode: 'pdf' (visual PDF canvas) or 'text' (extracted clean typography)
    const [viewMode, setViewMode] = useState<'pdf' | 'text'>(() => {
        return !doc?.fileUrl && doc?.content ? 'text' : 'pdf';
    });

    // Backend sends 1-based halamanSekarang (default 1). Convert to 0-based index.
    const backendPageIndex = doc?.halamanSekarang ? Math.max(0, doc.halamanSekarang - 1) : 0;

    const initialPage = Math.min(
        backendPageIndex,
        Math.max(0, totalPages - 1),
    );
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [isAnimating, setIsAnimating] = useState(false);
    const [slideDirection, setSlideDirection] = useState<'left' | 'right'>(
        'right',
    );
    const initialPageSetRef = useRef(false);

    // Reading tracker state
    const [isPlaying, setIsPlaying] = useState(!isDosen);
    const [secondsSpent, setSecondsSpent] = useState(doc?.totalDurasiDetik || 0);

    // Assessment modal state
    const [showAssessmentModal, setShowAssessmentModal] = useState(false);

    // Academic glossary highlighting state
    const [highlightEnabled, setHighlightEnabled] = useState(true);
    const [isRegeneratingGlossary, setIsRegeneratingGlossary] = useState(false);

    const handleRegenerateGlossary = () => {
        if (!doc?.id) return;
        setIsRegeneratingGlossary(true);
        router.post(
            `/dosen/assignments/${doc.id}/glossary/regenerate`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setIsRegeneratingGlossary(false),
            }
        );
    };

    // When PDF finishes loading with actual totalPages, restore page if valid
    useEffect(() => {
        if (!initialPageSetRef.current && totalPages > 1 && backendPageIndex > 0) {
            const targetPage = Math.min(backendPageIndex, totalPages - 1);
            setCurrentPage(targetPage);
            initialPageSetRef.current = true;
        }
    }, [totalPages, backendPageIndex]);

    // 1. Load the PDF document
    useEffect(() => {
        if (!doc?.fileUrl) {
            setPdfLoading(false);
            return;
        }

        let isMounted = true;
        let activeLoadingTask: pdfjsLib.PDFDocumentLoadingTask | null = null;
        setPdfLoading(true);
        setPdfError(null);

        fetch(doc.fileUrl, { credentials: 'same-origin' })
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }
                return res.arrayBuffer();
            })
            .then((arrayBuffer) => {
                if (!isMounted) return;
                activeLoadingTask = pdfjsLib.getDocument({
                    data: new Uint8Array(arrayBuffer),
                });
                return activeLoadingTask.promise;
            })
            .then((loadedPdf) => {
                if (!isMounted || !loadedPdf) return;
                setPdfDoc(loadedPdf);
                setClientTotalPages(loadedPdf.numPages);
                setPdfLoading(false);
            })
            .catch((err) => {
                if (!isMounted) return;
                console.error('Gagal memuat PDF:', err);
                setPdfError('Gagal memuat file PDF. Pastikan file PDF dapat diakses.');
                setPdfLoading(false);
            });

        return () => {
            isMounted = false;
            if (activeLoadingTask) {
                activeLoadingTask.destroy();
            }
        };
    }, [doc?.fileUrl]);

    // Fallback otomatis ke mode teks jika PDF gagal dimuat dan konten teks tersedia
    useEffect(() => {
        if (pdfError && textPages.length > 0) {
            setViewMode('text');
        }
    }, [pdfError, textPages.length]);

    // 2. Render the current page (and pre-render adjacent pages) to canvas dataURL
    useEffect(() => {
        if (!pdfDoc) return;

        const pageNum = currentPage + 1;
        if (pageNum < 1 || pageNum > pdfDoc.numPages) return;

        if (pageCache[currentPage]) return; // Page is already cached

        let isCancelled = false;
        setRenderingPage(true);

        pdfDoc
            .getPage(pageNum)
            .then(async (page) => {
                if (isCancelled) return;
                // High-resolution scale for sharp display and zoom
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = window.document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (!context) {
                    setRenderingPage(false);
                    return;
                }

                await page.render({
                    canvas: canvas,
                    canvasContext: context,
                    viewport: viewport,
                }).promise;

                if (!isCancelled) {
                    const dataUrl = canvas.toDataURL('image/png');
                    setPageCache((prev) => ({ ...prev, [currentPage]: dataUrl }));
                    setRenderingPage(false);
                }
            })
            .catch((err) => {
                if (!isCancelled) {
                    console.error('Gagal merender halaman PDF:', err);
                    setRenderingPage(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [pdfDoc, currentPage, pageCache]);

    // Session restore dialog state
    const [pendingSession, setPendingSession] = useState<{
        secondsSpent: number;
        currentPage: number;
    } | null>(() => {
        if (isDosen || !doc) {
            return null;
        }

        try {
            const saved = localStorage.getItem(`reading_session_${doc.id}`);

            if (saved) {
                const data = JSON.parse(saved);

                return {
                    secondsSpent: data.secondsSpent,
                    currentPage: data.currentPage,
                };
            }
        } catch {
            // ignore
        }

        return null;
    });
    const [showSessionDialog, setShowSessionDialog] = useState(
        () => !!pendingSession,
    );
    const [showExitDialog, setShowExitDialog] = useState(false);
    const [showIdleDialog, setShowIdleDialog] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);    const contentRef = useRef<HTMLDivElement>(null);
    const lastActivityRef = useRef<number>(Date.now());
    const unreportedSecondsRef = useRef<number>(0);
    const currentPageRef = useRef<number>(currentPage);

    useEffect(() => {
        currentPageRef.current = currentPage;
    }, [currentPage]);

    // Navigasi halaman
    const goToPage = useCallback(
        (page: number) => {
            if (page < 0 || page >= totalPages || isAnimating) {
                return;
            }

            setSlideDirection(page > currentPage ? 'right' : 'left');
            setIsAnimating(true);
            setCurrentPage(page);

            if (contentRef.current) {
                contentRef.current.scrollTop = 0;
            }

            setTimeout(() => {
                setIsAnimating(false);
            }, 300);
        },
        [currentPage, totalPages, isAnimating],
    );

    const goNext = useCallback(
        () => goToPage(currentPage + 1),
        [goToPage, currentPage],
    );
    const goPrev = useCallback(
        () => goToPage(currentPage - 1),
        [goToPage, currentPage],
    );

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (showSessionDialog || showExitDialog || showIdleDialog || lightboxSrc) return;
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goNext, goPrev, showSessionDialog, showExitDialog, showIdleDialog, lightboxSrc]);

    // Save session to localStorage on every change
    useEffect(() => {
        if (isDosen || !doc) {
            return;
        }

        try {
            localStorage.setItem(
                `reading_session_${doc.id}`,
                JSON.stringify({
                    secondsSpent,
                    currentPage,
                    updatedAt: Date.now(),
                }),
            );
        } catch {
            // ignore
        }
    }, [secondsSpent, currentPage, isDosen, doc]);

    // Save on beforeunload
    useEffect(() => {
        if (isDosen || !doc) {
            return;
        }

        const handleBeforeUnload = () => {
            try {
                localStorage.setItem(
                    `reading_session_${doc.id}`,
                    JSON.stringify({
                        secondsSpent,
                        currentPage,
                        updatedAt: Date.now(),
                    }),
                );
            } catch {
                // ignore
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () =>
            window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [secondsSpent, currentPage, isDosen, doc]);

    const handleFinishReading = () => {
        if (!doc) {
            return;
        }

        const remainingSeconds = unreportedSecondsRef.current;
        const pagePercent = totalPages > 0 ? Math.round(((currentPage + 1) / totalPages) * 100) : 0;

        router.post(
            `/mahasiswa/read/${doc.id}/finish`,
            {
                seconds: remainingSeconds,
                percentage: pagePercent,
                current_page: currentPage + 1,
            },
            {
                onSuccess: () => {
                    localStorage.removeItem(`reading_session_${doc.id}`);
                    router.visit('/mahasiswa/dashboard');
                },
            },
        );
    };

    // Timer: hitung durasi membaca (Mahasiswa saja)
    // Timer & Auto-Save Progress (Setiap 10 detik "baru")
    useEffect(() => {
        if (isDosen || !isPlaying) {
            return;
        }

        const timer = setInterval(() => {
            setSecondsSpent((prev) => prev + 1);
            unreportedSecondsRef.current += 1;

            // Auto-save setiap kelipatan 10 detik baru
            if (unreportedSecondsRef.current >= 10 && doc) {
                const secondsToSend = unreportedSecondsRef.current;
                const pagePercent = totalPages > 0 ? Math.round(((currentPageRef.current + 1) / totalPages) * 100) : 0;
                
                router.post(
                    `/mahasiswa/read/${doc.id}/progress`,
                    {
                        seconds: secondsToSend,
                        percentage: Math.min(100, Math.max(0, pagePercent)),
                        current_page: currentPageRef.current + 1,
                    },
                    {
                        preserveScroll: true,
                        preserveState: true,
                    },
                );

                // Reset unreported
                unreportedSecondsRef.current = 0;
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [isPlaying, isDosen, doc, totalPages]);

    // Visibility Change, Idle Detection & Activity Listeners (Mahasiswa saja)
    const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (isDosen) {
            return;
        }

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setIsPlaying(false);
            }
        };

        const resetIdleTimer = () => {
            lastActivityRef.current = Date.now();
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!lastMousePosRef.current) {
                lastMousePosRef.current = { x: e.clientX, y: e.clientY };
                return;
            }
            const dx = Math.abs(e.clientX - lastMousePosRef.current.x);
            const dy = Math.abs(e.clientY - lastMousePosRef.current.y);
            // Abaikan micro-jitter / getaran kursor di bawah 4px
            if (dx > 4 || dy > 4) {
                lastMousePosRef.current = { x: e.clientX, y: e.clientY };
                resetIdleTimer();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('mousedown', resetIdleTimer, { passive: true });
        window.addEventListener('scroll', resetIdleTimer, { capture: true, passive: true });
        window.addEventListener('keydown', resetIdleTimer, { passive: true });
        window.addEventListener('click', resetIdleTimer, { passive: true });
        window.addEventListener('touchstart', resetIdleTimer, { passive: true });

        // Cek setiap 1 detik apakah idle time mencapai threshold 10 detik
        const idleCheck = setInterval(() => {
            const idleTime = (Date.now() - lastActivityRef.current) / 1000;

            if (idleTime >= 10) {
                setIsPlaying(false);
                setShowIdleDialog(true);
            }
        }, 1000);

        return () => {
            clearInterval(idleCheck);
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', resetIdleTimer);
            window.removeEventListener('scroll', resetIdleTimer, { capture: true });
            window.removeEventListener('keydown', resetIdleTimer);
            window.removeEventListener('click', resetIdleTimer);
            window.removeEventListener('touchstart', resetIdleTimer);
        };
    }, [isDosen]);

    if (!doc) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6 text-center">
                <div className="space-y-2">
                    <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
                    <h3 className="text-lg font-bold">
                        Dokumen Tidak Ditemukan
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Gagal memuat data bacaan atau data kosong.
                    </p>
                </div>
            </div>
        );
    }

    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;
    };


    if (!doc) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6 text-center">
                <div className="space-y-2">
                    <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
                    <h3 className="text-lg font-bold">
                        Dokumen Tidak Ditemukan
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Gagal memuat data bacaan atau data kosong.
                    </p>
                </div>
            </div>
        );
    }

    const progressPercent =
        totalPages > 0 ? Math.round(((currentPage + 1) / totalPages) * 100) : 0;

    return (
        <>
            <Head
                title={`${isDosen ? 'Pratinjau Dosen' : 'Membaca'}: ${doc.title}`}
            >
                <meta
                    name="description"
                    content={`${isDosen ? 'Pratinjau materi' : 'Membaca'} ${doc.title} - Smart Reading App. ${isDosen ? 'Mode preview dosen.' : 'Lacak waktu baca dan progress Anda.'}`}
                />
            </Head>

            {/* Top Minimalist Header */}
            <div className="sticky top-0 z-50 flex flex-col justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-4">
                <div className="flex items-center gap-3 sm:gap-4">
                    <Link
                        href={isDosen ? '#' : '/mahasiswa/dashboard'}
                        onClick={(e) => {
                            if (isDosen) {
                                e.preventDefault();
                                window.history.back();
                            } else if (isPlaying) {
                                e.preventDefault();
                                setIsPlaying(false);
                                setShowExitDialog(true);
                            }
                        }}
                        className="rounded-full border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground shrink-0"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="line-clamp-1 text-sm sm:text-base font-bold">
                                {doc.title}
                            </h1>
                            {isDosen && (
                                <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-amber-700 shrink-0">
                                    Mode Pratinjau
                                </span>
                            )}
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground truncate">
                            <FileText className="h-3 w-3 shrink-0" /> {doc.fileName}
                        </p>
                    </div>
                </div>

                {/* Tracker Panel Controls */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-start sm:justify-end">
                    {textPages.length > 0 && !!doc?.fileUrl && (
                        <div className="flex items-center rounded-lg border bg-muted/60 p-0.5 text-xs">
                            <button
                                type="button"
                                onClick={() => setViewMode('pdf')}
                                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${viewMode === 'pdf' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <FileText className="h-3.5 w-3.5" /> Mode PDF
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('text')}
                                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${viewMode === 'text' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <BookOpen className="h-3.5 w-3.5" /> Mode Teks
                            </button>
                        </div>
                    )}

                    {viewMode === 'text' && (doc?.glossaryTerms?.length || 0) > 0 && (
                        <button
                            type="button"
                            onClick={() => setHighlightEnabled(!highlightEnabled)}
                            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                                highlightEnabled
                                    ? 'border-violet-300 bg-violet-50 text-violet-900 shadow-xs dark:border-violet-700/60 dark:bg-violet-950/40 dark:text-violet-200'
                                    : 'border-muted bg-muted/50 text-muted-foreground hover:text-foreground'
                            }`}
                            title="Nyalakan atau matikan sorotan istilah akademik otomatis"
                        >
                            <Sparkles className={`h-3.5 w-3.5 ${highlightEnabled ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground'}`} />
                            <span>Sorot Istilah ({doc?.glossaryTerms?.length})</span>
                        </button>
                    )}
                    {isDosen ? (
                        <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-700">
                            <UserCheck className="h-4 w-4" /> Tracker
                            Dinonaktifkan untuk Dosen
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5">
                                <Clock
                                    className={`h-4 w-4 ${isPlaying ? 'animate-pulse text-primary' : 'text-muted-foreground'}`}
                                />
                                <span className="text-xs font-medium text-muted-foreground">
                                    Durasi:
                                </span>
                                <span className="font-mono text-sm font-bold text-foreground">
                                    {formatTime(secondsSpent)}
                                </span>
                            </div>

                            <Button
                                variant={isPlaying ? 'outline' : 'default'}
                                size="sm"
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="gap-2"
                            >
                                {isPlaying ? (
                                    <>
                                        <Pause className="h-4 w-4" /> Pause
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4" /> Resume
                                    </>
                                )}
                            </Button>
                        </>
                    )}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAssessmentModal(true)}
                        className="gap-1.5 border-emerald-500/40 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 shadow-2xs text-xs font-semibold"
                    >
                        <Award className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="hidden sm:inline">Kuis & Ringkasan AI</span>
                        <span className="sm:hidden">Asesmen AI</span>
                    </Button>
                </div>
            </div>

            {/* Workspace Layout Content */}
            <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-6 p-6 lg:grid-cols-4">
                {/* PANEL UTAMA: Konten Bacaan Per Halaman */}
                <div className="flex flex-col gap-4 lg:col-span-3">
                    <Card
                        className={`relative transition-all duration-300 ${!isPlaying && !isDosen ? 'pointer-events-none opacity-30 blur-[3px] select-none' : ''}`}
                    >
                        <CardContent className="px-0 pt-0 pb-0">
                            <div
                                ref={contentRef}
                                className={`max-h-[70vh] min-h-[65vh] overflow-y-auto ${
                                    viewMode === 'text'
                                        ? 'bg-muted/20 px-3 py-6 sm:px-4 md:px-6 lg:px-8 dark:bg-zinc-900/30'
                                        : 'px-4 py-6 sm:px-6 md:px-8 lg:px-10'
                                }`}
                                style={{ scrollBehavior: 'smooth' }}
                            >
                                <div
                                    className={`flex items-center justify-center transition-all duration-300 ease-in-out ${isAnimating ? (slideDirection === 'right' ? 'translate-x-4 opacity-0' : '-translate-x-4 opacity-0') : 'translate-x-0 opacity-100'}`}
                                >
                                    {(() => {
                                        // Mode Teks (Reader Mode)
                                        if (viewMode === 'text') {
                                            const pageText = textPages[currentPage] || '';
                                            if (!pageText.trim()) {
                                                return (
                                                    <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground text-center">
                                                        <AlertCircle className="h-10 w-10" />
                                                        <p className="text-sm">Tidak ada teks yang dapat ditampilkan pada halaman ini.</p>
                                                        {doc?.fileUrl && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setViewMode('pdf')}
                                                                className="mt-2"
                                                            >
                                                                Buka Mode PDF
                                                            </Button>
                                                        )}
                                                    </div>
                                                );
                                            }

                                            return (
                                                <StructuredTextRenderer
                                                    text={pageText}
                                                    glossaryTerms={doc?.glossaryTerms || []}
                                                    highlightEnabled={highlightEnabled}
                                                    pageNumber={currentPage + 1}
                                                    totalPages={totalPages}
                                                />
                                            );
                                        }

                                        // Mode PDF (Visual Canvas)
                                        const currentImageSrc = pageCache[currentPage];

                                        if (pdfLoading || (renderingPage && !currentImageSrc)) {
                                            return (
                                                <div className="flex flex-col items-center justify-center py-28 text-muted-foreground gap-3">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                    <p className="text-sm font-medium">Memuat halaman {currentPage + 1}...</p>
                                                    {textPages.length > 0 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setViewMode('text')}
                                                            className="text-xs text-muted-foreground hover:text-foreground"
                                                        >
                                                            Beralih ke Mode Teks sementara memuat
                                                        </Button>
                                                    )}
                                                </div>
                                            );
                                        }

                                        if (currentImageSrc) {
                                            return (
                                                <button
                                                    type="button"
                                                    onClick={() => setLightboxSrc(currentImageSrc)}
                                                    className="group relative w-full cursor-zoom-in rounded-lg border bg-background p-1 shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                >
                                                    <img
                                                        src={currentImageSrc}
                                                        alt={`Halaman ${currentPage + 1}`}
                                                        className="w-full h-auto rounded-md"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 transition-colors group-hover:bg-black/10">
                                                        <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                                                            <ZoomIn className="h-3.5 w-3.5" /> Tap untuk zoom
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        }

                                        if (pdfError) {
                                            return (
                                                <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground text-center">
                                                    <AlertCircle className="h-10 w-10 text-destructive" />
                                                    <p className="text-sm font-medium text-destructive">{pdfError}</p>
                                                    {textPages.length > 0 && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setViewMode('text')}
                                                            className="mt-2 gap-2"
                                                        >
                                                            <BookOpen className="h-4 w-4" /> Buka Mode Teks
                                                        </Button>
                                                    )}
                                                    {doc?.fileUrl && (
                                                        <a
                                                            href={doc.fileUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs text-primary underline mt-2"
                                                        >
                                                            Buka file PDF secara langsung
                                                        </a>
                                                    )}
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground text-center">
                                                <AlertCircle className="h-10 w-10" />
                                                <p className="text-sm">Tidak ada halaman yang dapat ditampilkan untuk dokumen ini.</p>
                                                {textPages.length > 0 && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setViewMode('text')}
                                                        className="mt-2 gap-2"
                                                    >
                                                        <BookOpen className="h-4 w-4" /> Buka Mode Teks
                                                    </Button>
                                                )}
                                                {doc?.fileUrl && (
                                                    <a
                                                        href={doc.fileUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-xs text-primary underline mt-2"
                                                    >
                                                        Buka file PDF secara langsung
                                                    </a>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Page Navigation Bar */}
                            <div className="flex flex-col gap-3 border-t bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                                {/* Mobile View (visible on mobile, hidden on sm and up) */}
                                <div className="flex w-full items-center justify-between sm:hidden">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={goPrev}
                                        disabled={
                                            currentPage === 0 || isAnimating
                                        }
                                        className="h-9 w-9 p-0"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>

                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                        <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>
                                            {currentPage + 1} / {totalPages}
                                        </span>
                                    </div>

                                    {!isDosen &&
                                        currentPage === totalPages - 1 ? (
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={handleFinishReading}
                                            className="h-9 gap-1 bg-emerald-600 px-3 text-xs hover:bg-emerald-700"
                                        >
                                            <Check className="h-3.5 w-3.5" />{' '}
                                            Selesai
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={goNext}
                                            disabled={
                                                currentPage ===
                                                totalPages - 1 ||
                                                isAnimating
                                            }
                                            className="h-9 w-9 p-0"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                {/* Mobile Progress Bar (full width under the controls) */}
                                <div className="h-1 w-full overflow-hidden rounded-full bg-muted sm:hidden">
                                    <div
                                        className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>

                                {/* Desktop View (hidden on mobile) */}
                                <div className="hidden w-full items-center justify-between sm:flex">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={goPrev}
                                        disabled={
                                            currentPage === 0 || isAnimating
                                        }
                                        className="min-w-28 gap-1.5"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Sebelumnya
                                    </Button>

                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-semibold text-foreground">
                                                Halaman {currentPage + 1}{' '}
                                                <span className="font-normal text-muted-foreground">
                                                    dari {totalPages}
                                                </span>
                                            </span>
                                        </div>

                                        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                                                style={{
                                                    width: `${progressPercent}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {!isDosen &&
                                        currentPage === totalPages - 1 ? (
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={handleFinishReading}
                                            className="min-w-28 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            <Check className="h-4 w-4" />{' '}
                                            Selesai
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={goNext}
                                            disabled={
                                                currentPage ===
                                                totalPages - 1 ||
                                                isAnimating
                                            }
                                            className="min-w-28 gap-1.5"
                                        >
                                            Selanjutnya
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>

                        {/* Overlay pembatas jika mahasiswa mem-pause tracker */}
                        {!isPlaying && !isDosen && (
                            <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-background/10">
                                <div className="rounded-full border bg-background p-3 shadow-md">
                                    <Eye className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-semibold">
                                    Sesi Membaca Sedang Di-pause
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Klik 'Resume' di panel atas untuk
                                    melanjutkan membaca.
                                </p>
                            </div>
                        )}
                    </Card>

                    {/* Keyboard Hint */}
                    <p className="text-center text-xs text-muted-foreground">
                        Gunakan tombol{' '}
                        <kbd className="inline-flex items-center rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium">
                            ←
                        </kbd>{' '}
                        <kbd className="inline-flex items-center rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium">
                            →
                        </kbd>{' '}
                        untuk navigasi halaman
                    </p>
                </div>

                {/* SIDEBAR RIGHT: Status Engine & Statistik NLP */}
                <div className="space-y-4 lg:sticky lg:top-24">
                    {/* Indikator Status Detektor Real-time */}
                    <Card
                        className={
                            isDosen
                                ? 'border-amber-200 bg-amber-50/40'
                                : 'border-primary/20 bg-primary/5'
                        }
                    >
                        <CardHeader className="pb-2">
                            <CardTitle
                                className={`flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase ${isDosen ? 'text-amber-700' : 'text-primary'}`}
                            >
                                <AlertCircle className="h-3.5 w-3.5" /> Live
                                Status Engine
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs text-muted-foreground">
                            {isDosen ? (
                                <p>
                                    Anda masuk sebagai <strong>Dosen</strong>.
                                    Anda dapat memeriksa kualitas ekstraksi teks
                                    dan tingkat kesulitan teks tanpa
                                    mempengaruhi statistik kelas.
                                </p>
                            ) : (
                                <>
                                    <p>
                                        Sistem AI memantau fokus Anda secara
                                        berkala (Tab Aktif, Gerakan Scroll, Klik
                                        & Aktivitas Keyboard).
                                    </p>
                                    <div className="flex items-center gap-2 pt-1">
                                        <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" />
                                        <span className="font-semibold text-foreground">
                                            Anti-Idle 10 Detik Aktif (Testing)
                                        </span>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Ringkasan Skor Analisis NLP dari Dokumen */}
                    <Card>
                        <CardHeader className="border-b pb-3">
                            <CardTitle className="text-sm font-bold">
                                Analisis Kompleksitas AI
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Bobot metrik otomatis berdasarkan rumus NLP
                                terintegrasi.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div>
                                <div className="mb-1 flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Gauge className="h-3.5 w-3.5" />{' '}
                                        Difficulty Score
                                    </span>
                                    <span className="text-sm font-bold text-rose-600">
                                        {doc.difficultyScore} / 100
                                    </span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full bg-rose-500"
                                        style={{
                                            width: `${doc.difficultyScore}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 border-t pt-2 text-xs">
                                <div className="rounded-lg bg-muted/40 p-2.5">
                                    <p className="text-muted-foreground">
                                        Total Kata
                                    </p>
                                    <p className="font-mono text-sm font-bold text-foreground">
                                        {doc.metrics?.word_count ?? 0}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-muted/40 p-2.5">
                                    <p className="text-muted-foreground">
                                        Jumlah Kalimat
                                    </p>
                                    <p className="font-mono text-sm font-bold text-foreground">
                                        {doc.metrics?.sentence_count ?? 0}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-muted/40 p-2.5">
                                    <p className="text-muted-foreground">
                                        Rerata Kalimat
                                    </p>
                                    <p className="font-mono text-sm font-bold text-foreground">
                                        {doc.metrics?.average_sentence_length ?? 0}{' '}
                                        kata
                                    </p>
                                </div>
                                <div className="rounded-lg bg-muted/40 p-2.5">
                                    <p className="text-muted-foreground">
                                        Kata Teknikal
                                    </p>
                                    <p className="font-mono text-sm font-bold text-foreground">
                                        {doc.metrics?.technical_word_count ?? 0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card Glosarium Akademik Otomatis */}
                    <Card className="border-violet-200/60 bg-gradient-to-b from-violet-50/30 to-background dark:border-violet-900/40">
                        <CardHeader className="border-b pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-1.5 text-sm font-bold text-violet-900 dark:text-violet-200">
                                    <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                    Glosarium Akademik
                                </CardTitle>
                                <span className="rounded-full bg-violet-100 dark:bg-violet-950/60 px-2 py-0.5 text-[11px] font-semibold text-violet-800 dark:text-violet-300">
                                    {doc.glossaryTerms?.length || 0} Istilah
                                </span>
                            </div>
                            <CardDescription className="text-xs">
                                Didukung AI untuk memahami istilah ilmiah tanpa keluar dari halaman bacaan.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-3 text-xs">
                            <p className="text-muted-foreground leading-relaxed">
                                Istilah penting di dalam <strong className="text-foreground">Mode Teks</strong> memiliki sorotan khusus. Klik kata bertanda garis bawah untuk melihat definisi dan konteksnya.
                            </p>

                            {/* Daftar preview beberapa istilah teratas */}
                            {doc.glossaryTerms && doc.glossaryTerms.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                                        Istilah Utama Dokumen:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {doc.glossaryTerms.slice(0, 6).map((term) => (
                                             <span
                                                key={term.id}
                                                className="inline-flex items-center rounded-md border border-violet-300/60 bg-violet-100/60 px-2 py-0.5 text-[11px] font-medium text-violet-900 dark:border-violet-800/60 dark:bg-violet-950/40 dark:text-violet-200"
                                            >
                                                {term.term}
                                            </span>
                                        ))}
                                        {doc.glossaryTerms.length > 6 && (
                                            <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                                +{doc.glossaryTerms.length - 6} lainnya
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Tombol Regenerasi Glosarium Khusus Dosen */}
                            {isDosen && (
                                <div className="border-t pt-3 mt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRegenerateGlossary}
                                        disabled={isRegeneratingGlossary}
                                        className="w-full text-xs gap-1.5 border-violet-300 text-violet-900 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-200 dark:hover:bg-violet-950/40"
                                    >
                                        <Sparkles className={`h-3.5 w-3.5 ${isRegeneratingGlossary ? 'animate-spin' : ''}`} />
                                        {isRegeneratingGlossary ? 'Mengekstrak AI...' : 'Ekstrak Ulang Glosarium (AI)'}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            {/* Session Restore Dialog */}
            <Dialog
                open={showSessionDialog}
                onOpenChange={setShowSessionDialog}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Lanjutkan Membaca?</DialogTitle>
                        <DialogDescription>
                            Ada sesi membaca sebelumnya yang ditemukan. Apakah
                            Anda ingin melanjutkan dari sesi sebelumnya atau
                            memulai baru?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                localStorage.removeItem(
                                    `reading_session_${doc.id}`,
                                );
                                setShowSessionDialog(false);
                                setPendingSession(null);
                                setSecondsSpent(0);
                                setCurrentPage(0);
                            }}
                        >
                            Mulai Baru
                        </Button>
                        <Button
                            onClick={() => {
                                if (pendingSession) {
                                    setSecondsSpent(
                                        pendingSession.secondsSpent,
                                    );
                                    setCurrentPage(pendingSession.currentPage);
                                }

                                setShowSessionDialog(false);
                                setPendingSession(null);
                            }}
                        >
                            Lanjutkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Exit Confirmation Dialog */}
            <Dialog
                open={showExitDialog}
                onOpenChange={(open) => {
                    setShowExitDialog(open);

                    if (!open) {
                        setIsPlaying(true);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yakin Ingin Keluar?</DialogTitle>
                        <DialogDescription>
                            Anda sedang dalam sesi aktif membaca. Sesi membaca
                            Anda akan di-pause dan progress membaca akan
                            disimpan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowExitDialog(false);
                                setIsPlaying(true);
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                setShowExitDialog(false);
                                router.visit('/mahasiswa/dashboard');
                            }}
                        >
                            Keluar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Idle Warning Dialog */}
            <Dialog open={showIdleDialog} onOpenChange={setShowIdleDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sesi Di-pause</DialogTitle>
                        <DialogDescription>
                            Sesi membaca di-pause karena tidak ada aktivitas selama 10 detik.
                            Klik &quot;Lanjutkan&quot; untuk meneruskan membaca.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            onClick={() => {
                                setShowIdleDialog(false);
                                setIsPlaying(true);
                                lastActivityRef.current = Date.now();
                            }}
                        >
                            Lanjutkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Image Lightbox/Zoom Overlay */}
            {lightboxSrc && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
                    onClick={() => setLightboxSrc(null)}
                >
                    <button
                        type="button"
                        onClick={() => setLightboxSrc(null)}
                        className="absolute top-4 right-4 z-[101] rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/40"
                    >
                        <X className="h-6 w-6" />
                    </button>
                    <div
                        className="max-h-[95vh] max-w-[95vw] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={lightboxSrc}
                            alt="Zoom Gambar"
                            className="h-auto min-w-[90vw] sm:min-w-0 sm:max-w-[90vw] object-contain"
                            style={{ touchAction: 'pinch-zoom' }}
                        />
                    </div>
                </div>
            )}

            {/* Assessment Modal (Quiz & AI Summary) */}
            <AssessmentModal
                open={showAssessmentModal}
                onOpenChange={setShowAssessmentModal}
                assignmentId={doc.id}
                assignmentTitle={doc.title}
                isDosen={isDosen}
            />
        </>
    );
}

interface ErrorBoundaryProps {
    children: ReactNode;
    doc?: DocumentData;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ReadingWorkspaceErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Reading Workspace Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            const content = this.props.doc?.content?.replace(/\[IMG:[^\]]+\]/g, '').trim();
            return (
                <div className="min-h-screen bg-background p-6 text-foreground">
                    <div className="mx-auto max-w-3xl space-y-6">
                        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-6 w-6 text-destructive shrink-0" />
                                <div>
                                    <h2 className="text-base font-bold text-destructive">
                                        Terjadi Kendala Memuat Tampilan Visual
                                    </h2>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {this.state.error?.message || 'Terjadi kesalahan sistem saat memproses dokumen.'}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => window.location.reload()}
                                    className="text-xs"
                                >
                                    Muat Ulang Halaman
                                </Button>
                                <Link href="/mahasiswa/dashboard">
                                    <Button size="sm" variant="outline" className="text-xs">
                                        Kembali ke Dashboard
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {content && (
                            <div className="rounded-xl border bg-card p-6 shadow-sm">
                                <h3 className="mb-4 text-base font-bold border-b pb-2">
                                    Teks Dokumen Bacaan
                                </h3>
                                <div className="space-y-4">
                                    {content.split(/\n\s*\n/).map((para, i) => (
                                        <p key={i} className="text-sm leading-relaxed text-foreground/90 text-justify">
                                            {para}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default function ReadingWorkspace(props: ReadingWorkspaceProps) {
    return (
        <ReadingWorkspaceErrorBoundary doc={props.document}>
            <ReadingWorkspaceInner {...props} />
        </ReadingWorkspaceErrorBoundary>
    );
}
