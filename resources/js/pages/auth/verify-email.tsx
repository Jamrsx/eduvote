import { Button } from '@/components/ui/button';
import { logout } from '@/routes';
import { send } from '@/routes/verification';
import { Form, Head } from '@inertiajs/react';

type Props = {
    status?: string;
};

export default function VerifyEmail({ status }: Props) {
    return (
        <>
            <Head title="Email verification" />
            <div className="space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-xl font-semibold tracking-tight">
                        Verify your email
                    </h1>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Account sent to Admin — please wait for confirmation. Go to
                        your administrator if you need your account accepted.
                    </p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                        Use the link in your email to verify this address, or resend
                        below.
                    </p>
                </div>
                {status === 'verification-link-sent' && (
                    <div className="rounded-md bg-muted/80 px-3 py-2 text-center text-sm font-medium text-muted-foreground">
                        A new verification link has been sent to your email address.
                    </div>
                )}
                <Form
                    action={send.url()}
                    method="post"
                    className="space-y-4"
                >
                    {({ processing }) => (
                        <Button type="submit" className="w-full" disabled={processing}>
                            Resend verification email
                        </Button>
                    )}
                </Form>
                <Form action={logout().url} method="post" className="text-center">
                    {({ processing }) => (
                        <Button
                            type="submit"
                            variant="link"
                            className="text-muted-foreground"
                            disabled={processing}
                        >
                            Log out
                        </Button>
                    )}
                </Form>
            </div>
        </>
    );
}
