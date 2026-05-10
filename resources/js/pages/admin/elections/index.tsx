import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';
import { Head } from '@inertiajs/react';

export default function AdminElectionsIndex() {
    return (
        <>
            <Head title="Elections" />

            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight">
                        Elections
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Election periods, ballot setup, and publishing schedules.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CalendarDays
                                className="size-5 text-muted-foreground"
                                aria-hidden
                            />
                            <CardTitle>What you will manage here</CardTitle>
                        </div>
                        <CardDescription>
                            Next: CRUD for elections (title, description, open and close
                            times, status). Positions, parties, and candidates attach to an
                            election.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        <ul className="list-disc space-y-1 pl-5">
                            <li>Draft, scheduled, open, and closed lifecycle</li>
                            <li>
                                Scheduler syncs statuses against{' '}
                                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                                    opens_at
                                </code>{' '}
                                /{' '}
                                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                                    closes_at
                                </code>
                            </li>
                            <li>
                                Nested setup: positions (campus vs program), parties,
                                candidates
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
