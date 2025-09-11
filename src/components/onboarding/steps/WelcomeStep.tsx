
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeStepProps {
  onNext: () => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  return (
    <div className="text-center space-y-6 animate-fade-in">
      <div className="w-24 h-24 bg-gradient-to-r from-gradapp-primary to-gradapp-accent rounded-full mx-auto flex items-center justify-center">
        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.17 1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
          <path d="M3.125 10.075a.9.9 0 01.4-.075 1 1 0 011 1v4.5c0 .763.445 1.358 1.257 1.676l.746.254a13.19 13.19 0 006.96 0l.364-.122c.74-.251 1.673-.677 1.673-1.677v-4.5a1 1 0 011-1 .9.9 0 01.4.075v4.689c0 2.395-1.661 3.276-2.73 3.716l-.366.125a15.328 15.328 0 01-8.114 0l-.587-.25C2.905 17.371 2 16.245 2 14.262v-4.188z" />
        </svg>
      </div>
      
      <h1 className="text-3xl font-bold text-gradapp-primary">Welcome to GradApp</h1>
      
      <p className="text-gray-600 max-w-xl mx-auto">
        We'll guide you through setting up your profile to explore graduate programs, 
        browse professors in your areas of interest, and organize your application materials.
      </p>
      
      <div className="bg-blue-50 p-4 rounded-lg max-w-lg mx-auto">
        <h3 className="font-medium text-gradapp-primary mb-2">What you'll need:</h3>
        <ul className="text-left text-sm text-gray-600 space-y-2">
          <li className="flex items-start">
            <span className="bg-gradapp-primary/20 p-1 rounded-full mr-2 mt-0.5">
              <svg className="w-3 h-3 text-gradapp-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
            Basic information about your academic background
          </li>
          <li className="flex items-start">
            <span className="bg-gradapp-primary/20 p-1 rounded-full mr-2 mt-0.5">
              <svg className="w-3 h-3 text-gradapp-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
            An idea of what type of programs you're interested in
          </li>
          <li className="flex items-start">
            <span className="bg-gradapp-primary/20 p-1 rounded-full mr-2 mt-0.5">
              <svg className="w-3 h-3 text-gradapp-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
            Research topics you'd like to explore in graduate school
          </li>
        </ul>
      </div>
      
      <p className="text-sm text-gray-500">
        This process takes about 5-10 minutes, and you can save your progress at any time.
      </p>
      
      <Button 
        onClick={onNext} 
        className="bg-gradapp-primary hover:bg-gradapp-accent text-white px-8 py-6 text-lg rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-lg mt-4"
      >
        Let's Get Started <ArrowRight className="ml-2" />
      </Button>
    </div>
  );
};

export default WelcomeStep;
