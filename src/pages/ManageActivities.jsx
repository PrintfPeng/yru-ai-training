import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  Search,
  Pencil,
  Trash2,
  Plus,
  X,
  Calendar,
  Clock,
  Users,
  MapPin,
  AlertTriangle,
  Save,
  Image as ImageIcon,
  Filter,
  ClipboardList,
  Loader2,
  ArrowLeft,
  RefreshCw,
  ClipboardCheck,
} from 'lucide-react';
import ActivityRegistrants from './ActivityRegistrants';
import CreateAssessment from './CreateAssessment';
import { activitiesApi } from '../api';

// Map API status enum ⇄ Thai label used in the UI chip filter
const STATUS_LABEL = {
  published: 'เปิดรับสมัคร',
  cancelled: 'ปิดรับสมัคร',
  completed: 'จบแล้ว',
  draft:     'ร่าง',
};
const STATUS_ENUM = {
  'เปิดรับสมัคร': 'published',
  'ปิดรับสมัคร':  'cancelled',
  'จบแล้ว':       'completed',
  'ร่าง':         'draft',
};

const inputCls =
  'w-full bg-white dark:bg-yrugray-800 border border-slate-300 dark:border-yrugray-700 text-[15px] rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-yrugray-500 focus:outline-none focus:border-yrupink-500 focus:ring-1 focus:ring-yrupink-500 transition-all';

// Map API row → the shape the card + edit form expect
const normalize = (r) => ({
  id:          r.id,
  title:       r.title,
  slug:        r.slug,
  description: r.description,
  location:    r.location,
  date:        r.start_date ? new Date(r.start_date).toLocaleDateString('th-TH') : '',
  duration:    '',
  seats:       r.capacity,
  level:       'เริ่มต้น',
  category:    '',
  image:       r.cover_image_url,
  status:      STATUS_LABEL[r.status] || r.status,
  _apiStatus:  r.status,
  registrants_count: r.total_registered ?? 0,
  seats_left:  r.seats_left ?? r.capacity ?? 0,
  raw:         r,
});

const ManageActivities = ({ onGoCreate }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ทั้งหมด');

  // Selected card → show detail panel (with edit + registrants tabs)
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const statuses = ['ทั้งหมด', 'เปิดรับสมัคร', 'ปิดรับสมัคร', 'จบแล้ว', 'ร่าง'];

  const reload = () => {
    setLoading(true);
    setLoadError(null);
    activitiesApi.list()
      .then((rows) => {
        const list = (rows || []).map(normalize);
        setActivities(list);
        // If a card is currently open, sync its fresh row too
        setSelected((prev) => prev ? list.find((a) => a.id === prev.id) || null : null);
      })
      .catch((e) => setLoadError(e))
      .finally(() => setLoading(false));
  };
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => activities.filter((a) => {
    const matchStatus = statusFilter === 'ทั้งหมด' || a.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || (a.title || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  }), [activities, searchQuery, statusFilter]);

  const handleUpdate = async (updated) => {
    try {
      const patch = {
        title:           updated.title,
        description:     updated.description,
        location:        updated.location,
        capacity:        Number(updated.seats) || 0,
        status:          STATUS_ENUM[updated.status] || updated.status,
        cover_image_url: updated.image || undefined,
      };
      await activitiesApi.update(updated.id, patch);
      reload();
    } catch (e) {
      alert(`บันทึกไม่สำเร็จ: ${e.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      await activitiesApi.remove(deleting.id);
      setDeleting(null);
      if (selected?.id === deleting.id) setSelected(null);
      reload();
    } catch (e) {
      alert(`ลบไม่สำเร็จ: ${e.message}`);
    }
  };

  // ─────────────── Detail view (when a card is clicked) ───────────────
  if (selected) {
    return (
      <>
        <ActivityDetailPanel
          activity={selected}
          onBack={() => setSelected(null)}
          onEdit={handleUpdate}
          onDelete={() => setDeleting(selected)}
          onReload={reload}
        />
        {deleting && (
          <DeleteConfirmModal
            activity={deleting}
            onClose={() => setDeleting(null)}
            onConfirm={handleDelete}
          />
        )}
      </>
    );
  }

  // ─────────────── Grid view (default) ───────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-[22px] md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">จัดการหลักสูตร</h2>
          <p className="text-sm text-slate-600 dark:text-yrugray-400 mt-1">
            หลักสูตรทั้งหมด {activities.length} รายการ — คลิกการ์ดเพื่อดูรายชื่อผู้ลงทะเบียน / แก้ไข
          </p>
        </div>
        <button
          onClick={onGoCreate}
          className="px-5 py-2.5 bg-yrupink-600 hover:bg-yrupink-500 text-white text-[15px] font-semibold rounded-lg shadow-lg shadow-yrupink-500/20 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          สร้างกิจกรรมใหม่
        </button>
      </div>

      {/* Search + Filter */}
      <div className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="w-4 h-4 text-slate-500 dark:text-yrugray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อหลักสูตร..."
            className={`${inputCls} pl-9`}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-500 dark:text-yrugray-500" />
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium border transition-all ${
                statusFilter === s
                  ? 'bg-yrupink-600 text-white border-yrupink-500'
                  : 'bg-white dark:bg-yrugray-800 text-slate-700 dark:text-yrugray-300 border-slate-300 dark:border-yrugray-700 hover:border-yrupink-500/50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl p-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-yrupink-500 animate-spin" />
        </div>
      ) : loadError ? (
        <div className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl p-12 text-center">
          <p className="text-red-600 dark:text-red-400 text-[15px] font-medium mb-3">โหลดข้อมูลไม่สำเร็จ: {loadError.message}</p>
          <button onClick={reload} className="px-4 py-2 bg-slate-100 dark:bg-yrugray-800 hover:bg-slate-200 dark:hover:bg-yrugray-700 text-[15px] font-medium rounded-lg">ลองใหม่</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 bg-slate-100 dark:bg-yrugray-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6 text-slate-500 dark:text-yrugray-500" />
          </div>
          <p className="text-slate-700 dark:text-yrugray-300 text-[15px] font-medium mb-4">
            {activities.length === 0 ? 'ยังไม่มีหลักสูตร' : 'ไม่พบหลักสูตรที่ตรงกับเงื่อนไข'}
          </p>
          {activities.length === 0 && (
            <button onClick={onGoCreate} className="px-4 py-2 bg-yrupink-600 hover:bg-yrupink-500 text-white text-[15px] font-semibold rounded-lg">
              + สร้างกิจกรรมแรก
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((a) => (
            <ActivityCard key={a.id} activity={a} onOpen={() => setSelected(a)} />
          ))}
        </div>
      )}
    </div>
  );
};

// ────────────────────────────── Card ──────────────────────────────

const ActivityCard = ({ activity, onOpen }) => (
  <button
    type="button"
    onClick={onOpen}
    className="text-left group bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-yrupink-500/40 dark:hover:border-yrupink-500/30 transition-all flex flex-col"
  >
    {/* Banner */}
    <div className="relative aspect-[16/9] bg-slate-100 dark:bg-yrugray-800 overflow-hidden">
      {activity.image ? (
        <img
          src={activity.image}
          alt={activity.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yrupink-500/20 to-yrupink-600/10">
          <BookOpen className="w-10 h-10 text-yrupink-500 dark:text-yrupink-400" />
        </div>
      )}
      <div className="absolute top-3 right-3">
        <StatusBadge status={activity.status} />
      </div>
      {activity.registrants_count > 0 && (
        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-[13px] font-semibold backdrop-blur-sm flex items-center gap-1.5">
          <ClipboardList className="w-3.5 h-3.5" />
          {activity.registrants_count} คนสมัคร
        </div>
      )}
    </div>

    {/* Body */}
    <div className="p-5 flex-1 flex flex-col">
      <h3 className="text-[17px] font-bold text-slate-900 dark:text-white line-clamp-2 mb-3 group-hover:text-yrupink-600 dark:group-hover:text-yrupink-400 transition-colors">
        {activity.title}
      </h3>

      <div className="space-y-2 text-[14px] text-slate-700 dark:text-yrugray-300 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-yrupink-500 dark:text-yrupink-400 shrink-0" />
          <span>{activity.date || 'ยังไม่ระบุวันที่'}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-yrupink-500 dark:text-yrupink-400 shrink-0 mt-0.5" />
          <span className="line-clamp-1">{activity.location || 'ยังไม่ระบุสถานที่'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-yrupink-500 dark:text-yrupink-400 shrink-0" />
          <span className="tabular-nums">
            <span className="font-semibold text-yrupink-600 dark:text-yrupink-400">{activity.registrants_count || 0}</span>
            <span className="text-slate-500 dark:text-yrugray-400"> / {activity.seats || '∞'} คน</span>
          </span>
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-slate-100 dark:border-yrugray-800 text-[13px] font-medium text-yrupink-600 dark:text-yrupink-400 flex items-center gap-1.5">
        คลิกเพื่อจัดการ
        <span className="group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </div>
  </button>
);

// ────────────────────── Detail Panel (tabs) ──────────────────────

const ActivityDetailPanel = ({ activity, onBack, onEdit, onDelete, onReload }) => {
  const [tab, setTab] = useState('edit'); // 'edit' | 'registrants'

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            title="กลับหน้ารวมหลักสูตร"
            className="p-2 rounded-lg bg-slate-100 dark:bg-yrugray-800 hover:bg-slate-200 dark:hover:bg-yrugray-700 border border-slate-300 dark:border-yrugray-700 text-slate-700 dark:text-yrugray-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <p className="text-sm text-slate-600 dark:text-yrugray-400 mb-0.5">จัดการหลักสูตร</p>
            <h2 className="text-[22px] md:text-2xl font-bold text-slate-900 dark:text-white line-clamp-1 leading-tight">
              {activity.title}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <StatusBadge status={activity.status} />
              <span className="text-sm text-slate-600 dark:text-yrugray-400">
                {activity.date} · {activity.registrants_count || 0} / {activity.seats || '∞'} คน
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReload}
            title="รีเฟรช"
            className="p-2 rounded-lg text-slate-600 dark:text-yrugray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-yrugray-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10 text-[14px] font-medium flex items-center gap-2 border border-red-300 dark:border-red-500/30"
          >
            <Trash2 className="w-4 h-4" />
            ลบ
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-yrugray-800 flex gap-1 overflow-x-auto">
        <TabButton active={tab === 'edit'} onClick={() => setTab('edit')} icon={<Pencil className="w-4 h-4" />} label="แก้ไขรายละเอียด" />
        <TabButton
          active={tab === 'registrants'}
          onClick={() => setTab('registrants')}
          icon={<ClipboardList className="w-4 h-4" />}
          label="ผู้ลงทะเบียน"
          badge={activity.registrants_count > 0 ? activity.registrants_count : null}
        />
        <TabButton
          active={tab === 'assessment'}
          onClick={() => setTab('assessment')}
          icon={<ClipboardCheck className="w-4 h-4" />}
          label="แบบประเมิน + ใบรับรอง"
        />
      </div>

      {/* Tab content */}
      {tab === 'edit' && <InlineEditForm activity={activity} onSave={onEdit} />}
      {tab === 'registrants' && <ActivityRegistrants activity={activity} onBack={onBack} embedded />}
      {tab === 'assessment' && <CreateAssessment activity={activity} embedded />}
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label, badge }) => (
  <button
    onClick={onClick}
    className={`px-4 py-3 -mb-px flex items-center gap-2 text-[15px] font-semibold border-b-2 transition-colors ${
      active
        ? 'text-yrupink-600 dark:text-yrupink-400 border-yrupink-500'
        : 'text-slate-600 dark:text-yrugray-400 border-transparent hover:text-slate-900 dark:hover:text-white'
    }`}
  >
    {icon}
    {label}
    {badge != null && (
      <span className={`ml-1 min-w-[22px] h-[22px] px-1.5 flex items-center justify-center text-[12px] font-bold rounded-full ${
        active ? 'bg-yrupink-500 text-white' : 'bg-slate-200 dark:bg-yrugray-800 text-slate-700 dark:text-yrugray-300'
      }`}>{badge}</span>
    )}
  </button>
);

// ─────────────── Inline edit form (was EditActivityModal) ───────────────

const InlineEditForm = ({ activity, onSave }) => {
  const [form, setForm] = useState(activity);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // Reset form when activity changes (after reload)
  useEffect(() => { setForm(activity); }, [activity.id]);

  const change = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl overflow-hidden">
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="ชื่อหลักสูตร" required className="md:col-span-2">
          <input value={form.title} onChange={(e) => change('title', e.target.value)} required className={inputCls} />
        </Field>

        <Field label="วันที่" icon={<Calendar className="w-4 h-4" />}>
          <input value={form.date} onChange={(e) => change('date', e.target.value)} className={inputCls} />
        </Field>

        <Field label="ระยะเวลา" icon={<Clock className="w-4 h-4" />}>
          <input value={form.duration} onChange={(e) => change('duration', e.target.value)} className={inputCls} placeholder="เช่น 2 วัน" />
        </Field>

        <Field label="จำนวนที่รับ" icon={<Users className="w-4 h-4" />}>
          <input type="number" value={form.seats} onChange={(e) => change('seats', Number(e.target.value))} className={inputCls} />
        </Field>

        <Field label="สถานะ">
          <select value={form.status} onChange={(e) => change('status', e.target.value)} className={inputCls}>
            <option value="ร่าง">ร่าง (ยังไม่เปิดสาธารณะ)</option>
            <option value="เปิดรับสมัคร">เปิดรับสมัคร</option>
            <option value="ปิดรับสมัคร">ปิดรับสมัคร</option>
            <option value="จบแล้ว">จบแล้ว</option>
          </select>
        </Field>

        <Field label="สถานที่" icon={<MapPin className="w-4 h-4" />} className="md:col-span-2">
          <input value={form.location || ''} onChange={(e) => change('location', e.target.value)} className={inputCls} />
        </Field>

        <Field label="URL รูปแบนเนอร์" icon={<ImageIcon className="w-4 h-4" />} className="md:col-span-2">
          <input value={form.image || ''} onChange={(e) => change('image', e.target.value)} className={inputCls} placeholder="https://... หรือ data:image/..." />
          {form.image && (
            <div className="mt-2 rounded-lg overflow-hidden border border-slate-300 dark:border-yrugray-700 aspect-[16/9] bg-slate-100 dark:bg-yrugray-800 max-w-md">
              <img src={form.image} alt="preview" className="w-full h-full object-cover" />
            </div>
          )}
        </Field>

        <Field label="รายละเอียด" className="md:col-span-2">
          <textarea value={form.description || ''} onChange={(e) => change('description', e.target.value)} rows={5} className={`${inputCls} resize-none`} />
        </Field>
      </div>

      <div className="px-6 py-4 border-t border-slate-200 dark:border-yrugray-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-yrugray-900/50">
        {saved && (
          <span className="text-[14px] font-medium text-green-600 dark:text-green-400 flex items-center gap-1.5">
            <Save className="w-4 h-4" />
            บันทึกแล้ว
          </span>
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-lg bg-yrupink-600 hover:bg-yrupink-500 disabled:opacity-60 text-white text-[15px] font-semibold shadow-lg shadow-yrupink-500/20 transition-colors flex items-center gap-2"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...</> : <><Save className="w-4 h-4" /> บันทึกการแก้ไข</>}
        </button>
      </div>
    </form>
  );
};

// ────────────────────────── Delete Confirm ──────────────────────────

const DeleteConfirmModal = ({ activity, onClose, onConfirm }) => createPortal(
  <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
    <div onClick={onClose} className="absolute inset-0" />
    <div className="relative my-8 bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
      <div className="p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">ยืนยันการลบหลักสูตร</h3>
        <p className="text-[15px] text-slate-700 dark:text-yrugray-300 mb-1">คุณแน่ใจหรือไม่ว่าต้องการลบ</p>
        <p className="text-[15px] font-semibold text-slate-900 dark:text-white mb-4 line-clamp-2">"{activity.title}"</p>
        <p className="text-sm text-slate-600 dark:text-yrugray-500 mb-6">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
        <div className="flex items-center justify-center gap-2">
          <button onClick={onClose} className="px-5 py-2 rounded-lg text-[15px] font-medium text-slate-700 dark:text-yrugray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-yrugray-800 transition-colors border border-slate-300 dark:border-yrugray-700">ยกเลิก</button>
          <button onClick={onConfirm} className="px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[15px] font-semibold shadow-lg shadow-red-500/20 transition-colors flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            ลบหลักสูตร
          </button>
        </div>
      </div>
    </div>
  </div>,
  document.body,
);

// ────────────────────────── Small helpers ──────────────────────────

const StatusBadge = ({ status }) => {
  const map = {
    'เปิดรับสมัคร': 'bg-green-100 text-green-700 border-green-300 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30',
    'ปิดรับสมัคร':  'bg-red-100 text-red-700 border-red-300 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30',
    'จบแล้ว':       'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30',
    'ร่าง':         'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/30',
  };
  const fallback = 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/30';
  return (
    <span className={`px-2.5 py-1 text-[13px] font-semibold rounded-full border backdrop-blur-sm ${map[status] || fallback}`}>
      {status}
    </span>
  );
};

const Field = ({ label, icon, required, className = '', children }) => (
  <div className={className}>
    <label className="text-[15px] font-medium text-slate-800 dark:text-yrugray-200 mb-1.5 flex items-center gap-1.5">
      {icon}
      {label}
      {required && <span className="text-yrupink-500 dark:text-yrupink-400">*</span>}
    </label>
    {children}
  </div>
);

export default ManageActivities;
