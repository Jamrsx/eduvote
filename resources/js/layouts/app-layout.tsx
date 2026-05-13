import { usePage } from '@inertiajs/react';
import {  useEffect } from 'react';
import type {ReactNode} from 'react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { setStudentDarkThemeLock } from '@/hooks/use-appearance';
import type { BreadcrumbItem } from '@/types';

type Props = {
    children: ReactNode;
};

export default function AppLayout({ children }: Props) {
    const { breadcrumbs = [], auth } = usePage<{
        breadcrumbs?: BreadcrumbItem[];
        auth?: { user?: { role?: string } | null };
    }>().props;

    useEffect(() => {
        const isStudent = auth?.user?.role === 'student';
        setStudentDarkThemeLock(isStudent);

        return () => {
            setStudentDarkThemeLock(false);
        };
    }, [auth?.user?.role]);

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
