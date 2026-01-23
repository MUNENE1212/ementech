import { motion } from 'framer-motion';
import { Home, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
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
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl"
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
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 md:p-16 rounded-3xl max-w-2xl mx-auto"
        >
          {/* 404 Number */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-9xl md:text-[12rem] font-bold gradient-text leading-none">
              404
            </h1>
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Page Not Found
            </h2>
            <p className="text-xl text-gray-400">
              Oops! The page you're looking for doesn't exist or has been moved.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/"
              className="group glow-button px-8 py-4 rounded-lg bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold text-lg flex items-center space-x-2"
            >
              <Home className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 rounded-lg border-2 border-primary-500 text-primary-400 font-semibold text-lg hover:bg-primary-500/10 transition-all duration-300 flex items-center space-x-2"
            >
              <span>Contact Us</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>

          {/* Additional Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 pt-8 border-t border-dark-700"
          >
            <p className="text-gray-400 mb-4">Or explore these pages:</p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              {[
                { name: 'Products', path: '/products' },
                { name: 'Services', path: '/services' },
                { name: 'About', path: '/about' },
                { name: 'Careers', path: '/careers' }
              ].map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-primary-400 hover:text-primary-300 transition-colors hover:underline"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundPage;
