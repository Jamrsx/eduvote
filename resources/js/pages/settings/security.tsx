import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import userPassword from '@/routes/user-password';
import { Form, Head } from '@inertiajs/react';

type Props = {
    canManageTwoFactor: boolean;
    twoFactorEnabled?: boolean;
    requiresConfirmation?: boolean;
};

export default function Security({
    canManageTwoFactor,
    twoFactorEnabled,
}: Props) {
    return (
        <>
            <Head title="Security settings" />

            <div className="space-y-10">
                <Heading
                    title="Security"
                    description="Manage password and account protection"
                />

                <section className="max-w-xl space-y-4">
                    <Heading
                        variant="small"
                        title="Update password"
                        description="Ensure your account uses a long, random password"
                    />
                    <Form
                        action={userPassword.update.url()}
                        method="put"
                        options={{ preserveScroll: true }}
                        resetOnSuccess={[
                            'current_password',
                            'password',
                            'password_confirmation',
                        ]}
                        className="space-y-4"
                    >
                        {({ errors, processing, recentlySuccessful }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="current_password">
                                        Current password
                                    </Label>
                                    <PasswordInput
                                        id="current_password"
                                        name="current_password"
                                        autoComplete="current-password"
                                        placeholder="Current password"
                                    />
                                    <InputError message={errors.current_password} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password">New password</Label>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        autoComplete="new-password"
                                        placeholder="New password"
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
                                        autoComplete="new-password"
                                        placeholder="Confirm password"
                                    />
                                    <InputError
                                        message={errors.password_confirmation}
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <Button disabled={processing}>Update password</Button>
                                    {recentlySuccessful && (
                                        <p className="text-sm text-muted-foreground">
                                            Saved.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </Form>
                </section>

                {canManageTwoFactor && (
                    <section className="max-w-xl space-y-2 rounded-lg border border-border p-4">
                        <Heading
                            variant="small"
                            title="Two-factor authentication"
                            description="Add an extra layer of security to your account."
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Status:
                            </span>
                            {twoFactorEnabled ? (
                                <Badge>Enabled</Badge>
                            ) : (
                                <Badge variant="secondary">Disabled</Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Full setup UI will live here (authenticator QR and recovery
                            codes).
                        </p>
                    </section>
                )}
            </div>
        </>
    );
}
