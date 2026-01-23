import { ArrowRight, Sparkles, Zap, CreditCard, Flame, Wrench, Bot, Smartphone, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(to right, #0ea5e9 1px, transparent 1px),
              linear-gradient(to bottom, #0ea5e9 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }} />
        </div>

        {/* Floating Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/30 rounded-full blur-3xl"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-dark-950" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-dark-800/50 border border-dark-700 backdrop-blur-sm mb-8"
          >
            <Sparkles className="w-4 h-4 text-accent-400" />
            <span className="text-sm text-gray-300">Innovating the Future of Technology</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="text-white">Transform Your Business With </span>
            <br />
            <span className="gradient-text">AI & Software Solutions</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg sm:text-xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            Proven track record with 4+ production-ready platforms. From AI-powered marketplaces to
            enterprise e-commerce solutions, we deliver cutting-edge technology that drives real business results.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="#products"
              className="group glow-button px-8 py-4 rounded-lg bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold text-lg flex items-center space-x-2 hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-300"
            >
              <span>Explore Our Products</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#contact"
              className="px-8 py-4 rounded-lg border-2 border-primary-500 text-primary-400 font-semibold text-lg hover:bg-primary-500/10 transition-all duration-300"
            >
              Get In Touch
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { icon: Zap, label: 'Live Products', value: '4+' },
              { icon: Sparkles, label: 'AI Features', value: '10+' },
              { icon: CreditCard, label: 'M-Pesa Integration', value: 'Active' },
              { icon: Flame, label: 'Transactions', value: 'Live' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index + 0.7 }}
                className="glass-card p-6 rounded-xl"
              >
                <stat.icon className="w-6 h-6 text-primary-400 mx-auto mb-2" />
                <div className="text-3xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Featured Product - Dumu Waks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-12"
          >
            <div className="glass-card p-8 rounded-2xl border border-primary-500/30 relative overflow-hidden group">
              {/* Gradient Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 to-accent-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Product Icon */}
                  <div className="flex-shrink-0">
                    <div className="bg-gradient-to-br from-primary-500 to-accent-500 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Wrench className="w-10 h-10 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                      <h3 className="text-2xl font-bold text-white">Dumu Waks</h3>
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30">
                        LIVE NOW
                      </span>
                    </div>

                    <p className="text-gray-400 mb-4 max-w-2xl">
                      Connect with skilled technicians across Kenya for all your maintenance and repair needs.
                      From plumbing to electrical work, get it done with our AI-powered marketplace platform.
                    </p>

                    {/* Quick Features */}
                    <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
                      {[
                        { icon: Bot, label: 'AI Matching' },
                        { icon: Smartphone, label: 'Works Offline' },
                        { icon: CreditCard, label: 'M-Pesa Payments' },
                        { icon: Star, label: 'Reviews' }
                      ].map((feature) => (
                        <span
                          key={feature.label}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-dark-800/50 text-sm text-gray-300 rounded-full border border-dark-700"
                        >
                          <feature.icon className="w-3.5 h-3.5" />
                          {feature.label}
                        </span>
                      ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                      <a
                        href="https://app.ementech.co.ke"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-300"
                      >
                        <span>Try It Now</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                      <a
                        href="https://app.ementech.co.ke"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-primary-500 text-primary-400 font-semibold hover:bg-primary-500/10 transition-all duration-300"
                      >
                        <span>Learn More</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
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
      </motion.div>
    </section>
  );
};

export default Hero;
