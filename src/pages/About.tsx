
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book, Award, GraduationCap, BookOpen, Globe, Layers } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

const About = () => {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <>
      <SEOHead 
        title="About"
        description="Learn about GradApp's mission to streamline graduate school applications"
        keywords="about gradapp, graduate school platform, university matching, ai-powered applications"
      />
      <div className="min-h-screen flex flex-col">
      <AuthenticatedHeader />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative">
          <div className="bg-gradient-to-r from-gradapp-primary to-gradapp-secondary py-20 px-4">
            <div className="container mx-auto text-center text-white">
              <motion.h1 
                className="text-4xl md:text-5xl font-bold mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                About GradApp
              </motion.h1>
              <motion.p 
                className="text-xl max-w-3xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Your intelligent companion on the path to graduate success
              </motion.p>
            </div>
          </div>
          
          <div className="container mx-auto px-4 -mt-12">
            <motion.div 
              className="bg-white rounded-lg shadow-xl p-6 md:p-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <p className="text-lg md:text-xl text-center mb-6">
                GradApp is revolutionizing how students approach graduate school applications through 
                AI-powered tools that simplify complex processes and increase acceptance rates.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-gradient-to-r from-gradapp-primary to-gradapp-secondary p-4 rounded-full">
                      <GraduationCap className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Our Mission</h3>
                  <p className="text-muted-foreground">
                    To democratize access to higher education by giving every student the tools they need to create winning applications.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-gradient-to-r from-gradapp-primary to-gradapp-secondary p-4 rounded-full">
                      <Globe className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Our Vision</h3>
                  <p className="text-muted-foreground">
                    A world where every qualified student finds their perfect academic match, regardless of background or resources.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-gradient-to-r from-gradapp-primary to-gradapp-secondary p-4 rounded-full">
                      <Award className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Our Values</h3>
                  <p className="text-muted-foreground">
                    Integrity, innovation, inclusivity, and empowerment drive everything we do at GradApp.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
        
        {/* Our Story Section */}
        <section className="py-16 px-4 bg-slate-50">
          <div className="container mx-auto">
            <motion.div 
              className="text-center mb-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-3xl font-bold mb-4">Our Story</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                GradApp was born from a simple observation: the graduate application process is unnecessarily complex, stressful, and inequitable.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
              >
                <h3 className="text-2xl font-bold mb-4">The Problem We're Solving</h3>
                <p className="mb-4">
                  Every year, millions of talented students struggle to navigate the complex graduate application process. 
                  Many don't know how to find programs that match their interests, craft compelling personal statements, 
                  or connect with potential advisors.
                </p>
                <p>
                  This leads to missed opportunities, mismatched programs, and rejected applications—not because students 
                  lack qualifications, but because they lack guidance and resources.
                </p>
              </motion.div>
              
              <motion.div
                className="rounded-lg overflow-hidden shadow-lg"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
              >
                <img 
                  src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                  alt="Student working on graduate application" 
                  className="w-full h-auto"
                />
              </motion.div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mt-20">
              <motion.div
                className="rounded-lg overflow-hidden shadow-lg order-2 md:order-1"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
              >
                <img 
                  src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                  alt="GradApp solution" 
                  className="w-full h-auto"
                />
              </motion.div>
              
              <motion.div
                className="order-1 md:order-2"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
              >
                <h3 className="text-2xl font-bold mb-4">The GradApp Solution</h3>
                <p className="mb-4">
                  GradApp leverages cutting-edge AI technology to analyze student profiles, match them with ideal programs, 
                  connect them with compatible research advisors, and generate customized application documents.
                </p>
                <p>
                  Our platform doesn't just simplify the process—it transforms it into a strategic, 
                  data-driven journey that significantly increases acceptance rates and leads to better academic fits.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* What We Offer Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <motion.div 
              className="text-center mb-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-3xl font-bold mb-4">What We Offer</h2>
              <p className="text-muted-foreground max-w-3xl mx-auto">
                Our intelligent platform provides everything you need to find and apply to your perfect graduate programs.
              </p>
            </motion.div>
            
            <Tabs defaultValue="match" className="w-full">
              <div className="flex justify-center mb-6">
                <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full max-w-3xl">
                  <TabsTrigger value="match">Program Matching</TabsTrigger>
                  <TabsTrigger value="advisor">Advisor Matching</TabsTrigger>
                  <TabsTrigger value="documents">Document Generation</TabsTrigger>
                  <TabsTrigger value="tracking">Application Tracking</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="match">
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="mb-4 text-gradapp-primary">
                        <BookOpen className="h-12 w-12" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Intelligent Program Matching</h3>
                      <p className="text-muted-foreground">
                        Our algorithm analyzes your academic background, research interests, and career goals to identify programs 
                        that represent your ideal match. We consider over 50 factors including faculty research alignment, 
                        funding opportunities, and admission statistics to provide you with personalized recommendations.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <img 
                    src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                    alt="Program matching interface" 
                    className="rounded-lg shadow-lg"
                  />
                </motion.div>
              </TabsContent>
              
              <TabsContent value="advisor">
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                >
                  <img 
                    src="https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                    alt="Advisor matching interface" 
                    className="rounded-lg shadow-lg order-2 md:order-1"
                  />
                  
                  <Card className="order-1 md:order-2">
                    <CardContent className="p-6">
                      <div className="mb-4 text-gradapp-primary">
                        <Book className="h-12 w-12" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Professor Research Matching</h3>
                      <p className="text-muted-foreground">
                        Finding the right research advisor is crucial for graduate success. GradApp analyzes publication records, 
                        research statements, and ongoing projects to connect you with professors whose work aligns with your interests. 
                        We even generate customized outreach templates to help you make that crucial first impression.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
              
              <TabsContent value="documents">
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="mb-4 text-gradapp-primary">
                        <Layers className="h-12 w-12" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Document Generation & Optimization</h3>
                      <p className="text-muted-foreground">
                        Our AI-powered document engine helps you create compelling statements of purpose, research statements, 
                        CVs, and personal statements tailored to each program. We provide guidance on structure, content, 
                        and program-specific emphasis to maximize your application's impact.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <img 
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                    alt="Document generation interface" 
                    className="rounded-lg shadow-lg"
                  />
                </motion.div>
              </TabsContent>
              
              <TabsContent value="tracking">
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                >
                  <img 
                    src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                    alt="Application tracking interface" 
                    className="rounded-lg shadow-lg order-2 md:order-1"
                  />
                  
                  <Card className="order-1 md:order-2">
                    <CardContent className="p-6">
                      <div className="mb-4 text-gradapp-primary">
                        <GraduationCap className="h-12 w-12" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Application Progress Tracking</h3>
                      <p className="text-muted-foreground">
                        Managing multiple applications can be overwhelming. Our comprehensive tracking system helps you monitor 
                        deadlines, requirements, and submission status across all your applications. We provide timely reminders 
                        and a visual dashboard to ensure nothing falls through the cracks.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
        
        {/* Impact Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-gradapp-primary to-gradapp-secondary text-white">
          <div className="container mx-auto">
            <motion.div 
              className="text-center mb-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-3xl font-bold mb-4">Our Impact</h2>
              <p className="text-xl max-w-3xl mx-auto opacity-90">
                GradApp is transforming graduate admissions outcomes for students worldwide
              </p>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.div 
                className="bg-white/10 backdrop-blur-md rounded-lg p-8 text-center"
                variants={fadeIn}
              >
                <div className="text-4xl font-bold mb-2">85%</div>
                <p className="text-lg opacity-90">
                  Of GradApp users report getting into a higher-ranked program than they initially targeted
                </p>
              </motion.div>
              
              <motion.div 
                className="bg-white/10 backdrop-blur-md rounded-lg p-8 text-center"
                variants={fadeIn}
              >
                <div className="text-4xl font-bold mb-2">68%</div>
                <p className="text-lg opacity-90">
                  Increase in successful research advisor connections for students using our platform
                </p>
              </motion.div>
              
              <motion.div 
                className="bg-white/10 backdrop-blur-md rounded-lg p-8 text-center"
                variants={fadeIn}
              >
                <div className="text-4xl font-bold mb-2">10,000+</div>
                <p className="text-lg opacity-90">
                  Students have successfully navigated the graduate application process with GradApp
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <motion.div 
              className="text-center mb-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">
                Get answers to common questions about GradApp and how it can help you.
              </p>
            </motion.div>
            
            <div className="space-y-6">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
              >
                <div className="bg-white shadow-md rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-2">How does GradApp match me with graduate programs?</h3>
                  <p className="text-muted-foreground">
                    Our sophisticated algorithm analyzes your academic background, research interests, career goals, and preferences 
                    to identify programs that represent your ideal match. We consider over 50 factors including faculty research alignment, 
                    funding opportunities, and admission statistics to provide you with personalized recommendations.
                  </p>
                </div>
              </motion.div>
              
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
              >
                <div className="bg-white shadow-md rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-2">Can GradApp help with my application documents?</h3>
                  <p className="text-muted-foreground">
                    Yes! Our AI-powered document engine helps you create compelling statements of purpose, research statements, 
                    CVs, and personal statements tailored to each program. We provide guidance on structure, content, and program-specific 
                    emphasis to maximize your application's impact.
                  </p>
                </div>
              </motion.div>
              
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
              >
                <div className="bg-white shadow-md rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-2">Is GradApp suitable for all fields of study?</h3>
                  <p className="text-muted-foreground">
                    Absolutely! GradApp supports applications across all major academic disciplines, including STEM fields, humanities, 
                    social sciences, business, law, medicine, and the arts. Our database includes programs from universities worldwide, 
                    ensuring comprehensive coverage regardless of your field of interest.
                  </p>
                </div>
              </motion.div>
              
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
              >
                <div className="bg-white shadow-md rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-2">How does the advisor matching feature work?</h3>
                  <p className="text-muted-foreground">
                    Finding the right research advisor is crucial for graduate success. GradApp analyzes publication records, 
                    research statements, and ongoing projects to connect you with professors whose work aligns with your interests. 
                    We even generate customized outreach templates to help you make that crucial first impression.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 px-4 bg-slate-50">
          <div className="container mx-auto max-w-4xl text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Begin Your Graduate Journey?</h2>
              <p className="text-lg mb-8">
                Join thousands of successful applicants who found their perfect graduate programs using GradApp's intelligent matching tools.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link 
                  to="/auth"
                  className="bg-gradient-to-r from-gradapp-primary to-gradapp-secondary hover:from-gradapp-primary/90 hover:to-gradapp-secondary/90 text-white font-bold py-3 px-8 rounded-md transition-all hover:shadow-lg hover:scale-105 transform"
                >
                  Get Started Now
                </Link>
                <Link 
                  to="/contact"
                  className="bg-white border border-gradapp-primary text-gradapp-primary hover:bg-gradapp-primary hover:text-white font-bold py-3 px-8 rounded-md transition-all hover:shadow-lg hover:scale-105 transform"
                >
                  Contact Us
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
      </div>
    </>
  );
};

export default About;
