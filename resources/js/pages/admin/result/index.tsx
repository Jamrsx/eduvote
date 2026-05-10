import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { BarChart3, Trophy } from 'lucide-react';
import { useEffect } from 'react';

type ResultLine = {
    candidate_id: number;
    full_name: string;
    party_name: string | null;
    photo_url: string | null;
    votes: number;
    percent: number | null;
    leading: boolean;
};

type ResultPosition = {
    id: number;
    name: string;
    scope_label: string;
    total_votes: number | null;
    lines: ResultLine[];
};

type ElectionResultBlock = {
    id: number;
    title: string;
    status: string;
    closes_at_display: string | null;
    results_visible: boolean;
    distinct_voters: number;
    total_selections: number;
    positions: ResultPosition[];
};

type Props = {
    elections: ElectionResultBlock[];
    appTimezone: string;
};

function statusBadgeClass(status: string): string {
    switch (status) {
        case 'draft':
            return 'border-muted-foreground/30 bg-muted/50 text-muted-foreground';
        case 'scheduled':
            return 'border-blue-600/30 bg-blue-600/10 text-blue-900 dark:text-blue-100';
        case 'open':
            return 'border-emerald-600/30 bg-emerald-600/10 text-emerald-900 dark:text-emerald-100';
        case 'closed':
            return 'border-foreground/20 bg-transparent text-muted-foreground';
        default:
            return '';
    }
}

export default function AdminElectionResultsIndex({
    elections,
    appTimezone,
}: Props) {
    useEffect(() => {
        console.log(
            '[AdminElectionResultsIndex] elections',
            elections.length,
            'timezone',
            appTimezone,
        );
    }, [elections.length, appTimezone]);

    return (
        <>
            <Head title="Election results" />

            <div className="flex flex-col gap-6">
                <div className="space-y-1">
                    <h1 className="text-lg font-semibold tracking-tight">
                        Election results
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Tallies appear after an election is marked{' '}
                        <span className="font-medium text-foreground">
                            Closed
                        </span>
                        . Counts use the votes stored when students cast ballots.
                        Times use {appTimezone}.
                    </p>
                </div>

                {elections.length === 0 ? (
                    <Card>
                        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                            <BarChart3
                                className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                                aria-hidden
                            />
                            <div>
                                <CardTitle className="text-base">
                                    No elections yet
                                </CardTitle>
                                <CardDescription>
                                    Create an election under Election schedule,
                                    run voting, then close it to see results
                                    here.
                                </CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-4">
                        {elections.map((election) => (
                            <Card key={election.id}>
                                <CardHeader className="space-y-2 pb-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <CardTitle className="text-base">
                                            {election.title}
                                        </CardTitle>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                statusBadgeClass(
                                                    election.status,
                                                ),
                                            )}
                                        >
                                            {election.status}
                                        </Badge>
                                        {election.results_visible &&
                                        election.distinct_voters > 0 ? (
                                            <span className="text-muted-foreground text-xs">
                                                {election.distinct_voters}{' '}
                                                {election.distinct_voters === 1
                                                    ? ' voter'
                                                    : ' voters'}{' '}
                                                participated
                                                {election.total_selections > 0
                                                    ? ` · ${election.total_selections} selection${election.total_selections === 1 ? '' : 's'}`
                                                    : ''}
                                            </span>
                                        ) : null}
                                    </div>
                                    {election.closes_at_display ? (
                                        <CardDescription>
                                            Scheduled close:{' '}
                                            {election.closes_at_display}
                                        </CardDescription>
                                    ) : null}
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4">
                                    {!election.results_visible ? (
                                        <Alert>
                                            <AlertTitle>
                                                Results not final
                                            </AlertTitle>
                                            <AlertDescription>
                                                This election is still{' '}
                                                <span className="font-medium text-foreground">
                                                    {election.status}
                                                </span>
                                                . Full counts and percentages
                                                show after you set status to{' '}
                                                <span className="font-medium text-foreground">
                                                    closed
                                                </span>{' '}
                                                on Election schedule.
                                            </AlertDescription>
                                        </Alert>
                                    ) : election.positions.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            No ballot lines (positions) for this
                                            election yet.
                                        </p>
                                    ) : (
                                        election.positions.map((position) => (
                                            <div
                                                key={position.id}
                                                className="bg-muted/20 rounded-lg border"
                                            >
                                                <div className="border-b px-4 py-3">
                                                    <p className="font-medium">
                                                        {position.name}
                                                    </p>
                                                    <p className="text-muted-foreground mt-1 text-xs">
                                                        {position.scope_label}
                                                        {typeof position.total_votes ===
                                                            'number' &&
                                                        position.total_votes >
                                                            0 ? (
                                                            <>
                                                                {' · '}
                                                                {
                                                                    position.total_votes
                                                                }{' '}
                                                                vote
                                                                {position.total_votes ===
                                                                1
                                                                    ? ''
                                                                    : 's'}{' '}
                                                                in this race
                                                            </>
                                                        ) : election.results_visible ? (
                                                            ' · No votes yet'
                                                        ) : null}
                                                    </p>
                                                </div>
                                                <div className="overflow-x-auto px-2 py-3 sm:px-4">
                                                    <table className="w-full min-w-[640px] text-sm">
                                                        <thead>
                                                            <tr className="border-b text-left">
                                                                <th className="w-14 px-2 py-2 font-medium">
                                                                    Photo
                                                                </th>
                                                                <th className="px-2 py-2 font-medium">
                                                                    Candidate
                                                                </th>
                                                                <th className="px-2 py-2 font-medium">
                                                                    Party
                                                                </th>
                                                                <th className="px-2 py-2 text-right font-medium">
                                                                    Votes
                                                                </th>
                                                                <th className="px-2 py-2 text-right font-medium">
                                                                    Share
                                                                </th>
                                                                <th className="w-36 px-2 py-2 font-medium">
                                                                    Bar
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {position.lines.map(
                                                                (line) => (
                                                                    <tr
                                                                        key={
                                                                            line.candidate_id
                                                                        }
                                                                        className={cn(
                                                                            'border-b border-border/80 last:border-0',
                                                                            line.leading &&
                                                                                'bg-primary/5',
                                                                        )}
                                                                    >
                                                                        <td className="px-2 py-2">
                                                                            {line.photo_url ? (
                                                                                <img
                                                                                    src={
                                                                                        line.photo_url
                                                                                    }
                                                                                    alt={
                                                                                        line.full_name
                                                                                    }
                                                                                    className="size-10 rounded-md object-cover ring-1 ring-border"
                                                                                />
                                                                            ) : (
                                                                                <span className="text-muted-foreground text-xs">
                                                                                    —
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-2 py-2 font-medium">
                                                                            <span className="inline-flex flex-wrap items-center gap-2">
                                                                                {
                                                                                    line.full_name
                                                                                }
                                                                                {line.leading &&
                                                                                line.votes >
                                                                                    0 ? (
                                                                                    <Trophy
                                                                                        className="size-4 shrink-0 text-amber-600 dark:text-amber-400"
                                                                                        aria-hidden
                                                                                    />
                                                                                ) : null}
                                                                            </span>
                                                                        </td>
                                                                        <td className="text-muted-foreground px-2 py-2 text-xs">
                                                                            {line.party_name ??
                                                                                '—'}
                                                                        </td>
                                                                        <td className="px-2 py-2 text-right tabular-nums">
                                                                            {
                                                                                line.votes
                                                                            }
                                                                        </td>
                                                                        <td className="text-muted-foreground px-2 py-2 text-right tabular-nums text-xs">
                                                                            {typeof line.percent ===
                                                                            'number'
                                                                                ? `${line.percent}%`
                                                                                : '—'}
                                                                        </td>
                                                                        <td className="px-2 py-2">
                                                                            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                                                                                <div
                                                                                    className="bg-primary h-full rounded-full transition-[width]"
                                                                                    style={{
                                                                                        width: `${typeof line.percent === 'number' ? line.percent : 0}%`,
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ),
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
