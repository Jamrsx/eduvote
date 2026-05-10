import { Link, usePage } from '@inertiajs/react';
import { GraduationCap, LayoutGrid, Shield } from 'lucide-react';
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
import { dashboard } from '@/routes';
import { dashboard as studentDashboard } from '@/routes/student';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { auth } = usePage().props;

    const mainNavItems = useMemo((): NavItem[] => {
        const items: NavItem[] = [
            {
                title: 'Dashboard',
                href: dashboard(),
                icon: LayoutGrid,
            },
        ];

        if (auth.user?.role === 'admin') {
            items.push({
                title: 'Admin',
                href: adminDashboard(),
                icon: Shield,
            });
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
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
