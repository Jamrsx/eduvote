import { usePage } from '@inertiajs/react';
import { type ReactNode } from 'react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { BreadcrumbItem } from '@/types';

type Props = {
    children: ReactNode;
};

export default function AppLayout({ children }: Props) {
    const { breadcrumbs = [] } = usePage<{
        breadcrumbs?: BreadcrumbItem[];
    }>().props;

    return (
        <AppShell>
            <AppSidebar />
            <AppContent variant="sidebar" className="flex flex-col overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
            </AppContent>
        </AppShell>
    );
}
