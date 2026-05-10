import { Head } from '@inertiajs/react';
import { BarChart3, Trophy } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
    course_id: number | null;
    department_code: string | null;
    department_name: string | null;
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

type ScopeFilter = 'all' | 'campus' | number;

/** Filter chips: campus-wide vs each program/dept race group. */
function buildScopeChoices(positions: ResultPosition[]): {
    value: ScopeFilter;
    label: string;
    count: number;
}[] {
    const campusCount = positions.filter((p) => p.course_id === null).length;
    const deptMap = new Map<
        number,
        { label: string; count: number }
    >();

    for (const p of positions) {
        if (p.course_id === null) {
            continue;
        }

        const label =
            p.department_code !== null &&
            p.department_code !== ''
                ? p.department_name !== null && p.department_name !== ''
                    ? `${p.department_code} — ${p.department_name}`
                    : p.department_code
                : p.scope_label;

        const prev = deptMap.get(p.course_id);

        if (prev !== undefined) {
            prev.count += 1;

            deptMap.set(p.course_id, prev);
        } else {
            deptMap.set(p.course_id, { label, count: 1 });
        }
    }

    const choices: { value: ScopeFilter; label: string; count: number }[] = [
        { value: 'all', label: 'All offices', count: positions.length },
    ];

    if (campusCount > 0) {
        choices.push({
            value: 'campus',
            label: 'Campus-wide',
            count: campusCount,
        });
    }

    const sortedDeptIds = [...deptMap.keys()].sort((a, b) => {
        const la = deptMap.get(a)?.label ?? '';
        const lb = deptMap.get(b)?.label ?? '';

        return la.localeCompare(lb, undefined, { sensitivity: 'base' });
    });

    for (const id of sortedDeptIds) {
        const meta = deptMap.get(id);

        if (meta !== undefined) {
            choices.push({
                value: id,
                label: meta.label,
                count: meta.count,
            });
        }
    }

    return choices;
}

function positionMatchesScope(
    position: ResultPosition,
    filter: ScopeFilter,
): boolean {
    if (filter === 'all') {
        return true;
    }

    if (filter === 'campus') {
        return position.course_id === null;
    }

    return position.course_id === filter;
}

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

function AdminElectionResultCard({
    election,
}: {
    election: ElectionResultBlock;
}) {
    const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all');
    const choices = useMemo(
        () => buildScopeChoices(election.positions),
        [election.positions],
    );

    const setScope = useCallback(
        (next: ScopeFilter) => {
            setScopeFilter(next);
            console.log('[AdminElectionResultsIndex] office scope filter', {
                electionId: election.id,
                filter:
                    next === 'all'
                        ? 'all'
                        : next === 'campus'
                          ? 'campus'
                          : `dept:${String(next)}`,
            });
        },
        [election.id],
    );

    const visiblePositions = useMemo(
        () =>
            election.positions.filter((p) =>
                positionMatchesScope(p, scopeFilter),
            ),
        [election.positions, scopeFilter],
    );

    const showScopeToolbar =
        election.results_visible &&
        election.positions.length > 0 &&
        choices.length > 1;

    return (
        <Card>
            <CardHeader className="space-y-2 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{election.title}</CardTitle>
                    <Badge
                        variant="outline"
                        className={cn(statusBadgeClass(election.status))}
                    >
                        {election.status}
                    </Badge>
                    {election.results_visible && election.distinct_voters > 0 ? (
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
                        Scheduled close: {election.closes_at_display}
                    </CardDescription>
                ) : null}
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {!election.results_visible ? (
                    <Alert>
                        <AlertTitle>Results not final</AlertTitle>
                        <AlertDescription>
                            This election is still{' '}
                            <span className="font-medium text-foreground">
                                {election.status}
                            </span>
                            . Full counts and percentages show after you set
                            status to{' '}
                            <span className="font-medium text-foreground">
                                closed
                            </span>{' '}
                            on Election schedule.
                        </AlertDescription>
                    </Alert>
                ) : election.positions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No ballot lines (positions) for this election yet.
                    </p>
                ) : (
                    <>
                        {showScopeToolbar ? (
                            <div
                                role="toolbar"
                                aria-label="Filter offices by campus or department"
                                className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
                            >
                                <span className="text-muted-foreground text-xs font-medium">
                                    Show:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {choices.map((c) => (
                                        <Button
                                            key={
                                                typeof c.value === 'number'
                                                    ? `dept-${c.value}`
                                                    : c.value
                                            }
                                            type="button"
                                            size="sm"
                                            variant={
                                                scopeFilter === c.value
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                            className={cn(
                                                'h-8 min-h-8 text-xs font-medium',
                                                scopeFilter === c.value &&
                                                    'shadow-xs',
                                            )}
                                            aria-pressed={
                                                scopeFilter === c.value
                                            }
                                            onClick={() => setScope(c.value)}
                                        >
                                            {c.label}{' '}
                                            <span className="text-muted-foreground font-normal tabular-nums">
                                                ({c.count})
                                            </span>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                        {visiblePositions.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                No offices match this filter.
                            </p>
                        ) : (
                            visiblePositions.map((position) => (
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
                                            position.total_votes > 0 ? (
                                                <>
                                                    {' · '}
                                                    {position.total_votes}{' '}
                                                    vote
                                                    {position.total_votes === 1
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
                                                {position.lines.map((line) => (
                                                    <tr
                                                        key={line.candidate_id}
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
                                                                {line.full_name}
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
                                                            {line.votes}
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
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
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
                        Times use {appTimezone}. On each closed election, use{' '}
                        <span className="font-medium text-foreground">Show</span>{' '}
                        to list only campus-wide races or a single department
                        (e.g. BSIT, BEED).
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
                            <AdminElectionResultCard
                                key={election.id}
                                election={election}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
