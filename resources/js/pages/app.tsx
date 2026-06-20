import { Head } from '@inertiajs/react';
import { Users, BookOpen, BarChart3, Plus, MoreHorizontal, ChevronRight, GraduationCap } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';

interface Props {
    name: string;
}

export default function Dashboard({ name }: Props) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6 min-h-screen">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Selamat Datang, {name}</span>
                        <h1 className="text-2xl font-bold text-foreground">Rangkuman Dashboard</h1>
                    </div>
                    <Button className="gap-2 font-medium shadow-sm">
                        <Plus className="h-4 w-4" /> Kelas Baru
                    </Button>
                </div>

                {/* Overview Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Siswa" value="65" icon={<Users className="h-5 w-5 text-primary" />} accent="primary" />
                    <StatCard title="Tugas Aktif" value="12" icon={<BookOpen className="h-5 w-5 text-emerald-500" />} accent="emerald" />
                    <StatCard title="Rata-rata Penyelesaian" value="74%" icon={<BarChart3 className="h-5 w-5 text-cyan-500" />} accent="cyan" trend />
                    <StatCard title="Ruang Kelas" value="2" icon={<GraduationCap className="h-4 w-4 text-amber-500" />} accent="amber" />
                </div>

                {/* Your Classrooms Section */}
                <div className="flex flex-col gap-3">
                    <h2 className="text-md font-bold text-foreground">Kelas mu</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ClassroomCard className="English Literature 101" />
                        <ClassroomCard className="Advanced American Literature" />
                    </div>
                </div>

                {/* Recent Assignments Section */}
                <div className="flex flex-col gap-3">
                    <h2 className="text-md font-bold text-foreground">Tugas Terbaru</h2>
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

function StatCard({ title, value, icon, trend = false, accent = 'primary' }: { title: string; value: string; icon: ReactNode; trend?: boolean; accent?: string }) {
    const iconBgMap: Record<string, string> = {
        primary: 'bg-primary/10',
        emerald: 'bg-emerald-50',
        cyan: 'bg-cyan-50',
        amber: 'bg-amber-50',
    };

    return (
        <div className="bg-card p-5 rounded-xl border shadow-sm flex justify-between items-center relative overflow-hidden">
            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">{title}</span>
                <span className="text-2xl font-bold text-foreground">{value}</span>
            </div>
            <div className={`p-2.5 rounded-lg ${iconBgMap[accent] || 'bg-muted'}`}>
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
        <div className="bg-card rounded-xl border shadow-sm p-5 flex flex-col gap-4">
            <div className="flex justify-between items-start">
                <h3 className="font-bold text-foreground text-sm">{className}</h3>
                <button className="text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                </button>
            </div>
            
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <div className="flex justify-between py-1 border-b">
                    <span>Siswa</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                    <span>Tugas</span>
                </div>
                <div className="flex justify-between items-center py-1 pt-2">
                    <span className="text-primary font-medium">Progress Kelas</span>
                    <span className="text-primary font-bold">%</span>
                </div>
                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-primary h-full w-[0%]" />
                </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
                <Button variant="outline" className="w-full text-xs py-1.5 h-8">
                    + Tugas Baru
                </Button>
                <Button variant="outline" className="w-full text-xs py-1.5 h-8 gap-1">
                    Lihat Kelas <ChevronRight className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
}

function AssignmentCard({ title, dueDate }: { title: string, dueDate: string }) {
    return (
        <div className="bg-card rounded-xl border shadow-sm p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-foreground text-sm">{title}</h3>
                <button className="p-1 text-primary bg-primary/10 hover:bg-primary/20 rounded-md">
                    <MoreHorizontal className="h-4 w-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                    <div className="flex justify-between text-muted-foreground mb-1">
                        <span>Tingkat Pengumpulan</span>
                        <span>NaN%</span>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full w-[0%]" />
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-muted-foreground mb-1">
                        <span>Rata-rata Progress</span>
                        <span>%</span>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full w-[0%]" />
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center border-t pt-3 text-xs">
                <span className="text-muted-foreground font-medium">Tenggat: {dueDate}</span>
                <button className="text-primary hover:text-primary/80 font-medium flex items-center gap-0.5">
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
