import React from 'react';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import SEOHead from '@/components/SEOHead';

const Onboarding: React.FC = () => {
  return (
    <>
      <SEOHead 
        title="Getting Started"
        description="Complete your profile setup to get personalized university recommendations"
        keywords="onboarding, profile setup, graduate school, university matching, cv upload"
      />
      <OnboardingWizard />
    </>
  );
};

export default Onboarding;