import * as StudentAccountController from '@/actions/App/Http/Controllers/Admin/StudentAccountController';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import {
    accentButtonOutline,
    accentButtonSolid,
    selectAccentFocus,
} from '@/lib/admin-accent';
import { cn } from '@/lib/utils';
import { index as adminCoursesIndex } from '@/routes/admin/courses';
import { accounts as adminStudentsAccounts } from '@/routes/admin/students';
import { template as adminStudentsImportsTemplate } from '@/routes/admin/students/imports';
import { ClipboardList, Download, Info, Upload, UserPlus } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { toast } from 'sonner';

type CourseOption = {
    id: number;
    code: string;
    name: string;
};

type Props = {
    courses: CourseOption[];
};

function FormSectionLabel({ children }: { children: ReactNode }) {
    return (
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {children}
        </p>
    );
}

export default function AdminStudentsIndex({ courses }: Props) {
    const page = usePage<{
        flash?: {
            success?: string | null;
            import_warnings?: string[] | null;
        };
        errors?: Record<string, string>;
    }>();

    const importExcelInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        console.log('[AdminStudentsIndex] courses available', courses.length);
    }, [courses.length]);

    useEffect(() => {
        const msg = page.props.flash?.success;
        if (msg) {
            toast.success(msg);
        }
    }, [page.props.flash?.success]);

    useEffect(() => {
        const warnings = page.props.flash?.import_warnings;
        if (warnings?.length) {
            console.log(
                '[AdminStudentsIndex] import warnings',
                warnings.length,
            );
            toast.warning(warnings.slice(0, 12).join('\n'));
        }
    }, [page.props.flash?.import_warnings]);

    useEffect(() => {
        const excelErr = page.props.errors?.excel;
        if (excelErr) {
            toast.error(excelErr);
        }
    }, [page.props.errors?.excel]);

    useEffect(() => {
        const mailErr = page.props.errors?.mail;
        if (mailErr) {
            toast.error(mailErr);
        }
    }, [page.props.errors?.mail]);

    const hasPrograms = courses.length > 0;

    return (
        <>
            <Head title="Students" />

            <div className="flex flex-col gap-6">
                {page.props.errors?.mail && (
                    <Alert variant="destructive">
                        <AlertTitle>Mail could not be sent</AlertTitle>
                        <AlertDescription>
                            {page.props.errors.mail}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Page header */}
                <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-2xl space-y-1">
                        <h1 className="text-xl font-semibold tracking-tight">
                            Students
                        </h1>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Create accounts here (password emailed) or review
                            students who signed up on the registration page under
                            Pending sign-ups. Active students are grouped under
                            View by program.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className={cn(accentButtonOutline, 'shrink-0 gap-2')}
                        asChild
                    >
                        <Link
                            href={adminStudentsAccounts().url}
                            prefetch
                            onClick={() =>
                                console.log(
                                    '[AdminStudentsIndex] navigate to accounts by program',
                                )
                            }
                        >
                            <ClipboardList className="size-4" aria-hidden />
                            View Students
                        </Link>
                    </Button>
                </header>

                {!hasPrograms && (
                    <Alert variant="destructive">
                        <AlertTitle>Add a program first</AlertTitle>
                        <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <span>
                                Create at least one program before assigning
                                students.
                            </span>
                            <Link
                                href={adminCoursesIndex().url}
                                className="text-destructive shrink-0 font-medium underline underline-offset-4"
                                prefetch
                            >
                                Open Programs
                            </Link>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
                    {/* Main: registration form */}
                    <div className="lg:col-span-2">
                        <Card className="overflow-hidden">
                            <CardHeader className="border-b bg-muted/30">
                                <div className="flex items-start gap-3">
                                    <div className="bg-background rounded-lg border p-2 shadow-xs">
                                        <UserPlus
                                            className="size-5 text-[#006989]"
                                            aria-hidden
                                        />
                                    </div>
                                    <div className="min-w-0 space-y-1">
                                        <CardTitle className="text-base">
                                            Register student account
                                        </CardTitle>
                                        <CardDescription>
                                            One student per submission. They
                                            receive login instructions by email.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <Form
                                    action={StudentAccountController.store.url()}
                                    method="post"
                                    resetOnSuccess={[
                                        'name',
                                        'email',
                                        'student_id',
                                        'course_id',
                                        'section',
                                        'year_level',
                                    ]}
                                    className="flex flex-col gap-8"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <div className="space-y-4">
                                                <FormSectionLabel>
                                                    Account
                                                </FormSectionLabel>
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="name">
                                                            Full name
                                                        </Label>
                                                        <Input
                                                            id="name"
                                                            name="name"
                                                            required
                                                            autoComplete="name"
                                                            aria-invalid={Boolean(
                                                                errors.name,
                                                            )}
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.name
                                                            }
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="email">
                                                            School email
                                                        </Label>
                                                        <Input
                                                            id="email"
                                                            name="email"
                                                            type="email"
                                                            required
                                                            autoComplete="email"
                                                            aria-invalid={Boolean(
                                                                errors.email,
                                                            )}
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.email
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t pt-6 space-y-4">
                                                <FormSectionLabel>
                                                    Enrollment
                                                </FormSectionLabel>
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="student_id">
                                                            Student ID
                                                        </Label>
                                                        <Input
                                                            id="student_id"
                                                            name="student_id"
                                                            required
                                                            autoComplete="off"
                                                            aria-invalid={Boolean(
                                                                errors.student_id,
                                                            )}
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.student_id
                                                            }
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="course_id">
                                                            Program
                                                        </Label>
                                                        <select
                                                            id="course_id"
                                                            name="course_id"
                                                            required
                                                            disabled={
                                                                !hasPrograms
                                                            }
                                                            defaultValue=""
                                                            className={
                                                                selectAccentFocus
                                                            }
                                                            aria-invalid={Boolean(
                                                                errors.course_id,
                                                            )}
                                                        >
                                                            <option
                                                                value=""
                                                                disabled
                                                            >
                                                                Select program
                                                            </option>
                                                            {courses.map(
                                                                (c) => (
                                                                    <option
                                                                        key={
                                                                            c.id
                                                                        }
                                                                        value={
                                                                            c.id
                                                                        }
                                                                    >
                                                                        {
                                                                            c.code
                                                                        }{' '}
                                                                        —{' '}
                                                                        {
                                                                            c.name
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                        <InputError
                                                            message={
                                                                errors.course_id
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t pt-6 space-y-4">
                                                <FormSectionLabel>
                                                    Class details{' '}
                                                    <span className="text-muted-foreground font-normal normal-case">
                                                        (optional)
                                                    </span>
                                                </FormSectionLabel>
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="section">
                                                            Section
                                                        </Label>
                                                        <Input
                                                            id="section"
                                                            name="section"
                                                            autoComplete="off"
                                                            placeholder="e.g. A"
                                                            aria-invalid={Boolean(
                                                                errors.section,
                                                            )}
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.section
                                                            }
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="year_level">
                                                            Year level
                                                        </Label>
                                                        <Input
                                                            id="year_level"
                                                            name="year_level"
                                                            autoComplete="off"
                                                            placeholder="e.g. 4"
                                                            aria-invalid={Boolean(
                                                                errors.year_level,
                                                            )}
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.year_level
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-end border-t pt-6">
                                                <Button
                                                    type="submit"
                                                    variant="default"
                                                    className={accentButtonSolid}
                                                    disabled={
                                                        processing ||
                                                        !hasPrograms
                                                    }
                                                >
                                                    Create account
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </Form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar: help + imports */}
                    <aside className="flex flex-col gap-4 lg:col-span-1">
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <Info
                                        className="size-4 shrink-0 text-[#006989]"
                                        aria-hidden
                                    />
                                    <CardTitle className="text-base">
                                        How profiles work
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="text-muted-foreground text-sm leading-relaxed">
                                Student IDs must be unique in this database.
                                Program assignment drives eligibility for
                                department-only races.
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <Upload
                                        className="size-4 shrink-0 text-[#006989]"
                                        aria-hidden
                                    />
                                    <CardTitle className="text-base">
                                        Bulk imports
                                    </CardTitle>
                                </div>
                                <CardDescription>
                                    Create many accounts from an Excel workbook
                                    (.xlsx) in one batch.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                <Button
                                    variant="outline"
                                    className={cn(
                                        accentButtonOutline,
                                        'w-full gap-2',
                                    )}
                                    asChild
                                >
                                    <a
                                        href={adminStudentsImportsTemplate().url}
                                    >
                                        <Download
                                            className="size-4 shrink-0"
                                            aria-hidden
                                        />
                                        Download Excel template
                                    </a>
                                </Button>
                                <input
                                    ref={importExcelInputRef}
                                    id="admin-student-excel-import"
                                    type="file"
                                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                    className="sr-only"
                                    onChange={(event) => {
                                        const file =
                                            event.target.files?.[0] ?? null;
                                        event.target.value = '';
                                        if (!file) {
                                            return;
                                        }
                                        console.log(
                                            '[AdminStudentsIndex] Excel selected',
                                            file.name,
                                        );
                                        router.post(
                                            StudentAccountController.importStudents.url(),
                                            { excel: file },
                                            {
                                                forceFormData: true,
                                                preserveScroll: true,
                                            },
                                        );
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                        accentButtonOutline,
                                        'w-full gap-2',
                                    )}
                                    onClick={() => {
                                        console.log(
                                            '[AdminStudentsIndex] open Excel import picker',
                                        );
                                        importExcelInputRef.current?.click();
                                    }}
                                >
                                    <Upload
                                        className="size-4 shrink-0"
                                        aria-hidden
                                    />
                                    Import Students
                                </Button>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </>
    );
}
