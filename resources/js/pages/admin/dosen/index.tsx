import { Head, useForm } from '@inertiajs/react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    GraduationCap,
    Loader2,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
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

interface Lecturer {
    id: number;
    name: string;
    username: string;
    nidn: string | null;
    program_studi: string | null;
    classrooms_as_dosen_count?: number;
    avatar?: string | null;
}

interface Props {
    dosenList: Lecturer[];
}

export default function KelolaDosen({ dosenList = [] }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedLecturer, setSelectedLecturer] = useState<Lecturer | null>(
        null,
    );

    // Form for Creating Lecturer
    const createForm = useForm({
        name: '',
        username: '',
        password: '',
        nidn: '',
        program_studi: '',
    });

    // Form for Editing Lecturer
    const editForm = useForm({
        name: '',
        username: '',
        password: '',
        nidn: '',
        program_studi: '',
    });

    // Handle Create Submit
    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/admin/dosen', {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
                toast.success('Dosen berhasil ditambahkan!');
            },
            onError: () => {
                toast.error('Gagal menambahkan dosen. Cek kembali form Anda.');
            },
        });
    };

    // Open Edit Dialog
    const openEditDialog = (lecturer: Lecturer) => {
        setSelectedLecturer(lecturer);
        editForm.setData({
            name: lecturer.name,
            username: lecturer.username,
            password: '', // Keep empty by default
            nidn: lecturer.nidn ?? '',
            program_studi: lecturer.program_studi ?? '',
        });
        editForm.clearErrors();
        setIsEditOpen(true);
    };

    // Handle Edit Submit
    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedLecturer) {
            return;
        }

        editForm.put(`/admin/dosen/${selectedLecturer.id}`, {
            onSuccess: () => {
                setIsEditOpen(false);
                editForm.reset();
                toast.success('Data dosen berhasil diperbarui!');
            },
            onError: () => {
                toast.error(
                    'Gagal memperbarui data dosen. Cek kembali form Anda.',
                );
            },
        });
    };

    // Open Delete Dialog
    const openDeleteDialog = (lecturer: Lecturer) => {
        setSelectedLecturer(lecturer);
        setIsDeleteOpen(true);
    };

    // Handle Delete Submit
    const handleDeleteSubmit = () => {
        if (!selectedLecturer) {
            return;
        }

        createForm.delete(`/admin/dosen/${selectedLecturer.id}`, {
            onSuccess: () => {
                setIsDeleteOpen(false);
                toast.success('Dosen berhasil dihapus!');
            },
            onError: () => {
                toast.error('Gagal menghapus dosen.');
            },
        });
    };

    // Filtered Lecturers
    const filteredLecturers = useMemo(() => {
        if (!searchQuery.trim()) {
            return dosenList;
        }

        const query = searchQuery.toLowerCase();

        return dosenList.filter(
            (lecturer) =>
                lecturer.name.toLowerCase().includes(query) ||
                (lecturer.nidn &&
                    lecturer.nidn.toLowerCase().includes(query)) ||
                lecturer.username.toLowerCase().includes(query) ||
                (lecturer.program_studi &&
                    lecturer.program_studi.toLowerCase().includes(query)),
        );
    }, [dosenList, searchQuery]);

    return (
        <>
            <Head title="Kelola Dosen">
                <meta
                    name="description"
                    content="Halaman pengelolaan dosen oleh administrator."
                />
            </Head>
            <div className="flex h-full min-h-screen flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex flex-col">
                        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                            Manajemen Pengguna
                        </span>
                        <h1 className="text-2xl font-bold text-foreground">
                            Kelola Data Dosen
                        </h1>
                    </div>
                    <Button
                        className="gap-2 font-medium shadow-sm"
                        onClick={() => {
                            createForm.reset();
                            createForm.clearErrors();
                            setIsCreateOpen(true);
                        }}
                    >
                        <Plus className="h-4 w-4" /> Dosen Baru
                    </Button>
                </div>

                {/* Search Bar & Stats */}
                <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari nama, username, NIDN..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Menampilkan{' '}
                        <span className="font-semibold text-foreground">
                            {filteredLecturers.length}
                        </span>{' '}
                        dari{' '}
                        <span className="font-semibold text-foreground">
                            {dosenList.length}
                        </span>{' '}
                        Dosen
                    </div>
                </div>

                {/* Table List */}
                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead>NIDN</TableHead>
                                <TableHead>Program Studi</TableHead>
                                <TableHead className="text-center">
                                    Jumlah Kelas
                                </TableHead>
                                <TableHead className="text-right">
                                    Aksi
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLecturers.length > 0 ? (
                                filteredLecturers.map((lecturer) => (
                                    <TableRow
                                        key={lecturer.id}
                                        className="hover:bg-muted/30"
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                    <GraduationCap className="h-4 w-4" />
                                                </div>
                                                <span>{lecturer.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {lecturer.username}
                                        </TableCell>
                                        <TableCell>
                                            {lecturer.nidn || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {lecturer.program_studi || '-'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center rounded-md bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-700 ring-1 ring-cyan-600/10 ring-inset">
                                                {lecturer.classrooms_as_dosen_count ??
                                                    0}{' '}
                                                Kelas
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                    onClick={() =>
                                                        openEditDialog(lecturer)
                                                    }
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                    onClick={() =>
                                                        openDeleteDialog(
                                                            lecturer,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        Tidak ada data dosen ditemukan.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Modal Create Dosen */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleCreateSubmit}>
                        <DialogHeader>
                            <DialogTitle>Tambah Dosen Baru</DialogTitle>
                            <DialogDescription>
                                Isi data profil dosen baru di bawah ini. Akun
                                akan langsung aktif setelah dibuat.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="create-name">
                                    Nama Lengkap
                                </Label>
                                <Input
                                    id="create-name"
                                    placeholder="Contoh: Dr. Jane Doe, M.T"
                                    value={createForm.data.name}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                {createForm.errors.name && (
                                    <span className="text-xs text-destructive">
                                        {createForm.errors.name}
                                    </span>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="create-username">
                                    Username
                                </Label>
                                <Input
                                    id="create-username"
                                    placeholder="Contoh: jane_doe"
                                    value={createForm.data.username}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'username',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                {createForm.errors.username && (
                                    <span className="text-xs text-destructive">
                                        {createForm.errors.username}
                                    </span>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="create-password">
                                    Password Awal
                                </Label>
                                <Input
                                    id="create-password"
                                    type="password"
                                    placeholder="Minimal 8 karakter"
                                    value={createForm.data.password}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'password',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                {createForm.errors.password && (
                                    <span className="text-xs text-destructive">
                                        {createForm.errors.password}
                                    </span>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="create-nidn">
                                    NIDN (Opsional)
                                </Label>
                                <Input
                                    id="create-nidn"
                                    placeholder="Contoh: 1029384756"
                                    value={createForm.data.nidn}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'nidn',
                                            e.target.value,
                                        )
                                    }
                                />
                                {createForm.errors.nidn && (
                                    <span className="text-xs text-destructive">
                                        {createForm.errors.nidn}
                                    </span>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="create-prodi">
                                    Program Studi (Opsional)
                                </Label>
                                <Input
                                    id="create-prodi"
                                    placeholder="Contoh: Teknik Informatika"
                                    value={createForm.data.program_studi}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'program_studi',
                                            e.target.value,
                                        )
                                    }
                                />
                                {createForm.errors.program_studi && (
                                    <span className="text-xs text-destructive">
                                        {createForm.errors.program_studi}
                                    </span>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateOpen(false)}
                                disabled={createForm.processing}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={createForm.processing}
                            >
                                {createForm.processing && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Edit Dosen */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleEditSubmit}>
                        <DialogHeader>
                            <DialogTitle>Edit Data Dosen</DialogTitle>
                            <DialogDescription>
                                Perbarui data profil dosen. Kosongkan field
                                password jika tidak ingin mengubahnya.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Nama Lengkap</Label>
                                <Input
                                    id="edit-name"
                                    placeholder="Nama lengkap dosen"
                                    value={editForm.data.name}
                                    onChange={(e) =>
                                        editForm.setData('name', e.target.value)
                                    }
                                    required
                                />
                                {editForm.errors.name && (
                                    <span className="text-xs text-destructive">
                                        {editForm.errors.name}
                                    </span>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-username">Username</Label>
                                <Input
                                    id="edit-username"
                                    placeholder="Username dosen"
                                    value={editForm.data.username}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'username',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                {editForm.errors.username && (
                                    <span className="text-xs text-destructive">
                                        {editForm.errors.username}
                                    </span>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-password">
                                    Password Baru (Opsional)
                                </Label>
                                <Input
                                    id="edit-password"
                                    type="password"
                                    placeholder="Kosongkan jika tidak ingin diubah"
                                    value={editForm.data.password}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'password',
                                            e.target.value,
                                        )
                                    }
                                />
                                {editForm.errors.password && (
                                    <span className="text-xs text-destructive">
                                        {editForm.errors.password}
                                    </span>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-nidn">
                                    NIDN (Opsional)
                                </Label>
                                <Input
                                    id="edit-nidn"
                                    placeholder="NIDN dosen"
                                    value={editForm.data.nidn}
                                    onChange={(e) =>
                                        editForm.setData('nidn', e.target.value)
                                    }
                                />
                                {editForm.errors.nidn && (
                                    <span className="text-xs text-destructive">
                                        {editForm.errors.nidn}
                                    </span>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-prodi">
                                    Program Studi (Opsional)
                                </Label>
                                <Input
                                    id="edit-prodi"
                                    placeholder="Program studi dosen"
                                    value={editForm.data.program_studi}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'program_studi',
                                            e.target.value,
                                        )
                                    }
                                />
                                {editForm.errors.program_studi && (
                                    <span className="text-xs text-destructive">
                                        {editForm.errors.program_studi}
                                    </span>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditOpen(false)}
                                disabled={editForm.processing}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={editForm.processing}
                            >
                                {editForm.processing && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Simpan Perubahan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Delete Confirmation */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus data dosen{' '}
                            <span className="font-semibold text-foreground">
                                {selectedLecturer?.name}
                            </span>
                            ? Tindakan ini dapat dibatalkan melalui pemulihan
                            database jika diperlukan karena sistem menggunakan
                            Soft Delete.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteSubmit}
                        >
                            Hapus Dosen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

KelolaDosen.layout = {
    breadcrumbs: [
        {
            title: 'Kelola Dosen',
            href: '/admin/dosen',
        },
    ],
};
