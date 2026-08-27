import { Link, Head, router } from '@inertiajs/react';
import {
    Users,
    BookOpen,
    BarChart3,
    Plus,
    GraduationCap,
    Copy,
    Check,
    Loader2,
} from 'lucide-react';
import { useState } from 'react';
import AssignmentCard from '@/components/classroom/assignment-card';
import ClassroomCard from '@/components/classroom/classroom-card';
import StatCard from '@/components/classroom/stats-card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes';

interface ClassroomType {
    id: number;
    name: string;
    semester: string | number;
    deskripsi: string | null;
    kode_kelas: string;
    mahasiswa_count?: number;
    reading_assignments_count?: number;
}

interface AssignmentType {
    id: number;
    title: string;
    dueDate: string;
    completionRate: number;
    averageProgress: number;
    classroomKode: string | null;
}

interface Props {
    name: string;
    classrooms: ClassroomType[];
    totalStudents: number;
    totalAssignments: number;
    classroomsCount: number;
    avgCompletionRate: string;
    assignments: AssignmentType[];
}

interface ClassFormState {
    name: string;
    description: string;
    code: string;
    semester: string;
}

const initialFormState: ClassFormState = {
    name: '',
    description: '',
    code: '',
    semester: '',
};

export default function Dashboard({
    name,
    classrooms = [],
    totalStudents = 0,
    totalAssignments = 0,
    classroomsCount = 0,
    avgCompletionRate = '0%',
    assignments = [],
}: Props) {
    const [isOpen, setOpen] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const [isCopied, setIsCopied] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [classForm, setClassForm] =
        useState<ClassFormState>(initialFormState);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setClassForm((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleCreateClass = (e: React.FormEvent) => {
        e.preventDefault();

        if (!classForm.name.trim() || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        const generatedCode = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

        router.post(
            '/dosen/classrooms',
            {
                name: classForm.name,
                semester: parseInt(classForm.semester, 10),
                kode_kelas: generatedCode,
                deskripsi: classForm.description,
            },
            {
                onSuccess: () => {
                    setIsSubmitting(false);
                    setClassForm((prev) => ({
                        ...prev,
                        code: generatedCode,
                    }));
                    setStep(2);
                },
                onError: (err) => {
                    setIsSubmitting(false);
                    alert(
                        'Gagal membuat kelas: ' + Object.values(err).join(', '),
                    );
                },
            },
        );
    };

    const handleCloseModal = () => {
        if (isSubmitting) return;
        setOpen(false);
        setTimeout(() => {
            setStep(1);
            setClassForm(initialFormState);
            setIsSubmitting(false);
        }, 300);
    };

    return (
        <>
            <Head title="Dashboard Dosen">
                <meta
                    name="description"
                    content="Dashboard dosen Smart Reading App: kelola kelas, pantau tugas bacaan, dan lihat progress mahasiswa."
                />
            </Head>
            <div className="flex h-full min-h-screen flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex flex-col">
                        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                            Selamat Datang, {name}
                        </span>
                        <h1 className="text-2xl font-bold text-foreground">
                            Rangkuman Dashboard
                        </h1>
                    </div>
                    <Button
                        className="gap-2 font-medium shadow-sm"
                        onClick={() => setOpen(true)}
                    >
                        <Plus className="h-4 w-4" /> Kelas Baru
                    </Button>
                </div>

                {/* Ringkasan Statistik */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Siswa"
                        value={totalStudents.toString()}
                        icon={<Users className="h-5 w-5 text-primary" />}
                        accent="primary"
                    />
                    <StatCard
                        title="Tugas Aktif"
                        value={totalAssignments.toString()}
                        icon={<BookOpen className="h-5 w-5 text-emerald-500" />}
                        accent="emerald"
                    />
                    <StatCard
                        title="Rata-rata Penyelesaian"
                        value={avgCompletionRate}
                        icon={<BarChart3 className="h-5 w-5 text-cyan-500" />}
                        accent="cyan"
                        trend
                    />
                    <StatCard
                        title="Ruang Kelas"
                        value={classroomsCount.toString()}
                        icon={
                            <GraduationCap className="h-4 w-4 text-amber-500" />
                        }
                        accent="amber"
                    />
                </div>

                {/* Daftar Kelas */}
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between">
                        <h2 className="text-md font-bold text-foreground">
                            Kelas mu
                        </h2>
                        <Link
                            href="/dosen/classrooms"
                            prefetch
                            className="text-sm text-muted-foreground hover:text-black"
                        >
                            Semua Kelas
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {classrooms.length > 0 ? (
                            classrooms.map((classroom) => (
                                <ClassroomCard
                                    key={classroom.id}
                                    classroom={classroom}
                                />
                            ))
                        ) : (
                            <div className="col-span-2 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                Belum ada kelas. Klik "+ Kelas Baru" di atas
                                untuk membuat kelas pertama Anda!
                            </div>
                        )}
                    </div>
                </div>

                {/* Daftar Tugas */}
                <div className="flex flex-col gap-3">
                    <h2 className="text-md font-bold text-foreground">
                        Tugas yang diberikan
                    </h2>
                    <div className="flex flex-col gap-4">
                        {assignments.length > 0 ? (
                            assignments.map((assignment) => (
                                <AssignmentCard
                                    key={assignment.id}
                                    title={assignment.title}
                                    dueDate={assignment.dueDate}
                                    completionRate={assignment.completionRate}
                                    averageProgress={assignment.averageProgress}
                                    classroomKode={
                                        assignment.classroomKode ?? undefined
                                    }
                                />
                            ))
                        ) : (
                            <div className="rounded-lg border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
                                Belum ada tugas yang diberikan. Silakan buat
                                tugas di dalam detail kelas.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Tambah Kelas & Copy Code */}
            <Dialog
                open={isOpen}
                onOpenChange={(open) => !open && handleCloseModal()}
            >
                <DialogContent className="sm:max-w-106.25">
                    {step === 1 ? (
                        <form onSubmit={handleCreateClass}>
                            <DialogHeader>
                                <DialogTitle>Tambah Kelas Baru</DialogTitle>
                                <DialogDescription>
                                    Isi detail kelas di bawah ini untuk membuat
                                    ruang kelas baru.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nama Kelas</Label>
                                    <Input
                                        id="name"
                                        placeholder="Contoh: Pemrograman Web Tingkat Lanjut"
                                        value={classForm.name}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="semester">Semester</Label>
                                    <Input
                                        id="semester"
                                        placeholder="Contoh: 3"
                                        value={classForm.semester}
                                        type="number"
                                        min={1}
                                        max={14}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">
                                        Deskripsi (Opsional)
                                    </Label>
                                    <Input
                                        id="description"
                                        placeholder="Contoh: Kelas Reguler Ruang A.3"
                                        value={classForm.description}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCloseModal}
                                    disabled={isSubmitting}
                                >
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Membuat Kelas...
                                        </>
                                    ) : (
                                        'Buat & Gali Kode'
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-4 text-center">
                            <DialogHeader className="items-center">
                                <DialogTitle>
                                    Kelas Berhasil Dibuat!
                                </DialogTitle>
                                <DialogDescription>
                                    Bagikan kode berikut kepada mahasiswa Anda
                                    agar mereka dapat bergabung.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border bg-muted p-4 font-mono text-3xl font-bold tracking-widest text-primary shadow-inner">
                                {classForm.code}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="ml-2 h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={() => {
                                        navigator.clipboard.writeText(classForm.code);
                                        setIsCopied(true);
                                    }}
                                >
                                    {isCopied ? (
                                        <Check className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>

                            {isCopied && (
                                <span className="mt-2 animate-pulse text-xs font-medium text-emerald-600">
                                    Kode berhasil disalin!
                                </span>
                            )}

                            <Button
                                className="mt-6 w-full"
                                onClick={handleCloseModal}
                            >
                                Selesai
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
