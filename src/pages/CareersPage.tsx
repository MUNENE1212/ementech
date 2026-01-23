import { motion } from 'framer-motion';
import { Rocket, Code, Brain, Heart, MapPin, DollarSign, Clock, Users, Home, Zap, TrendingUp } from 'lucide-react';
import { Link } from 'react-router';

const CareersPage = () => {
  const benefits = [
    {
      icon: DollarSign,
      title: 'Competitive Salary',
      description: 'Industry-competitive compensation packages based on experience and skills'
    },
    {
      icon: Clock,
      title: 'Flexible Work',
      description: 'Remote-first culture with flexible working hours'
    },
    {
      icon: Brain,
      title: 'Learning & Development',
      description: 'Continuous learning opportunities, conferences, and training programs'
    },
    {
      icon: Heart,
      title: 'Health & Wellness',
      description: 'Comprehensive health insurance and wellness programs'
    },
    {
      icon: Users,
      title: 'Great Team',
      description: 'Work with talented, passionate, and supportive colleagues'
    },
    {
      icon: Rocket,
      title: 'Career Growth',
      description: 'Clear career progression paths and mentorship programs'
    }
  ];

  const openPositions = [
    {
      title: 'Senior Full-Stack Developer',
      department: 'Engineering',
      location: 'Remote / Nairobi',
      type: 'Full-time',
      description: 'We are looking for an experienced full-stack developer to join our team and help build innovative solutions for our clients.',
      requirements: ['5+ years of experience', 'React/Next.js expertise', 'Node.js backend experience', 'TypeScript proficiency'],
      icon: Code
    },
    {
      title: 'AI/ML Engineer',
      department: 'AI & Innovation',
      location: 'Remote / Nairobi',
      type: 'Full-time',
      description: 'Join our AI team to build intelligent solutions that transform businesses and create real impact.',
      requirements: ['3+ years ML experience', 'Python expertise', 'TensorFlow/PyTorch', 'NLP or Computer Vision'],
      icon: Brain
    },
    {
      title: 'Product Designer',
      department: 'Design',
      location: 'Remote / Nairobi',
      type: 'Full-time',
      description: 'Create beautiful, user-centered designs that make complex technology accessible and intuitive.',
      requirements: ['3+ years experience', 'Figma expertise', 'UI/UX portfolio', 'Design system experience'],
      icon: Heart
    }
  ];

  return (
    <div className="min-h-screen py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-6">Join Our Team</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Build innovative solutions that transform businesses. Work with cutting-edge technology and amazing people.
          </p>
        </motion.div>

        {/* Why Join Us */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-12 rounded-3xl mb-16"
        >
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Why Work at Ementech?</h2>
            <p className="text-gray-300 leading-relaxed text-lg mb-8">
              We're a team of passionate technologists building solutions that make a real difference. From AI-powered marketplaces to enterprise SaaS platforms,
              our work is challenging, rewarding, and always at the cutting edge of technology.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: '4+ Live Products', icon: Rocket },
                { label: 'Remote-First', icon: Home },
                { label: 'Tech Stack', icon: Zap },
                { label: 'Growth', icon: TrendingUp }
              ].map((item, index) => (
                <div key={index} className="glass-card p-4 rounded-xl">
                  <item.icon className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-400">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-12">Benefits & Perks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index + 0.4 }}
                className="glass-card p-6 rounded-xl"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 p-0.5 flex-shrink-0">
                    <div className="w-full h-full bg-dark-900 rounded-lg flex items-center justify-center">
                      <benefit.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">{benefit.title}</h3>
                    <p className="text-sm text-gray-400">{benefit.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Open Positions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-white text-center mb-12">Open Positions</h2>
          <div className="space-y-6">
            {openPositions.map((position, index) => (
              <motion.div
                key={position.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index + 0.7 }}
                className="glass-card p-8 rounded-2xl"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 p-0.5">
                        <div className="w-full h-full bg-dark-900 rounded-lg flex items-center justify-center">
                          <position.icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-white">{position.title}</h3>
                    </div>
                    <div className="flex flex-wrap gap-3 mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-500/10 text-primary-400 border border-primary-500/20">
                        {position.department}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 flex items-center space-x-1">
                        <MapPin size={12} />
                        <span>{position.location}</span>
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent-500/10 text-accent-400 border border-accent-500/20">
                        {position.type}
                      </span>
                    </div>
                  </div>
                  <Link
                    to="/contact"
                    className="glow-button px-6 py-3 rounded-lg bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold text-sm whitespace-nowrap"
                  >
                    Apply Now
                  </Link>
                </div>
                <p className="text-gray-400 mb-6">{position.description}</p>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Requirements:</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {position.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm text-gray-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-16 glass-card p-12 rounded-3xl text-center"
        >
          <h3 className="text-3xl font-bold text-white mb-4">Don't See a Match?</h3>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            We're always looking for talented people. If you're passionate about technology and innovation,
            we'd love to hear from you. Send us your resume and a note about why you want to join Ementech.
          </p>
          <Link
            to="/contact"
            className="glow-button inline-flex items-center space-x-2 px-8 py-4 rounded-lg bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold"
          >
            <span>Get In Touch</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default CareersPage;
