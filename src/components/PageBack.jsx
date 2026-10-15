import React from 'react';
import { ArrowLeft } from 'lucide-react';

/**
 * Inline "back to previous screen" control meant to sit at the top of a page's
 * <main> content (not in the navbar). Keeps page-level back navigation close to
 * the content it returns from.
 */
export default function PageBack({ onClick, label = 'กลับสู่หน้าแรก', className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-yrugray-300 bg-white/70 dark:bg-yrugray-800/70 hover:bg-slate-100 dark:hover:bg-yrugray-700 border border-slate-200 dark:border-yrugray-700 shadow-2xs transition-colors ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}
