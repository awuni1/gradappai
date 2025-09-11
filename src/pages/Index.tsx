import React from 'react';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import Footer from '@/components/Footer';
import SplitScreenHero from '@/components/ui/SplitScreenHero';
import SEOHead from '@/components/SEOHead';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title="GradApp - Graduate School Platform"
        description="Streamline your graduate school journey with smart university matching, scholarship discovery, and faculty connections. Join thousands of students achieving their academic dreams."
        keywords="graduate school, university matching, scholarship discovery, faculty connections, grad school applications, higher education"
      />
      <AuthenticatedHeader />
      
      <main className="flex-grow">
        {/* New Split Screen Hero */}
        <SplitScreenHero />
        
        {/* Additional sections can be added here */}
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;