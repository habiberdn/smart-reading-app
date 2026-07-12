import { Link, Head, useForm } from '@inertiajs/react';
import {
    BookOpen,
    Clock,
    Plus,
    GraduationCap,
    ArrowRight,
    Bookmark,
    Gauge,
    BookOpenCheck,
    FileText,
    Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import RecommendationCard from '@/components/mahasiswa/recommendation-card';
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
import { Label } from '@/components/ui/label';
import type { RecommendationType } from '@/types';

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

interface AssignmentType {
    id: number;
    judul: string;
    deskripsi: string | null;
    classroom_name: string;
    tingkat_kesulitan: 'easy' | 'medium' | 'hard';
    estimasi_durasi: number;
    total_halaman: number;
    deadline: string;
    is_overdue?: boolean;
    progress: {
        status: 'not_started' | 'in_progress' | 'completed';
        persentase: number;
        total_durasi_detik: number;
        halaman_sekarang: number;
    };
}

interface User {
    name: string;
}

interface Props {
    auth: {
        user: User;
    };
    classrooms: ClassroomType[];
    assignments: AssignmentType[];
    totalReadingTime: string;
    booksCount: number;
    articlesCount: number;
    papersCount: number;
    avgDifficulty: number;
    recommendations: RecommendationType[];
}

export default function MahasiswaDashboard({
    auth,
    classrooms = [],
    assignments = [],
    totalReadingTime = '0 jam',
    booksCount = 0,
    articlesCount = 0,
    papersCount = 0,
    avgDifficulty = 0,
    recommendations = [],
}: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        kode_kelas: '',
    });

    const [message, setMessage] = useState<string | null>(null);
    const [filterTab, setFilterTab] = useState<'active' | 'all' | 'completed'>(
        'active',
    );

    const handleJoinClass = (e: React.FormEvent) => {
        e.preventDefault();
        post('/mahasiswa/classrooms/join', {
            onSuccess: () => {
                reset();
                setMessage('Berhasil bergabung dengan kelas!');
                setTimeout(() => setMessage(null), 3000);
            },
        });
    };

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

    return (
        <>
            <Head title="Dashboard Mahasiswa">
                <meta
                    name="description"
                    content="Dashboard mahasiswa Smart Reading App: lihat tugas bacaan, kelas terdaftar, dan statistik membaca Anda."
                />
            </Head>
            <div className="mx-auto flex h-full min-h-screen w-full flex-1 flex-col gap-6 p-6">
                {/* Header Welcome */}
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex flex-col">
                        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                            Selamat Datang, {auth.user.name}
                        </span>
                        <h1 className="text-2xl font-bold text-foreground">
                            Dashboard Mahasiswa
                        </h1>
                    </div>
                </div>

                {/* Ringkasan Statistik Membaca (READFLOW.txt) */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <Card className="border bg-card shadow-sm transition-shadow hover:shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                Total Durasi Baca
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-extrabold text-foreground">
                                    {totalReadingTime}
                                </span>
                            </div>
                            <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="h-3 w-3 text-primary" />{' '}
                                Akumulasi aktif
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border bg-card shadow-sm transition-shadow hover:shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                Buku Selesai
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-extrabold text-foreground">
                                    {booksCount}
                                </span>
                            </div>
                            <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                                <BookOpenCheck className="h-3 w-3 text-rose-500" />{' '}
                                &gt; 15 halaman
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border bg-card shadow-sm transition-shadow hover:shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                Artikel Selesai
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-extrabold text-foreground">
                                    {articlesCount}
                                </span>
                            </div>
                            <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                                <FileText className="h-3 w-3 text-amber-500" />{' '}
                                6–15 halaman
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border bg-card shadow-sm transition-shadow hover:shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                Paper Selesai
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-extrabold text-foreground">
                                    {papersCount}
                                </span>
                            </div>
                            <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Bookmark className="h-3 w-3 text-emerald-500" />{' '}
                                &le; 5 halaman
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border bg-card shadow-sm transition-shadow hover:shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                Rerata Kesulitan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-extrabold text-foreground">
                                    {avgDifficulty}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    / 100
                                </span>
                            </div>
                            <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Gauge className="h-3 w-3 text-cyan-500" />{' '}
                                Kompleksitas AI
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Join Kelas & Kelas Saya */}
                <div className="flex flex-col gap-6 ">
                    <Card className="h-fit shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-bold">
                                Gabung Kelas Baru
                            </CardTitle>
                            <CardDescription>
                                Masukkan kode kelas dari dosen Anda untuk
                                mengakses materi kuliah.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleJoinClass}>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="kode_kelas">
                                        Kode Kelas
                                    </Label>
                                    <Input
                                        id="kode_kelas"
                                        placeholder="Contoh: A7B2X9"
                                        value={data.kode_kelas}
                                        onChange={(e) =>
                                            setData(
                                                'kode_kelas',
                                                e.target.value.toUpperCase(),
                                            )
                                        }
                                        required
                                        disabled={processing}
                                        className="text-center font-mono tracking-widest uppercase"
                                    />
                                    {errors.kode_kelas && (
                                        <p className="mt-0.5 text-xs text-destructive">
                                            {errors.kode_kelas}
                                        </p>
                                    )}
                                    {message && (
                                        <p className="mt-0.5 text-xs font-semibold text-emerald-600">
                                            {message}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    type="submit"
                                    className="w-full gap-2"
                                    disabled={processing}
                                >
                                    <Plus className="h-4 w-4" /> Gabung Kelas
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>

                    {/* Daftar Kelas Enrolled */}
                    <div className="space-y-4 lg:col-span-2">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                            <GraduationCap className="h-5 w-5 text-primary" />{' '}
                            Kelas Saya
                        </h2>
                        {classrooms.length === 0 ? (
                            <div className="rounded-lg border border-dashed bg-background p-12 text-center text-sm text-muted-foreground">
                                Anda belum bergabung ke kelas mana pun. Gunakan
                                form di sebelah kiri untuk masuk kelas.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {classrooms.map((c) => (
                                    <Link
                                        key={c.id}
                                        href={`/mahasiswa/classrooms/${c.kode_kelas}`}
                                        className="group block"
                                    >
                                        <Card className="flex h-full flex-col justify-between border shadow-sm transition-all group-hover:border-primary hover:shadow-md">
                                            <CardHeader className="pb-2">
                                                <div className="mb-1 flex items-center justify-between">
                                                    <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-bold text-muted-foreground">
                                                        {c.kode_kelas}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        Semester {c.semester}
                                                    </span>
                                                </div>
                                                <CardTitle className="line-clamp-1 text-base transition-colors group-hover:text-primary">
                                                    {c.name}
                                                </CardTitle>
                                                <CardDescription className="mt-0.5 line-clamp-1 text-xs">
                                                    Dosen:{' '}
                                                    {c.dosen?.name ||
                                                        'Tidak diketahui'}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="pt-0 pb-4">
                                                <p className="line-clamp-2 text-xs text-muted-foreground">
                                                    {c.deskripsi ||
                                                        'Tidak ada deskripsi.'}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tugas Bacaan Dinamis */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                            <BookOpen className="h-5 w-5 text-emerald-500" />{' '}
                            Tugas Bacaan
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
                                <div className="rounded-lg border border-dashed bg-background p-12 text-center text-sm text-muted-foreground">
                                    {filterTab === 'active'
                                        ? 'Tidak ada tugas !'
                                        : filterTab === 'completed'
                                            ? 'Belum ada tugas yang selesai.'
                                            : 'Belum ada tugas bacaan yang diberikan oleh dosen Anda saat ini.'}
                                </div>
                            );
                        }

                        return (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {filtered.map((a) => (
                                    <Card
                                        key={a.id}
                                        className="flex flex-col justify-between shadow-sm transition-shadow hover:shadow-md"
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="mb-1.5 flex items-center justify-between">
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
                                                </div>
                                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                                    {a.classroom_name}
                                                </span>
                                            </div>
                                            <CardTitle className="line-clamp-1 text-lg">
                                                {a.judul}
                                            </CardTitle>
                                            <CardDescription className="mt-1 line-clamp-2 text-xs">
                                                {a.deskripsi ||
                                                    'Tidak ada deskripsi.'}
                                            </CardDescription>
                                        </CardHeader>

                                        <CardContent className="pb-4">
                                            <div className="xs:gap-2 xs:text-xs mb-4 grid grid-cols-3 gap-1.5 text-[11px] text-muted-foreground">
                                                <div className="xs:p-2 rounded bg-muted/40 p-1.5 text-center">
                                                    <p className="font-semibold text-foreground">
                                                        {a.estimasi_durasi}{' '}
                                                        menit
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

                                            {/* Progress Bar */}
                                            <div className="space-y-1.5">
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
                                                <div className="h-2 overflow-hidden rounded-full bg-muted">
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
                                            </div>
                                        </CardContent>

                                        <CardFooter className="border-t bg-muted/20 pt-3">
                                            <Button
                                                asChild
                                                className="w-full gap-1.5"
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
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        );
                    })()}
                </div>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col items-start justify-between gap-1 sm:flex-row sm:items-center sm:gap-4">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                            <Sparkles className="h-5 w-5 text-primary" />{' '}
                            Rekomendasi Bacaan
                        </h2>
                        <span className="text-xs text-muted-foreground">
                            Berdasarkan kebiasaan membaca Anda
                        </span>
                    </div>
                    {recommendations.length === 0 ? (
                        <div className="rounded-lg border border-dashed bg-background p-12 text-center text-sm text-muted-foreground">
                            Belum ada rekomendasi. Mulailah membaca tugas yang
                            tersedia!
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {recommendations.map((rec, i) => (
                                <RecommendationCard
                                    key={rec.assignment.id}
                                    recommendation={rec}
                                    rank={i + 1}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

MahasiswaDashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: '/mahasiswa/dashboard' }],
};
