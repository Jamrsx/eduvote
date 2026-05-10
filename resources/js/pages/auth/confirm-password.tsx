import ConfirmablePasswordController from '@/actions/Laravel/Fortify/Http/Controllers/ConfirmablePasswordController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, Head } from '@inertiajs/react';

export default function ConfirmPassword() {
    return (
        <>
            <Head title="Confirm password" />
            <div className="space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-xl font-semibold tracking-tight">
                        Confirm your password
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        This is a secure area. Please confirm your password before
                        continuing.
                    </p>
                </div>
                <Form
                    action={ConfirmablePasswordController.store.url()}
                    method="post"
                    resetOnSuccess={['password']}
                    className="flex flex-col gap-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    autoFocus
                                    autoComplete="current-password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>
                            <Button type="submit" className="w-full" disabled={processing}>
                                Confirm
                            </Button>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
