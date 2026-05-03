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
} from 'lucide-react';
import IconBox from '../UI/base/IconBox';

const features = [
  {
    icon: MessageSquare,
    category: 'Intelligence',
    title: 'Cognitive NLP Engine',
    description: 'Just type "Spent $50 on groceries" and watch our AI automatically categorize and save your transaction with high precision.',
    color: 'primary',
    span: 'lg:col-span-2'
  },
  {
    icon: Shield,
    category: 'Security',
    title: 'Zero-Knowledge Vault',
    description: 'Your financial data is encrypted on your device using AES-256. We can\'t see it, even if we wanted to.',
    color: 'success',
    span: 'lg:col-span-1'
  },
  {
    icon: Fingerprint,
    category: 'Privacy',
    title: 'Local First Core',
    description: 'Privacy is not a feature; it\'s the foundation. Your data lives where you do—on your hardware.',
    color: 'info',
    span: 'lg:col-span-1'
  },
  {
    icon: BarChart3,
    category: 'Analytics',
    title: 'Predictive Insights',
    description: 'Understand your spending patterns with beautiful charts and insights that help you make better financial decisions.',
    color: 'warning',
    span: 'lg:col-span-2'
  },
  {
    icon: Zap,
    category: 'Performance',
    title: 'Atomic Synchronization',
    description: 'Instant updates across all devices. No waiting for cloud sync or processing delays.',
    color: 'secondary',
    span: 'lg:col-span-2'
  },
  {
    icon: Globe,
    category: 'Global',
    title: 'Multi-Currency Core',
    description: 'Track income, expenses, loans, and credits in any currency with automatic conversion and historical tracking.',
    color: 'success',
    span: 'lg:col-span-1'
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-20 sm:mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-full mb-10 shadow-xl shadow-primary-500/5">
            <Zap className="w-4 h-4 fill-current" />
            <span className="text-overline font-black tracking-widest uppercase">Operational Architecture v2.0</span>
          </div>
          <h2 className="text-h2 sm:text-h1 font-black text-ink-900 dark:text-paper-50 tracking-tighter leading-[1.1] mb-10">
            Sovereign Finance.<br className="hidden sm:block" />
            <span className="opacity-30 dark:opacity-40 italic">Zero Compromise.</span>
          </h2>
          <p className="text-body sm:text-lg lg:text-xl text-ink-400 dark:text-paper-700 font-medium leading-relaxed max-w-2xl">
            Powerful features designed with absolute privacy and operative efficiency in mind.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`${feature.span ? feature.span : ''} group relative p-10 sm:p-12 bg-paper-100/30 dark:bg-white/[0.02] backdrop-blur-2xl rounded-[2.5rem] border border-paper-200/50 dark:border-white/5 transition-all duration-700 hover:border-primary-500/30 hover:bg-paper-50 dark:hover:bg-white/[0.05] hover:shadow-2xl hover:shadow-ink-950/10 flex flex-col items-center text-center`}
            >
              <IconBox
                icon={feature.icon}
                variant="glass"
                color={feature.color}
                size="xl"
                className="mb-8 sm:mb-10 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-700 shadow-xl"
              />

              <div className="text-overline text-primary-500 font-black tracking-[0.2em] uppercase mb-4">
                {feature.category}
              </div>

              <h3 className="text-h4 sm:text-h3 font-black text-ink-900 dark:text-paper-50 mb-6 tracking-tight leading-none">
                {feature.title}
              </h3>

              <p className="text-body sm:text-lg text-ink-400 dark:text-paper-700 leading-relaxed font-medium opacity-80 max-w-sm">
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