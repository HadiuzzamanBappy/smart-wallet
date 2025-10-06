import React from 'react';
import { ArrowRight, Lock, Star } from 'lucide-react';

const HeroSection = ({ onGetStarted }) => {
  return (
    <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 rounded-full text-sm font-medium mb-8">
            <Lock className="w-4 h-4" />
            <span>Privacy-First Finance Tracking</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Track Your Money,{' '}
            <span className="bg-gradient-to-r from-teal-500 to-blue-600 bg-clip-text text-transparent">
              Protect Your Privacy
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            A secure, AI-powered personal finance tracker that encrypts your data before it ever leaves your device. 
            Track income, expenses, loans, and credits with natural language input.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onGetStarted}
              className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <span>Start Tracking Free</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span>Privacy-focused • No tracking • Open source</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;