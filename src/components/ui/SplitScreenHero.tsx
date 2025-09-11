import React, { useEffect, useState } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  Users, 
  Target, 
  Award, 
  BookOpen, 
  TrendingUp,
  Star,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';
import HeroImageCard from './HeroImageCard';
import TrustIndicators from './TrustIndicators';

const SplitScreenHero: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredSide, setHoveredSide] = useState<'student' /*| 'mentor'*/ | null>(null);
  const controls = useAnimation();
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [controls, isInView]);

  const handleStudentPath = () => {
    navigate('/auth/student');
  };

  // const handleMentorPath = () => {
  //   navigate('/auth/mentor');
  // };

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

  const TypewriterText: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => {
    const [displayText, setDisplayText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
      const timer = setTimeout(() => {
        if (currentIndex < text.length) {
          setDisplayText(prev => prev + text[currentIndex]);
          setCurrentIndex(prev => prev + 1);
        }
      }, 50 + delay);

      return () => clearTimeout(timer);
    }, [currentIndex, text, delay]);

    return <span>{displayText}</span>;
  };

  return (
    <div className="relative min-h-screen overflow-hidden" ref={ref}>
      {/* Animated Background */}
      <AnimatedBackground className="z-0" />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="container mx-auto px-4 py-12">
          {/* Header Section */}
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
              <span className="text-sm font-medium text-gray-700">Welcome to GradApp</span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl md:text-6xl font-bold mb-6"
            >
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                <TypewriterText text="Your Journey to" />
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                <TypewriterText text="Success Starts Here" delay={1000} />
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-600 max-w-3xl mx-auto mb-8"
            >
              Whether you're pursuing your dream program or want to guide the next generation,
              our platform connects ambitions with opportunities.
            </motion.p>
          </motion.div>

          {/* Split Screen Section */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={controls}
            className="grid lg:grid-cols-1 gap-8 lg:gap-16 max-w-4xl mx-auto"
          >
            {/* Student Side */}
            <motion.div
              variants={fadeInUp}
              className="relative"
              // onMouseEnter={() => setHoveredSide('student')}
              // onMouseLeave={() => setHoveredSide(null)}
            >
              <motion.div
                // animate={{
                //   scale: hoveredSide === 'student' ? 1.02 : hoveredSide === 'mentor' ? 0.98 : 1,
                // }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <HeroImageCard
                  title="Find Your Path"
                  subtitle="For Students & Applicants"
                  description="Discover your perfect graduate program with smart matching, expert guidance, and a supportive community."
                  icon={GraduationCap}
                  onClick={handleStudentPath}
                  theme="student"
                  features={[
                    "Smart university matching",
                    "Expert mentorship network",
                    "Application tracking tools",
                    "Document creation assistance"
                  ]}
                  heroImageUrl="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                  className="h-full"
                />
              </motion.div>

              {/* Student Statistics */}
              <motion.div
                variants={fadeInUp}
                className="mt-8 grid grid-cols-2 gap-4"
              >
                <div className="text-center p-4 backdrop-blur-sm bg-white/20 rounded-xl border border-white/30">
                  <div className="flex justify-center mb-2">
                    <div className="flex -space-x-2">
                      <img 
                        src="https://images.unsplash.com/photo-1494790108755-2616b612b898?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80" 
                        alt="Student success story" 
                        className="w-6 h-6 rounded-full border-2 border-white object-cover"
                      />
                      <img 
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80" 
                        alt="Student success story" 
                        className="w-6 h-6 rounded-full border-2 border-white object-cover"
                      />
                      <img 
                        src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
                        alt="Student success story" 
                        className="w-6 h-6 rounded-full border-2 border-white object-cover"
                      />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">10,000+</div>
                  <div className="text-sm text-gray-600">Successful Applicants</div>
                </div>
                <div className="text-center p-4 backdrop-blur-sm bg-white/20 rounded-xl border border-white/30">
                  <div className="flex justify-center mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">95%</div>
                  <div className="text-sm text-gray-600">Acceptance Rate</div>
                </div>
              </motion.div>

              {/* Student Features */}
              <motion.div
                variants={staggerContainer}
                className="mt-8 space-y-4"
              >
                {[
                  { icon: Target, text: "Perfect program matches", color: "text-blue-500" },
                  { icon: BookOpen, text: "Comprehensive resources", color: "text-cyan-500" },
                  { icon: Users, text: "Peer community", color: "text-teal-500" },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="flex items-center gap-3 p-3 backdrop-blur-sm bg-white/10 rounded-lg"
                  >
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                    <span className="text-gray-700 font-medium">{feature.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Mentor Side - COMMENTED OUT */}
            {/*
            <motion.div
              variants={fadeInUp}
              className="relative"
              onMouseEnter={() => setHoveredSide('mentor')}
              onMouseLeave={() => setHoveredSide(null)}
            >
              <motion.div
                animate={{
                  scale: hoveredSide === 'mentor' ? 1.02 : hoveredSide === 'student' ? 0.98 : 1,
                }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <HeroImageCard
                  title="Shape Futures"
                  subtitle="For Mentors & Professionals"
                  description="Share your expertise, guide aspiring students, and make a meaningful impact while building your professional network."
                  icon={Users}
                  onClick={handleMentorPath}
                  theme="mentor"
                  features={[
                    "Flexible mentoring schedule",
                    "Professional recognition",
                    "Networking opportunities",
                    "Impact tracking dashboard"
                  ]}
                  heroImageUrl="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80"
                  className="h-full"
                />
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="mt-8 grid grid-cols-2 gap-4"
              >
                <div className="text-center p-4 backdrop-blur-sm bg-white/20 rounded-xl border border-white/30">
                  <div className="flex justify-center mb-2">
                    <div className="flex -space-x-2">
                      <img 
                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
                        alt="Professional mentor" 
                        className="w-6 h-6 rounded-full border-2 border-white object-cover"
                      />
                      <img 
                        src="https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1061&q=80" 
                        alt="Professional mentor" 
                        className="w-6 h-6 rounded-full border-2 border-white object-cover"
                      />
                      <img 
                        src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80" 
                        alt="Professional mentor" 
                        className="w-6 h-6 rounded-full border-2 border-white object-cover"
                      />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">2,500+</div>
                  <div className="text-sm text-gray-600">Active Mentors</div>
                </div>
                <div className="text-center p-4 backdrop-blur-sm bg-white/20 rounded-xl border border-white/30">
                  <div className="flex justify-center mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                      <Star className="w-4 h-4 text-white fill-current" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">4.9★</div>
                  <div className="text-sm text-gray-600">Mentor Rating</div>
                </div>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                className="mt-8 space-y-4"
              >
                {[
                  { icon: Award, text: "Professional recognition", color: "text-purple-500" },
                  { icon: TrendingUp, text: "Impact analytics", color: "text-pink-500" },
                  { icon: Star, text: "Expert community", color: "text-rose-500" },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="flex items-center gap-3 p-3 backdrop-blur-sm bg-white/10 rounded-lg"
                  >
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                    <span className="text-gray-700 font-medium">{feature.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
            */}
          </motion.div>

          {/* Bottom Trust Section */}
          <motion.div
            variants={fadeInUp}
            className="mt-16"
          >
            <TrustIndicators />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SplitScreenHero;