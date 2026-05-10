import { Button } from '@/components/ui/button';
import { logout } from '@/routes';
import { Form, Head, usePage } from '@inertiajs/react';
import { Info } from 'lucide-react';
import { useEffect } from 'react';

type Breadcrumb = { title: string; href: string };

type Props = {
    breadcrumbs: Breadcrumb[];
};

export default function PendingRegistration({ breadcrumbs: _breadcrumbs }: Props) {
    const page = usePage<{
        auth: { user: { email: string; name: string } | null };
    }>();

    useEffect(() => {
        console.log(
            '[PendingRegistration] status pending for',
            page.props.auth.user?.email,
        );
    }, [page.props.auth.user?.email]);

    return (
        <>
            <Head title="Approval pending" />

            <div className="mx-auto max-w-lg space-y-4">
                <div className="flex items-start gap-3 rounded-lg border border-[#006989]/30 bg-[#006989]/5 p-4">
                    <Info
                        className="mt-0.5 size-5 shrink-0 text-[#006989]"
                        aria-hidden
                    />
                    <div className="space-y-2 text-sm leading-relaxed">
                        <p className="font-medium text-foreground">
                            Your registration is waiting for administrator approval.
                        </p>
                        <p className="text-muted-foreground">
                            After your email is verified, an administrator will confirm that
                            your student ID and details match the school roster. You will be
                            able to sign in fully once your account is approved.
                        </p>
                    </div>
                </div>

                <Form
                    action={logout().url}
                    method="post"
                    className="flex justify-center"
                >
                    <Button type="submit" variant="outline">
                        Log out
                    </Button>
                </Form>
            </div>
        </>
    );
}
