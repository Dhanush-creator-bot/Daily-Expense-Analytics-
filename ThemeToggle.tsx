/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export default function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <button
      id="theme-toggle-btn"
      onClick={onToggle}
      className="relative p-2 rounded-xl transition-all duration-300 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-transparent dark:border-white/5 text-slate-700 dark:text-zinc-300 outline-none focus:ring-2 focus:ring-violet-500/50"
      aria-label="Toggle dark/light mode"
    >
      <motion.div
        animate={{ rotate: isDark ? 360 : 0, scale: isDark ? 0 : 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className={isDark ? 'absolute inset-0 m-auto h-5 w-5 opacity-0' : 'h-5 w-5'}
      >
        <Sun className="h-5 w-5 text-amber-500" />
      </motion.div>
      <motion.div
        animate={{ rotate: isDark ? 0 : -360, scale: isDark ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className={isDark ? 'h-5 w-5' : 'absolute inset-0 m-auto h-5 w-5 opacity-0'}
      >
        <Moon className="h-5 w-5 text-violet-400" />
      </motion.div>
    </button>
  );
}
