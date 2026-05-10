import { Head, Link } from '@inertiajs/react';
import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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

    return (
        <>
            <Head title="Student dashboard" />
            <div className="flex flex-col gap-6">
                <div className="space-y-2">
                    <h1 className="text-lg font-semibold tracking-tight">
                        Voting dashboard
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Upcoming voting periods show when your ballot will open.
                        Once voting is active, open elections appear below;
                        campus-wide and program lines are on the Vote page.
                    </p>
                    {student_course_label ? (
                        <p className="text-muted-foreground text-xs">
                            Your program:{' '}
                            <span className="text-foreground font-medium">
                                {student_course_label}
                            </span>
                        </p>
                    ) : null}
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="bg-muted/30 rounded-lg border px-4 py-2">
                        <span className="text-muted-foreground">Open for you</span>
                        <span className="text-foreground ml-2 font-semibold tabular-nums">
                            {election_summaries.length}
                        </span>
                    </div>
                    <div className="bg-muted/30 rounded-lg border px-4 py-2">
                        <span className="text-muted-foreground">Needs vote</span>
                        <span className="text-foreground ml-2 font-semibold tabular-nums">
                            {pendingCount}
                        </span>
                    </div>
                    <div className="bg-muted/30 rounded-lg border px-4 py-2">
                        <span className="text-muted-foreground">Submitted</span>
                        <span className="text-foreground ml-2 font-semibold tabular-nums">
                            {submittedCount}
                        </span>
                    </div>
                    <div className="bg-muted/30 rounded-lg border px-4 py-2">
                        <span className="text-muted-foreground">Upcoming</span>
                        <span className="text-foreground ml-2 font-semibold tabular-nums">
                            {upcoming_election_summaries.length}
                        </span>
                    </div>
                </div>

                {upcoming_election_summaries.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        <h2 className="text-foreground text-sm font-semibold tracking-tight">
                            Upcoming voting
                        </h2>
                        <div className="flex flex-col gap-3">
                            {upcoming_election_summaries.map((row) => (
                                <Card key={row.id}>
                                    <CardHeader className="space-y-2 pb-2">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <CardTitle className="text-base">
                                                {row.title}
                                            </CardTitle>
                                            <Badge
                                                variant="outline"
                                                className="border-sky-600/40 bg-sky-500/10 text-sky-950 shrink-0 dark:text-sky-100"
                                            >
                                                {row.election_status ===
                                                'scheduled'
                                                    ? 'Scheduled'
                                                    : 'Not started'}
                                            </Badge>
                                        </div>
                                        {row.description ? (
                                            <CardDescription>
                                                {row.description}
                                            </CardDescription>
                                        ) : null}
                                        {row.opens_at_display ? (
                                            <p className="text-muted-foreground text-xs">
                                                Voting opens{' '}
                                                <span className="text-foreground font-medium">
                                                    {row.opens_at_display}
                                                </span>
                                            </p>
                                        ) : null}
                                        {row.closes_at_display ? (
                                            <p className="text-muted-foreground text-xs">
                                                Voting closes{' '}
                                                <span className="text-foreground font-medium">
                                                    {row.closes_at_display}
                                                </span>
                                            </p>
                                        ) : null}
                                    </CardHeader>
                                    <CardContent className="text-muted-foreground flex flex-col gap-3 text-sm">
                                        <p>{row.status_detail}</p>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                asChild
                                                variant="outline"
                                                className="min-h-11 w-fit"
                                            >
                                                <Link
                                                    href={studentOfficersIndex()}
                                                    prefetch
                                                    className="inline-flex items-center justify-center"
                                                >
                                                    View nominees
                                                </Link>
                                            </Button>
                                            <Button
                                                asChild
                                                variant="secondary"
                                                className="min-h-11 w-fit"
                                            >
                                                <Link
                                                    href={studentVotingIndex()}
                                                    prefetch
                                                    className="inline-flex items-center justify-center"
                                                >
                                                    Open Vote page
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ) : null}

                {election_summaries.length > 0 ? (
                    <div className="flex flex-col gap-3">
                        {election_summaries.map((row) => (
                            <Card key={row.id}>
                                <CardHeader className="space-y-2 pb-2">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <CardTitle className="text-base">
                                            {row.title}
                                        </CardTitle>
                                        {row.ballot_locked ? (
                                            <Badge
                                                variant="outline"
                                                className="border-muted-foreground/40 bg-muted/40 text-muted-foreground shrink-0"
                                            >
                                                {row.status_label}
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className="border-amber-600/40 bg-amber-500/10 text-amber-950 dark:text-amber-100 shrink-0"
                                            >
                                                {row.status_label}
                                            </Badge>
                                        )}
                                    </div>
                                    {row.description ? (
                                        <CardDescription>
                                            {row.description}
                                        </CardDescription>
                                    ) : null}
                                    {row.opens_at_display ? (
                                        <p className="text-muted-foreground text-xs">
                                            Voting opens{' '}
                                            <span className="text-foreground font-medium">
                                                {row.opens_at_display}
                                            </span>
                                        </p>
                                    ) : null}
                                    {row.closes_at_display ? (
                                        <p className="text-muted-foreground text-xs">
                                            Voting closes{' '}
                                            <span className="text-foreground font-medium">
                                                {row.closes_at_display}
                                            </span>
                                        </p>
                                    ) : null}
                                </CardHeader>
                                <CardContent className="text-muted-foreground flex flex-col gap-3 text-sm">
                                    <p>{row.status_detail}</p>
                                    <Button asChild variant="secondary" className="min-h-11 w-fit">
                                        <Link
                                            href={studentVotingIndex()}
                                            prefetch
                                            className="inline-flex items-center justify-center"
                                        >
                                            {row.ballot_locked
                                                ? 'View submitted ballot'
                                                : 'Go to Vote'}
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : upcoming_election_summaries.length === 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                No open ballots
                            </CardTitle>
                            <CardDescription>
                                There are no elections accepting votes from you
                                right now and nothing scheduled ahead on your
                                ballot. Open the Vote page anytime to check.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="min-h-11">
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
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Voting not open yet
                            </CardTitle>
                            <CardDescription>
                                No ballot is open for casting right now. Your
                                upcoming periods are listed above; you can still
                                open the Vote page to confirm.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="outline" className="min-h-11">
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
                )}
            </div>
        </>
    );
}
