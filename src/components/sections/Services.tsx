import { motion } from 'framer-motion';
import { Code, Brain, Cpu, Database, Globe, Smartphone, ArrowRight } from 'lucide-react';

const Services = () => {
  const services = [
    {
      icon: Code,
      title: 'Custom Software Development',
      description: 'Tailored software solutions built with modern technologies to meet your unique business requirements.',
      features: ['Web Applications', 'Mobile Apps', 'API Development', 'Cloud Solutions'],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Brain,
      title: 'AI & Machine Learning',
      description: 'Intelligent solutions that leverage artificial intelligence to automate processes and generate insights.',
      features: ['Predictive Analytics', 'Natural Language Processing', 'Computer Vision', 'Automation'],
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Globe,
      title: 'Web Development',
      description: 'Modern, responsive websites and web applications built with cutting-edge frameworks and technologies.',
      features: ['React/Next.js', 'Full-Stack Solutions', 'E-commerce', 'Progressive Web Apps'],
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Database,
      title: 'Data Engineering',
      description: 'Robust data infrastructure and analytics solutions to help you make data-driven decisions.',
      features: ['Data Pipelines', 'Database Design', 'Business Intelligence', 'Data Visualization'],
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Cpu,
      title: 'Cloud Solutions',
      description: 'Scalable cloud infrastructure design, deployment, and management for optimal performance.',
      features: ['AWS/Azure/GCP', 'DevOps', 'Containerization', 'Serverless Architecture'],
      color: 'from-indigo-500 to-blue-500'
    },
    {
      icon: Smartphone,
      title: 'Mobile Development',
      description: 'Cross-platform mobile applications that deliver exceptional user experiences.',
      features: ['React Native', 'iOS & Android', 'UI/UX Design', 'App Maintenance'],
      color: 'from-rose-500 to-pink-500'
    },
  ];

  return (
    <section id="services" className="py-24 relative">
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
          <h2 className="section-title">Our Services</h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Comprehensive technology solutions to accelerate your digital transformation
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="glass-card p-8 rounded-2xl group"
            >
              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} p-0.5 mb-6`}>
                <div className="w-full h-full bg-dark-900 rounded-2xl flex items-center justify-center">
                  <service.icon className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary-400 transition-colors">
                {service.title}
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                {service.description}
              </p>

              {/* Features */}
              <ul className="space-y-2">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center space-x-2 text-sm text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 glass-card p-12 rounded-3xl"
        >
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Business?
            </h3>
            <p className="text-gray-400 mb-8">
              Let's discuss how our solutions can help you achieve your goals.
            </p>
            <a
              href="#contact"
              className="glow-button inline-flex items-center space-x-2 px-8 py-4 rounded-lg bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold"
            >
              <span>Start a Conversation</span>
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Services;
