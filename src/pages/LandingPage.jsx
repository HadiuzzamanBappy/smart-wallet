import React from 'react';
import LandingNav from '../components/Landing/LandingNav';
import HeroSection from '../components/Landing/HeroSection';
import FeaturesSection from '../components/Landing/FeaturesSection';
import DemoSection from '../components/Landing/DemoSection';
import CTASection from '../components/Landing/CTASection';
import LandingFooter from '../components/Landing/LandingFooter';

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