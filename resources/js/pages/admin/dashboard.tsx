import { Link, Head } from '@inertiajs/react';
import {
    Users,
    GraduationCap,
    School,
    BookOpen,
    ChevronRight,
} from 'lucide-react';
import StatCard from '@/components/classroom/stats-card';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

interface Props {
    totalDosen: number;
    totalMahasiswa: number;
    totalClassrooms: number;
    totalAssignments: number;
}

export default function AdminDashboard({
    totalDosen = 0,
    totalMahasiswa = 0,
    totalClassrooms = 0,
    totalAssignments = 0,
}: Props) {
    return (
        <>
            <Head title="Dashboard Admin">
                <meta
                    name="description"
                    content="Dashboard administrator Smart Reading App untuk pemantauan sistem dan manajemen pengguna."
                />
            </Head>
            <div className="flex h-full min-h-screen flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col">
                    <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        Sistem Kontrol
                    </span>
                    <h1 className="text-2xl font-bold text-foreground">
                        Rangkuman Dashboard Admin
                    </h1>
                </div>

                {/* Ringkasan Statistik */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Dosen"
                        value={totalDosen.toString()}
                        icon={
                            <GraduationCap className="h-5 w-5 text-primary" />
                        }
                        accent="primary"
                    />
                    <StatCard
                        title="Total Mahasiswa"
                        value={totalMahasiswa.toString()}
                        icon={<Users className="h-5 w-5 text-emerald-500" />}
                        accent="emerald"
                    />
                    <StatCard
                        title="Total Ruang Kelas"
                        value={totalClassrooms.toString()}
                        icon={<School className="h-5 w-5 text-cyan-500" />}
                        accent="cyan"
                    />
                    <StatCard
                        title="Total Tugas Bacaan"
                        value={totalAssignments.toString()}
                        icon={<BookOpen className="h-5 w-5 text-amber-500" />}
                        accent="amber"
                    />
                </div>

                {/* Quick Actions / System Status */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Kontrol Manajemen Pengguna
                            </CardTitle>
                            <CardDescription>
                                Kelola hak akses akun, tambah dosen baru, edit
                                data profil dosen, atau nonaktifkan akun dosen.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex items-center justify-between rounded-lg border p-4 transition duration-200 hover:bg-accent/50">
                                <div>
                                    <h4 className="text-sm font-semibold">
                                        Kelola Data Dosen
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        Tambah, ubah data NIDN/Program Studi,
                                        atau hapus dosen
                                    </p>
                                </div>
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                >
                                    <Link href="/admin/dosen">
                                        Kelola{' '}
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Informasi Sistem
                            </CardTitle>
                            <CardDescription>
                                Ringkasan arsitektur sistem Smart Reading App.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-2 border-b pb-3">
                                <span className="font-medium text-muted-foreground">
                                    Role Pengguna
                                </span>
                                <span className="text-right font-semibold text-foreground">
                                    Admin, Dosen, Mahasiswa
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 border-b pb-3">
                                <span className="font-medium text-muted-foreground">
                                    Fungsi Utama Admin
                                </span>
                                <span className="text-right text-foreground">
                                    Kelola User Dosen, Suspend Akun, Monitoring
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <span className="font-medium text-muted-foreground">
                                    Status Aplikasi
                                </span>
                                <span className="flex items-center justify-end gap-1.5 text-right font-medium text-emerald-600">
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                                    Aktif & Normal
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/admin/dashboard',
        },
    ],
};
