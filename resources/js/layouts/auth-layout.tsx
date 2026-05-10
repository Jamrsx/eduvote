import { Link, usePage } from '@inertiajs/react';
import { type ReactNode, useMemo } from 'react';
import {
    EDUVOTE_LOGO_URL,
    EDUVOTE_LOGIN_LOGO_URL,
} from '@/components/app-logo';
import { home } from '@/routes';

type Props = {
    children: ReactNode;
};

export default function AuthLayout({ children }: Props) {
    const page = usePage();
    const isLoginPage = useMemo(() => {
        const path = page.url.split('?')[0] ?? '';

        return path === '/login' || path.endsWith('/login');
    }, [page.url]);

    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center bg-white p-6 md:p-10 dark:bg-zinc-950">
            <div className="relative z-10 flex w-full max-w-md flex-col gap-6">
                <Link
                    href={home()}
                    className={
                        isLoginPage
                            ? 'flex justify-center'
                            : 'flex items-center justify-center gap-2 font-medium'
                    }
                >
                    {isLoginPage ? (
                        <img
                            src={EDUVOTE_LOGIN_LOGO_URL}
                            alt="EduVote — Trusted student elections"
                            className="h-auto w-full max-w-[min(100%,320px)] object-contain"
                            width={320}
                            height={120}
                            decoding="async"
                        />
                    ) : (
                        <>
                            <img
                                src={EDUVOTE_LOGO_URL}
                                alt=""
                                className="h-9 w-9 object-contain"
                                width={36}
                                height={36}
                                decoding="async"
                            />
                            <span className="text-lg font-semibold tracking-tight">
                                EduVote
                            </span>
                        </>
                    )}
                </Link>
                <div className="rounded-xl border border-sidebar-border/80 bg-card p-6 shadow-sm dark:border-sidebar-border">
                    {children}
                </div>
            </div>
        </div>
    );
}
