import React from 'react';
import { Shield, Zap, Github } from 'lucide-react';

const CTASection = ({ onGetStarted }) => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-teal-500 to-blue-600">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          Ready to take control of your finances?
        </h2>
        <p className="text-xl text-teal-100 mb-8">
          Join thousands of users who trust Wallet Tracker to keep their financial data private and secure.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onGetStarted}
            className="px-8 py-4 bg-white text-teal-600 rounded-xl font-semibold hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            Get Started for Free
          </button>
          <a
            href="https://github.com/HadiuzzamanBappy/Wallet-Tracker"
            target="_blank"
            rel="noopener noreferrer" 
            className="flex items-center justify-center space-x-2 px-8 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-white hover:text-teal-600 transition-all duration-200"
          >
            <Github className="w-5 h-5" />
            <span>View on GitHub</span>
          </a>
        </div>
        
        <div className="mt-8 flex items-center justify-center space-x-6 text-teal-100 text-sm">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>100% Private</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>No Setup Required</span>
          </div>
          <div className="flex items-center space-x-2">
            <Github className="w-4 h-4" />
            <span>Open Source</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;