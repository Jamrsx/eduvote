import { animate, stagger } from 'animejs';
import {
    createContext,
    useCallback,
    useContext,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import type { ReactElement, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { prefersReducedMotion } from '@/lib/ballot-motion';

const StudentLoginBootContext = createContext<(() => void) | undefined>(undefined);

const DISPLAY_MS = 4000;
const DISPLAY_MS_REDUCED = 900;

/** Outer ring arc segments (clockwise from top); radius matches SVG paths. */
const OUTER_RING_SEGMENT_COUNT = 8;
const OUTER_RING_R = 82;
const OUTER_RING_COLORS = [
    '#f87171',
    '#fb923c',
    '#fbbf24',
    '#a3e635',
    '#4ade80',
    '#14b8a6',
    '#22d3ee',
    '#a78bfa',
] as const;

function isStudentDashboardUrl(url: string): boolean {
    const path = url.split('?')[0] ?? '';

    return path === '/student/dashboard' || path.endsWith('/student/dashboard');
}

function StudentLoginBootVisual({
    onDismiss,
    reduced,
}: {
    onDismiss: () => void;
    reduced: boolean;
}): ReactElement {
    const uid = useId().replace(/:/g, '');
    const discGradId = `student-boot-disc-${uid}`;
    const haloGradId = `student-boot-halo-${uid}`;
    const quadGlowId = `student-boot-quad-glow-${uid}`;

    const rootRef = useRef<HTMLDivElement>(null);
    const dismissTimerRef = useRef<number | null>(null);

    useLayoutEffect(() => {
        const root = rootRef.current;

        if (!root) {
            return;
        }

        const animations: { pause?: () => void }[] = [];

        if (!reduced) {
            const preRings = root.querySelectorAll<HTMLElement>('[data-boot-ring-pre]');
            const coreEl = root.querySelector<HTMLElement>('[data-boot-core]');
            const outerArcs = root.querySelectorAll<HTMLElement>('[data-boot-arc]');
            const outer = root.querySelector<HTMLElement>('[data-anime-outer]');
            const ticks = root.querySelector<HTMLElement>('[data-anime-ticks]');
            const face = root.querySelector<HTMLElement>('[data-boot-face]');

            void animate(preRings, {
                opacity: [0, 1],
                scale: [0.82, 1],
                duration: 520,
                delay: stagger(130, { start: 80 }),
                ease: 'out(3)',
            });

            if (coreEl) {
                void animate(coreEl, {
                    opacity: [0, 1],
                    scale: [0.88, 1],
                    duration: 500,
                    delay: 520,
                    ease: 'out(3)',
                });
            }

            void animate(outerArcs, {
                opacity: [0, 1],
                scale: [0.88, 1],
                duration: 480,
                delay: stagger(70, { start: 720 }),
                ease: 'out(3)',
            }).then(() => {
                void animate(outerArcs, {
                    filter: [
                        'brightness(1) drop-shadow(0 0 0 transparent)',
                        'brightness(1.35) drop-shadow(0 0 14px rgba(34,211,238,0.55))',
                        'brightness(1) drop-shadow(0 0 0 transparent)',
                    ],
                    duration: 620,
                    delay: stagger(55, { start: 0 }),
                    ease: 'inOut(2)',
                });
            });

            if (outer) {
                animations.push(
                    animate(outer, {
                        rotate: 360,
                        duration: 14000,
                        loop: true,
                        ease: 'linear',
                    }),
                );
            }

            if (ticks) {
                animations.push(
                    animate(ticks, {
                        rotate: -360,
                        duration: 20000,
                        loop: true,
                        ease: 'linear',
                    }),
                );
            }

            if (face) {
                animations.push(
                    animate(face, {
                        scale: [1, 1.04, 1],
                        duration: 2200,
                        loop: true,
                        ease: 'inOut(2)',
                    }),
                );
            }
        }

        const displayMs = reduced ? DISPLAY_MS_REDUCED : DISPLAY_MS;

        dismissTimerRef.current = window.setTimeout(() => {
            for (const a of animations) {
                a.pause?.();
            }

            const shell = root.querySelector<HTMLElement>('[data-anime-shell]');

            if (shell) {
                void animate(shell, {
                    opacity: [1, 0],
                    duration: reduced ? 220 : 380,
                    ease: 'out(2)',
                }).then(() => {
                    onDismiss();
                });
            } else {
                onDismiss();
            }
        }, displayMs);

        return () => {
            if (dismissTimerRef.current !== null) {
                window.clearTimeout(dismissTimerRef.current);
            }

            for (const a of animations) {
                a.pause?.();
            }
        };
    }, [onDismiss, reduced]);

    const ringPre = reduced
        ? 'absolute inset-0 flex items-center justify-center will-change-transform opacity-100'
        : 'absolute inset-0 flex items-center justify-center will-change-transform opacity-0';

    const coreWrap = reduced
        ? 'absolute inset-0 z-10 flex items-center justify-center opacity-100'
        : 'absolute inset-0 z-10 flex items-center justify-center opacity-0';

    return (
        <div
            ref={rootRef}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black"
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div
                data-anime-shell
                className="flex flex-col items-center gap-10 px-6"
            >
                <div className="relative mx-auto aspect-square w-[min(72vw,280px)]">
                    <div
                        data-boot-ring-pre
                        data-boot-ring-id="guide-a"
                        className={`${ringPre} z-0`}
                    >
                        <svg
                            viewBox="0 0 200 200"
                            className="h-full w-full"
                            preserveAspectRatio="xMidYMid meet"
                            aria-hidden
                        >
                            <circle
                                cx="100"
                                cy="100"
                                r="46"
                                fill="none"
                                stroke="rgba(113,113,122,0.35)"
                                strokeWidth="1.2"
                            />
                        </svg>
                    </div>

                    <div
                        data-boot-ring-pre
                        data-boot-ring-id="guide-b"
                        className={`${ringPre} z-[1]`}
                    >
                        <svg
                            viewBox="0 0 200 200"
                            className="h-full w-full"
                            preserveAspectRatio="xMidYMid meet"
                            aria-hidden
                        >
                            <circle
                                cx="100"
                                cy="100"
                                r="56"
                                fill="none"
                                stroke="rgba(161,161,170,0.28)"
                                strokeWidth="1"
                                strokeDasharray="4 6"
                            />
                        </svg>
                    </div>

                    <div
                        data-boot-ring-pre
                        data-boot-ring-id="ticks"
                        data-anime-ticks
                        className={`${ringPre} z-[2]`}
                        style={{ transformOrigin: '50% 50%' }}
                    >
                        <svg
                            viewBox="0 0 200 200"
                            className="h-full w-full"
                            preserveAspectRatio="xMidYMid meet"
                            aria-hidden
                        >
                            {Array.from({ length: 72 }).map((_, i) => {
                                const a = (i / 72) * Math.PI * 2;
                                const r0 = 58;
                                const r1 = 72;
                                const x0 = 100 + Math.cos(a) * r0;
                                const y0 = 100 + Math.sin(a) * r0;
                                const x1 = 100 + Math.cos(a) * r1;
                                const y1 = 100 + Math.sin(a) * r1;

                                return (
                                    <line
                                        key={i}
                                        x1={x0}
                                        y1={y0}
                                        x2={x1}
                                        y2={y1}
                                        stroke="rgba(161,161,170,0.45)"
                                        strokeWidth={i % 9 === 0 ? 1.4 : 0.7}
                                    />
                                );
                            })}
                        </svg>
                    </div>

                    <div
                        data-boot-ring-pre
                        data-boot-ring-id="halo"
                        className={`${ringPre} z-[3]`}
                    >
                        <svg
                            viewBox="0 0 200 200"
                            className="h-full w-full"
                            preserveAspectRatio="xMidYMid meet"
                            aria-hidden
                        >
                            <defs>
                                <linearGradient
                                    id={haloGradId}
                                    x1="0%"
                                    y1="0%"
                                    x2="100%"
                                    y2="100%"
                                >
                                    <stop offset="0%" stopColor="rgba(167,139,250,0)" />
                                    <stop offset="50%" stopColor="rgba(34,211,238,0.5)" />
                                    <stop offset="100%" stopColor="rgba(167,139,250,0)" />
                                </linearGradient>
                            </defs>
                            <circle
                                cx="100"
                                cy="100"
                                r="78"
                                fill="none"
                                stroke={`url(#${haloGradId})`}
                                strokeWidth="1"
                                opacity={0.45}
                            />
                        </svg>
                    </div>

                    <div data-boot-core className={coreWrap}>
                        <svg
                            viewBox="0 0 200 200"
                            className="h-full w-full"
                            preserveAspectRatio="xMidYMid meet"
                            aria-hidden
                        >
                            <defs>
                                <radialGradient id={discGradId} cx="35%" cy="30%" r="70%">
                                    <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
                                    <stop offset="45%" stopColor="rgba(24,24,27,0.94)" />
                                    <stop offset="100%" stopColor="rgba(9,9,11,0.98)" />
                                </radialGradient>
                            </defs>
                            <circle cx="100" cy="100" r="54" fill={`url(#${discGradId})`} />
                            <circle
                                cx="100"
                                cy="100"
                                r="54"
                                fill="none"
                                stroke="rgba(255,255,255,0.07)"
                                strokeWidth="1"
                            />

                            {/*
                              Outer translate must stay on a non-animated node: anime.js
                              scale on data-boot-face overwrites SVG transform and was
                              pinning the face to the viewBox origin (top-left).
                            */}
                            <g transform="translate(100, 100)">
                                <g data-boot-face>
                                    <rect
                                        x="-34"
                                        y="-34"
                                        width="68"
                                        height="68"
                                        rx="18"
                                        fill="#18181b"
                                        stroke="rgba(167,139,250,0.5)"
                                        strokeWidth="1.8"
                                    />
                                    <line
                                        x1="0"
                                        y1="-34"
                                        x2="0"
                                        y2="-48"
                                        stroke="#52525b"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                    />
                                    <circle
                                        cx="0"
                                        cy="-52"
                                        r="4.5"
                                        fill="#22d3ee"
                                        opacity={0.95}
                                    />
                                    <ellipse
                                        cx="-16"
                                        cy="-6"
                                        rx="9"
                                        ry="11"
                                        fill="#27272a"
                                        stroke="rgba(167,139,250,0.45)"
                                        strokeWidth="1.2"
                                    />
                                    <ellipse
                                        cx="16"
                                        cy="-6"
                                        rx="9"
                                        ry="11"
                                        fill="#27272a"
                                        stroke="rgba(167,139,250,0.45)"
                                        strokeWidth="1.2"
                                    />
                                    <circle cx="-14" cy="-8" r="2.8" fill="#22d3ee" />
                                    <circle cx="14" cy="-8" r="2.8" fill="#22d3ee" />
                                    <path
                                        d="M -22 10 Q 0 28 22 10"
                                        fill="none"
                                        stroke="#e4e4e7"
                                        strokeWidth="2.8"
                                        strokeLinecap="round"
                                    />
                                </g>
                            </g>
                        </svg>
                    </div>

                    <div
                        data-anime-outer
                        className="absolute inset-0 z-20 flex items-center justify-center will-change-transform"
                        style={{ transformOrigin: '50% 50%' }}
                    >
                        <svg
                            viewBox="0 0 200 200"
                            className="h-full w-full"
                            preserveAspectRatio="xMidYMid meet"
                            aria-hidden
                        >
                            <defs>
                                <filter
                                    id={quadGlowId}
                                    x="-40%"
                                    y="-40%"
                                    width="180%"
                                    height="180%"
                                >
                                    <feGaussianBlur stdDeviation="2.5" result="b" />
                                    <feMerge>
                                        <feMergeNode in="b" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            {Array.from({
                                length: OUTER_RING_SEGMENT_COUNT,
                            }).map((_, i) => {
                                const n = OUTER_RING_SEGMENT_COUNT;
                                const r = OUTER_RING_R;
                                const startRad = -Math.PI / 2 + (i / n) * Math.PI * 2;
                                const endRad = -Math.PI / 2 + ((i + 1) / n) * Math.PI * 2;
                                const x0 = 100 + r * Math.cos(startRad);
                                const y0 = 100 + r * Math.sin(startRad);
                                const x1 = 100 + r * Math.cos(endRad);
                                const y1 = 100 + r * Math.sin(endRad);
                                const d = `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;

                                return (
                                    <g
                                        key={i}
                                        data-boot-arc
                                        className={reduced ? 'opacity-100' : 'opacity-0'}
                                        style={{
                                            transformOrigin: '100px 100px',
                                            transformBox: 'fill-box',
                                        }}
                                    >
                                        <path
                                            d={d}
                                            fill="none"
                                            stroke={OUTER_RING_COLORS[i] ?? '#a1a1aa'}
                                            strokeWidth="5"
                                            strokeLinecap="round"
                                            filter={`url(#${quadGlowId})`}
                                        />
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </div>
                <p className="text-center text-sm font-medium tracking-wide text-zinc-400">
                    Opening your student dashboard…
                </p>
            </div>
        </div>
    );
}

export function StudentLoginBootProvider({
    children,
}: {
    children: ReactNode;
}): ReactElement {
    const [open, setOpen] = useState(false);
    const [reduced, setReduced] = useState(false);

    const trigger = useCallback(() => {
        setReduced(prefersReducedMotion());
        setOpen(true);
        console.log('[student-login-boot] overlay triggered');
    }, []);

    const dismiss = useCallback(() => {
        setOpen(false);
        console.log('[student-login-boot] overlay dismissed');
    }, []);

    return (
        <StudentLoginBootContext.Provider value={trigger}>
            {children}
            {open && typeof document !== 'undefined'
                ? createPortal(
                      <StudentLoginBootVisual onDismiss={dismiss} reduced={reduced} />,
                      document.body,
                  )
                : null}
        </StudentLoginBootContext.Provider>
    );
}

export function useStudentLoginBootTrigger(): () => void {
    const fn = useContext(StudentLoginBootContext);

    if (fn === undefined) {
        return () => {};
    }

    return fn;
}

export function shouldShowStudentDashboardBoot(
    page: { url: string; props: { auth?: { user?: { role?: string } | null } } },
): boolean {
    const role = page.props.auth?.user?.role;

    return role === 'student' && isStudentDashboardUrl(page.url);
}
