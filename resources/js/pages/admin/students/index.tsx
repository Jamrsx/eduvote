import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Users } from 'lucide-react';
import { Head } from '@inertiajs/react';

export default function AdminStudentsIndex() {
    return (
        <>
            <Head title="Students" />

            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight">
                        Students
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Student user accounts and enrollment profiles (admin-created).
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Users
                                className="size-5 text-muted-foreground"
                                aria-hidden
                            />
                            <CardTitle>What you will manage here</CardTitle>
                        </div>
                        <CardDescription>
                            Next: create student users (
                            <code className="rounded bg-muted px-1 py-0.5 text-xs">
                                role = student
                            </code>
                            ), link{' '}
                            <code className="rounded bg-muted px-1 py-0.5 text-xs">
                                student_profiles
                            </code>{' '}
                            (student ID, course, section, year level).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        <ul className="list-disc space-y-1 pl-5">
                            <li>No public registration — accounts originate here or via import</li>
                            <li>Profiles drive eligibility for department-only races</li>
                            <li>Unique student identifier within this database</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
