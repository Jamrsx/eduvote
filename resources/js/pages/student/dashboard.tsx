import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Head, Link } from '@inertiajs/react';
import { index as studentVotingIndex } from '@/routes/student/voting';
import { useEffect } from 'react';

type ElectionSummary = {
    id: number;
    title: string;
    description: string | null;
    closes_at_display: string | null;
    ballot_locked: boolean;
    status_label: string;
    status_detail: string;
};

type Props = {
    election_summaries: ElectionSummary[];
    student_course_label: string | null;
};

export default function StudentDashboard({
    election_summaries,
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
        );
    }, [election_summaries]);

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
                        Open elections you can vote in show here. Campus-wide
                        ballot lines plus your program slate appear on the Vote
                        page while voting is active.
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
                </div>

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
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                No open ballots
                            </CardTitle>
                            <CardDescription>
                                There are no elections accepting votes from you
                                right now. Check back during the voting period or
                                open the Vote page anytime.
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
                )}
            </div>
        </>
    );
}
