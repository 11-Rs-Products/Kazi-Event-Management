'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  /** Milliseconds for the full count. */
  duration?: number;
  className?: string;
}

/**
 * Counts up to `value` once the element has scrolled into view, and re-counts
 * whenever `value` changes afterwards — data usually arrives after mount, so
 * the animation has to survive the target moving.
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 900,
  className,
}) => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);
  const [display, setDisplay] = useState(0);
  // Read inside the rAF loop without making it a dependency.
  const displayRef = useRef(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduce) {
      displayRef.current = value;
      setDisplay(value);
      return;
    }
    if (!inView) return;

    const from = displayRef.current;
    if (from === value) return;

    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic — quick start, gentle settle.
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (value - from) * eased);
      displayRef.current = next;
      setDisplay(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    });

    return () => cancelAnimationFrame(frame);
  }, [value, duration, reduce, inView]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
};
