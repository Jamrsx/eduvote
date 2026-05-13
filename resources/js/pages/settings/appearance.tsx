import { Head, usePage } from '@inertiajs/react';
import AppearanceToggleTab from '@/components/appearance-tabs';
import Heading from '@/components/heading';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AppearanceSettings() {
    const { auth } = usePage<{ auth?: { user?: { role?: string } | null } }>().props;
    const studentThemeLocked = auth?.user?.role === 'student';

    return (
        <>
            <Head title="Appearance settings" />
            <div className="space-y-6">
                <Heading
                    title="Appearance"
                    description="Customize how the application looks on your device"
                />
                {studentThemeLocked ? (
                    <Alert>
                        <AlertDescription>
                            The student experience uses dark mode only so voting and nominee
                            visuals stay consistent. Appearance cannot be changed while signed in
                            as a student.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <AppearanceToggleTab />
                )}
            </div>
        </>
    );
}
