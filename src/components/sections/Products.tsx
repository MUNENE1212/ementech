import { motion } from 'framer-motion';
import { ArrowRight, ExternalLink, Check, Briefcase, Home, Wrench, ShoppingCart } from 'lucide-react';

const Products = () => {
  const products = [
    {
      name: 'Dumu Waks',
      description: 'AI-powered technician marketplace connecting skilled professionals with customers. Features M-Pesa payments, real-time booking, intelligent matching, and escrow security.',
      icon: Wrench,
      features: ['AI-Powered Matching', 'M-Pesa Integration', 'Real-time Booking', 'Escrow Payments'],
      gradient: 'from-purple-500 to-pink-600',
      path: 'https://ementech-frontend.onrender.com/',
      status: 'LIVE - Processing Transactions',
      tech: ['React', 'Node.js', 'MongoDB', 'Socket.io', 'M-Pesa API']
    },
    {
      name: 'BAITECH',
      description: 'Modern e-commerce platform combining product sales with tech services marketplace. Features PWA support, WhatsApp commerce, and enterprise-grade performance.',
      icon: ShoppingCart,
      features: ['E-commerce Store', 'Service Marketplace', 'WhatsApp Integration', 'PWA Support'],
      gradient: 'from-orange-500 to-red-600',
      path: '/baitech',
      status: 'Production Ready',
      tech: ['Next.js 16', 'TypeScript', 'MongoDB', 'Cloudinary', 'Redis']
    },
    {
      name: 'Green Rent',
      description: 'Comprehensive rental management platform with technician portfolios, review systems, and real-time tracking for property managers.',
      icon: Home,
      features: ['Property Management', 'Technician Portfolio', 'Review System', 'Real-time Updates'],
      gradient: 'from-green-500 to-emerald-600',
      path: '/green_rent',
      status: 'Live on VPS',
      tech: ['React', 'Node.js', 'MongoDB']
    },
    {
      name: 'SmartBiz',
      description: 'Multi-tenant business management solution with financial tracking, inventory management, and advanced analytics for growing businesses.',
      icon: Briefcase,
      features: ['Financial Tracking', 'Multi-tenancy', 'Business Analytics', 'Inventory Management'],
      gradient: 'from-blue-500 to-cyan-600',
      path: '/smartbiz',
      status: 'Live on VPS',
      tech: ['React', 'Node.js', 'PostgreSQL']
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <section id="products" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(to right, #a855f7 1px, transparent 1px),
              linear-gradient(to bottom, #a855f7 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px'
          }} />
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="section-title">Our Products</h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Innovative SaaS solutions designed to streamline your business operations and drive growth
          </p>
        </motion.div>

        {/* Products Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {products.map((product) => (
            <motion.div
              key={product.name}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              className="glass-card p-8 rounded-2xl group cursor-pointer"
            >
              {/* Status Badge */}
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${product.gradient} p-0.5`}>
                  <div className="w-full h-full bg-dark-900 rounded-xl flex items-center justify-center">
                    <product.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                  {product.status}
                </span>
              </div>

              {/* Product Info */}
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-primary-400 transition-colors">
                {product.name}
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                {product.description}
              </p>

              {/* Features */}
              <div className="space-y-2 mb-6">
                {product.features.map((feature) => (
                  <div key={feature} className="flex items-center space-x-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-primary-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Tech Stack */}
              <div className="flex flex-wrap gap-2 mb-6">
                {product.tech.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-dark-800 text-gray-300 border border-dark-700"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Action Link */}
              <a
                href={product.path}
                className="inline-flex items-center space-x-2 text-primary-400 font-medium group-hover:text-primary-300 transition-colors"
              >
                <span>View Product</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-gray-400 mb-6">
            Interested in custom software development?
          </p>
          <a
            href="#contact"
            className="glow-button inline-flex items-center space-x-2 px-8 py-4 rounded-lg bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold"
          >
            <span>Let's Build Something Together</span>
            <ArrowRight className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Products;
