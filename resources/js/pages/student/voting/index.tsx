import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import { Gamepad2, NotebookPen } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
import {
    animateNomineePick,
    animateSubmitReady,
    revealBallotScene,
} from '@/lib/ballot-motion';
import { runBallotSubmitCelebration } from '@/lib/ballot-submit-celebration';
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
    ballot_split?: boolean;
    ballot_phase?: 'campus' | 'program';
};

/** Matches `VotingController@store` flash message after a successful ballot submit. */
const BALLOT_SAVED_FLASH = 'Your ballot was saved.';

/** Election card has both campus-wide and program-scoped races (unlocked). */
function electionHasCampusAndProgram(election: ElectionBallotCard): boolean {
    if (election.ballot_locked || election.races.length === 0) {
        return false;
    }

    const campus = election.races.filter((r) =>
        isCampusWideScope(r.scope_label),
    ).length;
    const program = election.races.filter(
        (r) => !isCampusWideScope(r.scope_label),
    ).length;

    return campus > 0 && program > 0;
}

/** For split cards: all campus-wide lines on this election have a pick. */
function splitCampusCompleteForElection(election: ElectionBallotCard): boolean {
    if (!electionHasCampusAndProgram(election)) {
        return true;
    }

    return election.races
        .filter((r) => isCampusWideScope(r.scope_label))
        .every((r) => r.chosen_candidate_id !== null);
}

function computeProgramStepUnlocked(
    electionsList: ElectionBallotCard[],
): boolean {
    return electionsList.every(
        (e) => e.ballot_locked || splitCampusCompleteForElection(e),
    );
}

function BallotHiddenRaceChoices({
    races,
    electionRaces,
}: {
    races: BallotRace[];
    electionRaces: BallotRace[];
}) {
    return (
        <div className="sr-only" aria-hidden>
            {races.map((race) => {
                const selectionIndex = electionRaces.findIndex(
                    (r) => r.position_id === race.position_id,
                );
                const cid = race.chosen_candidate_id;

                if (selectionIndex < 0 || cid === null) {
                    return null;
                }

                return (
                    <div key={race.position_id}>
                        <input
                            type="hidden"
                            name={`selections[${selectionIndex}][position_id]`}
                            value={race.position_id}
                        />
                        <input
                            type="hidden"
                            name={`selections[${selectionIndex}][candidate_id]`}
                            value={cid}
                        />
                    </div>
                );
            })}
        </div>
    );
}

function BallotPhaseStepper({
    ballotSplit,
    ballotPhase,
    programUnlocked,
}: {
    ballotSplit: boolean;
    ballotPhase: 'campus' | 'program';
    programUnlocked: boolean;
}) {
    if (!ballotSplit) {
        return null;
    }

    const campusHref = VotingController.index.url({
        query: { phase: 'campus' },
    });
    const programHref = VotingController.index.url({
        query: { phase: 'program' },
    });

    return (
        <nav
            aria-label="Ballot steps"
            className="border-border/50 bg-background/80 flex flex-col gap-3 rounded-2xl border p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
            <ol className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                <li className="flex items-center gap-2">
                    <Link
                        href={campusHref}
                        className={cn(
                            'rounded-full px-3 py-1.5 transition-colors',
                            ballotPhase === 'campus'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted/60 hover:bg-muted',
                        )}
                    >
                        1 · Campus-wide
                    </Link>
                </li>
                <li aria-hidden className="text-muted-foreground/50">
                    →
                </li>
                <li className="flex items-center gap-2">
                    {programUnlocked ? (
                        <Link
                            href={programHref}
                            className={cn(
                                'rounded-full px-3 py-1.5 transition-colors',
                                ballotPhase === 'program'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted/60 hover:bg-muted',
                            )}
                        >
                            2 · My program
                        </Link>
                    ) : (
                        <span
                            className="text-muted-foreground/70 cursor-not-allowed rounded-full bg-muted/40 px-3 py-1.5"
                            title="Choose every campus-wide office first"
                        >
                            2 · My program
                        </span>
                    )}
                </li>
            </ol>
            <p className="text-muted-foreground max-w-xl text-xs leading-relaxed normal-case">
                {ballotPhase === 'campus'
                    ? 'Finish campus-wide offices, then open step 2 for your program slate.'
                    : 'Campus-wide choices are kept. Finish program offices, then submit each election.'}
            </p>
        </nav>
    );
}

/** Matches backend ballot `scope_label` for campus races. */
function isCampusWideScope(scopeLabel: string): boolean {
    return scopeLabel.trim().toLowerCase() === 'campus-wide';
}

export type ElectionScopeFilterMode = 'all' | 'campus' | 'program';

function BallotProgressHud({
    filled,
    total,
}: {
    filled: number;
    total: number;
}) {
    const pct = total === 0 ? 0 : Math.round((filled / total) * 100);

    return (
        <div className="mb-5 space-y-1.5">
            <div className="text-muted-foreground flex items-center justify-between text-[11px] font-semibold tracking-wide uppercase">
                <span>Ballot progress</span>
                <span className="text-foreground tabular-nums">
                    {filled}/{total}
                </span>
            </div>
            <div className="bg-muted/40 border-border/60 h-2 overflow-hidden rounded-full border">
                <div
                    className="h-full rounded-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400 shadow-[0_0_14px_rgba(168,85,247,0.45)] transition-[width] duration-500 ease-out"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

function scrollToBallotAnchor(elementId: string): void {
    const el =
        typeof document !== 'undefined' ? document.getElementById(elementId) : null;
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function BallotStageHero({
    studentCourseLabel,
    ballotSplit,
    ballotPhase,
}: {
    studentCourseLabel: string | null;
    ballotSplit: boolean;
    ballotPhase: 'campus' | 'program';
}) {
    const stepTitle =
        ballotSplit && ballotPhase === 'campus'
            ? 'Step 1 — Campus-wide ballot'
            : ballotSplit && ballotPhase === 'program'
              ? 'Step 2 — My program ballot'
              : 'Your ballot';

    const stepBody =
        ballotSplit && ballotPhase === 'campus'
            ? 'Vote for campus-wide offices first. When every line here has a pick, go to step 2 for your program slate.'
            : ballotSplit && ballotPhase === 'program'
              ? 'Program-only races for your course. Campus-wide picks from step 1 stay saved.'
              : null;

    return (
        <div
            data-ballot-reveal
            className="border-border/60 from-card/90 via-card/70 to-muted/30 relative overflow-hidden rounded-2xl border bg-linear-to-br p-5 shadow-[0_0_48px_-18px_rgba(124,58,237,0.35)] sm:p-6"
        >
            <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-violet-500/15 blur-3xl"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -bottom-24 -left-10 size-52 rounded-full bg-cyan-500/10 blur-3xl"
            />
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                    <div className="text-primary flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                        <Gamepad2 className="size-4" aria-hidden />
                        <span>Ballot</span>
                    </div>
                    <h1 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
                        {stepTitle}
                    </h1>
                    {stepBody ? (
                        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                            {stepBody}
                        </p>
                    ) : (
                        <>
                            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                                You get{' '}
                                <span className="text-foreground font-medium">
                                    campus-wide
                                </span>{' '}
                                races and, when your profile has a program,
                                races for{' '}
                                <span className="text-foreground font-medium">
                                    that program
                                </span>
                                .
                            </p>
                            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                                <span className="text-foreground font-medium">
                                    One nominee per section.
                                </span>{' '}
                                Each block is one office. Two similar titles are
                                still two seats—ask an admin if the list should
                                be merged.
                            </p>
                        </>
                    )}
                </div>
                {studentCourseLabel ? (
                    <div className="border-border/50 from-violet-500/15 to-cyan-500/10 shrink-0 rounded-xl border bg-linear-to-br px-4 py-3 text-right sm:min-w-[11rem]">
                        <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
                            Program
                        </p>
                        <p className="text-foreground text-sm font-semibold leading-snug">
                            {studentCourseLabel}
                        </p>
                    </div>
                ) : null}
            </div>
        </div>
    );
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
            className="border-border/50 bg-background/70 mb-5 flex flex-wrap items-center gap-2 rounded-full border px-2 py-2 shadow-inner backdrop-blur-sm"
        >
            <span className="text-muted-foreground px-1 text-[11px] font-semibold tracking-wide uppercase lg:text-xs">
                View
            </span>
            <div className="flex flex-wrap gap-1.5">
                <Button
                    type="button"
                    size="sm"
                    variant={mode === 'all' ? 'secondary' : 'outline'}
                    className={cn(
                        'h-8 min-h-8 rounded-full text-xs font-semibold transition-transform active:scale-95',
                        mode === 'all' &&
                            'shadow-[0_0_18px_-4px_rgba(168,85,247,0.45)]',
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
                        'h-8 min-h-8 rounded-full text-xs font-semibold transition-transform active:scale-95',
                        mode === 'campus' &&
                            'shadow-[0_0_18px_-4px_rgba(34,211,238,0.35)]',
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
                        'h-8 min-h-8 rounded-full text-xs font-semibold transition-transform active:scale-95',
                        mode === 'program' &&
                            'shadow-[0_0_18px_-4px_rgba(168,85,247,0.35)]',
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
        <fieldset className="border-border/50 from-muted/25 to-card/40 space-y-3 rounded-xl border bg-linear-to-b p-4 shadow-sm sm:p-5">
            <legend className="text-foreground px-1 text-sm font-bold tracking-tight">
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
            <span className="text-muted-foreground border-primary/25 from-violet-500/20 to-cyan-500/15 rounded-lg border bg-linear-to-br px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] tabular-nums shadow-inner">
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
        <div className="min-h-0" data-ballot-choice-wrap>
            <label
                className={cn(
                    'group flex h-full min-h-0 cursor-pointer items-start gap-3 rounded-xl border bg-card/90 p-3 text-sm shadow-md transition-[border-color,box-shadow,transform] duration-200 sm:gap-4 sm:p-4',
                    'border-border/60 hover:border-primary/35 hover:shadow-[0_12px_40px_-24px_rgba(124,58,237,0.45)]',
                    'has-[:checked]:border-primary has-[:checked]:bg-primary/8 has-[:checked]:shadow-[0_0_0_1px_rgba(168,85,247,0.35)]',
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
                            const wrap = event.currentTarget.closest(
                                '[data-ballot-choice-wrap]',
                            ) as HTMLElement | null;
                            animateNomineePick(wrap);
                            onChosen?.();
                        }
                    }}
                />
                <div className="border-border/60 bg-muted/50 flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border ring-1 ring-white/5 sm:h-24 sm:w-20">
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
            <div className="bg-card/95 border-border/60 flex items-start gap-3 rounded-xl border p-3 shadow-md ring-1 ring-white/5 sm:gap-4 sm:p-4">
                <div className="border-border/60 bg-muted/50 flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border sm:h-24 sm:w-20">
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
    ballot_split = false,
    ballot_phase = 'campus',
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

    const ballotCelebrationFiredRef = useRef(false);

    useEffect(() => {
        if (ballotCelebrationFiredRef.current) {
            return;
        }

        const flashMsg = page.props.flash?.success ?? '';
        const fromSubmit = flashMsg === BALLOT_SAVED_FLASH;
        const hasLockedBallot = elections.some((e) => e.ballot_locked);

        if (!fromSubmit && !hasLockedBallot) {
            return;
        }

        ballotCelebrationFiredRef.current = true;

        const frame = window.requestAnimationFrame(() => {
            runBallotSubmitCelebration();
        });

        return () => window.cancelAnimationFrame(frame);
    }, [elections, page.props.flash?.success]);

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

                const payload: {
                    selections: { position_id: number; candidate_id: number }[];
                    phase?: 'campus' | 'program';
                } = { selections };

                if (ballot_split) {
                    payload.phase = ballot_phase;
                }

                router.post(
                    VotingController.saveProgress.url({
                        election: electionId,
                    }),
                    payload,
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
        [ballot_split, ballot_phase],
    );

    const ballotStageRef = useRef<HTMLDivElement>(null);
    const prevBallotFilledRef = useRef<Record<number, number>>({});
    /** Ballot lines only — omit picks so autosave does not re-run the entrance animation. */
    const electionsRevealSignature = `${elections
        .map((e) => {
            const positionKey = [...e.races]
                .map((r) => r.position_id)
                .sort((a, b) => a - b)
                .join(',');

            return `${e.id}:${e.ballot_locked ? 1 : 0}:${positionKey}`;
        })
        .join('|')}|${ballot_split ? ballot_phase : 'all'}`;
    const lastRevealSignatureRef = useRef<string | null>(null);

    useLayoutEffect(() => {
        if (lastRevealSignatureRef.current === electionsRevealSignature) {
            return;
        }

        lastRevealSignatureRef.current = electionsRevealSignature;
        revealBallotScene(ballotStageRef.current);
    }, [electionsRevealSignature]);

    useEffect(() => {
        for (const e of elections) {
            if (e.ballot_locked) {
                continue;
            }

            const total = e.races.length;

            if (total === 0) {
                continue;
            }

            const filled = e.races.filter(
                (r) => r.chosen_candidate_id !== null,
            ).length;
            const prev = prevBallotFilledRef.current[e.id] ?? -1;

            if (filled === total && prev < total) {
                window.requestAnimationFrame(() => {
                    const btn = document.querySelector<HTMLElement>(
                        `[data-submit-ballot="${e.id}"]`,
                    );
                    animateSubmitReady(btn);
                });
            }

            prevBallotFilledRef.current[e.id] = filled;
        }
    }, [elections]);

    const canOpenProgramStep = computeProgramStepUnlocked(elections);

    return (
        <>
            <Head title="Ballot" />

            <div
                ref={ballotStageRef}
                className="relative flex flex-col gap-8 pb-[max(12rem,calc(env(safe-area-inset-bottom,0px)+10rem))]"
            >
                <div
                    aria-hidden
                    className="pointer-events-none fixed inset-0 -z-10 opacity-[0.35] dark:opacity-50"
                    style={{
                        background:
                            'radial-gradient(ellipse 90% 55% at 50% -8%, rgba(124, 58, 237, 0.22), transparent 52%), radial-gradient(ellipse 65% 45% at 100% 0%, rgba(6, 182, 212, 0.12), transparent), var(--background)',
                    }}
                />

                <BallotStageHero
                    studentCourseLabel={student_course_label}
                    ballotSplit={ballot_split}
                    ballotPhase={ballot_phase}
                />

                {voter_scope_notice ? (
                    <Alert>
                        <AlertTitle>Campus ballot only</AlertTitle>
                        <AlertDescription>
                            {voter_scope_notice}
                        </AlertDescription>
                    </Alert>
                ) : null}

                <BallotPhaseStepper
                    ballotSplit={ballot_split}
                    ballotPhase={ballot_phase}
                    programUnlocked={canOpenProgramStep}
                />

                {elections.length === 0 ? (
                    <Card
                        data-ballot-reveal
                        className="border-border/50 from-card/95 to-muted/20 bg-linear-to-br shadow-[0_0_40px_-20px_rgba(124,58,237,0.25)]"
                    >
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
                    <div className="flex flex-col gap-6">
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

                            const splitCard = electionHasCampusAndProgram(election);
                            const programOnlyCard =
                                programRaces.length > 0 &&
                                campusRaces.length === 0;
                            const filterDimming = !ballot_split;
                            const showCampusVotes =
                                (!ballot_split ||
                                    ballot_phase === 'campus') &&
                                campusRaces.length > 0;
                            const showProgramVotes =
                                (!ballot_split ||
                                    ballot_phase === 'program') &&
                                programRaces.length > 0;
                            const progressRaces =
                                ballot_split &&
                                campusRaces.length > 0 &&
                                programRaces.length > 0
                                    ? ballot_phase === 'campus'
                                        ? campusRaces
                                        : programRaces
                                    : election.races;
                            const campusHiddenReady =
                                !splitCard ||
                                ballot_phase !== 'program' ||
                                campusRaces.every(
                                    (r) => r.chosen_candidate_id !== null,
                                );

                            return (
                            <Card
                                key={election.id}
                                className="border-border/50 from-card/90 to-card/40 overflow-hidden bg-linear-to-b shadow-[0_20px_50px_-28px_rgba(15,23,42,0.45)] ring-1 ring-white/5 dark:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.65)]"
                            >
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
                                    ) : ballot_split &&
                                      ballot_phase === 'campus' &&
                                      programOnlyCard ? (
                                        <div className="text-muted-foreground flex flex-col gap-3 px-6 pb-6 text-sm leading-relaxed">
                                            <p>
                                                This election has program-only
                                                offices. Use step 2 after every
                                                campus-wide line is filled on
                                                the ballots that have them.
                                            </p>
                                            {canOpenProgramStep ? (
                                                <Button
                                                    variant="default"
                                                    className="w-fit bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:from-blue-500 hover:to-indigo-500 focus-visible:ring-blue-400/50"
                                                    asChild
                                                >
                                                    <Link
                                                        href={VotingController.index.url(
                                                            {
                                                                query: {
                                                                    phase: 'program',
                                                                },
                                                            },
                                                        )}
                                                    >
                                                        Go to my program ballot
                                                    </Link>
                                                </Button>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    className="w-fit"
                                                    disabled
                                                >
                                                    Go to my program ballot
                                                </Button>
                                            )}
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
                                                        {!ballot_split ? (
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
                                                        ) : null}
                                                        <BallotProgressHud
                                                            filled={
                                                                progressRaces.filter(
                                                                    (r) =>
                                                                        r.chosen_candidate_id !==
                                                                        null,
                                                                ).length
                                                            }
                                                            total={
                                                                progressRaces.length
                                                            }
                                                        />
                                                        {ballot_split &&
                                                        ballot_phase ===
                                                            'program' &&
                                                        splitCard ? (
                                                            <BallotHiddenRaceChoices
                                                                races={
                                                                    campusRaces
                                                                }
                                                                electionRaces={
                                                                    election.races
                                                                }
                                                            />
                                                        ) : null}
                                                        {ballot_split &&
                                                        ballot_phase ===
                                                            'program' &&
                                                        splitCard &&
                                                        !campusHiddenReady ? (
                                                            <Alert variant="destructive">
                                                                <AlertTitle>
                                                                    Campus-wide
                                                                    choices missing
                                                                </AlertTitle>
                                                                <AlertDescription>
                                                                    Return to
                                                                    step 1 and
                                                                    pick every
                                                                    campus-wide
                                                                    office before
                                                                    submitting.
                                                                </AlertDescription>
                                                            </Alert>
                                                        ) : null}
                                                        {showCampusVotes ? (
                                                            <section
                                                                id={`election-${election.id}-campus-ballot`}
                                                                className={cn(
                                                                    'scroll-mt-6 rounded-lg p-1 transition-[opacity,box-shadow] duration-200',
                                                                    filterDimming &&
                                                                        scopeMode ===
                                                                            'program' &&
                                                                        'opacity-45',
                                                                    filterDimming &&
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
                                                        {showProgramVotes ? (
                                                            <section
                                                                id={`election-${election.id}-program-ballot`}
                                                                className={cn(
                                                                    'scroll-mt-6 rounded-lg p-1 transition-[opacity,box-shadow] duration-200',
                                                                    filterDimming &&
                                                                        scopeMode ===
                                                                            'campus' &&
                                                                        'opacity-45',
                                                                    filterDimming &&
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
                                                        Autosave keeps picks if
                                                        you leave this page.
                                                        Change any office until
                                                        you submit; the ballot is
                                                        final only after you
                                                        press submit.
                                                    </p>
                                                    {!(
                                                        ballot_split &&
                                                        ballot_phase ===
                                                            'campus' &&
                                                        splitCard
                                                    ) ? (
                                                        <Button
                                                            type="submit"
                                                            data-submit-ballot={
                                                                election.id
                                                            }
                                                            disabled={
                                                                processing ||
                                                                (ballot_split &&
                                                                    ballot_phase ===
                                                                        'program' &&
                                                                    splitCard &&
                                                                    !campusHiddenReady)
                                                            }
                                                            className="min-h-11 w-full shadow-[0_0_24px_-8px_rgba(124,58,237,0.55)] transition-transform sm:w-auto sm:self-start"
                                                        >
                                                            {processing
                                                                ? 'Saving…'
                                                                : 'Submit ballot for this election'}
                                                        </Button>
                                                    ) : null}
                                                </>
                                            )}
                                        </Form>
                                    )}
                                </CardContent>
                            </Card>
                            );
                        })}
                        {ballot_split &&
                        ballot_phase === 'campus' &&
                        elections.some(
                            (e) =>
                                !e.ballot_locked &&
                                electionHasCampusAndProgram(e),
                        ) ? (
                            <div
                                className="border-border/50 bg-card/95 supports-[backdrop-filter]:bg-card/90 sticky bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] z-20 mt-6 flex flex-col gap-4 rounded-xl border px-4 pb-7 pt-4 shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-6 sm:pb-8 sm:pt-5"
                            >
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    When every campus-wide office is filled
                                    across your ballots, continue to program
                                    offices.
                                </p>
                                {canOpenProgramStep ? (
                                    <Button
                                        variant="default"
                                        className="min-h-11 shrink-0 bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:from-blue-500 hover:to-indigo-500 focus-visible:ring-blue-400/50"
                                        asChild
                                    >
                                        <Link
                                            href={VotingController.index.url({
                                                query: { phase: 'program' },
                                            })}
                                        >
                                            Continue to my program offices
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="min-h-11 shrink-0"
                                        disabled
                                    >
                                        Continue to my program offices
                                    </Button>
                                )}
                            </div>
                        ) : null}
                        {ballot_split &&
                        ballot_phase === 'campus' &&
                        elections.some(
                            (e) =>
                                !e.ballot_locked &&
                                electionHasCampusAndProgram(e),
                        ) ? (
                            <div
                                aria-hidden
                                className="pointer-events-none h-[min(18vh,10rem)] w-full shrink-0 sm:h-[min(22vh,12rem)]"
                            />
                        ) : null}
                    </div>
                )}
            </div>
        </>
    );
}
