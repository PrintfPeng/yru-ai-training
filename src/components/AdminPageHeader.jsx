import React from 'react';

/**
 * Shared page header for admin dashboard sections. A soft card with a gradient
 * icon tile, a two-line title/description block and an actions slot.
 *
 * Responsive: on mobile the actions drop below the title and stretch to full
 * width (each direct child flexes evenly); from `sm` up they sit on the right.
 *
 * Props:
 *   icon        — lucide icon component (e.g. BookOpen), not an element
 *   title       — page title
 *   description — muted line under the title (string or node)
 *   actions     — buttons/links rendered on the right
 */
export default function AdminPageHeader({ icon: Icon, title, description, actions }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-yrugray-800 bg-white dark:bg-yrugray-900 shadow-2xs">
      {/* Decorative accents */}
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-yrupink-400 to-yrupink-700" />
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-yrupink-500/10 dark:bg-yrupink-500/15 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 pl-5 sm:pl-6">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
          {Icon && (
            <div className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-yrupink-400 to-yrupink-700 flex items-center justify-center text-white shadow-lg shadow-yrupink-500/25">
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight break-words">
              {title}
            </h2>
            {description && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-yrugray-400 mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 [&>*]:flex-1 sm:[&>*]:flex-none [&>*]:justify-center">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
