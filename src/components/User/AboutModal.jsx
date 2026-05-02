import React from 'react';
import { HelpCircle, MessageCircle, Zap, BarChart3, Shield, Target, Calendar, CreditCard } from 'lucide-react';
import Modal from '../UI/base/Modal';

const AboutModal = ({ isOpen, onClose }) => {
  const features = [
    {
      icon: MessageCircle,
      title: 'Neural Chat Interface',
      description: 'Describe transactions in natural language like "500 for groceries". The AI handles the rest.'
    },
    {
      icon: Target,
      title: 'Lifestyle Ceiling',
      description: 'Set a global monthly spending limit to monitor your total capacity across all income sources.'
    },
    {
      icon: Calendar,
      title: 'Strategic Planner',
      description: 'Use the Salary Manager to allocate your fixed income before the month even begins.'
    },
    {
      icon: Shield,
      title: 'Fortress Security',
      description: 'AES-256 encrypted data storage via Firebase. Your financial intelligence remains private.'
    }
  ];

  const types = [
    { label: 'Income', color: 'text-emerald-500', bg: 'bg-emerald-500/10', desc: 'Positive cash inflow (Salary, Freelance, ROI)' },
    { label: 'Expense', color: 'text-red-500', bg: 'bg-red-500/10', desc: 'Lifestyle outflows (Bills, Food, Subs)' },
    { label: 'Credit Given', color: 'text-blue-500', bg: 'bg-blue-500/10', desc: 'Outgoing loans to external nodes' },
    { label: 'Loan Taken', color: 'text-purple-500', bg: 'bg-purple-500/10', desc: 'Incoming capital from external sources' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Operational Intelligence" size="lg">
      <div className="space-y-8">

        {/* Core Systems */}
        <div>
          <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-5 flex items-center gap-2 px-1">
            <Zap className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Core Systems
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="p-5 bg-gray-50/50 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm transition-all hover:bg-gray-100/50 dark:hover:bg-white/5 group">
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-md flex-shrink-0 border border-gray-100 dark:border-white/10 group-hover:scale-105 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">
                        {feature.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed font-bold uppercase tracking-widest opacity-70">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction Matrix */}
        <div>
          <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-5 flex items-center gap-2 px-1">
            <CreditCard className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Transaction Matrix
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {types.map((type, index) => (
              <div key={index} className="p-4 bg-gray-50/50 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/10 transition-all hover:border-teal-500/30">
                <div className={`text-[10px] font-black uppercase tracking-widest ${type.color} mb-2`}>
                  {type.label}
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed font-bold uppercase tracking-widest opacity-70">
                  {type.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Protocols */}
        <div className="p-5 bg-teal-50 dark:bg-teal-500/10 rounded-2xl border border-teal-100 dark:border-teal-500/10 shadow-inner">
          <h3 className="text-[10px] font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-4">
            Quick Protocols
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {[
              'Use "Paid 500 for lunch" for instant AI logging',
              'Set a master ceiling in Profile for global monitoring',
              'Click any ledger entry to modify historical data',
              'Export full JSON archives from Data Governance',
              'Planner module handles pre-month allocations',
              'Toggle Multi-Currency in regional settings'
            ].map((tip, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500/40" />
                <p className="text-[11px] text-teal-900/70 dark:text-gray-400 font-bold uppercase tracking-widest leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center pt-4 border-t border-gray-100 dark:border-white/5">
          <p className="text-[9px] text-gray-400 dark:text-gray-600 font-black uppercase tracking-[0.4em]">
            Smart Wallet v1.2.0 · Financial Intelligence Guide
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default AboutModal;