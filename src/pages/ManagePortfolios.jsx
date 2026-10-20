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
  Image as ImageIcon,
  ImageOff,
  Type,
  AlignLeft,
  GripVertical,
  Eye,
  EyeOff,
} from 'lucide-react';
import BannerUploader from '../components/BannerUploader';
import AdminPageHeader from '../components/AdminPageHeader';
import { portfoliosApi } from '../api';
import { useToast } from '../contexts/ToastContext';
import { errorMessage } from '../utils/errorMessage';

const inputCls =
  'w-full bg-white dark:bg-yrugray-800 border border-slate-300 dark:border-yrugray-700 text-[15px] rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-yrugray-500 focus:outline-none focus:border-yrupink-500 focus:ring-1 focus:ring-yrupink-500 transition-all';

const ManagePortfolios = () => {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [editing, setEditing] = useState(null); // object (edit) | 'new' (create)
  const [deleting, setDeleting] = useState(null);

  const reload = () => {
    setLoading(true);
    setLoadError(null);
    portfoliosApi
      .getPortfolios({ all: 1 })
      .then((rows) => setItems(Array.isArray(rows) ? rows : []))
      .catch((e) => setLoadError(e))
      .finally(() => setLoading(false));
  };
  useEffect(() => { reload(); }, []);

  const save = async (form) => {
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      image_url: form.image_url,
      display_order: Number(form.display_order) || 0,
      is_active: !!form.is_active,
    };
    if (editing === 'new') {
      await portfoliosApi.createPortfolio(payload);
      toast.success('เพิ่มผลงานเรียบร้อยแล้ว', { title: 'สำเร็จ' });
    } else {
      await portfoliosApi.updatePortfolio(editing.id, payload);
      toast.success('บันทึกการแก้ไขเรียบร้อยแล้ว', { title: 'สำเร็จ' });
    }
    setEditing(null);
    reload();
  };

  const remove = async () => {
    try {
      await portfoliosApi.deletePortfolio(deleting.id);
      setDeleting(null);
      reload();
      toast.success('ลบผลงานเรียบร้อยแล้ว', { title: 'สำเร็จ' });
    } catch (e) {
      toast.error(errorMessage(e, 'ลบไม่สำเร็จ'), { title: 'ลบไม่สำเร็จ' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        icon={ImageIcon}
        title="ผลงานที่ผ่านมา"
        description="ผลงานที่เปิดใช้งานจะแสดงใน carousel หน้าแรก (เรียงตามลำดับ)"
        actions={
          <button
            onClick={() => setEditing('new')}
            className="px-5 py-2.5 bg-yrupink-600 hover:bg-yrupink-500 text-white text-sm sm:text-[15px] font-semibold rounded-xl shadow-lg shadow-yrupink-500/20 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            เพิ่มผลงาน
          </button>
        }
      />

      {/* Grid / states */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl">
          <Loader2 className="w-8 h-8 text-yrupink-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-600 dark:text-yrugray-400 text-[15px]">กำลังโหลดผลงาน...</p>
        </div>
      ) : loadError ? (
        <div className="p-12 text-center bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-slate-800 dark:text-yrugray-200 text-[15px] font-semibold mb-1">โหลดข้อมูลไม่สำเร็จ</p>
          <p className="text-sm text-slate-600 dark:text-yrugray-400 mb-4">{errorMessage(loadError, 'ดึงข้อมูลผลงานไม่สำเร็จ')}</p>
          <button onClick={reload} className="px-4 py-2 bg-slate-100 dark:bg-yrugray-800 hover:bg-slate-200 dark:hover:bg-yrugray-700 text-[15px] font-medium rounded-lg text-slate-700 dark:text-slate-200">ลองใหม่</button>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl">
          <div className="w-16 h-16 bg-slate-100 dark:bg-yrugray-800 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-400">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">ยังไม่มีผลงาน</h4>
          <p className="text-sm text-slate-500 dark:text-yrugray-400 mb-5">เพิ่มผลงานแรกเพื่อแสดงใน carousel หน้าแรก</p>
          <button onClick={() => setEditing('new')} className="px-4 py-2 bg-yrupink-600 hover:bg-yrupink-500 text-white text-[15px] font-semibold rounded-lg inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> เพิ่มผลงาน
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((p) => (
            <div key={p.id} className="group bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl overflow-hidden flex flex-col">
              <div className="relative aspect-[4/3] bg-slate-100 dark:bg-yrugray-800">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageOff className="w-8 h-8" /></div>
                )}
                <span className={`absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  p.is_active
                    ? 'bg-emerald-500/90 text-white'
                    : 'bg-slate-500/80 text-white'
                }`}>
                  {p.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {p.is_active ? 'แสดง' : 'ซ่อน'}
                </span>
                <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-black/55 text-white">
                  <GripVertical className="w-3 h-3" /> {p.display_order}
                </span>
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white line-clamp-1">{p.title}</h3>
                <p className="text-sm text-slate-600 dark:text-yrugray-400 mt-1 line-clamp-2 flex-grow">{p.description}</p>
                <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-slate-200/70 dark:border-yrugray-800">
                  <button onClick={() => setEditing(p)} title="แก้ไข"
                    className="p-2 text-slate-600 dark:text-yrugray-400 hover:text-yrupink-600 dark:hover:text-yrupink-400 hover:bg-yrupink-500/10 rounded-lg transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleting(p)} title="ลบ"
                    className="p-2 text-slate-600 dark:text-yrugray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <PortfolioFormModal
          portfolio={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
      {deleting && (
        <DeleteConfirmModal portfolio={deleting} onClose={() => setDeleting(null)} onConfirm={remove} />
      )}
    </div>
  );
};

// ---- Modals ----

const ModalShell = ({ children, onClose, size = 'lg' }) => {
  const sizeCls = size === 'lg' ? 'max-w-2xl' : 'max-w-md';
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

const PortfolioFormModal = ({ portfolio, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: portfolio?.title || '',
    description: portfolio?.description || '',
    image_url: portfolio?.image_url || '',
    display_order: portfolio?.display_order ?? 0,
    is_active: portfolio ? !!portfolio.is_active : true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const change = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!form.title.trim()) { setErr('กรุณากรอกชื่อผลงาน'); return; }
    if (!form.description.trim()) { setErr('กรุณากรอกคำอธิบาย'); return; }
    if (!form.image_url) { setErr('กรุณาอัปโหลดรูปภาพผลงาน'); return; }
    setSubmitting(true);
    try {
      await onSave(form);
    } catch (e2) {
      setErr(errorMessage(e2, 'บันทึกไม่สำเร็จ'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell onClose={onClose} size="lg">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-yrugray-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {portfolio ? <Pencil className="w-5 h-5 text-yrupink-500" /> : <Plus className="w-5 h-5 text-yrupink-500" />}
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{portfolio ? 'แก้ไขผลงาน' : 'เพิ่มผลงาน'}</h3>
        </div>
        <button onClick={onClose} className="text-slate-500 dark:text-yrugray-400 hover:text-slate-900 dark:hover:text-white p-1 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={submit} className="overflow-y-auto flex-1">
        <div className="p-6 space-y-4">
          <Field label="ชื่อผลงาน" icon={<Type className="w-4 h-4" />} required>
            <input value={form.title} onChange={(e) => change('title', e.target.value)} required className={inputCls} placeholder="เช่น อบรมเชิงปฏิบัติการ AI for Education" />
          </Field>

          <Field label="คำอธิบาย" icon={<AlignLeft className="w-4 h-4" />} required>
            <textarea value={form.description} onChange={(e) => change('description', e.target.value)} required rows={4} className={`${inputCls} resize-none`} placeholder="รายละเอียดของผลงาน" />
          </Field>

          <div>
            <label className="text-[15px] font-medium text-slate-800 dark:text-yrugray-200 mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" /> รูปภาพผลงาน <span className="text-yrupink-500">*</span>
            </label>
            <BannerUploader value={form.image_url} onChange={(url) => change('image_url', url)} aspect={4 / 3} />
          </div>

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
            {portfolio ? 'บันทึกการแก้ไข' : 'เพิ่มผลงาน'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

const DeleteConfirmModal = ({ portfolio, onClose, onConfirm }) => (
  <ModalShell onClose={onClose} size="md">
    <div className="p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">ยืนยันการลบผลงาน</h3>
      <p className="text-[15px] text-slate-700 dark:text-yrugray-300 mb-1">คุณแน่ใจหรือไม่ว่าต้องการลบ</p>
      <p className="text-[15px] font-semibold text-slate-900 dark:text-white mb-4">"{portfolio.title}"</p>
      <p className="text-sm text-slate-600 dark:text-yrugray-500 mb-6">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
      <div className="flex items-center justify-center gap-2">
        <button onClick={onClose} className="px-5 py-2 rounded-lg text-[15px] font-medium text-slate-700 dark:text-yrugray-300 hover:bg-slate-100 dark:hover:bg-yrugray-800 border border-slate-300 dark:border-yrugray-700 transition-colors">ยกเลิก</button>
        <button onClick={onConfirm} className="px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[15px] font-semibold shadow-lg shadow-red-500/20 transition-colors flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> ลบผลงาน
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

export default ManagePortfolios;
