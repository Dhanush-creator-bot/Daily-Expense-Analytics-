/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { Calendar, TrendingUp, HelpCircle, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';
import { Transaction, TimeFilter, DateRange } from '../types';
import { CATEGORIES } from '../data';
import CategoryIcon from './CategoryIcon';

interface AnalyticsChartsProps {
  transactions: Transaction[];
}

export default function AnalyticsCharts({ transactions }: AnalyticsChartsProps) {
  // Filters state
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [customRange, setCustomRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Calculate Date bounds depending on filter selection
  const activeBounds = useMemo(() => {
    const end = new Date();
    let start = new Date();

    if (timeFilter === 'week') {
      start.setDate(end.getDate() - 7);
    } else if (timeFilter === 'month') {
      start.setMonth(end.getMonth() - 1);
    } else if (timeFilter === 'year') {
      start.setFullYear(end.getFullYear() - 1);
    } else {
      // Custom range
      return {
        start: new Date(customRange.startDate + 'T00:00:00'),
        end: new Date(customRange.endDate + 'T23:59:59'),
      };
    }

    return { start, end };
  }, [timeFilter, customRange]);

  // Filter transactions within selected range
  const filteredTransactions = useMemo(() => {
    const { start, end } = activeBounds;
    return transactions.filter((t) => {
      const txDate = new Date(t.date + 'T12:00:00');
      return txDate >= start && txDate <= end;
    });
  }, [transactions, activeBounds]);

  // 1. Expense Breakdown by Category (Donut Chart)
  const expensePieData = useMemo(() => {
    const totals: Record<string, number> = {};
    let grandTotal = 0;

    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        // Normalise category
        const catKey = t.category === 'Others' ? 'Expense Others' : t.category;
        totals[catKey] = (totals[catKey] || 0) + t.amount;
        grandTotal += t.amount;
      });

    return Object.entries(totals)
      .map(([catKey, total]) => {
        const cat = CATEGORIES[catKey];
        return {
          name: cat?.name || catKey,
          value: parseFloat(total.toFixed(2)),
          percentage: grandTotal > 0 ? parseFloat(((total / grandTotal) * 100).toFixed(1)) : 0,
          color: cat?.accentColor || '#64748b',
          iconName: cat?.iconName || 'HelpCircle',
          colorClass: cat?.color || 'text-slate-500',
          bgColorClass: cat?.bgColor || 'bg-slate-500/10',
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  // 2. Income vs Expense Over Time (Bar Chart grouped by Date or Week)
  const incomeVsExpenseData = useMemo(() => {
    // Determine step buckets.
    // If range is within 7 days, group by day name.
    // If within 35 days, group by date.
    // Otherwise group by month name.
    const { start, end } = activeBounds;
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));

    const bucketSums: Record<string, { income: number; expense: number }> = {};

    filteredTransactions.forEach((t) => {
      let bucketKey = '';
      const dateObj = new Date(t.date + 'T12:00:00');

      if (diffDays <= 8) {
        bucketKey = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (diffDays <= 35) {
        bucketKey = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        bucketKey = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }

      if (!bucketSums[bucketKey]) {
        bucketSums[bucketKey] = { income: 0, expense: 0 };
      }

      if (t.type === 'income') {
        bucketSums[bucketKey].income += t.amount;
      } else {
        bucketSums[bucketKey].expense += t.amount;
      }
    });

    // To ensure charts appear in chronological order, sort bucket keys based on actual dates
    // If difference is short, let's preserve date-based sorting
    const sortedBucketKeys = Object.keys(bucketSums).sort((a, b) => {
      // We can find the earliest transaction for each bucket and compare
      const findEarliestDate = (bucket: string) => {
        const matchingTx = filteredTransactions.find((t) => {
          const dateObj = new Date(t.date + 'T12:00:00');
          let key = '';
          if (diffDays <= 8) {
            key = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          } else if (diffDays <= 35) {
            key = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          } else {
            key = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          }
          return key === bucket;
        });
        return matchingTx ? new Date(matchingTx.date).getTime() : 0;
      };

      return findEarliestDate(a) - findEarliestDate(b);
    });

    return sortedBucketKeys.map((key) => ({
      name: key,
      Income: parseFloat(bucketSums[key].income.toFixed(2)),
      Expense: parseFloat(bucketSums[key].expense.toFixed(2)),
    }));
  }, [filteredTransactions, activeBounds]);

  // 3. Running Balance Trend (Area/Line Chart)
  const balanceTrendData = useMemo(() => {
    // Sort ALL transactions chronological up to the END of our bounds, to calculate correct starting balance
    const sortedAll = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.createdAt.localeCompare(b.createdAt)
    );

    const { start, end } = activeBounds;

    let balanceAccumulator = 0;
    const trendPoints: { dateLabel: string; Balance: number; timestamp: number }[] = [];

    // Map of day totals within the range to avoid multiple points for same day
    const dayTotals: Record<string, number> = {};

    sortedAll.forEach((t) => {
      const txVal = t.type === 'income' ? t.amount : -t.amount;
      balanceAccumulator += txVal;

      const txDate = new Date(t.date + 'T12:00:00');
      // If within our range, track this point
      if (txDate >= start && txDate <= end) {
        dayTotals[t.date] = balanceAccumulator;
      }
    });

    // Fallback: if no transactions inside range, but we have transactions before range, start with that final balance
    if (Object.keys(dayTotals).length === 0) {
      let initialBal = 0;
      sortedAll.forEach((t) => {
        const txDate = new Date(t.date + 'T12:00:00');
        if (txDate < start) {
          initialBal += t.type === 'income' ? t.amount : -t.amount;
        }
      });
      // Set points at start and end
      trendPoints.push({
        dateLabel: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Balance: parseFloat(initialBal.toFixed(2)),
        timestamp: start.getTime(),
      });
      trendPoints.push({
        dateLabel: end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Balance: parseFloat(initialBal.toFixed(2)),
        timestamp: end.getTime(),
      });
    } else {
      // Sort keys of dayTotals
      Object.entries(dayTotals)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([dateKey, balance]) => {
          const dateObj = new Date(dateKey + 'T12:00:00');
          trendPoints.push({
            dateLabel: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            Balance: parseFloat(balance.toFixed(2)),
            timestamp: dateObj.getTime(),
          });
        });
    }

    return trendPoints;
  }, [transactions, filteredTransactions, activeBounds]);

  // 4. Top 3 Spending Categories (Highlight Cards)
  const topSpendingCategories = useMemo(() => {
    return expensePieData.slice(0, 3);
  }, [expensePieData]);

  // Custom tooltips to match beautiful light/dark theme
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-2xl bg-white dark:bg-zinc-950 border border-slate-100 dark:border-white/10 p-3 shadow-xl backdrop-blur-md">
          <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 mb-1">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} className="text-sm font-bold" style={{ color: entry.color || entry.fill }}>
              {entry.name}: ${entry.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const totalFilteredExpense = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  return (
    <div className="space-y-6" id="analytics-section">
      {/* Time Filters bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl bg-white dark:bg-white/3 border border-slate-100 dark:border-white/5 p-5 shadow-xs">
        {/* Switch pills */}
        <div className="flex bg-slate-50 dark:bg-white/3 p-1 rounded-2xl border border-slate-100 dark:border-white/5 w-full sm:w-auto">
          {(['week', 'month', 'year', 'custom'] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              id={`analytics-tab-${filter}`}
              onClick={() => setTimeFilter(filter)}
              className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold rounded-xl capitalize transition-all cursor-pointer ${
                timeFilter === filter
                  ? 'bg-white dark:bg-white/10 shadow-xs text-violet-600 dark:text-violet-400'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              {filter === 'custom' ? 'Custom Range' : `This ${filter}`}
            </button>
          ))}
        </div>

        {/* Custom Range Inputs */}
        {timeFilter === 'custom' && (
          <div className="flex items-center gap-2 w-full sm:w-auto text-xs" id="custom-range-inputs">
            <Calendar className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
            <input
              type="date"
              value={customRange.startDate}
              onChange={(e) => setCustomRange({ ...customRange, startDate: e.target.value })}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/5 text-slate-800 dark:text-zinc-200 font-semibold"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customRange.endDate}
              onChange={(e) => setCustomRange({ ...customRange, endDate: e.target.value })}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/5 text-slate-800 dark:text-zinc-200 font-semibold"
            />
          </div>
        )}
      </div>

      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="analytics-charts-grid">
        {/* Area Chart: Balance Trend */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-white/3 border border-slate-100 dark:border-white/5 p-5 shadow-xs flex flex-col justify-between h-[360px] backdrop-blur-md">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              Balance Trend Over Time
            </h4>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
              Visualizes accumulated funds and net worth fluctuations.
            </p>
          </div>
          <div className="h-[250px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={balanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.08)" />
                <XAxis dataKey="dateLabel" tickLine={false} axisLine={false} style={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Balance" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#balanceGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Expense Category Distribution */}
        <div className="rounded-3xl bg-white dark:bg-white/3 border border-slate-100 dark:border-white/5 p-5 shadow-xs flex flex-col justify-between h-[360px] backdrop-blur-md">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Expense Distribution</h4>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
              Where your money is allocated by category.
            </p>
          </div>
          {expensePieData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <HelpCircle className="h-8 w-8 text-slate-300 dark:text-zinc-700 mb-2" />
              <p className="text-xs text-slate-400 dark:text-zinc-500">No expenses recorded in this period</p>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center mt-2 relative">
              <div className="w-[180px] h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                       data={expensePieData}
                       cx="50%"
                       cy="50%"
                       innerRadius={55}
                       outerRadius={75}
                       paddingAngle={4}
                       dataKey="value"
                    >
                      {expensePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Central stat */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wider">Total</span>
                <span className="text-base font-extrabold text-slate-800 dark:text-white">${totalFilteredExpense.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          )}

          {/* Simple top 3 Legend */}
          <div className="grid grid-cols-3 gap-2 border-t border-slate-50 dark:border-white/5 pt-3 text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
            {expensePieData.slice(0, 3).map((item, i) => (
              <div key={i} className="flex items-center gap-1 overflow-hidden">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="truncate">{item.name}</span>
                <span className="text-slate-400 dark:text-zinc-600 font-bold shrink-0">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart: Income vs Expense comparison */}
        <div className="lg:col-span-3 rounded-3xl bg-white dark:bg-white/3 border border-slate-100 dark:border-white/5 p-5 shadow-xs flex flex-col justify-between h-[340px] backdrop-blur-md">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Income vs Expense Comparison</h4>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
              Double-bar comparison of money inflows versus outgoings.
            </p>
          </div>
          <div className="h-[230px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeVsExpenseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.08)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11, paddingBottom: 5 }} />
                <Bar dataKey="Income" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
                <Bar dataKey="Expense" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Spending Categories: Insight Cards */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-950 dark:text-white flex items-center gap-2 pt-2">
          <Sparkles className="h-5 w-5 text-violet-500" />
          Top Expense Category Insights
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="top-spending-insights-grid">
          {topSpendingCategories.length === 0 ? (
            <div className="md:col-span-3 rounded-3xl bg-slate-50 dark:bg-white/3 border border-slate-100 dark:border-white/5 p-8 text-center text-sm text-slate-400 dark:text-zinc-500">
              Complete your first logs to see spending suggestions and category optimizations.
            </div>
          ) : (
            topSpendingCategories.map((item, index) => {
              // Generate standard coach suggestions
              let tip = '';
              if (item.name === 'Food') {
                tip = `You spent $${item.value} on Food this period. Decreasing dining-out logs by 15% and opting for weekend meal prep can free up roughly $${(item.value * 0.15).toFixed(0)} monthly.`;
              } else if (item.name === 'Shopping') {
                tip = `Shopping makes up ${item.percentage}% of outgoings. Try adopting the "48-hour cool-off rule" before finalizing ecommerce orders to secure an estimated savings of $${(item.value * 0.25).toFixed(0)}.`;
              } else if (item.name === 'Rent') {
                tip = `Rent represents a static commitment of $${item.value}. While rent is unavoidable, ensure your overall utilities and home subscriptions stay within 10% of this figure to balance outgoings.`;
              } else if (item.name === 'Bills') {
                tip = `Bills total $${item.value}. Consider auditing active streaming plans, checking for double-billing, or calling service providers to inquire about promotion renewals.`;
              } else {
                tip = `Your ${item.name} spending totals $${item.value} (${item.percentage}% of all expenses). Setting an intentional weekly limit of $${(item.value / 3).toFixed(0)} is an excellent way to cap overruns.`;
              }

              return (
                <div
                  key={item.name}
                  className="rounded-3xl bg-white dark:bg-white/3 border border-slate-100 dark:border-white/5 backdrop-blur-md p-5 shadow-xs flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl ${item.bgColorClass}`}>
                        <CategoryIcon name={item.iconName} className={item.colorClass} size={16} />
                      </div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">#{index + 1} Spender</span>
                  </div>

                  <div className="mt-4 space-y-1">
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                      ${item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
                      <span>Represents</span>
                      <span className={`${item.colorClass}`}>{item.percentage}%</span>
                      <span>of total outgoings</span>
                    </div>
                  </div>

                  <p className="mt-4 text-xs font-medium leading-relaxed text-slate-500 dark:text-zinc-400 border-t border-slate-50 dark:border-white/5 pt-4">
                    {tip}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
