import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ArrowRight, Wrench, Bot, Briefcase } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useReducedMotion } from './hooks/useReducedMotion';

interface Product {
  name: string;
  tagline: string;
  icon: LucideIcon;
  color: string;
  link: string;
}

const products: Product[] = [
  {
    name: 'Dumu Waks',
    tagline: 'AI-Powered Technician Marketplace',
    icon: Wrench,
    color: 'from-blue-500 to-cyan-500',
    link: 'https://app.ementech.co.ke',
  },
  {
    name: 'EmenTech AI',
    tagline: 'Intelligent Automation Solutions',
    icon: Bot,
    color: 'from-purple-500 to-pink-500',
    link: '#products',
  },
  {
    name: 'Custom Solutions',
    tagline: 'Enterprise-Grade Platforms',
    icon: Briefcase,
    color: 'from-green-500 to-emerald-500',
    link: '#contact',
  },
];

export const HeroProductShowcase = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const prefersReducedMotion = useReducedMotion();
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Disable mouse tracking on mobile or when reduced motion is preferred
    if (isMobile || prefersReducedMotion) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  // Reduced parallax depth from 10 to 5 degrees
  const rotateX = useTransform(mouseY, [-200, 200], [5, -5]);
  const rotateY = useTransform(mouseX, [-200, 200], [-5, 5]);

  return (
    <div
      className="relative z-20 w-full max-w-2xl mx-auto perspective-1000"
      onMouseMove={handleMouseMove}
    >
      <motion.div
        style={{
          rotateX: isMobile || prefersReducedMotion ? 0 : rotateX,
          rotateY: isMobile || prefersReducedMotion ? 0 : rotateY,
          transformStyle: isMobile || prefersReducedMotion ? 'flat' : 'preserve-3d',
        }}
        className="grid grid-cols-1 gap-4 md:gap-6"
      >
        {products.map((product, index) => (
          <motion.a
            key={product.name}
            href={product.link}
            target={product.link.startsWith('http') ? '_blank' : undefined}
            rel={product.link.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="group relative block"
            // Removed translateZ and reduced parallax depth
            initial={{
              opacity: 0,
              y: 30, // Reduced from 50
            }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + index * 0.1 }}
            whileHover={{
              scale: 1.02, // Reduced from 1.05
              y: -5, // Simplified: just lift up, no translateZ
            }}
          >
            <div
              className="glass-card p-6 rounded-2xl border border-dark-700/50 bg-dark-800/30 backdrop-blur-sm transition-all duration-300 group-hover:border-primary-500/50 group-hover:shadow-xl group-hover:shadow-primary-500/20"
              style={{ minHeight: isMobile ? '72px' : 'auto' }}
            >
              <div className="flex items-center gap-4">
                {/* Product Icon - Simplified animation */}
                <motion.div
                  className={`flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center shadow-lg`}
                  whileHover={isMobile || prefersReducedMotion ? {} : { scale: 1.1 }} // Simplified: just scale
                  transition={{ duration: 0.2 }}
                >
                  <product.icon className="w-8 h-8 text-white" />
                </motion.div>

                {/* Product Info */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary-400 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    {product.tagline}
                  </p>
                </div>

                {/* Arrow Icon - Removed continuous animation */}
                <div className="flex-shrink-0 text-gray-400 group-hover:text-primary-400 transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          </motion.a>
        ))}
      </motion.div>
    </div>
  );
};
