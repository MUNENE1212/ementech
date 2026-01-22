import { motion } from 'framer-motion';
import { Zap, Sparkles, Shield, TrendingUp } from 'lucide-react';
import { useAnimatedCounter } from './hooks/useAnimatedCounter';

interface Stat {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
}

const stats: Stat[] = [
  { icon: Zap, label: 'Live Products', value: 4, suffix: '+' },
  { icon: Sparkles, label: 'AI Features', value: 10, suffix: '+' },
  { icon: Shield, label: 'Uptime', value: 99.9, suffix: '%' },
  { icon: TrendingUp, label: 'Client Satisfaction', value: 98, suffix: '%' },
];

// Extract to separate component to fix React Hooks rules violation
interface StatItemProps {
  stat: Stat;
  index: number;
}

const StatItem = ({ stat, index }: StatItemProps) => {
  const { displayValue, ref, prefix, suffix } = useAnimatedCounter({
    end: stat.value,
    duration: 2000,
    prefix: stat.prefix || '',
    suffix: stat.suffix || '',
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.2 + index * 0.1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="glass-card p-6 rounded-xl text-center cursor-default"
    >
      {/* Simplified icon animation - removed rotate wiggle */}
      <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 mb-3">
        <stat.icon className="w-6 h-6 text-white" />
      </div>

      <div className="text-3xl font-bold text-white mb-2">
        <span ref={ref}>
          {prefix}
          <motion.span>{displayValue}</motion.span>
          {suffix}
        </span>
      </div>

      <div className="text-sm text-gray-300">{stat.label}</div>
    </motion.div>
  );
};

export const HeroStats = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.8 }}
      className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
    >
      {stats.map((stat, index) => (
        <StatItem key={stat.label} stat={stat} index={index} />
      ))}
    </motion.div>
  );
};
