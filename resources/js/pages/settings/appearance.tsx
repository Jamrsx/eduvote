import AppearanceToggleTab from '@/components/appearance-tabs';
import Heading from '@/components/heading';
import { Head } from '@inertiajs/react';

export default function AppearanceSettings() {
    return (
        <>
            <Head title="Appearance settings" />
            <div className="space-y-6">
                <Heading
                    title="Appearance"
                    description="Customize how the application looks on your device"
                />
                <AppearanceToggleTab />
            </div>
        </>
    );
}
