import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';
import DosenLayout from './dosen-layout';
import MahasiswaLayout from './mahasiswa-layout';
type Props = {
    breadcrumbs?: BreadcrumbItem[];
    children: ReactNode;
};

export default function BaseLayout({ breadcrumbs = [], children }: Props) {
    const { auth } = usePage().props;

    if (auth.user?.role === 'dosen') {
        return <DosenLayout breadcrumbs={breadcrumbs}>{children}</DosenLayout>;
    } else if (auth.user?.role === 'mahasiswa') {
        return (
            <MahasiswaLayout breadcrumbs={breadcrumbs}>
                {children}
            </MahasiswaLayout>
        );
    }

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            {children}
        </AppSidebarLayout>
    );
}
