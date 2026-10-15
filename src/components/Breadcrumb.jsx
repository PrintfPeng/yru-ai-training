import React from 'react';
import { Home, ChevronRight } from 'lucide-react';

/**
 * Public-site breadcrumb trail. Shows where the current page sits in the site,
 * e.g. หน้าแรก › หลักสูตรอบรม › ชื่อหลักสูตร. Pass an array of items; each
 * item with an `onClick` renders as a link, the last item is the current page
 * (emphasized, non-clickable). The first item gets a small home icon.
 *
 * items: { label: string, onClick?: () => void }[]
 */
export default function Breadcrumb({ items = [], className = '' }) {
  if (!items.length) return null;
  return (
    <nav
      aria-label="breadcrumb"
      className={`flex items-center flex-wrap gap-1.5 text-sm min-w-0 ${className}`}
    >
      {items.map((item, i) => {
        const last = i === items.length - 1;
        const clickable = !last && typeof item.onClick === 'function';
        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-yrugray-600 shrink-0" />
            )}
            {clickable ? (
              <button
                type="button"
                onClick={item.onClick}
                className="inline-flex items-center gap-1 text-slate-500 dark:text-yrugray-400 hover:text-yrupink-600 dark:hover:text-yrupink-400 transition-colors truncate max-w-[30vw]"
              >
                {i === 0 && <Home className="w-3.5 h-3.5 shrink-0" />}
                <span className="truncate">{item.label}</span>
              </button>
            ) : (
              <span
                aria-current={last ? 'page' : undefined}
                className={`inline-flex items-center gap-1 truncate max-w-[45vw] ${
                  last
                    ? 'font-semibold text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-yrugray-400'
                }`}
              >
                {i === 0 && <Home className="w-3.5 h-3.5 shrink-0" />}
                <span className="truncate">{item.label}</span>
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
