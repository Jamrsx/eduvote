import { Button } from '@/components/ui/button';
import TextLink from '@/components/text-link';
import { login, logout } from '@/routes';
import { Form, Head } from '@inertiajs/react';
import { ShieldOff } from 'lucide-react';

export default function AccountDisabled() {
    return (
        <>
            <Head title="Account disabled" />

            <div className="mx-auto max-w-lg space-y-6 text-center">
                <div className="flex flex-col items-center gap-3">
                    <ShieldOff
                        className="text-muted-foreground size-10"
                        aria-hidden
                    />
                    <h1 className="text-lg font-semibold tracking-tight">
                        Account disabled
                    </h1>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Your student account has been disabled by an administrator. You
                        cannot access voting or other student features until it is enabled
                        again. Contact your school office if you need help.
                    </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <TextLink
                        href={login().url}
                        className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium"
                    >
                        Back to log in
                    </TextLink>
                    <Form action={logout().url} method="post" className="inline-flex">
                        <Button type="submit" variant="ghost">
                            Log out
                        </Button>
                    </Form>
                </div>
            </div>
        </>
    );
}
