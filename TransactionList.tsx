/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ArrowUpDown, Trash2, Edit2, Info, RefreshCw } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { CATEGORIES } from '../data';
import CategoryIcon from './CategoryIcon';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export default function TransactionList({
  transactions,
  onEdit,
  onDelete,
}: TransactionListProps) {
  // Filters & Sorting state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // Reset filters
  const resetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setSortBy('date-desc');
  };

  // Pre-filter category options depending on type
  const categoryOptions = useMemo(() => {
    const list = Object.values(CATEGORIES);
    if (typeFilter !== 'all') {
      return list.filter((cat) => cat.type === typeFilter);
    }
    return list;
  }, [typeFilter]);

  // Apply search, filters, and sorting
  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    // Search
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.note.toLowerCase().includes(s) ||
          t.category.toLowerCase().includes(s)
      );
    }

    // Type Filter
    if (typeFilter !== 'all') {
      result = result.filter((t) => t.type === typeFilter);
    }

    // Category Filter
    if (categoryFilter !== 'all') {
      result = result.filter((t) => {
        // Normalise name lookup
        const catKey = t.type === 'income' && t.category === 'Others' ? 'Income Others' : (t.type === 'expense' && t.category === 'Others' ? 'Expense Others' : t.category);
        return t.category === categoryFilter || catKey === categoryFilter;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt.localeCompare(a.createdAt);
      }
      if (sortBy === 'date-asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime() || a.createdAt.localeCompare(b.createdAt);
      }
      if (sortBy === 'amount-desc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amount-asc') {
        return a.amount - b.amount;
      }
      return 0;
    });

    return result;
  }, [transactions, search, typeFilter, categoryFilter, sortBy]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};

    filteredAndSortedTransactions.forEach((t) => {
      const dateStr = t.date;
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(t);
    });

    return groups;
  }, [filteredAndSortedTransactions]);

  // Human friendly date header renderer
  const formatGroupHeader = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dateStr === today) {
      return 'Today';
    }
    if (dateStr === yesterday) {
      return 'Yesterday';
    }

    // Format like "June 28, 2026"
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6" id="transaction-history-section">
      {/* Search and Filters Bar */}
      <div className="rounded-3xl bg-white dark:bg-white/3 border border-slate-100 dark:border-white/5 p-5 shadow-xs space-y-4 backdrop-blur-md">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
            <input
              id="tx-search-input"
              type="text"
              placeholder="Search by notes or categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/3 border border-slate-100 dark:border-white/5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:focus:border-violet-500 transition-all"
            />
          </div>

          {/* Type Filter Pill row */}
          <div className="flex bg-slate-50 dark:bg-white/3 p-1 rounded-2xl border border-slate-100 dark:border-white/5 self-start md:self-auto">
            <button
              id="filter-type-all"
              onClick={() => {
                setTypeFilter('all');
                setCategoryFilter('all');
              }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-white/10 shadow-xs text-violet-600 dark:text-violet-400'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              All
            </button>
            <button
              id="filter-type-income"
              onClick={() => {
                setTypeFilter('income');
                setCategoryFilter('all');
              }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                typeFilter === 'income'
                  ? 'bg-white dark:bg-white/10 shadow-xs text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              Income
            </button>
            <button
              id="filter-type-expense"
              onClick={() => {
                setTypeFilter('expense');
                setCategoryFilter('all');
              }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                typeFilter === 'expense'
                  ? 'bg-white dark:bg-white/10 shadow-xs text-rose-600 dark:text-rose-400'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              Expense
            </button>
          </div>
        </div>

        {/* Category & Sorting Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-50 dark:border-white/5 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Select */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
              <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Category:</span>
              <select
                id="tx-category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 dark:bg-white/3 text-xs font-semibold text-slate-700 dark:text-zinc-300 py-1.5 pl-2 pr-6 rounded-xl border border-slate-100 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%20fill%3Dnone%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2520stroke-linejoin%253D%2522round%2522%2F%3E%3C%2Fsvg%3E')] bg-[position:right_4px_center] bg-[size:16px] bg-no-repeat"
              >
                <option value="all">All Categories</option>
                {categoryOptions.map((cat) => {
                  const key = cat.type === 'income' && cat.name === 'Others' ? 'Income Others' : (cat.type === 'expense' && cat.name === 'Others' ? 'Expense Others' : cat.name);
                  return (
                    <option key={key} value={key}>
                      {cat.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
              <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Sort By:</span>
              <select
                id="tx-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-slate-50 dark:bg-white/3 text-xs font-semibold text-slate-700 dark:text-zinc-300 py-1.5 pl-2 pr-6 rounded-xl border border-slate-100 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%20fill%3Dnone%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2520stroke-linejoin%253D%2522round%2522%2F%3E%3C%2Fsvg%3E')] bg-[position:right_4px_center] bg-[size:16px] bg-no-repeat"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
              </select>
            </div>
          </div>

          {/* Reset Filters CTA */}
          {(search || typeFilter !== 'all' || categoryFilter !== 'all' || sortBy !== 'date-desc') && (
            <button
              id="reset-filters-btn"
              onClick={resetFilters}
              className="text-xs text-violet-500 hover:text-violet-600 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3 animate-spin-hover" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Grouped Transactions List */}
      <div className="space-y-6">
        {Object.keys(groupedTransactions).length === 0 ? (
          <div className="rounded-3xl bg-slate-50 dark:bg-white/3 border border-slate-100 dark:border-white/5 p-12 text-center flex flex-col items-center justify-center backdrop-blur-md">
            <div className="h-14 w-14 bg-violet-50 dark:bg-violet-500/10 rounded-full flex items-center justify-center text-violet-600 dark:text-violet-400 mb-4 border border-violet-500/10">
              <Info className="h-6 w-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">No transactions found</h4>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1.5 max-w-sm">
              We couldn't find any entries matching your filters. Try adjusting your search query or reset your filters above.
            </p>
          </div>
        ) : (
          Object.keys(groupedTransactions)
            .sort((a, b) => b.localeCompare(a)) // Sort dates descending
            .map((dateStr) => (
              <div key={dateStr} className="space-y-3" id={`group-date-${dateStr}`}>
                {/* Date header */}
                <h4 className="sticky top-0 z-10 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-950 py-2">
                  {formatGroupHeader(dateStr)}
                </h4>

                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {groupedTransactions[dateStr].map((tx) => {
                      // Normalise key
                      const catKey = tx.type === 'income' && tx.category === 'Others' ? 'Income Others' : (tx.type === 'expense' && tx.category === 'Others' ? 'Expense Others' : tx.category);
                      const cat = CATEGORIES[catKey];

                      return (
                        <motion.div
                          key={tx.id}
                          layout
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: 15 }}
                          transition={{ type: 'spring', duration: 0.4 }}
                          className="group relative overflow-hidden rounded-2xl bg-white dark:bg-white/3 border border-slate-100 dark:border-white/5 p-4 flex items-center justify-between gap-4 transition-all duration-300 hover:shadow-md dark:hover:border-white/10"
                        >
                          {/* Info Column */}
                          <div className="flex items-center gap-3.5">
                            {/* Icon circle */}
                            <div className={`p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-105 ${cat?.bgColor || 'bg-slate-100 dark:bg-zinc-800'}`}>
                              <CategoryIcon
                                name={cat?.iconName || 'HelpCircle'}
                                className={cat?.color || 'text-slate-500'}
                                size={18}
                              />
                            </div>

                            {/* Details */}
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {tx.note || cat?.name || tx.category}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${cat?.bgColor} ${cat?.color}`}>
                                  {cat?.name || tx.category}
                                </span>
                                {tx.note && (
                                  <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                                    {cat?.name || tx.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Pricing & Actions Column */}
                          <div className="flex items-center gap-4">
                            {/* Value */}
                            <div className="text-right">
                              <span className={`text-base font-bold ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                                {new Date(tx.createdAt).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>

                            {/* Action Buttons (visible on hover/active group) */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-250 pr-1">
                              <button
                                id={`tx-edit-${tx.id}`}
                                onClick={() => onEdit(tx)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer outline-none"
                                title="Edit entry"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                id={`tx-delete-${tx.id}`}
                                onClick={() => onDelete(tx.id)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer outline-none"
                                title="Delete entry"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
