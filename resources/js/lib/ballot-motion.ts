import { animate, stagger } from 'animejs';

export function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) {
        return false;
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Staggered reveal for ballot cards / sections (game-style entrance).
 */
export function revealBallotScene(root: HTMLElement | null): void {
    if (!root || prefersReducedMotion()) {
        return;
    }

    const targets = root.querySelectorAll<HTMLElement>('[data-ballot-reveal]');
    if (targets.length === 0) {
        return;
    }

    animate(targets, {
        opacity: [0, 1],
        y: [22, 0],
        duration: 580,
        delay: stagger(70, { start: 50 }),
        ease: 'out(3)',
    });
}

/**
 * Short “tap” when a nominee card is selected.
 */
export function animateNomineePick(target: HTMLElement | null): void {
    if (!target || prefersReducedMotion()) {
        return;
    }

    animate(target, {
        scale: [1, 1.045, 1],
        duration: 360,
        ease: 'out(3)',
    });
}

/**
 * Gentle pulse on the submit control when every office has a choice.
 */
export function animateSubmitReady(button: HTMLElement | null): void {
    if (!button || prefersReducedMotion()) {
        return;
    }

    animate(button, {
        scale: [1, 1.035, 1],
        duration: 700,
        ease: 'inOut(2)',
        loop: 2,
    });
}
