import type { Auth } from '@/types/auth';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            pendingStudentRegistrationCount: number;
            sidebarOpen: boolean;
            flash?: {
                success?: string | null;
            };
            [key: string]: unknown;
        };
    }
}
