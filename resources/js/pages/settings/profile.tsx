import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { send } from '@/routes/verification';
import { Form, Head, usePage } from '@inertiajs/react';

type Props = {
    mustVerifyEmail: boolean;
    status?: string;
};

export default function ProfileSettings({ mustVerifyEmail, status }: Props) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Profile settings" />

            <div className="space-y-6">
                <Heading
                    title="Profile information"
                    description="Update your name and email address"
                />

                {mustVerifyEmail && auth.user.email_verified_at === null && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
                        <p className="font-medium">Email unverified</p>
                        <p className="mt-1">
                            Your email address is unverified. Click below to send a
                            new verification link.
                        </p>
                        <Form
                            action={send.url()}
                            method="post"
                            className="mt-3 inline"
                        >
                            {({ processing }) => (
                                <Button
                                    type="submit"
                                    variant="outline"
                                    size="sm"
                                    disabled={processing}
                                >
                                    Resend verification email
                                </Button>
                            )}
                        </Form>
                        {status === 'verification-link-sent' && (
                            <p className="mt-2 font-medium">
                                A new verification link has been sent.
                            </p>
                        )}
                    </div>
                )}

                <Form
                    action={ProfileController.update.url()}
                    method="patch"
                    options={{
                        preserveScroll: true,
                    }}
                    className="max-w-xl space-y-6"
                >
                    {({ processing, errors, recentlySuccessful }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="Full name"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder="Email address"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="flex items-center gap-4">
                                <Button disabled={processing}>Save</Button>
                                {recentlySuccessful && (
                                    <p className="text-sm text-muted-foreground">
                                        Saved.
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
        </>
    );
}
