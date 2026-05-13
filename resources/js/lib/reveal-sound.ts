import { prefersReducedMotion } from '@/lib/ballot-motion';

const MAX_PENDING_PLAYS = 12;

let sharedAudioContext: AudioContext | null = null;
let gestureBound = false;
let resumePromise: Promise<boolean> | null = null;
const pendingPlays: Array<(ctx: AudioContext) => void> = [];

function getAudioContextConstructor(): (typeof AudioContext) | null {
    if (typeof window === 'undefined') {
        return null;
    }

    return (
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ??
        null
    );
}

/**
 * Lazily creates the shared context when something tries to play.
 * Browsers still require a user gesture before `resume()` succeeds; until then,
 * plays are queued and flushed once the context reaches `"running"`.
 */
function ensureAudioContextExists(): AudioContext | null {
    if (typeof window === 'undefined' || prefersReducedMotion()) {
        return null;
    }

    if (sharedAudioContext) {
        return sharedAudioContext;
    }

    const Ctx = getAudioContextConstructor();

    if (!Ctx) {
        return null;
    }

    sharedAudioContext = new Ctx();

    return sharedAudioContext;
}

function enqueuePlay(play: (ctx: AudioContext) => void): void {
    if (pendingPlays.length >= MAX_PENDING_PLAYS) {
        pendingPlays.shift();
    }

    pendingPlays.push(play);
}

function flushPendingPlays(): void {
    const ctx = sharedAudioContext;

    if (!ctx || ctx.state !== 'running') {
        return;
    }

    const count = pendingPlays.length;

    while (pendingPlays.length > 0) {
        const play = pendingPlays.shift();

        if (play) {
            try {
                play(ctx);
            } catch {
                // Ignore failed one-shots (e.g. context edge cases).
            }
        }
    }

    if (count > 0) {
        console.log('[reveal-sound] flushed pending plays', { count });
    }
}

/**
 * Registers a single global listener so the first pointer or key press
 * creates the context (if missing) and resumes it — no page-level "prime" taps.
 */
export function ensureRevealAudioUnlockedFromGesture(): void {
    if (gestureBound || typeof window === 'undefined') {
        return;
    }

    gestureBound = true;

    const unlockFromUserGesture = (): void => {
        if (prefersReducedMotion()) {
            return;
        }

        const Ctx = getAudioContextConstructor();

        if (!Ctx) {
            return;
        }

        if (!sharedAudioContext) {
            sharedAudioContext = new Ctx();
            console.log('[reveal-sound] AudioContext created on user gesture');
        }

        void resumeRevealAudio();
    };

    window.addEventListener('pointerdown', unlockFromUserGesture, { capture: true, passive: true });
    window.addEventListener('keydown', unlockFromUserGesture, { capture: true, passive: true });
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
        flushPendingPlays();

        return true;
    }

    if (ctx.state === 'closed') {
        return false;
    }

    resumePromise ??= ctx
        .resume()
        .then(() => {
            const ok = ctx.state === 'running';

            if (ok) {
                flushPendingPlays();
            }

            return ok;
        })
        .catch(() => false)
        .finally(() => {
            resumePromise = null;
        });

    return await resumePromise;
}

function runWhenAudioCanRender(play: (ctx: AudioContext) => void): void {
    const ctx = ensureAudioContextExists();

    if (!ctx) {
        return;
    }

    if (ctx.state === 'running') {
        try {
            play(ctx);
        } catch {
            // Ignore failed one-shots.
        }

        return;
    }

    if (ctx.state === 'closed') {
        return;
    }

    enqueuePlay(play);
    void resumeRevealAudio();
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
