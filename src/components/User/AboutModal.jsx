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
      <div className="space-y-6">

        {/* Core Systems */}
        <div>
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Zap className="w-3 h-3 text-teal-500" /> Core Systems
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="p-4 bg-gray-50/50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm flex-shrink-0 border border-gray-100 dark:border-white/5">
                      <Icon className="w-5 h-5 text-teal-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                        {feature.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
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
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <CreditCard className="w-3 h-3 text-teal-500" /> Transaction Matrix
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {types.map((type, index) => (
              <div key={index} className="p-3 bg-gray-50/50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-white/5">
                <div className={`text-[9px] font-black uppercase tracking-widest ${type.color} mb-1`}>
                  {type.label}
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                  {type.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Protocols */}
        <div className="p-4 bg-teal-500/5 dark:bg-teal-500/10 rounded-xl border border-teal-500/10">
          <h3 className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-3">
            Quick Protocols
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {[
              'Use "Paid 500 for lunch" for instant AI logging',
              'Set a master ceiling in Profile for global monitoring',
              'Click any ledger entry to modify historical data',
              'Export full JSON archives from Data Governance',
              'Planner module handles pre-month allocations',
              'Toggle Multi-Currency in regional settings'
            ].map((tip, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-teal-500/40" />
                <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center pt-2">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.3em]">
            Smart Wallet v1.2.0 · Financial Intelligence Guide
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default AboutModal;