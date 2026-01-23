import { motion } from 'framer-motion';
import { Target, Eye, Users, Award, Zap, Globe, Linkedin, Github, Twitter, Mail } from 'lucide-react';

const AboutPage = () => {
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

  const teamMembers = [
    {
      name: 'Position Name',
      role: 'Chief Technology Officer (CTO)',
      bio: 'Leading our technical vision and architecture with expertise in scalable systems, AI integration, and cloud infrastructure. Passionate about building innovative solutions that solve complex business challenges.',
      initials: 'CTO',
      gradient: 'from-blue-500 to-cyan-500',
      social: {
        linkedin: '#',
        github: '#',
        twitter: '#',
        email: 'mailto:cto@ementech.com'
      }
    },
    {
      name: 'Position Name',
      role: 'Operations and Administrative Lead',
      bio: 'Driving operational excellence and streamlining business processes. Expert in project management, team coordination, and ensuring seamless delivery of our products and services.',
      initials: 'OAL',
      gradient: 'from-purple-500 to-pink-500',
      social: {
        linkedin: '#',
        email: 'mailto:ops@ementech.com'
      }
    },
    {
      name: 'Position Name',
      role: 'Lead System Architect',
      bio: 'Designing robust, scalable system architectures that power our products. Specializes in distributed systems, microservices, and enterprise-level software design patterns.',
      initials: 'LSA',
      gradient: 'from-orange-500 to-red-500',
      social: {
        linkedin: '#',
        github: '#',
        email: 'mailto:architect@ementech.com'
      }
    },
  ];

  return (
    <div className="min-h-screen py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-6">About Ementech</h1>
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
              animate={{ opacity: 1, y: 0 }}
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
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-12 rounded-3xl mb-20"
        >
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">Our Story</h2>
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

        {/* TEAM MEMBERS SECTION - CRITICAL */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-4">Leadership Team</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Meet the experienced professionals driving Ementech's vision and success
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.role}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index + 0.5 }}
                whileHover={{ y: -8 }}
                className="glass-card p-8 rounded-2xl group"
              >
                {/* Profile Photo/Initials */}
                <div className="flex flex-col items-center mb-6">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`w-28 h-28 rounded-full bg-gradient-to-br ${member.gradient} p-1 mb-4`}
                  >
                    <div className="w-full h-full rounded-full bg-dark-900 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">
                        {member.initials}
                      </span>
                    </div>
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-primary-400 transition-colors">
                    {member.name}
                  </h3>
                  <div className={`text-sm font-semibold bg-gradient-to-r ${member.gradient} bg-clip-text text-transparent`}>
                    {member.role}
                  </div>
                </div>

                {/* Bio */}
                <p className="text-gray-400 text-sm leading-relaxed mb-6 text-center">
                  {member.bio}
                </p>

                {/* Social Links */}
                <div className="flex justify-center space-x-4">
                  {member.social.linkedin && (
                    <motion.a
                      href={member.social.linkedin}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-dark-700 transition-all"
                      aria-label="LinkedIn"
                    >
                      <Linkedin size={18} />
                    </motion.a>
                  )}
                  {member.social.github && (
                    <motion.a
                      href={member.social.github}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-dark-700 transition-all"
                      aria-label="GitHub"
                    >
                      <Github size={18} />
                    </motion.a>
                  )}
                  {member.social.twitter && (
                    <motion.a
                      href={member.social.twitter}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center text-gray-400 hover:text-blue-400 hover:bg-dark-700 transition-all"
                      aria-label="Twitter"
                    >
                      <Twitter size={18} />
                    </motion.a>
                  )}
                  {member.social.email && (
                    <motion.a
                      href={member.social.email}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center text-gray-400 hover:text-primary-400 hover:bg-dark-700 transition-all"
                      aria-label="Email"
                    >
                      <Mail size={18} />
                    </motion.a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index + 0.9 }}
              className="glass-card p-8 rounded-2xl text-center"
            >
              <stat.icon className="w-8 h-8 text-primary-400 mx-auto mb-4" />
              <div className="text-4xl font-bold gradient-text mb-2">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage;
