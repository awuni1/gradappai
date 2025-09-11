import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Shield, Award, Globe, Users, Star } from 'lucide-react';

const TrustIndicators: React.FC = () => {
  const universities = [
    {
      name: "MIT",
      logo: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
      alt: "Top university partnership"
    },
    {
      name: "Stanford",
      logo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
      alt: "Top university partnership"
    },
    {
      name: "Harvard",
      logo: "https://images.unsplash.com/photo-1494790108755-2616b612b898?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
      alt: "Top university partnership"
    },
    {
      name: "Berkeley",
      logo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      alt: "Top university partnership"
    },
  ];

  const trustMetrics = [
    { icon: Shield, value: "100%", label: "Secure Platform" },
    { icon: Users, value: "12K+", label: "Success Stories" },
    { icon: Globe, value: "50+", label: "Countries Served" },
    { icon: Award, value: "4.9/5", label: "Average Rating" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="text-center space-y-8"
    >
      {/* Main Trust Badge */}
      <div className="inline-flex items-center gap-2 px-6 py-3 backdrop-blur-sm bg-white/20 rounded-full border border-white/30">
        <CheckCircle className="w-5 h-5 text-green-500" />
        <span className="text-sm font-medium text-gray-700">
          Trusted by top universities and industry leaders
        </span>
      </div>

      {/* University Partnerships */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true }}
        className="flex flex-col items-center space-y-4"
      >
        <p className="text-sm text-gray-600 font-medium">Partnered with leading institutions</p>
        <div className="flex items-center justify-center space-x-6">
          {universities.map((university, index) => (
            <motion.div
              key={university.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.1 }}
              className="group"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 group-hover:border-white/40 transition-all duration-300">
                <img
                  src={university.logo}
                  alt={`${university.name} university partnership logo`}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                  loading="lazy"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Trust Metrics */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        viewport={{ once: true }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto"
      >
        {trustMetrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
            viewport={{ once: true }}
            className="text-center p-3 backdrop-blur-sm bg-white/10 rounded-lg border border-white/20"
          >
            <div className="flex justify-center mb-2">
              <metric.icon className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-lg font-bold text-gray-800">{metric.value}</div>
            <div className="text-xs text-gray-600">{metric.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Star Rating Display */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        viewport={{ once: true }}
        className="flex items-center justify-center space-x-1"
      >
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.7 + i * 0.1 }}
            viewport={{ once: true }}
          >
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
          </motion.div>
        ))}
        <span className="ml-2 text-sm text-gray-600 font-medium">
          Based on 5,000+ reviews
        </span>
      </motion.div>
    </motion.div>
  );
};

export default TrustIndicators;