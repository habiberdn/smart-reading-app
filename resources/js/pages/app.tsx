import { Head } from '@inertiajs/react';
import {
    Users,
    BookOpen,
    BarChart3,
    Plus,
    MoreHorizontal,
    ChevronRight,
    GraduationCap,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';

interface Props {
    name: string;
}

export default function Dashboard({ name }: Props) {
    return (
        <>
            <Head title="Dashboard - Smart Reading">
                <meta
                    name="description"
                    content="Ringkasan dashboard Smart Reading App: statistik siswa, tugas aktif, ruang kelas, dan progress pembelajaran."
                />
            </Head>
            <div className="flex h-full min-h-screen flex-1 flex-col gap-6 p-6">
                {/* Header Section */}
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

                {/* Overview Stats Cards */}
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

                {/* Your Classrooms Section */}
                <div className="flex flex-col gap-3">
                    <h2 className="text-md font-bold text-foreground">
                        Kelas mu
                    </h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <ClassroomCard className="English Literature 101" />
                        <ClassroomCard className="Advanced American Literature" />
                    </div>
                </div>

                {/* Recent Assignments Section */}
                <div className="flex flex-col gap-3">
                    <h2 className="text-md font-bold text-foreground">
                        Tugas Terbaru
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

function StatCard({
    title,
    value,
    icon,
    trend = false,
    accent = 'primary',
}: {
    title: string;
    value: string;
    icon: ReactNode;
    trend?: boolean;
    accent?: string;
}) {
    const iconBgMap: Record<string, string> = {
        primary: 'bg-primary/10',
        emerald: 'bg-emerald-50',
        cyan: 'bg-cyan-50',
        amber: 'bg-amber-50',
    };

    return (
        <div className="relative flex items-center justify-between overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                    {title}
                </span>
                <span className="text-2xl font-bold text-foreground">
                    {value}
                </span>
            </div>
            <div
                className={`rounded-lg p-2.5 ${iconBgMap[accent] || 'bg-muted'}`}
            >
                {icon}
            </div>
            {trend && (
                <div className="absolute right-12 bottom-4 opacity-10">
                    <BarChart3 className="h-12 w-12 text-cyan-500" />
                </div>
            )}
        </div>
    );
}

function ClassroomCard({ className }: { className: string }) {
    return (
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <h3 className="text-sm font-bold text-foreground">
                    {className}
                </h3>
                <button className="text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                </button>
            </div>

            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <div className="flex justify-between border-b py-1">
                    <span>Siswa</span>
                </div>
                <div className="flex justify-between border-b py-1">
                    <span>Tugas</span>
                </div>
                <div className="flex items-center justify-between py-1 pt-2">
                    <span className="font-medium text-primary">
                        Progress Kelas
                    </span>
                    <span className="font-bold text-primary">%</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[0%] bg-primary" />
                </div>
            </div>

            <div className="mt-2 flex flex-col gap-2">
                <Button variant="outline" className="h-8 w-full py-1.5 text-xs">
                    + Tugas Baru
                </Button>
                <Button
                    variant="outline"
                    className="h-8 w-full gap-1 py-1.5 text-xs"
                >
                    Lihat Kelas <ChevronRight className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
}

function AssignmentCard({
    title,
    dueDate,
}: {
    title: string;
    dueDate: string;
}) {
    return (
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">{title}</h3>
                <button className="rounded-md bg-primary/10 p-1 text-primary hover:bg-primary/20">
                    <MoreHorizontal className="h-4 w-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
                <div>
                    <div className="mb-1 flex justify-between text-muted-foreground">
                        <span>Tingkat Pengumpulan</span>
                        <span>NaN%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full w-[0%] bg-primary" />
                    </div>
                </div>
                <div>
                    <div className="mb-1 flex justify-between text-muted-foreground">
                        <span>Rata-rata Progress</span>
                        <span>%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full w-[0%] bg-primary" />
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between border-t pt-3 text-xs">
                <span className="font-medium text-muted-foreground">
                    Tenggat: {dueDate}
                </span>
                <button className="flex items-center gap-0.5 font-medium text-primary hover:text-primary/80">
                    Lihat Detail <ChevronRight className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
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
