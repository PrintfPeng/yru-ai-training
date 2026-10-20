import React, { useEffect, useState } from 'react';
import { Check, Loader2, Tags } from 'lucide-react';
import { categoriesApi } from '../api';

/**
 * Multi-select chips for activity categories (หมวดหมู่). Loads every category
 * (hidden ones too, marked "ซ่อน") so admins can tag before publishing a
 * category.
 *
 * Props:
 *   value    — selected category ids (number[])
 *   onChange — (ids: number[]) => void
 */
export default function CategoryPicker({ value = [], onChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    categoriesApi.list({ all: 1 })
      .then((rows) => { if (!cancelled) setItems(Array.isArray(rows) ? rows : []); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const toggle = (id) => {
    onChange?.(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-yrugray-400 py-2">
        <Loader2 className="w-4 h-4 animate-spin" /> กำลังโหลดหมวดหมู่...
      </div>
    );
  }
  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400 py-2">โหลดหมวดหมู่ไม่สำเร็จ</p>;
  }
  if (!items.length) {
    return (
      <p className="text-sm text-slate-500 dark:text-yrugray-400 py-2 flex items-center gap-1.5">
        <Tags className="w-4 h-4" /> ยังไม่มีหมวดหมู่ — เพิ่มได้ที่เมนู "จัดการหมวดหมู่"
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((c) => {
        const on = value.includes(c.id);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => toggle(c.id)}
            aria-pressed={on}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
              on
                ? 'bg-yrupink-600 border-yrupink-600 text-white shadow-sm shadow-yrupink-600/20'
                : 'bg-white dark:bg-yrugray-800 border-slate-300 dark:border-yrugray-700 text-slate-700 dark:text-yrugray-200 hover:border-yrupink-500 hover:text-yrupink-600 dark:hover:text-yrupink-400'
            }`}
          >
            {on && <Check className="w-3.5 h-3.5" />}
            {c.name}
            {!c.is_active && <span className={`text-[10px] ${on ? 'text-white/80' : 'text-slate-400'}`}>(ซ่อน)</span>}
          </button>
        );
      })}
    </div>
  );
}
