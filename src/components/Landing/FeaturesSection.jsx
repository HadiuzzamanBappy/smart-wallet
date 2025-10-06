import React from 'react';
import { 
  Shield, 
  Smartphone, 
  TrendingUp, 
  MessageSquare, 
  BarChart3,
  Zap
} from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: 'AI-Powered Chat',
    description: 'Just type "Spent $50 on groceries" and watch it automatically categorize and save your transaction.',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: Shield,
    title: 'Client-Side Encryption',
    description: 'Your financial data is encrypted on your device before being stored. We can\'t see it, even if we wanted to.',
    gradient: 'from-green-500 to-teal-500'
  },
  {
    icon: Zap,
    title: 'Real-time Updates',
    description: 'Your balance and analytics update instantly as you add transactions. No waiting, no delays.',
    gradient: 'from-blue-500 to-indigo-500'
  },
  {
    icon: BarChart3,
    title: 'Smart Analytics',
    description: 'Understand your spending patterns with beautiful charts and insights that help you make better decisions.',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    icon: Smartphone,
    title: 'Mobile Friendly',
    description: 'Works perfectly on all devices. Add transactions on the go, check your balance anywhere.',
    gradient: 'from-cyan-500 to-blue-500'
  },
  {
    icon: TrendingUp,
    title: 'Track Everything',
    description: 'Income, expenses, loans, credits - manage all your financial transactions in one secure place.',
    gradient: 'from-emerald-500 to-green-500'
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-gray-800/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Everything you need to manage your finances
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Powerful features designed with privacy and simplicity in mind
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
              <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">
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