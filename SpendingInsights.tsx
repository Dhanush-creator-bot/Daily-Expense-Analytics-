/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, BrainCircuit, ShieldAlert, CheckCircle2, DollarSign, RefreshCw, Lightbulb, HelpCircle, ArrowRight } from 'lucide-react';
import { Transaction, AIResponse, AIInsight } from '../types';

interface SpendingInsightsProps {
  transactions: Transaction[];
}

export default function SpendingInsights({ transactions }: SpendingInsightsProps) {
  const [data, setData] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  const fetchInsights = async (force = false) => {
    if (transactions.length === 0) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsApiKeyMissing(false);

    try {
      const response = await fetch('/api/ai/spending-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error && result.error.includes('GEMINI_API_KEY')) {
          setIsApiKeyMissing(true);
          throw new Error('Gemini API key is not configured.');
        }
        throw new Error(result.error || 'Failed to generate insights.');
      }

      setData(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while analyzing your transactions.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch insights on mount if we have transactions and haven't loaded them yet
  useEffect(() => {
    if (transactions.length > 0 && !data && !isLoading && !error && !isApiKeyMissing) {
      fetchInsights();
    }
  }, [transactions]);

  // Render Shimmer Skeleton
  const RenderSkeleton = () => (
    <div className="space-y-6" id="shimmer-loader">
      {/* Summary card skeleton */}
      <div className="rounded-3xl bg-white dark:bg-white/3 border border-slate-100 dark:border-white/5 p-6 space-y-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-slate-100 dark:bg-white/10 rounded-full animate-pulse"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-slate-100 dark:bg-white/10 rounded-md w-1/4 animate-pulse"></div>
            <div className="h-3 bg-slate-100 dark:bg-white/10 rounded-md w-1/3 animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-3 bg-slate-100 dark:bg-white/10 rounded-md w-full animate-pulse"></div>
          <div className="h-3 bg-slate-100 dark:bg-white/10 rounded-md w-11/12 animate-pulse"></div>
          <div className="h-3 bg-slate-100 dark:bg-white/10 rounded-md w-4/5 animate-pulse"></div>
        </div>
      </div>

      {/* Progress Card skeleton */}
      <div className="rounded-3xl bg-white dark:bg-white/3 border border-slate-100 dark:border-white/5 p-6 space-y-3 backdrop-blur-md">
        <div className="h-4 bg-slate-100 dark:bg-white/10 rounded-md w-1/3 animate-pulse"></div>
        <div className="h-8 bg-slate-100 dark:bg-white/10 rounded-md w-1/4 animate-pulse"></div>
        <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full w-full animate-pulse"></div>
      </div>

      {/* Insight lists skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-3xl bg-white dark:bg-white/3 border border-slate-100 dark:border-white/5 p-5 space-y-4 backdrop-blur-md">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-slate-100 dark:bg-white/10 rounded-md w-1/3 animate-pulse"></div>
              <div className="h-5 bg-slate-100 dark:bg-white/10 rounded-full w-12 animate-pulse"></div>
            </div>
            <div className="h-16 bg-slate-100 dark:bg-white/10 rounded-2xl w-full animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );

  // If API Key is missing
  if (isApiKeyMissing) {
    return (
      <div className="rounded-3xl bg-white dark:bg-white/3 border border-amber-200 dark:border-amber-500/20 p-8 text-center max-w-xl mx-auto space-y-6 backdrop-blur-md" id="api-key-missing-view">
        <div className="h-16 w-16 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mx-auto border border-amber-500/10">
          <BrainCircuit className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Activate AI Spending Insights</h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
            This dashboard includes an elite financial advisor powered by <strong>Gemini 3.5-flash</strong> that analyzes transaction history, reveals hidden leak categories, and provides tailored budgets.
          </p>
        </div>

        <div className="rounded-2xl bg-amber-500/5 border border-amber-500/10 p-4 text-left space-y-2">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4" />
            Integration Instructions
          </p>
          <ol className="text-xs text-amber-800 dark:text-zinc-400 list-decimal list-inside space-y-1">
            <li>Go to the <strong>Settings</strong> panel in Google AI Studio.</li>
            <li>Click on <strong>Secrets</strong>.</li>
            <li>Add your <code>GEMINI_API_KEY</code>.</li>
            <li>Refresh this tab and click the button below to fetch live analytics!</li>
          </ol>
        </div>

        <button
          id="retry-fetch-insights"
          onClick={() => fetchInsights()}
          className="px-6 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/10 transition-colors inline-flex items-center gap-2 cursor-pointer outline-none"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Connection
        </button>
      </div>
    );
  }

  // If no transactions yet
  if (transactions.length === 0) {
    return (
      <div className="rounded-3xl bg-slate-50 dark:bg-white/3 border border-slate-100 dark:border-white/5 p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto backdrop-blur-md" id="no-tx-insights-view">
        <div className="h-14 w-14 bg-violet-50 dark:bg-violet-500/10 rounded-full flex items-center justify-center text-violet-600 dark:text-violet-400 mb-4 border border-violet-500/10">
          <HelpCircle className="h-6 w-6" />
        </div>
        <h4 className="text-base font-bold text-slate-900 dark:text-white">Waiting for transaction data</h4>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 max-w-sm">
          Please add some income and expense records using the floating add button first. Once you have logged some entries, the AI coach will build your spending audit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="ai-insights-tab-section">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            AI spending Insights
          </h2>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
            Personal wealth recommendations and overspend analysis compiled by Gemini.
          </p>
        </div>

        <button
          id="regenerate-ai-insights-btn"
          onClick={() => fetchInsights(true)}
          disabled={isLoading}
          className="px-5 py-2.5 rounded-2xl bg-white dark:bg-white/3 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-800 dark:text-zinc-200 text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          {data ? 'Regenerate Analysis' : 'Generate Audit'}
        </button>
      </div>

      {/* Loading state */}
      {isLoading && <RenderSkeleton />}

      {/* Error state */}
      {error && !isLoading && (
        <div className="rounded-3xl bg-rose-500/5 border border-rose-500/10 p-5 text-center text-xs text-rose-500 font-semibold" id="insights-error-banner">
          {error}
        </div>
      )}

      {/* Main Content Render */}
      {!isLoading && !error && data && (
        <div className="space-y-6" id="ai-insights-results">
          {/* Summary Card */}
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-violet-50/30 via-white dark:via-zinc-950/40 to-indigo-50/30 dark:from-zinc-900/50 dark:to-zinc-850 border border-violet-100/30 dark:border-white/5 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center backdrop-blur-md">
            {/* Background blur */}
            <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-violet-500/10 blur-xl"></div>

            <div className="p-4 bg-violet-600/10 rounded-2xl shrink-0">
              <BrainCircuit className="h-8 w-8 text-violet-600 dark:text-violet-400 animate-pulse" />
            </div>

            <div className="space-y-2 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">Gemini Financial Coach Summary</span>
              <p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-zinc-300">
                "{data.summary}"
              </p>
            </div>
          </div>

          {/* Savings Potential Progress bar */}
          <div className="rounded-3xl bg-white dark:bg-white/3 border border-slate-100 dark:border-white/5 p-6 flex flex-col md:flex-row justify-between gap-6 backdrop-blur-md">
            <div className="space-y-2 flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Estimated Monthly Savings Potential</h4>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-emerald-500">${data.savingsPotential}</span>
                <span className="text-xs font-semibold text-slate-400">/ month</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md">
                By optimizing leak categories and enforcing the recommendations below, you could secure this amount back into your wealth portfolios.
              </p>
            </div>

            {/* Visual Gauge */}
            <div className="w-full md:w-56 flex flex-col justify-center space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-zinc-400">
                <span>Savings Efficiency</span>
                <span className="text-emerald-500">High Impact</span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-zinc-850 rounded-full overflow-hidden border border-slate-100 dark:border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '68%' }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full"
                ></motion.div>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold text-right">Based on transactional analysis</span>
            </div>
          </div>

          {/* Insight Cards List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Actionable wealth Recommendations</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="insight-cards-list-grid">
              {data.insights.map((insight: AIInsight, index: number) => {
                const isHigh = insight.severity === 'high';
                const isMed = insight.severity === 'medium';

                let severityColor = 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300';
                if (isHigh) severityColor = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10';
                if (isMed) severityColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10';

                return (
                  <div
                    key={index}
                    className="rounded-3xl bg-white dark:bg-white/3 border border-slate-100 dark:border-white/5 p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-md dark:hover:border-white/10 backdrop-blur-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500 dark:text-violet-400">Recommendation {index + 1}</span>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{insight.headline}</h4>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${severityColor}`}>
                        {insight.severity} Priority
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-slate-500 dark:text-zinc-400 mt-4 font-medium flex items-start gap-2">
                      <Lightbulb className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                      {insight.recommendation}
                    </p>

                    <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-slate-50 dark:border-white/5 text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:text-violet-500 cursor-pointer">
                      <span>Explore this category</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Manual Start CTA if not loaded */}
      {!data && !isLoading && !error && (
        <div className="rounded-3xl bg-linear-to-br from-violet-600 to-indigo-700 p-8 text-white text-center max-w-xl mx-auto space-y-6 shadow-xl shadow-violet-600/10 backdrop-blur-md" id="manual-audit-cta-card">
          <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mx-auto border border-white/10">
            <BrainCircuit className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">Conduct a Wealth audit with Gemini</h3>
            <p className="text-sm text-violet-100 leading-relaxed max-w-md mx-auto">
              Our Gemini-powered financial engine will analyze your log pattern, flag structural overheads, and outline a custom monthly savings road map.
            </p>
          </div>
          <button
            id="start-audit-btn"
            onClick={() => fetchInsights()}
            className="px-6 py-3 rounded-2xl bg-white hover:bg-violet-50 text-violet-600 text-xs font-bold transition-all shadow-md cursor-pointer outline-none focus:ring-2 focus:ring-white/50"
          >
            Start Complete Audit
          </button>
        </div>
      )}
    </div>
  );
}
