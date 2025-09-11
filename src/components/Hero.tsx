
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 z-0"></div>
      <div className="absolute top-0 right-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1488590528505-98d2b5aba04b')] 
        bg-cover bg-right-top opacity-10 z-0"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-gradapp-primary rounded-full filter blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradapp-secondary rounded-full filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight mb-6">
              Your <span className="bg-gradient-to-r from-gradapp-primary to-gradapp-secondary bg-clip-text text-transparent">Path to Graduate School Success</span> Starts Here
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl animate-slide-up" style={{ animationDelay: '0.3s' }}>
              Streamline your journey from application to acceptance with AI-powered guidance.
            </p>
            <div className="flex justify-start animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <Link to="/auth">
                <Button className="bg-gradapp-primary hover:bg-gradapp-accent text-white text-lg py-6 px-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  Get Started <ChevronRight className="ml-2" />
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-4 animate-slide-up" style={{ animationDelay: '0.7s' }}>
              <div className="flex -space-x-4">
                <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white font-bold hover:scale-110 transition-transform">J</div>
                <div className="w-10 h-10 rounded-full bg-purple-500 border-2 border-white flex items-center justify-center text-white font-bold hover:scale-110 transition-transform">S</div>
                <div className="w-10 h-10 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-white font-bold hover:scale-110 transition-transform">A</div>
              </div>
              <p className="text-sm text-gray-600">Join over <span className="font-bold">10,000</span> students who found their perfect program</p>
            </div>
          </div>
          
          <div className="flex-1 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="relative transition-transform hover:scale-[1.02] duration-500">
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-gradapp-primary to-gradapp-secondary blur-sm opacity-75"></div>
              <div className="relative bg-white rounded-lg shadow-xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1649972904349-6e44c42644a7" 
                  alt="Graduate student working on application" 
                  className="w-full h-64 md:h-[400px] object-cover transition-all duration-700 hover:scale-105"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <h3 className="text-white font-bold text-xl mb-2 animate-fade-in">Ready to Apply?</h3>
                  <p className="text-white/80 mb-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>Track deadlines, organize requirements, and submit with confidence</p>
                  <Link to="/auth">
                    <Button size="sm" variant="outline" className="bg-white text-gradapp-primary border-white hover:bg-white/90 transition-all duration-300 hover:-translate-y-1 hover:shadow-md animate-slide-up" style={{ animationDelay: '0.4s' }}>
                      Start Now
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

export default Hero;
