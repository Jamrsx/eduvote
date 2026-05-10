import { Button } from '@/components/ui/button';
import TextLink from '@/components/text-link';
import { login, logout } from '@/routes';
import { Form, Head } from '@inertiajs/react';
import { AlertCircle } from 'lucide-react';

export default function RegistrationRejected() {
    return (
        <>
            <Head title="Registration not approved" />

            <div className="mx-auto max-w-lg space-y-6 text-center">
                <div className="flex flex-col items-center gap-3">
                    <AlertCircle
                        className="size-10 text-destructive"
                        aria-hidden
                    />
                    <h1 className="text-lg font-semibold tracking-tight">
                        Registration was not approved
                    </h1>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Your student registration does not match school records or was
                        declined by an administrator. If you believe this is a mistake,
                        contact your school office.
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
