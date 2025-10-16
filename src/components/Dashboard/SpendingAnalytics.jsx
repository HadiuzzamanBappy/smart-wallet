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
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useTransactions } from '../../hooks/useTransactions';
import { formatCurrency } from '../../utils/helpers';
// normalizeCategory not needed here after activity breakdown changes
import { Calendar, TrendingUp, PieChart, BarChart3 } from 'lucide-react';
import { AnalyticsSkeleton } from '../UI/SkeletonLoader';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const SpendingAnalytics = () => {
  const { transactions, loading: txLoading } = useTransactions();
  const loading = txLoading;
  const [activeChart, setActiveChart] = useState('spending-trend');

  // Use shared transactions from TransactionContext. This ensures analytics
  // updates in sync with other components (no local polling or event races).

  // Process data for spending trend chart (last 7 days)
  const getSpendingTrendData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const dailySpending = last7Days.map(date => {
      const dayTransactions = transactions.filter(t => 
        t.date.toISOString().split('T')[0] === date && t.type === 'expense'
      );
      return dayTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    });

    const dailyIncome = last7Days.map(date => {
      const dayTransactions = transactions.filter(t => 
        t.date.toISOString().split('T')[0] === date && t.type === 'income'
      );
      return dayTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    });

    const dailyCredit = last7Days.map(date => {
      const dayTransactions = transactions.filter(t => 
        t.date.toISOString().split('T')[0] === date && t.type === 'credit'
      );
      return dayTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    });

    const dailyLoan = last7Days.map(date => {
      const dayTransactions = transactions.filter(t => 
        t.date.toISOString().split('T')[0] === date && t.type === 'loan'
      );
      return dayTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    });

    return {
      labels: last7Days.map(date => new Date(date).toLocaleDateString('en', { weekday: 'short', day: 'numeric' })),
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
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Credit Given',
          data: dailyCredit,
          borderColor: 'rgb(20, 184, 166)',
          backgroundColor: 'rgba(20, 184, 166, 0.08)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Loan Taken',
          data: dailyLoan,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.08)',
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
      if (t.type === 'income') totals.Income += amt;
      else if (t.type === 'expense') totals.Expense += amt;
      else if (t.type === 'credit') totals['Credit Given'] += amt;
      else if (t.type === 'loan') totals['Loan Taken'] += amt;
    });

    const labels = Object.keys(totals);
    const data = labels.map(l => totals[l]);
    const colors = ['#22c55e', '#ef4444', '#14b8a6', '#6366f1'];

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
        const tDate = t.date;
        return tDate.getMonth() === month.fullDate.getMonth() && 
               tDate.getFullYear() === month.fullDate.getFullYear() && 
               t.type === 'expense';
      });
      return monthTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    });

    const monthlyIncome = months.map(month => {
      const monthTransactions = transactions.filter(t => {
        const tDate = t.date;
        return tDate.getMonth() === month.fullDate.getMonth() && 
               tDate.getFullYear() === month.fullDate.getFullYear() && 
               t.type === 'income';
      });
      return monthTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    });

    const monthlyCredit = months.map(month => {
      const monthTransactions = transactions.filter(t => {
        const tDate = t.date;
        return tDate.getMonth() === month.fullDate.getMonth() && 
               tDate.getFullYear() === month.fullDate.getFullYear() && 
               t.type === 'credit';
      });
      return monthTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    });

    const monthlyLoan = months.map(month => {
      const monthTransactions = transactions.filter(t => {
        const tDate = t.date;
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
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 2,
        },
        {
          label: 'Credit Given',
          data: monthlyCredit,
          backgroundColor: 'rgba(20, 184, 166, 0.8)',
          borderColor: 'rgb(20, 184, 166)',
          borderWidth: 2,
        },
        {
          label: 'Loan Taken',
          data: monthlyLoan,
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderColor: 'rgb(99, 102, 241)',
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
        labels: { usePointStyle: true, padding: 12, boxWidth: 8, font: { size: 12 } }
      },
      tooltip: {
        bodyFont: { size: 14 },
        titleFont: { size: 13 },
        padding: 10,
        callbacks: {
          label: function(context) {
            const value = formatCurrency(context.parsed.y || context.parsed);
            return `${context.dataset.label}: ${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 7, font: { size: 11 } }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          },
          font: { size: 11 }
        }
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
      },
      bar: {
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 36,
      }
    }
  });

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 12, padding: 8, font: { size: 12 } }
      },
      tooltip: {
        bodyFont: { size: 14 },
        callbacks: {
          label: function(context) {
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
      <div className="p-6 text-center">
        <BarChart3 className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Data Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Add some transactions to see your spending analytics and trends.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Chart Type Selector */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {[
          { id: 'spending-trend', label: 'Weekly Trend', icon: TrendingUp },
          { id: 'category-breakdown', label: 'Categories', icon: PieChart },
          { id: 'monthly-comparison', label: 'Monthly View', icon: BarChart3 },
        ].map((chart) => {
          const IconComponent = chart.icon;
          return (
            <button
              key={chart.id}
              onClick={() => setActiveChart(chart.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeChart === chart.id
                  ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span className="hidden sm:inline">{chart.label}</span>
              <span className="sm:hidden">{chart.icon === TrendingUp ? 'Trend' : chart.icon === PieChart ? 'Cat.' : 'Month'}</span>
            </button>
          );
        })}
      </div>

      {/* Chart Display */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="h-64 sm:h-80">
          {activeChart === 'spending-trend' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                7-Day Spending Trend
              </h3>
              <div className="w-full h-56 sm:h-72">
                <Line data={getSpendingTrendData()} options={chartOptions()} />
              </div>
            </div>
          )}
          
              {activeChart === 'category-breakdown' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Activity Breakdown
              </h3>
              <div className="w-full h-56 sm:h-64">
                <Doughnut data={getActivityBreakdown()} options={doughnutOptions} />
              </div>
            </div>
          )}
          
          {activeChart === 'monthly-comparison' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                6-Month Comparison
              </h3>
              <div className="w-full h-64 sm:h-80">
                <Bar data={getMonthlyData()} options={chartOptions()} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(() => {
          const thisMonthExpenses = transactions
            .filter(t => {
              const tDate = t.date;
              const now = new Date();
              return tDate.getMonth() === now.getMonth() && 
                     tDate.getFullYear() === now.getFullYear() && 
                     t.type === 'expense';
            })
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

          const avgDailySpending = thisMonthExpenses / new Date().getDate();
          // compute top category from the normalized category data
          // Use activity breakdown totals to determine a top 'activity' (mostly for display)
          const activityData = getActivityBreakdown();
          let topCategory = null;
          if (activityData.labels && activityData.labels.length > 0) {
            const totals = activityData.labels.reduce((acc, label, i) => {
              acc[label] = activityData.datasets[0].data[i] || 0;
              return acc;
            }, {});
            const sorted = Object.entries(totals).sort(([,a], [,b]) => b - a);
            topCategory = sorted.length > 0 ? sorted[0] : null;
          }

          const stats = [
            {
              label: 'This Month',
              value: formatCurrency(thisMonthExpenses),
              color: 'text-red-600 dark:text-red-400',
              bg: 'bg-red-50 dark:bg-red-900/20'
            },
            {
              label: 'Daily Avg',
              value: formatCurrency(avgDailySpending),
              color: 'text-blue-600 dark:text-blue-400',
              bg: 'bg-blue-50 dark:bg-blue-900/20'
            },
            {
              label: 'Top Category',
              value: topCategory ? topCategory[0] : 'N/A',
              color: 'text-purple-600 dark:text-purple-400',
              bg: 'bg-purple-50 dark:bg-purple-900/20'
            },
            {
              label: 'Total Records',
              value: transactions.length.toString(),
              color: 'text-green-600 dark:text-green-400',
              bg: 'bg-green-50 dark:bg-green-900/20'
            },
          ];

          return stats.map((stat, index) => (
            <div key={index} className={`p-4 rounded-xl ${stat.bg} text-center`}>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {stat.label}
              </p>
              <p className={`text-sm sm:text-base font-bold ${stat.color} truncate`}>
                {stat.value}
              </p>
            </div>
          ));
        })()}
      </div>
    </div>
  );
};

export default SpendingAnalytics;