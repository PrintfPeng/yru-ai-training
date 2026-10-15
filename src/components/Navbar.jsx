import React, { useState, useEffect } from 'react';
import {
  Menu, X, Lock, LayoutDashboard,
  Home, GraduationCap, Award, LayoutGrid, Mail,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

/**
 * Shared public site navbar — used on every non-admin page (home, training,
 * and the QR trainee flow). Navigation is delegated to the parent via
 * `onNavigate(target[, hash])` because the app routes through App-level state,
 * not a router.
 *
 * Props:
 *   onNavigate(target, hash?) — target: 'home' | 'training' | 'admin'
 *   isAdmin   — toggles the login button into a "dashboard" button
 *   active    — 'home' | 'training' | null : highlights the current link
 */
const NAV_LINKS = [
  { key: 'home', label: 'หน้าแรก', target: 'home', Icon: Home },
  { key: 'training', label: 'หลักสูตรอบรม', target: 'training', Icon: GraduationCap },
  { key: 'certificates', label: 'รับเกียรติบัตร', target: 'certificates', Icon: Award },
  { key: 'features', label: 'บริการ', target: 'services', Icon: LayoutGrid },
  { key: 'contact', label: 'ติดต่อเรา', target: 'contact', Icon: Mail },
];

export default function Navbar({ onNavigate, isAdmin = false, active = null }) {
  const [open, setOpen] = useState(false);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const go = (link) => {
    setOpen(false);
    onNavigate?.(link.target, link.hash);
  };

  const goAdmin = () => {
    setOpen(false);
    onNavigate?.('admin');
  };

  const Brand = (
    <button
      type="button"
      onClick={() => go({ target: 'home' })}
      className="flex items-center gap-2 group shrink-0"
      aria-label="กลับหน้าแรก"
    >
      <div className="w-8 h-8 bg-gradient-to-br from-yrupink-400 to-yrupink-700 rounded-lg flex items-center justify-center font-bold text-white shadow-lg transition-transform duration-300 group-hover:scale-105">
        AI
      </div>
      <span className="font-bold text-xl tracking-wide text-gray-900 dark:text-white transition-colors duration-300">
        CENTER <span className="text-yrupink-400">YRU</span>
      </span>
    </button>
  );

  return (
    <header className="w-full sticky top-0 z-50 bg-white/80 dark:bg-yrugray-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-yrugray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {Brand}

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {NAV_LINKS.map((link) => {
            const isActive = active && link.key === active;
            return (
              <button
                key={link.key}
                type="button"
                onClick={() => go(link)}
                className={`px-3.5 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5 ${
                  isActive
                    ? 'text-yrupink-600 dark:text-yrupink-400 bg-yrupink-500/10'
                    : 'text-slate-600 dark:text-yrugray-300 hover:text-yrupink-600 dark:hover:text-yrupink-400 hover:bg-slate-100 dark:hover:bg-yrugray-800'
                }`}
              >
                {link.Icon && <link.Icon className="w-4 h-4" />}
                {link.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle variant="solid" className="hidden sm:inline-flex" />

          {/* Admin login / dashboard — desktop */}
          <button
            onClick={goAdmin}
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-yrupink-600 hover:bg-yrupink-500 shadow-md shadow-yrupink-500/20 transition-all"
          >
            {isAdmin ? <LayoutDashboard className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {isAdmin ? 'แดชบอร์ด' : 'เข้าสู่ระบบผู้ดูแล'}
          </button>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'ปิดเมนู' : 'เปิดเมนู'}
            aria-expanded={open}
            className="md:hidden p-2 rounded-lg text-slate-700 dark:text-yrugray-200 hover:bg-slate-100 dark:hover:bg-yrugray-800 transition-colors"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 top-16 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setOpen(false)}
          />
          <nav className="md:hidden absolute top-16 inset-x-0 z-50 bg-white dark:bg-yrugray-900 border-b border-slate-200 dark:border-yrugray-800 shadow-xl px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = active && link.key === active;
              return (
                <button
                  key={link.key}
                  type="button"
                  onClick={() => go(link)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors inline-flex items-center gap-2.5 ${
                    isActive
                      ? 'text-yrupink-600 dark:text-yrupink-400 bg-yrupink-500/10'
                      : 'text-slate-700 dark:text-yrugray-200 hover:bg-slate-100 dark:hover:bg-yrugray-800'
                  }`}
                >
                  {link.Icon && <link.Icon className="w-5 h-5 shrink-0" />}
                  {link.label}
                </button>
              );
            })}

            <div className="flex items-center justify-between gap-3 mt-2 pt-3 border-t border-slate-200 dark:border-yrugray-800">
              <button
                onClick={goAdmin}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-yrupink-600 hover:bg-yrupink-500 shadow-md shadow-yrupink-500/20 transition-all"
              >
                {isAdmin ? <LayoutDashboard className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {isAdmin ? 'แดชบอร์ด' : 'เข้าสู่ระบบผู้ดูแล'}
              </button>
              <ThemeToggle variant="solid" />
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
