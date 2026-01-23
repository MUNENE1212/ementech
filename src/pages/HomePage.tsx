import HeroSection from '../components/sections/Hero/HeroNew';
import { motion } from 'framer-motion';
import { Rocket, Zap, Globe } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Quick Overview Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-4">Why Choose Ementech?</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              We combine technical excellence with business acumen to deliver solutions that drive real results
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Proven Track Record',
                description: '4+ production-ready platforms successfully deployed and handling live transactions',
                icon: Rocket,
                gradient: 'from-blue-500 to-cyan-500'
              },
              {
                title: 'Cutting-Edge Technology',
                description: 'AI-powered solutions, modern frameworks, and scalable architecture',
                icon: Zap,
                gradient: 'from-purple-500 to-pink-500'
              },
              {
                title: 'Local Expertise',
                description: 'Built in Kenya for Africa, with M-Pesa integration and local market understanding',
                icon: Globe,
                gradient: 'from-green-500 to-emerald-500'
              }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="glass-card p-8 rounded-2xl text-center group cursor-default"
              >
                <motion.div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}
                  whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }}
                >
                  <item.icon className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-primary-400 transition-colors">{item.title}</h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
