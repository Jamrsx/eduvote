import * as ElectionBallotController from '@/actions/App/Http/Controllers/Admin/ElectionBallotController';
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
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { Form, Head, Link, usePage } from '@inertiajs/react';
import { index as adminElectionsIndex } from '@/routes/admin/elections';
import { ChevronDown, Layers, Pencil, Plus, Trash2, UserSquare2 } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type CourseOption = {
    id: number;
    code: string;
    name: string;
};

type CandidateRow = {
    id: number;
    full_name: string;
    platform: string | null;
    sort_order: number;
    votes_count: number;
    course_id: number | null;
};

type PositionRow = {
    id: number;
    name: string;
    sort_order: number;
    max_selections: number;
    course_id: number | null;
    course: { id: number; code: string; name: string } | null;
    votes_count: number;
    candidates: CandidateRow[];
};

type ElectionBlock = {
    id: number;
    title: string;
    status: string;
    positions: PositionRow[];
};

type Props = {
    elections: ElectionBlock[];
    courses: CourseOption[];
};

const selectClasses = cn(
    'border-input placeholder:text-muted-foreground flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none',
    'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
);

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

const ADMIN_CANDIDATES_ELECTION_SECTIONS_OPEN_KEY =
    'eduvote.admin_candidates.election_sections_open';

function readElectionSectionsOpen(): Record<number, boolean> {
    if (typeof window === 'undefined') {
        return {};
    }
    try {
        const raw = window.localStorage.getItem(
            ADMIN_CANDIDATES_ELECTION_SECTIONS_OPEN_KEY,
        );
        if (!raw) {
            return {};
        }
        const parsed: unknown = JSON.parse(raw);
        if (
            typeof parsed !== 'object' ||
            parsed === null ||
            Array.isArray(parsed)
        ) {
            return {};
        }
        const out: Record<number, boolean> = {};
        for (const [key, value] of Object.entries(parsed)) {
            const id = Number(key);
            if (Number.isFinite(id) && typeof value === 'boolean') {
                out[id] = value;
            }
        }
        return out;
    } catch {
        return {};
    }
}

function writeElectionSectionsOpen(map: Record<number, boolean>): void {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        window.localStorage.setItem(
            ADMIN_CANDIDATES_ELECTION_SECTIONS_OPEN_KEY,
            JSON.stringify(map),
        );
    } catch {
        //
    }
}

export default function AdminCandidatesIndex({
    elections,
    courses,
}: Props) {
    const page = usePage<{
        flash?: { success?: string | null };
        errors?: { ballot?: string };
    }>();

    const [electionOpen, setElectionOpen] = useState<Record<number, boolean>>(
        {},
    );

    const electionIdsSignature = useMemo(
        () => elections.map((e) => e.id).join(','),
        [elections],
    );

    /**
     * Apply persisted open/closed state before the first paint so a collapsed
     * section does not briefly render as expanded (Radix + default undefined).
     */
    useLayoutEffect(() => {
        if (elections.length === 0) {
            setElectionOpen({});

            return;
        }

        const ids = new Set(elections.map((e) => e.id));
        const stored = readElectionSectionsOpen();
        const next: Record<number, boolean> = {};
        for (const id of ids) {
            const v = stored[id];
            if (typeof v === 'boolean') {
                next[id] = v;
            }
        }
        setElectionOpen(next);
    }, [electionIdsSignature]);

    const [positionDialog, setPositionDialog] = useState<
        | { mode: 'create'; election: ElectionBlock }
        | { mode: 'edit'; election: ElectionBlock; position: PositionRow }
        | null
    >(null);

    const [candidateDialog, setCandidateDialog] = useState<
        | {
              mode: 'create';
              election: ElectionBlock;
              position: PositionRow;
          }
        | {
              mode: 'edit';
              election: ElectionBlock;
              position: PositionRow;
              candidate: CandidateRow;
          }
        | null
    >(null);

    const [deletePosition, setDeletePosition] = useState<{
        election: ElectionBlock;
        position: PositionRow;
    } | null>(null);

    const [deleteCandidate, setDeleteCandidate] = useState<{
        election: ElectionBlock;
        candidate: CandidateRow;
    } | null>(null);

    function electionCollapsed(id: number): boolean {
        return electionOpen[id] === false;
    }

    function setElectionCollapsed(id: number, collapsed: boolean): void {
        setElectionOpen((prev) => {
            const next = { ...prev, [id]: !collapsed };
            writeElectionSectionsOpen(next);
            console.log(
                '[AdminCandidatesIndex] election section persisted',
                id,
                collapsed ? 'collapsed' : 'expanded',
            );
            return next;
        });
    }

    useEffect(() => {
        const msg = page.props.flash?.success;
        if (msg) {
            toast.success(msg);
        }
    }, [page.props.flash?.success]);

    useEffect(() => {
        const err = page.props.errors?.ballot;
        if (err) {
            toast.error(err);
        }
    }, [page.props.errors?.ballot]);

    useEffect(() => {
        console.log(
            '[AdminCandidatesIndex] elections',
            elections.length,
            'courses',
            courses.length,
        );
    }, [elections.length, courses.length]);

    return (
        <>
            <Head title="Candidates" />

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight">
                            Candidates & ballot positions
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Add positions per election, then nominate candidates under
                            each position. Campus-wide races leave{' '}
                            <span className="text-foreground font-medium">
                                Program
                            </span>{' '}
                            unset.
                        </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={adminElectionsIndex().url} prefetch>
                            Election schedule
                        </Link>
                    </Button>
                </div>

                {page.props.errors?.ballot ? (
                    <Alert variant="destructive">
                        <AlertTitle>Ballot cannot be changed</AlertTitle>
                        <AlertDescription>
                            {page.props.errors.ballot}
                        </AlertDescription>
                    </Alert>
                ) : null}

                {elections.length === 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <UserSquare2
                                    className="size-5 text-muted-foreground"
                                    aria-hidden
                                />
                                No elections yet
                            </CardTitle>
                            <CardDescription>
                                Create an election first under Election schedule,
                                then return here to add positions and candidates.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={adminElectionsIndex().url} prefetch>
                                    Go to election schedule
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-3">
                        {elections.map((election) => (
                            <Collapsible
                                key={election.id}
                                open={!electionCollapsed(election.id)}
                                onOpenChange={(open) =>
                                    setElectionCollapsed(election.id, !open)
                                }
                            >
                                <Card className="overflow-hidden py-0">
                                    <CollapsibleTrigger className="hover:bg-muted/40 [&[data-state=open]]:border-border flex w-full items-center justify-between gap-3 border-b border-transparent px-4 py-3 text-left">
                                        <div className="flex min-w-0 flex-wrap items-center gap-3">
                                            <Layers
                                                className="size-5 shrink-0 text-muted-foreground"
                                                aria-hidden
                                            />
                                            <span className="truncate font-medium">
                                                {election.title}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className={statusBadgeClass(
                                                    election.status,
                                                )}
                                            >
                                                {election.status}
                                            </Badge>
                                            <span className="text-muted-foreground text-xs">
                                                {election.positions.length}{' '}
                                                position
                                                {election.positions.length === 1
                                                    ? ''
                                                    : 's'}
                                            </span>
                                        </div>
                                        <ChevronDown
                                            className={cn(
                                                'size-5 shrink-0 text-muted-foreground transition-transform',
                                                !electionCollapsed(
                                                    election.id,
                                                ) && 'rotate-180',
                                            )}
                                            aria-hidden
                                        />
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <CardContent className="space-y-4 pt-4 pb-4">
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => {
                                                        setPositionDialog({
                                                            mode: 'create',
                                                            election,
                                                        });
                                                        console.log(
                                                            '[AdminCandidatesIndex] open add position',
                                                            election.id,
                                                        );
                                                    }}
                                                >
                                                    <Plus
                                                        className="mr-1 size-4"
                                                        aria-hidden
                                                    />
                                                    Add position
                                                </Button>
                                            </div>

                                            {election.positions.length === 0 ? (
                                                <p className="text-muted-foreground text-sm">
                                                    No positions yet. When students
                                                    vote, each ballot choice belongs to
                                                    a position (e.g. President,
                                                    Representative).
                                                </p>
                                            ) : (
                                                <div className="flex flex-col gap-4">
                                                    {election.positions.map(
                                                        (position) => (
                                                            <div
                                                                key={position.id}
                                                                className="bg-muted/20 rounded-lg border p-4"
                                                            >
                                                                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                                                                    <div>
                                                                        <p className="font-medium">
                                                                            {
                                                                                position.name
                                                                            }
                                                                        </p>
                                                                        <p className="text-muted-foreground text-xs">
                                                                            {position.course
                                                                                ? `Program · ${position.course.code} (${position.course.name})`
                                                                                : 'Campus-wide'}{' '}
                                                                            ·{' '}
                                                                            Max{' '}
                                                                            {
                                                                                position.max_selections
                                                                            }{' '}
                                                                            · Sort{' '}
                                                                            {
                                                                                position.sort_order
                                                                            }{' '}
                                                                            · Votes{' '}
                                                                            {
                                                                                position.votes_count
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                setCandidateDialog(
                                                                                    {
                                                                                        mode:
                                                                                            'create',
                                                                                        election,
                                                                                        position,
                                                                                    },
                                                                                );
                                                                            }}
                                                                        >
                                                                            <Plus className="size-4" />
                                                                            <span className="sr-only">
                                                                                Add
                                                                                candidate
                                                                            </span>
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                setPositionDialog(
                                                                                    {
                                                                                        mode:
                                                                                            'edit',
                                                                                        election,
                                                                                        position,
                                                                                    },
                                                                                );
                                                                            }}
                                                                        >
                                                                            <Pencil className="size-4" />
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="text-destructive hover:bg-destructive/10"
                                                                            disabled={
                                                                                position.votes_count >
                                                                                0
                                                                            }
                                                                            title={
                                                                                position.votes_count >
                                                                                0
                                                                                    ? 'Votes exist for this position'
                                                                                    : undefined
                                                                            }
                                                                            onClick={() =>
                                                                                setDeletePosition(
                                                                                    {
                                                                                        election,
                                                                                        position,
                                                                                    },
                                                                                )
                                                                            }
                                                                        >
                                                                            <Trash2 className="size-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                {position
                                                                    .candidates
                                                                    .length ===
                                                                0 ? (
                                                                    <p className="text-muted-foreground text-sm">
                                                                        No candidates on
                                                                        this slate yet.
                                                                    </p>
                                                                ) : (
                                                                    <div className="overflow-x-auto rounded-md border bg-background">
                                                                        <table className="w-full min-w-[480px] text-sm">
                                                                            <thead>
                                                                                <tr className="bg-muted/50 border-b text-left">
                                                                                    <th className="px-3 py-2 font-medium">
                                                                                        Name
                                                                                    </th>
                                                                                    <th className="px-3 py-2 font-medium">
                                                                                        Platform
                                                                                    </th>
                                                                                    <th className="px-3 py-2 font-medium">
                                                                                        Sort
                                                                                    </th>
                                                                                    <th className="px-3 py-2 font-medium">
                                                                                        Votes
                                                                                    </th>
                                                                                    <th className="text-muted-foreground w-[1%] px-3 py-2 text-right font-medium whitespace-nowrap">
                                                                                        Actions
                                                                                    </th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {position.candidates.map(
                                                                                    (
                                                                                        c,
                                                                                    ) => (
                                                                                        <tr
                                                                                            key={
                                                                                                c.id
                                                                                            }
                                                                                            className="border-b last:border-0"
                                                                                        >
                                                                                            <td className="px-3 py-2 font-medium">
                                                                                                {
                                                                                                    c.full_name
                                                                                                }
                                                                                            </td>
                                                                                            <td className="text-muted-foreground max-w-[16rem] truncate px-3 py-2 text-xs">
                                                                                                {c.platform ??
                                                                                                    '—'}
                                                                                            </td>
                                                                                            <td className="px-3 py-2 tabular-nums">
                                                                                                {
                                                                                                    c.sort_order
                                                                                                }
                                                                                            </td>
                                                                                            <td className="px-3 py-2 tabular-nums">
                                                                                                {
                                                                                                    c.votes_count
                                                                                                }
                                                                                            </td>
                                                                                            <td className="px-3 py-2 text-right">
                                                                                                <div className="flex justify-end gap-2">
                                                                                                    <Button
                                                                                                        variant="outline"
                                                                                                        size="sm"
                                                                                                        type="button"
                                                                                                        onClick={() => {
                                                                                                            setCandidateDialog(
                                                                                                                {
                                                                                                                    mode:
                                                                                                                        'edit',
                                                                                                                    election,
                                                                                                                    position,
                                                                                                                    candidate:
                                                                                                                        c,
                                                                                                                },
                                                                                                            );
                                                                                                        }}
                                                                                                    >
                                                                                                        <Pencil className="size-4" />
                                                                                                    </Button>
                                                                                                    <Button
                                                                                                        variant="outline"
                                                                                                        size="sm"
                                                                                                        type="button"
                                                                                                        className="text-destructive hover:bg-destructive/10"
                                                                                                        disabled={
                                                                                                            c.votes_count >
                                                                                                            0
                                                                                                        }
                                                                                                        onClick={() =>
                                                                                                            setDeleteCandidate(
                                                                                                                {
                                                                                                                    election,
                                                                                                                    candidate:
                                                                                                                        c,
                                                                                                                },
                                                                                                            )
                                                                                                        }
                                                                                                    >
                                                                                                        <Trash2 className="size-4" />
                                                                                                    </Button>
                                                                                                </div>
                                                                                            </td>
                                                                                        </tr>
                                                                                    ),
                                                                                )}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </CollapsibleContent>
                                </Card>
                            </Collapsible>
                        ))}
                    </div>
                )}
            </div>

            {/* Position dialog */}
            <Dialog
                open={positionDialog !== null}
                onOpenChange={(open) => !open && setPositionDialog(null)}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                    {positionDialog !== null ? (
                        <>
                            <DialogHeader>
                                <DialogTitle>
                                    {positionDialog.mode === 'create'
                                        ? 'Add position'
                                        : 'Edit position'}
                                </DialogTitle>
                                <DialogDescription>
                                    {positionDialog.mode === 'create'
                                        ? `For “${positionDialog.election.title}”.`
                                        : `${positionDialog.position.name} · ${positionDialog.election.title}`}
                                </DialogDescription>
                            </DialogHeader>

                            <Form
                                action={
                                    positionDialog.mode === 'create'
                                        ? ElectionBallotController.storePosition.url(
                                              {
                                                  election:
                                                      positionDialog.election.id,
                                              },
                                          )
                                        : ElectionBallotController.updatePosition.url(
                                              {
                                                  election:
                                                      positionDialog.election.id,
                                                  position:
                                                      positionDialog.position.id,
                                              },
                                          )
                                }
                                method={
                                    positionDialog.mode === 'create'
                                        ? 'post'
                                        : 'patch'
                                }
                                options={{ preserveScroll: true }}
                                onSuccess={() => {
                                    console.log(
                                        '[AdminCandidatesIndex] position saved',
                                    );
                                    setPositionDialog(null);
                                }}
                                className="grid gap-4"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="position_name">
                                                Position title
                                            </Label>
                                            <Input
                                                id="position_name"
                                                name="name"
                                                required
                                                defaultValue={
                                                    positionDialog.mode ===
                                                    'edit'
                                                        ? positionDialog.position
                                                              .name
                                                        : ''
                                                }
                                            />
                                            <InputError message={errors.name} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="course_id_scope">
                                                Program scope
                                            </Label>
                                            <select
                                                id="course_id_scope"
                                                name="course_id"
                                                className={selectClasses}
                                                defaultValue={
                                                    positionDialog.mode ===
                                                    'edit'
                                                        ? (
                                                              positionDialog
                                                                  .position
                                                                  .course_id ?? ''
                                                          ).toString()
                                                        : ''
                                                }
                                            >
                                                <option value="">
                                                    Campus-wide (all programs)
                                                </option>
                                                {courses.map((c) => (
                                                    <option
                                                        key={c.id}
                                                        value={String(c.id)}
                                                    >
                                                        {c.code} — {c.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError
                                                message={errors.course_id}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="grid gap-2">
                                                <Label htmlFor="max_sel">
                                                    Max selections
                                                </Label>
                                                <Input
                                                    id="max_sel"
                                                    name="max_selections"
                                                    type="number"
                                                    min={1}
                                                    max={50}
                                                    defaultValue={
                                                        positionDialog.mode ===
                                                        'edit'
                                                            ? positionDialog.position
                                                                  .max_selections
                                                            : 1
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        errors.max_selections
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="pos_sort">
                                                    Sort order
                                                </Label>
                                                <Input
                                                    id="pos_sort"
                                                    name="sort_order"
                                                    type="number"
                                                    min={0}
                                                    max={65535}
                                                    defaultValue={
                                                        positionDialog.mode ===
                                                        'edit'
                                                            ? positionDialog.position
                                                                  .sort_order
                                                            : ''
                                                    }
                                                />
                                                <p className="text-muted-foreground text-xs leading-snug">
                                                    Lower appears first when
                                                    listed.
                                                </p>
                                                <InputError
                                                    message={
                                                        errors.sort_order
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <DialogFooter>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    setPositionDialog(null)
                                                }
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                            >
                                                {processing
                                                    ? 'Saving…'
                                                    : positionDialog.mode ===
                                                        'create'
                                                      ? 'Add position'
                                                      : 'Save'}
                                            </Button>
                                        </DialogFooter>
                                    </>
                                )}
                            </Form>
                        </>
                    ) : null}
                </DialogContent>
            </Dialog>

            {/* Candidate dialog */}
            <Dialog
                open={candidateDialog !== null}
                onOpenChange={(open) => !open && setCandidateDialog(null)}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    {candidateDialog !== null ? (
                        <>
                            <DialogHeader>
                                <DialogTitle>
                                    {candidateDialog.mode === 'create'
                                        ? 'Add candidate'
                                        : 'Edit candidate'}
                                </DialogTitle>
                                <DialogDescription>
                                    Position:{' '}
                                    <span className="text-foreground font-medium">
                                        {candidateDialog.position.name}
                                    </span>{' '}
                                    · Election:{' '}
                                    <span className="text-foreground font-medium">
                                        {candidateDialog.election.title}
                                    </span>
                                </DialogDescription>
                            </DialogHeader>

                            <Form
                                action={
                                    candidateDialog.mode === 'create'
                                        ? ElectionBallotController.storeCandidate.url(
                                              {
                                                  election:
                                                      candidateDialog.election
                                                          .id,
                                                  position:
                                                      candidateDialog.position
                                                          .id,
                                              },
                                          )
                                        : ElectionBallotController.updateCandidate.url(
                                              {
                                                  election:
                                                      candidateDialog.election
                                                          .id,
                                                  candidate:
                                                      candidateDialog.candidate
                                                          .id,
                                              },
                                          )
                                }
                                method={
                                    candidateDialog.mode === 'create'
                                        ? 'post'
                                        : 'patch'
                                }
                                options={{ preserveScroll: true }}
                                onSuccess={() => {
                                    console.log(
                                        '[AdminCandidatesIndex] candidate saved',
                                    );
                                    setCandidateDialog(null);
                                }}
                                className="grid gap-4"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="full_name">
                                                Full name
                                            </Label>
                                            <Input
                                                id="full_name"
                                                name="full_name"
                                                required
                                                defaultValue={
                                                    candidateDialog.mode ===
                                                    'edit'
                                                        ? candidateDialog
                                                              .candidate
                                                              .full_name
                                                        : ''
                                                }
                                            />
                                            <InputError
                                                message={errors.full_name}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="platform_txt">
                                                Platform / message (optional)
                                            </Label>
                                            <textarea
                                                id="platform_txt"
                                                name="platform"
                                                rows={4}
                                                className={cn(
                                                    'border-input flex min-h-[88px] w-full resize-y rounded-md border px-3 py-2 text-sm shadow-xs outline-none',
                                                    'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                                                )}
                                                defaultValue={
                                                    candidateDialog.mode ===
                                                    'edit'
                                                        ? (candidateDialog
                                                              .candidate
                                                              .platform ?? '')
                                                        : ''
                                                }
                                            />
                                            <InputError
                                                message={errors.platform}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="cand_course">
                                                Program hint (optional)
                                            </Label>
                                            <select
                                                id="cand_course"
                                                name="course_id"
                                                className={selectClasses}
                                                defaultValue={
                                                    candidateDialog.mode ===
                                                    'edit'
                                                        ? (
                                                              candidateDialog
                                                                  .candidate
                                                                  .course_id ??
                                                              ''
                                                          ).toString()
                                                        : ''
                                                }
                                            >
                                                <option value="">—</option>
                                                {courses.map((c) => (
                                                    <option
                                                        key={c.id}
                                                        value={String(c.id)}
                                                    >
                                                        {c.code}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError
                                                message={errors.course_id}
                                            />
                                        </div>

                                        <DialogFooter>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    setCandidateDialog(null)
                                                }
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                            >
                                                {processing
                                                    ? 'Saving…'
                                                    : candidateDialog.mode ===
                                                        'create'
                                                      ? 'Add candidate'
                                                      : 'Save'}
                                            </Button>
                                        </DialogFooter>
                                    </>
                                )}
                            </Form>
                        </>
                    ) : null}
                </DialogContent>
            </Dialog>

            {/* Delete position */}
            <Dialog
                open={deletePosition !== null}
                onOpenChange={(o) => !o && setDeletePosition(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Remove position?</DialogTitle>
                        <DialogDescription>
                            Candidates under this slate will also be deleted.
                            Voting history must be empty.
                        </DialogDescription>
                    </DialogHeader>
                    {deletePosition ? (
                        <Form
                            action={ElectionBallotController.destroyPosition.url(
                                {
                                    election: deletePosition.election.id,
                                    position: deletePosition.position.id,
                                },
                            )}
                            method="delete"
                            options={{ preserveScroll: true }}
                            onSuccess={() => setDeletePosition(null)}
                            className="contents"
                        >
                            {({ processing }) => (
                                <DialogFooter className="gap-2">
                                    <Button
                                        variant="outline"
                                        type="button"
                                        onClick={() =>
                                            setDeletePosition(null)
                                        }
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        disabled={
                                            processing ||
                                            deletePosition.position
                                                .votes_count > 0
                                        }
                                    >
                                        Remove
                                    </Button>
                                </DialogFooter>
                            )}
                        </Form>
                    ) : null}
                </DialogContent>
            </Dialog>

            {/* Delete candidate */}
            <Dialog
                open={deleteCandidate !== null}
                onOpenChange={(o) => !o && setDeleteCandidate(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Remove candidate?</DialogTitle>
                        <DialogDescription>
                            {deleteCandidate?.candidate.full_name ?? ''}
                        </DialogDescription>
                    </DialogHeader>
                    {deleteCandidate ? (
                        <Form
                            action={ElectionBallotController.destroyCandidate.url(
                                {
                                    election: deleteCandidate.election.id,
                                    candidate:
                                        deleteCandidate.candidate.id,
                                },
                            )}
                            method="delete"
                            options={{ preserveScroll: true }}
                            onSuccess={() => setDeleteCandidate(null)}
                            className="contents"
                        >
                            {({ processing }) => (
                                <DialogFooter className="gap-2">
                                    <Button
                                        variant="outline"
                                        type="button"
                                        onClick={() =>
                                            setDeleteCandidate(null)
                                        }
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        disabled={
                                            processing ||
                                            deleteCandidate.candidate
                                                .votes_count > 0
                                        }
                                    >
                                        Remove
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
