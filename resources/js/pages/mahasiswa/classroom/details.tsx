import { Head, Link } from '@inertiajs/react';
import {
    ChevronLeft,
    Clock,
    BookOpen,
    FileText,
    ArrowRight,
    User,
    Key,
    Layers,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AssignmentType {
    id: number;
    judul: string;
    deskripsi: string | null;
    tingkat_kesulitan: 'easy' | 'medium' | 'hard';
    estimasi_durasi: number;
    total_halaman: number;
    deadline: string;
    is_overdue?: boolean;
    progress: {
        status: 'not_started' | 'in_progress' | 'completed';
        persentase: number;
        total_durasi_detik: number;
    };
}

interface ClassroomType {
    id: number;
    name: string;
    semester: string | number;
    deskripsi: string | null;
    kode_kelas: string;
    dosen?: {
        name: string;
    };
}

interface Props {
    classroom: ClassroomType;
    assignments: AssignmentType[];
}

export default function DetailKelasMahasiswa({
    classroom,
    assignments = [],
}: Props) {
    const [filterTab, setFilterTab] = useState<'active' | 'all' | 'completed'>(
        'active',
    );
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

    const formatDuration = (totalSeconds: number) => {
        if (!totalSeconds) {
            return '0 menit';
        }

        const minutes = Math.round(totalSeconds / 60);

        return `${minutes} menit`;
    };

    return (
        <>
            <Head title={`Detail Kelas - ${classroom?.name}`}>
                <meta
                    name="description"
                    content={`Detail kelas ${classroom?.name}: akses tugas bacaan dan pantau progress membaca Anda.`}
                />
            </Head>
            {/* Menggunakan w-full mx-auto p-6 agar lebarnya penuh konsisten dengan dashboard */}
            <div className="mx-auto flex w-full flex-col gap-6 p-6">
                {/* Back Link & Header */}
                <div className="flex flex-col gap-2">
                    <Link
                        href="/mahasiswa/dashboard"
                        className="mb-1 flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ChevronLeft className="h-4 w-4" /> Kembali ke Dashboard
                    </Link>

                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                            <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                RUANG KELAS
                            </span>
                            <h1 className="mt-0.5 text-2xl font-bold text-foreground">
                                {classroom?.name}
                            </h1>
                            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <User className="h-3.5 w-3.5" /> Dosen:{' '}
                                    {classroom?.dosen?.name ||
                                        'Tidak diketahui'}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Layers className="h-3.5 w-3.5" /> Semester{' '}
                                    {classroom?.semester}
                                </span>
                            </p>
                            {classroom?.deskripsi && (
                                <p className="mt-3 max-w-3xl rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                                    {classroom.deskripsi}
                                </p>
                            )}
                        </div>

                        <div className="flex w-fit items-center gap-2 self-start rounded-lg border bg-background p-2.5 shadow-sm md:self-center">
                            <Key className="h-4 w-4 text-amber-500" />
                            <span className="text-xs text-muted-foreground">
                                Kode Join:
                            </span>
                            <span className="font-mono text-sm font-bold tracking-wider text-primary">
                                {classroom?.kode_kelas}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Assignment List */}
                <div className="mt-2 flex w-full flex-col gap-4">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                            <BookOpen className="h-5 w-5 text-emerald-500" />{' '}
                            Daftar Tugas Bacaan Anda
                        </h2>
                        <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
                            {(['active', 'all', 'completed'] as const).map(
                                (tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setFilterTab(tab)}
                                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filterTab === tab
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        {tab === 'active'
                                            ? 'Belum Selesai'
                                            : tab === 'all'
                                                ? 'Semua'
                                                : 'Selesai'}
                                    </button>
                                ),
                            )}
                        </div>
                    </div>

                    {(() => {
                        const filtered = assignments.filter((a) => {
                            if (filterTab === 'active') {
                                return a.progress.status !== 'completed';
                            }

                            if (filterTab === 'completed') {
                                return a.progress.status === 'completed';
                            }

                            return true;
                        });

                        if (filtered.length === 0) {
                            return (
                                <div className="w-full rounded-lg border border-dashed bg-background p-12 text-center text-sm text-muted-foreground">
                                    {filterTab === 'active'
                                        ? 'Tidak ada tugas !'
                                        : filterTab === 'completed'
                                            ? 'Belum ada tugas yang selesai.'
                                            : 'Belum ada tugas bacaan yang diberikan oleh dosen di kelas ini.'}
                                </div>
                            );
                        }

                        return (
                            <div className="grid w-full grid-cols-1 gap-4">
                                {filtered.map((a) => (
                                    <Card
                                        key={a.id}
                                        className="flex w-full flex-col justify-between gap-4 border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                                    >
                                        <div className="flex w-full flex-col items-start justify-between gap-2 border-b pb-3 sm:flex-row sm:items-center">
                                            <div>
                                                <h3 className="flex flex-wrap items-center gap-2 text-lg font-bold text-foreground">
                                                    {a.judul}
                                                    {a.progress.status !==
                                                        'completed' &&
                                                        a.is_overdue && (
                                                            <span className="animate-pulse rounded bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                                                                Terlewat
                                                            </span>
                                                        )}
                                                </h3>
                                                <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                                                    <FileText className="h-3.5 w-3.5" />{' '}
                                                    {a.total_halaman} halaman •
                                                    Estimasi:{' '}
                                                    {a.estimasi_durasi} menit •
                                                    Batas:{' '}
                                                    <span
                                                        className={
                                                            a.progress
                                                                .status !==
                                                                'completed' &&
                                                                a.is_overdue
                                                                ? 'font-semibold text-rose-600'
                                                                : ''
                                                        }
                                                    >
                                                        {a.deadline}
                                                    </span>
                                                </p>
                                            </div>
                                            <div>
                                                {getDifficultyBadge(
                                                    a.tingkat_kesulitan,
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-xs leading-relaxed text-muted-foreground">
                                            {a.deskripsi ||
                                                'Tidak ada deskripsi tugas.'}
                                        </div>

                                        {/* Progress & Actions Section */}
                                        <div className="flex w-full flex-col items-stretch justify-between gap-4 rounded-lg border bg-muted/20 p-4 md:flex-row md:items-center">
                                            <div className="flex-1 space-y-1.5">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-semibold text-foreground">
                                                        Progres Membaca
                                                    </span>
                                                    <span className="font-mono font-bold text-primary">
                                                        {Math.round(
                                                            a.progress
                                                                .persentase,
                                                        )}
                                                        %
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-300 ${a.progress
                                                            .status ===
                                                            'completed'
                                                            ? 'bg-emerald-500'
                                                            : 'bg-primary'
                                                            }`}
                                                        style={{
                                                            width: `${a.progress.persentase}%`,
                                                        }}
                                                    />
                                                </div>
                                                <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                                                    <Clock className="h-3 w-3" />{' '}
                                                    Durasi aktif:{' '}
                                                    {formatDuration(
                                                        a.progress
                                                            .total_durasi_detik,
                                                    )}
                                                </p>
                                            </div>

                                            <Button
                                                asChild
                                                className="min-w-40 gap-1.5 self-end md:self-auto"
                                                variant={
                                                    a.progress.status ===
                                                        'completed'
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
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            </div>
        </>
    );
}

DetailKelasMahasiswa.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/mahasiswa/dashboard' },
        { title: 'Detail Kelas', href: '#' },
    ],
};
