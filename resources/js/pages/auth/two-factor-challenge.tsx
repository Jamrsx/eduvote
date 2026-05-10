import TwoFactorAuthenticatedSessionController from '@/actions/Laravel/Fortify/Http/Controllers/TwoFactorAuthenticatedSessionController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, Head } from '@inertiajs/react';

export default function TwoFactorChallenge() {
    return (
        <>
            <Head title="Two-factor authentication" />
            <div className="space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-xl font-semibold tracking-tight">
                        Authentication code
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Enter the code from your authenticator app, or use a
                        recovery code.
                    </p>
                </div>
                <Form
                    action={TwoFactorAuthenticatedSessionController.store.url()}
                    method="post"
                    resetOnSuccess={false}
                    className="flex flex-col gap-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="code">Code</Label>
                                <Input
                                    id="code"
                                    name="code"
                                    required
                                    autoFocus
                                    autoComplete="one-time-code"
                                    placeholder="000000"
                                />
                                <InputError message={errors.code} />
                            </div>
                            <Button type="submit" className="w-full" disabled={processing}>
                                Continue
                            </Button>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
