import { Link, router, usePage } from '@inertiajs/react';
import {
    GraduationCap,
    LayoutGrid,
    BookOpenCheck,
    BookOpen,
    ShieldAlert,
} from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard as mahasiswaDashboard } from '@/routes';
import { dashboard as dosenDashboard } from '@/routes/dosen';
import type { NavItem } from '@/types';
import type { Role } from '@/types/auth';

function useNavItems(role: Role | null | undefined): NavItem[] {
    if (role === 'superadmin') {
        return [
            {
                title: 'Dashboard',
                href: '/superadmin/dashboard',
                icon: LayoutGrid,
            },
            {
                title: 'Kelola Admin',
                href: '/superadmin/admin',
                icon: ShieldAlert,
            },
        ];
    }

    if (role === 'admin') {
        return [
            {
                title: 'Dashboard',
                href: '/admin/dashboard',
                icon: LayoutGrid,
            },
            {
                title: 'Kelola Dosen',
                href: '/admin/dosen',
                icon: GraduationCap,
            },
        ];
    }

    if (role === 'dosen') {
        return [
            {
                title: 'Dashboard',
                href: '/dosen/dashboard',
                icon: LayoutGrid,
            },
            {
                title: 'Classrooms',
                href: '/dosen/classrooms',
                icon: GraduationCap,
            },
        ];
    }

    if (role === 'mahasiswa') {
        return [
            {
                title: 'Dashboard',
                href: '/mahasiswa/dashboard',
                icon: LayoutGrid,
            },
            {
                title: 'Kelas Saya',
                href: '/mahasiswa/classrooms',
                icon: GraduationCap,
            },
            {
                title: 'Tugas Saya',
                href: '/assignments',
                icon: BookOpenCheck,
            },
            {
                title: 'Bacaan Mandiri',
                href: '/explore',
                icon: BookOpen,
            },
        ];
    }

    return [
        {
            title: 'Dashboard',
            href: mahasiswaDashboard(),
            icon: LayoutGrid,
        },
    ];
}

export function AppSidebar() {
    const { auth } = usePage().props;
    const role = auth.user?.role ?? null;
    const navItems = useNavItems(role);

    const dashboardHref =
        role === 'superadmin'
            ? '/superadmin/dashboard'
            : role === 'admin'
              ? '/admin/dashboard'
              : role === 'dosen'
                ? dosenDashboard()
                : mahasiswaDashboard();

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardHref} prefetch>
                                <span className="text-xl">Smart Reading</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <button
                    onClick={() =>
                        router.post('/logout', undefined, {
                            replace: true,
                        })
                    }
                    className="w-full rounded-md px-4 py-2 text-left text-sm text-destructive transition hover:bg-muted"
                >
                    Keluar
                </button>
            </SidebarFooter>
        </Sidebar>
    );
}
