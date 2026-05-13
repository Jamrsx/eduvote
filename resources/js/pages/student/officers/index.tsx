import { Head, Link } from '@inertiajs/react';
import { Sparkles, UsersRound } from 'lucide-react';
import type { RefObject } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
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
import { animateNomineePick, prefersReducedMotion } from '@/lib/ballot-motion';
import { revealOfficersDirectory } from '@/lib/officers-directory-motion';
import {
    applyOfficersRosterStaticContent,
    bindOfficerNomineeScrollRows,
    buildNomineeScramblePlainText,
    runOfficersHeroScrambleIntro,
} from '@/lib/officers-roster-motion';
import { ensureRevealAudioUnlockedFromGesture, primeRevealAudioOnUserGesture } from '@/lib/reveal-sound';
import { bindAnimeScrollReveals } from '@/lib/scroll-reveal-motion';
import { index as studentVotingIndex } from '@/routes/student/voting';

type DirectoryNominee = {
    full_name: string;
    party_scope_label: string;
    party_name: string;
    party_short_name: string | null;
    photo_url: string | null;
    platform: string | null;
};

type DirectoryOffice = {
    position_id: number;
    name: string;
    scope_label: string;
    nominees: DirectoryNominee[];
};

type OfficersElection = {
    id: number;
    title: string;
    description: string | null;
    status: string;
    accepting_votes: boolean;
    opens_at_display: string | null;
    closes_at_display: string | null;
    offices: DirectoryOffice[];
};

type Props = {
    elections: OfficersElection[];
    student_course_label: string | null;
    voter_scope_notice: string | null;
};

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

function OfficersDirectoryHero({
    studentCourseLabel,
    kickerRef,
    titleRef,
    bodyRef,
    shellRef,
    shineRef,
}: {
    studentCourseLabel: string | null;
    kickerRef: RefObject<HTMLSpanElement | null>;
    titleRef: RefObject<HTMLSpanElement | null>;
    bodyRef: RefObject<HTMLSpanElement | null>;
    shellRef: RefObject<HTMLDivElement | null>;
    shineRef: RefObject<HTMLDivElement | null>;
}) {
    return (
        <div
            ref={shellRef}
            data-officers-hero
            data-officers-hero-shell
            onPointerDownCapture={() => {
                primeRevealAudioOnUserGesture();
                console.log('[OfficersDirectoryHero] prime reveal audio (pointer)');
            }}
            className="border-border/60 from-card/90 via-card/70 to-muted/30 relative origin-center overflow-hidden rounded-2xl border bg-linear-to-br p-5 shadow-[0_0_48px_-18px_rgba(124,58,237,0.35)] sm:p-6"
        >
            <div
                ref={shineRef}
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 z-[12] w-[48%] skew-x-[-12deg] bg-linear-to-r from-transparent via-white/40 to-transparent opacity-0 mix-blend-screen"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-20 z-[1] size-56 rounded-full bg-violet-500/15 blur-3xl"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -bottom-24 -left-10 z-[1] size-52 rounded-full bg-cyan-500/10 blur-3xl"
            />
            <div className="relative z-[16] flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                    <p className="sr-only">
                        Nominee roster. Nominees and platforms. Campus-wide
                        seats and your program slate — the same offices you see
                        on the Vote page. Scheduled elections show nominees
                        early; you can only cast votes when the window is open.
                    </p>
                    <div className="text-primary flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                        <Sparkles className="size-4" aria-hidden />
                        <span ref={kickerRef} aria-hidden="true" />
                    </div>
                    <h1 className="text-foreground min-h-[1.75rem] text-xl font-bold tracking-tight sm:text-2xl">
                        <span
                            ref={titleRef}
                            aria-hidden="true"
                            className="block min-h-[1.5rem]"
                        />
                    </h1>
                    <p className="text-muted-foreground max-w-2xl min-h-[4.5rem] text-sm leading-relaxed">
                        <span
                            ref={bodyRef}
                            aria-hidden="true"
                            className="block min-h-[4rem]"
                        />
                    </p>
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

function OfficerNomineeCard({
    nominee,
    onCardPeek,
}: {
    nominee: DirectoryNominee;
    onCardPeek?: (element: HTMLElement) => void;
}) {
    const scrambleSource = buildNomineeScramblePlainText(nominee);
    const platformForSr =
        nominee.platform?.trim() !== '' && nominee.platform !== null
            ? nominee.platform.trim()
            : 'No platform submitted.';

    return (
        <div
            data-officer-nominee-row
            data-officers-card-wrap
            className="border-border/50 from-muted/25 to-card/40 group relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-linear-to-b p-3 shadow-md ring-1 ring-white/5 transition-[border-color,box-shadow] duration-200 sm:p-4"
            onMouseEnter={(event) => {
                onCardPeek?.(event.currentTarget);
            }}
        >
            <div
                data-officer-nominee-shine
                aria-hidden
                className="pointer-events-none absolute inset-y-1 left-0 z-[8] w-[46%] skew-x-[-10deg] bg-linear-to-r from-transparent via-white/32 to-transparent opacity-0 mix-blend-screen"
            />
            <p className="sr-only">
                {nominee.full_name}. Partylist {nominee.party_name}
                {nominee.party_short_name
                    ? `, short name ${nominee.party_short_name}`
                    : ''}
                . {nominee.party_scope_label}. Platform: {platformForSr}
            </p>
            <div className="relative z-[10] flex min-h-0 flex-1 items-start gap-3 sm:gap-4">
                <div
                    data-officer-nominee-photo
                    className="border-border/60 bg-muted/50 flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border ring-1 ring-white/5 sm:h-28 sm:w-24"
                >
                    {nominee.photo_url ? (
                        <img
                            src={nominee.photo_url}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-contain object-center"
                        />
                    ) : (
                        <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
                            No photo
                        </span>
                    )}
                </div>
                <div
                    data-officer-nominee-copy
                    data-scramble-text={encodeURIComponent(scrambleSource)}
                    aria-hidden="true"
                    className="text-foreground/90 min-h-[5.5rem] min-w-0 flex-1 whitespace-pre-wrap break-words text-xs leading-relaxed sm:text-sm"
                />
            </div>
        </div>
    );
}

export default function StudentOfficersIndex({
    elections,
    student_course_label,
    voter_scope_notice,
}: Props) {
    const rosterStageRef = useRef<HTMLDivElement>(null);
    const heroKickerRef = useRef<HTMLSpanElement>(null);
    const heroTitleRef = useRef<HTMLSpanElement>(null);
    const heroBodyRef = useRef<HTMLSpanElement>(null);
    const heroShellRef = useRef<HTMLDivElement>(null);
    const heroShineRef = useRef<HTMLDivElement>(null);
    const lastPeekAtRef = useRef(0);

    const officersRevealSignature = elections
        .map((e) => {
            const officeKey = [...e.offices]
                .map((o) => o.position_id)
                .sort((a, b) => a - b)
                .join(',');

            return `${e.id}:${e.accepting_votes ? 1 : 0}:${officeKey}`;
        })
        .join('|');

    const lastOfficersRevealSignatureRef = useRef<string | null>(null);

    useLayoutEffect(() => {
        if (lastOfficersRevealSignatureRef.current === officersRevealSignature) {
            return;
        }

        lastOfficersRevealSignatureRef.current = officersRevealSignature;
        revealOfficersDirectory(rosterStageRef.current);
    }, [officersRevealSignature]);

    useEffect(() => {
        const heroRefs = {
            kicker: heroKickerRef.current,
            title: heroTitleRef.current,
            body: heroBodyRef.current,
            shell: heroShellRef.current,
            shine: heroShineRef.current,
        };
        const stage = rosterStageRef.current;

        if (prefersReducedMotion()) {
            applyOfficersRosterStaticContent(heroRefs, stage);
            console.log(
                '[StudentOfficersIndex] roster static content (reduced motion)',
            );

            return () => {};
        }

        ensureRevealAudioUnlockedFromGesture();
        const unbindNomineeRows = bindOfficerNomineeScrollRows(stage);
        const heroFrame = requestAnimationFrame(() => {
            void runOfficersHeroScrambleIntro(heroRefs);
        });
        const unbindScrollReveal = bindAnimeScrollReveals(stage);
        console.log(
            '[StudentOfficersIndex] roster motion + scroll reveal bound',
        );

        return () => {
            cancelAnimationFrame(heroFrame);
            unbindNomineeRows();
            unbindScrollReveal();
        };
    }, [officersRevealSignature]);

    const handleNomineeCardPeek = useCallback((element: HTMLElement) => {
        const now = Date.now();

        if (now - lastPeekAtRef.current < 820) {
            return;
        }

        lastPeekAtRef.current = now;
        console.log('[StudentOfficersIndex] nominee card peek');
        animateNomineePick(element);
    }, []);

    useEffect(() => {
        console.log(
            '[StudentOfficersIndex] elections',
            elections.length,
            elections.map((e) => ({ id: e.id, offices: e.offices.length })),
        );
    }, [elections]);

    return (
        <>
            <Head title="Nominees & platforms" />

            <div
                ref={rosterStageRef}
                onPointerDownCapture={() => {
                    primeRevealAudioOnUserGesture();
                }}
                className="relative mx-auto flex w-full max-w-5xl flex-col gap-8 pb-10"
            >
                <div
                    aria-hidden
                    className="pointer-events-none fixed inset-0 -z-10 opacity-[0.35] dark:opacity-50"
                    style={{
                        background:
                            'radial-gradient(ellipse 90% 55% at 50% -8%, rgba(124, 58, 237, 0.18), transparent 52%), radial-gradient(ellipse 65% 45% at 100% 0%, rgba(6, 182, 212, 0.1), transparent), var(--background)',
                    }}
                />

                <OfficersDirectoryHero
                    studentCourseLabel={student_course_label}
                    kickerRef={heroKickerRef}
                    titleRef={heroTitleRef}
                    bodyRef={heroBodyRef}
                    shellRef={heroShellRef}
                    shineRef={heroShineRef}
                />

                <div
                    data-scroll-reveal
                    className="border-border/50 bg-background/75 flex flex-col gap-3 rounded-xl border px-4 py-3 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
                >
                    <p className="text-muted-foreground text-xs leading-snug sm:text-sm">
                        Informational only — preview who is running before you
                        vote.
                    </p>
                    <Button
                        variant="default"
                        className="shrink-0 bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:from-blue-500 hover:to-indigo-500 focus-visible:ring-blue-400/50"
                        asChild
                    >
                        <Link href={studentVotingIndex()} prefetch>
                            Open Vote page
                        </Link>
                    </Button>
                </div>

                {voter_scope_notice ? (
                    <Alert data-scroll-reveal>
                        <AlertTitle>Program slate</AlertTitle>
                        <AlertDescription>
                            {voter_scope_notice}
                        </AlertDescription>
                    </Alert>
                ) : null}

                {elections.length === 0 ? (
                    <Card
                        data-officers-reveal
                        className="border-border/50 from-card/95 to-muted/20 bg-linear-to-br shadow-[0_0_40px_-20px_rgba(124,58,237,0.25)]"
                    >
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <UsersRound
                                    className="text-muted-foreground size-5"
                                    aria-hidden
                                />
                                <CardTitle className="text-base">
                                    No nominee list right now
                                </CardTitle>
                            </div>
                            <CardDescription>
                                Nominees appear when an election is scheduled or
                                open (and accepting votes once the window
                                starts) and you have ballot lines on your
                                account.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-6">
                        {elections.map((election) => (
                            <Card
                                key={election.id}
                                className="border-border/50 from-card/90 to-card/40 overflow-hidden bg-linear-to-b shadow-[0_20px_50px_-28px_rgba(15,23,42,0.45)] ring-1 ring-white/5 dark:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.65)]"
                            >
                                <CardHeader className="space-y-1 pb-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <CardTitle className="text-base font-semibold tracking-tight">
                                            {election.title}
                                        </CardTitle>
                                        {election.accepting_votes ? (
                                            <Badge
                                                variant="outline"
                                                className="border-emerald-600/30 bg-emerald-600/10 text-xs text-emerald-900 dark:text-emerald-100"
                                            >
                                                Voting open
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className="border-amber-600/35 bg-amber-600/10 text-xs text-amber-950 dark:text-amber-100"
                                            >
                                                {election.status ===
                                                'scheduled'
                                                    ? 'Upcoming'
                                                    : 'Not accepting votes'}
                                            </Badge>
                                        )}
                                    </div>
                                    {election.description ? (
                                        <CardDescription className="text-xs">
                                            {election.description}
                                        </CardDescription>
                                    ) : null}
                                    {election.opens_at_display ? (
                                        <p className="text-muted-foreground text-xs">
                                            Voting opens{' '}
                                            <span className="text-foreground font-medium">
                                                {election.opens_at_display}
                                            </span>
                                        </p>
                                    ) : null}
                                    {election.closes_at_display ? (
                                        <p className="text-muted-foreground text-xs">
                                            Voting closes{' '}
                                            <span className="text-foreground font-medium">
                                                {election.closes_at_display}
                                            </span>
                                        </p>
                                    ) : null}
                                </CardHeader>
                                <CardContent className="flex flex-col gap-6 px-4 pb-5 pt-0 sm:px-6">
                                    {!election.accepting_votes ? (
                                        <Alert>
                                            <AlertTitle>
                                                Preview — not voting yet
                                            </AlertTitle>
                                            <AlertDescription>
                                                Review nominees and platforms
                                                below. When voting opens, use the
                                                Vote page to cast your ballot.
                                            </AlertDescription>
                                        </Alert>
                                    ) : null}
                                    {election.offices.map((office) => (
                                        <section
                                            key={office.position_id}
                                            aria-labelledby={`office-${office.position_id}`}
                                            className="border-border/40 space-y-3 rounded-lg p-1 ring-1 ring-transparent transition-shadow hover:ring-primary/15"
                                        >
                                            <div
                                                id={`office-${office.position_id}`}
                                                className="border-border/60 border-b pb-2"
                                            >
                                                <h2 className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                                                    {office.name}
                                                </h2>
                                                <p className="text-muted-foreground mt-1 text-xs">
                                                    {office.scope_label}
                                                </p>
                                            </div>

                                            <ul className="flex flex-col gap-4">
                                                {chunkPairs(office.nominees).map(
                                                    (pair, pairIdx) => (
                                                        <li
                                                            key={`${office.position_id}-pair-${pairIdx}`}
                                                            className="list-none"
                                                        >
                                                            {pair.length ===
                                                            1 ? (
                                                                <OfficerNomineeCard
                                                                    nominee={
                                                                        pair[0]!
                                                                    }
                                                                    onCardPeek={
                                                                        handleNomineeCardPeek
                                                                    }
                                                                />
                                                            ) : (
                                                                <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-3">
                                                                    <OfficerNomineeCard
                                                                        nominee={
                                                                            pair[0]!
                                                                        }
                                                                        onCardPeek={
                                                                            handleNomineeCardPeek
                                                                        }
                                                                    />
                                                                    <VersusDivider />
                                                                    <OfficerNomineeCard
                                                                        nominee={
                                                                            pair[1]!
                                                                        }
                                                                        onCardPeek={
                                                                            handleNomineeCardPeek
                                                                        }
                                                                    />
                                                                </div>
                                                            )}
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </section>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
