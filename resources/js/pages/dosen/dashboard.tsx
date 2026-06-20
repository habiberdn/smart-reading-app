import { Link } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import { Users, BookOpen, BarChart3, Plus, GraduationCap } from 'lucide-react';
import AssignmentCard from '@/components/classroom/assignment-card';
import ClassroomCard from '@/components/classroom/classroom-card';
import StatCard from '@/components/classroom/stats-card';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';

interface Props {
    name: string;
}

export default function Dashboard({ name }: Props) {
    return (
        <>
            <Head title="Dashboard" />
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
                    <Button className="gap-2 font-medium shadow-sm">
                        <Plus className="h-4 w-4" /> Kelas Baru
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Siswa"
                        value="65"
                        icon={<Users className="h-5 w-5 text-primary" />}
                        accent="primary"
                    />
                    <StatCard
                        title="Tugas Aktif"
                        value="12"
                        icon={<BookOpen className="h-5 w-5 text-emerald-500" />}
                        accent="emerald"
                    />
                    <StatCard
                        title="Rata-rata Penyelesaian"
                        value="74%"
                        icon={<BarChart3 className="h-5 w-5 text-cyan-500" />}
                        accent="cyan"
                        trend
                    />
                    <StatCard
                        title="Ruang Kelas"
                        value="2"
                        icon={
                            <GraduationCap className="h-4 w-4 text-amber-500" />
                        }
                        accent="amber"
                    />
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex justify-between">
                        <h2 className="text-md font-bold text-foreground">
                            Kelas mu
                        </h2>
                        <Link
                            href="/dosen/kelas"
                            prefetch
                            className="text-sm text-muted-foreground hover:text-black"
                        >
                            Semua Kelas
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <ClassroomCard className="English Literature 101" />
                        <ClassroomCard className="Advanced American Literature" />
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <h2 className="text-md font-bold text-foreground">
                        Tugas yang diberikan
                    </h2>
                    <div className="flex flex-col gap-4">
                        <AssignmentCard
                            title="Pride and Prejudice - Full Novel"
                            dueDate="6/30/2026"
                        />
                        <AssignmentCard
                            title="To Kill a Mockingbird"
                            dueDate="7/15/2026"
                        />
                    </div>
                </div>
            </div>
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
