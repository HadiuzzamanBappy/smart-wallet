import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BarChart3, FileText, PieChart, Calendar, List, TrendingUp } from 'lucide-react';
import Skeleton from '../UI/SkeletonLoader';
import TransactionList from './TransactionList';
import SpendingAnalytics from './SpendingAnalytics';

const ExpandableDetailsSection = ({ onSectionChange, onTransactionChange }) => {
  const [activeSection, setActiveSection] = useState(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Auto-activate first tab on tablet and desktop when component mounts
  React.useEffect(() => {
    const checkScreenSize = () => {
      const isLargeScreen = window.innerWidth >= 768; // md breakpoint
      if (isLargeScreen && activeSection === null && !hasUserInteracted) {
        setActiveSection('transactions'); // Set first tab as active
        if (onSectionChange) onSectionChange('transactions');
      } else if (!isLargeScreen && activeSection === 'transactions' && !hasUserInteracted) {
        setActiveSection(null); // Clear active state on mobile
        if (onSectionChange) onSectionChange(null);
      }
    };

    // Check on mount and add listener
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, [activeSection, onSectionChange, hasUserInteracted]);

  const toggleSection = (section) => {
    // Mark that user has interacted, so auto-behavior stops
    setHasUserInteracted(true);

    // Basic toggle: clicking an already-active section hides it, otherwise show the clicked section
    if (activeSection === section) {
      setActiveSection(null);
      if (onSectionChange) onSectionChange(null);
      return;
    }

    setActiveSection(section);
    if (onSectionChange) onSectionChange(section);
  };

  // Show only the 2 most important sections for now
  const sections = [
    {
      id: 'transactions',
      title: 'Recent Transactions',
      icon: List,
      description: 'View and manage your latest transactions',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      id: 'analytics',
      title: 'Spending Analytics',
      icon: BarChart3,
      description: 'Charts and graphs of your spending patterns',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    }
  ];

  const renderSectionContent = (sectionId) => {
    switch (sectionId) {
      case 'transactions':
        return <TransactionList onTransactionChange={onTransactionChange} />;
      case 'reports':
        return (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Financial reports will be displayed here</p>
            <p className="text-sm">Coming soon...</p>
          </div>
        );
      case 'analytics':
        return <SpendingAnalytics />;
      case 'categories':
        return (
          <div className="p-4">
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Category breakdown charts will be displayed here</p>
              <p className="text-sm">Coming soon...</p>
            </div>
          </div>
        );
      case 'trends':
        return (
          <div className="p-4">
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Monthly trends and comparisons will be displayed here</p>
              <p className="text-sm">Coming soon...</p>
            </div>
          </div>
        );
      case 'calendar':
        return (
          <div className="p-4">
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Transaction calendar view will be displayed here</p>
              <p className="text-sm">Coming soon...</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="w-full">
        {/* Horizontal Button List - Responsive */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
          {sections.map((section) => {
            const IconComponent = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
              key={section.id}
              onClick={() => toggleSection(section.id)}
              className={`group relative flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 rounded-xl transition-all duration-300 border w-full sm:w-auto ${
                isActive 
                  ? `bg-gradient-to-r from-teal-500 to-blue-500 text-white border-teal-400 shadow-lg scale-[1.02]` 
                  : `bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-teal-200 dark:border-teal-800 hover:border-teal-300 dark:hover:border-teal-700 shadow-sm`
              }`}
            >
              <div className={`p-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-white/20' 
                  : 'bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/10 dark:to-emerald-900/30'
              }`}>
                <IconComponent className={`w-5 h-5 transition-colors ${
                  isActive 
                    ? 'text-white' 
                    : 'text-teal-500'
                }`} />
              </div>
              <div className="text-left flex-1 sm:flex-initial">
                <h3 className={`font-semibold text-sm sm:text-base transition-colors ${
                  isActive 
                    ? 'text-white' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {section.title}
                </h3>
                <p className={`text-xs transition-colors ${
                  isActive 
                    ? 'text-white/80' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {section.description}
                </p>
              </div>
              
              <div className={`transition-transform duration-300 ${isActive ? 'rotate-180 text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              {isActive && (
                <div className="absolute -top-1 -right-1">
                  <div className="w-3 h-3 rounded-full bg-teal-400 border-2 border-white dark:border-gray-800 shadow-sm" />
                </div>
              )}
            </button>
            );
          })}
        </div>

        {/* Always show transactions on mobile, show active section on desktop */}
        <div className="space-y-4">
          {/* Mobile: Show active section */}
          <div className="md:hidden">
            {activeSection && (
              <div className="overflow-hidden mt-2">
                {(() => {
                  const section = sections.find(s => s.id === activeSection);
                  if (!section) return null;
                  const IconComponent = section.icon;
                  return (
                    <>
                      <div className="bg-gray-50 dark:bg-gray-800/80 p-3 border-x border-t border-teal-200 dark:border-teal-800 rounded-t-md">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
                            <IconComponent className="w-4 h-4 text-teal-500" />
                          </div>
                          <div>
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{section.title}</h2>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 border border-teal-200 dark:border-teal-800 rounded-b-md">
                        {renderSectionContent(activeSection)}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Desktop/Tablet: Show active section */}
          <div className="hidden md:block">
            {activeSection && (
              <div className="animate-in slide-in-from-top duration-300">
                <div className="overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-800/80 p-3 border-x border-t border-teal-200 dark:border-teal-800 rounded-t-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const section = sections.find(s => s.id === activeSection);
                          const IconComponent = section.icon;
                          return (
                            <>
                              <div className="p-1.5 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
                                <IconComponent className="w-4 h-4 text-teal-500" />
                              </div>
                              <h2 className="text-sm font-bold text-gray-900 dark:text-white">{section.title}</h2>
                            </>
                          );
                        })()}
                      </div>
                      <button
                        onClick={() => toggleSection(activeSection)}
                        className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-teal-200 dark:border-teal-800 rounded-b-md">
                    {renderSectionContent(activeSection)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpandableDetailsSection;