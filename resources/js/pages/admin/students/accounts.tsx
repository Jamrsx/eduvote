import * as StudentAccountController from '@/actions/App/Http/Controllers/Admin/StudentAccountController';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import { index as adminStudentsIndex } from '@/routes/admin/students';
import { ChevronDown, Layers, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { accentButtonOutline, accentButtonSolid } from '@/lib/admin-accent';
import { cn } from '@/lib/utils';

type CourseSummary = {
    id: number;
    code: string;
    name: string;
};

type StudentAccountRow = {
    id: number;
    name: string;
    email: string;
    student_id: string | null;
    section: string | null;
    year_level: string | null;
    registered_at: string | null;
};

type CourseGroup = {
    course: CourseSummary;
    students: StudentAccountRow[];
    count: number;
};

type Props = {
    courseGroups: CourseGroup[];
    unassignedStudents: StudentAccountRow[];
    disabledStudents: StudentAccountRow[];
    totalStudents: number;
};

function SendAccountButton({ userId }: { userId: number }) {
    return (
        <Form
            action={StudentAccountController.emailStudentCredentials.url(
                userId,
            )}
            method="post"
            options={{ preserveScroll: true }}
            onSuccess={() =>
                console.log('[AdminStudentAccounts] send account', userId)
            }
            className="inline"
        >
            {({ processing }) => (
                <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className={cn(
                        accentButtonOutline,
                        'h-7 px-2 text-xs whitespace-nowrap',
                    )}
                    disabled={processing}
                >
                    {processing ? 'Sending…' : 'Send account'}
                </Button>
            )}
        </Form>
    );
}

function DisableAccountButton({
    userId,
    studentName,
}: {
    userId: number;
    studentName: string;
}) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 border-destructive/40 px-2 text-xs whitespace-nowrap text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:text-destructive-foreground"
                onClick={() => {
                    console.log(
                        '[AdminStudentAccounts] disable dialog open',
                        userId,
                    );
                    setOpen(true);
                }}
            >
                Disable account
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Disable this student account?</DialogTitle>
                        <DialogDescription className="space-y-2 pt-1">
                            <span className="block">
                                <span className="font-medium text-foreground">
                                    {studentName}
                                </span>{' '}
                                will not be able to use student features until
                                an administrator enables the account again.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <Form
                        action={StudentAccountController.disableStudentAccount.url(
                            {
                                user: userId,
                            },
                        )}
                        method="post"
                        options={{ preserveScroll: true }}
                        onSuccess={() => {
                            console.log(
                                '[AdminStudentAccounts] disabled user',
                                userId,
                            );
                            setOpen(false);
                        }}
                    >
                        {({ processing }) => (
                            <DialogFooter className="gap-2 sm:justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className={accentButtonOutline}
                                    onClick={() => setOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={processing}
                                >
                                    {processing
                                        ? 'Disabling…'
                                        : 'Disable account'}
                                </Button>
                            </DialogFooter>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}

function EnableAccountButton({ userId }: { userId: number }) {
    return (
        <Form
            action={StudentAccountController.enableStudentAccount.url({
                user: userId,
            })}
            method="post"
            options={{ preserveScroll: true }}
            onSuccess={() =>
                console.log('[AdminStudentAccounts] enabled user', userId)
            }
            className="inline"
        >
            {({ processing }) => (
                <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className={cn(
                        accentButtonOutline,
                        'h-7 px-2 text-xs whitespace-nowrap',
                    )}
                    disabled={processing}
                >
                    {processing ? 'Enabling…' : 'Enable account'}
                </Button>
            )}
        </Form>
    );
}

function ActiveStudentActions({ row }: { row: StudentAccountRow }) {
    return (
        <div className="flex flex-wrap justify-end gap-1">
            <SendAccountButton userId={row.id} />
            <DisableAccountButton userId={row.id} studentName={row.name} />
        </div>
    );
}

export default function AdminStudentAccounts({
    courseGroups,
    unassignedStudents,
    disabledStudents,
    totalStudents,
}: Props) {
    const [openIds, setOpenIds] = useState<Record<number, boolean>>({});
    const [emailAllOpen, setEmailAllOpen] = useState(false);

    const page = usePage<{
        flash?: { success?: string | null };
        errors?: { mail?: string };
    }>();

    useEffect(() => {
        console.log(
            '[AdminStudentAccounts] loaded',
            totalStudents,
            'students,',
            courseGroups.length,
            'programs',
        );
    }, [totalStudents, courseGroups.length]);

    useEffect(() => {
        const msg = page.props.flash?.success;
        if (msg) {
            toast.success(msg);
        }
    }, [page.props.flash?.success]);

    useEffect(() => {
        const mailErr = page.props.errors?.mail;
        if (mailErr) {
            toast.error(mailErr);
        }
    }, [page.props.errors?.mail]);

    function coursePanelOpen(courseId: number): boolean {
        return openIds[courseId] ?? true;
    }

    function setCoursePanelOpen(courseId: number, open: boolean): void {
        setOpenIds((prev) => ({ ...prev, [courseId]: open }));
    }

    return (
        <>
            <Head title="Student accounts · By program" />

            <div className="flex flex-col gap-3 md:gap-4">
                {page.props.errors?.mail && (
                    <Alert variant="destructive">
                        <AlertTitle>Mail could not be sent</AlertTitle>
                        <AlertDescription>
                            {page.props.errors.mail}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-base font-semibold tracking-tight">
                            Student accounts
                        </h1>
                        <p className="text-xs leading-snug text-muted-foreground">
                            Grouped by program. {totalStudents} active student
                            account{totalStudents === 1 ? '' : 's'}.
                            {disabledStudents.length > 0 ? (
                                <> {disabledStudents.length} disabled.</>
                            ) : null}
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row sm:items-center">
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className={cn(accentButtonOutline, 'h-8 text-xs')}
                        >
                            <Link href={adminStudentsIndex().url} prefetch>
                                Back to registration
                            </Link>
                        </Button>
                        <Button
                            type="button"
                            variant="default"
                            size="sm"
                            className={cn(
                                accentButtonSolid,
                                'h-8 gap-1.5 text-xs',
                            )}
                            disabled={totalStudents === 0}
                            onClick={() => {
                                console.log(
                                    '[AdminStudentAccounts] email all credentials',
                                );
                                setEmailAllOpen(true);
                            }}
                        >
                            <Mail className="size-3.5 shrink-0" aria-hidden />
                            Email accounts to all
                        </Button>
                    </div>
                </div>

                <Dialog open={emailAllOpen} onOpenChange={setEmailAllOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                Email login credentials to every student?
                            </DialogTitle>
                            <DialogDescription className="space-y-2 pt-1">
                                <span className="block">
                                    This generates a new password for each
                                    student and sends their email address, the
                                    new password, and the sign-in link to that
                                    student&apos;s inbox.
                                </span>
                                <span className="block font-medium text-destructive">
                                    Existing passwords stop working immediately.
                                </span>
                            </DialogDescription>
                        </DialogHeader>
                        <Form
                            action={StudentAccountController.emailCredentialsToAll.url()}
                            method="post"
                            options={{ preserveScroll: true }}
                            onSuccess={() => {
                                console.log(
                                    '[AdminStudentAccounts] credential emails finished',
                                );
                                setEmailAllOpen(false);
                            }}
                        >
                            {({ processing }) => (
                                <DialogFooter className="gap-2 sm:justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={accentButtonOutline}
                                        onClick={() => setEmailAllOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="default"
                                        className={accentButtonSolid}
                                        disabled={processing}
                                    >
                                        {processing
                                            ? 'Sending…'
                                            : 'Send emails'}
                                    </Button>
                                </DialogFooter>
                            )}
                        </Form>
                    </DialogContent>
                </Dialog>

                <div className="flex flex-col gap-2">
                    {courseGroups.map(({ course, students, count }) => (
                        <Collapsible
                            key={course.id}
                            open={coursePanelOpen(course.id)}
                            onOpenChange={(open) =>
                                setCoursePanelOpen(course.id, open)
                            }
                        >
                            <Card className="gap-0 overflow-hidden py-0">
                                <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted/40 [&[data-state=open]]:border-b">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <Layers
                                            className="size-4 shrink-0 text-muted-foreground"
                                            aria-hidden
                                        />
                                        <div className="min-w-0 leading-tight">
                                            <p className="text-sm leading-tight font-medium">
                                                <span className="font-mono text-xs">
                                                    {course.code}
                                                </span>{' '}
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>{' '}
                                                <span>{course.name}</span>
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                {count} student
                                                {count === 1 ? '' : 's'}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronDown
                                        className={cn(
                                            'size-4 shrink-0 text-muted-foreground transition-transform',
                                            coursePanelOpen(course.id) &&
                                                'rotate-180',
                                        )}
                                        aria-hidden
                                    />
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <CardContent className="px-3 pt-0 pb-2">
                                        {students.length === 0 ? (
                                            <p className="pb-2 text-xs text-muted-foreground">
                                                No students in this program yet.
                                            </p>
                                        ) : (
                                            <div className="overflow-x-auto rounded border">
                                                <table className="w-full min-w-[640px] text-xs">
                                                    <thead>
                                                        <tr className="border-b bg-muted/50 text-left">
                                                            <th className="px-2 py-1 font-medium">
                                                                Name
                                                            </th>
                                                            <th className="px-2 py-1 font-medium">
                                                                Email
                                                            </th>
                                                            <th className="px-2 py-1 font-medium">
                                                                Student ID
                                                            </th>
                                                            <th className="px-2 py-1 font-medium">
                                                                Section
                                                            </th>
                                                            <th className="px-2 py-1 font-medium">
                                                                Year
                                                            </th>
                                                            <th className="px-2 py-1 font-medium">
                                                                Registered
                                                            </th>
                                                            <th className="w-[1%] px-2 py-1 text-right font-medium whitespace-nowrap text-muted-foreground">
                                                                Actions
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {students.map((row) => (
                                                            <tr
                                                                key={row.id}
                                                                className="border-b leading-tight last:border-0"
                                                            >
                                                                <td className="max-w-[10rem] truncate px-2 py-1 align-middle">
                                                                    {row.name}
                                                                </td>
                                                                <td className="max-w-[12rem] truncate px-2 py-1 align-middle">
                                                                    {row.email}
                                                                </td>
                                                                <td className="px-2 py-1 align-middle font-mono text-[11px]">
                                                                    {row.student_id ??
                                                                        '—'}
                                                                </td>
                                                                <td className="px-2 py-1 align-middle text-muted-foreground">
                                                                    {row.section ??
                                                                        '—'}
                                                                </td>
                                                                <td className="px-2 py-1 align-middle text-muted-foreground">
                                                                    {row.year_level ??
                                                                        '—'}
                                                                </td>
                                                                <td className="px-2 py-1 align-middle whitespace-nowrap text-muted-foreground">
                                                                    {row.registered_at ??
                                                                        '—'}
                                                                </td>
                                                                <td className="px-2 py-1 text-right align-middle">
                                                                    <ActiveStudentActions
                                                                        row={
                                                                            row
                                                                        }
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </CardContent>
                                </CollapsibleContent>
                            </Card>
                        </Collapsible>
                    ))}
                </div>

                {disabledStudents.length > 0 && (
                    <Card className="gap-0 border-destructive/30 py-0">
                        <CardHeader className="space-y-0.5 px-3 py-2">
                            <CardTitle className="text-sm">
                                Disabled accounts ({disabledStudents.length})
                            </CardTitle>
                            <CardDescription className="text-[11px] leading-snug">
                                These students cannot sign in to student
                                features. Enable an account to restore access.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-3 pt-0 pb-3">
                            <div className="overflow-x-auto rounded border">
                                <table className="w-full min-w-[560px] text-xs">
                                    <thead>
                                        <tr className="border-b bg-muted/50 text-left">
                                            <th className="px-2 py-1 font-medium">
                                                Name
                                            </th>
                                            <th className="px-2 py-1 font-medium">
                                                Email
                                            </th>
                                            <th className="px-2 py-1 font-medium">
                                                Student ID
                                            </th>
                                            <th className="px-2 py-1 font-medium">
                                                Registered
                                            </th>
                                            <th className="w-[1%] px-2 py-1 text-right font-medium whitespace-nowrap text-muted-foreground">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {disabledStudents.map((row) => (
                                            <tr
                                                key={row.id}
                                                className="border-b leading-tight last:border-0"
                                            >
                                                <td className="max-w-[10rem] truncate px-2 py-1 align-middle">
                                                    {row.name}
                                                </td>
                                                <td className="max-w-[12rem] truncate px-2 py-1 align-middle">
                                                    {row.email}
                                                </td>
                                                <td className="px-2 py-1 align-middle font-mono text-[11px]">
                                                    {row.student_id ?? '—'}
                                                </td>
                                                <td className="px-2 py-1 align-middle whitespace-nowrap text-muted-foreground">
                                                    {row.registered_at ?? '—'}
                                                </td>
                                                <td className="px-2 py-1 text-right align-middle">
                                                    <EnableAccountButton
                                                        userId={row.id}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {unassignedStudents.length > 0 && (
                    <Card className="gap-0 border-amber-500/40 py-0">
                        <CardHeader className="space-y-0.5 px-3 py-2">
                            <CardTitle className="text-sm">
                                No program assigned
                            </CardTitle>
                            <CardDescription className="text-[11px] leading-snug">
                                These accounts are missing a profile or program.
                                Assign them from registration or fix import
                                data.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-3 pt-0 pb-3">
                            <div className="overflow-x-auto rounded border">
                                <table className="w-full min-w-[580px] text-xs">
                                    <thead>
                                        <tr className="border-b bg-muted/50 text-left">
                                            <th className="px-2 py-1 font-medium">
                                                Name
                                            </th>
                                            <th className="px-2 py-1 font-medium">
                                                Email
                                            </th>
                                            <th className="px-2 py-1 font-medium">
                                                Student ID
                                            </th>
                                            <th className="px-2 py-1 font-medium">
                                                Registered
                                            </th>
                                            <th className="w-[1%] px-2 py-1 text-right font-medium whitespace-nowrap text-muted-foreground">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {unassignedStudents.map((row) => (
                                            <tr
                                                key={row.id}
                                                className="border-b leading-tight last:border-0"
                                            >
                                                <td className="max-w-[10rem] truncate px-2 py-1 align-middle">
                                                    {row.name}
                                                </td>
                                                <td className="max-w-[12rem] truncate px-2 py-1 align-middle">
                                                    {row.email}
                                                </td>
                                                <td className="px-2 py-1 align-middle font-mono text-[11px]">
                                                    {row.student_id ?? '—'}
                                                </td>
                                                <td className="px-2 py-1 align-middle whitespace-nowrap text-muted-foreground">
                                                    {row.registered_at ?? '—'}
                                                </td>
                                                <td className="px-2 py-1 text-right align-middle">
                                                    <ActiveStudentActions
                                                        row={row}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
