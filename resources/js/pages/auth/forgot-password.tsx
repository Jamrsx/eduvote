import PasswordResetLinkController from '@/actions/Laravel/Fortify/Http/Controllers/PasswordResetLinkController';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/routes';
import { Form, Head } from '@inertiajs/react';

type Props = {
    status?: string;
};

export default function ForgotPassword({ status }: Props) {
    return (
        <>
            <Head title="Forgot password" />
            <div className="space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-xl font-semibold tracking-tight">
                        Forgot password
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Enter your email to receive a reset link.
                    </p>
                </div>
                {status && (
                    <div className="rounded-md bg-muted/80 px-3 py-2 text-center text-sm font-medium text-muted-foreground">
                        {status}
                    </div>
                )}
                <Form
                    action={PasswordResetLinkController.store.url()}
                    method="post"
                    className="flex flex-col gap-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    autoComplete="username"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>
                            <Button type="submit" className="w-full" disabled={processing}>
                                Email password reset link
                            </Button>
                        </>
                    )}
                </Form>
                <div className="text-center text-sm text-muted-foreground">
                    <TextLink href={login()}>Back to log in</TextLink>
                </div>
            </div>
        </>
    );
}
