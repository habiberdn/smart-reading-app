import { Head, Link } from '@inertiajs/react';
import {
    Clock,
    ArrowRight,
    Search,
    BookOpenCheck,
    User,
    CheckCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface AssignmentType {
    id: number;
    judul: string;
    deskripsi: string | null;
    classroom_name: string;
    dosen_name: string;
    tingkat_kesulitan: 'easy' | 'medium' | 'hard';
    estimasi_durasi: number;
    total_halaman: number;
    deadline: string;
    is_overdue: boolean;
    is_classroom_member: boolean;
    progress: {
        status: 'not_started' | 'in_progress' | 'completed';
        persentase: number;
        total_durasi_detik: number;
        halaman_sekarang: number;
    };
}

interface Props {
    assignments: AssignmentType[];
}

export default function AssignmentList({ assignments = [] }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTab, setFilterTab] = useState<
        'all' | 'in_progress' | 'completed'
    >('all');

    const getDifficultyBadge = (diff: 'easy' | 'medium' | 'hard') => {
        switch (diff) {
            case 'easy':
                return (
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        Mudah
                    </span>
                );
            case 'medium':
                return (
                    <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        Menengah
                    </span>
                );
            case 'hard':
                return (
                    <span className="rounded bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                        Tinggi
                    </span>
                );
        }
    };

    // Filter assignments based on search and selected tab
    const filtered = assignments.filter((a) => {
        const matchesSearch =
            a.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.classroom_name
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            a.dosen_name.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) {
            return false;
        }

        switch (filterTab) {
            case 'in_progress':
                return a.progress.status === 'in_progress';
            case 'completed':
                return a.progress.status === 'completed';
            default:
                return true;
        }
    });

    return (
        <>
            <Head title="Tugas Saya - Smart Reading">
                <meta
                    name="description"
                    content="Daftar tugas bacaan resmi dari kelas Anda di Smart Reading App."
                />
            </Head>

            <div className="mx-auto flex h-full min-h-screen w-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex flex-col">
                        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                            Akademik
                        </span>
                        <h1 className="text-2xl font-bold text-foreground">
                            Tugas Saya
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Menampilkan {filtered.length} tugas bacaan resmi
                        </p>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari tugas, kelas, atau nama dosen..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <div className="flex w-fit flex-wrap items-center gap-1.5 rounded-lg bg-muted p-0.5">
                        {(
                            [
                                { id: 'all', label: 'Semua' },
                                { id: 'in_progress', label: 'Sedang Dibaca' },
                                { id: 'completed', label: 'Selesai' },
                            ] as const
                        ).map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setFilterTab(tab.id)}
                                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                    filterTab === tab.id
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Assignments Grid */}
                {filtered.length === 0 ? (
                    <div className="rounded-lg border border-dashed bg-background p-12 text-center text-sm text-muted-foreground">
                        <BookOpenCheck className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
                        <h3 className="mb-1 text-base font-semibold text-foreground">
                            Tugas Tidak Ditemukan
                        </h3>
                        <p className="mx-auto max-w-md">
                            Tidak ada tugas bacaan yang sesuai dengan filter
                            atau kueri pencarian Anda.
                        </p>
                    </div>
                ) : (
                    <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
                        {filtered.map((a) => (
                            <Card
                                key={a.id}
                                className="flex h-full flex-col justify-between border bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                            >
                                <CardHeader className="pb-3">
                                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            {getDifficultyBadge(
                                                a.tingkat_kesulitan,
                                            )}
                                            {a.progress.status !==
                                                'completed' &&
                                                a.is_overdue && (
                                                    <span className="animate-pulse rounded bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                                                        Terlewat
                                                    </span>
                                                )}
                                            {a.progress.status ===
                                                'completed' && (
                                                <span className="flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                                    <CheckCircle className="h-3 w-3" />{' '}
                                                    Selesai
                                                </span>
                                            )}
                                        </div>
                                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                            {a.classroom_name}
                                        </span>
                                    </div>
                                    <CardTitle className="line-clamp-1 text-base font-bold">
                                        {a.judul}
                                    </CardTitle>
                                    <CardDescription className="mt-0.5 flex items-center gap-1 text-xs">
                                        <User className="h-3.5 w-3.5 text-muted-foreground" />{' '}
                                        Dosen: {a.dosen_name}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="flex-1 pb-4">
                                    <p className="mb-4 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                                        {a.deskripsi || 'Tidak ada deskripsi.'}
                                    </p>

                                    <div className="xs:gap-2 xs:text-xs mb-4 grid grid-cols-3 gap-1.5 text-[11px] text-muted-foreground">
                                        <div className="xs:p-2 rounded bg-muted/40 p-1.5 text-center">
                                            <p className="font-semibold text-foreground">
                                                {a.estimasi_durasi} menit
                                            </p>
                                            <p className="xs:text-[10px] text-[9px]">
                                                Estimasi
                                            </p>
                                        </div>
                                        <div className="xs:p-2 rounded bg-muted/40 p-1.5 text-center">
                                            <p className="font-semibold text-foreground">
                                                {a.total_halaman} hal
                                            </p>
                                            <p className="xs:text-[10px] text-[9px]">
                                                Materi
                                            </p>
                                        </div>
                                        <div
                                            className={`xs:p-2 rounded p-1.5 text-center transition-colors duration-300 ${a.progress.status !== 'completed' && a.is_overdue ? 'border border-rose-200 bg-rose-50 text-rose-700' : 'bg-muted/40'}`}
                                        >
                                            <p
                                                className={`font-semibold ${a.progress.status !== 'completed' && a.is_overdue ? 'font-bold text-rose-700' : 'text-foreground'}`}
                                            >
                                                {a.deadline}
                                            </p>
                                            <p className="xs:text-[10px] text-[9px]">
                                                Batas Waktu
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress Tracker Bar */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-medium text-muted-foreground">
                                                Progres Membaca
                                            </span>
                                            <span className="font-mono font-bold text-primary">
                                                {Math.round(
                                                    a.progress.persentase,
                                                )}
                                                %
                                            </span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${a.progress.status === 'completed' ? 'bg-emerald-500' : 'bg-primary'}`}
                                                style={{
                                                    width: `${a.progress.persentase}%`,
                                                }}
                                            />
                                        </div>
                                        <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <Clock className="h-3 w-3" /> Durasi
                                            aktif:{' '}
                                            {formatTimeSpent(
                                                a.progress.total_durasi_detik,
                                            )}
                                        </p>
                                    </div>
                                </CardContent>

                                <CardFooter className="border-t bg-muted/20 pt-3">
                                    <Button
                                        asChild
                                        className="w-full gap-1.5"
                                        variant={
                                            a.progress.status === 'completed'
                                                ? 'outline'
                                                : 'default'
                                        }
                                    >
                                        <Link href={`/read/${a.id}`}>
                                            {a.progress.status ===
                                            'completed' ? (
                                                <>
                                                    Baca Kembali{' '}
                                                    <ArrowRight className="h-4 w-4" />
                                                </>
                                            ) : a.progress.status ===
                                              'in_progress' ? (
                                                <>
                                                    Lanjutkan Membaca{' '}
                                                    <ArrowRight className="h-4 w-4" />
                                                </>
                                            ) : (
                                                <>
                                                    Mulai Membaca{' '}
                                                    <ArrowRight className="h-4 w-4" />
                                                </>
                                            )}
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function formatTimeSpent(totalSeconds: number) {
    if (!totalSeconds) {
        return '0 menit';
    }

    const minutes = Math.round(totalSeconds / 60);

    return `${minutes} menit`;
}

AssignmentList.layout = {
    breadcrumbs: [{ title: 'Tugas Saya', href: '/assignments' }],
};
