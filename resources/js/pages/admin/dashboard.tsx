import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import {
    BookOpen,
    CalendarDays,
    ClipboardList,
    ListOrdered,
    Users,
    UsersRound,
} from 'lucide-react';
import { Head } from '@inertiajs/react';

type ElectionStatusKey = 'draft' | 'scheduled' | 'open' | 'closed';

type RecentElection = {
    id: number;
    title: string;
    status: ElectionStatusKey;
    opens_at_display: string | null;
    closes_at_display: string | null;
};

type Stats = {
    elections: {
        total: number;
        byStatus: Record<ElectionStatusKey, number>;
    };
    students: {
        accounts: number;
        withProfile: number;
    };
    votesCast: number;
    courses: number;
    candidates: number;
    positions: number;
};

type Props = {
    stats: Stats;
    recentElections: RecentElection[];
};

const STATUS_LABEL: Record<ElectionStatusKey, string> = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    open: 'Open',
    closed: 'Closed',
};

function statusBadgeVariant(
    status: ElectionStatusKey,
): 'default' | 'secondary' | 'outline' {
    switch (status) {
        case 'open':
            return 'default';
        case 'draft':
            return 'outline';
        case 'scheduled':
            return 'secondary';
        case 'closed':
            return 'secondary';
        default:
            return 'outline';
    }
}

function StatCard({
    title,
    value,
    description,
    icon: Icon,
}: {
    title: string;
    value: number | string;
    description?: string;
    icon: LucideIcon;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="size-4 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-semibold tabular-nums">
                    {value}
                </div>
                {description ? (
                    <p className="text-xs text-muted-foreground">{description}</p>
                ) : null}
            </CardContent>
        </Card>
    );
}

export default function AdminDashboard({ stats, recentElections }: Props) {
    const studentHint =
        stats.students.accounts !== stats.students.withProfile
            ? `${stats.students.withProfile} with student profile`
            : undefined;

    return (
        <>
            <Head title="Admin dashboard" />

            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight">
                        Administration
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Overview of elections, voters, and academic setup for
                        this school database.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Elections"
                        value={stats.elections.total}
                        description="All statuses"
                        icon={CalendarDays}
                    />
                    <StatCard
                        title="Student accounts"
                        value={stats.students.accounts}
                        description={studentHint}
                        icon={Users}
                    />
                    <StatCard
                        title="Votes cast"
                        value={stats.votesCast}
                        description="Ballots recorded"
                        icon={ClipboardList}
                    />
                    <StatCard
                        title="Programs (courses)"
                        value={stats.courses}
                        description="Academic programs"
                        icon={BookOpen}
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <StatCard
                        title="Candidates"
                        value={stats.candidates}
                        icon={UsersRound}
                    />
                    <StatCard
                        title="Positions"
                        value={stats.positions}
                        icon={ListOrdered}
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Elections by status</CardTitle>
                        <CardDescription>
                            Counts for draft, scheduled, open, and closed
                            elections.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {(
                                Object.entries(
                                    stats.elections.byStatus,
                                ) as [ElectionStatusKey, number][]
                            ).map(([status, count]) => (
                                <Badge
                                    key={status}
                                    variant={statusBadgeVariant(status)}
                                    className="gap-1.5 px-3 py-1"
                                >
                                    <span>{STATUS_LABEL[status]}</span>
                                    <span className="tabular-nums font-semibold">
                                        {count}
                                    </span>
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-5">
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Recently updated elections</CardTitle>
                            <CardDescription>
                                Latest changes to election records (max five).
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentElections.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No elections yet. Create an election when
                                    management screens are available.
                                </p>
                            ) : (
                                <ul className="divide-y divide-border rounded-lg border">
                                    {recentElections.map((election) => (
                                        <li
                                            key={election.id}
                                            className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between"
                                        >
                                            <div className="space-y-1">
                                                <p className="font-medium leading-tight">
                                                    {election.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Opens{' '}
                                                    {election.opens_at_display ??
                                                        '—'}{' '}
                                                    · Closes{' '}
                                                    {election.closes_at_display ??
                                                        '—'}
                                                </p>
                                            </div>
                                            <Badge
                                                variant={statusBadgeVariant(
                                                    election.status,
                                                )}
                                                className="shrink-0 self-start sm:self-center"
                                            >
                                                {
                                                    STATUS_LABEL[
                                                        election.status
                                                    ]
                                                }
                                            </Badge>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Setup checklist</CardTitle>
                            <CardDescription>
                                Typical order for going live with voting.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                                <li>Add academic programs (courses).</li>
                                <li>
                                    Create student accounts and link{' '}
                                    <span className="text-foreground">
                                        student profiles
                                    </span>{' '}
                                    (program, section).
                                </li>
                                <li>
                                    Configure elections, positions, parties, and
                                    candidates.
                                </li>
                                <li>Open voting in the scheduled window.</li>
                            </ol>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
