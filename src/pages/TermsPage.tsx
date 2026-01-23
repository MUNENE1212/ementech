import { motion } from 'framer-motion';
import { FileText, Shield, AlertCircle, Gavel } from 'lucide-react';
import { Link } from 'react-router';

const TermsPage = () => {
  const sections = [
    {
      icon: FileText,
      title: 'Acceptance of Terms',
      content: 'By accessing and using the Ementech website and services, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use our services.'
    },
    {
      icon: Shield,
      title: 'User Responsibilities',
      content: 'Users are responsible for maintaining the confidentiality of their account information and for all activities that occur under their account. You agree to notify us immediately of any unauthorized use of your account or any other breach of security.'
    },
    {
      icon: AlertCircle,
      title: 'Limitation of Liability',
      content: 'Ementech shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.'
    },
    {
      icon: Gavel,
      title: 'Intellectual Property',
      content: 'All content, features, and functionality of our website, including but not limited to text, graphics, logos, and software, are the exclusive property of Ementech and are protected by international copyright, trademark, and other intellectual property laws.'
    }
  ];

  return (
    <div className="min-h-screen py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-6">Terms of Service</h1>
          <p className="text-xl text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-8 rounded-2xl mb-8"
        >
          <p className="text-gray-300 leading-relaxed">
            Welcome to Ementech. These Terms of Service govern your use of our website and services.
            By accessing or using our services, you agree to be bound by these terms.
          </p>
        </motion.div>

        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index + 0.3 }}
              className="glass-card p-8 rounded-2xl"
            >
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 p-0.5 flex-shrink-0">
                  <div className="w-full h-full bg-dark-900 rounded-lg flex items-center justify-center">
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-3">{section.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{section.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12 glass-card p-8 rounded-2xl"
        >
          <h3 className="text-xl font-bold text-white mb-4">Contact Us</h3>
          <p className="text-gray-400 leading-relaxed mb-4">
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <ul className="space-y-2 text-gray-300">
            <li>Email: info@ementech.com</li>
            <li>Phone: +254 700 000 000</li>
            <li>Location: Nairobi, Kenya</li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <Link
            to="/"
            className="text-primary-400 hover:text-primary-300 transition-colors"
          >
            ← Back to Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsPage;
