import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { useReducedMotion } from './hooks/useReducedMotion';
import { Atom, Bot, Cloud, Zap, Wrench, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface FloatingIcon {
  icon: LucideIcon;
  x: string;
  y: string;
  depth: number;
  size: string;
}

const icons: FloatingIcon[] = [
  { icon: Atom, x: '10%', y: '20%', depth: 0.2, size: 'text-4xl' },
  { icon: Bot, x: '85%', y: '15%', depth: 0.5, size: 'text-5xl' },
  { icon: Cloud, x: '75%', y: '70%', depth: 0.3, size: 'text-4xl' },
  { icon: Zap, x: '15%', y: '75%', depth: 0.4, size: 'text-3xl' },
  { icon: Wrench, x: '90%', y: '50%', depth: 0.25, size: 'text-4xl' },
  { icon: BarChart3, x: '5%', y: '50%', depth: 0.35, size: 'text-3xl' },
];

// Extract to separate component to fix React Hooks rules violation
interface FloatingIconProps {
  item: FloatingIcon;
  index: number;
  scrollY: MotionValue<number>;
}

const FloatingIconItem = ({ item, index, scrollY }: FloatingIconProps) => {
  const y = useTransform(scrollY, [0, 1000], [0, item.depth * 300]);
  const opacity = useTransform(scrollY, [0, 500, 800], [0.6, 0.8, 0]);

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: item.x,
        top: item.y,
        y,
        opacity,
      }}
      className={item.size}
      animate={{
        rotate: [0, 360],
      }}
      transition={{
        duration: 20 + index * 2,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <item.icon className="w-full h-full text-primary-400/40" />
    </motion.div>
  );
};

export const FloatingTechIcons = () => {
  const { scrollY } = useScroll();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  // Don't render on mobile or when reduced motion is preferred
  if (isMobile || prefersReducedMotion) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden hidden md:block">
      {icons.map((item, index) => (
        <FloatingIconItem
          key={index}
          item={item}
          index={index}
          scrollY={scrollY}
        />
      ))}
    </div>
  );
};
