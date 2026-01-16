import { motion } from 'framer-motion';
import { Target, Eye, Users, Award, Zap, Globe } from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: Target,
      title: 'Our Mission',
      description: 'To empower businesses with innovative technology solutions that drive growth, efficiency, and competitive advantage in the digital age.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Eye,
      title: 'Our Vision',
      description: 'To be the leading technology partner in Africa, recognized for delivering exceptional software solutions that transform businesses and communities.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Users,
      title: 'Our Team',
      description: 'A diverse team of passionate developers, designers, and innovators committed to excellence and continuous learning.',
      color: 'from-green-500 to-emerald-500'
    },
  ];

  const stats = [
    { value: '50+', label: 'Projects Delivered', icon: Award },
    { value: '20+', label: 'Team Members', icon: Users },
    { value: '5+', label: 'Years Experience', icon: Zap },
    { value: '10+', label: 'Industries Served', icon: Globe },
  ];

  return (
    <section id="about" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="section-title">About Ementech</h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            We are a technology company passionate about building innovative solutions that make a difference
          </p>
        </motion.div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-8 rounded-2xl text-center"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${value.color} p-0.5 mx-auto mb-6`}>
                <div className="w-full h-full bg-dark-900 rounded-2xl flex items-center justify-center">
                  <value.icon className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{value.title}</h3>
              <p className="text-gray-400 leading-relaxed">{value.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Story */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-12 rounded-3xl mb-20"
        >
          <div className="max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-white mb-6">Our Story</h3>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                Ementech was born from a passion for technology and a desire to solve real-world problems through innovative software solutions.
                Founded in Kenya, we have grown from a small startup to a leading technology company, serving clients across multiple industries.
              </p>
              <p>
                We specialize in building SaaS products, AI solutions, and custom software that helps businesses thrive in the digital age.
                Our portfolio includes successful products like Green Rent, SmartBiz, and various enterprise solutions.
              </p>
              <p>
                What sets us apart is our commitment to excellence, our deep technical expertise, and our focus on delivering solutions that
                create real value for our clients. We don't just write code; we build partnerships and help businesses transform.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-8 rounded-2xl text-center"
            >
              <stat.icon className="w-8 h-8 text-primary-400 mx-auto mb-4" />
              <div className="text-4xl font-bold gradient-text mb-2">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
