import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BarChart3, FileText, PieChart, Calendar, List, TrendingUp } from 'lucide-react';
import Skeleton from '../UI/SkeletonLoader';
import TransactionList from './TransactionList';
import SpendingAnalytics from './SpendingAnalytics';

// Base UI Components
import GlassCard from '../UI/base/GlassCard';
import Button from '../UI/base/Button';
import IconBox from '../UI/base/IconBox';

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
    <div className="w-full">
      {/* Tab Selectors - Executive Command Style */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch">
        {sections.map((section) => {
          const IconComponent = section.icon;
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              onClick={() => toggleSection(section.id)}
              className={`group relative flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500 border w-full sm:flex-1 ${isActive
                  ? `bg-white dark:bg-white/[0.05] border-teal-500/50 shadow-xl shadow-teal-500/10 scale-[1.02] z-10`
                  : `bg-gray-50/50 dark:bg-white/[0.02] border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 shadow-sm opacity-70 hover:opacity-100`
                }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${isActive
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-400 group-hover:text-teal-500'
                }`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 leading-none ${
                  isActive 
                    ? 'text-gray-900 dark:text-white' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {section.title}
                </h3>
                <p className={`text-[9px] font-black uppercase tracking-widest leading-none opacity-40 truncate ${isActive
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'text-gray-400 dark:text-gray-600'
                  }`}>
                  {section.description}
                </p>
              </div>

              <div className={`transition-all duration-500 ${isActive ? 'rotate-180 text-teal-500' : 'text-gray-300 group-hover:text-gray-500'}`}>
                <ChevronDown className="w-4 h-4" />
              </div>
              
              {isActive && (
                <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-12 h-1 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div>
        {activeSection && (
          <div className="mt-6 animate-in slide-in-from-top-4 duration-500 fade-in fill-mode-both">
            <div className="rounded-[2rem] bg-white dark:bg-gray-900/40 border border-gray-100 dark:border-white/5 shadow-2xl overflow-hidden backdrop-blur-sm">
              {/* Header - High Density Audit Bar */}
              <div className="bg-gray-50/50 dark:bg-white/[0.02] px-6 py-4 border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-teal-600 dark:text-teal-400 border border-gray-200/50 dark:border-white/5">
                      {activeSection === 'transactions' ? <List className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
                    </div>
                    <div>
                      <h2 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] leading-none mb-2">
                        {sections.find(s => s.id === activeSection)?.title}
                      </h2>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] text-gray-400 dark:text-gray-600 font-black uppercase tracking-widest opacity-60">
                          {sections.find(s => s.id === activeSection)?.description}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                        <span className="text-[9px] text-teal-600/60 dark:text-teal-400/60 font-black uppercase tracking-widest">Active Audit</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSection(activeSection)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all border border-transparent hover:border-gray-200/50 dark:hover:border-white/10"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content Integration */}
              <div className="relative">
                {renderSectionContent(activeSection)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpandableDetailsSection;