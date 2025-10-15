import React from 'react';
import { Wallet, Github } from 'lucide-react';

const LandingNav = ({ onGetStarted }) => {
  return (
    <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/20 dark:border-gray-700/20 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <img
              src="/favicon/favicon.svg"
              alt="Smart Wallet Logo"
              className="w-8 h-8"
              onError={(e) => {
                // Fallback to Wallet icon if logo fails to load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <Wallet className="w-6 h-6 text-teal-600 dark:text-teal-400" style={{ display: 'none' }} />
            <span className="text-xl font-bold text-gray-900 dark:text-white">Smart Wallet</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <a 
              href="https://github.com/HadiuzzamanBappy/Smart-Wallet" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <button
              onClick={onGetStarted}
              className="px-6 py-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default LandingNav;