import { animate, stagger } from 'animejs';

import { prefersReducedMotion } from '@/lib/ballot-motion';

/**
 * Staggered reveal for roster hero / election cards (same feel as ballot entrance).
 */
export function revealOfficersDirectory(root: HTMLElement | null): void {
    if (!root || prefersReducedMotion()) {
        return;
    }

    const targets = root.querySelectorAll<HTMLElement>('[data-officers-reveal]');
    if (targets.length === 0) {
        return;
    }

    animate(targets, {
        opacity: [0, 1],
        y: [18, 0],
        duration: 520,
        delay: stagger(65, { start: 40 }),
        ease: 'out(3)',
    });
}
