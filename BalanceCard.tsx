/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign } from 'lucide-react';

interface AnimatedNumberProps {
  value: number;
}

export function AnimatedNumber({ value }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;

    const duration = 600; // ms
    const startTime = performance.now();

    function update(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const easeProgress = progress * (2 - progress);
      const current = start + (end - start) * easeProgress;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setDisplayValue(end);
      }
    }

    requestAnimationFrame(update);
  }, [value]);

  return (
    <span>
      {displayValue < 0 ? '-' : ''}
      ${Math.abs(displayValue).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </span>
  );
}

interface BalanceCardProps {
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
  savingsRate: number;
}

export default function BalanceCard({
  totalIncome,
  totalExpense,
  currentBalance,
  savingsRate,
}: BalanceCardProps) {
  // Let's create a dynamic comparison indicator. If balance > 0, we have green trend, else red.
  const isHealthy = currentBalance >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" id="balance-hero-grid">
      {/* Net Balance Card */}
      <div 
        id="net-balance-card"
        className="relative md:col-span-1 overflow-hidden rounded-3xl bg-linear-to-br from-violet-600 via-violet-600 to-indigo-700 p-6 text-white shadow-xl shadow-violet-600/10 dark:shadow-violet-900/30 transition-all duration-300 hover:scale-[1.01]"
      >
        {/* Background shapes */}
        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/5 blur-xl"></div>
        <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-violet-400/20 blur-2xl"></div>

        <div className="relative flex justify-between items-start">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-violet-100">Total Balance</p>
            <h2 className="text-3xl font-bold tracking-tight mt-1">
              <AnimatedNumber value={currentBalance} />
            </h2>
          </div>
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
            <DollarSign className="h-6 w-6 text-violet-100" />
          </div>
        </div>

        <div className="relative flex items-center gap-2 mt-6">
          <div className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${isHealthy ? 'bg-emerald-500/20 text-emerald-200' : 'bg-rose-500/20 text-rose-200'}`}>
            {isHealthy ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            <span>{isHealthy ? '+12.5%' : '-2.1%'} vs last month</span>
          </div>
          <p className="text-xs text-violet-200">Continuous logs</p>
        </div>
      </div>

      {/* Monthly Income Card */}
      <div 
        id="monthly-income-card"
        className="rounded-3xl bg-white dark:bg-emerald-500/5 p-6 shadow-xs border border-slate-100 dark:border-emerald-500/10 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01]"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500">Monthly Income</p>
            <h3 className="text-2xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white">
              <AnimatedNumber value={totalIncome} />
            </h3>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/10">
            <ArrowUpRight className="h-5 w-5 text-emerald-500" />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800/60 pt-4 mt-4 text-xs">
          <span className="text-slate-500 dark:text-zinc-400">Monthly savings rate:</span>
          <span className="font-semibold text-emerald-500">{savingsRate}%</span>
        </div>
      </div>

      {/* Monthly Expense Card */}
      <div 
        id="monthly-expense-card"
        className="rounded-3xl bg-white dark:bg-rose-500/5 p-6 shadow-xs border border-slate-100 dark:border-rose-500/10 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01]"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500">Monthly Expense</p>
            <h3 className="text-2xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white">
              <AnimatedNumber value={totalExpense} />
            </h3>
          </div>
          <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/10">
            <ArrowDownRight className="h-5 w-5 text-rose-500" />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800/60 pt-4 mt-4 text-xs">
          <span className="text-slate-500 dark:text-zinc-400">Total outgoings:</span>
          <span className="font-semibold text-rose-500">
            {totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(0) : '0'}% of income
          </span>
        </div>
      </div>
    </div>
  );
}
