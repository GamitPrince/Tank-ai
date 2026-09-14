'use client';

import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';

/**
 * Staggered entrance animation for a list of child elements.
 */
export function useStaggerEntrance(selector = ':scope > *', deps: unknown[] = []) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const targets = containerRef.current.querySelectorAll(selector);
    if (targets.length === 0) return;

    animate(targets, {
      opacity: [0, 1],
      translateY: [24, 0],
      delay: stagger(80),
      duration: 500,
      ease: 'outExpo',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return containerRef;
}

/**
 * Animate a single element fading/sliding in on mount.
 */
export function useFadeIn(direction: 'up' | 'down' | 'left' | 'right' = 'up', duration = 600) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const baseProps = {
      opacity: [0, 1] as [number, number],
      duration,
      ease: 'outExpo' as const,
    };

    if (direction === 'up') {
      animate(ref.current, { ...baseProps, translateY: [30, 0] });
    } else if (direction === 'down') {
      animate(ref.current, { ...baseProps, translateY: [-30, 0] });
    } else if (direction === 'left') {
      animate(ref.current, { ...baseProps, translateX: [30, 0] });
    } else {
      animate(ref.current, { ...baseProps, translateX: [-30, 0] });
    }
  }, [direction, duration]);

  return ref;
}

/**
 * Pulse animation (for status indicators, alarms, etc.)
 */
export function usePulse(active = true) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !active) return;

    const anim = animate(ref.current, {
      scale: [1, 1.15, 1],
      opacity: [1, 0.6, 1],
      duration: 1500,
      loop: true,
      ease: 'inOutSine',
    });

    return () => { anim.pause(); };
  }, [active]);

  return ref;
}

export { animate, stagger };
