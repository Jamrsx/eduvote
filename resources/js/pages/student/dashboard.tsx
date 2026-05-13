import { Head, Link } from '@inertiajs/react';
import { animate } from 'animejs';
import {
    CalendarRange,
    CircleCheck,
    Crosshair,
    ListTodo,
    Sparkles,
    Trophy,
    Zap,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { prefersReducedMotion } from '@/lib/ballot-motion';
import { playShineGlareSound } from '@/lib/reveal-sound';
import { cn } from '@/lib/utils';
import { index as studentOfficersIndex } from '@/routes/student/officers';
import { index as studentVotingIndex } from '@/routes/student/voting';

type ElectionSummary = {
    id: number;
    title: string;
    description: string | null;
    opens_at_display: string | null;
    closes_at_display: string | null;
    ballot_locked: boolean;
    status_label: string;
    status_detail: string;
};

type UpcomingElectionSummary = {
    id: number;
    title: string;
    description: string | null;
    election_status: string;
    opens_at_display: string | null;
    closes_at_display: string | null;
    status_label: string;
    status_detail: string;
};

type Props = {
    election_summaries: ElectionSummary[];
    upcoming_election_summaries?: UpcomingElectionSummary[];
    student_course_label: string | null;
};

function HudStatTile({
    label,
    value,
    icon: Icon,
    accent,
}: {
    label: string;
    value: number;
    icon: typeof Crosshair;
    accent: 'violet' | 'amber' | 'emerald' | 'cyan';
}) {
    const accentRing =
        accent === 'violet'
            ? 'from-violet-500/25 to-fuchsia-500/10 ring-violet-500/35'
            : accent === 'amber'
              ? 'from-amber-500/20 to-orange-500/10 ring-amber-500/35'
              : accent === 'emerald'
                ? 'from-emerald-500/20 to-teal-500/10 ring-emerald-500/35'
                : 'from-cyan-500/20 to-sky-500/10 ring-cyan-500/35';

    return (
        <div
            className={cn(
                'border-border/50 relative overflow-hidden rounded-xl border bg-linear-to-br p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] ring-1',
                accentRing,
            )}
        >
            <div
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full bg-white/5 blur-2xl"
            />
            <div className="relative flex items-start justify-between gap-2">
                <div>
                    <p className="text-muted-foreground text-[10px] font-bold tracking-[0.18em] uppercase">
                        {label}
                    </p>
                    <p className="text-foreground mt-1 text-2xl font-black tabular-nums tracking-tight sm:text-3xl">
                        {value}
                    </p>
                </div>
                <div className="border-border/60 bg-background/40 rounded-lg border p-2 shadow-inner">
                    <Icon className="text-primary size-5" aria-hidden />
                </div>
            </div>
        </div>
    );
}

function MissionPanel({
    children,
    railClass,
    voteShine = false,
    voteShineKey,
}: {
    children: ReactNode;
    railClass: string;
    /** When true, plays a one-time shine sweep + shing sound when the panel enters view (ballot still needs a vote). */
    voteShine?: boolean;
    voteShineKey?: number;
}) {
    const panelRef = useRef<HTMLDivElement>(null);
    const shineRef = useRef<HTMLDivElement>(null);
    const shinePlayedRef = useRef(false);

    useEffect(() => {
        if (!voteShine || voteShineKey === undefined) {
            return;
        }

        shinePlayedRef.current = false;

        const panel = panelRef.current;
        const shine = shineRef.current;

        if (!panel || !shine) {
            return;
        }

        if (prefersReducedMotion()) {
            return;
        }

        const runShine = (): void => {
            if (shinePlayedRef.current) {
                return;
            }

            shinePlayedRef.current = true;
            const sweep = Math.max(panel.offsetWidth * 0.9, 200);

            shine.style.opacity = '0';
            playShineGlareSound(0.11);
            console.log(
                '[StudentDashboard] active ballot shine + shing',
                voteShineKey,
            );

            void animate(shine, {
                opacity: [0, 0.78, 0],
                x: [-sweep * 0.35, sweep * 0.92],
                duration: 820,
                ease: 'out(2)',
            }).then(() => {
                shine.style.opacity = '0';
                shine.style.removeProperty('transform');
            });
        };

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        runShine();
                        observer.disconnect();

                        break;
                    }
                }
            },
            { root: null, rootMargin: '0px 0px 12% 0px', threshold: 0.12 },
        );

        observer.observe(panel);

        return () => {
            observer.disconnect();
        };
    }, [voteShine, voteShineKey]);

    return (
        <div
            ref={panelRef}
            className="border-border/55 group relative overflow-hidden rounded-2xl border bg-linear-to-b from-card/95 via-card/70 to-muted/25 shadow-[0_20px_48px_-28px_rgba(124,58,237,0.35)] ring-1 ring-white/5"
        >
            <div
                aria-hidden
                className={cn(
                    'absolute bottom-0 left-0 top-0 w-1 bg-linear-to-b',
                    railClass,
                )}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.07]"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.35) 2px, rgba(255,255,255,0.35) 3px)',
                }}
            />
            {voteShine && !prefersReducedMotion() ? (
                <div
                    ref={shineRef}
                    aria-hidden
                    className="pointer-events-none absolute inset-y-1 left-0 z-[12] w-[46%] skew-x-[-10deg] bg-linear-to-r from-transparent via-white/32 to-transparent opacity-0 mix-blend-screen"
                />
            ) : null}
            <div className="relative z-[16] pl-3">{children}</div>
        </div>
    );
}

export default function StudentDashboard({
    election_summaries,
    upcoming_election_summaries = [],
    student_course_label,
}: Props) {
    useEffect(() => {
        console.log(
            '[StudentDashboard] summaries',
            election_summaries.length,
            election_summaries.map((row) => ({
                id: row.id,
                locked: row.ballot_locked,
            })),
            'upcoming',
            upcoming_election_summaries.length,
        );
    }, [election_summaries, upcoming_election_summaries]);

    const pendingCount = election_summaries.filter((row) => !row.ballot_locked)
        .length;
    const submittedCount = election_summaries.filter(
        (row) => row.ballot_locked,
    ).length;
    const totalOpen = election_summaries.length;
    const completionPct =
        totalOpen > 0 ? Math.round((submittedCount / totalOpen) * 100) : 0;

    return (
        <>
            <Head title="Student dashboard" />

            <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-8 pb-6">
                <div
                    aria-hidden
                    className="pointer-events-none fixed inset-0 -z-10 opacity-[0.4]"
                    style={{
                        background:
                            'radial-gradient(ellipse 85% 50% at 50% -5%, rgba(124, 58, 237, 0.22), transparent 55%), radial-gradient(ellipse 55% 40% at 100% 10%, rgba(6, 182, 212, 0.12), transparent), var(--background)',
                    }}
                />

                <section className="border-border/55 from-violet-950/35 via-card/90 to-cyan-950/25 relative overflow-hidden rounded-2xl border bg-linear-to-br p-6 shadow-[0_0_56px_-18px_rgba(139,92,246,0.5)] ring-1 ring-violet-500/20 sm:p-7">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-violet-500/20 blur-3xl"
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -bottom-28 -left-16 size-64 rounded-full bg-cyan-500/15 blur-3xl"
                    />
                    <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="space-y-3">
                            <div className="text-primary flex items-center gap-2 text-[10px] font-bold tracking-[0.28em] uppercase">
                                <Sparkles className="size-4" aria-hidden />
                                Ballot HQ
                            </div>
                            <h1 className="text-foreground text-2xl font-black tracking-tight sm:text-3xl">
                                Voting dashboard
                            </h1>
                            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                                Scheduled windows show when your ballot unlocks.
                                When voting is live, missions appear below with a
                                direct path to cast. Campus-wide and program
                                lines live on the Vote page.
                            </p>
                        </div>
                        {student_course_label ? (
                            <div className="border-border/50 from-violet-500/15 to-cyan-500/10 shrink-0 rounded-xl border bg-linear-to-br px-4 py-3 text-right shadow-inner sm:min-w-[11rem]">
                                <p className="text-muted-foreground text-[10px] font-bold tracking-[0.2em] uppercase">
                                    Loadout
                                </p>
                                <p className="text-foreground text-sm font-bold leading-snug">
                                    {student_course_label}
                                </p>
                            </div>
                        ) : null}
                    </div>

                    {totalOpen > 0 ? (
                        <div className="border-border/40 relative mt-6 rounded-xl border bg-black/20 px-4 py-3 backdrop-blur-sm">
                            <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                    <Trophy className="text-amber-400 size-3.5" aria-hidden />
                                    Clearance
                                </span>
                                <span className="text-foreground tabular-nums">
                                    {completionPct}%
                                </span>
                            </div>
                            <div
                                className="bg-muted/50 h-2.5 overflow-hidden rounded-full ring-1 ring-white/10"
                                role="presentation"
                            >
                                <div
                                    className="h-full rounded-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400 shadow-[0_0_12px_rgba(167,139,250,0.6)] transition-[width] duration-500"
                                    style={{ width: `${completionPct}%` }}
                                />
                            </div>
                            <p className="text-muted-foreground mt-2 text-xs">
                                {submittedCount} of {totalOpen} open ballot
                                {totalOpen === 1 ? '' : 's'} submitted.
                            </p>
                        </div>
                    ) : null}
                </section>

                <section
                    aria-label="Ballot statistics"
                    className="grid grid-cols-2 gap-3 sm:grid-cols-4"
                >
                    <HudStatTile
                        label="Open"
                        value={election_summaries.length}
                        icon={Crosshair}
                        accent="violet"
                    />
                    <HudStatTile
                        label="Pending"
                        value={pendingCount}
                        icon={ListTodo}
                        accent="amber"
                    />
                    <HudStatTile
                        label="Done"
                        value={submittedCount}
                        icon={CircleCheck}
                        accent="emerald"
                    />
                    <HudStatTile
                        label="Queued"
                        value={upcoming_election_summaries.length}
                        icon={CalendarRange}
                        accent="cyan"
                    />
                </section>

                {upcoming_election_summaries.length > 0 ? (
                    <section className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <Zap className="text-cyan-400 size-5" aria-hidden />
                            <h2 className="text-foreground text-sm font-black tracking-tight uppercase">
                                Scheduled windows
                            </h2>
                        </div>
                        <div className="flex flex-col gap-4">
                            {upcoming_election_summaries.map((row) => (
                                <MissionPanel
                                    key={row.id}
                                    railClass="from-sky-400 to-cyan-600"
                                >
                                    <Card className="border-0 bg-transparent shadow-none">
                                        <CardHeader className="space-y-2 pb-2 pt-4">
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <CardTitle className="text-base font-bold tracking-tight">
                                                    {row.title}
                                                </CardTitle>
                                                <Badge
                                                    variant="outline"
                                                    className="border-sky-500/40 bg-sky-500/15 text-xs font-semibold text-sky-100 shrink-0"
                                                >
                                                    {row.election_status ===
                                                    'scheduled'
                                                        ? 'Scheduled'
                                                        : 'Not started'}
                                                </Badge>
                                            </div>
                                            {row.description ? (
                                                <CardDescription className="text-xs leading-relaxed">
                                                    {row.description}
                                                </CardDescription>
                                            ) : null}
                                            {row.opens_at_display ? (
                                                <p className="text-muted-foreground text-xs">
                                                    Voting opens{' '}
                                                    <span className="text-foreground font-semibold">
                                                        {row.opens_at_display}
                                                    </span>
                                                </p>
                                            ) : null}
                                            {row.closes_at_display ? (
                                                <p className="text-muted-foreground text-xs">
                                                    Voting closes{' '}
                                                    <span className="text-foreground font-semibold">
                                                        {row.closes_at_display}
                                                    </span>
                                                </p>
                                            ) : null}
                                        </CardHeader>
                                        <CardContent className="text-muted-foreground flex flex-col gap-4 pb-5 text-sm">
                                            <p className="leading-relaxed">
                                                {row.status_detail}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    className="min-h-11 border-cyan-500/35 bg-cyan-500/10 font-semibold text-cyan-50 hover:bg-cyan-500/20"
                                                >
                                                    <Link
                                                        href={studentOfficersIndex()}
                                                        prefetch
                                                        className="inline-flex items-center justify-center gap-2"
                                                    >
                                                        Intel: Nominees
                                                    </Link>
                                                </Button>
                                                <Button
                                                    asChild
                                                    className="min-h-11 bg-linear-to-r from-blue-600 to-indigo-600 font-semibold text-white shadow-lg hover:from-blue-500 hover:to-indigo-500"
                                                >
                                                    <Link
                                                        href={studentVotingIndex()}
                                                        prefetch
                                                        className="inline-flex items-center justify-center gap-2"
                                                    >
                                                        Enter Vote
                                                    </Link>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </MissionPanel>
                            ))}
                        </div>
                    </section>
                ) : null}

                {election_summaries.length > 0 ? (
                    <section className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <Crosshair className="text-violet-400 size-5" aria-hidden />
                            <h2 className="text-foreground text-sm font-black tracking-tight uppercase">
                                Active ballots
                            </h2>
                        </div>
                        <div className="flex flex-col gap-4">
                            {election_summaries.map((row) => {
                                const needsYourVote =
                                    !row.ballot_locked ||
                                    row.status_label
                                        .toLowerCase()
                                        .includes('need your vote');

                                return (
                                    <MissionPanel
                                        key={row.id}
                                        railClass={
                                            row.ballot_locked
                                                ? 'from-muted-foreground/60 to-muted-foreground/30'
                                                : 'from-amber-400 to-orange-600'
                                        }
                                        voteShine={needsYourVote}
                                        voteShineKey={row.id}
                                    >
                                    <Card className="border-0 bg-transparent shadow-none">
                                        <CardHeader className="space-y-2 pb-2 pt-4">
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <CardTitle className="text-base font-bold tracking-tight">
                                                    {row.title}
                                                </CardTitle>
                                                {row.ballot_locked ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-emerald-500/35 bg-emerald-500/10 text-xs font-semibold text-emerald-100 shrink-0"
                                                    >
                                                        {row.status_label}
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-amber-500/45 bg-amber-500/15 text-xs font-semibold text-amber-100 shrink-0"
                                                    >
                                                        {row.status_label}
                                                    </Badge>
                                                )}
                                            </div>
                                            {row.description ? (
                                                <CardDescription className="text-xs leading-relaxed">
                                                    {row.description}
                                                </CardDescription>
                                            ) : null}
                                            {row.opens_at_display ? (
                                                <p className="text-muted-foreground text-xs">
                                                    Voting opens{' '}
                                                    <span className="text-foreground font-semibold">
                                                        {row.opens_at_display}
                                                    </span>
                                                </p>
                                            ) : null}
                                            {row.closes_at_display ? (
                                                <p className="text-muted-foreground text-xs">
                                                    Voting closes{' '}
                                                    <span className="text-foreground font-semibold">
                                                        {row.closes_at_display}
                                                    </span>
                                                </p>
                                            ) : null}
                                        </CardHeader>
                                        <CardContent className="text-muted-foreground flex flex-col gap-4 pb-5 text-sm">
                                            <p className="leading-relaxed">
                                                {row.status_detail}
                                            </p>
                                            <Button
                                                asChild
                                                className="min-h-11 w-fit bg-linear-to-r from-blue-600 to-indigo-600 font-semibold text-white shadow-lg hover:from-blue-500 hover:to-indigo-500"
                                            >
                                                <Link
                                                    href={studentVotingIndex()}
                                                    prefetch
                                                    className="inline-flex items-center justify-center gap-2"
                                                >
                                                    {row.ballot_locked
                                                        ? 'Review submission'
                                                        : 'Deploy vote'}
                                                </Link>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </MissionPanel>
                                );
                            })}
                        </div>
                    </section>
                ) : upcoming_election_summaries.length === 0 ? (
                    <MissionPanel railClass="from-violet-500/50 to-cyan-500/40">
                        <Card className="border-0 bg-transparent shadow-none">
                            <CardHeader className="pt-5">
                                <CardTitle className="text-base font-black tracking-tight">
                                    No missions on scope
                                </CardTitle>
                                <CardDescription className="text-sm leading-relaxed">
                                    No elections are open for you and nothing is
                                    queued on your ballot. Hit Vote to verify your
                                    slate anytime.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-5">
                                <Button
                                    asChild
                                    className="min-h-11 bg-linear-to-r from-blue-600 to-indigo-600 font-semibold text-white shadow-lg"
                                >
                                    <Link
                                        href={studentVotingIndex()}
                                        prefetch
                                        className="inline-flex items-center justify-center"
                                    >
                                        Open Vote page
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </MissionPanel>
                ) : (
                    <MissionPanel railClass="from-amber-500/50 to-orange-600/50">
                        <Card className="border-0 bg-transparent shadow-none">
                            <CardHeader className="pt-5">
                                <CardTitle className="text-base font-black tracking-tight">
                                    Ballot channel idle
                                </CardTitle>
                                <CardDescription className="text-sm leading-relaxed">
                                    Nothing is accepting votes right now. Your
                                    schedule is above; you can still open Vote to
                                    double-check.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-5">
                                <Button
                                    asChild
                                    variant="outline"
                                    className="min-h-11 border-white/15 bg-white/5 font-semibold hover:bg-white/10"
                                >
                                    <Link
                                        href={studentVotingIndex()}
                                        prefetch
                                        className="inline-flex items-center justify-center"
                                    >
                                        Open Vote page
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </MissionPanel>
                )}
            </div>
        </>
    );
}
