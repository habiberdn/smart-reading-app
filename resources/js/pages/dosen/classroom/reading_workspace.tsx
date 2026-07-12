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
} from 'lucide-react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
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

const WORDS_PER_PAGE = 250;

/**
 * Memecah konten teks menjadi halaman-halaman berdasarkan paragraf.
 * Setiap halaman berisi ~250 kata. Paragraf tidak dipotong di tengah.
 */
function splitContentIntoPages(content: string): string[] {
    if (!content || content.trim().length === 0) {
        return [''];
    }

    const paragraphs = content
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

    if (paragraphs.length === 0) {
        return [content];
    }

    const pages: string[] = [];
    let currentPageParagraphs: string[] = [];
    let currentWordCount = 0;

    for (const paragraph of paragraphs) {
        const paragraphWordCount = paragraph
            .split(/\s+/)
            .filter(Boolean).length;

        if (
            currentWordCount > 0 &&
            currentWordCount + paragraphWordCount > WORDS_PER_PAGE
        ) {
            pages.push(currentPageParagraphs.join('\n\n'));
            currentPageParagraphs = [paragraph];
            currentWordCount = paragraphWordCount;
        } else {
            currentPageParagraphs.push(paragraph);
            currentWordCount += paragraphWordCount;
        }
    }

    if (currentPageParagraphs.length > 0) {
        pages.push(currentPageParagraphs.join('\n\n'));
    }

    return pages.length > 0 ? pages : [''];
}

export default function ReadingWorkspace({
    auth,
    document: backendDocument,
}: ReadingWorkspaceProps) {
    // TypeScript otomatis tahu bahwa setelah baris ini, backendDocument pasti ada (aman)
    const doc = backendDocument;
    const isDosen = auth.user.role === 'dosen';

    // Pagination state
    const pages = useMemo(
        () => splitContentIntoPages(doc?.content || ''),
        [doc?.content],
    );
    const totalPages = pages.length;
    const initialPage = Math.min(
        Math.max(doc?.halamanSekarang || 0, 0),
        totalPages - 1,
    );
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [isAnimating, setIsAnimating] = useState(false);
    const [slideDirection, setSlideDirection] = useState<'left' | 'right'>(
        'right',
    );

    // Reading tracker state
    const [isPlaying, setIsPlaying] = useState(!isDosen);
    const [secondsSpent, setSecondsSpent] = useState(doc?.totalDurasiDetik || 0);
    const [lastActivity, setLastActivity] = useState(() => Date.now());

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

                if (
                    data.currentPage > 0 ||
                    doc.halamanSekarang > 0
                ) {
                    return {
                        secondsSpent: data.secondsSpent,
                        currentPage: data.currentPage,
                    };
                }
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

    const contentRef = useRef<HTMLDivElement>(null);

    // Navigasi halaman
    const goToPage = useCallback(
        (page: number) => {
            if (page < 0 || page >= totalPages || isAnimating) {
                return;
            }

            setSlideDirection(page > currentPage ? 'right' : 'left');
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentPage(page);
                contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => setIsAnimating(false), 300);
            }, 150);
        },
        [currentPage, totalPages, isAnimating],
    );

    const goNext = useCallback(
        () => goToPage(currentPage + 1),
        [currentPage, goToPage],
    );
    const goPrev = useCallback(
        () => goToPage(currentPage - 1),
        [currentPage, goToPage],
    );

    // Keyboard navigation (← →)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                goNext();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                goPrev();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goNext, goPrev]);

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

        const remainingSeconds = secondsSpent % 10;
        const pagePercent = totalPages > 0 ? Math.round(((currentPage + 1) / totalPages) * 100) : 0;

        router.post(
            `/mahasiswa/read/${doc.id}/finish`,
            {
                seconds: remainingSeconds,
                percentage: pagePercent,
                current_page: currentPage,
            },
            {
                onSuccess: () => {
                    localStorage.removeItem(`reading_session_${doc.id}`);
                    router.visit('/mahasiswa/dashboard');
                },
            },
        );
    };

    // Logika Engine Tracker, Visibility Change, & Anti-Idle 2 Menit (Mahasiswa saja)
    useEffect(() => {
        if (isDosen) {
            return;
        }

        let timer: NodeJS.Timeout;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setIsPlaying(false);
            }
        };

        const resetIdleTimer = () => {
            setLastActivity(Date.now());
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('mousemove', resetIdleTimer);
        window.addEventListener('mousedown', resetIdleTimer);
        window.addEventListener('scroll', resetIdleTimer);
        window.addEventListener('keydown', resetIdleTimer);
        window.addEventListener('click', resetIdleTimer);

        if (isPlaying) {
            timer = setInterval(() => {
                setSecondsSpent((prev) => prev + 1);
            }, 1000);
        }

        const idleCheck = setInterval(() => {
            const idleTime = (Date.now() - lastActivity) / 1000;

            if (idleTime >= 120) {
                setIsPlaying(false);
                setShowIdleDialog(true);
            }
        }, 5000);

        return () => {
            clearInterval(timer);
            clearInterval(idleCheck);
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );
            window.removeEventListener('mousemove', resetIdleTimer);
            window.removeEventListener('mousedown', resetIdleTimer);
            window.removeEventListener('scroll', resetIdleTimer);
            window.removeEventListener('keydown', resetIdleTimer);
            window.removeEventListener('click', resetIdleTimer);
        };
    }, [isPlaying, lastActivity, isDosen]);

    // Auto-Save Progress (page-based) ke DB Setiap Kelipatan 10 Detik
    useEffect(() => {
        if (isDosen || !doc || secondsSpent === 0 || secondsSpent % 10 !== 0) {
            return;
        }

        const pagePercent =
            totalPages > 0
                ? Math.round(((currentPage + 1) / totalPages) * 100)
                : 0;
        const finalPercent = Math.min(100, Math.max(0, pagePercent));

        router.post(
            `/mahasiswa/read/${doc.id}/progress`,
            {
                seconds: 10,
                percentage: finalPercent,
                current_page: currentPage,
            },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    }, [secondsSpent, isDosen, currentPage, totalPages, doc]);

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

    const parseInlineStyles = (text: string): React.ReactNode => {
        const formatted = text
            .replace(/<\/?(strong|b)>/g, '**')
            .replace(/<\/?(em|i)>/g, '*')
            .replace(/<\/?u>/g, '__');

        const regex = /(\*\*.*?\*\*|\*.*?\*|__.*?__)/g;
        const parts = formatted.split(regex);

        return (
            <>
                {parts.map((part, index) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return (
                            <strong
                                key={index}
                                className="font-bold text-foreground"
                            >
                                {part.slice(2, -2)}
                            </strong>
                        );
                    }

                    if (part.startsWith('*') && part.endsWith('*')) {
                        return (
                            <em key={index} className="text-foreground italic">
                                {part.slice(1, -1)}
                            </em>
                        );
                    }

                    if (part.startsWith('__') && part.endsWith('__')) {
                        return (
                            <span
                                key={index}
                                className="text-foreground underline"
                            >
                                {part.slice(2, -2)}
                            </span>
                        );
                    }

                    return part;
                })}
            </>
        );
    };

    const renderParagraph = (paragraphText: string, idx: number) => {
        const rawLines = paragraphText
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);

        type ParsedElement =
            | {
                type: 'heading';
                level: number;
                text: string;
                shouldCenter: boolean;
            }
            | { type: 'list-unordered'; text: string }
            | { type: 'list-ordered'; value: number; text: string }
            | { type: 'text'; text: string; shouldCenter: boolean }
            | { type: 'image'; src: string };

        const elements: ParsedElement[] = [];
        let currentTextGroup: string[] = [];

        const flushTextGroup = () => {
            if (currentTextGroup.length > 0) {
                const combinedText = currentTextGroup.join(' ');
                const isCenterHtml =
                    combinedText.startsWith('<center>') &&
                    combinedText.endsWith('</center>');
                const cleanText = isCenterHtml
                    ? combinedText.slice(8, -9).trim()
                    : combinedText;

                const isAcademicHeading =
                    /^(BAB|CHAPTER|Bab|Chapter)\s+([IVXLCDM\d]+)/i.test(
                        cleanText,
                    ) && cleanText.length < 100;
                const isAllCapsHeading =
                    cleanText === cleanText.toUpperCase() &&
                    /[A-Z]/.test(cleanText) &&
                    cleanText.length < 80;

                elements.push({
                    type: 'text',
                    text: cleanText,
                    shouldCenter:
                        isCenterHtml || isAcademicHeading || isAllCapsHeading,
                });
                currentTextGroup = [];
            }
        };

        for (const line of rawLines) {
            const isCenterHtml =
                line.startsWith('<center>') && line.endsWith('</center>');
            const cleanLine = isCenterHtml ? line.slice(8, -9).trim() : line;

            const imgMatch = cleanLine.match(/^\[IMG:(.+)\]$/);
            if (imgMatch) {
                flushTextGroup();
                elements.push({
                    type: 'image',
                    src: imgMatch[1].trim(),
                });
                continue;
            }

            const isMarkdownHeading =
                cleanLine.startsWith('# ') ||
                cleanLine.startsWith('## ') ||
                cleanLine.startsWith('### ');
            const isAcademicHeading =
                /^(BAB|CHAPTER|Bab|Chapter)\s+([IVXLCDM\d]+)/i.test(
                    cleanLine,
                ) && cleanLine.length < 100;
            const isAllCapsHeading =
                cleanLine === cleanLine.toUpperCase() &&
                /[A-Z]/.test(cleanLine) &&
                cleanLine.length < 80 &&
                !cleanLine.endsWith('.');

            const isHeading =
                isMarkdownHeading || isAcademicHeading || isAllCapsHeading;

            const isUnorderedList =
                cleanLine.startsWith('- ') || cleanLine.startsWith('* ');
            const numMatch = cleanLine.match(/^(\d+)\.\s+(.*)$/);
            const isOrderedList = !!numMatch;

            if (isHeading || isUnorderedList || isOrderedList) {
                flushTextGroup();

                if (isHeading) {
                    let level = 2;
                    let text = cleanLine;

                    if (cleanLine.startsWith('# ')) {
                        level = 1;
                        text = cleanLine.slice(2);
                    } else if (cleanLine.startsWith('## ')) {
                        level = 2;
                        text = cleanLine.slice(3);
                    } else if (cleanLine.startsWith('### ')) {
                        level = 3;
                        text = cleanLine.slice(4);
                    }

                    elements.push({
                        type: 'heading',
                        level,
                        text,
                        shouldCenter:
                            isCenterHtml ||
                            cleanLine.startsWith('# ') ||
                            isAcademicHeading ||
                            isAllCapsHeading,
                    });
                } else if (isUnorderedList) {
                    elements.push({
                        type: 'list-unordered',
                        text: cleanLine.slice(2),
                    });
                } else if (isOrderedList && numMatch) {
                    elements.push({
                        type: 'list-ordered',
                        value: parseInt(numMatch[1], 10),
                        text: numMatch[2],
                    });
                }
            } else {
                currentTextGroup.push(line);
            }
        }

        flushTextGroup();

        return (
            <div key={idx} className="flex w-full flex-col">
                {elements.map((el, elIdx) => {
                    switch (el.type) {
                        case 'heading': {
                            const headingClasses =
                                {
                                    1: 'text-2xl font-extrabold text-foreground mt-6 mb-4 tracking-tight border-b pb-2',
                                    2: 'text-xl font-bold text-foreground mt-5 mb-3',
                                    3: 'text-lg font-semibold text-foreground mt-4 mb-2',
                                }[el.level as 1 | 2 | 3] ||
                                'text-xl font-bold text-foreground mt-5 mb-3';

                            return (
                                <div
                                    key={elIdx}
                                    className={
                                        el.shouldCenter
                                            ? 'w-full text-center'
                                            : 'text-left'
                                    }
                                >
                                    <h2 className={headingClasses}>
                                        {parseInlineStyles(el.text)}
                                    </h2>
                                </div>
                            );
                        }
                        case 'list-unordered':
                            return (
                                <ul
                                    key={elIdx}
                                    className="mb-2 ml-6 list-inside list-disc text-justify text-sm leading-relaxed tracking-wide text-foreground sm:text-base"
                                >
                                    <li>{parseInlineStyles(el.text)}</li>
                                </ul>
                            );
                        case 'list-ordered':
                            return (
                                <ol
                                    key={elIdx}
                                    className="mb-2 ml-6 list-inside list-decimal text-justify text-sm leading-relaxed tracking-wide text-foreground sm:text-base"
                                >
                                    <li value={el.value}>
                                        {parseInlineStyles(el.text)}
                                    </li>
                                </ol>
                            );
                        case 'image':
                            return (
                                <div
                                    key={elIdx}
                                    className="my-6 flex flex-col items-center justify-center gap-2"
                                >
                                    <img
                                        src={el.src}
                                        alt="Gambar Dokumen"
                                        className="max-h-[70vh] max-w-full rounded-lg border bg-background p-1.5 shadow-sm object-contain transition-transform hover:scale-[1.02]"
                                    />
                                    <span className="text-xs text-muted-foreground italic">
                                        Gambar pendukung dari dokumen asli
                                    </span>
                                </div>
                            );
                        case 'text':
                            return (
                                <p
                                    key={elIdx}
                                    className={`mb-4 text-justify text-sm leading-relaxed tracking-wide text-foreground sm:text-base ${el.shouldCenter ? 'text-center font-bold' : 'indent-8'}`}
                                >
                                    {parseInlineStyles(el.text)}
                                </p>
                            );
                        default:
                            return null;
                    }
                })}
            </div>
        );
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
            <div className="sticky top-0 z-50 flex flex-col justify-between gap-4 border-b bg-background/95 px-6 py-4 backdrop-blur sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
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
                        className="rounded-full border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="line-clamp-1 text-base font-bold">
                                {doc.title}
                            </h1>
                            {isDosen && (
                                <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                    Mode Pratinjau Dosen
                                </span>
                            )}
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <FileText className="h-3 w-3" /> {doc.fileName}
                        </p>
                    </div>
                </div>

                {/* Tracker Panel Controls */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
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
                                className="max-h-[70vh] min-h-[65vh] overflow-y-auto px-4 py-6 sm:px-10 md:px-16 lg:px-20"
                                style={{ scrollBehavior: 'smooth' }}
                            >
                                <article
                                    className={`prose prose-slate max-w-none text-sm leading-relaxed tracking-wide text-foreground transition-all duration-300 ease-in-out sm:text-base ${isAnimating ? (slideDirection === 'right' ? 'translate-x-4 opacity-0' : '-translate-x-4 opacity-0') : 'translate-x-0 opacity-100'} `}
                                >
                                    {pages[currentPage]
                                        ?.split('\n\n')
                                        .map((paragraph, idx) =>
                                            renderParagraph(paragraph, idx),
                                        )}
                                </article>
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
                                            Anti-Idle 2 Menit Aktif
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
                                        {doc.metrics.word_count}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-muted/40 p-2.5">
                                    <p className="text-muted-foreground">
                                        Jumlah Kalimat
                                    </p>
                                    <p className="font-mono text-sm font-bold text-foreground">
                                        {doc.metrics.sentence_count}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-muted/40 p-2.5">
                                    <p className="text-muted-foreground">
                                        Rerata Kalimat
                                    </p>
                                    <p className="font-mono text-sm font-bold text-foreground">
                                        {doc.metrics.average_sentence_length}{' '}
                                        kata
                                    </p>
                                </div>
                                <div className="rounded-lg bg-muted/40 p-2.5">
                                    <p className="text-muted-foreground">
                                        Kata Teknikal
                                    </p>
                                    <p className="font-mono text-sm font-bold text-foreground">
                                        {doc.metrics.technical_word_count}
                                    </p>
                                </div>
                            </div>
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
                            Sesi membaca di-pause karena tidak ada aktivitas selama 2 menit.
                            Klik &quot;Lanjutkan&quot; untuk meneruskan membaca.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            onClick={() => {
                                setShowIdleDialog(false);
                                setIsPlaying(true);
                                setLastActivity(Date.now());
                            }}
                        >
                            Lanjutkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
