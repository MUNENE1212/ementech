import { useRef, useEffect } from 'react';
import { useSpring, useTransform, useInView } from 'framer-motion';

interface UseAnimatedCounterOptions {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

export const useAnimatedCounter = ({ end, prefix = '', suffix = '' }: UseAnimatedCounterOptions) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  const spring = useSpring(0, {
    damping: 50,
    stiffness: 100,
  });

  useEffect(() => {
    if (isInView) {
      spring.set(end);
    }
  }, [isInView, end, spring]);

  const displayValue = useTransform(spring, (latest) => {
    return Math.round(latest);
  });

  return { displayValue, ref, prefix, suffix };
};
