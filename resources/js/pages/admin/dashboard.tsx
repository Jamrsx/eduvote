import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { Head } from '@inertiajs/react';

export default function AdminDashboard() {
    return (
        <>
            <Head title="Admin dashboard" />
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight">
                        Administration
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage elections, candidates, and student accounts from here.
                    </p>
                </div>
                <div className="relative min-h-[240px] overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    <div className="relative z-10 flex min-h-[240px] items-center justify-center p-6 text-center text-sm text-muted-foreground">
                        Admin tools will be added in the next steps.
                    </div>
                </div>
            </div>
        </>
    );
}
