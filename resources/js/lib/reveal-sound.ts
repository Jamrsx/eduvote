import { prefersReducedMotion } from '@/lib/ballot-motion';

let sharedAudioContext: AudioContext | null = null;
let gestureBound = false;
let resumePromise: Promise<boolean> | null = null;

/**
 * Browsers require a user gesture before AudioContext can run; call once from the app shell.
 * Also resumes an existing context on pointer/key.
 */
export function ensureRevealAudioUnlockedFromGesture(): void {
    if (gestureBound || typeof window === 'undefined') {
        return;
    }

    gestureBound = true;

    const resume = (): void => {
        primeRevealAudioOnUserGesture();
    };

    window.addEventListener('pointerdown', resume, { capture: true, passive: true });
    window.addEventListener('keydown', resume, { capture: true, passive: true });
}

/**
 * Call from a pointer handler (e.g. capture on the hero) so Safari/Chrome get a fresh context
 * created inside the user-gesture stack when possible.
 */
export function primeRevealAudioOnUserGesture(): void {
    if (typeof window === 'undefined' || prefersReducedMotion()) {
        return;
    }

    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!Ctx) {
        return;
    }

    if (!sharedAudioContext) {
        sharedAudioContext = new Ctx();
    }

    void resumeRevealAudio();
}

/**
 * Resumes the shared context (deduped). Returns whether audio is in the "running" state.
 */
export async function resumeRevealAudio(): Promise<boolean> {
    if (typeof window === 'undefined' || prefersReducedMotion()) {
        return false;
    }

    const ctx = sharedAudioContext;

    if (!ctx) {
        return false;
    }

    if (ctx.state === 'running') {
        return true;
    }

    if (ctx.state === 'closed') {
        return false;
    }

    resumePromise ??= ctx
        .resume()
        .then(() => ctx.state === 'running')
        .catch(() => false)
        .finally(() => {
            resumePromise = null;
        });

    return await resumePromise;
}

function runWhenAudioCanRender(play: (ctx: AudioContext) => void): void {
    const ctx = sharedAudioContext;

    if (!ctx) {
        return;
    }

    void resumeRevealAudio().then((ok) => {
        if (!ok || ctx.state !== 'running') {
            return;
        }

        play(ctx);
    });
}

/**
 * Very short tick for scramble steps (throttled by caller).
 */
export function playRevealScrambleTick(volume = 0.11): void {
    runWhenAudioCanRender((ctx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0012, ctx.currentTime + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.065);
    });
}

/**
 * Completion tone after a text block finishes revealing.
 */
export function playRevealSectionComplete(volume = 0.16): void {
    runWhenAudioCanRender((ctx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(392, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(587, ctx.currentTime + 0.14);
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0015, ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.24);
    });
}

/**
 * Short playful "pop" for the hero card bounce (two-tone bubble).
 */
export function playHeroPopSound(volume = 0.22): void {
    runWhenAudioCanRender((ctx) => {
        const t0 = ctx.currentTime;
        const makePop = (start: number, freq: number, slideTo: number, dur: number, vol: number): void => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);
            osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur * 0.55);
            gain.gain.setValueAtTime(vol, start);
            gain.gain.exponentialRampToValueAtTime(0.0012, start + dur);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + dur + 0.02);
        };

        makePop(t0, 520, 220, 0.11, volume);
        makePop(t0 + 0.045, 780, 420, 0.08, volume * 0.55);
    });
}

/**
 * Metallic “shing” for shine / glare sweeps (hero + nominee cards).
 */
export function playShineGlareSound(volume = 0.15): void {
    runWhenAudioCanRender((ctx) => {
        const t0 = ctx.currentTime;
        const dur = 0.24;

        const body = ctx.createOscillator();
        const bodyG = ctx.createGain();
        body.type = 'sine';
        body.frequency.setValueAtTime(1750, t0);
        body.frequency.exponentialRampToValueAtTime(5200, t0 + dur * 0.62);
        bodyG.gain.setValueAtTime(volume, t0);
        bodyG.gain.exponentialRampToValueAtTime(0.0009, t0 + dur);
        body.connect(bodyG);
        bodyG.connect(ctx.destination);

        const edge = ctx.createOscillator();
        const edgeG = ctx.createGain();
        edge.type = 'triangle';
        edge.frequency.setValueAtTime(3800, t0);
        edge.frequency.exponentialRampToValueAtTime(9600, t0 + dur * 0.48);
        edgeG.gain.setValueAtTime(volume * 0.38, t0);
        edgeG.gain.exponentialRampToValueAtTime(0.0008, t0 + dur * 0.72);
        edge.connect(edgeG);
        edgeG.connect(ctx.destination);

        const ring = ctx.createOscillator();
        const ringG = ctx.createGain();
        ring.type = 'sine';
        ring.frequency.setValueAtTime(12000, t0);
        ring.frequency.exponentialRampToValueAtTime(6500, t0 + dur * 0.35);
        ringG.gain.setValueAtTime(volume * 0.12, t0);
        ringG.gain.exponentialRampToValueAtTime(0.0006, t0 + dur * 0.45);
        ring.connect(ringG);
        ringG.connect(ctx.destination);

        body.start(t0);
        body.stop(t0 + dur + 0.02);
        edge.start(t0);
        edge.stop(t0 + dur * 0.78 + 0.02);
        ring.start(t0);
        ring.stop(t0 + dur * 0.5 + 0.02);
    });
}

export function createThrottledScrambleTick(
    minIntervalMs: number,
): (progress: number) => void {
    let lastAt = 0;

    return (progress: number): void => {
        if (progress <= 0.02 || progress >= 0.98) {
            return;
        }

        const now = Date.now();

        if (now - lastAt < minIntervalMs) {
            return;
        }

        lastAt = now;
        playRevealScrambleTick(0.1);
    };
}
