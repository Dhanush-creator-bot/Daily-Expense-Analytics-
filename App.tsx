/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Sparkles,
  Settings,
  Plus,
  ArrowRight,
  TrendingUp,
  FileText,
  User,
  Trash2,
  RefreshCw,
  FileDown,
  ChevronRight,
  CheckCircle2,
  Undo2,
  DollarSign
} from 'lucide-react';

import { Transaction, TransactionType } from './types';
import { MOCK_TRANSACTIONS, CATEGORIES } from './data';
import ThemeToggle from './components/ThemeToggle';
import BalanceCard from './components/BalanceCard';
import TransactionModal from './components/TransactionModal';
import TransactionList from './components/TransactionList';
import AnalyticsCharts from './components/AnalyticsCharts';
import SpendingInsights from './components/SpendingInsights';
import CategoryIcon from './components/CategoryIcon';

interface Toast {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }
    return false;
  });

  // Apply theme class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Load / Store Transactions
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('transactions');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('Error parsing stored transactions:', e);
        }
      }
    }
    return MOCK_TRANSACTIONS;
  });

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'analytics' | 'insights' | 'settings'>('dashboard');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);

  // Undo Stack state for Deletion undo toast
  const [undoStack, setUndoStack] = useState<Transaction[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);

  // Manage Toast Auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Triggers custom toasts
  const triggerToast = (message: string, actionLabel?: string, onAction?: () => void) => {
    setToast({
      id: Math.random().toString(),
      message,
      actionLabel,
      onAction,
    });
  };

  // Transaction Actions
  const handleSaveTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => {
    if (txData.id) {
      // Editing
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === txData.id
            ? { ...t, ...txData, amount: txData.amount } as Transaction
            : t
        )
      );
      triggerToast('Transaction updated successfully!');
    } else {
      // Creating
      const newTx: Transaction = {
        id: `t-${Date.now()}`,
        type: txData.type,
        amount: txData.amount,
        category: txData.category,
        date: txData.date,
        note: txData.note,
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => [newTx, ...prev]);
      triggerToast('New transaction logged!');
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const txToDelete = transactions.find((t) => t.id === id);
    if (!txToDelete) return;

    // Save to undo stack
    setUndoStack((prev) => [...prev, txToDelete]);

    // Remove from active logs
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    // Offer Undo Toast
    triggerToast('Transaction deleted.', 'Undo', () => {
      setTransactions((prev) => {
        // Double check it doesn't already exist
        if (prev.some((t) => t.id === txToDelete.id)) return prev;
        return [txToDelete, ...prev].sort((a, b) => b.date.localeCompare(a.date));
      });
      triggerToast('Transaction restored!');
    });
  };

  const handleEditInit = (tx: Transaction) => {
    setEditTransaction(tx);
    setIsModalOpen(true);
  };

  // Monthly aggregated values (specifically for June 2026, which is our mock focal month)
  const monthlyMetrics = useMemo(() => {
    // We can aggregate specifically for June 2026 to fit mock timelines, 
    // or aggregate the current visible logs in that month dynamically.
    const juneTransactions = transactions.filter((t) => t.date.startsWith('2026-06'));

    const totalIncome = juneTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = juneTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentBalance = totalIncome - totalExpense;

    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

    return {
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalExpense: parseFloat(totalExpense.toFixed(2)),
      currentBalance: parseFloat(currentBalance.toFixed(2)),
      savingsRate: Math.max(0, savingsRate),
    };
  }, [transactions]);

  // Export to CSV sheets client side
  const exportToCSV = () => {
    const headers = ['ID', 'Type', 'Amount', 'Category', 'Date', 'Note', 'CreatedAt'];
    const rows = transactions.map((t) => [
      t.id,
      t.type,
      t.amount,
      t.category,
      t.date,
      `"${t.note.replace(/"/g, '""')}"`,
      t.createdAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'daily_expenses_report_june_2026.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Report CSV downloaded successfully!');
  };

  const resetToSeed = () => {
    if (confirm('Are you sure you want to restore the default June 2026 transactions database?')) {
      setTransactions(MOCK_TRANSACTIONS);
      triggerToast('Database re-seeded with mock transactions.');
    }
  };

  const clearDatabase = () => {
    if (confirm('Wipe database? This will clear all transactions to let you test empty state layouts.')) {
      setTransactions([]);
      triggerToast('Database wiped successfully.');
    }
  };

  // Recent 4 Transactions for dashboard preview
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      .slice(0, 4);
  }, [transactions]);

  // Sidebar Menu Items config
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'History', icon: Receipt },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'insights', label: 'AI Insights', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-slate-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* SIDEBAR NAVIGATION (Desktop) */}
      <aside 
        id="desktop-sidebar"
        className="hidden md:flex flex-col justify-between w-64 bg-white dark:bg-zinc-950 border-r border-slate-100 dark:border-white/5 p-6 shrink-0 sticky top-0 h-screen"
      >
        <div className="space-y-8">
          {/* Brand/Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-md shadow-violet-600/20">
              <TrendingUp className="h-5.5 w-5.5" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-display tracking-tight leading-none dark:text-white">Fintechly</h1>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold mt-1">Expense Analytics</p>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-1.5" id="sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all cursor-pointer outline-none ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/15 dark:shadow-violet-600/10'
                      : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="space-y-4 pt-6 border-t border-slate-50 dark:border-white/5">
          {/* Quick add floating action on sidebar */}
          <button
            id="sidebar-add-tx-btn"
            onClick={() => {
              setEditTransaction(null);
              setIsModalOpen(true);
            }}
            className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 dark:bg-violet-600 dark:hover:bg-violet-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer outline-none focus:ring-2 focus:ring-violet-500/40 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Log Transaction
          </button>

          {/* Profile card & Theme Toggle */}
          <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-white/3 p-3 rounded-2xl border border-slate-100/50 dark:border-white/5">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-8 w-8 bg-violet-100 dark:bg-violet-900/50 rounded-full flex items-center justify-center text-violet-600 dark:text-violet-400 font-extrabold text-sm shrink-0">
                D
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold dark:text-white truncate">Dhanush</p>
                <p className="text-[9px] text-slate-400 truncate">Suresh</p>
              </div>
            </div>
            <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <div 
        id="mobile-nav-bar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-t border-slate-100 dark:border-white/5 px-4 py-2.5 flex justify-around items-center"
      >
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 p-2 outline-none cursor-pointer ${
                isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-zinc-500'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-bold">{item.label}</span>
            </button>
          );
        })}

        {/* Center Mobile FAB Add */}
        <button
          id="mobile-add-fab"
          onClick={() => {
            setEditTransaction(null);
            setIsModalOpen(true);
          }}
          className="h-12 w-12 bg-violet-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-violet-600/35 relative -top-4 cursor-pointer outline-none focus:ring-4 focus:ring-violet-600/20 active:scale-95 transition-transform"
        >
          <Plus className="h-6 w-6" />
        </button>

        {navItems.slice(2, 4).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 p-2 outline-none cursor-pointer ${
                isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-zinc-500'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-bold">{item.label}</span>
            </button>
          );
        })}

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 p-2 outline-none cursor-pointer ${
            activeTab === 'settings' ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-zinc-500'
          }`}
        >
          <Settings className="h-5 w-5" />
          <span className="text-[9px] font-bold">Settings</span>
        </button>
      </div>

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div id="dashboard-tab-view" className="space-y-6">
                {/* Header Welcome Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight text-slate-950 dark:text-white">
                      Hello, Dhanush
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                      Welcome back! Here is a breakdown of your financial posture for June 2026.
                    </p>
                  </div>

                  {/* Date badge */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-white/3 border border-slate-100 dark:border-white/5 text-xs text-slate-600 dark:text-zinc-300 font-semibold self-start sm:self-auto">
                    <span className="h-2 w-2 rounded-full bg-violet-500"></span>
                    <span>June 30, 2026</span>
                  </div>
                </div>

                {/* Hero Balance Cards row */}
                <BalanceCard
                  totalIncome={monthlyMetrics.totalIncome}
                  totalExpense={monthlyMetrics.totalExpense}
                  currentBalance={monthlyMetrics.currentBalance}
                  savingsRate={monthlyMetrics.savingsRate}
                />

                {/* Quick stats row */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6" id="quick-stats-row">
                  <div className="rounded-2xl bg-white dark:bg-white/3 border border-slate-100 dark:border-white/5 backdrop-blur-md p-4 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Wealth Efficiency</span>
                    <p className={`text-sm font-extrabold mt-1 ${monthlyMetrics.savingsRate >= 30 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {monthlyMetrics.savingsRate >= 30 ? 'Excellent (30%+)' : 'Needs Budgeting'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white dark:bg-white/3 border border-slate-100 dark:border-white/5 backdrop-blur-md p-4 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Active Logs Count</span>
                    <p className="text-sm font-extrabold mt-1 text-slate-900 dark:text-white">
                      {transactions.length} records
                    </p>
                  </div>
                  <div className="col-span-2 md:col-span-1 rounded-2xl bg-white dark:bg-white/3 border border-slate-100 dark:border-white/5 backdrop-blur-md p-4 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Cashflow Surplus Ratio</span>
                    <p className="text-sm font-extrabold mt-1 text-violet-500">
                      {monthlyMetrics.totalExpense > 0
                        ? (monthlyMetrics.totalIncome / monthlyMetrics.totalExpense).toFixed(1)
                        : '∞'}{' '}
                      x inflow
                    </p>
                  </div>
                </div>

                {/* Main Dashboard bento split */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                  {/* Left: Quick AI Coach Promo widget */}
                  <div className="lg:col-span-2 rounded-3xl bg-linear-to-br from-violet-600 to-indigo-700 p-6 text-white shadow-md shadow-violet-600/10 flex flex-col justify-between h-72">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                        Intelligent Finance
                      </span>
                      <h3 className="text-lg font-bold font-display tracking-tight mt-3">
                        Conduct a structural wealth audit powered by Gemini AI
                      </h3>
                      <p className="text-xs text-violet-100 leading-relaxed mt-2.5">
                        Let Gemini run high-performance checks on your transport, shopping, and food bills to pinpoint structural leaks.
                      </p>
                    </div>

                    <button
                      id="dashboard-explore-ai-insights"
                      onClick={() => setActiveTab('insights')}
                      className="px-4 py-2.5 rounded-xl bg-white text-violet-600 hover:bg-violet-50 text-xs font-bold transition-all shadow-md self-start flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Explore Insights</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Right: Recent Transactions List Preview */}
                  <div className="lg:col-span-3 rounded-3xl bg-white dark:bg-white/3 border border-slate-100 dark:border-white/5 backdrop-blur-md p-6 flex flex-col justify-between h-72">
                    <div className="flex justify-between items-center pb-2">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Recent Transactions</h4>
                      <button
                        id="view-all-tx-link"
                        onClick={() => setActiveTab('transactions')}
                        className="text-xs font-bold text-violet-600 dark:text-violet-400 flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        View All
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Simple list of recent transactions */}
                    <div className="space-y-2 flex-1 mt-3 overflow-y-auto">
                      {recentTransactions.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-zinc-500 text-center py-10">No logs found yet.</p>
                      ) : (
                        recentTransactions.map((tx) => {
                          const catKey =
                            tx.type === 'income' && tx.category === 'Others'
                              ? 'Income Others'
                              : tx.type === 'expense' && tx.category === 'Others'
                              ? 'Expense Others'
                              : tx.category;
                          const cat = CATEGORIES[catKey];
                          return (
                            <div
                              key={tx.id}
                              className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-white/3 rounded-xl border border-transparent hover:border-slate-100/50 dark:hover:border-white/5 transition-all"
                            >
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${cat?.bgColor}`}>
                                  <CategoryIcon name={cat?.iconName || 'HelpCircle'} className={cat?.color} size={15} />
                                </div>
                                <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate max-w-[120px] md:max-w-[200px]">
                                  {tx.note || cat?.name || tx.category}
                                </span>
                              </div>
                              <span className={`text-xs font-bold ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: HISTORY */}
            {activeTab === 'transactions' && (
              <div id="transactions-tab-view" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Transaction Logs</h2>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                      Search, sort, edit or remove transactions.
                    </p>
                  </div>

                  <button
                    id="history-tab-add-btn"
                    onClick={() => {
                      setEditTransaction(null);
                      setIsModalOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Add Transaction
                  </button>
                </div>

                <TransactionList
                  transactions={transactions}
                  onEdit={handleEditInit}
                  onDelete={handleDeleteTransaction}
                />
              </div>
            )}

            {/* TAB 3: ANALYTICS */}
            {activeTab === 'analytics' && (
              <div id="analytics-tab-view">
                <AnalyticsCharts transactions={transactions} />
              </div>
            )}

            {/* TAB 4: AI INSIGHTS */}
            {activeTab === 'insights' && (
              <div id="insights-tab-view">
                <SpendingInsights transactions={transactions} />
              </div>
            )}

            {/* TAB 5: SETTINGS */}
            {activeTab === 'settings' && (
              <div id="settings-tab-view" className="space-y-6 max-w-xl mx-auto">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h2>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                    Manage your database states, exports, and profile credentials.
                  </p>
                </div>

                {/* Profile Card */}
                <div className="rounded-3xl bg-white dark:bg-white/3 border border-slate-100 dark:border-white/5 backdrop-blur-md p-6 flex items-center gap-4">
                  <div className="h-14 w-14 bg-violet-100 dark:bg-violet-900/50 rounded-full flex items-center justify-center text-violet-600 dark:text-violet-400 font-extrabold text-lg shadow-sm border border-violet-500/10">
                    DS
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      Dhanush Suresh
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400">Intern</span>
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-zinc-500">dhanush.suresh091@gmail.com</p>
                  </div>
                </div>

                {/* Configurations Card */}
                <div className="rounded-3xl bg-white dark:bg-white/3 border border-slate-100 dark:border-white/5 backdrop-blur-md p-6 space-y-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Database Tools</h4>

                  <div className="grid grid-cols-1 gap-4">
                    {/* CSV Download tool */}
                    <div className="flex justify-between items-center gap-4 p-3 bg-slate-50 dark:bg-white/3 rounded-2xl border border-slate-100 dark:border-white/5">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1">
                          <FileDown className="h-4 w-4 text-slate-500" />
                          Export to CSV sheet
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Download transaction reports directly to your local files.</p>
                      </div>
                      <button
                        id="export-csv-btn"
                        onClick={exportToCSV}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold rounded-xl shadow-md cursor-pointer outline-none transition-colors"
                      >
                        Download CSV
                      </button>
                    </div>

                    {/* Re-seed mock database */}
                    <div className="flex justify-between items-center gap-4 p-3 bg-slate-50 dark:bg-white/3 rounded-2xl border border-slate-100 dark:border-white/5">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1">
                          <RefreshCw className="h-4 w-4 text-slate-500" />
                          Restore default data
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Resets the database and restores June 2026 pre-populated logs.</p>
                      </div>
                      <button
                        id="reset-db-btn"
                        onClick={resetToSeed}
                        className="px-4 py-2 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 text-[10px] font-bold rounded-xl cursor-pointer outline-none transition-colors"
                      >
                        Restore Seed
                      </button>
                    </div>

                    {/* Wipe database to test empty state */}
                    <div className="flex justify-between items-center gap-4 p-3 bg-slate-50 dark:bg-white/3 rounded-2xl border border-slate-100 dark:border-white/5">
                      <div>
                        <p className="text-xs font-bold text-slate-850 dark:text-rose-400 flex items-center gap-1">
                          <Trash2 className="h-4 w-4 text-rose-500" />
                          Wipe transaction logs
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Clear all entries to test clean layouts and blank analytics.</p>
                      </div>
                      <button
                        id="wipe-db-btn"
                        onClick={clearDatabase}
                        className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/15 text-rose-600 text-[10px] font-bold rounded-xl cursor-pointer outline-none transition-colors"
                      >
                        Wipe Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* GLOBAL TOAST BANNER */}
      <AnimatePresence>
        {toast && (
          <motion.div
            id="global-toast"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 rounded-2xl bg-slate-900/90 dark:bg-zinc-950/90 backdrop-blur-md border border-slate-800 dark:border-zinc-800 text-white px-4 py-3 shadow-xl flex items-center justify-between gap-4 max-w-sm"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <p className="text-xs font-semibold leading-normal">{toast.message}</p>
            </div>
            {toast.actionLabel && toast.onAction && (
              <button
                id="toast-action-btn"
                onClick={() => {
                  toast.onAction?.();
                  setToast(null);
                }}
                className="px-2.5 py-1 bg-white/15 hover:bg-white/20 active:bg-white/10 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer outline-none"
              >
                <Undo2 className="h-3 w-3" />
                {toast.actionLabel}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* DIALOG SHEET MODAL */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditTransaction(null);
        }}
        onSave={handleSaveTransaction}
        editTransaction={editTransaction}
      />
    </div>
  );
}
