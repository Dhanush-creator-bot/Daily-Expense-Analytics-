/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Edit3, DollarSign, ChevronDown } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { CATEGORIES } from '../data';
import CategoryIcon from './CategoryIcon';
import confetti from 'canvas-confetti';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => void;
  editTransaction?: Transaction | null;
}

export default function TransactionModal({
  isOpen,
  onClose,
  onSave,
  editTransaction,
}: TransactionModalProps) {
  const isEditing = !!editTransaction;

  // Form states
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // Dropdown UI states
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset/populate form when modal opens or editing transaction changes
  useEffect(() => {
    if (isOpen) {
      if (editTransaction) {
        setType(editTransaction.type);
        setAmount(editTransaction.amount.toString());
        setCategory(editTransaction.category);
        setDate(editTransaction.date);
        setNote(editTransaction.note);
      } else {
        // Reset to defaults
        setType('expense');
        setAmount('');
        setCategory('');
        setDate(new Date().toISOString().split('T')[0]);
        setNote('');
      }
      setErrors({});
    }
  }, [isOpen, editTransaction]);

  // Adjust category when transaction type toggles
  useEffect(() => {
    // If current category doesn't match the active type, reset it
    if (category) {
      const selectedCat = CATEGORIES[category];
      const isIncomeCategory = category === 'Salary' || category === 'Freelance' || category === 'Investment' || category === 'Gift' || category === 'Income Others';
      const isTypeMismatch = 
        (type === 'income' && !isIncomeCategory) || 
        (type === 'expense' && isIncomeCategory);

      if (isTypeMismatch) {
        setCategory('');
      }
    }
  }, [type]);

  // Click outside custom dropdown to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter categories by type
  const availableCategories = Object.values(CATEGORIES).filter((cat) => {
    if (type === 'income') {
      return cat.type === 'income';
    } else {
      return cat.type === 'expense';
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0.';
    }

    if (!category) {
      newErrors.category = 'Please select a category.';
    }

    if (!date) {
      newErrors.date = 'Please select a date.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Save transaction
    onSave({
      ...(editTransaction && { id: editTransaction.id }),
      type,
      amount: numericAmount,
      category,
      date,
      note,
    });

    // Trigger delightful success confetti
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: type === 'income' ? ['#10b981', '#34d399', '#8b5cf6'] : ['#f43f5e', '#ec4899', '#8b5cf6'],
    });

    onClose();
  };

  const selectedCategoryObj = CATEGORIES[category];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <motion.div
            id="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md"
          ></motion.div>

          {/* Modal Container */}
          <motion.div
            id="modal-container"
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-zinc-950 shadow-2xl border border-slate-100 dark:border-white/5 p-6 z-10"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-violet-500" />
                {isEditing ? 'Edit Transaction' : 'Add Transaction'}
              </h3>
              <button
                id="modal-close-btn"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Type toggle */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Transaction Type
                </label>
                <div className="relative flex p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl">
                  {/* Sliding selection background */}
                  <motion.div
                    className={`absolute top-1.5 bottom-1.5 rounded-xl shadow-xs transition-colors ${
                      type === 'income' ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-rose-500 dark:bg-rose-600'
                    }`}
                    layoutId="activeTypeBg"
                    style={{
                      width: 'calc(50% - 12px)',
                      left: type === 'income' ? '6px' : 'calc(50% + 6px)',
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  />

                  {/* Income Tab */}
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`relative z-10 w-1/2 py-2.5 text-sm font-semibold rounded-xl text-center transition-colors cursor-pointer outline-none ${
                      type === 'income' ? 'text-white' : 'text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    Income
                  </button>

                  {/* Expense Tab */}
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`relative z-10 w-1/2 py-2.5 text-sm font-semibold rounded-xl text-center transition-colors cursor-pointer outline-none ${
                      type === 'expense' ? 'text-white' : 'text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    Expense
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Amount (USD)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-slate-400 dark:text-zinc-500" />
                  </div>
                  <input
                    id="amount-input"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/3 border text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 font-medium text-lg outline-none focus:ring-2 focus:ring-violet-500/30 transition-all ${
                      errors.amount
                        ? 'border-rose-400 dark:border-rose-500/50'
                        : 'border-slate-200 dark:border-white/5 focus:border-violet-500 dark:focus:border-violet-500'
                    }`}
                  />
                </div>
                {errors.amount && <p className="text-xs text-rose-500 font-medium">{errors.amount}</p>}
              </div>

              {/* Custom Category Dropdown */}
              <div className="space-y-1.5" ref={dropdownRef}>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Category
                </label>
                <div className="relative">
                  <button
                    id="category-dropdown-trigger"
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/3 border text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/30 transition-all ${
                      errors.category
                        ? 'border-rose-400 dark:border-rose-500/50'
                        : 'border-slate-200 dark:border-white/5'
                    }`}
                  >
                    {selectedCategoryObj ? (
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${selectedCategoryObj.bgColor}`}>
                          <CategoryIcon name={selectedCategoryObj.iconName} className={selectedCategoryObj.color} size={18} />
                        </div>
                        <span className="font-medium text-sm text-slate-800 dark:text-zinc-200">{selectedCategoryObj.name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-zinc-500 text-sm font-medium">Select a Category</span>
                    )}
                    <ChevronDown className={`h-4 w-4 text-slate-500 dark:text-zinc-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Options */}
                  <AnimatePresence>
                    {isCategoryDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute w-full mt-1.5 max-h-52 overflow-y-auto rounded-2xl bg-white dark:bg-zinc-950 border border-slate-100 dark:border-white/5 shadow-xl z-20"
                      >
                        <div className="p-1.5 space-y-1">
                          {availableCategories.map((cat) => {
                            // Predefined key mapping
                            const categoryKey = type === 'income' && cat.name === 'Others' ? 'Income Others' : (type === 'expense' && cat.name === 'Others' ? 'Expense Others' : cat.name);
                            return (
                              <button
                                key={categoryKey}
                                type="button"
                                onClick={() => {
                                  setCategory(categoryKey);
                                  setIsCategoryDropdownOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-colors cursor-pointer ${
                                  category === categoryKey
                                    ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400'
                                    : 'hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-700 dark:text-zinc-300'
                                }`}
                              >
                                <div className={`p-1.5 rounded-lg ${cat.bgColor}`}>
                                  <CategoryIcon name={cat.iconName} className={cat.color} size={16} />
                                </div>
                                <span>{cat.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {errors.category && <p className="text-xs text-rose-500 font-medium">{errors.category}</p>}
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-slate-400 dark:text-zinc-500" />
                  </div>
                  <input
                    id="date-input"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/3 border text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 font-medium text-sm outline-none focus:ring-2 focus:ring-violet-500/30 transition-all ${
                      errors.date
                        ? 'border-rose-400 dark:border-rose-500/50'
                        : 'border-slate-200 dark:border-white/5 focus:border-violet-500 dark:focus:border-violet-500'
                    }`}
                  />
                </div>
                {errors.date && <p className="text-xs text-rose-500 font-medium">{errors.date}</p>}
              </div>

              {/* Note (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Note (Optional)
                </label>
                <input
                  id="note-input"
                  type="text"
                  placeholder="e.g. Lunch with team or consulting client billing"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 font-medium text-sm outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 dark:focus:border-violet-500 transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  id="modal-cancel-btn"
                  onClick={onClose}
                  className="w-1/2 py-3 rounded-2xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-zinc-850 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-slate-500/25"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="modal-submit-btn"
                  className={`w-1/2 py-3 rounded-2xl text-white font-semibold text-sm shadow-md transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-violet-500/40 ${
                    type === 'income'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/10'
                      : 'bg-violet-600 hover:bg-violet-500 shadow-violet-500/10'
                  }`}
                >
                  {isEditing ? 'Save Changes' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
