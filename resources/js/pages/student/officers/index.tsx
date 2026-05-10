import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Head, Link } from '@inertiajs/react';
import { index as studentVotingIndex } from '@/routes/student/voting';
import { UsersRound } from 'lucide-react';
import { useEffect } from 'react';

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
            <span className="text-muted-foreground border-border/60 bg-muted/40 rounded-md border px-2.5 py-1 text-[10px] font-bold tracking-widest tabular-nums">
                VS
            </span>
        </div>
    );
}

function OfficerNomineeCard({ nominee }: { nominee: DirectoryNominee }) {
    return (
        <div className="bg-card border-border/70 flex h-full min-h-0 flex-col rounded-md border p-3 shadow-xs sm:p-4">
            <div className="flex min-h-0 flex-1 items-start gap-3 sm:gap-4">
                <div className="border-border/70 bg-muted/40 flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border sm:h-28 sm:w-24">
                    {nominee.photo_url ? (
                        <img
                            src={nominee.photo_url}
                            alt={nominee.full_name}
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
                <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-foreground text-sm font-semibold leading-tight sm:text-[15px]">
                        {nominee.full_name}
                    </p>
                    <p className="text-xs leading-relaxed">
                        <span className="text-muted-foreground font-semibold">
                            Partylist:
                        </span>{' '}
                        <span className="text-foreground font-medium">
                            {nominee.party_name}
                        </span>
                        {nominee.party_short_name ? (
                            <span className="text-muted-foreground font-normal">
                                {` (${nominee.party_short_name})`}
                            </span>
                        ) : null}
                    </p>
                    <div className="pt-0.5">
                        <span className="text-muted-foreground text-[11px] font-semibold">
                            Platform:
                        </span>
                        <p className="text-foreground/90 mt-0.5 whitespace-pre-wrap break-words text-xs leading-relaxed sm:text-sm">
                            {nominee.platform?.trim() ??
                                'No platform submitted.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function StudentOfficersIndex({
    elections,
    student_course_label,
    voter_scope_notice,
}: Props) {
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

            <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
                <div className="space-y-1.5">
                    <h1 className="text-base font-semibold tracking-tight">
                        Nominees & platforms
                    </h1>
                    <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
                        Listed here are nominees for{' '}
                        <span className="text-foreground font-medium">
                            campus-wide seats
                        </span>{' '}
                        and for{' '}
                        <span className="text-foreground font-medium">
                            your program
                        </span>
                        {' — '}
                        the same slate you see when you vote.
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

                <p className="text-muted-foreground text-xs leading-snug">
                    Informational only.{' '}
                    <Link
                        href={studentVotingIndex()}
                        prefetch
                        className="text-primary underline-offset-4 hover:underline"
                    >
                        Cast your ballot on the Vote page
                    </Link>
                    .
                </p>

                {voter_scope_notice ? (
                    <Alert>
                        <AlertTitle>Program slate</AlertTitle>
                        <AlertDescription>
                            {voter_scope_notice}
                        </AlertDescription>
                    </Alert>
                ) : null}

                {elections.length === 0 ? (
                    <Card>
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
                                Nominees appear while an election is open and
                                accepting votes and you have ballot lines on
                                your account.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-4">
                        {elections.map((election) => (
                            <Card
                                key={election.id}
                                className="border-border/70"
                            >
                                <CardHeader className="space-y-1 pb-3">
                                    <CardTitle className="text-base font-semibold tracking-tight">
                                        {election.title}
                                    </CardTitle>
                                    {election.description ? (
                                        <CardDescription className="text-xs">
                                            {election.description}
                                        </CardDescription>
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
                                    {election.offices.map((office) => (
                                        <section
                                            key={office.position_id}
                                            aria-labelledby={`office-${office.position_id}`}
                                            className="space-y-3"
                                        >
                                            <div
                                                id={`office-${office.position_id}`}
                                                className="border-border/60 border-b pb-2"
                                            >
                                                <h2 className="text-foreground text-sm font-semibold tracking-tight">
                                                    {office.name}
                                                </h2>
                                            </div>

                                            <ul className="flex flex-col gap-4">
                                                {chunkPairs(office.nominees).map(
                                                    (pair, pairIdx) => (
                                                        <li
                                                            key={`${office.position_id}-pair-${pairIdx}`}
                                                            className="list-none"
                                                        >
                                                            {pair.length === 1 ? (
                                                                <OfficerNomineeCard
                                                                    nominee={
                                                                        pair[0]!
                                                                    }
                                                                />
                                                            ) : (
                                                                <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-3">
                                                                    <OfficerNomineeCard
                                                                        nominee={
                                                                            pair[0]!
                                                                        }
                                                                    />
                                                                    <VersusDivider />
                                                                    <OfficerNomineeCard
                                                                        nominee={
                                                                            pair[1]!
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
