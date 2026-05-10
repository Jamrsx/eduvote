import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { Head } from '@inertiajs/react';

export default function StudentDashboard() {
    return (
        <>
            <Head title="Student dashboard" />
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight">
                        Voting
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        View open elections and cast your ballot when voting is live.
                    </p>
                </div>
                <div className="relative min-h-[240px] overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    <div className="relative z-10 flex min-h-[240px] items-center justify-center p-6 text-center text-sm text-muted-foreground">
                        Election cards and ballot UI will be added in the next steps.
                    </div>
                </div>
            </div>
        </>
    );
}
