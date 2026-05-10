import SchoolRosterController from '@/actions/App/Http/Controllers/Admin/SchoolRosterController';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { accentButtonOutline } from '@/lib/admin-accent';
import { cn } from '@/lib/utils';
import { index as rosterIndex } from '@/routes/admin/roster';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Download, Search, Trash2, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

type Entry = {
    id: number;
    student_id: string;
    email: string | null;
    full_name: string | null;
};

type Props = {
    entries: Entry[];
};

function normalizeQuery(q: string): string {
    return q.trim().toLowerCase();
}

function entryMatchesSearch(entry: Entry, query: string): boolean {
    const q = normalizeQuery(query);
    if (q === '') {
        return true;
    }
    const parts = [entry.student_id, entry.email, entry.full_name];
    const blob = parts.filter(Boolean).join(' ').toLowerCase();
    return blob.includes(q);
}

export default function AdminSchoolRosterMasterList({ entries }: Props) {
    const page = usePage<{
        flash?: { success?: string | null };
        errors?: { excel?: string };
    }>();

    const importInputRef = useRef<HTMLInputElement>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredEntries = useMemo(
        () => entries.filter((e) => entryMatchesSearch(e, searchQuery)),
        [entries, searchQuery],
    );

    useEffect(() => {
        const msg = page.props.flash?.success;
        if (msg) {
            toast.success(msg);
        }
    }, [page.props.flash?.success]);

    useEffect(() => {
        const excelErr = page.props.errors?.excel;
        if (excelErr) {
            toast.error(excelErr);
        }
    }, [page.props.errors?.excel]);

    useEffect(() => {
        console.log('[AdminSchoolRosterMasterList] entries', entries.length);
    }, [entries.length]);

    const searchActive = normalizeQuery(searchQuery) !== '';

    return (
        <>
            <Head title="Master list" />

            <div className="flex flex-col gap-6">
                <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-2xl space-y-1">
                        <h1 className="text-xl font-semibold tracking-tight">
                            Master list
                        </h1>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Import the official roster from Excel and maintain student IDs
                            and optional emails. Use this list to verify self-registrations on
                            the pending page.
                        </p>
                    </div>
                    <Button variant="outline" className={accentButtonOutline} asChild>
                        <Link href={rosterIndex().url} prefetch>
                            Pending registrations
                        </Link>
                    </Button>
                </header>

                <div className="relative max-w-xl">
                    <Search
                        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                        aria-hidden
                    />
                    <Input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search student ID, email, name…"
                        className="pl-9"
                        aria-label="Search roster entries"
                        autoComplete="off"
                    />
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Import roster</CardTitle>
                        <CardDescription>
                            Download the template, fill it with student IDs, then upload the
                            .xlsx file. Existing IDs are updated; new IDs are added.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <Button
                            variant="outline"
                            className={cn(accentButtonOutline, 'gap-2')}
                            asChild
                        >
                            <a href={SchoolRosterController.downloadTemplate.url()}>
                                <Download className="size-4 shrink-0" aria-hidden />
                                Download Excel template
                            </a>
                        </Button>
                        <input
                            ref={importInputRef}
                            type="file"
                            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            className="sr-only"
                            id="admin-roster-master-import"
                            onChange={(event) => {
                                const file = event.target.files?.[0] ?? null;
                                event.target.value = '';
                                if (!file) {
                                    return;
                                }
                                console.log(
                                    '[AdminSchoolRosterMasterList] upload',
                                    file.name,
                                );
                                router.post(
                                    SchoolRosterController.import.url(),
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
                            className={cn(accentButtonOutline, 'gap-2')}
                            onClick={() => {
                                console.log('[AdminSchoolRosterMasterList] pick file');
                                importInputRef.current?.click();
                            }}
                        >
                            <Upload className="size-4 shrink-0" aria-hidden />
                            Import Excel
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                            Entries ({entries.length})
                            {searchActive && entries.length > 0 ? (
                                <span className="text-muted-foreground ml-2 text-sm font-normal">
                                    · {filteredEntries.length} match search
                                </span>
                            ) : null}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        {entries.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                No roster rows yet. Import an Excel file to populate this
                                list.
                            </p>
                        ) : filteredEntries.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                No roster rows match your search. Clear or change the search
                                field.
                            </p>
                        ) : (
                            <div className="divide-y rounded-lg border">
                                <div className="bg-muted/40 text-muted-foreground hidden grid-cols-[1fr_1fr_1fr_auto] gap-3 px-4 py-2 text-xs font-medium uppercase tracking-wide md:grid">
                                    <span>Student ID</span>
                                    <span>Email</span>
                                    <span className="hidden lg:inline">Full name</span>
                                    <span className="text-end">Actions</span>
                                </div>
                                {filteredEntries.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="flex flex-col gap-3 px-4 py-3 md:grid md:grid-cols-[1fr_1fr_1fr_auto] md:items-center md:gap-3"
                                    >
                                        <div className="font-medium">{entry.student_id}</div>
                                        <div className="truncate text-muted-foreground text-sm">
                                            {entry.email ?? '—'}
                                        </div>
                                        <div className="hidden truncate text-sm lg:block">
                                            {entry.full_name ?? '—'}
                                        </div>
                                        <div className="flex justify-end md:justify-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:bg-destructive/10"
                                                aria-label={`Remove ${entry.student_id}`}
                                                onClick={() => {
                                                    if (
                                                        !confirm(
                                                            `Remove roster row ${entry.student_id}?`,
                                                        )
                                                    ) {
                                                        return;
                                                    }
                                                    router.delete(
                                                        SchoolRosterController.destroy.url({
                                                            school_roster_entry: entry.id,
                                                        }),
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    );
                                                }}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
