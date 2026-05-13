import type { Timeline } from 'animejs';
import { animate, createTimeline } from 'animejs';
import { scrambleText } from 'animejs/text';

import { prefersReducedMotion } from '@/lib/ballot-motion';
import {
    createThrottledScrambleTick,
    playHeroPopSound,
    playRevealSectionComplete,
    resumeRevealAudio,
} from '@/lib/reveal-sound';

export type OfficersHeroTextRefs = {
    kicker: HTMLElement | null;
    title: HTMLElement | null;
    body: HTMLElement | null;
    shell?: HTMLElement | null;
    shine?: HTMLElement | null;
};

const HERO_KICKER = 'Nominee roster';
const HERO_TITLE = 'Nominees & platforms';
const HERO_BODY =
    'Campus-wide seats and your program slate — the same offices you see on the Vote page. Scheduled elections show nominees early; you can only cast votes when the window is open.';

const NOMINEE_REVEALED_ATTR = 'data-officer-nominee-revealed';

/**
 * Fills hero (and optionally nominee copy blocks) without motion — used when reduced motion is on.
 */
export function applyOfficersRosterStaticContent(
    refs: OfficersHeroTextRefs,
    root: HTMLElement | null,
): void {
    const { kicker, title, body } = refs;

    if (kicker) {
        kicker.textContent = HERO_KICKER;
    }

    if (title) {
        title.textContent = HERO_TITLE;
    }

    if (body) {
        body.textContent = HERO_BODY;
    }

    if (!root) {
        return;
    }

    root.querySelectorAll<HTMLElement>('[data-officer-nominee-copy]').forEach((copy) => {
        const encoded = copy.getAttribute('data-scramble-text');

        if (!encoded) {
            return;
        }

        let plain: string;

        try {
            plain = decodeURIComponent(encoded);
        } catch {
            plain = '';
        }

        copy.textContent = plain;

        const row = copy.closest<HTMLElement>('[data-officer-nominee-row]');
        const photo = row?.querySelector<HTMLElement>('[data-officer-nominee-photo]');

        if (row && photo) {
            photo.style.opacity = '1';
            photo.style.transform = 'translateX(0)';
            row.setAttribute(NOMINEE_REVEALED_ATTR, 'true');
        }
    });
}

async function runOfficersHeroCardCelebration(
    shell: HTMLElement | null,
    shine: HTMLElement | null,
): Promise<void> {
    if (!shell || prefersReducedMotion()) {
        return;
    }

    void resumeRevealAudio();

    await animate(shell, {
        scale: [1, 1.09],
        duration: 200,
        ease: 'out(2)',
        onComplete: () => {
            playHeroPopSound();
        },
    }).then();

    await animate(shell, {
        scale: [1.09, 0.97, 1],
        duration: 520,
        ease: 'out(3)',
    }).then();

    if (!shine) {
        return;
    }

    const sweep = Math.max(shell.offsetWidth * 0.85, 280);

    shine.style.opacity = '0';

    await animate(shine, {
        opacity: [0, 0.82, 0],
        x: [-sweep * 0.35, sweep * 0.92],
        duration: 920,
        ease: 'out(2)',
    }).then();

    shine.style.opacity = '0';
    shine.style.transform = '';

    console.log('[officers-roster-motion] hero card celebration done');
}

/**
 * Sequential scramble intro for the roster hero (sound throttled via onChange).
 */
export async function runOfficersHeroScrambleIntro(
    refs: OfficersHeroTextRefs,
): Promise<void> {
    if (prefersReducedMotion()) {
        applyOfficersRosterStaticContent(refs, null);

        return;
    }

    const { kicker, title, body } = refs;

    if (!kicker || !title || !body) {
        return;
    }

    void resumeRevealAudio();

    const tick = createThrottledScrambleTick(95);

    const revealLine = async (el: HTMLElement, text: string): Promise<void> => {
        el.textContent = '';
        await animate(el, {
            innerHTML: scrambleText({
                text,
                override: '',
                revealRate: 52,
                ease: 'out(2)',
                onChange: (_scrambled: string, t: number) => {
                    tick(t);
                },
            }),
        }).then();
        playRevealSectionComplete(0.055);
    };

    await revealLine(kicker, HERO_KICKER);
    await revealLine(title, HERO_TITLE);
    await revealLine(body, HERO_BODY);

    await runOfficersHeroCardCelebration(refs.shell ?? null, refs.shine ?? null);
}

export function buildNomineeScramblePlainText(nominee: {
    full_name: string;
    party_name: string;
    party_short_name: string | null;
    party_scope_label: string;
    platform: string | null;
}): string {
    const platform =
        nominee.platform?.trim() !== '' && nominee.platform !== null
            ? nominee.platform.trim()
            : 'No platform submitted.';
    const short = nominee.party_short_name
        ? ` (${nominee.party_short_name})`
        : '';

    return [
        nominee.full_name,
        `Partylist: ${nominee.party_name}${short}`,
        nominee.party_scope_label,
        `Platform:\n${platform}`,
    ].join('\n');
}

function readNomineePlainText(copy: HTMLElement, encoded: string): string {
    try {
        return decodeURIComponent(encoded);
    } catch {
        return copy.textContent?.trim() ?? '';
    }
}

function applyNomineeRowFinalState(
    row: HTMLElement,
    photo: HTMLElement,
    copy: HTMLElement,
    plain: string,
): void {
    photo.style.opacity = '1';
    photo.style.transform = 'translateX(0)';
    copy.textContent = plain;
    row.setAttribute(NOMINEE_REVEALED_ATTR, 'true');
    void runNomineeCardShine(row);
}

function resetNomineeCardShine(row: HTMLElement): void {
    const shine = row.querySelector<HTMLElement>('[data-officer-nominee-shine]');

    if (!shine) {
        return;
    }

    shine.style.opacity = '0';
    shine.style.removeProperty('transform');
}

async function runNomineeCardShine(row: HTMLElement): Promise<void> {
    if (prefersReducedMotion()) {
        return;
    }

    const shine = row.querySelector<HTMLElement>('[data-officer-nominee-shine]');

    if (!shine) {
        return;
    }

    const sweep = Math.max(row.offsetWidth * 0.9, 200);

    shine.style.opacity = '0';

    await animate(shine, {
        opacity: [0, 0.78, 0],
        x: [-sweep * 0.35, sweep * 0.92],
        duration: 820,
        ease: 'out(2)',
    }).then();

    shine.style.opacity = '0';
    shine.style.removeProperty('transform');
}

function isNearDocumentBottom(thresholdPx: number): boolean {
    const doc = document.documentElement;
    const scrollHeight = Math.max(doc.scrollHeight, document.body.scrollHeight);
    const gap = scrollHeight - window.scrollY - window.innerHeight;

    return gap <= thresholdPx;
}

/**
 * Per-nominee row: one-shot photo slide + copy scramble when the row enters view.
 * Near the document bottom, any unrevealed rows jump to full text (readable).
 * Revealed rows stay revealed when scrolling back up (no scroll-scrub rewind).
 */
export function bindOfficerNomineeScrollRows(
    root: HTMLElement | null,
): () => void {
    if (!root || prefersReducedMotion()) {
        return () => {};
    }

    const rows = root.querySelectorAll<HTMLElement>('[data-officer-nominee-row]');

    if (rows.length === 0) {
        return () => {};
    }

    console.log('[officers-roster-motion] nominee reveal rows', rows.length);

    const tick = createThrottledScrambleTick(110);
    const activeTimelines = new Map<HTMLElement, Timeline>();
    const nearBottomThresholdPx = 80;
    let scrollDebounceId: number | undefined;

    const revealAllUnfinishedNearBottom = (): void => {
        if (!isNearDocumentBottom(nearBottomThresholdPx)) {
            return;
        }

        rows.forEach((row) => {
            if (row.getAttribute(NOMINEE_REVEALED_ATTR) === 'true') {
                return;
            }

            const photo = row.querySelector<HTMLElement>('[data-officer-nominee-photo]');
            const copy = row.querySelector<HTMLElement>('[data-officer-nominee-copy]');
            const encoded = copy?.getAttribute('data-scramble-text');

            if (!photo || !copy || !encoded) {
                return;
            }

            const plain = readNomineePlainText(copy, encoded);
            const running = activeTimelines.get(row);

            if (running) {
                running.revert();
                activeTimelines.delete(row);
            }

            applyNomineeRowFinalState(row, photo, copy, plain);
        });
    };

    const scheduleBottomCheck = (): void => {
        if (scrollDebounceId !== undefined) {
            window.clearTimeout(scrollDebounceId);
        }

        scrollDebounceId = window.setTimeout(() => {
            scrollDebounceId = undefined;
            revealAllUnfinishedNearBottom();
        }, 40);
    };

    const startRowReveal = (row: HTMLElement): void => {
        if (row.getAttribute(NOMINEE_REVEALED_ATTR) === 'true' || activeTimelines.has(row)) {
            return;
        }

        const photo = row.querySelector<HTMLElement>('[data-officer-nominee-photo]');
        const copy = row.querySelector<HTMLElement>('[data-officer-nominee-copy]');
        const encoded = copy?.getAttribute('data-scramble-text');

        if (!photo || !copy || !encoded) {
            return;
        }

        const plain = readNomineePlainText(copy, encoded);

        copy.textContent = '';
        photo.style.opacity = '0';
        photo.style.transform = 'translateX(-1.75rem)';

        const timeline = createTimeline({
            onComplete: () => {
                activeTimelines.delete(row);
                row.setAttribute(NOMINEE_REVEALED_ATTR, 'true');
                void runNomineeCardShine(row);
            },
        });

        activeTimelines.set(row, timeline);
        timeline.add(photo, {
            x: ['-1.75rem', '0'],
            opacity: [0, 1],
            duration: 720,
            ease: 'out(3)',
        });
        timeline.add(
            copy,
            {
                innerHTML: scrambleText({
                    text: plain,
                    override: '',
                    revealRate: 50,
                    ease: 'out(2)',
                    onChange: (_s: string, t: number) => {
                        tick(t);
                    },
                }),
                duration: 1400,
                ease: 'linear',
            },
            '-=420',
        );
    };

    const intersectionObserver = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) {
                    continue;
                }

                const row = entry.target as HTMLElement;

                startRowReveal(row);
            }
        },
        {
            root: null,
            rootMargin: '0px 0px 18% 0px',
            threshold: 0.06,
        },
    );

    rows.forEach((row) => {
        intersectionObserver.observe(row);
    });

    window.addEventListener('scroll', scheduleBottomCheck, { passive: true });
    window.addEventListener('resize', scheduleBottomCheck, { passive: true });
    requestAnimationFrame(() => {
        revealAllUnfinishedNearBottom();
        intersectionObserver.takeRecords().forEach((entry) => {
            if (entry.isIntersecting) {
                startRowReveal(entry.target as HTMLElement);
            }
        });
    });

    return () => {
        intersectionObserver.disconnect();
        window.removeEventListener('scroll', scheduleBottomCheck);
        window.removeEventListener('resize', scheduleBottomCheck);

        if (scrollDebounceId !== undefined) {
            window.clearTimeout(scrollDebounceId);
        }

        const pending = Array.from(activeTimelines.entries());

        for (const [row, timeline] of pending) {
            timeline.revert();
            activeTimelines.delete(row);
            resetNomineeCardShine(row);

            const photo = row.querySelector<HTMLElement>('[data-officer-nominee-photo]');
            const copy = row.querySelector<HTMLElement>('[data-officer-nominee-copy]');
            const encoded = copy?.getAttribute('data-scramble-text');

            if (photo && copy && encoded && row.getAttribute(NOMINEE_REVEALED_ATTR) !== 'true') {
                const plain = readNomineePlainText(copy, encoded);

                applyNomineeRowFinalState(row, photo, copy, plain);
            }
        }
    };
}

export { HERO_KICKER, HERO_TITLE, HERO_BODY };
