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
    <div className="w-full space-y-4">
      {/* Tab Selectors - Restored to original bulky size */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
        {sections.map((section) => {
          const IconComponent = section.icon;
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              onClick={() => toggleSection(section.id)}
              className={`group relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 border w-full sm:w-80 ${isActive
                  ? `bg-gradient-to-r from-teal-500 to-blue-500 text-white border-teal-400 shadow-lg scale-[1.01]`
                  : `bg-white/5 hover:bg-white/[0.08] border-white/10 shadow-sm`
                }`}
            >
              <div className={`p-2.5 rounded-xl transition-colors ${isActive
                  ? 'bg-white/20'
                  : 'bg-teal-500/10'
                }`}>
                <IconComponent className={`w-5 h-5 ${isActive
                    ? 'text-white'
                    : 'text-teal-500'
                  }`} />
              </div>
              <div className="text-left flex-1">
                <h3 className={`font-bold text-[12px] leading-none mb-1.5 ${
                  isActive 
                    ? 'text-white' 
                    : 'text-white/90'
                }`}>
                  {section.title}
                </h3>
                <p className={`text-[11px] leading-tight ${isActive
                    ? 'text-white/80'
                    : 'text-gray-400'
                  }`}>
                  {section.description}
                </p>
              </div>

              <div className={`transition-transform duration-300 ${isActive ? 'rotate-180 text-white' : 'text-gray-500'}`}>
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="space-y-4">
        {activeSection && (
          <div className="animate-in slide-in-from-top duration-300">
            <GlassCard className="border-white/10 overflow-hidden" padding="p-0">
              {/* Header */}
              <div className="bg-white/5 p-3 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconBox
                      icon={sections.find(s => s.id === activeSection)?.icon}
                      size="sm"
                      colorClass="text-teal-400"
                      bgClass="bg-teal-400/10"
                    />
                    <div>
                      <h2 className="text-[11px] font-bold text-white">
                        {sections.find(s => s.id === activeSection)?.title}
                      </h2>
                      <p className="text-[10px] text-gray-500 font-medium">
                        {sections.find(s => s.id === activeSection)?.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="icon"
                    size="xsm"
                    color="gray"
                    onClick={() => toggleSection(activeSection)}
                    icon={ChevronUp}
                  />
                </div>
              </div>

              {/* Content */}
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