import React from 'react';
import { HelpCircle, MessageCircle, Zap, BarChart3, Shield, Target, Calendar, CreditCard } from 'lucide-react';
import Modal from '../UI/base/Modal';
import GlassCard from '../UI/base/GlassCard';
import Badge from '../UI/base/Badge';
import SectionHeader from '../UI/base/SectionHeader';
import IconBox from '../UI/base/IconBox';

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
        <section>
          <SectionHeader 
            icon={Zap} 
            title="Core Systems" 
            titleSize="text-h6"
            className="mb-4"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <GlassCard 
                key={index} 
                padding="p-3"
                className="group/feature"
                hover
              >
                <div className="flex items-start gap-3">
                  <IconBox 
                    icon={feature.icon} 
                    variant="glass" 
                    size="md" 
                    color="primary"
                    className="group-hover/feature:scale-110 transition-transform duration-500"
                  />
                  <div>
                    <h4 className="text-label text-ink-900 dark:text-paper-50">
                      {feature.title}
                    </h4>
                    <p className="text-body text-ink-500 dark:text-paper-400 mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Transaction Matrix */}
        <section>
          <SectionHeader 
            icon={CreditCard} 
            title="Transaction Matrix" 
            titleSize="text-h6"
            className="mb-4"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {types.map((type, index) => (
              <GlassCard 
                key={index} 
                variant="flat" 
                padding="p-3" 
                className="bg-paper-100/50 dark:bg-ink-950/20 border-paper-200/50 dark:border-paper-900/10"
              >
                <div className="flex flex-col gap-2">
                  <Badge 
                    variant="glass" 
                    color={type.color.includes('emerald') ? 'success' : type.color.includes('red') ? 'error' : type.color.includes('blue') ? 'info' : 'secondary'}
                    size="sm"
                    className="self-start"
                  >
                    {type.label}
                  </Badge>
                  <p className="text-overline text-ink-500 dark:text-paper-500">
                    {type.desc}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Quick Protocols */}
        <section>
          <SectionHeader 
            icon={Zap} 
            title="Quick Protocols" 
            titleSize="text-h6"
            className="mb-4"
          />
          <GlassCard variant="flat" padding="p-4" className="bg-primary-500/[0.03] dark:bg-primary-500/10 border-primary-500/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {[
                'Use "Paid 500 for lunch" for instant AI logging',
                'Set a master ceiling in Profile for global monitoring',
                'Click any ledger entry to modify historical data',
                'Export full JSON archives from Data Governance',
                'Planner module handles pre-month allocations',
                'Toggle Multi-Currency in regional settings'
              ].map((tip, index) => (
                <div key={index} className="flex items-start gap-2.5">
                  <IconBox icon={Zap} variant="glass" size="xs" color="primary" className="shrink-0 mt-0.5 opacity-40" />
                  <p className="text-label text-ink-600 dark:text-paper-400">{tip}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>

        <div className="flex items-center justify-center pt-4 border-t border-paper-200 dark:border-paper-900/10 gap-3">
          <Badge color="ink" variant="soft" size="sm">v1.2.0</Badge>
          <span className="text-overline text-ink-300 dark:text-paper-700 uppercase">
            Financial Intelligence Guide
          </span>
        </div>
      </div>
    </Modal>

  );
};

export default AboutModal;