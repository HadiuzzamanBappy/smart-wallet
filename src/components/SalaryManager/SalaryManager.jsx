import React, { useState, useEffect } from 'react';
import { getSalaryPlan, saveSalaryPlan } from '../../services/salaryService';
import { calculatePlan } from '../../utils/salaryCalculator';
import SalaryWizard from './SalaryWizard';
import SalaryResult from './SalaryResult';
import { RefreshCw } from 'lucide-react';

export default function SalaryManager({ userId, onClose }) {
  const [view, setView] = useState('loading'); // 'loading' | 'wizard' | 'result'
  const [currentForm, setCurrentForm] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [currentAdvice, setCurrentAdvice] = useState(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const plan = await getSalaryPlan(userId);
        if (plan) {
          setCurrentForm(plan.form);
          setCurrentPlan(plan.plan);
          setCurrentAdvice(plan.aiAdvice);
          setView('result');
        } else {
          setView('wizard');
        }
      } catch (err) {
        console.error("Failed to fetch plan", err);
        setView('wizard');
      }
    };
    if (userId) fetchPlan();
  }, [userId]);

  const handleWizardComplete = (formData) => {
    const planData = calculatePlan(formData);
    setCurrentForm(formData);
    setCurrentPlan(planData);
    setCurrentAdvice(null); // Reset advice so Result screen regenerates it
    setView('result');
  };

  const handleSave = async (planData, formData, aiAdvice) => {
    try {
      await saveSalaryPlan(userId, planData, formData, aiAdvice);
      // Optional: show success toast here if your app has a global toast
      onClose(); // Close the modal upon saving
    } catch (err) {
      console.error("Failed to save plan", err);
      alert("Failed to save plan. Please try again.");
    }
  };

  const handleRecalculate = () => {
    // Keep currentForm so wizard is pre-filled
    setView('wizard');
  };

  if (view === 'loading') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
        <div className="flex flex-col items-center space-y-4 text-teal-400">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <p>Loading your financial plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/90 overflow-y-auto print:bg-white print:overflow-visible">
      {view === 'wizard' && (
        <div className="min-h-screen flex items-center justify-center p-0 sm:p-4 print:p-0 print:block">
          <SalaryWizard 
            initialData={currentForm} 
            onComplete={handleWizardComplete} 
            onCancel={onClose} 
          />
        </div>
      )}
      {view === 'result' && currentPlan && (
        <SalaryResult 
          planData={currentPlan} 
          formData={currentForm}
          aiAdvice={currentAdvice}
          onSave={handleSave} 
          onRecalculate={handleRecalculate}
          onClose={onClose}
        />
      )}
    </div>
  );
}
