
import React from 'react';
import { Loader } from 'lucide-react';

const LoadingAnimation: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-r from-gradapp-primary/5 to-gradapp-accent/5">
      <div className="relative">
        {/* Animated circles */}
        <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-gradapp-primary to-gradapp-secondary opacity-20 blur-xl animate-pulse" />
        <div className="absolute -inset-16 rounded-full border-2 border-gradapp-primary/20 animate-spin" style={{ animationDuration: '10s' }} />
        <div className="absolute -inset-12 rounded-full border-2 border-gradapp-secondary/20 animate-spin" style={{ animationDuration: '7s', animationDirection: 'reverse' }} />
        <div className="absolute -inset-8 rounded-full border-2 border-gradapp-accent/20 animate-spin" style={{ animationDuration: '15s' }} />
        
        {/* Center loader */}
        <div className="relative flex items-center justify-center w-32 h-32 bg-white rounded-full shadow-lg animate-scale-in">
          <Loader className="w-16 h-16 text-gradapp-primary animate-spin" />
        </div>
      </div>
      
      <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
        <h2 className="text-2xl font-bold text-gradapp-primary mb-2">
          Setting Up Your Profile
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Getting your graduate school application workspace ready...
        </p>
      </div>
    </div>
  );
};

export default LoadingAnimation;
