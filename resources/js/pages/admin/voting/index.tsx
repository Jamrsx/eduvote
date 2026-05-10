import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { Head } from '@inertiajs/react';

export default function AdminVotingIndex() {
    return (
        <>
            <Head title="Ballots" />

            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight">
                        Ballots & activity
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Read-only views over votes and turnout by election and position.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <BarChart3
                                className="size-5 text-muted-foreground"
                                aria-hidden
                            />
                            <CardTitle>What you will manage here</CardTitle>
                        </div>
                        <CardDescription>
                            Next: reports built from the{' '}
                            <code className="rounded bg-muted px-1 py-0.5 text-xs">
                                votes
                            </code>{' '}
                            table — totals per candidate, participation rates, and audit-style
                            exports.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        <ul className="list-disc space-y-1 pl-5">
                            <li>One ballot per voter per position per election (enforced in DB)</li>
                            <li>Filter by election, position, program</li>
                            <li>No manual vote edits in normal operation</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
