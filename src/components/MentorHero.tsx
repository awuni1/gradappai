import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, Users, Star, Clock, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const MentorHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f')] 
        bg-cover bg-center opacity-5"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-purple-400 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-400 rounded-full filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 animate-fade-in">
            <div className="flex items-center gap-2 mb-4 animate-slide-up">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full p-2">
                <Users className="h-6 w-6 text-white" />
              </div>
              <span className="text-purple-700 font-semibold text-lg">FOR MENTORS</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight mb-6">
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Shape the Future</span> of Graduate Education
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl animate-slide-up" style={{ animationDelay: '0.3s' }}>
              Join our community of experienced mentors and guide ambitious students through their graduate school journey. Make a meaningful impact while building your professional network.
            </p>

            {/* Key Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-md">
                <div className="bg-purple-100 rounded-full p-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Flexible</h3>
                  <p className="text-sm text-gray-600">Set your own schedule</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-md">
                <div className="bg-indigo-100 rounded-full p-2">
                  <Award className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Impactful</h3>
                  <p className="text-sm text-gray-600">Change lives directly</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-md">
                <div className="bg-blue-100 rounded-full p-2">
                  <Star className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Rewarding</h3>
                  <p className="text-sm text-gray-600">Professional growth</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '0.7s' }}>
              <Link to="/mentor/auth">
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-lg py-6 px-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg w-full sm:w-auto">
                  Become a Mentor <ChevronRight className="ml-2" />
                </Button>
              </Link>
              <Link to="/mentor">
                <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 text-lg py-6 px-8 w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>
            
            <div className="mt-8 flex items-center gap-4 animate-slide-up" style={{ animationDelay: '0.9s' }}>
              <div className="flex -space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 border-2 border-white flex items-center justify-center text-white font-bold hover:scale-110 transition-transform">
                  Dr. S
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 border-2 border-white flex items-center justify-center text-white font-bold hover:scale-110 transition-transform">
                  Prof. M
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-white flex items-center justify-center text-white font-bold hover:scale-110 transition-transform">
                  Dr. L
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Join <span className="font-bold text-purple-700">500+</span> mentors already making a difference</p>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">4.9/5 mentor satisfaction</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="relative transition-transform hover:scale-[1.02] duration-500">
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 blur-sm opacity-75"></div>
              <div className="relative bg-white rounded-lg shadow-xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1573164713714-d95e436ab8d6" 
                  alt="Professional mentor guiding student" 
                  className="w-full h-64 md:h-[400px] object-cover transition-all duration-700 hover:scale-105"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <h3 className="text-white font-bold text-xl mb-2 animate-fade-in">Ready to Mentor?</h3>
                  <p className="text-white/80 mb-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    Connect with motivated students and guide them to success
                  </p>
                  <Link to="/mentor/auth">
                    <Button size="sm" variant="outline" className="bg-white text-purple-600 border-white hover:bg-white/90 transition-all duration-300 hover:-translate-y-1 hover:shadow-md animate-slide-up" style={{ animationDelay: '0.4s' }}>
                      Start Mentoring
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MentorHero;