import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    BookMarked,
    BookOpen,
    CalendarDays,
    Flag,
    GraduationCap,
    LayoutGrid,
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
import { index as adminPartiesIndex } from '@/routes/admin/parties';
import { index as adminCoursesIndex } from '@/routes/admin/courses';
import { index as adminElectionsIndex } from '@/routes/admin/elections';
import { index as adminRosterIndex } from '@/routes/admin/roster';
import { index as adminStudentsIndex } from '@/routes/admin/students';
import { index as adminVotingIndex } from '@/routes/admin/voting';
import { dashboard } from '@/routes';
import { dashboard as studentDashboard } from '@/routes/student';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { auth, pendingStudentRegistrationCount } = usePage().props;

    const adminCoreNavItems = useMemo((): NavItem[] => {
        const pendingRegistrationDot =
            typeof pendingStudentRegistrationCount === 'number' &&
            pendingStudentRegistrationCount > 0;

        return [
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
                title: 'Students',
                href: adminStudentsIndex(),
                icon: Users,
            },
            {
                title: 'Pending student registrations',
                href: adminRosterIndex().url,
                icon: BookMarked,
                notificationDot: pendingRegistrationDot,
            },
            {
                title: 'Result',
                href: adminVotingIndex(),
                icon: BarChart3,
            },
        ];
    }, [pendingStudentRegistrationCount]);

    const adminElectionNavItems = useMemo((): NavItem[] => {
        return [
            {
                title: 'Election schedule',
                href: adminElectionsIndex(),
                icon: CalendarDays,
            },
            {
                title: 'Parties',
                href: adminPartiesIndex().url,
                icon: Flag,
            },
        ];
    }, []);

    const studentNavItems = useMemo(
        (): NavItem[] => [
            {
                title: 'Student',
                href: studentDashboard(),
                icon: GraduationCap,
            },
        ],
        [],
    );

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
                {auth.user?.role === 'admin' ? (
                    <>
                        <NavMain
                            items={adminCoreNavItems}
                            groupLabel="Administration"
                        />
                        <NavMain
                            items={adminElectionNavItems}
                            groupLabel="Elections"
                        />
                    </>
                ) : (
                    <NavMain
                        items={studentNavItems}
                        groupLabel="Platform"
                    />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
