import * as StudentRegistrationApprovalController from '@/actions/App/Http/Controllers/Admin/StudentRegistrationApprovalController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { accentButtonOutline, accentButtonSolid } from '@/lib/admin-accent';
import { masterList as adminRosterMasterList } from '@/routes/admin/roster';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import { CheckCircle2, Search, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type PendingRow = {
    id: number;
    name: string;
    email: string;
    created_at: string | null;
    student_id: string | null;
    course: { code: string; name: string } | null;
    section: string | null;
    year_level: string | null;
    matches_roster: boolean;
};

type Props = {
    pendingRegistrations: PendingRow[];
};

function normalizeQuery(q: string): string {
    return q.trim().toLowerCase();
}

function pendingMatchesSearch(row: PendingRow, query: string): boolean {
    const q = normalizeQuery(query);
    if (q === '') {
        return true;
    }
    const parts = [
        row.name,
        row.email,
        row.student_id,
        row.section,
        row.year_level,
        row.created_at,
        row.course?.code,
        row.course?.name,
    ];
    const blob = parts.filter(Boolean).join(' ').toLowerCase();
    return blob.includes(q);
}

export default function AdminSchoolRosterIndex({
    pendingRegistrations,
}: Props) {
    const page = usePage<{ flash?: { success?: string | null } }>();

    const [searchQuery, setSearchQuery] = useState('');

    const filteredPending = useMemo(
        () =>
            pendingRegistrations.filter((row) =>
                pendingMatchesSearch(row, searchQuery),
            ),
        [pendingRegistrations, searchQuery],
    );

    useEffect(() => {
        const msg = page.props.flash?.success;
        if (msg) {
            toast.success(msg);
        }
    }, [page.props.flash?.success]);

    useEffect(() => {
        console.log(
            '[AdminSchoolRosterIndex] pending count',
            pendingRegistrations.length,
        );
    }, [pendingRegistrations.length]);

    const searchActive = normalizeQuery(searchQuery) !== '';

    return (
        <>
            <Head title="School roster" />

            <div className="flex flex-col gap-6">
                <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-2xl space-y-1">
                        <h1 className="text-xl font-semibold tracking-tight">
                            Pending registrations
                        </h1>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            Compare each request with the school roster (student
                            ID or email). Approve when the student belongs to
                            your school. Open{' '}
                            <span className="font-medium text-foreground">
                                Masters List
                            </span>{' '}
                            on a separate page to import or edit official roster
                            rows.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className={accentButtonOutline}
                        asChild
                    >
                        <Link href={adminRosterMasterList().url} prefetch>
                            Masters List
                        </Link>
                    </Button>
                </header>

                <div className="relative max-w-xl">
                    <Search
                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden
                    />
                    <Input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search name, email, student ID…"
                        className="pl-9"
                        aria-label="Search pending registrations"
                        autoComplete="off"
                    />
                </div>

                <section
                    id="pending"
                    className="flex scroll-mt-6 flex-col gap-4"
                    aria-labelledby="pending-registrations-heading"
                >
                    <h2
                        id="pending-registrations-heading"
                        className="text-lg font-semibold tracking-tight"
                    >
                        Pending student registrations
                        {searchActive && pendingRegistrations.length > 0 ? (
                            <span className="ml-2 text-base font-normal text-muted-foreground">
                                ({filteredPending.length} of{' '}
                                {pendingRegistrations.length})
                            </span>
                        ) : null}
                    </h2>

                    {pendingRegistrations.length === 0 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    No pending registrations
                                </CardTitle>
                                <CardDescription>
                                    New student sign-ups will appear here until
                                    you approve or decline them.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ) : filteredPending.length === 0 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    No matching registrations
                                </CardTitle>
                                <CardDescription>
                                    Try a different search term or clear the
                                    search field.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {filteredPending.map((row) => (
                                <Card key={row.id}>
                                    <CardHeader className="pb-3">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="space-y-1">
                                                <CardTitle className="text-base">
                                                    {row.name}
                                                </CardTitle>
                                                <CardDescription className="font-mono text-xs">
                                                    {row.email}
                                                </CardDescription>
                                                <p className="text-xs text-muted-foreground">
                                                    Requested{' '}
                                                    {row.created_at ?? '—'}
                                                </p>
                                            </div>
                                            <Badge
                                                variant={
                                                    row.matches_roster
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                                className={
                                                    row.matches_roster
                                                        ? 'border-emerald-600/30 bg-emerald-600/15 text-emerald-900 dark:text-emerald-100'
                                                        : ''
                                                }
                                            >
                                                {row.matches_roster ? (
                                                    <>
                                                        <CheckCircle2
                                                            className="mr-1 size-3"
                                                            aria-hidden
                                                        />
                                                        On Master List
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle
                                                            className="mr-1 size-3"
                                                            aria-hidden
                                                        />
                                                        Not on Master List
                                                    </>
                                                )}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                        <dl className="grid gap-1 text-sm sm:grid-cols-2">
                                            <div>
                                                <dt className="text-muted-foreground">
                                                    Student ID
                                                </dt>
                                                <dd className="font-medium">
                                                    {row.student_id ?? '—'}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-muted-foreground">
                                                    Program
                                                </dt>
                                                <dd className="font-medium">
                                                    {row.course
                                                        ? `${row.course.code} — ${row.course.name}`
                                                        : '—'}
                                                </dd>
                                            </div>
                                            {(row.section ||
                                                row.year_level) && (
                                                <div className="sm:col-span-2">
                                                    <dt className="text-muted-foreground">
                                                        Class
                                                    </dt>
                                                    <dd className="font-medium">
                                                        {[
                                                            row.section,
                                                            row.year_level,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' · ') || '—'}
                                                    </dd>
                                                </div>
                                            )}
                                        </dl>
                                        <div className="flex flex-wrap gap-2">
                                            <Form
                                                action={StudentRegistrationApprovalController.approve.url(
                                                    { user: row.id },
                                                )}
                                                method="post"
                                                className="inline"
                                            >
                                                <Button
                                                    type="submit"
                                                    size="sm"
                                                    className={
                                                        accentButtonSolid
                                                    }
                                                >
                                                    Approve
                                                </Button>
                                            </Form>
                                            <Form
                                                action={StudentRegistrationApprovalController.reject.url(
                                                    { user: row.id },
                                                )}
                                                method="post"
                                                className="inline"
                                            >
                                                <Button
                                                    type="submit"
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:text-destructive-foreground"
                                                >
                                                    Decline
                                                </Button>
                                            </Form>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}
