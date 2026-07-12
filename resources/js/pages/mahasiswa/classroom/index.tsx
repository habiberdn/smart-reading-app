import { Head, Link, useForm } from '@inertiajs/react';
import {
    GraduationCap,
    Users,
    BookOpen,
    Plus,
    ChevronRight,
    Search,
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ClassroomType {
    id: number;
    name: string;
    semester: string | number;
    deskripsi: string | null;
    kode_kelas: string;
    mahasiswa_count?: number;
    reading_assignments_count?: number;
    dosen?: {
        name: string;
    };
}

interface Props {
    classrooms: ClassroomType[];
}

export default function MyClassrooms({ classrooms = [] }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isJoinOpen, setJoinOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        kode_kelas: '',
    });

    const handleJoinClass = (e: React.FormEvent) => {
        e.preventDefault();
        post('/mahasiswa/classrooms/join', {
            onSuccess: () => {
                reset();
                setJoinOpen(false);
            },
        });
    };

    const filtered = classrooms.filter(
        (c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.kode_kelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.dosen?.name || '')
                .toLowerCase()
                .includes(searchQuery.toLowerCase()),
    );

    return (
        <>
            <Head title="Kelas Saya - Mahasiswa">
                <meta
                    name="description"
                    content="Daftar kelas yang Anda ikuti sebagai mahasiswa di Smart Reading App."
                />
            </Head>
            {/* Menggunakan w-full agar mengisi seluruh ruang container utama layout app */}
            <div className="mx-auto flex h-full min-h-screen w-full flex-1 flex-col gap-6 p-6">
                {/* Header Section */}
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex flex-col">
                        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                            MANAJEMEN AKADEMIK
                        </span>
                        <h1 className="text-2xl font-bold text-foreground">
                            Kelas Saya
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {classrooms.length} kelas terdaftar
                        </p>
                    </div>

                    <Dialog open={isJoinOpen} onOpenChange={setJoinOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full gap-2 sm:w-auto">
                                <Plus className="h-4 w-4" /> Gabung Kelas Baru
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-106.25">
                            <form onSubmit={handleJoinClass}>
                                <DialogHeader>
                                    <DialogTitle>Gabung Kelas Baru</DialogTitle>
                                    <DialogDescription>
                                        Masukkan kode kelas dari dosen Anda
                                        untuk bergabung ke kelas baru.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-3 py-4">
                                    <Label htmlFor="join_kode">
                                        Kode Kelas
                                    </Label>
                                    <Input
                                        id="join_kode"
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
                                        className="text-center font-mono text-lg tracking-widest uppercase"
                                    />
                                    {errors.kode_kelas && (
                                        <p className="text-xs text-destructive">
                                            {errors.kode_kelas}
                                        </p>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="submit"
                                        className="w-full gap-2"
                                        disabled={processing}
                                    >
                                        <Plus className="h-4 w-4" /> Gabung
                                        Kelas
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Search Bar - Melebar sesuai layout dasar */}
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari nama kelas, kode, atau dosen..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Classroom Layout Content */}
                {filtered.length === 0 ? (
                    <div className="rounded-lg border border-dashed bg-background p-12 text-center text-sm text-muted-foreground">
                        <GraduationCap className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
                        <h3 className="mb-1 text-base font-semibold text-foreground">
                            {classrooms.length === 0
                                ? 'Belum Ada Kelas'
                                : 'Tidak Ditemukan'}
                        </h3>
                        <p className="mx-auto max-w-md">
                            {classrooms.length === 0
                                ? 'Anda belum bergabung ke kelas mana pun. Klik tombol "Gabung Kelas Baru" untuk memasukkan kode kelas dari dosen.'
                                : `Tidak ada kelas yang cocok dengan pencarian "${searchQuery}".`}
                        </p>
                    </div>
                ) : (
                    /* Diubah menjadi grid-cols-1 md:grid-cols-2 lg:grid-cols-3 agar membagi 3 kolom pas lebar penuh di monitor desktop */
                    <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((c) => (
                            <Link
                                key={c.id}
                                href={`/mahasiswa/classrooms/${c.kode_kelas}`}
                                className="group block"
                            >
                                <Card className="flex h-full flex-col justify-between border bg-card shadow-sm transition-all group-hover:border-primary hover:shadow-md">
                                    <CardHeader className="pb-2">
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-bold text-muted-foreground">
                                                {c.kode_kelas}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                Semester {c.semester}
                                            </span>
                                        </div>
                                        <CardTitle className="line-clamp-1 text-base font-bold transition-colors group-hover:text-primary">
                                            {c.name}
                                        </CardTitle>
                                        <CardDescription className="mt-0.5 line-clamp-1 text-xs">
                                            Dosen:{' '}
                                            {c.dosen?.name || 'Tidak diketahui'}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="pt-0 pb-4">
                                        <p className="mb-4 line-clamp-2 text-xs text-muted-foreground">
                                            {c.deskripsi ||
                                                'Tidak ada deskripsi.'}
                                        </p>

                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Users className="h-3.5 w-3.5 text-primary" />
                                                {c.mahasiswa_count ?? 0}{' '}
                                                Mahasiswa
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                                                {c.reading_assignments_count ??
                                                    0}{' '}
                                                Tugas
                                            </span>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="border-t bg-muted/20 pt-3">
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-primary">
                                            Lihat Detail Kelas{' '}
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </span>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
