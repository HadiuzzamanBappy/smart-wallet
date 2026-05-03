import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BarChart3, FileText, PieChart, Calendar, List, TrendingUp } from 'lucide-react';
import Skeleton from '../UI/SkeletonLoader';
import TransactionList from './TransactionList';
import SpendingAnalytics from './SpendingAnalytics';
import { THEME } from '../../config/theme';

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
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:justify-center">
        {sections.map((section) => {
          const IconComponent = section.icon;
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              onClick={() => toggleSection(section.id)}
              className={`group relative flex items-center gap-4 px-6 py-5 rounded-3xl transition-all duration-500 border w-full sm:w-auto sm:min-w-[280px] ${isActive
                  ? `bg-surface-card dark:bg-surface-card-dark border-primary-500 shadow-xl shadow-primary-500/10 scale-[1.02] z-10`
                  : `bg-paper-100/30 dark:bg-white/[0.02] border-paper-100 dark:border-white/5 hover:border-paper-200 dark:hover:border-white/10 shadow-sm opacity-70 hover:opacity-100`
                }`}
            >
              <IconBox 
                icon={section.icon} 
                size="sm" 
                color={isActive ? 'primary' : 'ink'} 
                variant={isActive ? 'filled' : 'soft'}
                className="transition-all duration-500 group-hover:scale-110" 
              />
              <div className="text-left flex-1 min-w-0">
                <h3 className={`text-label mb-1.5 leading-none font-bold ${
                  isActive 
                    ? 'text-ink-900 dark:text-paper-50' 
                    : 'text-ink-400 dark:text-paper-700'
                }`}>
                  {section.title}
                </h3>
                <p className={`text-overline leading-none opacity-40 truncate ${isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-ink-400 dark:text-paper-700'
                  }`}>
                  {section.description}
                </p>
              </div>

              <div className={`transition-all duration-500 ${isActive ? 'rotate-180 text-primary-500' : 'text-ink-400 group-hover:text-ink-900'}`}>
                <ChevronDown className="w-4 h-4" />
              </div>
              
              {isActive && (
                <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-12 h-1 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div>
        {activeSection && (
          <div className="mt-6 animate-in slide-in-from-top-4 duration-500 fade-in fill-mode-both">
            <GlassCard padding="p-0" className="!rounded-[2rem] shadow-2xl overflow-hidden">
              {/* Content Integration */}
              <div className="relative">
                {renderSectionContent(activeSection)}
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpandableDetailsSection;