import React from 'react';
import LandingNav from './LandingNav';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import DemoSection from './DemoSection';
import CTASection from './CTASection';
import LandingFooter from './LandingFooter';

const LandingPage = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-teal-900">
      <LandingNav onGetStarted={onGetStarted} />
      <HeroSection onGetStarted={onGetStarted} />
      <FeaturesSection />
      <DemoSection />
      <CTASection onGetStarted={onGetStarted} />
      <LandingFooter />
    </div>
  );
};

export default LandingPage;