import { Link, router, usePage } from '@inertiajs/react';
import { GraduationCap, LayoutGrid, Users, BookOpenCheck } from 'lucide-react';
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
    if (role === 'dosen') {
        return [
            {
                title: 'Dashboard',
                href: dosenDashboard(),
                icon: LayoutGrid,
            },
            {
                title: 'Classrooms',
                href: '/dosen/classrooms',
                icon: GraduationCap,
            },
            {
                title: 'Students',
                href: '/dosen/students',
                icon: Users,
            },
        ];
    }

    if (role === 'mahasiswa') {
        return [
            {
                title: 'Dashboard',
                href: mahasiswaDashboard(),
                icon: LayoutGrid,
            },
            {
                title: 'My Class',
                href: '/classrooms',
                icon: GraduationCap,
            },
            {
                title: 'Assignments',
                href: '/assignments',
                icon: BookOpenCheck,
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
        role === 'dosen' ? dosenDashboard() : mahasiswaDashboard();

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
                    onClick={() => router.post('/dosen/logout', undefined, { replace: true })}
                    className="w-full rounded-md px-4 py-2 text-left text-sm text-destructive transition hover:bg-muted"
                >
                    Keluar
                </button>
            </SidebarFooter>
        </Sidebar>
    );
}
