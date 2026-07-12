import { Link, Head } from '@inertiajs/react';
import { BookOpen, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

interface ClassroomType {
    id: number;
    name: string;
    semester: string | number;
    deskripsi: string | null;
    kode_kelas: string;
    mahasiswa_count?: number;
    reading_assignments_count?: number;
}

export default function Classroom({
    classrooms = [],
}: {
    classrooms: ClassroomType[];
}) {
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
                                        <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-bold text-muted-foreground">
                                            Code: {item.kode_kelas}
                                        </span>
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
        </>
    );
}

Classroom.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dosen' },
        { title: 'Semua Kelas', href: '/dosen/kelas' },
    ],
};
