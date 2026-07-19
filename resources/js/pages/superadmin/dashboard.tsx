import { Link, Head } from '@inertiajs/react';
import {
    ChevronRight,
    ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import BaseLayout from '@/layouts/base-layout';


export default function SuperadminDashboard() {
    return (
        <>
            <Head title="Dashboard Superadmin">
                <meta
                    name="description"
                    content="Dashboard administrator tertinggi untuk mengelola admin kampus."
                />
            </Head>
            <div className="flex h-full min-h-screen flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col">
                    <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        Sistem Kontrol Tertinggi
                    </span>
                    <h1 className="text-2xl font-bold text-foreground">
                        Dashboard Super Admin
                    </h1>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Manajemen Admin Kampus
                            </CardTitle>
                            <CardDescription>
                                Kelola hak akses akun admin untuk masing-masing kampus.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex items-center justify-between rounded-lg border p-4 transition duration-200 hover:bg-accent/50">
                                <div>
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <ShieldAlert className="h-4 w-4 text-primary" />
                                        Kelola Akun Admin
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        Tambah, edit, atau hapus Admin Kampus
                                    </p>
                                </div>
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                >
                                    <Link href="/superadmin/admin">
                                        Kelola <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

SuperadminDashboard.layout = (page: React.ReactNode) => (
    <BaseLayout breadcrumbs={[{ title: 'Dashboard Superadmin', href: '/superadmin/dashboard' }]}>
        {page}
    </BaseLayout>
);
