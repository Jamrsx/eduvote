import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Upload } from 'lucide-react';
import { Head } from '@inertiajs/react';

export default function AdminImportsIndex() {
    return (
        <>
            <Head title="Imports" />

            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight">
                        Imports
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Bulk student rows and batch tracking for this deployment.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Upload
                                className="size-5 text-muted-foreground"
                                aria-hidden
                            />
                            <CardTitle>What you will manage here</CardTitle>
                        </div>
                        <CardDescription>
                            Next: upload pipelines that fill{' '}
                            <code className="rounded bg-muted px-1 py-0.5 text-xs">
                                student_import_batches
                            </code>{' '}
                            and create/update users and profiles in bulk.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        <ul className="list-disc space-y-1 pl-5">
                            <li>Batch status, row counts, and error logs</li>
                            <li>Validation against existing courses and IDs</li>
                            <li>Idempotent re-runs where supported</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
