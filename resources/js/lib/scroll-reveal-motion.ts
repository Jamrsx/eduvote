import { animate, onScroll, type JSAnimation, type ScrollObserver } from 'animejs';

import { prefersReducedMotion } from '@/lib/ballot-motion';

export type BindAnimeScrollRevealsOptions = {
    /** Elements to bind (default `[data-scroll-reveal]`). */
    selector?: string;
    /** Scroll sync smoothing (0–1). Higher = snappier. See anime.js `onScroll` `sync`. */
    syncSmooth?: number;
    /** Virtual timeline length (ms) mapped to scroll progress. */
    virtualDuration?: number;
    /** Vertical motion in px while scrolling through the reveal range. */
    y?: [number, number];
};

/**
 * Links each matching element to an anime.js {@link https://animejs.com/documentation/events/onscroll/ onScroll}
 * observer so opacity / Y follow the window as the row enters the viewport.
 * Returns a teardown that reverts observers and animations.
 */
export function bindAnimeScrollReveals(
    root: HTMLElement | null,
    options: BindAnimeScrollRevealsOptions = {},
): () => void {
    if (!root || prefersReducedMotion()) {
        return () => {};
    }

    const {
        selector = '[data-scroll-reveal]',
        syncSmooth = 0.2,
        virtualDuration = 900,
        y: yRange = [26, 0],
    } = options;

    const nodes = root.querySelectorAll<HTMLElement>(selector);
    if (nodes.length === 0) {
        return () => {};
    }

    console.log('[scroll-reveal-motion] binding', nodes.length, 'elements');

    const pairs: Array<{ observer: ScrollObserver; animation: JSAnimation }> =
        [];

    nodes.forEach((element) => {
        const animation = animate(element, {
            opacity: [0, 1],
            y: yRange,
            duration: virtualDuration,
            autoplay: false,
            ease: 'out(2)',
        });

        const observer = onScroll({
            target: element,
            sync: syncSmooth,
        }).link(animation);

        pairs.push({ observer, animation });
    });

    return () => {
        for (const { observer, animation } of pairs) {
            observer.revert();
            animation.revert();
        }
    };
}
