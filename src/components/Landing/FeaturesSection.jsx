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
    span: 'lg:col-span-1'
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
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-full mb-6">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span className="text-[10px] font-black uppercase tracking-widest">Capabilities Suite v2.0</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
              Sovereign Finance.<br />
              <span className="opacity-40">Zero Compromise.</span>
            </h2>
          </div>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-sm">
            Powerful features designed with absolute privacy and operative efficiency in mind.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`${feature.span} group relative p-8 bg-white/50 dark:bg-white/[0.02] backdrop-blur-xl rounded-[2rem] border border-gray-200 dark:border-white/5 transition-all duration-300 hover:border-teal-500/30 hover:bg-white dark:hover:bg-white/[0.05] hover:shadow-2xl hover:shadow-teal-500/5`}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              
              <div className="text-[10px] font-black text-teal-500 uppercase tracking-[0.2em] mb-3">
                {feature.category}
              </div>
              
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                {feature.title}
              </h3>
              
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                {feature.description}
              </p>
              
              {/* Subtle hover decoration */}
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-4 h-4 text-teal-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;