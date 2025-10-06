import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BarChart3, FileText, PieChart, Calendar, List, TrendingUp } from 'lucide-react';
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
        return (
          <div className="p-4">
            <TransactionList onTransactionChange={onTransactionChange} />
          </div>
        );
      case 'reports':
        return (
          <div className="p-4">
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Financial reports will be displayed here</p>
              <p className="text-sm">Coming soon...</p>
            </div>
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
              className={`group relative flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-2xl transition-all duration-300 border-2 w-full sm:w-auto ${
                isActive 
                  ? `bg-gradient-to-r from-teal-500 to-blue-500 dark:from-teal-600 dark:to-blue-600 text-white border-teal-300 dark:border-teal-500 shadow-xl scale-105` 
                  : `bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-600 shadow-sm hover:shadow-md`
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${
                isActive 
                  ? 'bg-white/20' 
                  : section.bgColor
              }`}>
                <IconComponent className={`w-5 h-5 transition-colors ${
                  isActive 
                    ? 'text-white' 
                    : section.color
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
                <p className={`text-xs sm:text-sm transition-colors ${
                  isActive 
                    ? 'text-white/80' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {section.description}
                </p>
              </div>
              {isActive && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mt-3">
              {(() => {
                const section = sections.find(s => s.id === activeSection);
                if (!section) return null;
                const IconComponent = section.icon;
                return (
                  <>
                    <div className="bg-gradient-to-r from-teal-500 to-blue-500 dark:from-teal-600 dark:to-blue-600 p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-white">{section.title}</h2>
                          <p className="text-white/80 text-sm">{section.description}</p>
                        </div>
                      </div>
                    </div>
                    <div>
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
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-teal-500 to-blue-500 dark:from-teal-600 dark:to-blue-600 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const section = sections.find(s => s.id === activeSection);
                        const IconComponent = section.icon;
                        return (
                          <>
                            <div className="p-2 bg-white/20 rounded-xl">
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-white">{section.title}</h2>
                              <p className="text-white/80 text-sm">{section.description}</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <button
                      onClick={() => toggleSection(activeSection)}
                      className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    >
                      <ChevronUp className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
                <div>
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