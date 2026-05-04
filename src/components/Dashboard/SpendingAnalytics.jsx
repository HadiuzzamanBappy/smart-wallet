import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useTransactions } from '../../hooks/useTransactions';
import { formatCurrency } from '../../utils/helpers';
// normalizeCategory not needed here after activity breakdown changes
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3
} from 'lucide-react';
import { AnalyticsSkeleton } from '../UI/SkeletonLoader';

// Base UI Components
import GlassCard from '../UI/base/GlassCard';
import IconBox from '../UI/base/IconBox';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const SpendingAnalytics = () => {
  const { transactions, loading: txLoading } = useTransactions();
  const loading = txLoading;
  const [activeChart, setActiveChart] = useState('spending-trend');

  // Use shared transactions from TransactionContext. This ensures analytics
  // updates in sync with other components (no local polling or event races).

  // Process data for spending trend chart (last 7 days)
  const getSpendingTrendData = () => {
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      return date;
    }).reverse();

    const dailySpending = last14Days.map(day => {
      const dayTransactions = transactions.filter(t => {
        const tDate = new Date(t.date || t.createdAt);
        return tDate.toDateString() === day.toDateString() && ['expense', 'credit', 'repayment'].includes(t.type);
      });
      return dayTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    });

    const dailyIncome = last14Days.map(day => {
      const dayTransactions = transactions.filter(t => {
        const tDate = new Date(t.date || t.createdAt);
        return tDate.toDateString() === day.toDateString() && ['income', 'loan', 'collection'].includes(t.type);
      });
      return dayTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    });

    const dailyCredit = last14Days.map(day => {
      const dayTransactions = transactions.filter(t => {
        const tDate = new Date(t.date || t.createdAt);
        return tDate.toDateString() === day.toDateString() && t.type === 'credit';
      });
      return dayTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    });

    const dailyLoan = last14Days.map(day => {
      const dayTransactions = transactions.filter(t => {
        const tDate = new Date(t.date || t.createdAt);
        return tDate.toDateString() === day.toDateString() && t.type === 'loan';
      });
      return dayTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    });

    return {
      labels: last14Days.map(date => new Date(date).toLocaleDateString('en', { weekday: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Expenses',
          data: dailySpending,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Income',
          data: dailyIncome,
          borderColor: 'rgb(20, 184, 166)',
          backgroundColor: 'rgba(20, 184, 166, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Credit Given',
          data: dailyCredit,
          borderColor: 'rgb(14, 165, 233)',
          backgroundColor: 'rgba(14, 165, 233, 0.08)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Loan Taken',
          data: dailyLoan,
          borderColor: 'rgb(139, 92, 246)',
          backgroundColor: 'rgba(139, 92, 246, 0.08)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };

  // Activity breakdown (Income / Expense / Credit Given / Loan Taken)
  const getActivityBreakdown = () => {
    const totals = {
      Income: 0,
      Expense: 0,
      'Credit Given': 0,
      'Loan Taken': 0,
    };

    transactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (['income', 'collection'].includes(t.type)) totals.Income += amt;
      else if (['expense', 'repayment'].includes(t.type)) totals.Expense += amt;
      else if (t.type === 'credit') totals['Credit Given'] += amt;
      else if (t.type === 'loan') totals['Loan Taken'] += amt;
    });

    const labels = Object.keys(totals);
    const data = labels.map(l => totals[l]);
    const colors = ['#14b8a6', '#ef4444', '#0ea5e9', '#8b5cf6'];

    // Handle empty totals: if all zero, show a single placeholder
    const allZero = data.every(v => v === 0);
    if (allZero) {
      return {
        labels: ['No activity'],
        datasets: [{ data: [0], backgroundColor: ['#c9cbcf'], borderColor: ['#c9cbcf'], borderWidth: 2 }]
      };
    }

    return {
      labels,
      datasets: [{ data, backgroundColor: colors, borderColor: colors, borderWidth: 2 }]
    };
  };

  // Process data for monthly comparison
  const getMonthlyData = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(currentYear, currentMonth - i, 1);
      return {
        name: date.toLocaleDateString('en', { month: 'short' }),
        fullDate: date,
      };
    }).reverse();

    const monthlyExpenses = months.map(month => {
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date || t.createdAt);
        return tDate.getMonth() === month.fullDate.getMonth() &&
          tDate.getFullYear() === month.fullDate.getFullYear() &&
          t.type === 'expense';
      });
      return monthTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    });

    const monthlyIncome = months.map(month => {
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date || t.createdAt);
        return tDate.getMonth() === month.fullDate.getMonth() &&
          tDate.getFullYear() === month.fullDate.getFullYear() &&
          t.type === 'income';
      });
      return monthTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    });

    const monthlyCredit = months.map(month => {
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date || t.createdAt);
        return tDate.getMonth() === month.fullDate.getMonth() &&
          tDate.getFullYear() === month.fullDate.getFullYear() &&
          t.type === 'credit';
      });
      return monthTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    });

    const monthlyLoan = months.map(month => {
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date || t.createdAt);
        return tDate.getMonth() === month.fullDate.getMonth() &&
          tDate.getFullYear() === month.fullDate.getFullYear() &&
          t.type === 'loan';
      });
      return monthTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    });

    return {
      labels: months.map(m => m.name),
      datasets: [
        {
          label: 'Expenses',
          data: monthlyExpenses,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 2,
        },
        {
          label: 'Income',
          data: monthlyIncome,
          backgroundColor: 'rgba(20, 184, 166, 0.8)',
          borderColor: 'rgb(20, 184, 166)',
          borderWidth: 2,
        },
        {
          label: 'Credit Given',
          data: monthlyCredit,
          backgroundColor: 'rgba(14, 165, 233, 0.8)',
          borderColor: 'rgb(14, 165, 233)',
          borderWidth: 2,
        },
        {
          label: 'Loan Taken',
          data: monthlyLoan,
          backgroundColor: 'rgba(139, 92, 246, 0.8)',
          borderColor: 'rgb(139, 92, 246)',
          borderWidth: 2,
        },
      ],
    };
  };

  const chartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 12,
          boxWidth: 8,
          font: { size: 10 },
          color: 'rgba(115, 126, 154, 0.8)'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 11 },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 12,
        displayColors: true,
        callbacks: {
          label: function (context) {
            const value = formatCurrency(context.parsed.y || context.parsed);
            return `${context.dataset.label}: ${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 7,
          font: { size: 9 },
          color: 'rgba(115, 126, 154, 0.5)'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.05)',
          drawBorder: false
        },
        ticks: {
          callback: function (value) {
            return formatCurrency(value);
          },
          font: { size: 9 },
          color: 'rgba(115, 126, 154, 0.5)',
          maxTicksLimit: 5
        }
      }
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 6,
        hitRadius: 10,
        backgroundColor: '#fff',
        borderWidth: 2,
      },
      line: {
        borderWidth: 2,
      },
      bar: {
        borderRadius: 4,
        borderSkipped: false,
        maxBarThickness: 32,
      }
    }
  });

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 8,
          padding: 12,
          usePointStyle: true,
          font: { size: 10 },
          color: 'rgba(115, 126, 154, 0.8)'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 10,
        cornerRadius: 12,
        titleFont: { size: 11 },
        bodyFont: { size: 12 },
        callbacks: {
          label: function (context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0) || 0;
            const value = context.parsed || 0;
            const percentage = total > 0 ? ((value * 100) / total).toFixed(1) : '0.0';
            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    }
  };

  if (loading) return <AnalyticsSkeleton />;

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-8">
        <div className="w-16 h-16 rounded-3xl bg-paper-100/30 dark:bg-white/[0.02] border border-paper-100 dark:border-white/5 flex items-center justify-center mb-6 opacity-40">
          <BarChart3 className="w-8 h-8 text-ink-400" />
        </div>
        <h3 className="text-overline text-ink-400 dark:text-paper-700 mb-2">No Insights Ready</h3>
        <p className="text-overline text-ink-400/60 dark:text-paper-700/60 max-w-[200px]">
          Add transactions to activate your visual intelligence suite.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4">
      {/* Chart Selector Compact */}
      <div className="flex p-0.5 bg-paper-100/30 dark:bg-white/5 border border-paper-100 dark:border-white/5 rounded-2xl w-fit">
        {[
          { id: 'spending-trend', label: 'Trend' },
          { id: 'category-breakdown', label: 'Summary' },
          { id: 'monthly-comparison', label: 'Monthly' },
        ].map((chart) => (
          <button
            key={chart.id}
            onClick={() => setActiveChart(chart.id)}
            className={`px-4 py-1.5 rounded-[14px] text-nano uppercase transition-all duration-300 ${activeChart === chart.id
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
              : 'text-ink-400 dark:text-paper-700 hover:text-ink-900 dark:hover:text-paper-50'}`}
          >
            {chart.label}
          </button>
        ))}
      </div>

      {/* Chart Display Compact */}
      <GlassCard padding="p-4" className="shadow-sm">
        <div className="h-56 sm:h-64 relative">
          {activeChart === 'spending-trend' && (
            <Line data={getSpendingTrendData()} options={chartOptions()} />
          )}

          {activeChart === 'category-breakdown' && (
            <Doughnut data={getActivityBreakdown()} options={doughnutOptions} />
          )}

          {activeChart === 'monthly-comparison' && (
            <Bar data={getMonthlyData()} options={chartOptions()} />
          )}
        </div>
      </GlassCard>

      {/* Quick Stats Grid - Executive Style */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(() => {
          const now = new Date();
          const thisMonthOutflow = transactions
            .filter(t => {
              const tDate = new Date(t.date || t.createdAt);
              return tDate.getMonth() === now.getMonth() &&
                tDate.getFullYear() === now.getFullYear() &&
                ['expense', 'credit', 'repayment'].includes(t.type);
            })
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

          const daysPassed = now.getDate();
          const activityData = getActivityBreakdown();
          let topCategory = null;
          if (activityData.labels && activityData.labels.length > 0 && !activityData.labels.includes('No activity')) {
            const totals = activityData.labels.reduce((acc, label, i) => {
              acc[label] = activityData.datasets[0].data[i] || 0;
              return acc;
            }, {});
            const sorted = Object.entries(totals).sort(([, a], [, b]) => b - a);
            topCategory = sorted.length > 0 ? sorted[0] : null;
          }

          const stats = [
            {
              label: 'Outflow',
              value: formatCurrency(thisMonthOutflow),
              color: 'primary',
              importance: 'high',
              icon: TrendingDown
            },
            {
              label: 'Avg/Day',
              value: formatCurrency(thisMonthOutflow / daysPassed),
              color: 'info',
              importance: 'medium',
              icon: Calendar
            },
            {
              label: 'Top Area',
              value: topCategory ? topCategory[0] : 'N/A',
              color: 'warning',
              importance: 'medium',
              icon: PieChart
            },
            {
              label: 'Entries',
              value: transactions.length.toString(),
              color: 'ink',
              importance: 'low',
              icon: BarChart3
            },
          ];

          return stats.map((stat, index) => (
            <GlassCard
              key={index}
              padding="p-3.5"
              backgroundIcon={stat.icon}
              iconColor={stat.color}
              className="flex flex-col items-center text-center group hover:bg-paper-100/50 dark:hover:bg-white/[0.04] transition-all border-paper-200/50 dark:border-white/5"
            >
              <IconBox
                icon={stat.icon}
                size="xs"
                color={stat.color}
                variant="glass"
                className={`mb-3 ${stat.importance === 'low' ? 'opacity-40' : 'opacity-80'} group-hover:opacity-100 transition-opacity`}
              />
              <span className="text-overline opacity-40 uppercase tracking-widest mb-1 ">
                {stat.label}
              </span>
              <div className={`text-label font-bold tracking-tight ${stat.color === 'primary' ? 'text-primary-600 dark:text-primary-400' :
                stat.color === 'info' ? 'text-blue-600 dark:text-blue-400' :
                  stat.color === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                    'text-ink-900 dark:text-white'
                }`}>
                {stat.value}
              </div>
            </GlassCard>
          ));
        })()}
      </div>
    </div>
  );
};

export default SpendingAnalytics;