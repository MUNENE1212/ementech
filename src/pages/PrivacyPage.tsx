import { motion } from 'framer-motion';
import { Eye, Lock, Database, UserCheck, Cookie, Bell } from 'lucide-react';
import { Link } from 'react-router';

const PrivacyPage = () => {
  const sections = [
    {
      icon: Eye,
      title: 'Information We Collect',
      content: 'We collect information you provide directly to us, including name, email, company information, and any other information you choose to share. We also collect technical information such as IP address, browser type, and device information.',
      points: ['Personal identification information', 'Contact information', 'Company details', 'Technical usage data']
    },
    {
      icon: Lock,
      title: 'How We Protect Your Information',
      content: 'We implement appropriate technical and organizational security measures to protect your personal information against unauthorized or unlawful processing, accidental loss, destruction, or damage.',
      points: ['SSL encryption', 'Secure server infrastructure', 'Regular security audits', 'Access controls']
    },
    {
      icon: Database,
      title: 'How We Use Your Information',
      content: 'We use the information we collect to provide, maintain, and improve our services, to communicate with you, and to comply with legal obligations.',
      points: ['Service delivery', 'Customer support', 'Product improvements', 'Legal compliance']
    },
    {
      icon: UserCheck,
      title: 'Your Rights',
      content: 'You have the right to access, correct, or delete your personal information. You can also object to or restrict processing of your data or request data portability.',
      points: ['Right to access', 'Right to rectification', 'Right to erasure', 'Right to portability']
    },
    {
      icon: Cookie,
      title: 'Cookies and Tracking',
      content: 'We use cookies and similar tracking technologies to track activity on our website and hold certain information. Cookies are files with a small amount of data.',
      points: ['Essential cookies', 'Analytics cookies', 'Preference cookies', 'Marketing cookies']
    },
    {
      icon: Bell,
      title: 'Changes to This Policy',
      content: 'We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.',
      points: ['Email notifications', 'Website notices', 'Version history', 'Effective date']
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
          <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-6">Privacy Policy</h1>
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
            At Ementech, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
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
                  <p className="text-gray-400 leading-relaxed mb-4">{section.content}</p>
                  <ul className="space-y-2">
                    {section.points.map((point, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm text-gray-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-12 glass-card p-8 rounded-2xl"
        >
          <h3 className="text-xl font-bold text-white mb-4">Contact Us</h3>
          <p className="text-gray-400 leading-relaxed mb-4">
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <ul className="space-y-2 text-gray-300">
            <li>Email: privacy@ementech.com</li>
            <li>Phone: +254 700 000 000</li>
            <li>Location: Nairobi, Kenya</li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
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

export default PrivacyPage;
