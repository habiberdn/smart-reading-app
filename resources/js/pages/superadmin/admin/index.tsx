import { Head, useForm } from '@inertiajs/react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    ShieldAlert,
    Loader2,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import BaseLayout from '@/layouts/base-layout';
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

interface AdminKampus {
    id: number;
    name: string;
    username: string;
    kampus: string;
    avatar?: string | null;
}

interface Props {
    adminList: AdminKampus[];
}

export default function KelolaAdmin({ adminList = [] }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeDialog, setActiveDialog] = useState<'create' | 'edit' | 'delete' | null>(null);
    const [selectedAdmin, setSelectedAdmin] = useState<AdminKampus | null>(null);

    const createForm = useForm({
        name: '',
        username: '',
        password: '',
        kampus: '',
    });

    const editForm = useForm({
        name: '',
        username: '',
        password: '',
        kampus: '',
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/superadmin/admin', {
            onSuccess: () => {
                setActiveDialog(null);
                createForm.reset();
                toast.success('Admin Kampus berhasil ditambahkan!');
            },
            onError: () => {
                toast.error('Gagal menambahkan admin kampus. Cek kembali form Anda.');
            },
        });
    };

    const openEditDialog = (admin: AdminKampus) => {
        setSelectedAdmin(admin);
        editForm.setData({
            name: admin.name,
            username: admin.username,
            password: '',
            kampus: admin.kampus ?? '',
        });
        editForm.clearErrors();
        setActiveDialog('edit');
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedAdmin) return;

        editForm.put(`/superadmin/admin/${selectedAdmin.id}`, {
            onSuccess: () => {
                setActiveDialog(null);
                editForm.reset();
                toast.success('Data Admin Kampus berhasil diperbarui!');
            },
            onError: () => {
                toast.error('Gagal memperbarui data admin kampus. Cek kembali form Anda.');
            },
        });
    };

    const openDeleteDialog = (admin: AdminKampus) => {
        setSelectedAdmin(admin);
        setActiveDialog('delete');
    };

    const handleDeleteSubmit = () => {
        if (!selectedAdmin) return;

        createForm.delete(`/superadmin/admin/${selectedAdmin.id}`, {
            onSuccess: () => {
                setActiveDialog(null);
                toast.success('Admin Kampus berhasil dihapus!');
            },
            onError: () => {
                toast.error('Gagal menghapus admin kampus.');
            },
        });
    };

    const filteredAdmins = useMemo(() => {
        if (!searchQuery.trim()) return adminList;
        const query = searchQuery.toLowerCase();
        return adminList.filter(
            (admin) =>
                admin.name.toLowerCase().includes(query) ||
                admin.username.toLowerCase().includes(query) ||
                (admin.kampus && admin.kampus.toLowerCase().includes(query))
        );
    }, [adminList, searchQuery]);

    return (
        <>
            <Head title="Kelola Admin Kampus">
                <meta name="description" content="Halaman pengelolaan Admin Kampus oleh Superadmin." />
            </Head>
            <div className="flex h-full min-h-screen flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex flex-col">
                        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                            Superadmin Control
                        </span>
                        <h1 className="text-2xl font-bold text-foreground">
                            Kelola Admin Kampus
                        </h1>
                    </div>
                    <Button
                        className="gap-2 font-medium shadow-sm"
                        onClick={() => {
                            createForm.reset();
                            createForm.clearErrors();
                            setActiveDialog('create');
                        }}
                    >
                        <Plus className="h-4 w-4" /> Admin Baru
                    </Button>
                </div>

                <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari nama, username, kampus..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Menampilkan{' '}
                        <span className="font-semibold text-foreground">
                            {filteredAdmins.length}
                        </span>{' '}
                        dari{' '}
                        <span className="font-semibold text-foreground">
                            {adminList.length}
                        </span>{' '}
                        Admin Kampus
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead>Kampus</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAdmins.length > 0 ? (
                                filteredAdmins.map((admin) => (
                                    <TableRow key={admin.id} className="hover:bg-muted/30">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                    <ShieldAlert className="h-4 w-4" />
                                                </div>
                                                <span>{admin.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {admin.username}
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-600/10 ring-inset">
                                                {admin.kampus || '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                    onClick={() => openEditDialog(admin)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                    onClick={() => openDeleteDialog(admin)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        Tidak ada data admin kampus ditemukan.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={activeDialog === 'create'} onOpenChange={(isOpen) => setActiveDialog(isOpen ? 'create' : null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleCreateSubmit}>
                        <DialogHeader>
                            <DialogTitle>Tambah Admin Kampus Baru</DialogTitle>
                            <DialogDescription>
                                Isi data profil admin kampus baru di bawah ini.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="create-name">Nama Lengkap</Label>
                                <Input
                                    id="create-name"
                                    placeholder="Contoh: Budi Santoso"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    required
                                />
                                {createForm.errors.name && (
                                    <span className="text-xs text-destructive">{createForm.errors.name}</span>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="create-username">Username</Label>
                                <Input
                                    id="create-username"
                                    placeholder="Contoh: admin_budi"
                                    value={createForm.data.username}
                                    onChange={(e) => createForm.setData('username', e.target.value)}
                                    required
                                />
                                {createForm.errors.username && (
                                    <span className="text-xs text-destructive">{createForm.errors.username}</span>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="create-password">Password</Label>
                                <Input
                                    id="create-password"
                                    type="password"
                                    placeholder="Minimal 8 karakter"
                                    value={createForm.data.password}
                                    onChange={(e) => createForm.setData('password', e.target.value)}
                                    required
                                />
                                {createForm.errors.password && (
                                    <span className="text-xs text-destructive">{createForm.errors.password}</span>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="create-kampus">Kampus (Institusi)</Label>
                                <Input
                                    id="create-kampus"
                                    placeholder="Contoh: Universitas A"
                                    value={createForm.data.kampus}
                                    onChange={(e) => createForm.setData('kampus', e.target.value)}
                                    required
                                />
                                {createForm.errors.kampus && (
                                    <span className="text-xs text-destructive">{createForm.errors.kampus}</span>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setActiveDialog(null)} disabled={createForm.processing}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={createForm.processing}>
                                {createForm.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={activeDialog === 'edit'} onOpenChange={(isOpen) => setActiveDialog(isOpen ? 'edit' : null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleEditSubmit}>
                        <DialogHeader>
                            <DialogTitle>Edit Data Admin Kampus</DialogTitle>
                            <DialogDescription>
                                Perbarui data profil admin kampus. Kosongkan field password jika tidak ingin mengubahnya.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Nama Lengkap</Label>
                                <Input
                                    id="edit-name"
                                    placeholder="Nama lengkap admin"
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    required
                                />
                                {editForm.errors.name && (
                                    <span className="text-xs text-destructive">{editForm.errors.name}</span>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-username">Username</Label>
                                <Input
                                    id="edit-username"
                                    placeholder="Username admin"
                                    value={editForm.data.username}
                                    onChange={(e) => editForm.setData('username', e.target.value)}
                                    required
                                />
                                {editForm.errors.username && (
                                    <span className="text-xs text-destructive">{editForm.errors.username}</span>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-password">Password Baru (Opsional)</Label>
                                <Input
                                    id="edit-password"
                                    type="password"
                                    placeholder="Kosongkan jika tidak ingin diubah"
                                    value={editForm.data.password}
                                    onChange={(e) => editForm.setData('password', e.target.value)}
                                />
                                {editForm.errors.password && (
                                    <span className="text-xs text-destructive">{editForm.errors.password}</span>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-kampus">Kampus (Institusi)</Label>
                                <Input
                                    id="edit-kampus"
                                    placeholder="Contoh: Universitas A"
                                    value={editForm.data.kampus}
                                    onChange={(e) => editForm.setData('kampus', e.target.value)}
                                    required
                                />
                                {editForm.errors.kampus && (
                                    <span className="text-xs text-destructive">{editForm.errors.kampus}</span>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setActiveDialog(null)} disabled={editForm.processing}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan Perubahan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={activeDialog === 'delete'} onOpenChange={(isOpen) => setActiveDialog(isOpen ? 'delete' : null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus data admin{' '}
                            <span className="font-semibold text-foreground">
                                {selectedAdmin?.name}
                            </span>
                            ?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setActiveDialog(null)}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteSubmit}>
                            Hapus Admin
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

KelolaAdmin.layout = (page: React.ReactNode) => (
    <BaseLayout breadcrumbs={[
        {
            title: 'Kelola Admin Kampus',
            href: '/superadmin/admin',
        },
    ]}>
        {page}
    </BaseLayout>
);

