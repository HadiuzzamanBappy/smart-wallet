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
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-full mb-4 sm:mb-6">
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Capabilities Suite v2.0</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mb-6">
            Sovereign Finance.<br className="hidden sm:block" />
            <span className="opacity-40">Zero Compromise.</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 font-medium">
            Powerful features designed with absolute privacy and operative efficiency in mind.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`${feature.span ? feature.span.replace('lg:', 'lg:') : ''} group relative p-6 sm:p-8 bg-white/50 dark:bg-white/[0.02] backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2rem] border border-gray-200 dark:border-white/5 transition-all duration-300 hover:border-teal-500/30 hover:bg-white dark:hover:bg-white/[0.05] hover:shadow-2xl hover:shadow-teal-500/5 flex flex-col items-center text-center`}
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${feature.gradient} rounded-xl sm:rounded-2xl flex items-center justify-center mb-5 sm:mb-6 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>

              <div className="text-[9px] sm:text-[10px] font-black text-teal-500 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 sm:mb-3">
                {feature.category}
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mb-3 sm:mb-4 tracking-tight">
                {feature.title}
              </h3>

              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
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