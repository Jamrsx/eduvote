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
import { cn } from '@/lib/utils';
import { Form, Head, usePage } from '@inertiajs/react';
import { Flag, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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
                        <p className="text-muted-foreground text-sm">
                            Create a party for an election as campus-wide or for a single
                            program (e.g. BSIT). Add each nominee with a typed role
                            title, platform, and{' '}
                            <span className="text-foreground font-medium">
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
                                    Add an election under Election schedule first, then
                                    set up parties here. Nominee roles create matching
                                    ballot lines automatically.
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
                                            Party names are unique within this election.
                                            Type any role when adding a nominee (e.g.
                                            President, Chief delegate). Program slates
                                            keep those lines tied to that program.
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
                                        <p className="text-muted-foreground text-sm">
                                            No parties for this election yet.
                                        </p>
                                    ) : (
                                        election.parties.map((party) => (
                                            <div
                                                key={party.id}
                                                className="bg-muted/15 rounded-lg border"
                                            >
                                                <div className="flex flex-wrap items-start justify-between gap-2 border-b px-4 py-3">
                                                    <div className="min-w-0">
                                                        <p className="font-medium">
                                                            {party.name}
                                                            {party.short_name ? (
                                                                <span className="text-muted-foreground font-normal">
                                                                    {' '}
                                                                    (
                                                                    {
                                                                        party.short_name
                                                                    }
                                                                    )
                                                                </span>
                                                            ) : null}
                                                        </p>
                                                        <div className="text-muted-foreground mt-1 flex flex-wrap gap-2 text-xs">
                                                            <Badge
                                                                variant="secondary"
                                                                className="font-normal"
                                                            >
                                                                {party.scope_label}
                                                            </Badge>
                                                            <span>
                                                                Sort{' '}
                                                                {party.sort_order}
                                                                ·{' '}
                                                                {
                                                                    party.candidates
                                                                        .length
                                                                }{' '}
                                                                nominee
                                                                {party.candidates
                                                                    .length ===
                                                                1
                                                                    ? ''
                                                                    : 's'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex shrink-0 flex-wrap gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSlateNomineeDialog({
                                                                    mode: 'create',
                                                                    election,
                                                                    party,
                                                                });
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
                                                                setPartyDialog({
                                                                    mode: 'edit',
                                                                    election,
                                                                    party,
                                                                })
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
                                                            className="text-destructive hover:bg-destructive/10"
                                                            onClick={() =>
                                                                setDeleteParty({
                                                                    election,
                                                                    party,
                                                                })
                                                            }
                                                        >
                                                            <Trash2 className="size-4" />
                                                            <span className="sr-only">
                                                                Delete party
                                                            </span>
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="overflow-x-auto px-2 pb-3 pt-2 sm:px-4">
                                                    {party.candidates.length ===
                                                    0 ? (
                                                        <p className="text-muted-foreground px-2 py-2 text-sm">
                                                            No nominees yet. Use Add
                                                            nominee to attach each
                                                            person to this slate.
                                                        </p>
                                                    ) : (
                                                        <table className="w-full min-w-[760px] text-sm">
                                                            <thead>
                                                                <tr className="border-b text-left">
                                                                    <th className="px-2 py-2 font-medium">
                                                                        Candidate
                                                                    </th>
                                                                    <th className="px-2 py-2 font-medium">
                                                                        Running for
                                                                    </th>
                                                                    <th className="px-2 py-2 font-medium">
                                                                        Dept / race
                                                                        scope
                                                                    </th>
                                                                    <th className="px-2 py-2 font-medium">
                                                                        Nominee program
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
                                                                    (row) => (
                                                                        <tr
                                                                            key={
                                                                                row.id
                                                                            }
                                                                            className="border-b border-border/80 last:border-0"
                                                                        >
                                                                            <td className="px-2 py-2 font-medium">
                                                                                {
                                                                                    row.full_name
                                                                                }
                                                                            </td>
                                                                            <td className="text-muted-foreground px-2 py-2">
                                                                                {
                                                                                    row.position_name
                                                                                }
                                                                            </td>
                                                                            <td className="text-muted-foreground px-2 py-2 text-xs">
                                                                                {
                                                                                    row.department
                                                                                }
                                                                            </td>
                                                                            <td className="text-muted-foreground px-2 py-2 text-xs">
                                                                                {row.candidate_course_id !==
                                                                                null
                                                                                    ? courses.find(
                                                                                          (
                                                                                              c,
                                                                                          ) =>
                                                                                              c.id ===
                                                                                              row.candidate_course_id,
                                                                                      )
                                                                                          ?.code ??
                                                                                      '—'
                                                                                    : '—'}
                                                                            </td>
                                                                            <td className="text-muted-foreground max-w-[14rem] px-2 py-2 text-xs">
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
                                                                                                    mode:
                                                                                                        'edit',
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
                                                                                            Edit nominee
                                                                                        </span>
                                                                                    </Button>
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="outline"
                                                                                        size="sm"
                                                                                        className="text-destructive hover:bg-destructive/10"
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
                                                                                            Remove nominee
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
                                            </div>
                                        ))
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
                                    <span className="text-foreground font-medium">
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
                                    partyDialog.mode === 'create' ? 'post' : 'patch'
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
                                                              .course_id === null
                                                          ? ''
                                                          : String(
                                                                partyDialog.party
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
                                            <p className="text-muted-foreground text-xs leading-snug">
                                                Program slates only open ballot lines
                                                for that program; role titles reuse a
                                                line when the wording matches exactly.
                                            </p>
                                            <InputError message={errors.course_id} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="party_short">
                                                Short label{' '}
                                                <span className="text-muted-foreground font-normal">
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
                                                <span className="text-muted-foreground font-normal">
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
                                                    : partyDialog.mode === 'create'
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
                                    <span className="text-foreground font-medium">
                                        {slateNomineeDialog.party.name}
                                    </span>{' '}
                                    ({slateNomineeDialog.party.scope_label}) · Election{' '}
                                    <span className="text-foreground font-medium">
                                        {slateNomineeDialog.election.title}
                                    </span>
                                </DialogDescription>
                            </DialogHeader>
                            <p className="text-muted-foreground px-px pb-2 text-xs leading-snug">
                                The role creates or reuses a ballot line with the same
                                title for this election and slate scope (
                                {slateNomineeDialog.party.scope_label}).
                            </p>
                            <Form
                                    key={nomineeFormKey}
                                    action={
                                        slateNomineeDialog.mode === 'create'
                                            ? PartyController.storeSlateCandidate.url({
                                                  election:
                                                      slateNomineeDialog.election.id,
                                                  party: slateNomineeDialog.party.id,
                                              })
                                            : PartyController.updateSlateCandidate.url({
                                                  election:
                                                      slateNomineeDialog.election.id,
                                                  party: slateNomineeDialog.party.id,
                                                  candidate:
                                                      slateNomineeDialog.nominee.id,
                                              })
                                    }
                                    method={
                                        slateNomineeDialog.mode === 'create'
                                            ? 'post'
                                            : 'patch'
                                    }
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
                                                            ? slateNomineeDialog.nominee
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
                                                            ? slateNomineeDialog.nominee
                                                                  .full_name
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
                                                    <span className="text-muted-foreground font-normal">
                                                        (optional)
                                                    </span>
                                                </Label>
                                                <textarea
                                                    id="nominee_platform"
                                                    name="platform"
                                                    rows={4}
                                                    className={cn(
                                                        'border-input flex min-h-[88px] w-full resize-y rounded-md border px-3 py-2 text-sm shadow-xs outline-none',
                                                        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                                                    )}
                                                    defaultValue={
                                                        slateNomineeDialog.mode ===
                                                        'edit'
                                                            ? (slateNomineeDialog.nominee
                                                                  .platform ?? '')
                                                            : ''
                                                    }
                                                />
                                                <InputError
                                                    message={errors.platform}
                                                />
                                            </div>
                                            {slateNomineeDialog.party.course_id ===
                                            null ? (
                                                <div className="grid gap-2">
                                                    <Label htmlFor="nominee_course">
                                                        Nominee&apos;s program{' '}
                                                        <span className="text-muted-foreground font-normal">
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
                                                            slateNomineeDialog.nominee
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
                                                                value={String(
                                                                    c.id,
                                                                )}
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
                                                <p className="text-muted-foreground text-xs leading-snug">
                                                    Nominee&apos;s program is set to{' '}
                                                    <span className="text-foreground font-medium">
                                                        {
                                                            slateNomineeDialog.party
                                                                .course?.code
                                                        }
                                                    </span>{' '}
                                                    automatically for program slates.
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
                                                    disabled={processing}
                                                >
                                                    {processing
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
                            Slate nominees lose this party association (votes already
                            cast stay recorded).
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
                            Removes this person from this party slate and removes their
                            ballot row if nobody has voted for them yet.
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
