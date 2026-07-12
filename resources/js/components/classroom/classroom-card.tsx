import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClassroomType {
    id: number;
    name: string;
    semester: string | number;
    deskripsi: string | null;
    kode_kelas: string;
    mahasiswa_count?: number;
    reading_assignments_count?: number;
}

export default function ClassroomCard({
    classroom,
}: {
    classroom: ClassroomType;
}) {
    return (
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
                <h3 className="line-clamp-1 text-sm font-bold text-foreground">
                    {classroom.name}
                </h3>
                <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-bold text-muted-foreground">
                    Code: {classroom.kode_kelas}
                </span>
            </div>

            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <div className="flex justify-between border-b py-1">
                    <span>Siswa</span>
                    <span className="font-semibold text-foreground">
                        {classroom.mahasiswa_count ?? 0} Mahasiswa
                    </span>
                </div>
                <div className="flex justify-between border-b py-1">
                    <span>Tugas Bacaan</span>
                    <span className="font-semibold text-foreground">
                        {classroom.reading_assignments_count ?? 0} Tugas
                    </span>
                </div>
                <div className="flex items-center justify-between py-1 pt-1.5">
                    <span className="font-medium text-foreground">
                        Semester
                    </span>
                    <span className="font-bold text-primary">
                        {classroom.semester}
                    </span>
                </div>
            </div>

            <div className="mt-2 flex flex-col gap-2">
                <Button
                    asChild
                    variant="outline"
                    className="h-8 w-full gap-1 py-1.5 text-xs"
                >
                    <Link href={`/dosen/classrooms/${classroom.kode_kelas}`}>
                        Lihat Detail Kelas <ChevronRight className="h-3 w-3" />
                    </Link>
                </Button>
            </div>
        </div>
    );
}
