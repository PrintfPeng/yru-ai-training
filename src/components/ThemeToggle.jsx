import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Reusable icon-only theme toggle. Drop into any header.
 * `variant="ghost"` (default) blends with dark chrome, `variant="solid"` for light bg.
 */
export default function ThemeToggle({ variant = 'ghost', className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const base = 'p-2 rounded-full transition-colors';
  const styles = variant === 'solid'
    ? 'bg-slate-100 hover:bg-slate-200 dark:bg-yrugray-800 dark:hover:bg-yrugray-700 text-slate-600 dark:text-yrugray-300'
    : 'hover:bg-slate-100 dark:hover:bg-yrugray-800 text-slate-500 dark:text-yrugray-400 hover:text-slate-700 dark:hover:text-white';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'โหมดกลางวัน' : 'โหมดกลางคืน'}
      className={`${base} ${styles} ${className}`}
    >
      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
