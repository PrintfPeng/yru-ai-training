import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  AlertTriangle,
  XCircle,
  Tags,
  Type,
  AlignLeft,
  Link2,
  Copy,
  Check,
  ExternalLink,
  GripVertical,
  Eye,
  EyeOff,
  BookOpen,
} from 'lucide-react';
import AdminPageHeader from '../components/AdminPageHeader';
import { categoriesApi, categoryPublicUrl } from '../api';
import { useToast } from '../contexts/ToastContext';
import { errorMessage } from '../utils/errorMessage';

const inputCls =
  'w-full bg-white dark:bg-yrugray-800 border border-slate-300 dark:border-yrugray-700 text-[15px] rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-yrugray-500 focus:outline-none focus:border-yrupink-500 focus:ring-1 focus:ring-yrupink-500 transition-all';

const ManageCategories = () => {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [editing, setEditing] = useState(null); // object (edit) | 'new' (create)
  const [deleting, setDeleting] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const reload = () => {
    setLoading(true);
    setLoadError(null);
    categoriesApi
      .list({ all: 1 })
      .then((rows) => setItems(Array.isArray(rows) ? rows : []))
      .catch((e) => setLoadError(e))
      .finally(() => setLoading(false));
  };
  useEffect(() => { reload(); }, []);

  const save = async (form) => {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      display_order: Number(form.display_order) || 0,
      is_active: !!form.is_active,
    };
    // Empty slug on create → server derives it from the name.
    if (form.slug.trim()) payload.slug = form.slug.trim();
    if (editing === 'new') {
      await categoriesApi.create(payload);
      toast.success('เพิ่มหมวดหมู่เรียบร้อยแล้ว', { title: 'สำเร็จ' });
    } else {
      await categoriesApi.update(editing.id, payload);
      toast.success('บันทึกการแก้ไขเรียบร้อยแล้ว', { title: 'สำเร็จ' });
    }
    setEditing(null);
    reload();
  };

  const remove = async () => {
    try {
      await categoriesApi.remove(deleting.id);
      setDeleting(null);
      reload();
      toast.success('ลบหมวดหมู่เรียบร้อยแล้ว', { title: 'สำเร็จ' });
    } catch (e) {
      toast.error(errorMessage(e, 'ลบไม่สำเร็จ'), { title: 'ลบไม่สำเร็จ' });
    }
  };

  const copyLink = async (c) => {
    try {
      await navigator.clipboard.writeText(categoryPublicUrl(c.slug));
      setCopiedId(c.id);
      setTimeout(() => setCopiedId((id) => (id === c.id ? null : id)), 1500);
    } catch {
      toast.error('คัดลอกลิงก์ไม่สำเร็จ', { title: 'ผิดพลาด' });
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Tags}
        title="จัดการหมวดหมู่"
        description="จัดกลุ่มหลักสูตร — แต่ละหมวดมีลิงก์หน้าเว็บสำหรับแสดงหลักสูตรในหมวดนั้น"
        actions={
          <button
            onClick={() => setEditing('new')}
            className="px-5 py-2.5 bg-yrupink-600 hover:bg-yrupink-500 text-white text-sm sm:text-[15px] font-semibold rounded-xl shadow-lg shadow-yrupink-500/20 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            เพิ่มหมวดหมู่
          </button>
        }
      />

      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl">
          <Loader2 className="w-8 h-8 text-yrupink-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-600 dark:text-yrugray-400 text-[15px]">กำลังโหลดหมวดหมู่...</p>
        </div>
      ) : loadError ? (
        <div className="p-12 text-center bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-slate-800 dark:text-yrugray-200 text-[15px] font-semibold mb-1">โหลดข้อมูลไม่สำเร็จ</p>
          <p className="text-sm text-slate-600 dark:text-yrugray-400 mb-4">{errorMessage(loadError, 'ดึงข้อมูลหมวดหมู่ไม่สำเร็จ')}</p>
          <button onClick={reload} className="px-4 py-2 bg-slate-100 dark:bg-yrugray-800 hover:bg-slate-200 dark:hover:bg-yrugray-700 text-[15px] font-medium rounded-lg text-slate-700 dark:text-slate-200">ลองใหม่</button>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl">
          <div className="w-16 h-16 bg-slate-100 dark:bg-yrugray-800 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Tags className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">ยังไม่มีหมวดหมู่</h4>
          <p className="text-sm text-slate-500 dark:text-yrugray-400 mb-5">สร้างหมวดหมู่แรก แล้วเลือกหมวดให้หลักสูตรในหน้าสร้าง/แก้ไขกิจกรรม</p>
          <button onClick={() => setEditing('new')} className="px-4 py-2 bg-yrupink-600 hover:bg-yrupink-500 text-white text-[15px] font-semibold rounded-lg inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> เพิ่มหมวดหมู่
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((c) => (
            <div key={c.id} className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 hover:border-yrupink-500/40 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-[15px] sm:text-base font-bold text-slate-900 dark:text-white break-words">{c.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-yrugray-400 mt-0.5 font-mono truncate">/{c.slug}</p>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  c.is_active
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60'
                    : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                }`}>
                  {c.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {c.is_active ? 'แสดง' : 'ซ่อน'}
                </span>
              </div>

              {c.description && (
                <p className="text-sm text-slate-600 dark:text-yrugray-400 line-clamp-2">{c.description}</p>
              )}

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-yrugray-400">
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-yrupink-500" />
                  {Number(c.activity_count) || 0} หลักสูตร
                </span>
                <span className="inline-flex items-center gap-1">
                  <GripVertical className="w-3.5 h-3.5" />
                  ลำดับ {c.display_order}
                </span>
              </div>

              <div className="flex items-center gap-1 pt-3 mt-auto border-t border-slate-200/70 dark:border-yrugray-800">
                <button
                  onClick={() => copyLink(c)}
                  title="คัดลอกลิงก์หน้าเว็บ"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-yrugray-300 hover:text-yrupink-600 dark:hover:text-yrupink-400 hover:bg-yrupink-500/10 rounded-lg transition-colors"
                >
                  {copiedId === c.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copiedId === c.id ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}
                </button>
                <a
                  href={categoryPublicUrl(c.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="เปิดหน้าเว็บของหมวดนี้"
                  className="p-2 text-slate-600 dark:text-yrugray-400 hover:text-yrupink-600 dark:hover:text-yrupink-400 hover:bg-yrupink-500/10 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <div className="flex-1" />
                <button onClick={() => setEditing(c)} title="แก้ไข"
                  className="p-2 text-slate-600 dark:text-yrugray-400 hover:text-yrupink-600 dark:hover:text-yrupink-400 hover:bg-yrupink-500/10 rounded-lg transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleting(c)} title="ลบ"
                  className="p-2 text-slate-600 dark:text-yrugray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <CategoryFormModal
          category={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
      {deleting && (
        <DeleteConfirmModal category={deleting} onClose={() => setDeleting(null)} onConfirm={remove} />
      )}
    </div>
  );
};

// ---- Modals ----

const ModalShell = ({ children, onClose, size = 'lg' }) => {
  const sizeCls = size === 'lg' ? 'max-w-xl' : 'max-w-md';
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div onClick={onClose} className="absolute inset-0" />
      <div className={`relative my-8 bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl shadow-2xl w-full ${sizeCls} max-h-[90vh] overflow-hidden flex flex-col`}>
        {children}
      </div>
    </div>,
    document.body,
  );
};

const CategoryFormModal = ({ category, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    display_order: category?.display_order ?? 0,
    is_active: category ? !!category.is_active : true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const change = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!form.name.trim()) { setErr('กรุณากรอกชื่อหมวดหมู่'); return; }
    if (category && !form.slug.trim()) { setErr('กรุณากรอกชื่อในลิงก์'); return; }
    setSubmitting(true);
    try {
      await onSave(form);
    } catch (e2) {
      setErr(e2?.code === 'DUPLICATE_SLUG' || e2?.status === 409
        ? 'ชื่อในลิงก์นี้ถูกใช้แล้ว กรุณาใช้ชื่ออื่น'
        : errorMessage(e2, 'บันทึกไม่สำเร็จ'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell onClose={onClose} size="lg">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-yrugray-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {category ? <Pencil className="w-5 h-5 text-yrupink-500" /> : <Plus className="w-5 h-5 text-yrupink-500" />}
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{category ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}</h3>
        </div>
        <button onClick={onClose} className="text-slate-500 dark:text-yrugray-400 hover:text-slate-900 dark:hover:text-white p-1 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={submit} className="overflow-y-auto flex-1">
        <div className="p-6 space-y-4">
          <Field label="ชื่อหมวดหมู่" icon={<Type className="w-4 h-4" />} required>
            <input value={form.name} onChange={(e) => change('name', e.target.value)} maxLength={100} className={inputCls} placeholder="เช่น Generative AI" />
          </Field>

          <Field label="ชื่อในลิงก์ (slug)" icon={<Link2 className="w-4 h-4" />} required={!!category}>
            <input value={form.slug} onChange={(e) => change('slug', e.target.value)} maxLength={120} className={`${inputCls} font-mono`} placeholder={category ? '' : 'เว้นว่างเพื่อสร้างจากชื่อหมวดหมู่ เช่น generative-ai'} />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-yrugray-400 break-all">
              ลิงก์: {categoryPublicUrl(form.slug.trim() || '…')}
            </p>
          </Field>

          <Field label="คำอธิบาย" icon={<AlignLeft className="w-4 h-4" />}>
            <textarea value={form.description} onChange={(e) => change('description', e.target.value)} maxLength={500} rows={3} className={`${inputCls} resize-none`} placeholder="แสดงบนหน้าเว็บของหมวดนี้ (ไม่บังคับ)" />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="ลำดับการแสดง" icon={<GripVertical className="w-4 h-4" />}>
              <input type="number" min={0} value={form.display_order} onChange={(e) => change('display_order', e.target.value)} className={inputCls} />
            </Field>
            <div>
              <label className="text-[15px] font-medium text-slate-800 dark:text-yrugray-200 mb-1.5 flex items-center gap-1.5">
                {form.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />} สถานะการแสดงผล
              </label>
              <button
                type="button"
                onClick={() => change('is_active', !form.is_active)}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-[15px] font-medium transition-colors flex items-center justify-center gap-2 ${
                  form.is_active
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-yrugray-800 border-slate-300 dark:border-yrugray-700 text-slate-600 dark:text-yrugray-400'
                }`}
              >
                {form.is_active ? <><Eye className="w-4 h-4" /> แสดงบนหน้าเว็บ</> : <><EyeOff className="w-4 h-4" /> ซ่อน</>}
              </button>
            </div>
          </div>

          {err && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-700 dark:text-red-400">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{err}</span>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-yrugray-800 flex items-center justify-end gap-2 bg-white dark:bg-yrugray-900/50 sticky bottom-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-[15px] font-medium text-slate-700 dark:text-yrugray-300 hover:bg-slate-100 dark:hover:bg-yrugray-800 transition-colors">ยกเลิก</button>
          <button type="submit" disabled={submitting} className="px-5 py-2 rounded-lg bg-yrupink-600 hover:bg-yrupink-500 disabled:opacity-60 text-white text-[15px] font-semibold shadow-lg shadow-yrupink-500/20 transition-colors flex items-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {category ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

const DeleteConfirmModal = ({ category, onClose, onConfirm }) => (
  <ModalShell onClose={onClose} size="md">
    <div className="p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">ยืนยันการลบหมวดหมู่</h3>
      <p className="text-[15px] text-slate-700 dark:text-yrugray-300 mb-1">คุณแน่ใจหรือไม่ว่าต้องการลบ</p>
      <p className="text-[15px] font-semibold text-slate-900 dark:text-white mb-4">"{category.name}"</p>
      <p className="text-sm text-slate-600 dark:text-yrugray-500 mb-6">
        หลักสูตรในหมวดนี้จะไม่ถูกลบ แต่จะถูกนำออกจากหมวด และลิงก์ของหมวดนี้จะใช้ไม่ได้
      </p>
      <div className="flex items-center justify-center gap-2">
        <button onClick={onClose} className="px-5 py-2 rounded-lg text-[15px] font-medium text-slate-700 dark:text-yrugray-300 hover:bg-slate-100 dark:hover:bg-yrugray-800 border border-slate-300 dark:border-yrugray-700 transition-colors">ยกเลิก</button>
        <button onClick={onConfirm} className="px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[15px] font-semibold shadow-lg shadow-red-500/20 transition-colors flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> ลบหมวดหมู่
        </button>
      </div>
    </div>
  </ModalShell>
);

const Field = ({ label, icon, required, children }) => (
  <div>
    <label className="text-[15px] font-medium text-slate-800 dark:text-yrugray-200 mb-1.5 flex items-center gap-1.5">
      {icon}
      {label}
      {required && <span className="text-yrupink-500">*</span>}
    </label>
    {children}
  </div>
);

export default ManageCategories;
