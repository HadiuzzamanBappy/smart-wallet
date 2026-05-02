import React from 'react';
import {
  Shield,
  Smartphone,
  TrendingUp,
  MessageSquare,
  BarChart3,
  Zap,
  Globe,
  Fingerprint,
  ArrowRight
} from 'lucide-react';
import { THEME } from '../../config/theme';

const features = [
  {
    icon: MessageSquare,
    category: 'Intelligence',
    title: 'Cognitive NLP Engine',
    description: 'Just type "Spent $50 on groceries" and watch our AI automatically categorize and save your transaction with high precision.',
    gradient: 'from-purple-500 to-pink-500',
    span: 'lg:col-span-2'
  },
  {
    icon: Shield,
    category: 'Security',
    title: 'Zero-Knowledge Encryption',
    description: 'Your financial data is encrypted on your device using AES-256 before being stored. We can\'t see it, even if we wanted to.',
    gradient: 'from-green-500 to-teal-500',
    span: 'lg:col-span-1'
  },
  {
    icon: Fingerprint,
    category: 'Privacy',
    title: 'Local First Architecture',
    description: 'Privacy is not a feature; it\'s the foundation. Your data lives where you do—on your hardware.',
    gradient: 'from-blue-500 to-indigo-500',
    span: 'lg:col-span-1'
  },
  {
    icon: BarChart3,
    category: 'Analytics',
    title: 'Predictive Insights',
    description: 'Understand your spending patterns with beautiful charts and insights that help you make better financial decisions.',
    gradient: 'from-orange-500 to-red-500',
    span: 'lg:col-span-2'
  },
  {
    icon: Zap,
    category: 'Performance',
    title: 'Real-time Synchronization',
    description: 'Instant updates across all devices. No waiting for cloud sync or processing delays.',
    gradient: 'from-cyan-500 to-blue-500',
    span: 'lg:col-span-2'
  },
  {
    icon: Globe,
    category: 'Global',
    title: 'Multi-Currency Core',
    description: 'Track income, expenses, loans, and credits in any currency with automatic conversion and historical tracking.',
    gradient: 'from-emerald-500 to-green-500',
    span: 'lg:col-span-1'
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-full mb-6 sm:mb-8">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
            <span className={THEME.typography.label}>Capabilities Suite v2.0</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white tracking-tight leading-none mb-8">
            Sovereign Finance.<br className="hidden sm:block" />
            <span className="opacity-30 dark:opacity-40 italic">Zero Compromise.</span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-2xl">
            Powerful features designed with absolute privacy and operative efficiency in mind.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`${feature.span ? feature.span : ''} group relative p-8 sm:p-10 bg-gray-50/50 dark:bg-white/[0.02] backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] border border-gray-200/50 dark:border-white/5 transition-all duration-500 hover:border-primary-500/30 hover:bg-white dark:hover:bg-white/[0.05] hover:shadow-2xl hover:shadow-primary-500/5 flex flex-col items-center text-center`}
            >
              <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl sm:rounded-3xl flex items-center justify-center mb-6 sm:mb-8 shadow-lg shadow-primary-500/10 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>

              <div className={`${THEME.typography.label} text-primary-600 dark:text-primary-500 mb-3 sm:mb-4`}>
                {feature.category}
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-5 tracking-tight leading-none">
                {feature.title}
              </h3>

              <p className="text-sm sm:text-base lg:text-lg text-gray-500 dark:text-gray-400 leading-relaxed font-medium opacity-80">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;