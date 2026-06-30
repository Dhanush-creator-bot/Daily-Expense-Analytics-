/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  note: string;
  createdAt: string;
}

export interface Category {
  name: string;
  type: TransactionType;
  iconName: string; // Refers to Lucide Icon name
  color: string;     // Tailwind text/icon color class (e.g. 'text-emerald-500')
  bgColor: string;   // Tailwind bg color class (e.g. 'bg-emerald-500/10')
  borderColor: string; // Tailwind border class (e.g. 'border-emerald-500/20')
  accentColor: string; // Raw Hex or clean tailwind color for graphs (e.g. '#10b981')
}

export interface DailyTotal {
  date: string;
  income: number;
  expense: number;
}

export type TimeFilter = 'week' | 'month' | 'year' | 'custom';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface AIInsight {
  headline: string;
  recommendation: string;
  severity: 'low' | 'medium' | 'high';
  category?: string;
}

export interface AIResponse {
  summary: string;
  insights: AIInsight[];
  savingsPotential: number;
}
