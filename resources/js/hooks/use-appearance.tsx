import { useSyncExternalStore } from 'react';

export type ResolvedAppearance = 'light' | 'dark';
export type Appearance = ResolvedAppearance | 'system';

export type UseAppearanceReturn = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
    readonly updateAppearance: (mode: Appearance) => void;
};

const listeners = new Set<() => void>();
let currentAppearance: Appearance = 'system';
/** When true, the UI stays in dark mode (student experience); system preference is ignored. */
let studentDarkThemeLocked = false;

const prefersDark = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const setCookie = (name: string, value: string, days = 365): void => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const getStoredAppearance = (): Appearance => {
    if (typeof window === 'undefined') {
        return 'system';
    }

    return (localStorage.getItem('appearance') as Appearance) || 'system';
};

const isDarkMode = (appearance: Appearance): boolean => {
    return appearance === 'dark' || (appearance === 'system' && prefersDark());
};

const applyEffectiveTheme = (): void => {
    if (typeof document === 'undefined') {
        return;
    }

    if (studentDarkThemeLocked) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';

        return;
    }

    const isDark = isDarkMode(currentAppearance);

    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
};

const subscribe = (callback: () => void) => {
    listeners.add(callback);

    return () => listeners.delete(callback);
};

const notify = (): void => listeners.forEach((listener) => listener());

const mediaQuery = (): MediaQueryList | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.matchMedia('(prefers-color-scheme: dark)');
};

const handleSystemThemeChange = (): void => {
    applyEffectiveTheme();
};

/**
 * Lock or unlock student-only dark theme (called from AppLayout based on auth role).
 */
export function setStudentDarkThemeLock(locked: boolean): void {
    studentDarkThemeLocked = locked;

    if (locked) {
        currentAppearance = 'dark';
        localStorage.setItem('appearance', 'dark');
        setCookie('appearance', 'dark');
    } else {
        currentAppearance = getStoredAppearance();
        setCookie('appearance', currentAppearance);
    }

    applyEffectiveTheme();
    notify();
}

export function initializeTheme(): void {
    if (typeof window === 'undefined') {
        return;
    }

    const studentForcedMeta =
        document.querySelector('meta[name="eduvote-student-forced-dark"]')?.getAttribute('content') === '1';

    if (studentForcedMeta) {
        studentDarkThemeLocked = true;
        currentAppearance = 'dark';
        localStorage.setItem('appearance', 'dark');
        setCookie('appearance', 'dark');
        applyEffectiveTheme();
        mediaQuery()?.addEventListener('change', handleSystemThemeChange);

        return;
    }

    studentDarkThemeLocked = false;

    if (!localStorage.getItem('appearance')) {
        localStorage.setItem('appearance', 'system');
        setCookie('appearance', 'system');
    }

    currentAppearance = getStoredAppearance();
    applyEffectiveTheme();
    mediaQuery()?.addEventListener('change', handleSystemThemeChange);
}

export function useAppearance(): UseAppearanceReturn {
    const appearance: Appearance = useSyncExternalStore(
        subscribe,
        () => currentAppearance,
        () => 'system',
    );

    const resolvedAppearance: ResolvedAppearance = studentDarkThemeLocked || isDarkMode(appearance)
        ? 'dark'
        : 'light';

    const updateAppearance = (mode: Appearance): void => {
        if (studentDarkThemeLocked) {
            return;
        }

        currentAppearance = mode;
        localStorage.setItem('appearance', mode);
        setCookie('appearance', mode);
        applyEffectiveTheme();
        notify();
    };

    return { appearance, resolvedAppearance, updateAppearance } as const;
}
