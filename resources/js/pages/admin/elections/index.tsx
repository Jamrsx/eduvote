import * as ElectionController from '@/actions/App/Http/Controllers/Admin/ElectionController';
import InputError from '@/components/input-error';
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
import { cn } from '@/lib/utils';
import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import { index as adminPartiesIndex } from '@/routes/admin/parties';
import { CalendarDays, Flag, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type ElectionRow = {
    id: number;
    title: string;
    description: string | null;
    status: string;
    lifecycle: 'draft' | 'published';
    votes_count: number;
    opens_at_input: string | null;
    closes_at_input: string | null;
    opens_at_display: string | null;
    closes_at_display: string | null;
};

type LifecycleOption = { value: string; label: string };

type Props = {
    elections: ElectionRow[];
    electionLifecycles: LifecycleOption[];
    appTimezone: string;
};

function pad2(n: number): string {
    return String(n).padStart(2, '0');
}

function defaultSchedule(): { opens: string; closes: string } {
    const opens = new Date(Date.now() + 86400000);
    opens.setHours(9, 0, 0, 0);
    const closes = new Date(opens.getTime() + 7 * 86400000);
    closes.setHours(17, 0, 0, 0);
    const fmt = (d: Date) =>
        `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    return { opens: fmt(opens), closes: fmt(closes) };
}

function statusBadgeClass(status: string): string {
    switch (status) {
        case 'draft':
            return 'border-muted-foreground/30 bg-muted/50 text-muted-foreground';
        case 'scheduled':
            return 'border-blue-600/30 bg-blue-600/10 text-blue-900 dark:text-blue-100';
        case 'open':
            return 'border-emerald-600/30 bg-emerald-600/10 text-emerald-900 dark:text-emerald-100';
        case 'closed':
            return 'border-foreground/20 bg-transparent text-muted-foreground';
        default:
            return '';
    }
}

const selectClasses = cn(
    'flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:text-foreground placeholder:text-muted-foreground md:text-sm',
    'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
);

const textareaClasses = cn(
    'flex min-h-[72px] w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground md:text-sm',
    'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
);

export default function AdminElectionsIndex({
    elections,
    electionLifecycles,
    appTimezone,
}: Props) {
    const page = usePage<{
        flash?: { success?: string | null };
        errors?: { election?: string };
    }>();

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<ElectionRow | null>(null);
    const [deleting, setDeleting] = useState<ElectionRow | null>(null);
    const [createKey, setCreateKey] = useState(0);
    const scheduleForCreate = useMemo(() => defaultSchedule(), [createKey]);

    const shouldPollScheduleRows = useMemo(
        () => elections.some((row) => row.lifecycle === 'published'),
        [elections],
    );

    useEffect(() => {
        if (!shouldPollScheduleRows) {
            return;
        }

        const { stop } = router.poll(20_000, {
            only: ['elections', 'electionLifecycles', 'appTimezone'],
        });

        return () => {
            stop();
        };
    }, [shouldPollScheduleRows]);

    useEffect(() => {
        const msg = page.props.flash?.success;
        if (msg) {
            toast.success(msg);
        }
    }, [page.props.flash?.success]);

    useEffect(() => {
        console.log(
            '[AdminElectionsIndex] elections',
            elections.length,
            'rows',
        );
    }, [elections.length]);

    function openCreate(): void {
        setEditing(null);
        setCreateKey((k) => k + 1);
        setFormOpen(true);
        console.log('[AdminElectionsIndex] open create election');
    }

    function openEdit(row: ElectionRow): void {
        setEditing(row);
        setFormOpen(true);
    }

    function handleFormSuccess(): void {
        setFormOpen(false);
        setEditing(null);
    }

    const formKey =
        editing !== null ? `edit-${editing.id}` : `create-${createKey}`;

    return (
        <>
            <Head title="Election schedule" />

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight">
                            Election schedule
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Create voting periods with open and close times. Add
                            parties and nominees under{' '}
                            <span className="font-medium text-foreground">
                                Parties
                            </span>{' '}
                            in the Elections group.
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                        <Button variant="outline" asChild>
                            <Link href={adminPartiesIndex().url}>
                                <Flag className="mr-2 size-4" aria-hidden />
                                Parties
                            </Link>
                        </Button>
                        <Button type="button" onClick={openCreate}>
                            <Plus className="mr-2 size-4" aria-hidden />
                            New election
                        </Button>
                    </div>
                </div>

                {page.props.errors?.election ? (
                    <Alert variant="destructive">
                        <AlertTitle>Cannot delete</AlertTitle>
                        <AlertDescription>
                            {page.props.errors.election}
                        </AlertDescription>
                    </Alert>
                ) : null}

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CalendarDays
                                className="size-5 text-muted-foreground"
                                aria-hidden
                            />
                            <CardTitle>Election periods</CardTitle>
                        </div>
                        <CardDescription>
                            Published elections move between scheduled, open,
                            and closed automatically from open and close times
                            (no server cron required). Draft stays off the voting
                            schedule until you publish.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 sm:px-6">
                        {elections.length === 0 ? (
                            <p className="px-6 text-sm text-muted-foreground sm:px-0">
                                No elections yet. Click &quot;New election&quot;
                                to create the first one.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[720px] text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="pr-4 pb-3 font-medium">
                                                Title
                                            </th>
                                            <th className="pr-4 pb-3 font-medium">
                                                Status
                                            </th>
                                            <th className="pr-4 pb-3 font-medium">
                                                Opens
                                            </th>
                                            <th className="pr-4 pb-3 font-medium">
                                                Closes
                                            </th>
                                            <th className="pr-4 pb-3 font-medium">
                                                Votes
                                            </th>
                                            <th className="pb-3 text-right font-medium">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {elections.map((row) => (
                                            <tr
                                                key={row.id}
                                                className="border-b border-border/80 last:border-0"
                                            >
                                                <td className="max-w-[14rem] py-3 pr-4">
                                                    <div className="leading-snug font-medium">
                                                        {row.title}
                                                    </div>
                                                    {row.description ? (
                                                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                                            {row.description}
                                                        </p>
                                                    ) : null}
                                                </td>
                                                <td className="py-3 pr-4">
                                                    <Badge
                                                        variant="outline"
                                                        className={statusBadgeClass(
                                                            row.status,
                                                        )}
                                                    >
                                                        {row.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 pr-4 text-xs whitespace-nowrap text-muted-foreground">
                                                    {row.opens_at_display ??
                                                        '—'}
                                                </td>
                                                <td className="py-3 pr-4 text-xs whitespace-nowrap text-muted-foreground">
                                                    {row.closes_at_display ??
                                                        '—'}
                                                </td>
                                                <td className="py-3 pr-4 tabular-nums">
                                                    {row.votes_count}
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                openEdit(row)
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
                                                                row.votes_count >
                                                                0
                                                            }
                                                            title={
                                                                row.votes_count >
                                                                0
                                                                    ? 'Remove recorded votes before deleting'
                                                                    : undefined
                                                            }
                                                            onClick={() =>
                                                                setDeleting(row)
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
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Edit election' : 'New election'}
                        </DialogTitle>
                        <DialogDescription>
                            Open and close times use the application timezone (
                            <span className="font-mono text-xs text-foreground">
                                {appTimezone}
                            </span>
                            ). Choose Published to open and close the election
                            automatically on that schedule; this page refreshes
                            periodically so status updates without a manual
                            reload.
                        </DialogDescription>
                    </DialogHeader>

                    <Form
                        key={formKey}
                        action={
                            editing
                                ? ElectionController.update.url({
                                      election: editing.id,
                                  })
                                : ElectionController.store.url()
                        }
                        method={editing ? 'patch' : 'post'}
                        options={{ preserveScroll: true }}
                        onSuccess={() => {
                            console.log(
                                '[AdminElectionsIndex] election saved',
                                editing?.id,
                            );
                            handleFormSuccess();
                        }}
                        className="grid gap-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        required
                                        autoComplete="off"
                                        defaultValue={editing?.title}
                                        aria-invalid={Boolean(errors.title)}
                                    />
                                    <InputError message={errors.title} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">
                                        Description{' '}
                                        <span className="font-normal text-muted-foreground">
                                            (optional)
                                        </span>
                                    </Label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={3}
                                        className={textareaClasses}
                                        defaultValue={
                                            editing?.description ?? ''
                                        }
                                        aria-invalid={Boolean(
                                            errors.description,
                                        )}
                                    />
                                    <InputError message={errors.description} />
                                </div>

                                <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                                    <div className="grid gap-2">
                                        <Label htmlFor="opens_at">
                                            Opens at
                                        </Label>
                                        <Input
                                            id="opens_at"
                                            name="opens_at"
                                            type="datetime-local"
                                            required
                                            defaultValue={
                                                editing?.opens_at_input ??
                                                scheduleForCreate.opens
                                            }
                                            aria-invalid={Boolean(
                                                errors.opens_at,
                                            )}
                                        />
                                        <InputError message={errors.opens_at} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="closes_at">
                                            Closes at
                                        </Label>
                                        <Input
                                            id="closes_at"
                                            name="closes_at"
                                            type="datetime-local"
                                            required
                                            defaultValue={
                                                editing?.closes_at_input ??
                                                scheduleForCreate.closes
                                            }
                                            aria-invalid={Boolean(
                                                errors.closes_at,
                                            )}
                                        />
                                        <InputError
                                            message={errors.closes_at}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="lifecycle">
                                        Election mode
                                    </Label>
                                    <select
                                        id="lifecycle"
                                        name="lifecycle"
                                        required
                                        className={selectClasses}
                                        defaultValue={
                                            editing?.lifecycle ?? 'published'
                                        }
                                        aria-invalid={Boolean(
                                            errors.lifecycle,
                                        )}
                                    >
                                        {electionLifecycles.map((opt) => (
                                            <option
                                                key={opt.value}
                                                value={opt.value}
                                            >
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.lifecycle} />
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
                        <DialogTitle>Delete election?</DialogTitle>
                        <DialogDescription>
                            This removes the election and any positions and
                            candidates that belong to it. You cannot delete if
                            votes have already been recorded.
                        </DialogDescription>
                    </DialogHeader>
                    {deleting !== null ? (
                        <Form
                            action={ElectionController.destroy.url({
                                election: deleting.id,
                            })}
                            method="delete"
                            options={{ preserveScroll: true }}
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
                                        disabled={
                                            processing ||
                                            deleting.votes_count > 0
                                        }
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
