import { animate, stagger, splitText } from 'animejs';
import { prefersReducedMotion } from '@/lib/ballot-motion';
import { playBallotSubmittedCelebration } from '@/lib/reveal-sound';

const CELEBRATION_DEBOUNCE_MS = 550;

let lastCelebrationAt = 0;

const CELEBRATION_MESSAGE = 'Your Vote Has Been Submitted.';

const CONFETTI_COLORS = [
    '#a78bfa',
    '#22d3ee',
    '#e879f9',
    '#fbbf24',
    '#60a5fa',
    '#c4b5fd',
    '#34d399',
    '#fb7185',
];

type ConfettiParticle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    g: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
    rot: number;
    vr: number;
};

function spawnRadialCenterBurst(
    particles: ConfettiParticle[],
    cx: number,
    cy: number,
    count: number,
): void {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 7 + Math.random() * 16;
        const spread = 0.65 + Math.random() * 1.1;

        particles.push({
            x: cx + (Math.random() - 0.5) * 48,
            y: cy + (Math.random() - 0.5) * 48,
            vx: Math.cos(angle) * speed * spread,
            vy: Math.sin(angle) * speed * spread - 5,
            g: 0.1 + Math.random() * 0.12,
            life: 0,
            maxLife: 110 + Math.random() * 100,
            size: 8 + Math.random() * 12,
            color: CONFETTI_COLORS[i % CONFETTI_COLORS.length] ?? '#a78bfa',
            rot: Math.random() * Math.PI * 2,
            vr: (Math.random() - 0.5) * 0.35,
        });
    }
}

/**
 * Large confetti radiating from the viewport center, behind the headline.
 */
function runCenterConfettiOnCanvas(canvas: HTMLCanvasElement): () => void {
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return (): void => {};
    }

    let stopped = false;
    let rafId = 0;

    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
    let w = window.innerWidth;
    let h = window.innerHeight;
    let cx = w * 0.5;
    let cy = h * 0.48;

    const resize = (): void => {
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cx = w * 0.5;
        cy = h * 0.48;
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    const particles: ConfettiParticle[] = [];

    spawnRadialCenterBurst(particles, cx, cy, 140);

    const secondWave = window.setTimeout(() => {
        if (stopped) {
            return;
        }

        spawnRadialCenterBurst(particles, cx, cy, 95);
    }, 260);

    let frames = 0;
    const maxFrames = 260;

    const tick = (): void => {
        if (stopped) {
            return;
        }

        frames++;
        ctx.clearRect(0, 0, w, h);

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];

            if (!p) {
                continue;
            }

            p.life++;
            p.vy += p.g;
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.vr;

            const alpha = Math.max(0, 1 - p.life / p.maxLife);

            if (
                alpha <= 0.02 ||
                p.y > h + 120 ||
                p.x < -120 ||
                p.x > w + 120 ||
                p.life > p.maxLife + 24
            ) {
                particles.splice(i, 1);

                continue;
            }

            ctx.save();
            ctx.globalAlpha = alpha * 0.92;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size * 0.5, -p.size * 0.38, p.size, p.size * 0.76);
            ctx.restore();
        }

        if (frames < maxFrames && (particles.length > 0 || frames < 50)) {
            rafId = window.requestAnimationFrame(tick);
        } else {
            window.clearTimeout(secondWave);
            window.removeEventListener('resize', resize);
        }
    };

    console.log('[ballot-submit-celebration] center confetti started', {
        particles: particles.length,
    });

    rafId = window.requestAnimationFrame(tick);

    return (): void => {
        stopped = true;
        window.cancelAnimationFrame(rafId);
        window.clearTimeout(secondWave);
        window.removeEventListener('resize', resize);
    };
}

function runBallotSubmitCelebrationVisual(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
    }

    if (prefersReducedMotion()) {
        return;
    }

    const overlay = document.createElement('div');
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.className =
        'pointer-events-none fixed inset-0 z-[200] flex items-center justify-center overflow-hidden';

    const backdrop = document.createElement('div');
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.className =
        'pointer-events-none absolute inset-0 bg-black/35 backdrop-blur-[2px]';

    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.className = 'pointer-events-none absolute inset-0 h-full w-full';

    const textColumn = document.createElement('div');
    textColumn.className =
        'relative z-10 flex max-w-[min(92vw,40rem)] flex-col items-center justify-center px-5 text-center';

    const message = document.createElement('p');
    message.textContent = CELEBRATION_MESSAGE;
    message.className =
        'text-foreground font-extrabold tracking-tight drop-shadow-[0_2px_24px_rgba(0,0,0,0.55)] [text-wrap:balance]';

    message.style.fontSize = 'clamp(1.35rem, 4.2vw, 3rem)';
    message.style.lineHeight = '1.15';

    textColumn.appendChild(message);
    overlay.appendChild(backdrop);
    overlay.appendChild(canvas);
    overlay.appendChild(textColumn);
    document.body.appendChild(overlay);

    const stopConfetti = runCenterConfettiOnCanvas(canvas);

    const { chars } = splitText(message, {
        chars: { wrap: true },
    });

    console.log('[ballot-submit-celebration] splitText wrap headline', {
        charCount: chars.length,
    });

    void animate(chars, {
        y: ['75%', '0%'],
        opacity: [0, 1],
        duration: 780,
        ease: 'out(3)',
        delay: stagger(50, { start: 140 }),
    }).then(() => {
        console.log('[ballot-submit-celebration] headline wrap animation complete');
    });

    const dismissMs = 5200;

    window.setTimeout(() => {
        stopConfetti();
        overlay.remove();
        console.log('[ballot-submit-celebration] overlay dismissed');
    }, dismissMs);
}

/**
 * Center-screen confetti, headline with anime.js {@link https://animejs.com/documentation/text/splittext splitText}
 * wrap + staggered {@link https://animejs.com/documentation/animation animate}, and celebration audio.
 */
export function runBallotSubmitCelebration(): void {
    if (typeof window === 'undefined' || prefersReducedMotion()) {
        return;
    }

    const now = Date.now();

    if (now - lastCelebrationAt < CELEBRATION_DEBOUNCE_MS) {
        console.log('[ballot-submit-celebration] skipped (debounce)');

        return;
    }

    lastCelebrationAt = now;
    console.log('[ballot-submit-celebration] celebration run');

    runBallotSubmitCelebrationVisual();
    playBallotSubmittedCelebration(0.22);
}
