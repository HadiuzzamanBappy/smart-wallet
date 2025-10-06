import React from 'react';
import { Wallet, Github } from 'lucide-react';

const LandingFooter = () => {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 dark:bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <img
              src="/favicon/favicon.svg"
              alt="Wallet Tracker Logo"
              className="w-8 h-8"
              onError={(e) => {
                // Fallback to Wallet icon if logo fails to load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <Wallet className="w-6 h-6 text-teal-400" style={{ display: 'none' }} />
            <span className="text-xl font-bold text-white">Wallet Tracker</span>
          </div>
          
          <div className="flex items-center space-x-6 text-gray-400">
            <a 
              href="https://github.com/HadiuzzamanBappy/Wallet-Tracker" 
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
            <span className="text-sm">
              Built with ❤️ for privacy-conscious users
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;