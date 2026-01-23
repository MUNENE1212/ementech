import { ArrowRight, Sparkles, ArrowDown, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { HeroBackground } from './HeroBackground';
import { HeroProductShowcase } from './HeroProductShowcase';
import { HeroStats } from './HeroStats';
import { useReducedMotion } from './hooks/useReducedMotion';

const Hero = () => {
  const prefersReducedMotion = useReducedMotion();

  // Split text into characters for animation
  const headline = "Transform Your Business with";
  const subHeadline = "AI & Software Solutions";

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background */}
      <HeroBackground />

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Headline & Copy */}
            <div className="text-left">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-dark-800/80 border border-primary-500/30 backdrop-blur-sm mb-8"
              >
                <Sparkles className="w-4 h-4 text-primary-400" />
                <span className="text-sm text-white font-medium">Innovating the Future of Technology</span>
              </motion.div>

              {/* Trust Signals - Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="flex flex-wrap items-center gap-4 mb-6"
              >
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-800/60 border border-dark-700">
                  <CheckCircle className="w-4 h-4 text-accent-400" />
                  <span className="text-sm text-white font-medium">4+ Live Products</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-800/60 border border-dark-700">
                  <CheckCircle className="w-4 h-4 text-accent-400" />
                  <span className="text-sm text-white font-medium">99.9% Uptime</span>
                </div>
              </motion.div>

              {/* Main Heading - Simplified Animation */}
              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {/* Full text for screen readers */}
                <span className="sr-only">
                  {headline} {subHeadline}
                </span>

                {/* Simplified animation - word by word instead of character by character */}
                <div aria-hidden="true" className="flex flex-wrap gap-2">
                  {headline.split(' ').map((word, wordIndex) => (
                    <motion.span
                      key={wordIndex}
                      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={prefersReducedMotion ? { duration: 0.3 } : { delay: 0.4 + wordIndex * 0.05 }}
                      className="inline-block text-white"
                    >
                      {word}&nbsp;
                    </motion.span>
                  ))}
                </div>

                <motion.div
                  className="mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  aria-hidden="true"
                >
                  {/* Fixed: Use solid color for better contrast, gradient only as subtle effect */}
                  <span className="text-primary-400">
                    {subHeadline}
                  </span>
                </motion.div>
              </motion.h1>

              {/* Description - Fixed contrast */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed"
              >
                Proven track record with <span className="text-white font-semibold">4+ production-ready platforms</span>. From AI-powered marketplaces to enterprise e-commerce solutions, we deliver cutting-edge technology that drives real business results.
              </motion.p>

              {/* CTA Buttons - Moved before products, improved copy */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-12"
              >
                <a
                  href="https://app.ementech.co.ke"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group glow-button px-8 py-4 rounded-lg bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold text-lg flex items-center space-x-2 hover:shadow-2xl hover:shadow-primary-500/40 transition-all duration-300 transform hover:-translate-y-0.5"
                  style={{ minHeight: '48px', minWidth: '44px' }}
                >
                  <span>View Live Products</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <a
                  href="#contact"
                  className="px-8 py-4 rounded-lg border-2 border-primary-500 text-white font-semibold text-lg bg-primary-600/10 hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all duration-300"
                  style={{ minHeight: '48px', minWidth: '44px' }}
                >
                  Book Free Consultation
                </a>
              </motion.div>

              {/* Full Stats - Moved below CTAs */}
              <HeroStats />
            </div>

            {/* Right Side - 3D Product Showcase */}
            <div className="lg:pl-8">
              <HeroProductShowcase />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
      >
        {prefersReducedMotion ? (
          // Static arrow when reduced motion
          <div className="flex flex-col items-center text-gray-500">
            <span className="text-sm mb-2">Scroll to explore</span>
            <ArrowDown className="w-6 h-6" />
          </div>
        ) : (
          // Bouncing animation when motion is ok
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-gray-600 rounded-full flex items-start justify-center p-2"
          >
            <motion.div
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-2 bg-primary-400 rounded-full"
            />
          </motion.div>
        )}
      </motion.div>
    </section>
  );
};

export default Hero;
