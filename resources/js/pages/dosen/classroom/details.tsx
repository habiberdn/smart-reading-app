import { Head, Link, router } from '@inertiajs/react';
import {
    Key,
    ChevronLeft,
    CheckCircle2,
    Clock,
    AlertCircle,
    Plus,
    Trash2,
    FileText,
    Loader2,
    Copy,
    Check,
    Eye,
    Pencil,
} from 'lucide-react';
import { useState } from 'react';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StudentType {
    id: number;
    nim: string;
    name: string;
    readingProgress: string;
    timeSpent: string;
    totalSessions?: number;
    status: string;
}

interface AssignmentType {
    id: number | string;
    judul?: string;
    title?: string;
    file_path?: string;
    fileName?: string;
    deadline?: string;
    dueDate?: string;
    tingkat_kesulitan?: string;
    difficulty?: string;
}

interface ClassroomType {
    id: number;
    name: string;
    semester: string | number;
    deskripsi: string | null;
    kode_kelas: string;
    is_active?: boolean;
    dosen?: {
        name: string;
    };
    reading_assignments?: AssignmentType[];
}

interface Props {
    classroom: ClassroomType;
    students: StudentType[];
}

export default function DetailKelas({ classroom, students = [] }: Props) {
    const assignments = classroom?.reading_assignments || [];
    const [isOpen, setOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [taskTitle, setTaskTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Edit & Delete classroom state
    const [isEditOpen, setEditOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editForm, setEditForm] = useState({
        name: classroom?.name || '',
        semester: String(classroom?.semester || ''),
        kode_kelas: classroom?.kode_kelas || '',
        deskripsi: classroom?.deskripsi || '',
        is_active: classroom?.is_active !== false,
    });

    // Helper to display difficulty nicely
    const getDifficultyLabel = (diff?: string) => {
        switch (diff) {
            case 'easy':
                return 'Mudah';
            case 'medium':
                return 'Menengah';
            case 'hard':
                return 'Tinggi';
            default:
                return diff || 'Menengah';
        }
    };

    // Handler Tambah Tugas (Upload PDF riil & Memicu AI/NLP di backend)
    const handleAddAssignment = (e: React.FormEvent) => {
        e.preventDefault();

        if (!taskTitle || !selectedFile) {
            return;
        }

        setIsAnalyzing(true);

        router.post(
            `/dosen/classrooms/${classroom.kode_kelas}/assignments`,
            {
                title: taskTitle,
                dueDate: dueDate,
                pdfFile: selectedFile,
            },
            {
                onSuccess: () => {
                    setIsAnalyzing(false);
                    handleCloseModal();
                },
                onError: (err) => {
                    setIsAnalyzing(false);
                    alert(
                        'Gagal menambah tugas: ' +
                            Object.values(err).join(', '),
                    );
                },
            },
        );
    };

    // Handler Hapus Tugas
    const handleDeleteAssignment = (id: string | number) => {
        if (
            confirm(
                'Apakah Anda yakin ingin menghapus tugas bacaan ini? Mahasiswa tidak akan bisa lagi mengakses progres materi ini.',
            )
        ) {
            router.delete(`/dosen/assignments/${id}`, {
                onError: (err) => {
                    alert(
                        'Gagal menghapus tugas: ' +
                            Object.values(err).join(', '),
                    );
                },
            });
        }
    };

    const handleCloseModal = () => {
        setOpen(false);
        setTaskTitle('');
        setDueDate('');
        setSelectedFile(null);
    };

    // Edit classroom handler
    const handleEditClassroom = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.put(
            `/dosen/classrooms/${classroom.kode_kelas}`,
            {
                name: editForm.name,
                semester: parseInt(editForm.semester, 10),
                kode_kelas: editForm.kode_kelas,
                deskripsi: editForm.deskripsi,
                is_active: editForm.is_active,
            },
            {
                onSuccess: () => {
                    setIsSubmitting(false);
                    setEditOpen(false);
                },
                onError: (err) => {
                    setIsSubmitting(false);
                    alert('Gagal mengubah kelas: ' + Object.values(err).join(', '));
                },
            },
        );
    };

    // Delete classroom handler
    const handleDeleteClassroom = () => {
        setIsSubmitting(true);
        router.delete(`/dosen/classrooms/${classroom.kode_kelas}`, {
            onSuccess: () => {
                setIsSubmitting(false);
            },
            onError: (err) => {
                setIsSubmitting(false);
                alert('Gagal menghapus kelas: ' + Object.values(err).join(', '));
            },
        });
    };

    return (
        <>
            <Head title={`Detail Kelas - ${classroom?.name}`}>
                <meta
                    name="description"
                    content={`Detail kelas ${classroom?.name}: pantau aktivitas mahasiswa, progress membaca, dan kelola tugas bacaan.`}
                />
            </Head>
            <div className="flex flex-col gap-6 p-6">
                {/* Tombol Kembali & Header */}
                <div className="flex flex-col gap-2">
                    <Link
                        href="/dosen/classrooms"
                        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ChevronLeft className="h-4 w-4" /> Kembali ke Daftar
                        Kelas
                    </Link>
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                            <h1 className="text-2xl font-bold">
                                {classroom?.name}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {classroom?.deskripsi || 'Tidak ada deskripsi.'}{' '}
                                • Semester {classroom?.semester}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setEditForm({ name: classroom?.name || '', semester: String(classroom?.semester || ''), kode_kelas: classroom?.kode_kelas || '', deskripsi: classroom?.deskripsi || '', is_active: classroom?.is_active !== false }); setEditOpen(true); }}>
                                <Pencil className="h-3.5 w-3.5" /> Edit Kelas
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => setDeleteOpen(true)}>
                                <Trash2 className="h-3.5 w-3.5" /> Hapus Kelas
                            </Button>
                        </div>
                        <div className="flex w-fit items-center gap-2 rounded-lg border bg-background p-2.5 shadow-sm">
                            <Key className="h-4 w-4 text-amber-500" />
                            <span className="text-xs text-muted-foreground">
                                Kode Join:
                            </span>
                            <span className="font-mono text-sm font-bold tracking-wider text-primary">
                                {classroom?.kode_kelas}
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                    if (classroom?.kode_kelas) {
                                        navigator.clipboard.writeText(classroom.kode_kelas);
                                        setIsCopied(true);
                                        setTimeout(() => setIsCopied(false), 2000);
                                    }
                                }}
                            >
                                {isCopied ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Konten Utama Tabs */}
                <Tabs defaultValue="aktivitas" className="w-full">
                    <div className="flex flex-col items-start justify-between gap-4 border-b pb-px md:flex-row md:items-center">
                        <TabsList className="grid w-full max-w-100 grid-cols-2">
                            <TabsTrigger value="aktivitas">
                                Aktivitas Mahasiswa
                            </TabsTrigger>
                            <TabsTrigger value="tugas">
                                Daftar Tugas Bacaan
                            </TabsTrigger>
                        </TabsList>

                        {/* Tombol Tambah Tugas ditaruh sejajar dengan Tabs agar efisien ruang */}
                        <Button
                            className="mb-2 gap-2 self-end md:mb-0 md:self-auto"
                            onClick={() => setOpen(true)}
                        >
                            <Plus className="h-4 w-4" /> Tambah Tugas Bacaan
                        </Button>
                    </div>

                    <TabsContent value="aktivitas" className="mt-4">
                        <div className="overflow-hidden rounded-md border bg-background shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>NIM</TableHead>
                                        <TableHead>Nama Mahasiswa</TableHead>
                                        <TableHead>Progres Membaca</TableHead>
                                        <TableHead>Durasi Membaca</TableHead>
                                        <TableHead>Sesi Membaca</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="py-6 text-center text-sm text-muted-foreground"
                                            >
                                                Belum ada mahasiswa yang
                                                bergabung di kelas ini.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        students.map((student) => (
                                            <TableRow key={student.id}>
                                                <TableCell className="font-mono text-sm">
                                                    {student.nim}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {student.name}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex w-30 items-center gap-2">
                                                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                                            <div
                                                                className={`h-full rounded-full ${
                                                                    student.readingProgress ===
                                                                    '100%'
                                                                        ? 'bg-emerald-500'
                                                                        : 'bg-primary'
                                                                }`}
                                                                style={{
                                                                    width: student.readingProgress,
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-medium">
                                                            {
                                                                student.readingProgress
                                                            }
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {student.timeSpent}
                                                </TableCell>
                                                <TableCell className="text-sm font-medium text-foreground">
                                                    {student.totalSessions ?? 0} sesi
                                                </TableCell>
                                                <TableCell>
                                                    {student.status ===
                                                        'Selesai' && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                                                            <CheckCircle2 className="h-3 w-3" />{' '}
                                                            Selesai
                                                        </span>
                                                    )}
                                                    {student.status ===
                                                        'Membaca' && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                                                            <Clock className="h-3 w-3" />{' '}
                                                            Membaca
                                                        </span>
                                                    )}
                                                    {student.status ===
                                                        'Belum Selesai' && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                                                            <AlertCircle className="h-3 w-3" />{' '}
                                                            Belum Selesai
                                                        </span>
                                                    )}
                                                    {student.status ===
                                                        'Terlambat' && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                                            <AlertCircle className="h-3 w-3" />{' '}
                                                            Terlambat
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="tugas" className="mt-4">
                        <div className="grid gap-4">
                            {assignments.length === 0 ? (
                                <div className="rounded-lg border border-dashed bg-background py-12 text-center text-sm text-muted-foreground">
                                    Belum ada tugas bacaan yang ditambahkan di
                                    kelas ini.
                                </div>
                            ) : (
                                assignments.map((assignment) => (
                                    <div
                                        key={assignment.id}
                                        className="flex flex-col items-start justify-between gap-4 rounded-lg border bg-background p-4 shadow-sm sm:flex-row sm:items-center"
                                    >
                                        <div className="space-y-1">
                                            <h3 className="text-base font-bold text-foreground">
                                                {assignment.judul ||
                                                    assignment.title}
                                            </h3>
                                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <FileText className="h-3 w-3" />{' '}
                                                File:{' '}
                                                {assignment.file_path ||
                                                    assignment.fileName ||
                                                    'Materi Eksternal'}
                                            </p>

                                            {/* Badge Indikator Hasil Analisis Smart NLP Backend & Deadline */}
                                            <div className="mt-2 flex flex-wrap items-center gap-2 pt-1">
                                                <span className={`flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold ${(!assignment.deadline || assignment.deadline === 'Tanpa Batas') ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                                    <Clock className="h-3 w-3" />
                                                    Batas Waktu: {assignment.deadline || assignment.dueDate || 'Tanpa Batas'}
                                                </span>
                                                <span
                                                    className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                                                        (assignment.tingkat_kesulitan ||
                                                            assignment.difficulty) ===
                                                            'easy' ||
                                                        (assignment.tingkat_kesulitan ||
                                                            assignment.difficulty) ===
                                                            'Mudah'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : (assignment.tingkat_kesulitan ||
                                                                    assignment.difficulty) ===
                                                                    'medium' ||
                                                                (assignment.tingkat_kesulitan ||
                                                                    assignment.difficulty) ===
                                                                    'Menengah'
                                                              ? 'bg-amber-50 text-amber-700'
                                                              : 'bg-rose-50 text-rose-700'
                                                    }`}
                                                >
                                                    Kesulitan:{' '}
                                                    {getDifficultyLabel(
                                                        assignment.tingkat_kesulitan ||
                                                            assignment.difficulty,
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Aksi Tugas */}
                                        <div className="flex items-center gap-1 self-end sm:self-auto">
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="sm"
                                                className="gap-2 text-muted-foreground hover:text-primary"
                                            >
                                                <Link href={`/read/${assignment.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                    <span className="hidden sm:inline">Baca Dokumen</span>
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-destructive"
                                                onClick={() =>
                                                    handleDeleteAssignment(
                                                        assignment.id,
                                                    )
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* MODAL: UPLOAD FILE PDF & EXTRAKSI NLP */}
            <Dialog
                open={isOpen}
                onOpenChange={(open) =>
                    !open && !isAnalyzing && handleCloseModal()
                }
            >
                <DialogContent className="sm:max-w-112.5">
                    <form onSubmit={handleAddAssignment}>
                        <DialogHeader>
                            <DialogTitle>Tambah Tugas Bacaan Baru</DialogTitle>
                            <DialogDescription>
                                Unggah dokumen PDF materi kuliah. Sistem AI akan
                                mengekstraksi teks untuk melacak statistik
                                membaca mahasiswa.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">
                                    Judul Tugas / Materi
                                </Label>
                                <Input
                                    id="title"
                                    placeholder="Contoh: Analisis Gaya Bahasa Bab 1"
                                    value={taskTitle}
                                    onChange={(e) =>
                                        setTaskTitle(e.target.value)
                                    }
                                    disabled={isAnalyzing}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="dueDate">
                                    Batas Waktu Membaca (Optional)
                                </Label>
                                <Input
                                    id="dueDate"
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    disabled={isAnalyzing}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="pdfFile">
                                    File Dokumen (PDF)
                                </Label>
                                <Input
                                    id="pdfFile"
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) =>
                                        setSelectedFile(
                                            e.target.files
                                                ? e.target.files[0]
                                                : null,
                                        )
                                    }
                                    disabled={isAnalyzing}
                                    required
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCloseModal}
                                disabled={isAnalyzing}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isAnalyzing}
                                className="min-w-35"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        NLP Menganalisis...
                                    </>
                                ) : (
                                    'Proses & Tambah'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL: EDIT KELAS */}
            <Dialog open={isEditOpen} onOpenChange={(open) => !open && !isSubmitting && setEditOpen(false)}>
                <DialogContent className="sm:max-w-106.25">
                    <form onSubmit={handleEditClassroom}>
                        <DialogHeader>
                            <DialogTitle>Edit Kelas</DialogTitle>
                            <DialogDescription>Ubah detail kelas di bawah ini.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Nama Kelas</Label>
                                <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} disabled={isSubmitting} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-semester">Semester</Label>
                                <Input id="edit-semester" type="number" min={1} max={14} value={editForm.semester} onChange={(e) => setEditForm((p) => ({ ...p, semester: e.target.value }))} disabled={isSubmitting} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-kode">Kode Kelas</Label>
                                <Input id="edit-kode" value={editForm.kode_kelas} onChange={(e) => setEditForm((p) => ({ ...p, kode_kelas: e.target.value }))} disabled={isSubmitting} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-deskripsi">Deskripsi (Opsional)</Label>
                                <Input id="edit-deskripsi" value={editForm.deskripsi} onChange={(e) => setEditForm((p) => ({ ...p, deskripsi: e.target.value }))} disabled={isSubmitting} />
                            </div>
                            <div className="flex items-center gap-2">
                                <input id="edit-active" type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm((p) => ({ ...p, is_active: e.target.checked }))} disabled={isSubmitting} className="h-4 w-4 rounded border-gray-300" />
                                <Label htmlFor="edit-active">Kelas Aktif</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={isSubmitting}>Batal</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : 'Simpan Perubahan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL: HAPUS KELAS */}
            <Dialog open={isDeleteOpen} onOpenChange={(open) => !open && !isSubmitting && setDeleteOpen(false)}>
                <DialogContent className="sm:max-w-100">
                    <DialogHeader>
                        <DialogTitle>Hapus Kelas</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus kelas <strong>{classroom?.name}</strong>? Semua data tugas dan progres mahasiswa di kelas ini akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={isSubmitting}>Batal</Button>
                        <Button variant="destructive" onClick={handleDeleteClassroom} disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menghapus...</> : 'Ya, Hapus Kelas'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

DetailKelas.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dosen' },
        { title: 'Semua Kelas', href: '/dosen/classrooms' },
        { title: 'Detail Kelas', href: '#' },
    ],
};
