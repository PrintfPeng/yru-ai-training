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
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import ActivityRegistrants from './ActivityRegistrants';
import CreateAssessment from './CreateAssessment';
import AssessmentDashboard from './AssessmentDashboard';
import { activitiesApi } from '../api';
import { formatThaiDate, toDateInputValue } from '../utils/thaiDate';

// Map API status enum ⇄ Thai label used in the UI chip filter
const STATUS_LABEL = {
  published:  'เปิดรับสมัคร',
  assessment: 'เปิดทำแบบประเมิน',
  cancelled:  'ปิดรับสมัคร',
  completed:  'จบโครงการ',
  draft:      'ร่าง',
};
const STATUS_ENUM = {
  'เปิดรับสมัคร':     'published',
  'เปิดทำแบบประเมิน': 'assessment',
  'ปิดรับสมัคร':      'cancelled',
  'จบโครงการ':        'completed',
  'ร่าง':             'draft',
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
  startDate:   toDateInputValue(r.start_date),
  endDate:     toDateInputValue(r.end_date),
  dateDisplay: r.start_date ? formatThaiDate(r.start_date) : '',
  endDateDisplay: r.end_date ? formatThaiDate(r.end_date) : '',
  batchNo:     r.batch_no ?? '',
  titleEn:     r.title_en ?? '',
  registerCloseDate: toDateInputValue(r.register_close_date),
  registerCloseDateDisplay: r.register_close_date ? formatThaiDate(r.register_close_date) : '',
  hasSelection: !!r.has_selection,
  feeText:     r.fee_text ?? '',
  travelText:  r.travel_text ?? '',
  noteText:    r.note_text ?? '',
  venueLinks:  Array.isArray(r.venue_links) ? r.venue_links : [],
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

  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const statuses = ['ทั้งหมด', 'เปิดรับสมัคร', 'เปิดทำแบบประเมิน', 'ปิดรับสมัคร', 'จบโครงการ', 'ร่าง'];

  const reload = () => {
    setLoading(true);
    setLoadError(null);
    activitiesApi.list()
      .then((rows) => {
        const list = (rows || []).map(normalize);
        setActivities(list);
        setSelected((prev) => prev ? list.find((a) => a.id === prev.id) || null : null);
      })
      .catch((e) => setLoadError(e))
      .finally(() => setLoading(false));
  };
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => activities.filter((a) => {
    const matchStatus = statusFilter === 'ทั้งหมด' || a.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || (a.title || '').toLowerCase().includes(q) || (a.titleEn || '').toLowerCase().includes(q);
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
        title_en:        updated.titleEn || null,
        batch_no:        updated.batchNo ? Number(updated.batchNo) : null,
        register_close_date: updated.registerCloseDate || null,
        has_selection:   !!updated.hasSelection,
        fee_text:        updated.feeText || null,
        travel_text:     updated.travelText || null,
        note_text:       updated.noteText || null,
        venue_links:     (updated.venueLinks || []).filter((v) => v.label?.trim() && v.url?.trim()),
      };
      if (updated.startDate) patch.start_date = `${updated.startDate} 09:00:00`;
      if (updated.endDate)   patch.end_date = `${updated.endDate} 16:30:00`;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-[22px] md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">จัดการหลักสูตร</h2>
          <p className="text-sm text-slate-600 dark:text-yrugray-400 mt-1">
            หลักสูตรทั้งหมด {activities.length} รายการ — คลิกการ์ดเพื่อดูรายชื่อผู้ลงทะเบียน / แก้ไข[cite: 2]
          </p>
        </div>
        <button
          onClick={onGoCreate}
          className="px-5 py-2.5 bg-yrupink-600 hover:bg-yrupink-500 text-white text-[15px] font-semibold rounded-xl shadow-lg shadow-yrupink-500/20 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          สร้างกิจกรรมใหม่
        </button>
      </div>

      {/* Search + Filter */}
      <div className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 shadow-xs">
        <div className="relative flex-grow">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อหลักสูตร..."
            className={`${inputCls} pl-10`}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-2 rounded-xl text-[13px] font-medium border transition-all ${
                statusFilter === s
                  ? 'bg-yrupink-600 text-white border-yrupink-500 shadow-sm shadow-yrupink-500/20'
                  : 'bg-slate-50 dark:bg-yrugray-800 text-slate-700 dark:text-yrugray-300 border-slate-200 dark:border-yrugray-700 hover:border-yrupink-500/50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl p-16 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-yrupink-500 animate-spin" />
        </div>
      ) : loadError ? (
        <div className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl p-12 text-center">
          <p className="text-red-600 dark:text-red-400 text-[15px] font-medium mb-3">โหลดข้อมูลไม่สำเร็จ: {loadError.message}</p>
          <button onClick={reload} className="px-4 py-2 bg-slate-100 dark:bg-yrugray-800 text-[15px] font-medium rounded-lg">ลองใหม่</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-yrugray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <p className="text-slate-800 dark:text-yrugray-200 text-base font-semibold mb-2">ไม่พบหลักสูตรที่ค้นหา</p>
          <p className="text-sm text-slate-500 dark:text-yrugray-400 mb-6">ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะดูอีกครั้ง</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((a) => (
            <ActivityCard key={a.id} activity={a} onOpen={() => setSelected(a)} />
          ))}
        </div>
      )}
    </div>
  );
};

// ────────────────────────────── Card ดีไซน์ใหม่ ──────────────────────────────

const ActivityCard = ({ activity, onOpen }) => {
  const dateRangeText = useMemo(() => {
    if (!activity.dateDisplay) return 'ยังไม่ระบุวันที่';
    if (!activity.endDateDisplay || activity.dateDisplay === activity.endDateDisplay) {
      return activity.dateDisplay;
    }
    return `${activity.dateDisplay} - ${activity.endDateDisplay}`;
  }, [activity.dateDisplay, activity.endDateDisplay]);

  // คำนวณเปอร์เซ็นต์ผู้สมัครเทียบกับที่นั่ง
  const percent = useMemo(() => {
    if (!activity.seats || activity.seats <= 0) return 0;
    const p = Math.round(((activity.registrants_count || 0) / activity.seats) * 100);
    return p > 100 ? 100 : p;
  }, [activity.registrants_count, activity.seats]);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-left group bg-white dark:bg-yrugray-900 border border-slate-200/90 dark:border-yrugray-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl hover:border-yrupink-500/50 transition-all duration-300 flex flex-col"
    >
      {/* Banner รูปภาพด้านบน */}
      <div className="relative aspect-[16/9] bg-slate-100 dark:bg-yrugray-800 overflow-hidden">
        {activity.image ? (
          <img
            src={activity.image}
            alt={activity.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yrupink-500/15 to-yrupink-600/5">
            <BookOpen className="w-10 h-10 text-yrupink-500" />
          </div>
        )}
        
        {/* ป้ายรุ่นที่ (ถ้ามี) */}
        {activity.batchNo && (
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-lg">
            รุ่นที่ {activity.batchNo}
          </div>
        )}

        {/* สถานะหลักสูตร */}
        <div className="absolute top-3 right-3 shadow-md">
          <StatusBadge status={activity.status} />
        </div>
      </div>

      {/* เนื้อหาการ์ด */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* ชื่อหลักสูตร */}
          <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-yrupink-600 dark:group-hover:text-yrupink-400 transition-colors leading-snug">
            {activity.title}
          </h3>
          

          {/* สถิติย่อยแบบ 3 กล่อง (จำนวนรับ / สมัครแล้ว / สถานะผู้สมัคร) */}
          <div className="grid grid-cols-2 gap-2 my-4">
            <div className="bg-slate-50 dark:bg-yrugray-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-yrugray-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-yrugray-400 mb-0.5">
                <Users className="w-3.5 h-3.5 text-yrupink-500" />
                <span>จำนวนรับ</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                {activity.seats ? `${activity.seats} คน` : 'ไม่จำกัด'}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-yrugray-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-yrugray-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-yrugray-400 mb-0.5">
                <ClipboardList className="w-3.5 h-3.5 text-blue-500" />
                <span>สมัครแล้ว</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                {activity.registrants_count || 0} คน
              </p>
            </div>
          </div>

          {/* ข้อมูลรายละเอียดหลักสูตร (วันที่, สถานที่) */}
          <div className="space-y-2 text-xs text-slate-600 dark:text-yrugray-300 pt-2 border-t border-slate-100 dark:border-yrugray-800">
            {activity.registerCloseDateDisplay && (
              <div className="flex items-center justify-between text-slate-500 dark:text-yrugray-400">
                <span>ปิดรับสมัคร:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{activity.registerCloseDateDisplay}</span>
              </div>
            )}

            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-yrupink-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[11px]">ช่วงอบรม</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{dateRangeText}</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-yrupink-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[11px]">สถานที่</span>
                <span className="line-clamp-1 font-semibold text-slate-800 dark:text-slate-200">{activity.location || 'ยังไม่ระบุสถานที่'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* แถบสัดส่วนผู้สมัคร (Progress Bar) & ปุ่มจัดการ */}
        <div className="space-y-3 pt-2">
          {activity.seats > 0 && (
            <div>
              <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 dark:text-yrugray-400 mb-1">
                <span>ยอดผู้สมัคร</span>
                <span className="text-yrupink-600 dark:text-yrupink-400">{percent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-yrugray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yrupink-500 to-yrupink-600 rounded-full transition-all duration-500" 
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-yrugray-800 flex items-center justify-between text-xs font-bold text-yrupink-600 dark:text-yrupink-400">
            <span>จัดการหลักสูตรและผู้ลงทะเบียน</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>
      </div>
    </button>
  );
};

// ────────────────────── Detail Panel & Components (คงเดิม) ──────────────────────

const ActivityDetailPanel = ({ activity, onBack, onEdit, onDelete, onReload }) => {
  const [tab, setTab] = useState('edit');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            title="กลับหน้ารวมหลักสูตร"
            className="p-2.5 rounded-xl bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 text-slate-700 dark:text-yrugray-300 hover:bg-slate-50 dark:hover:bg-yrugray-800 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-yrugray-400 font-medium mb-0.5">จัดการหลักสูตร</p>
            <h2 className="text-[20px] md:text-2xl font-bold text-slate-900 dark:text-white line-clamp-1 leading-tight">
              {activity.title}
            </h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <StatusBadge status={activity.status} />
              <span className="text-xs text-slate-500 dark:text-yrugray-400">
                {activity.dateDisplay} · ลงทะเบียนแล้ว {activity.registrants_count || 0} / {activity.seats || '∞'} คน
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReload}
            title="รีเฟรช"
            className="p-2.5 rounded-xl bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 text-slate-600 dark:text-yrugray-400 hover:text-slate-900 dark:hover:text-white transition-colors shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-semibold flex items-center gap-2 border border-rose-200 dark:border-rose-900/50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            ลบหลักสูตร
          </button>
        </div>
      </div>

      <div className="border-b border-slate-200 dark:border-yrugray-800 flex gap-2 overflow-x-auto bg-white dark:bg-yrugray-900 px-4 rounded-xl shadow-xs">
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
        <TabButton
          active={tab === 'dashboard'}
          onClick={() => setTab('dashboard')}
          icon={<BarChart3 className="w-4 h-4" />}
          label="แดชบอร์ดสรุปผล"
        />
      </div>

      {tab === 'edit' && <InlineEditForm activity={activity} onSave={onEdit} />}
      {tab === 'registrants' && <ActivityRegistrants activity={activity} onBack={onBack} embedded />}
      {tab === 'assessment' && <CreateAssessment activity={activity} embedded />}
      {tab === 'dashboard' && <AssessmentDashboard activity={activity} />}
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label, badge }) => (
  <button
    onClick={onClick}
    className={`px-4 py-3.5 -mb-px flex items-center gap-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
      active
        ? 'text-yrupink-600 dark:text-yrupink-400 border-yrupink-500'
        : 'text-slate-500 dark:text-yrugray-400 border-transparent hover:text-slate-900 dark:hover:text-white'
    }`}
  >
    {icon}
    {label}
    {badge != null && (
      <span className={`ml-1 min-w-[20px] h-[20px] px-1.5 flex items-center justify-center text-[11px] font-bold rounded-full ${
        active ? 'bg-yrupink-500 text-white' : 'bg-slate-200 dark:bg-yrugray-800 text-slate-700 dark:text-yrugray-300'
      }`}>{badge}</span>
    )}
  </button>
);

const InlineEditForm = ({ activity, onSave }) => {
  const [form, setForm] = useState(activity);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
    <form onSubmit={submit} className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl overflow-hidden shadow-xs">
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="ชื่อหลักสูตร" required className="md:col-span-2">
          <input value={form.title} onChange={(e) => change('title', e.target.value)} required className={inputCls} />
        </Field>

        <Field label="ชื่อภาษาอังกฤษ (subtitle)" className="md:col-span-2">
          <input value={form.titleEn || ''} onChange={(e) => change('titleEn', e.target.value)} className={inputCls} placeholder="e.g. Advanced Prompt Engineering" />
        </Field>

        <Field label="รุ่นที่">
          <input type="number" min={1} value={form.batchNo || ''} onChange={(e) => change('batchNo', e.target.value)} className={inputCls} placeholder="เช่น 1" />
        </Field>

        <Field label="จำนวนที่รับ" icon={<Users className="w-4 h-4" />}>
          <input type="number" value={form.seats} onChange={(e) => change('seats', Number(e.target.value))} className={inputCls} />
        </Field>

        <Field label="วันเริ่มอบรม" icon={<Calendar className="w-4 h-4" />}>
          <input type="date" value={form.startDate || ''} onChange={(e) => change('startDate', e.target.value)} className={inputCls} />
        </Field>

        <Field label="วันสิ้นสุดอบรม" icon={<Calendar className="w-4 h-4" />}>
          <input type="date" value={form.endDate || ''} onChange={(e) => change('endDate', e.target.value)} className={inputCls} />
        </Field>

        <Field label="วันปิดรับสมัคร" icon={<Calendar className="w-4 h-4" />}>
          <input type="date" value={form.registerCloseDate || ''} onChange={(e) => change('registerCloseDate', e.target.value)} className={inputCls} />
        </Field>

        <Field label="การพิจารณาคัดเลือก">
          <label className="flex items-center gap-2.5 h-full text-sm text-slate-700 dark:text-yrugray-300 cursor-pointer select-none">
            <input type="checkbox" checked={!!form.hasSelection} onChange={(e) => change('hasSelection', e.target.checked)} className="w-4 h-4 accent-yrupink-500 rounded" />
            มีการพิจารณาคัดเลือกผู้เข้าร่วม
          </label>
        </Field>

        <Field label="ค่าลงทะเบียน">
          <input value={form.feeText || ''} onChange={(e) => change('feeText', e.target.value)} className={inputCls} placeholder="เช่น ไม่มีค่าลงทะเบียน" />
        </Field>

        <Field label="ค่าเดินทาง">
          <input value={form.travelText || ''} onChange={(e) => change('travelText', e.target.value)} className={inputCls} placeholder="เช่น สนับสนุนแบบเหมาจ่าย 1,000 บาท" />
        </Field>

        <Field label="สถานะหลักสูตร">
          <select value={form.status} onChange={(e) => change('status', e.target.value)} className={inputCls}>
            <option value="ร่าง">ร่าง (ยังไม่เปิดสาธารณะ)</option>
            <option value="เปิดรับสมัคร">เปิดรับสมัคร</option>
            <option value="เปิดทำแบบประเมิน">เปิดทำแบบประเมิน</option>
            <option value="ปิดรับสมัคร">ปิดรับสมัคร</option>
            <option value="จบโครงการ">จบโครงการ</option>
          </select>
        </Field>

        <Field label="สถานที่อบรม" icon={<MapPin className="w-4 h-4" />} className="md:col-span-2">
          <input value={form.location || ''} onChange={(e) => change('location', e.target.value)} className={inputCls} />
        </Field>

        <Field label="URL รูปแบนเนอร์" icon={<ImageIcon className="w-4 h-4" />} className="md:col-span-2">
          <input value={form.image || ''} onChange={(e) => change('image', e.target.value)} className={inputCls} placeholder="https://..." />
          {form.image && (
            <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-yrugray-700 aspect-[16/9] bg-slate-100 max-w-sm">
              <img src={form.image} alt="preview" className="w-full h-full object-cover" />
            </div>
          )}
        </Field>

        <Field label="รายละเอียดหลักสูตร" className="md:col-span-2">
          <textarea value={form.description || ''} onChange={(e) => change('description', e.target.value)} rows={5} className={`${inputCls} resize-none`} />
        </Field>
      </div>

      <div className="px-6 py-4 border-t border-slate-200 dark:border-yrugray-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-yrugray-900/50">
        {saved && (
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            บันทึกการเปลี่ยนแปลงสำเร็จ
          </span>
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-yrupink-600 hover:bg-yrupink-500 disabled:opacity-60 text-white text-sm font-semibold shadow-md shadow-yrupink-500/20 transition-all flex items-center gap-2"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...</> : <><Save className="w-4 h-4" /> บันทึกการแก้ไข</>}
        </button>
      </div>
    </form>
  );
};

const DeleteConfirmModal = ({ activity, onClose, onConfirm }) => createPortal(
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
    <div onClick={onClose} className="absolute inset-0" />
    <div className="relative bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">ยืนยันการลบหลักสูตร</h3>
      <p className="text-sm text-slate-600 dark:text-yrugray-300 mb-1">คุณแน่ใจหรือไม่ว่าต้องการลบ</p>
      <p className="text-sm font-bold text-slate-900 dark:text-white mb-6 line-clamp-2">"{activity.title}"</p>
      <div className="flex items-center justify-center gap-3">
        <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-yrugray-300 bg-slate-100 dark:bg-yrugray-800 hover:bg-slate-200 transition-colors">ยกเลิก</button>
        <button onClick={onConfirm} className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-md shadow-rose-600/20 transition-all flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          ยืนยันการลบ
        </button>
      </div>
    </div>
  </div>,
  document.body,
);

const StatusBadge = ({ status }) => {
  const map = {
    'เปิดรับสมัคร':     'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
    'เปิดทำแบบประเมิน': 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800',
    'ปิดรับสมัคร':      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
    'จบโครงการ':        'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    'ร่าง':             'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
  };
  const fallback = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400';
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full border backdrop-blur-xs ${map[status] || fallback}`}>
      {status}
    </span>
  );
};

const Field = ({ label, icon, required, className = '', children }) => (
  <div className={className}>
    <label className="text-sm font-semibold text-slate-800 dark:text-yrugray-200 mb-1.5 flex items-center gap-1.5">
      {icon}
      {label}
      {required && <span className="text-yrupink-500">*</span>}
    </label>
    {children}
  </div>
);

export default ManageActivities;