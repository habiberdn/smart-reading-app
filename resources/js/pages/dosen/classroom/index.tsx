import { Link, Head, router } from '@inertiajs/react';
import { BookOpen, Users, ArrowRight, MoreVertical, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface ClassroomType {
    id: number;
    name: string;
    semester: string | number;
    deskripsi: string | null;
    kode_kelas: string;
    is_active?: boolean;
    mahasiswa_count?: number;
    reading_assignments_count?: number;
}

export default function Classroom({
    classrooms = [],
}: {
    classrooms: ClassroomType[];
}) {
    const [editTarget, setEditTarget] = useState<ClassroomType | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ClassroomType | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', semester: '', kode_kelas: '', deskripsi: '', is_active: true });

    const openEdit = (c: ClassroomType) => {
        setEditForm({ name: c.name, semester: String(c.semester), kode_kelas: c.kode_kelas, deskripsi: c.deskripsi || '', is_active: c.is_active !== false });
        setEditTarget(c);
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editTarget) return;
        setIsSubmitting(true);
        router.put(`/dosen/classrooms/${editTarget.kode_kelas}`, {
            name: editForm.name,
            semester: parseInt(editForm.semester, 10),
            kode_kelas: editForm.kode_kelas,
            deskripsi: editForm.deskripsi,
            is_active: editForm.is_active,
        }, {
            onSuccess: () => { setIsSubmitting(false); setEditTarget(null); },
            onError: (err) => { setIsSubmitting(false); alert('Gagal: ' + Object.values(err).join(', ')); },
        });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        setIsSubmitting(true);
        router.delete(`/dosen/classrooms/${deleteTarget.kode_kelas}`, {
            onSuccess: () => { setIsSubmitting(false); setDeleteTarget(null); },
            onError: (err) => { setIsSubmitting(false); alert('Gagal: ' + Object.values(err).join(', ')); },
        });
    };

    return (
        <>
            <Head title="Semua Kelas - Dosen">
                <meta
                    name="description"
                    content="Daftar semua kelas yang Anda ampu sebagai dosen di Smart Reading App."
                />
            </Head>
            <div className="flex flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Daftar Kelas Anda
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Kelola dan pantau semua aktivitas ruang kelas aktif.
                    </p>
                </div>

                {classrooms.length === 0 ? (
                    <div className="rounded-lg border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">
                        Belum ada kelas yang dibuat. Silakan buat kelas baru di
                        halaman Dashboard.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {classrooms.map((item) => (
                            <Card
                                key={item.id}
                                className="flex flex-col justify-between shadow-sm transition-shadow hover:shadow-md"
                            >
                                <CardHeader className="pb-3">
                                    <div className="mb-1 flex items-center justify-between">
                                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                            Semester {item.semester}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-bold text-muted-foreground">
                                                Code: {item.kode_kelas}
                                            </span>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEdit(item)}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Edit Kelas
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(item)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Hapus Kelas
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                    <CardTitle className="line-clamp-1 text-xl">
                                        {item.name}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2 min-h-10">
                                        {item.deskripsi ||
                                            'Tidak ada deskripsi.'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pb-4">
                                    <div className="flex gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="h-4 w-4 text-primary" />
                                            <span>
                                                {item.mahasiswa_count ?? 0}{' '}
                                                Mahasiswa
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <BookOpen className="h-4 w-4 text-emerald-500" />
                                            <span>
                                                {item.reading_assignments_count ??
                                                    0}{' '}
                                                Tugas
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="border-t bg-muted/30 pt-3">
                                    <Button
                                        asChild
                                        className="w-full gap-2"
                                        variant="outline"
                                    >
                                        <Link
                                            href={`/dosen/classrooms/${item.kode_kelas}`}
                                        >
                                            Lihat Detail{' '}
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL: EDIT KELAS */}
            <Dialog open={!!editTarget} onOpenChange={(open) => !open && !isSubmitting && setEditTarget(null)}>
                <DialogContent className="sm:max-w-106.25">
                    <form onSubmit={handleEdit}>
                        <DialogHeader>
                            <DialogTitle>Edit Kelas</DialogTitle>
                            <DialogDescription>Ubah detail kelas di bawah ini.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="idx-edit-name">Nama Kelas</Label>
                                <Input id="idx-edit-name" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} disabled={isSubmitting} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="idx-edit-semester">Semester</Label>
                                <Input id="idx-edit-semester" type="number" min={1} max={14} value={editForm.semester} onChange={(e) => setEditForm((p) => ({ ...p, semester: e.target.value }))} disabled={isSubmitting} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="idx-edit-kode">Kode Kelas</Label>
                                <Input id="idx-edit-kode" value={editForm.kode_kelas} onChange={(e) => setEditForm((p) => ({ ...p, kode_kelas: e.target.value }))} disabled={isSubmitting} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="idx-edit-deskripsi">Deskripsi (Opsional)</Label>
                                <Input id="idx-edit-deskripsi" value={editForm.deskripsi} onChange={(e) => setEditForm((p) => ({ ...p, deskripsi: e.target.value }))} disabled={isSubmitting} />
                            </div>
                            <div className="flex items-center gap-2">
                                <input id="idx-edit-active" type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm((p) => ({ ...p, is_active: e.target.checked }))} disabled={isSubmitting} className="h-4 w-4 rounded border-gray-300" />
                                <Label htmlFor="idx-edit-active">Kelas Aktif</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditTarget(null)} disabled={isSubmitting}>Batal</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : 'Simpan Perubahan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL: HAPUS KELAS */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && !isSubmitting && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-100">
                    <DialogHeader>
                        <DialogTitle>Hapus Kelas</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus kelas <strong>{deleteTarget?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)} disabled={isSubmitting}>Batal</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menghapus...</> : 'Ya, Hapus Kelas'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

Classroom.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dosen' },
        { title: 'Semua Kelas', href: '/dosen/kelas' },
    ],
};
