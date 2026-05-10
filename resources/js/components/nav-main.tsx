import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({
    items = [],
    groupLabel = 'Platform',
}: {
    items?: NavItem[];
    groupLabel?: string;
}) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                        >
                            <Link
                                href={item.href}
                                prefetch
                                className="flex w-full min-w-0 items-center gap-2"
                                aria-label={
                                    item.notificationDot
                                        ? `${item.title}, attention needed`
                                        : undefined
                                }
                            >
                                <span className="relative inline-flex shrink-0">
                                    {item.icon && <item.icon />}
                                    {item.notificationDot ? (
                                        <span
                                            className="border-sidebar bg-destructive absolute -top-0.5 -right-0.5 size-2 rounded-full border-2"
                                            aria-hidden
                                        />
                                    ) : null}
                                </span>
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
