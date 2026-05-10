import * as RegisteredUserController from '@/actions/Laravel/Fortify/Http/Controllers/RegisteredUserController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/routes';
import { accentButtonSolid, selectAccentFocus } from '@/lib/admin-accent';
import { cn } from '@/lib/utils';
import { Form, Head } from '@inertiajs/react';

type CourseOption = {
    id: number;
    code: string;
    name: string;
};

type Props = {
    courses: CourseOption[];
};

export default function Register({ courses }: Props) {
    const hasPrograms = courses.length > 0;

    return (
        <>
            <Head title="Student registration" />

            <div className="space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-xl font-semibold tracking-tight">
                        Register as a student
                    </h1>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Create your account with your school email. An administrator will
                        approve it before you can use EduVote.
                    </p>
                </div>

                {!hasPrograms && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-center text-sm text-destructive">
                        Registration is unavailable until your school adds at least one
                        program.
                    </div>
                )}

                <Form
                    action={RegisteredUserController.store.url()}
                    method="post"
                    resetOnSuccess={[
                        'password',
                        'password_confirmation',
                        'name',
                        'email',
                        'student_id',
                        'course_id',
                        'section',
                        'year_level',
                    ]}
                    className="flex flex-col gap-5"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    autoComplete="name"
                                    disabled={!hasPrograms}
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">School email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    placeholder="you@school.edu"
                                    disabled={!hasPrograms}
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="student_id">Student ID</Label>
                                <Input
                                    id="student_id"
                                    name="student_id"
                                    required
                                    autoComplete="off"
                                    disabled={!hasPrograms}
                                />
                                <InputError message={errors.student_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="course_id">Program</Label>
                                <select
                                    id="course_id"
                                    name="course_id"
                                    required
                                    defaultValue=""
                                    disabled={!hasPrograms}
                                    className={cn(selectAccentFocus)}
                                    aria-invalid={Boolean(errors.course_id)}
                                >
                                    <option value="" disabled>
                                        Select program
                                    </option>
                                    {courses.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.code} — {c.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.course_id} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="section">
                                        Section{' '}
                                        <span className="text-muted-foreground font-normal">
                                            (optional)
                                        </span>
                                    </Label>
                                    <Input
                                        id="section"
                                        name="section"
                                        autoComplete="off"
                                        placeholder="e.g. A"
                                        disabled={!hasPrograms}
                                    />
                                    <InputError message={errors.section} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="year_level">
                                        Year level{' '}
                                        <span className="text-muted-foreground font-normal">
                                            (optional)
                                        </span>
                                    </Label>
                                    <Input
                                        id="year_level"
                                        name="year_level"
                                        autoComplete="off"
                                        placeholder="e.g. 4"
                                        disabled={!hasPrograms}
                                    />
                                    <InputError message={errors.year_level} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    autoComplete="new-password"
                                    disabled={!hasPrograms}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    required
                                    autoComplete="new-password"
                                    disabled={!hasPrograms}
                                />
                            </div>

                            <Button
                                type="submit"
                                className={cn(
                                    'w-full',
                                    hasPrograms ? accentButtonSolid : undefined,
                                )}
                                disabled={processing || !hasPrograms}
                            >
                                Create account
                            </Button>
                        </>
                    )}
                </Form>

                <p className="text-muted-foreground text-center text-sm">
                    Already have an account?{' '}
                    <TextLink href={login().url} className="font-medium" tabIndex={0}>
                        Log in
                    </TextLink>
                </p>
            </div>
        </>
    );
}
