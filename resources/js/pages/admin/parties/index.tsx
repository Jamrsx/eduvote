import * as PartyController from '@/actions/App/Http/Controllers/Admin/PartyController';
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
import {
    compressNomineePhotoIfNeeded,
    NOMINEE_PHOTO_MAX_BYTES,
} from '@/lib/compress-nominee-photo';
import { cn } from '@/lib/utils';
import { Form, Head, usePage } from '@inertiajs/react';
import { ChevronDown, Flag, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type CourseOption = {
    id: number;
    code: string;
    name: string;
};

type CandidateOnParty = {
    id: number;
    full_name: string;
    position_name: string;
    department: string;
    platform: string | null;
    candidate_course_id: number | null;
    photo_url: string | null;
};

type PartyRow = {
    id: number;
    name: string;
    short_name: string | null;
    sort_order: number;
    course_id: number | null;
    course: { id: number; code: string; name: string } | null;
    scope_label: string;
    candidates: CandidateOnParty[];
};

type ElectionBlock = {
    id: number;
    title: string;
    status: string;
    parties: PartyRow[];
};

type Props = {
    courses: CourseOption[];
    elections: ElectionBlock[];
};

const selectClasses = cn(
    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none placeholder:text-muted-foreground',
    'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
);

const PARTY_SLATE_EXPAND_STORAGE_KEY =
    'eduvote.admin_parties.party_slates_open';

/** partyId → slate body visible (default true when missing). */
type PartySlateOpenMap = Record<number, boolean>;

function partyIdsSignature(electionBlocks: ElectionBlock[]): string {
    return electionBlocks
        .flatMap((e) => e.parties.map((p) => p.id))
        .sort((a, b) => a - b)
        .join(',');
}

function readPartySlateOpenMapFromStorage(): PartySlateOpenMap {
    if (typeof window === 'undefined') {
        return {};
    }
    try {
        const raw = window.localStorage.getItem(PARTY_SLATE_EXPAND_STORAGE_KEY);
        if (!raw) {
            return {};
        }
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const out: PartySlateOpenMap = {};
        for (const [key, val] of Object.entries(parsed)) {
            const id = Number(key);
            if (Number.isFinite(id) && typeof val === 'boolean') {
                out[id] = val;
            }
        }
        return out;
    } catch {
        return {};
    }
}

function writePartySlateOpenMapToStorage(map: PartySlateOpenMap): void {
    try {
        window.localStorage.setItem(
            PARTY_SLATE_EXPAND_STORAGE_KEY,
            JSON.stringify(map),
        );
    } catch {
        // ignore quota / private mode
    }
}

function mergePartySlateOpenMap(
    electionBlocks: ElectionBlock[],
    stored: PartySlateOpenMap,
): PartySlateOpenMap {
    const next: PartySlateOpenMap = {};
    for (const election of electionBlocks) {
        for (const party of election.parties) {
            next[party.id] = stored[party.id] ?? true;
        }
    }
    return next;
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

export default function AdminPartiesIndex({ courses, elections }: Props) {
    const page = usePage<{
        flash?: { success?: string | null };
        errors?: { ballot?: string };
    }>();

    const [partyDialog, setPartyDialog] = useState<
        | { mode: 'create'; election: ElectionBlock }
        | { mode: 'edit'; election: ElectionBlock; party: PartyRow }
        | null
    >(null);

    const [slateNomineeDialog, setSlateNomineeDialog] = useState<
        | { mode: 'create'; election: ElectionBlock; party: PartyRow }
        | {
              mode: 'edit';
              election: ElectionBlock;
              party: PartyRow;
              nominee: CandidateOnParty;
          }
        | null
    >(null);

    const [deleteParty, setDeleteParty] = useState<{
        election: ElectionBlock;
        party: PartyRow;
    } | null>(null);

    const [deleteNominee, setDeleteNominee] = useState<{
        election: ElectionBlock;
        party: PartyRow;
        nominee: CandidateOnParty;
    } | null>(null);

    const [nomineePhotoCompressing, setNomineePhotoCompressing] =
        useState(false);

    useEffect(() => {
        if (slateNomineeDialog === null) {
            setNomineePhotoCompressing(false);
        }
    }, [slateNomineeDialog]);

    const partyListSignature = useMemo(
        () => partyIdsSignature(elections),
        [elections],
    );

    const [partySlateOpenById, setPartySlateOpenById] =
        useState<PartySlateOpenMap>({});

    useLayoutEffect(() => {
        const stored = readPartySlateOpenMapFromStorage();
        setPartySlateOpenById(mergePartySlateOpenMap(elections, stored));
    }, [elections, partyListSignature]);

    function togglePartySlate(partyId: number): void {
        setPartySlateOpenById((prev) => {
            const isOpen = prev[partyId] !== false;
            const next = { ...prev, [partyId]: !isOpen };
            writePartySlateOpenMapToStorage(next);
            console.log(
                '[AdminPartiesIndex] toggle party slate',
                partyId,
                'expanded',
                !isOpen,
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
            '[AdminPartiesIndex] elections',
            elections.length,
            'courses',
            courses.length,
        );
    }, [elections.length, courses.length]);

    const partyFormKey =
        partyDialog?.mode === 'edit'
            ? `party-edit-${partyDialog.party.id}`
            : partyDialog !== null
              ? `party-create-${partyDialog.election.id}`
              : 'party-closed';

    const nomineeFormKey =
        slateNomineeDialog?.mode === 'edit'
            ? `nominee-edit-${slateNomineeDialog.nominee.id}`
            : slateNomineeDialog !== null
              ? `nominee-create-${slateNomineeDialog.party.id}`
              : 'nominee-closed';

    return (
        <>
            <Head title="Parties" />

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight">
                            Parties & slates
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Create a party for an election as campus-wide or for
                            a single program (e.g. BSIT). Add each nominee with
                            a typed role title, platform, and{' '}
                            <span className="font-medium text-foreground">
                                program
                            </span>
                            .
                        </p>
                    </div>
                </div>

                {page.props.errors?.ballot ? (
                    <Alert variant="destructive">
                        <AlertTitle>Slate locked</AlertTitle>
                        <AlertDescription>
                            {page.props.errors.ballot}
                        </AlertDescription>
                    </Alert>
                ) : null}

                {elections.length === 0 ? (
                    <Card>
                        <CardHeader className="flex flex-row items-start gap-2">
                            <Flag
                                className="size-5 shrink-0 text-muted-foreground"
                                aria-hidden
                            />
                            <div>
                                <CardTitle className="text-base">
                                    No elections yet
                                </CardTitle>
                                <CardDescription>
                                    Add an election under Election schedule
                                    first, then set up parties here. Nominee
                                    roles create matching ballot lines
                                    automatically.
                                </CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-4">
                        {elections.map((election) => (
                            <Card key={election.id}>
                                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0 pb-4">
                                    <div className="space-y-1">
                                        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                                            {election.title}
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    statusBadgeClass(
                                                        election.status,
                                                    ),
                                                )}
                                            >
                                                {election.status}
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription>
                                            Party names are unique within this
                                            election. Type any role when adding
                                            a nominee (e.g. President, Chief
                                            delegate). Program slates keep those
                                            lines tied to that program.
                                        </CardDescription>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            setPartyDialog({
                                                mode: 'create',
                                                election,
                                            })
                                        }
                                    >
                                        <Plus className="mr-1 size-4" />
                                        Add party
                                    </Button>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4">
                                    {election.parties.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            No parties for this election yet.
                                        </p>
                                    ) : (
                                        election.parties.map((party) => {
                                            const slateExpanded =
                                                partySlateOpenById[party.id] !==
                                                false;
                                            const slateBodyId = `party-slate-body-${party.id}`;

                                            return (
                                                <div
                                                    key={party.id}
                                                    className="rounded-lg border bg-muted/15"
                                                >
                                                    <div className="flex flex-wrap items-start justify-between gap-2 border-b px-4 py-3">
                                                        <button
                                                            type="button"
                                                            id={`party-slate-trigger-${party.id}`}
                                                            className={cn(
                                                                'flex min-w-0 flex-1 cursor-pointer gap-3 rounded-md text-left outline-none',
                                                                'focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                                            )}
                                                            aria-expanded={
                                                                slateExpanded
                                                            }
                                                            aria-controls={
                                                                slateBodyId
                                                            }
                                                            onClick={() =>
                                                                togglePartySlate(
                                                                    party.id,
                                                                )
                                                            }
                                                        >
                                                            <ChevronDown
                                                                className={cn(
                                                                    'mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform',
                                                                    !slateExpanded &&
                                                                        '-rotate-90',
                                                                )}
                                                                aria-hidden
                                                            />
                                                            <div className="min-w-0">
                                                                <p className="font-medium">
                                                                    {party.name}
                                                                    {party.short_name ? (
                                                                        <span className="font-normal text-muted-foreground">
                                                                            {' '}
                                                                            (
                                                                            {
                                                                                party.short_name
                                                                            }
                                                                            )
                                                                        </span>
                                                                    ) : null}
                                                                </p>
                                                                <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="font-normal"
                                                                    >
                                                                        {
                                                                            party.scope_label
                                                                        }
                                                                    </Badge>
                                                                    <span>
                                                                        Sort{' '}
                                                                        {
                                                                            party.sort_order
                                                                        }
                                                                        ·{' '}
                                                                        {
                                                                            party
                                                                                .candidates
                                                                                .length
                                                                        }{' '}
                                                                        nominee
                                                                        {party
                                                                            .candidates
                                                                            .length ===
                                                                        1
                                                                            ? ''
                                                                            : 's'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </button>
                                                        <div className="flex shrink-0 flex-wrap gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSlateNomineeDialog(
                                                                        {
                                                                            mode: 'create',
                                                                            election,
                                                                            party,
                                                                        },
                                                                    );
                                                                    console.log(
                                                                        '[AdminPartiesIndex] open add nominee',
                                                                        party.id,
                                                                    );
                                                                }}
                                                            >
                                                                <Plus className="mr-1 size-4" />
                                                                Add nominee
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setPartyDialog(
                                                                        {
                                                                            mode: 'edit',
                                                                            election,
                                                                            party,
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                <Pencil className="size-4" />
                                                                <span className="sr-only">
                                                                    Edit party
                                                                </span>
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:text-destructive-foreground"
                                                                onClick={() =>
                                                                    setDeleteParty(
                                                                        {
                                                                            election,
                                                                            party,
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="size-4" />
                                                                <span className="sr-only">
                                                                    Delete party
                                                                </span>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    {slateExpanded ? (
                                                        <div
                                                            id={slateBodyId}
                                                            role="region"
                                                            aria-labelledby={`party-slate-trigger-${party.id}`}
                                                            className="overflow-x-auto px-2 pt-2 pb-3 sm:px-4"
                                                        >
                                                            {party.candidates
                                                                .length ===
                                                            0 ? (
                                                                <p className="px-2 py-2 text-sm text-muted-foreground">
                                                                    No nominees
                                                                    yet. Use Add
                                                                    nominee to
                                                                    attach each
                                                                    person to
                                                                    this slate.
                                                                </p>
                                                            ) : (
                                                                <table className="w-full min-w-[820px] text-sm">
                                                                    <thead>
                                                                        <tr className="border-b text-left">
                                                                            <th className="w-14 px-2 py-2 font-medium">
                                                                                Photo
                                                                            </th>
                                                                            <th className="px-2 py-2 font-medium">
                                                                                Candidate
                                                                            </th>
                                                                            <th className="px-2 py-2 font-medium">
                                                                                Running
                                                                                for
                                                                            </th>
                                                                            <th className="px-2 py-2 font-medium">
                                                                                Dept
                                                                                /
                                                                                race
                                                                                scope
                                                                            </th>
                                                                            <th className="px-2 py-2 font-medium">
                                                                                Nominee
                                                                                program
                                                                            </th>
                                                                            <th className="px-2 py-2 font-medium">
                                                                                Platform
                                                                            </th>
                                                                            <th className="px-2 py-2 text-right font-medium">
                                                                                Actions
                                                                            </th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {party.candidates.map(
                                                                            (
                                                                                row,
                                                                            ) => (
                                                                                <tr
                                                                                    key={
                                                                                        row.id
                                                                                    }
                                                                                    className="border-b border-border/80 last:border-0"
                                                                                >
                                                                                    <td className="px-2 py-2">
                                                                                        {row.photo_url ? (
                                                                                            <img
                                                                                                src={
                                                                                                    row.photo_url
                                                                                                }
                                                                                                alt={
                                                                                                    row.full_name
                                                                                                }
                                                                                                className="size-10 rounded-md object-cover ring-1 ring-border"
                                                                                            />
                                                                                        ) : (
                                                                                            <span className="text-xs text-muted-foreground">
                                                                                                —
                                                                                            </span>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-2 py-2 font-medium">
                                                                                        {
                                                                                            row.full_name
                                                                                        }
                                                                                    </td>
                                                                                    <td className="px-2 py-2 text-muted-foreground">
                                                                                        {
                                                                                            row.position_name
                                                                                        }
                                                                                    </td>
                                                                                    <td className="px-2 py-2 text-xs text-muted-foreground">
                                                                                        {
                                                                                            row.department
                                                                                        }
                                                                                    </td>
                                                                                    <td className="px-2 py-2 text-xs text-muted-foreground">
                                                                                        {row.candidate_course_id !==
                                                                                        null
                                                                                            ? (courses.find(
                                                                                                  (
                                                                                                      c,
                                                                                                  ) =>
                                                                                                      c.id ===
                                                                                                      row.candidate_course_id,
                                                                                              )
                                                                                                  ?.code ??
                                                                                              '—')
                                                                                            : '—'}
                                                                                    </td>
                                                                                    <td className="max-w-[14rem] px-2 py-2 text-xs text-muted-foreground">
                                                                                        {row.platform ??
                                                                                            '—'}
                                                                                    </td>
                                                                                    <td className="px-2 py-2 text-right">
                                                                                        <div className="flex justify-end gap-2">
                                                                                            <Button
                                                                                                type="button"
                                                                                                variant="outline"
                                                                                                size="sm"
                                                                                                onClick={() =>
                                                                                                    setSlateNomineeDialog(
                                                                                                        {
                                                                                                            mode: 'edit',
                                                                                                            election,
                                                                                                            party,
                                                                                                            nominee:
                                                                                                                row,
                                                                                                        },
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                <Pencil className="size-4" />
                                                                                                <span className="sr-only">
                                                                                                    Edit
                                                                                                    nominee
                                                                                                </span>
                                                                                            </Button>
                                                                                            <Button
                                                                                                type="button"
                                                                                                variant="outline"
                                                                                                size="sm"
                                                                                                className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:text-destructive-foreground"
                                                                                                onClick={() =>
                                                                                                    setDeleteNominee(
                                                                                                        {
                                                                                                            election,
                                                                                                            party,
                                                                                                            nominee:
                                                                                                                row,
                                                                                                        },
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                <Trash2 className="size-4" />
                                                                                                <span className="sr-only">
                                                                                                    Remove
                                                                                                    nominee
                                                                                                </span>
                                                                                            </Button>
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            ),
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            )}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            );
                                        })
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Dialog
                open={partyDialog !== null}
                onOpenChange={(open) => !open && setPartyDialog(null)}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                    {partyDialog !== null ? (
                        <>
                            <DialogHeader>
                                <DialogTitle>
                                    {partyDialog.mode === 'create'
                                        ? 'Add party'
                                        : 'Edit party'}
                                </DialogTitle>
                                <DialogDescription>
                                    Election:{' '}
                                    <span className="font-medium text-foreground">
                                        {partyDialog.election.title}
                                    </span>
                                </DialogDescription>
                            </DialogHeader>
                            <Form
                                key={partyFormKey}
                                action={
                                    partyDialog.mode === 'create'
                                        ? PartyController.store.url({
                                              election: partyDialog.election.id,
                                          })
                                        : PartyController.update.url({
                                              election: partyDialog.election.id,
                                              party: partyDialog.party.id,
                                          })
                                }
                                method={
                                    partyDialog.mode === 'create'
                                        ? 'post'
                                        : 'patch'
                                }
                                options={{ preserveScroll: true }}
                                onSuccess={() => {
                                    console.log(
                                        '[AdminPartiesIndex] party saved',
                                        partyDialog.mode,
                                    );
                                    setPartyDialog(null);
                                }}
                                className="grid gap-4"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="party_name">
                                                Party name
                                            </Label>
                                            <Input
                                                id="party_name"
                                                name="name"
                                                required
                                                autoComplete="organization"
                                                defaultValue={
                                                    partyDialog.mode === 'edit'
                                                        ? partyDialog.party.name
                                                        : ''
                                                }
                                            />
                                            <InputError message={errors.name} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="party_scope_course">
                                                Slate scope
                                            </Label>
                                            <select
                                                id="party_scope_course"
                                                name="course_id"
                                                className={selectClasses}
                                                defaultValue={
                                                    partyDialog.mode === 'edit'
                                                        ? partyDialog.party
                                                              .course_id ===
                                                          null
                                                            ? ''
                                                            : String(
                                                                  partyDialog
                                                                      .party
                                                                      .course_id,
                                                              )
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
                                            <p className="text-xs leading-snug text-muted-foreground">
                                                Program slates only open ballot
                                                lines for that program; role
                                                titles reuse a line when the
                                                wording matches exactly.
                                            </p>
                                            <InputError
                                                message={errors.course_id}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="party_short">
                                                Short label{' '}
                                                <span className="font-normal text-muted-foreground">
                                                    (optional)
                                                </span>
                                            </Label>
                                            <Input
                                                id="party_short"
                                                name="short_name"
                                                maxLength={120}
                                                autoComplete="off"
                                                defaultValue={
                                                    partyDialog.mode === 'edit'
                                                        ? (partyDialog.party
                                                              .short_name ?? '')
                                                        : ''
                                                }
                                            />
                                            <InputError
                                                message={errors.short_name}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="party_sort">
                                                Sort order{' '}
                                                <span className="font-normal text-muted-foreground">
                                                    (optional)
                                                </span>
                                            </Label>
                                            <Input
                                                id="party_sort"
                                                name="sort_order"
                                                type="number"
                                                min={0}
                                                max={65535}
                                                defaultValue={
                                                    partyDialog.mode === 'edit'
                                                        ? partyDialog.party
                                                              .sort_order
                                                        : ''
                                                }
                                            />
                                            <InputError
                                                message={errors.sort_order}
                                            />
                                        </div>
                                        <DialogFooter className="gap-2 sm:gap-0">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    setPartyDialog(null)
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
                                                    : partyDialog.mode ===
                                                        'create'
                                                      ? 'Add party'
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

            <Dialog
                open={slateNomineeDialog !== null}
                onOpenChange={(open) => !open && setSlateNomineeDialog(null)}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    {slateNomineeDialog !== null ? (
                        <>
                            <DialogHeader>
                                <DialogTitle>
                                    {slateNomineeDialog.mode === 'create'
                                        ? 'Add nominee'
                                        : 'Edit nominee'}
                                </DialogTitle>
                                <DialogDescription>
                                    Party{' '}
                                    <span className="font-medium text-foreground">
                                        {slateNomineeDialog.party.name}
                                    </span>{' '}
                                    ({slateNomineeDialog.party.scope_label}) ·
                                    Election{' '}
                                    <span className="font-medium text-foreground">
                                        {slateNomineeDialog.election.title}
                                    </span>
                                </DialogDescription>
                            </DialogHeader>
                            <p className="px-px pb-2 text-xs leading-snug text-muted-foreground">
                                The role creates or reuses a ballot line with
                                the same title for this election and slate scope
                                ({slateNomineeDialog.party.scope_label}).
                            </p>
                            <Form
                                key={nomineeFormKey}
                                action={
                                    slateNomineeDialog.mode === 'create'
                                        ? PartyController.storeSlateCandidate.url(
                                              {
                                                  election:
                                                      slateNomineeDialog
                                                          .election.id,
                                                  party: slateNomineeDialog
                                                      .party.id,
                                              },
                                          )
                                        : PartyController.updateSlateCandidate.url(
                                              {
                                                  election:
                                                      slateNomineeDialog
                                                          .election.id,
                                                  party: slateNomineeDialog
                                                      .party.id,
                                                  candidate:
                                                      slateNomineeDialog.nominee
                                                          .id,
                                              },
                                          )
                                }
                                method="post"
                                options={{ preserveScroll: true }}
                                onSuccess={() => {
                                    console.log(
                                        '[AdminPartiesIndex] nominee saved',
                                    );
                                    setSlateNomineeDialog(null);
                                }}
                                className="grid gap-4"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        {slateNomineeDialog.mode === 'edit' ? (
                                            <input
                                                type="hidden"
                                                name="_method"
                                                value="patch"
                                            />
                                        ) : null}
                                        <div className="grid gap-2">
                                            <Label htmlFor="nominee_role">
                                                Position / role (title)
                                            </Label>
                                            <Input
                                                id="nominee_role"
                                                name="position_name"
                                                required
                                                placeholder="e.g. President, Chief delegate"
                                                autoComplete="organization-title"
                                                defaultValue={
                                                    slateNomineeDialog.mode ===
                                                    'edit'
                                                        ? slateNomineeDialog
                                                              .nominee
                                                              .position_name
                                                        : ''
                                                }
                                            />
                                            <InputError
                                                message={errors.position_name}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="nominee_full_name">
                                                Full name
                                            </Label>
                                            <Input
                                                id="nominee_full_name"
                                                name="full_name"
                                                required
                                                autoComplete="name"
                                                defaultValue={
                                                    slateNomineeDialog.mode ===
                                                    'edit'
                                                        ? slateNomineeDialog
                                                              .nominee.full_name
                                                        : ''
                                                }
                                            />
                                            <InputError
                                                message={errors.full_name}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="nominee_platform">
                                                Platform{' '}
                                                <span className="font-normal text-muted-foreground">
                                                    (optional)
                                                </span>
                                            </Label>
                                            <textarea
                                                id="nominee_platform"
                                                name="platform"
                                                rows={4}
                                                className={cn(
                                                    'flex min-h-[88px] w-full resize-y rounded-md border border-input px-3 py-2 text-sm shadow-xs outline-none',
                                                    'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                                )}
                                                defaultValue={
                                                    slateNomineeDialog.mode ===
                                                    'edit'
                                                        ? (slateNomineeDialog
                                                              .nominee
                                                              .platform ?? '')
                                                        : ''
                                                }
                                            />
                                            <InputError
                                                message={errors.platform}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="nominee_photo">
                                                Photo{' '}
                                                <span className="font-normal text-muted-foreground">
                                                    (optional)
                                                </span>
                                            </Label>
                                            {slateNomineeDialog.mode ===
                                                'edit' &&
                                            slateNomineeDialog.nominee
                                                .photo_url ? (
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <img
                                                        src={
                                                            slateNomineeDialog
                                                                .nominee
                                                                .photo_url ?? ''
                                                        }
                                                        alt={
                                                            slateNomineeDialog
                                                                .nominee
                                                                .full_name
                                                        }
                                                        className="size-16 rounded-md object-cover ring-1 ring-border"
                                                    />
                                                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                                                        <input
                                                            type="checkbox"
                                                            name="clear_photo"
                                                            value="1"
                                                            className="size-4 rounded border border-input"
                                                        />
                                                        Remove current photo
                                                    </label>
                                                </div>
                                            ) : null}
                                            <Input
                                                id="nominee_photo"
                                                name="photo"
                                                type="file"
                                                accept="image/jpeg,image/png,image/gif,image/webp"
                                                disabled={
                                                    nomineePhotoCompressing ||
                                                    processing
                                                }
                                                onChange={async (event) => {
                                                    const input =
                                                        event.currentTarget;
                                                    const chosen =
                                                        input.files?.[0];
                                                    if (!chosen) {
                                                        return;
                                                    }
                                                    if (
                                                        chosen.size <=
                                                        NOMINEE_PHOTO_MAX_BYTES
                                                    ) {
                                                        return;
                                                    }
                                                    setNomineePhotoCompressing(
                                                        true,
                                                    );
                                                    try {
                                                        const compressed =
                                                            await compressNomineePhotoIfNeeded(
                                                                chosen,
                                                            );
                                                        const dt =
                                                            new DataTransfer();
                                                        dt.items.add(
                                                            compressed,
                                                        );
                                                        input.files = dt.files;
                                                        console.log(
                                                            '[AdminPartiesIndex] nominee photo after compress attempt',
                                                            chosen.size,
                                                            '→',
                                                            compressed.size,
                                                        );
                                                        if (
                                                            compressed.size >
                                                            NOMINEE_PHOTO_MAX_BYTES
                                                        ) {
                                                            toast.error(
                                                                'This image is still over 3 MB after compression. Choose a smaller file.',
                                                            );
                                                            input.value = '';
                                                        }
                                                    } catch (err) {
                                                        console.log(
                                                            '[AdminPartiesIndex] nominee photo compress error',
                                                            err,
                                                        );
                                                        toast.error(
                                                            'Could not process this image.',
                                                        );
                                                        input.value = '';
                                                    } finally {
                                                        setNomineePhotoCompressing(
                                                            false,
                                                        );
                                                    }
                                                }}
                                                className="cursor-pointer text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:text-primary-foreground file:hover:bg-primary/90"
                                            />
                                            {nomineePhotoCompressing ? (
                                                <p className="text-xs text-muted-foreground">
                                                    Compressing image so it fits
                                                    the 3 MB limit…
                                                </p>
                                            ) : null}
                                            <p className="text-xs text-muted-foreground">
                                                JPEG, PNG, GIF, or WebP · max 3
                                                MB (large images are compressed
                                                in the browser) · run{' '}
                                                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.7rem]">
                                                    php artisan storage:link
                                                </code>{' '}
                                                so uploads are visible.
                                            </p>
                                            <InputError
                                                message={errors.photo}
                                            />
                                        </div>
                                        {slateNomineeDialog.party.course_id ===
                                        null ? (
                                            <div className="grid gap-2">
                                                <Label htmlFor="nominee_course">
                                                    Nominee&apos;s program{' '}
                                                    <span className="font-normal text-muted-foreground">
                                                        (optional)
                                                    </span>
                                                </Label>
                                                <select
                                                    id="nominee_course"
                                                    name="course_id"
                                                    className={selectClasses}
                                                    defaultValue={
                                                        slateNomineeDialog.mode ===
                                                            'edit' &&
                                                        slateNomineeDialog
                                                            .nominee
                                                            .candidate_course_id !==
                                                            null
                                                            ? String(
                                                                  slateNomineeDialog
                                                                      .nominee
                                                                      .candidate_course_id,
                                                              )
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
                                        ) : (
                                            <p className="text-xs leading-snug text-muted-foreground">
                                                Nominee&apos;s program is set to{' '}
                                                <span className="font-medium text-foreground">
                                                    {
                                                        slateNomineeDialog.party
                                                            .course?.code
                                                    }
                                                </span>{' '}
                                                automatically for program
                                                slates.
                                            </p>
                                        )}
                                        <DialogFooter className="gap-2 sm:gap-0">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    setSlateNomineeDialog(null)
                                                }
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={
                                                    processing ||
                                                    nomineePhotoCompressing
                                                }
                                            >
                                                {nomineePhotoCompressing
                                                    ? 'Compressing…'
                                                    : processing
                                                      ? 'Saving…'
                                                      : slateNomineeDialog.mode ===
                                                          'create'
                                                        ? 'Add nominee'
                                                        : 'Save nominee'}
                                            </Button>
                                        </DialogFooter>
                                    </>
                                )}
                            </Form>
                        </>
                    ) : null}
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteParty !== null}
                onOpenChange={(open) => !open && setDeleteParty(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Remove party?</DialogTitle>
                        <DialogDescription>
                            Slate nominees lose this party association (votes
                            already cast stay recorded).
                        </DialogDescription>
                    </DialogHeader>
                    {deleteParty !== null ? (
                        <Form
                            action={PartyController.destroy.url({
                                election: deleteParty.election.id,
                                party: deleteParty.party.id,
                            })}
                            method="delete"
                            options={{ preserveScroll: true }}
                            onSuccess={() => {
                                console.log(
                                    '[AdminPartiesIndex] party deleted',
                                    deleteParty.party.id,
                                );
                                setDeleteParty(null);
                            }}
                            className="contents"
                        >
                            {({ processing }) => (
                                <DialogFooter className="gap-2 sm:gap-0">
                                    <Button
                                        variant="outline"
                                        type="button"
                                        onClick={() => setDeleteParty(null)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        disabled={processing}
                                    >
                                        Remove
                                    </Button>
                                </DialogFooter>
                            )}
                        </Form>
                    ) : null}
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteNominee !== null}
                onOpenChange={(open) => !open && setDeleteNominee(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Remove nominee?</DialogTitle>
                        <DialogDescription>
                            Removes this person from this party slate and
                            removes their ballot row if nobody has voted for
                            them yet.
                        </DialogDescription>
                    </DialogHeader>
                    {deleteNominee !== null ? (
                        <Form
                            action={PartyController.destroySlateCandidate.url({
                                election: deleteNominee.election.id,
                                party: deleteNominee.party.id,
                                candidate: deleteNominee.nominee.id,
                            })}
                            method="delete"
                            options={{ preserveScroll: true }}
                            onSuccess={() => {
                                console.log(
                                    '[AdminPartiesIndex] nominee deleted',
                                    deleteNominee.nominee.id,
                                );
                                setDeleteNominee(null);
                            }}
                            className="contents"
                        >
                            {({ processing }) => (
                                <DialogFooter className="gap-2 sm:gap-0">
                                    <Button
                                        variant="outline"
                                        type="button"
                                        onClick={() => setDeleteNominee(null)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        disabled={processing}
                                    >
                                        Remove nominee
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
