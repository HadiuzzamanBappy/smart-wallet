import React from 'react';
import LandingNav from '../components/Landing/LandingNav';
import HeroSection from '../components/Landing/HeroSection';
import FeaturesSection from '../components/Landing/FeaturesSection';
import DemoSection from '../components/Landing/DemoSection';
import CTASection from '../components/Landing/CTASection';
import LandingFooter from '../components/Landing/LandingFooter';

const LandingPage = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-paper-50 dark:bg-ink-950 transition-colors duration-500 relative overflow-hidden">
      {/* Subtle Atmospheric Glow - Nexus Atmosphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-primary-500/[0.03] dark:bg-primary-500/[0.05] rounded-full blur-[180px] pointer-events-none z-0" />
      <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-secondary-500/[0.02] dark:bg-secondary-500/[0.04] rounded-full blur-[140px] pointer-events-none z-0" />

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