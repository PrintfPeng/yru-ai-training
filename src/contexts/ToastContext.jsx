import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

// Global toast notifications. Rendered via a portal to document.body with a
// high z-index (z-[200]) so they float above sticky headers and admin modals
// (which use z-[100]). Each toast auto-dismisses after a few seconds.
const ToastContext = createContext({
  toast: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
});

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    ring: 'border-green-500/40',
    bar: 'bg-green-500',
    iconColor: 'text-green-500 dark:text-green-400',
  },
  error: {
    icon: XCircle,
    ring: 'border-red-500/40',
    bar: 'bg-red-500',
    iconColor: 'text-red-500 dark:text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    ring: 'border-amber-500/40',
    bar: 'bg-amber-500',
    iconColor: 'text-amber-500 dark:text-amber-400',
  },
  info: {
    icon: Info,
    ring: 'border-sky-500/40',
    bar: 'bg-sky-500',
    iconColor: 'text-sky-500 dark:text-sky-400',
  },
};

const DEFAULT_DURATION = 4500;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message, opts = {}) => {
    if (!message) return;
    const id = ++idRef.current;
    const variant = opts.variant || 'info';
    const duration = opts.duration ?? DEFAULT_DURATION;
    setToasts((prev) => [...prev, { id, message, title: opts.title, variant }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const api = {
    toast,
    success: useCallback((msg, opts) => toast(msg, { ...opts, variant: 'success' }), [toast]),
    error:   useCallback((msg, opts) => toast(msg, { ...opts, variant: 'error' }),   [toast]),
    warning: useCallback((msg, opts) => toast(msg, { ...opts, variant: 'warning' }), [toast]),
    info:    useCallback((msg, opts) => toast(msg, { ...opts, variant: 'info' }),    [toast]),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2.5 w-[min(92vw,380px)] pointer-events-none">
          {toasts.map((t) => (
            <ToastCard key={t.id} toast={t} onClose={() => dismiss(t.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

const ToastCard = ({ toast, onClose }) => {
  const v = VARIANTS[toast.variant] || VARIANTS.info;
  const Icon = v.icon;
  return (
    <div
      role="alert"
      className={`pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl border ${v.ring} bg-white dark:bg-yrugray-900 shadow-xl shadow-black/10 dark:shadow-black/40 px-4 py-3 animate-[toastIn_0.2s_ease-out]`}
    >
      <span className={`absolute left-0 top-0 h-full w-1 ${v.bar}`} />
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${v.iconColor}`} />
      <div className="min-w-0 flex-1">
        {toast.title && (
          <p className="text-[14px] font-semibold text-slate-900 dark:text-white leading-snug">{toast.title}</p>
        )}
        <p className="text-[14px] text-slate-700 dark:text-yrugray-200 leading-snug whitespace-pre-line break-words">
          {toast.message}
        </p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 -m-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
        aria-label="ปิด"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const useToast = () => useContext(ToastContext);
