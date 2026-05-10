import AuthenticatedSessionController from '@/actions/Laravel/Fortify/Http/Controllers/AuthenticatedSessionController';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { request as forgotPasswordRequest } from '@/routes/password';
import { register } from '@/routes';
import { Form, Head, Link } from '@inertiajs/react';

type Props = {
    canResetPassword: boolean;
    canRegister: boolean;
    status?: string;
};

export default function Login({ canResetPassword, canRegister, status }: Props) {
    return (
        <>
            <Head title="Log in" />

            <div className="space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-xl font-semibold tracking-tight">
                        Log in to your account
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Enter your email and password below to continue.
                    </p>
                </div>

                {status && (
                    <div className="rounded-md bg-muted/80 px-3 py-2 text-center text-sm font-medium text-muted-foreground">
                        {status}
                    </div>
                )}

                <Form
                    action={AuthenticatedSessionController.store.url()}
                    method="post"
                    resetOnSuccess={['password']}
                    className="flex flex-col gap-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="username"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={forgotPasswordRequest.url()}
                                            className="text-sm"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox id="remember" name="remember" tabIndex={3} />
                                <Label htmlFor="remember">Remember me</Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                Log in
                            </Button>

                            {canRegister && (
                                <p className="text-center text-sm text-muted-foreground">
                                    New student?{' '}
                                    <Link
                                        href={register().url}
                                        className="font-medium text-foreground underline underline-offset-4"
                                    >
                                        Create an account
                                    </Link>
                                </p>
                            )}
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
