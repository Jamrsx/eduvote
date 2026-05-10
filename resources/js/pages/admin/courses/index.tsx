import * as CourseController from '@/actions/App/Http/Controllers/Admin/CourseController';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, Head, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type CourseRow = {
    id: number;
    code: string;
    name: string;
    sort_order: number;
    student_profiles_count: number;
};

type Props = {
    courses: CourseRow[];
};

export default function AdminCoursesIndex({ courses }: Props) {
    const page = usePage<{
        flash?: { success?: string | null };
        errors?: Record<string, string>;
    }>();
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<CourseRow | null>(null);
    const [deleting, setDeleting] = useState<CourseRow | null>(null);

    useEffect(() => {
        const msg = page.props.flash?.success;
        if (msg) {
            toast.success(msg);
        }
    }, [page.props.flash?.success]);

    function openCreate(): void {
        setEditing(null);
        setFormOpen(true);
    }

    function openEdit(course: CourseRow): void {
        setEditing(course);
        setFormOpen(true);
    }

    function handleFormSuccess(): void {
        setFormOpen(false);
        setEditing(null);
    }

    return (
        <>
            <Head title="Programs" />

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight">
                            Programs
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Define programs once; reuse them for student
                            profiles, department races, and candidate
                            affiliation.
                        </p>
                    </div>
                    <Button type="button" onClick={openCreate}>
                        <Plus className="mr-2 size-4" aria-hidden />
                        Add program
                    </Button>
                </div>

                {page.props.errors?.course ? (
                    <Alert variant="destructive">
                        <AlertTitle>Cannot delete</AlertTitle>
                        <AlertDescription>
                            {page.props.errors.course}
                        </AlertDescription>
                    </Alert>
                ) : null}

                <Card>
                    <CardHeader>
                        <CardTitle>Programs in this database</CardTitle>
                        <CardDescription>
                            Codes must be unique. Lower{' '}
                            <span className="text-foreground">sort order</span>{' '}
                            appears first in lists.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 sm:px-6">
                        {courses.length === 0 ? (
                            <p className="px-6 text-sm text-muted-foreground sm:px-0">
                                No programs yet. Click &quot;Add program&quot;
                                to create the first one.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[520px] text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="pr-4 pb-3 font-medium">
                                                Code
                                            </th>
                                            <th className="pr-4 pb-3 font-medium">
                                                Name
                                            </th>
                                            <th className="pr-4 pb-3 font-medium">
                                                Sort
                                            </th>
                                            <th className="pr-4 pb-3 font-medium">
                                                Students
                                            </th>
                                            <th className="pb-3 text-right font-medium">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {courses.map((course) => (
                                            <tr
                                                key={course.id}
                                                className="border-b border-border/80 last:border-0"
                                            >
                                                <td className="py-3 pr-4 font-mono text-xs">
                                                    {course.code}
                                                </td>
                                                <td className="py-3 pr-4">
                                                    {course.name}
                                                </td>
                                                <td className="py-3 pr-4 tabular-nums">
                                                    {course.sort_order}
                                                </td>
                                                <td className="py-3 pr-4 tabular-nums">
                                                    {
                                                        course.student_profiles_count
                                                    }
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                openEdit(course)
                                                            }
                                                        >
                                                            <Pencil className="size-4" />
                                                            <span className="sr-only">
                                                                Edit
                                                            </span>
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:text-destructive-foreground"
                                                            disabled={
                                                                course.student_profiles_count >
                                                                0
                                                            }
                                                            title={
                                                                course.student_profiles_count >
                                                                0
                                                                    ? 'Remove enrolled students before deleting'
                                                                    : undefined
                                                            }
                                                            onClick={() =>
                                                                setDeleting(
                                                                    course,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="size-4" />
                                                            <span className="sr-only">
                                                                Delete
                                                            </span>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Edit program' : 'Add program'}
                        </DialogTitle>
                        <DialogDescription>
                            This code and name appear when assigning candidates
                            and student profiles.
                        </DialogDescription>
                    </DialogHeader>

                    <Form
                        key={editing ? `edit-${editing.id}` : 'create'}
                        action={
                            editing
                                ? CourseController.update.url(editing.id)
                                : CourseController.store.url()
                        }
                        method={editing ? 'patch' : 'post'}
                        resetOnSuccess={['code', 'name', 'sort_order']}
                        onSuccess={handleFormSuccess}
                        className="grid gap-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="code">Program code</Label>
                                    <Input
                                        id="code"
                                        name="code"
                                        required
                                        autoComplete="off"
                                        defaultValue={
                                            editing?.code ?? undefined
                                        }
                                        aria-invalid={Boolean(errors.code)}
                                    />
                                    <InputError message={errors.code} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Program name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        required
                                        autoComplete="organization"
                                        defaultValue={
                                            editing?.name ?? undefined
                                        }
                                        aria-invalid={Boolean(errors.name)}
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="sort_order">
                                        Sort order
                                    </Label>
                                    <Input
                                        id="sort_order"
                                        name="sort_order"
                                        type="number"
                                        min={0}
                                        max={65535}
                                        defaultValue={editing?.sort_order ?? 0}
                                        aria-invalid={Boolean(
                                            errors.sort_order,
                                        )}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Lower numbers sort first in dropdowns.
                                    </p>
                                    <InputError message={errors.sort_order} />
                                </div>
                                <DialogFooter className="gap-2 sm:gap-0">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setFormOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {editing ? 'Save changes' : 'Create'}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete program?</DialogTitle>
                        <DialogDescription>
                            This cannot be undone. Positions and candidates that
                            reference this program may lose their link (
                            <span className="text-foreground">course_id</span>{' '}
                            cleared where allowed).
                        </DialogDescription>
                    </DialogHeader>
                    {deleting ? (
                        <Form
                            action={CourseController.destroy.url(deleting.id)}
                            method="delete"
                            onSuccess={() => setDeleting(null)}
                            className="contents"
                        >
                            {({ processing }) => (
                                <DialogFooter className="gap-2 sm:gap-0">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setDeleting(null)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        disabled={processing}
                                    >
                                        Delete
                                    </Button>
                                </DialogFooter>
                            )}
                        </Form>
                    ) : null}
                </DialogContent>
            </Dialog>
        </>
    );
}
