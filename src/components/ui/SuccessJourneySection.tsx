import React, { useEffect, useState } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { 
  Search, 
  Users, 
  FileText, 
  Trophy, 
  ArrowRight,
  Star,
  Quote,
  CheckCircle,
  Sparkles,
  Calendar,
  Target
} from 'lucide-react';

const SuccessJourneySection: React.FC = () => {
  const controls = useAnimation();
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [controls, isInView]);

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

  const journeySteps = [
    {
      id: 1,
      icon: Search,
      title: "Discover Your Path",
      description: "AI-powered matching finds your perfect graduate programs",
      details: "Our advanced algorithm analyzes your profile, interests, and goals to recommend the best-fit programs from over 2,000 universities worldwide.",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50"
    },
    {
      id: 2,
      icon: Users,
      title: "Connect with Mentors",
      description: "Get guidance from industry experts and successful alumni",
      details: "Match with verified mentors who graduated from your target programs. Receive personalized advice, insider tips, and ongoing support throughout your journey.",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50"
    },
    {
      id: 3,
      icon: FileText,
      title: "Perfect Your Application",
      description: "Craft compelling essays and documents with expert review",
      details: "Our mentors provide detailed feedback on your statements, essays, and application materials. Track deadlines and requirements with our comprehensive management system.",
      image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1473&q=80",
      color: "from-green-500 to-teal-500",
      bgColor: "bg-green-50"
    },
    {
      id: 4,
      icon: Trophy,
      title: "Celebrate Success",
      description: "Join thousands who achieved their graduate school dreams",
      details: "With personalized guidance and comprehensive support, our students achieve a 95% acceptance rate to their preferred programs. Your success story starts here.",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-50"
    }
  ];

  const successStories = [
    {
      name: "Sarah Chen",
      program: "MIT Computer Science",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b898?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
      quote: "The personalized mentorship and AI-powered matching helped me get into my dream program. I couldn't have done it without GradApp!",
      achievement: "Full Scholarship",
      timeline: "8 months"
    },
    {
      name: "Marcus Johnson",
      program: "Stanford MBA",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
      quote: "The mentor network is incredible. My mentor was a Stanford MBA alum who guided me through every step of the application process.",
      achievement: "Dean's List",
      timeline: "10 months"
    },
    {
      name: "Emily Rodriguez",
      program: "Harvard Medical School",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      quote: "From application strategy to interview prep, GradApp provided comprehensive support that made the difference in my acceptance.",
      achievement: "Top 10%",
      timeline: "12 months"
    }
  ];

  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % journeySteps.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20 relative overflow-hidden" ref={ref}>
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-200/20 to-cyan-200/20 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={controls}
          className="text-center mb-16"
        >
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-6"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Your Success Journey</span>
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Your Path to Graduate Success
            </span>
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            From discovery to celebration, we guide you through every step of your graduate school journey
            with personalized support, expert mentorship, and AI-powered tools.
          </motion.p>
        </motion.div>

        {/* Journey Steps */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={controls}
          className="grid lg:grid-cols-2 gap-12 mb-20"
        >
          {/* Interactive Timeline */}
          <div className="space-y-8">
            {journeySteps.map((step, index) => (
              <motion.div
                key={step.id}
                variants={fadeInUp}
                className={`relative ${index === activeStep ? 'scale-105' : ''} transition-all duration-500`}
                onMouseEnter={() => setActiveStep(index)}
              >
                <div className={`p-6 rounded-2xl backdrop-blur-sm border transition-all duration-500 ${
                  index === activeStep 
                    ? 'bg-white/40 border-white/50 shadow-xl' 
                    : 'bg-white/20 border-white/30 hover:bg-white/30'
                }`}>
                  <div className="flex items-start gap-4">
                    {/* Step Number & Icon */}
                    <div className={`flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-r ${step.color} flex items-center justify-center ${
                      index === activeStep ? 'scale-110' : ''
                    } transition-all duration-500`}>
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-500">Step {step.id}</span>
                        {index === activeStep && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 bg-purple-500 rounded-full"
                          />
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{step.title}</h3>
                      <p className="text-gray-600 mb-3">{step.description}</p>
                      <p className="text-sm text-gray-500">{step.details}</p>
                    </div>
                  </div>
                </div>

                {/* Connection Line */}
                {index < journeySteps.length - 1 && (
                  <div className="absolute left-8 -bottom-4 w-0.5 h-8 bg-gradient-to-b from-purple-300 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Visual Display */}
          <div className="relative">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative rounded-2xl overflow-hidden shadow-2xl"
            >
              <img
                src={journeySteps[activeStep].image}
                alt={journeySteps[activeStep].title}
                className="w-full h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h4 className="text-2xl font-bold text-white mb-2">
                  {journeySteps[activeStep].title}
                </h4>
                <p className="text-white/90">
                  {journeySteps[activeStep].description}
                </p>
              </div>
            </motion.div>

            {/* Step Indicators */}
            <div className="flex justify-center mt-6 space-x-2">
              {journeySteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveStep(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === activeStep 
                      ? 'bg-purple-600 scale-125' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Success Stories */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={controls}
          className="mb-16"
        >
          <motion.div
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <h3 className="text-3xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Real Success Stories
              </span>
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Hear from students who transformed their dreams into reality with our platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <motion.div
                key={story.name}
                variants={fadeInUp}
                whileHover={{ y: -10 }}
                className="group relative p-6 backdrop-blur-sm bg-white/20 rounded-2xl border border-white/30 hover:bg-white/30 transition-all duration-300"
              >
                {/* Quote Icon */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Quote className="w-4 h-4 text-white" />
                </div>

                {/* Profile */}
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={story.image}
                    alt={story.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white"
                  />
                  <div>
                    <h4 className="font-bold text-gray-800">{story.name}</h4>
                    <p className="text-sm text-purple-600 font-medium">{story.program}</p>
                  </div>
                </div>

                {/* Quote */}
                <p className="text-gray-600 italic mb-4">"{story.quote}"</p>

                {/* Achievements */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-gray-600">{story.achievement}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-600">{story.timeline}</span>
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default SuccessJourneySection;