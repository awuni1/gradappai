import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const HomeIntro: React.FC = () => {
  // Fallback handler to ensure images always render even if remote hosts block requests
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // Prevent infinite loop if placeholder also fails
    if ((img as any).dataset.fallbackApplied) return;
    img.src = '/placeholder.svg';
    (img as any).dataset.fallbackApplied = 'true';
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Background pattern similar to SplitScreenHero */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
      </div>
      
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-6xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              variants={fadeInUp}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-6">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Everything you need</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Copy */}
              <motion.div variants={fadeInUp} className="text-center lg:text-left">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Built to guide you from search to admit
                  </span>
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                  GradApp brings together university matching, mentor guidance, document
                  creation, and application tracking—so you can focus on telling your story
                  and hitting your deadlines.
                </p>
              </motion.div>

              {/* Image collage */}
              <motion.div variants={fadeInUp} className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm bg-white/10 border border-white/20">
                  <img
                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                    alt="Students collaborating on applications"
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    onError={handleImgError}
                    className="w-full h-64 md:h-72 object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 w-36 md:w-44 rounded-xl overflow-hidden shadow-lg backdrop-blur-sm bg-white/90 border border-white/30">
                  <img
                    src="https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1986&q=80"
                    alt="University campus and graduation"
                    loading="lazy"
                    onError={handleImgError}
                    className="w-full h-28 md:h-32 object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HomeIntro;
