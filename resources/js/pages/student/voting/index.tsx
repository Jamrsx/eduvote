import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import { NotebookPen } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import * as VotingController from '@/actions/App/Http/Controllers/Student/VotingController';
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
import { dashboard as studentDashboard } from '@/routes/student';

type BallotOption = {
    candidate_id: number;
    full_name: string;
    party_name: string;
    party_short_name: string | null;
    party_scope_label: string;
    photo_url: string | null;
    platform: string | null;
};

type BallotRace = {
    position_id: number;
    name: string;
    scope_label: string;
    max_selections: number;
    chosen_candidate_id: number | null;
    options: BallotOption[];
};

type CommittedRace = {
    position_id: number;
    name: string;
    scope_label: string;
    full_name: string;
    party_name: string;
    party_short_name: string | null;
    photo_url: string | null;
    platform: string | null;
};

type ElectionBallotCard = {
    id: number;
    title: string;
    description: string | null;
    closes_at_display: string | null;
    ballot_locked: boolean;
    committed_races: CommittedRace[];
    races: BallotRace[];
};

type Props = {
    elections: ElectionBallotCard[];
    student_course_label: string | null;
    voter_scope_notice: string | null;
};

/** Matches backend ballot `scope_label` for campus races. */
function isCampusWideScope(scopeLabel: string): boolean {
    return scopeLabel.trim().toLowerCase() === 'campus-wide';
}

export type ElectionScopeFilterMode = 'all' | 'campus' | 'program';

function scrollToBallotAnchor(elementId: string): void {
    const el =
        typeof document !== 'undefined' ? document.getElementById(elementId) : null;
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function BallotScopeFilterToolbar({
    electionId,
    mode,
    onChangeMode,
    campusCount,
    programCount,
}: {
    electionId: number;
    mode: ElectionScopeFilterMode;
    onChangeMode: (next: ElectionScopeFilterMode) => void;
    campusCount: number;
    programCount: number;
}) {
    const baseId = `election-${electionId}`;

    if (campusCount === 0 || programCount === 0) {
        return null;
    }

    return (
        <div
            role="toolbar"
            aria-label="Ballot visibility by office scope"
            className="bg-muted/20 border-border/60 mb-5 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2"
        >
            <span className="text-muted-foreground text-[11px] font-medium lg:text-xs">
                View:
            </span>
            <div className="flex flex-wrap gap-1.5">
                <Button
                    type="button"
                    size="sm"
                    variant={mode === 'all' ? 'secondary' : 'outline'}
                    className={cn(
                        'h-8 min-h-8 text-xs font-medium',
                        mode === 'all' && 'shadow-xs',
                    )}
                    onClick={() => {
                        onChangeMode('all');
                        scrollToBallotAnchor(`${baseId}-ballot-shell`);
                        console.log('[StudentVotingIndex] scope filter', {
                            electionId,
                            mode: 'all',
                        });
                    }}
                >
                    All offices
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant={mode === 'campus' ? 'secondary' : 'outline'}
                    className={cn(
                        'h-8 min-h-8 text-xs font-medium',
                        mode === 'campus' && 'shadow-xs',
                    )}
                    onClick={() => {
                        onChangeMode('campus');
                        scrollToBallotAnchor(`${baseId}-campus-ballot`);
                        console.log('[StudentVotingIndex] scope filter', {
                            electionId,
                            mode: 'campus',
                        });
                    }}
                >
                    Campus-wide{' '}
                    <span className="text-muted-foreground font-normal">
                        ({campusCount})
                    </span>
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant={mode === 'program' ? 'secondary' : 'outline'}
                    className={cn(
                        'h-8 min-h-8 text-xs font-medium',
                        mode === 'program' && 'shadow-xs',
                    )}
                    onClick={() => {
                        onChangeMode('program');
                        scrollToBallotAnchor(`${baseId}-program-ballot`);
                        console.log('[StudentVotingIndex] scope filter', {
                            electionId,
                            mode: 'program',
                        });
                    }}
                >
                    My program{' '}
                    <span className="text-muted-foreground font-normal">
                        ({programCount})
                    </span>
                </Button>
            </div>
        </div>
    );
}

function VoteRaceFieldset({
    race,
    selectionIndex,
    onNomineeChosen,
}: {
    race: BallotRace;
    selectionIndex: number;
    onNomineeChosen?: (
        positionId: number,
        candidateId: number,
    ) => void;
}) {
    return (
        <fieldset className="bg-muted/10 space-y-3 rounded-lg border p-4">
            <legend className="text-foreground px-1 text-sm font-semibold">
                {race.name}
            </legend>
            <input
                type="hidden"
                name={`selections[${selectionIndex}][position_id]`}
                value={race.position_id}
            />
            <div
                className="flex flex-col gap-4 md:gap-5"
                role="radiogroup"
                aria-label={`${race.name} — ${race.scope_label}`}
            >
                {chunkPairs(race.options).map((pair) =>
                    pair.length === 1 ? (
                        <BallotOptionChoice
                            key={pair[0]!.candidate_id}
                            opt={pair[0]!}
                            race={race}
                            selectionIndex={selectionIndex}
                            onChosen={() =>
                                onNomineeChosen?.(
                                    race.position_id,
                                    pair[0]!.candidate_id,
                                )
                            }
                        />
                    ) : (
                        <div
                            key={`${pair[0]!.candidate_id}-${pair[1]!.candidate_id}`}
                            className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-3"
                        >
                            <BallotOptionChoice
                                opt={pair[0]!}
                                race={race}
                                selectionIndex={selectionIndex}
                                onChosen={() =>
                                    onNomineeChosen?.(
                                        race.position_id,
                                        pair[0]!.candidate_id,
                                    )
                                }
                            />
                            <VersusDivider />
                            <BallotOptionChoice
                                opt={pair[1]!}
                                race={race}
                                selectionIndex={selectionIndex}
                                onChosen={() =>
                                    onNomineeChosen?.(
                                        race.position_id,
                                        pair[1]!.candidate_id,
                                    )
                                }
                            />
                        </div>
                    ),
                )}
            </div>
        </fieldset>
    );
}

function chunkPairs<T>(items: T[]): T[][] {
    const rows: T[][] = [];

    for (let i = 0; i < items.length; i += 2) {
        rows.push(items.slice(i, i + 2));
    }

    return rows;
}

function VersusDivider() {
    return (
        <div
            className="flex items-center justify-center py-2 md:py-0 md:self-center"
            aria-hidden="true"
        >
            <span className="text-muted-foreground border-border/60 bg-muted/40 rounded-md border px-2.5 py-1 text-[10px] font-bold tracking-widest tabular-nums">
                VS
            </span>
        </div>
    );
}

function BallotOptionChoice({
    opt,
    race,
    selectionIndex,
    onChosen,
}: {
    opt: BallotOption;
    race: BallotRace;
    selectionIndex: number;
    onChosen?: () => void;
}) {
    return (
        <div className="min-h-0">
            <label
                className={cn(
                    'group flex h-full min-h-0 cursor-pointer items-start gap-3 rounded-md border bg-card p-3 text-sm shadow-xs transition-colors sm:gap-4 sm:p-4',
                    'border-border/70 hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5',
                )}
            >
                <input
                    type="radio"
                    name={`selections[${selectionIndex}][candidate_id]`}
                    value={opt.candidate_id}
                    defaultChecked={
                        race.chosen_candidate_id === opt.candidate_id
                    }
                    required
                    className="accent-primary mt-2 size-4 shrink-0"
                    onChange={(event) => {
                        if (event.currentTarget.checked) {
                            onChosen?.();
                        }
                    }}
                />
                <div className="border-border/70 bg-muted/40 flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border sm:h-24 sm:w-20">
                    {opt.photo_url ? (
                        <img
                            src={opt.photo_url}
                            alt={opt.full_name}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-contain object-center"
                        />
                    ) : (
                        <span className="text-muted-foreground text-[10px] font-medium">
                            —
                        </span>
                    )}
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                    <div>
                        <p className="text-foreground text-sm font-semibold leading-tight sm:text-[15px]">
                            {opt.full_name}
                        </p>
                        <p className="text-[11px] leading-relaxed">
                            <span className="text-muted-foreground font-semibold">
                                Partylist:
                            </span>{' '}
                            <span className="text-foreground font-medium">
                                {opt.party_name}
                            </span>
                            {opt.party_short_name ? (
                                <span className="text-muted-foreground font-normal">
                                    {` (${opt.party_short_name})`}
                                </span>
                            ) : null}
                        </p>
                    </div>
                    <div className="pt-0.5">
                        <span className="text-muted-foreground text-[11px] font-semibold">
                            Platform:
                        </span>
                        <p className="text-foreground/90 mt-0.5 whitespace-pre-wrap break-words text-xs leading-relaxed">
                            {opt.platform?.trim() ?? 'No platform submitted.'}
                        </p>
                    </div>
                </div>
            </label>
        </div>
    );
}

function CommittedRaceReadonlyCard({ row }: { row: CommittedRace }) {
    return (
        <div className="space-y-2">
            <div className="border-border/60 border-b pb-2">
                <h3 className="text-foreground text-sm font-semibold tracking-tight">
                    {row.name}
                </h3>
            </div>
            <div className="bg-card border-border/70 flex items-start gap-3 rounded-md border p-3 shadow-xs sm:gap-4 sm:p-4">
                <div className="border-border/70 bg-muted/40 flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border sm:h-24 sm:w-20">
                    {row.photo_url ? (
                        <img
                            src={row.photo_url}
                            alt={row.full_name}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-contain object-center"
                        />
                    ) : (
                        <span className="text-muted-foreground text-[10px] font-medium">
                            —
                        </span>
                    )}
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                    <div>
                        <p className="text-foreground text-sm font-semibold leading-tight sm:text-[15px]">
                            {row.full_name}
                        </p>
                        <p className="text-[11px] leading-relaxed">
                            <span className="text-muted-foreground font-semibold">
                                Partylist:
                            </span>{' '}
                            <span className="text-foreground font-medium">
                                {row.party_name}
                            </span>
                            {row.party_short_name ? (
                                <span className="text-muted-foreground font-normal">
                                    {` (${row.party_short_name})`}
                                </span>
                            ) : null}
                        </p>
                    </div>
                    <div className="pt-0.5">
                        <span className="text-muted-foreground text-[11px] font-semibold">
                            Platform:
                        </span>
                        <p className="text-foreground/90 mt-0.5 whitespace-pre-wrap break-words text-xs leading-relaxed">
                            {row.platform?.trim() ??
                                'No platform submitted.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function StudentVotingIndex({
    elections,
    student_course_label,
    voter_scope_notice,
}: Props) {
    const page = usePage<{
        flash?: { success?: string | null };
    }>();

    useEffect(() => {
        console.log('[StudentVotingIndex] ballot elections', elections.length);
    }, [elections.length]);

    useEffect(() => {
        const msg = page.props.flash?.success;

        if (msg) {
            toast.success(msg);
        }
    }, [page.props.flash?.success]);

    const [electionScopeFilter, setElectionScopeFilter] = useState<
        Record<number, ElectionScopeFilterMode>
    >({});

    const setScopeForElection = useCallback(
        (electionId: number, mode: ElectionScopeFilterMode) => {
            setElectionScopeFilter((previous) => ({
                ...previous,
                [electionId]: mode,
            }));
        },
        [],
    );

    const progressFlushTimersRef = useRef<
        Partial<Record<number, ReturnType<typeof setTimeout>>>
    >({});

    const progressPendingRef = useRef<Record<number, Record<number, number>>>(
        {},
    );

    const queueBallotProgressSave = useCallback(
        (electionId: number, positionId: number, candidateId: number) => {
            console.log('[StudentVotingIndex] ballot progress queued', {
                electionId,
                positionId,
                candidateId,
            });

            progressPendingRef.current[electionId] ??= {};

            progressPendingRef.current[electionId][positionId] = candidateId;

            const previousTimer = progressFlushTimersRef.current[electionId];

            if (previousTimer !== undefined) {
                clearTimeout(previousTimer);
            }

            progressFlushTimersRef.current[electionId] = setTimeout(() => {
                delete progressFlushTimersRef.current[electionId];

                const pending = progressPendingRef.current[electionId];

                if (pending === undefined || Object.keys(pending).length === 0) {
                    return;
                }

                const selections = Object.entries(pending).map(
                    ([pid, cid]) => ({
                        position_id: Number(pid),
                        candidate_id: cid,
                    }),
                );

                progressPendingRef.current[electionId] = {};

                router.post(
                    VotingController.saveProgress.url({
                        election: electionId,
                    }),
                    { selections },
                    {
                        preserveScroll: true,
                        preserveState: true,
                        onSuccess: () => {
                            console.log(
                                '[StudentVotingIndex] ballot progress saved',
                                { electionId, rows: selections.length },
                            );
                            toast.success('Progress Save');
                        },
                        onError: (errors) => {
                            console.log(
                                '[StudentVotingIndex] ballot progress save failed',
                                errors,
                            );
                            const selectionError = errors.selections;
                            toast.error(
                                typeof selectionError === 'string'
                                    ? selectionError
                                    : 'Could not save your selection. Try again.',
                            );

                            for (const row of selections) {
                                progressPendingRef.current[electionId] ??= {};

                                progressPendingRef.current[electionId][
                                    row.position_id
                                ] = row.candidate_id;
                            }
                        },
                    },
                );
            }, 450);
        },
        [],
    );

    return (
        <>
            <Head title="Ballot" />

            <div className="flex flex-col gap-6">
                <div className="space-y-1">
                    <h1 className="text-lg font-semibold tracking-tight">
                        Your ballot
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        You get{' '}
                        <span className="font-medium text-foreground">
                            campus-wide
                        </span>{' '}
                        races and, when your profile has a program, races for{' '}
                        <span className="font-medium text-foreground">
                            that program
                        </span>
                        .
                    </p>
                    <p className="text-muted-foreground text-sm">
                        <span className="font-medium text-foreground">
                            One nominee per section.
                        </span>{' '}
                        Each section is one office (one seat). If two sections
                        look alike, they are still two offices—ask an admin if
                        the list should be combined.
                    </p>
                    {student_course_label ? (
                        <p className="text-muted-foreground text-xs">
                            Program:{' '}
                            <span className="font-medium text-foreground">
                                {student_course_label}
                            </span>
                        </p>
                    ) : null}
                </div>

                {voter_scope_notice ? (
                    <Alert>
                        <AlertTitle>Campus ballot only</AlertTitle>
                        <AlertDescription>
                            {voter_scope_notice}
                        </AlertDescription>
                    </Alert>
                ) : null}

                {elections.length === 0 ? (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <NotebookPen
                                    className="size-5 text-muted-foreground"
                                    aria-hidden
                                />
                                <CardTitle className="text-base">
                                    No ballots right now
                                </CardTitle>
                            </div>
                            <CardDescription>
                                Elections appear here while voting is{' '}
                                <span className="font-medium text-foreground">
                                    open
                                </span>{' '}
                                and within the scheduled times. Check back
                                later, or go to your{' '}
                                <Link
                                    href={studentDashboard()}
                                    className="font-medium text-primary underline-offset-4 hover:underline"
                                >
                                    dashboard
                                </Link>
                                .
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-5">
                        {elections.map((election) => {
                            const scopeMode =
                                electionScopeFilter[election.id] ?? 'all';
                            const campusRaces = election.races.filter((r) =>
                                isCampusWideScope(r.scope_label),
                            );
                            const programRaces = election.races.filter(
                                (r) => !isCampusWideScope(r.scope_label),
                            );
                            const campusCommitted =
                                election.committed_races.filter((r) =>
                                    isCampusWideScope(r.scope_label),
                                );
                            const programCommitted =
                                election.committed_races.filter(
                                    (r) => !isCampusWideScope(r.scope_label),
                                );

                            return (
                            <Card key={election.id}>
                                <CardHeader className="space-y-1 pb-3">
                                    <CardTitle className="text-base">
                                        {election.title}
                                    </CardTitle>
                                    {election.description ? (
                                        <CardDescription>
                                            {election.description}
                                        </CardDescription>
                                    ) : null}
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {election.ballot_locked ? (
                                            <Badge
                                                variant="outline"
                                                className="border-muted-foreground/40 bg-muted/40 text-muted-foreground"
                                            >
                                                Ballot submitted
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className="border-emerald-600/30 bg-emerald-600/10 text-emerald-900 dark:text-emerald-100"
                                            >
                                                Open for voting
                                            </Badge>
                                        )}
                                        {election.closes_at_display ? (
                                            <span className="text-muted-foreground text-xs">
                                                Voting closes{' '}
                                                <span className="font-medium text-foreground">
                                                    {election.closes_at_display}
                                                </span>
                                            </span>
                                        ) : null}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    {election.ballot_locked ? (
                                        <div className="flex flex-col gap-4">
                                            <Alert>
                                                <AlertTitle>
                                                    Your ballot is on file
                                                </AlertTitle>
                                                <AlertDescription>
                                                    You already submitted your
                                                    choices for this election.
                                                    They cannot be changed.
                                                </AlertDescription>
                                            </Alert>
                                            <div
                                                id={`election-${election.id}-ballot-shell`}
                                                className="flex flex-col gap-6"
                                            >
                                                <BallotScopeFilterToolbar
                                                    electionId={election.id}
                                                    mode={scopeMode}
                                                    onChangeMode={(next) =>
                                                        setScopeForElection(
                                                            election.id,
                                                            next,
                                                        )
                                                    }
                                                    campusCount={
                                                        campusCommitted.length
                                                    }
                                                    programCount={
                                                        programCommitted.length
                                                    }
                                                />
                                                {campusCommitted.length >
                                                0 ? (
                                                    <section
                                                        id={`election-${election.id}-campus-ballot`}
                                                        className={cn(
                                                            'scroll-mt-6 rounded-lg p-1 transition-[opacity,box-shadow] duration-200',
                                                            scopeMode ===
                                                                'program' &&
                                                                'opacity-45',
                                                            scopeMode ===
                                                                'campus' &&
                                                                'ring-primary/45 ring-offset-background ring-2 ring-offset-2',
                                                        )}
                                                    >
                                                        <h2 className="text-muted-foreground mb-3 text-[11px] font-semibold uppercase tracking-wider">
                                                            Campus-wide offices
                                                        </h2>
                                                        <div className="flex flex-col gap-4">
                                                            {campusCommitted.map(
                                                                (row) => (
                                                                    <CommittedRaceReadonlyCard
                                                                        key={
                                                                            row.position_id
                                                                        }
                                                                        row={
                                                                            row
                                                                        }
                                                                    />
                                                                ),
                                                            )}
                                                        </div>
                                                    </section>
                                                ) : null}
                                                {programCommitted.length >
                                                0 ? (
                                                    <section
                                                        id={`election-${election.id}-program-ballot`}
                                                        className={cn(
                                                            'scroll-mt-6 rounded-lg p-1 transition-[opacity,box-shadow] duration-200',
                                                            scopeMode ===
                                                                'campus' &&
                                                                'opacity-45',
                                                            scopeMode ===
                                                                'program' &&
                                                                'ring-primary/45 ring-offset-background ring-2 ring-offset-2',
                                                        )}
                                                    >
                                                        <h2 className="text-muted-foreground mb-3 text-[11px] font-semibold uppercase tracking-wider">
                                                            Program offices
                                                        </h2>
                                                        <div className="flex flex-col gap-4">
                                                            {programCommitted.map(
                                                                (row) => (
                                                                    <CommittedRaceReadonlyCard
                                                                        key={
                                                                            row.position_id
                                                                        }
                                                                        row={
                                                                            row
                                                                        }
                                                                    />
                                                                ),
                                                            )}
                                                        </div>
                                                    </section>
                                                ) : null}
                                            </div>
                                        </div>
                                    ) : (
                                        <Form
                                            action={
                                                VotingController.store.url({
                                                    election: election.id,
                                                })
                                            }
                                            method="post"
                                            options={{
                                                preserveScroll: true,
                                            }}
                                            className="flex flex-col gap-6"
                                            onSuccess={() => {
                                                console.log(
                                                    '[StudentVotingIndex] ballot saved election',
                                                    election.id,
                                                );
                                            }}
                                        >
                                            {({
                                                processing,
                                                errors: formErrors,
                                            }) => (
                                                <>
                                                    <div
                                                        id={`election-${election.id}-ballot-shell`}
                                                        className="flex flex-col gap-6"
                                                    >
                                                        <BallotScopeFilterToolbar
                                                            electionId={
                                                                election.id
                                                            }
                                                            mode={scopeMode}
                                                            onChangeMode={(
                                                                next,
                                                            ) =>
                                                                setScopeForElection(
                                                                    election.id,
                                                                    next,
                                                                )
                                                            }
                                                            campusCount={
                                                                campusRaces.length
                                                            }
                                                            programCount={
                                                                programRaces.length
                                                            }
                                                        />
                                                        {campusRaces.length >
                                                        0 ? (
                                                            <section
                                                                id={`election-${election.id}-campus-ballot`}
                                                                className={cn(
                                                                    'scroll-mt-6 rounded-lg p-1 transition-[opacity,box-shadow] duration-200',
                                                                    scopeMode ===
                                                                        'program' &&
                                                                        'opacity-45',
                                                                    scopeMode ===
                                                                        'campus' &&
                                                                        'ring-primary/45 ring-offset-background ring-2 ring-offset-2',
                                                                )}
                                                            >
                                                                <h2 className="text-muted-foreground mb-3 text-[11px] font-semibold uppercase tracking-wider">
                                                                    Campus-wide
                                                                    offices
                                                                </h2>
                                                                <div className="flex flex-col gap-6">
                                                                    {campusRaces.map(
                                                                        (
                                                                            race,
                                                                        ) => (
                                                                            <VoteRaceFieldset
                                                                                key={
                                                                                    race.position_id
                                                                                }
                                                                                race={
                                                                                    race
                                                                                }
                                                                                selectionIndex={election.races.findIndex(
                                                                                    (
                                                                                        r,
                                                                                    ) =>
                                                                                        r.position_id ===
                                                                                        race.position_id,
                                                                                )}
                                                                                onNomineeChosen={(
                                                                                    positionId,
                                                                                    candidateId,
                                                                                ) =>
                                                                                    queueBallotProgressSave(
                                                                                        election.id,
                                                                                        positionId,
                                                                                        candidateId,
                                                                                    )
                                                                                }
                                                                            />
                                                                        ),
                                                                    )}
                                                                </div>
                                                            </section>
                                                        ) : null}
                                                        {programRaces.length >
                                                        0 ? (
                                                            <section
                                                                id={`election-${election.id}-program-ballot`}
                                                                className={cn(
                                                                    'scroll-mt-6 rounded-lg p-1 transition-[opacity,box-shadow] duration-200',
                                                                    scopeMode ===
                                                                        'campus' &&
                                                                        'opacity-45',
                                                                    scopeMode ===
                                                                        'program' &&
                                                                        'ring-primary/45 ring-offset-background ring-2 ring-offset-2',
                                                                )}
                                                            >
                                                                <h2 className="text-muted-foreground mb-3 text-[11px] font-semibold uppercase tracking-wider">
                                                                    Program
                                                                    offices
                                                                </h2>
                                                                <div className="flex flex-col gap-6">
                                                                    {programRaces.map(
                                                                        (
                                                                            race,
                                                                        ) => (
                                                                            <VoteRaceFieldset
                                                                                key={
                                                                                    race.position_id
                                                                                }
                                                                                race={
                                                                                    race
                                                                                }
                                                                                selectionIndex={election.races.findIndex(
                                                                                    (
                                                                                        r,
                                                                                    ) =>
                                                                                        r.position_id ===
                                                                                        race.position_id,
                                                                                )}
                                                                                onNomineeChosen={(
                                                                                    positionId,
                                                                                    candidateId,
                                                                                ) =>
                                                                                    queueBallotProgressSave(
                                                                                        election.id,
                                                                                        positionId,
                                                                                        candidateId,
                                                                                    )
                                                                                }
                                                                            />
                                                                        ),
                                                                    )}
                                                                </div>
                                                            </section>
                                                        ) : null}
                                                    </div>
                                                    {formErrors.selections ? (
                                                        <p className="text-destructive text-sm">
                                                            {Array.isArray(
                                                                formErrors.selections,
                                                            )
                                                                ? formErrors.selections.join(
                                                                      ' ',
                                                                  )
                                                                : String(
                                                                      formErrors.selections as string,
                                                                  )}
                                                        </p>
                                                    ) : null}
                                                    <p className="text-muted-foreground text-xs">
                                                        Autosave keeps picks if you leave this page.
                                                        Change any office until you submit; the ballot
                                                        is final only after you press submit.
                                                    </p>
                                                    <Button
                                                        type="submit"
                                                        disabled={processing}
                                                        className="min-h-11 w-full sm:w-auto sm:self-start"
                                                    >
                                                        {processing
                                                            ? 'Saving…'
                                                            : 'Submit ballot for this election'}
                                                    </Button>
                                                </>
                                            )}
                                        </Form>
                                    )}
                                </CardContent>
                            </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
