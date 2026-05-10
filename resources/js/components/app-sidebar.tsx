import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    BookOpen,
    CalendarDays,
    GraduationCap,
    LayoutGrid,
    Upload,
    Users,
} from 'lucide-react';
import { useMemo } from 'react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard as adminDashboard } from '@/routes/admin';
import { index as adminCoursesIndex } from '@/routes/admin/courses';
import { index as adminElectionsIndex } from '@/routes/admin/elections';
import { index as adminImportsIndex } from '@/routes/admin/imports';
import { index as adminStudentsIndex } from '@/routes/admin/students';
import { index as adminVotingIndex } from '@/routes/admin/voting';
import { dashboard } from '@/routes';
import { dashboard as studentDashboard } from '@/routes/student';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { auth } = usePage().props;

    const mainNavItems = useMemo((): NavItem[] => {
        const items: NavItem[] = [];

        if (auth.user?.role === 'admin') {
            items.push(
                {
                    title: 'Dashboard',
                    href: adminDashboard(),
                    icon: LayoutGrid,
                },
                {
                    title: 'Programs',
                    href: adminCoursesIndex(),
                    icon: BookOpen,
                },
                {
                    title: 'Elections',
                    href: adminElectionsIndex(),
                    icon: CalendarDays,
                },
                {
                    title: 'Students',
                    href: adminStudentsIndex(),
                    icon: Users,
                },
                {
                    title: 'Imports',
                    href: adminImportsIndex(),
                    icon: Upload,
                },
                {
                    title: 'Ballots',
                    href: adminVotingIndex(),
                    icon: BarChart3,
                },
            );
        }

        if (auth.user?.role === 'student') {
            items.push({
                title: 'Student',
                href: studentDashboard(),
                icon: GraduationCap,
            });
        }

        return items;
    }, [auth.user?.role]);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            tooltip={{ children: 'EduVote' }}
                        >
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain
                    items={mainNavItems}
                    groupLabel={
                        auth.user?.role === 'admin'
                            ? 'Administration'
                            : 'Platform'
                    }
                />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
