import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Search,
  Filter,
  Pencil,
  Trash2,
  X,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock as ClockIcon,
  AlertTriangle,
  Save,
  Users,
  Download,
  Loader2,
} from 'lucide-react';
import { registrationsApi } from '../api';

const inputCls =
  'w-full bg-white dark:bg-yrugray-800 border border-slate-300 dark:border-yrugray-700 text-[15px] rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-yrugray-500 focus:outline-none focus:border-yrupink-500 focus:ring-1 focus:ring-yrupink-500 transition-all';

// Map Thai UI status labels ⇄ API enum values
const STATUS_UI_TO_API = { 'รอตรวจสอบ': 'pending', 'อนุมัติ': 'confirmed', 'ปฏิเสธ': 'cancelled' };
const STATUS_API_TO_UI = { pending: 'รอตรวจสอบ', confirmed: 'อนุมัติ', attended: 'อนุมัติ', cancelled: 'ปฏิเสธ' };

// Client-side CSV export — no backend endpoint needed. Uses UTF-8 BOM so
// Excel opens Thai correctly, and quotes every value defensively.
const csvEscape = (v) => {
  const s = v == null ? '' : String(v);
  return `"${s.replace(/"/g, '""')}"`;
};
function exportCsv(activity, rows) {
  const headers = ['ชื่อ - นามสกุล', 'อีเมล', 'เบอร์โทร', 'หน่วยงาน', 'ตำแหน่ง', 'วันที่สมัคร', 'สถานะ', 'หมายเหตุ'];
  const body = rows.map((r) => [
    r.fullName, r.email, r.phone, r.organization, r.position,
    r.registeredAt, r.status, r.note,
  ].map(csvEscape).join(','));
  const csv = '﻿' + [headers.map(csvEscape).join(','), ...body].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  const safeName = (activity.title || 'activity').replace(/[\\/:*?"<>|]/g, '_').slice(0, 60);
  a.href = URL.createObjectURL(blob);
  a.download = `registrants-${safeName}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

const ActivityRegistrants = ({ activity, onBack, embedded = false }) => {
  const [registrants, setRegistrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ทั้งหมด');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Normalize API row → the shape the table/modal UI expects
  const normalize = (r) => ({
    id: r.id,
    fullName: `${r.first_name} ${r.last_name}`.trim(),
    first_name: r.first_name,
    last_name: r.last_name,
    email: r.email,
    phone: r.phone,
    organization: r.organization,
    position: r.position,
    registeredAt: r.registered_at ? new Date(r.registered_at).toLocaleDateString('th-TH') : '',
    status: STATUS_API_TO_UI[r.registration_status] || r.registration_status,
    note: r.note,
    _apiStatus: r.registration_status,
  });

  const reload = () => {
    setLoading(true);
    setLoadError(null);
    registrationsApi.listForActivity(activity.id)
      .then((rows) => setRegistrants((rows || []).map(normalize)))
      .catch((e) => setLoadError(e))
      .finally(() => setLoading(false));
  };
  useEffect(() => { reload(); }, [activity.id]);

  const statuses = ['ทั้งหมด', 'รอตรวจสอบ', 'อนุมัติ', 'ปฏิเสธ'];

  const filtered = useMemo(() => {
    return registrants.filter((r) => {
      const matchStatus = statusFilter === 'ทั้งหมด' || r.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.organization || '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [registrants, searchQuery, statusFilter]);

  const counts = useMemo(
    () => ({
      total: registrants.length,
      pending: registrants.filter((r) => r.status === 'รอตรวจสอบ').length,
      approved: registrants.filter((r) => r.status === 'อนุมัติ').length,
      rejected: registrants.filter((r) => r.status === 'ปฏิเสธ').length,
    }),
    [registrants]
  );

  const updateStatus = async (id, uiStatus) => {
    try {
      await registrationsApi.updateStatus(id, STATUS_UI_TO_API[uiStatus] || uiStatus);
      reload();
    } catch (e) {
      alert(`เปลี่ยนสถานะไม่สำเร็จ: ${e.message}`);
    }
  };

  const updateRegistrant = async (updated) => {
    // MVP: only status change is round-tripped to backend here.
    // Full participant edit could POST to /api/participants/:id in a follow-up.
    try {
      await registrationsApi.updateStatus(
        updated.id,
        STATUS_UI_TO_API[updated.status] || updated.status,
        updated.note ?? undefined
      );
      setEditing(null);
      reload();
    } catch (e) {
      alert(`บันทึกไม่สำเร็จ: ${e.message}`);
    }
  };

  const removeRegistrant = async () => {
    try {
      await registrationsApi.remove(deleting.id);
      setDeleting(null);
      reload();
    } catch (e) {
      alert(`ลบไม่สำเร็จ: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header — hidden when embedded inside another page's own layout */}
      {!embedded && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-slate-100 dark:bg-yrugray-800 hover:bg-slate-200 dark:hover:bg-yrugray-700 border border-slate-300 dark:border-yrugray-700 text-slate-600 dark:text-yrugray-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="กลับหน้าจัดการหลักสูตร"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-sm text-slate-600 dark:text-yrugray-400 mb-0.5">รายชื่อผู้ลงทะเบียน</p>
              <h2 className="text-[22px] md:text-2xl font-bold text-slate-900 dark:text-white line-clamp-1 leading-tight">{activity.title}</h2>
              <p className="text-sm text-yrupink-600 dark:text-yrupink-400 mt-0.5 font-medium">
                {activity.date && <>{activity.date} • </>}
                ที่นั่ง {activity.seats || '∞'} คน
              </p>
            </div>
          </div>
          <button
            onClick={() => exportCsv(activity, filtered)}
            disabled={filtered.length === 0}
            className="px-4 py-2 bg-slate-100 dark:bg-yrugray-800 hover:bg-slate-200 dark:hover:bg-yrugray-700 text-slate-800 dark:text-white text-[15px] font-semibold rounded-lg border border-slate-300 dark:border-yrugray-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            ส่งออก CSV
          </button>
        </div>
      )}

      {/* When embedded: still expose the CSV button in a lightweight strip */}
      {embedded && (
        <div className="flex items-center justify-end">
          <button
            onClick={() => exportCsv(activity, filtered)}
            disabled={filtered.length === 0}
            className="px-4 py-2 bg-slate-100 dark:bg-yrugray-800 hover:bg-slate-200 dark:hover:bg-yrugray-700 text-slate-800 dark:text-white text-[15px] font-semibold rounded-lg border border-slate-300 dark:border-yrugray-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            ส่งออก CSV
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5 text-yrupink-400" />}
          label="ผู้ลงทะเบียนทั้งหมด"
          value={`${counts.total} / ${activity.seats}`}
          hint={`${Math.round((counts.total / activity.seats) * 100 || 0)}% ของที่นั่ง`}
        />
        <StatCard
          icon={<ClockIcon className="w-5 h-5 text-yellow-400" />}
          label="รอตรวจสอบ"
          value={counts.pending}
          hint="รอผู้ดูแลอนุมัติ"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-400" />}
          label="อนุมัติแล้ว"
          value={counts.approved}
          hint="ยืนยันสิทธิ์เข้าอบรม"
        />
        <StatCard
          icon={<XCircle className="w-5 h-5 text-red-400" />}
          label="ปฏิเสธ"
          value={counts.rejected}
          hint="ไม่ผ่านเงื่อนไข"
        />
      </div>

      {/* Search + Filter */}
      <div className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="w-4 h-4 text-slate-400 dark:text-yrugray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหา ชื่อ, อีเมล, หน่วยงาน..."
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

      {/* Table */}
      <div className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            {loading ? (
              <>
                <Loader2 className="w-8 h-8 text-yrupink-500 animate-spin mx-auto mb-3" />
                <p className="text-slate-600 dark:text-yrugray-400 text-[15px]">กำลังโหลดรายชื่อ...</p>
              </>
            ) : loadError ? (
              <>
                <div className="w-14 h-14 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-slate-800 dark:text-yrugray-200 text-[15px] font-semibold mb-1">โหลดข้อมูลไม่สำเร็จ</p>
                <p className="text-sm text-slate-600 dark:text-yrugray-400 mb-4">{loadError.message}</p>
                <button onClick={reload} className="px-4 py-2 bg-slate-100 dark:bg-yrugray-800 hover:bg-slate-200 dark:hover:bg-yrugray-700 text-[15px] font-medium rounded-lg">
                  ลองใหม่
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-slate-100 dark:bg-yrugray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-slate-500 dark:text-yrugray-500" />
                </div>
                <p className="text-slate-700 dark:text-yrugray-300 text-[15px] font-medium mb-1">
                  {registrants.length === 0
                    ? 'ยังไม่มีผู้ลงทะเบียนในหลักสูตรนี้'
                    : 'ไม่พบผู้ลงทะเบียนที่ตรงกับเงื่อนไข'}
                </p>
                {registrants.length > 0 && searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-sm text-yrupink-600 dark:text-yrupink-400 hover:underline">
                    ล้างคำค้นหา
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-yrugray-900/50 border-b border-slate-200 dark:border-yrugray-800">
                <tr className="text-left text-[13px] font-semibold text-slate-700 dark:text-yrugray-300 uppercase tracking-wider">
                  <th className="px-6 py-4">ผู้ลงทะเบียน</th>
                  <th className="px-6 py-4">ติดต่อ</th>
                  <th className="px-6 py-4">หน่วยงาน</th>
                  <th className="px-6 py-4">วันที่สมัคร</th>
                  <th className="px-6 py-4">สถานะ</th>
                  <th className="px-6 py-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-yrugray-800">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-100/60 dark:hover:bg-yrugray-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yrupink-500 to-yrupink-700 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                          {r.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-slate-900 dark:text-white">{r.fullName}</p>
                          <p className="text-sm text-slate-600 dark:text-yrugray-400">{r.position || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[15px] text-slate-800 dark:text-yrugray-200 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-500 dark:text-yrugray-500" />
                        {r.email}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-yrugray-400 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500 dark:text-yrugray-500" />
                        {r.phone}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[15px] text-slate-800 dark:text-yrugray-200 line-clamp-1 max-w-[200px]">
                        {r.organization || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[15px] text-slate-800 dark:text-yrugray-200 tabular-nums">{r.registeredAt}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {r.status !== 'อนุมัติ' && (
                          <button
                            onClick={() => updateStatus(r.id, 'อนุมัติ')}
                            title="อนุมัติ"
                            className="p-2 text-slate-600 dark:text-yrugray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {r.status !== 'ปฏิเสธ' && (
                          <button
                            onClick={() => updateStatus(r.id, 'ปฏิเสธ')}
                            title="ปฏิเสธ"
                            className="p-2 text-slate-600 dark:text-yrugray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setEditing(r)}
                          title="แก้ไข"
                          className="p-2 text-slate-600 dark:text-yrugray-400 hover:text-yrupink-600 dark:hover:text-yrupink-400 hover:bg-yrupink-500/10 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(r)}
                          title="ลบ"
                          className="p-2 text-slate-600 dark:text-yrugray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <EditRegistrantModal
          registrant={editing}
          onClose={() => setEditing(null)}
          onSave={updateRegistrant}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleting && (
        <DeleteConfirmModal
          registrant={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={removeRegistrant}
        />
      )}
    </div>
  );
};

// ---- Sub components ----

const StatCard = ({ icon, label, value, hint }) => (
  <div className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl p-5">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 bg-slate-100 dark:bg-yrugray-800 rounded-lg">{icon}</div>
    </div>
    <p className="text-[15px] font-semibold text-slate-700 dark:text-yrugray-300 mb-1">{label}</p>
    <p className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">{value}</p>
    <p className="text-sm text-slate-600 dark:text-yrugray-400 mt-1">{hint}</p>
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    รอตรวจสอบ: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/30',
    อนุมัติ:   'bg-green-100 text-green-700 border-green-300 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30',
    ปฏิเสธ:    'bg-red-100 text-red-700 border-red-300 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30',
  };
  const fallback = 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/30';
  return (
    <span
      className={`px-2.5 py-1 text-[13px] font-semibold rounded-full border ${map[status] || fallback}`}
    >
      {status}
    </span>
  );
};

const ModalShell = ({ children, onClose, size = 'md' }) => {
  const sizeCls = size === 'lg' ? 'max-w-2xl' : 'max-w-md';
  // Portal to <body> to escape the AdminDashboard sticky-header stacking
  // context (same fix as ManageActivities modals).
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div onClick={onClose} className="absolute inset-0" />
      <div
        className={`relative my-8 bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl shadow-2xl w-full ${sizeCls} max-h-[90vh] overflow-hidden flex flex-col`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};

const EditRegistrantModal = ({ registrant, onClose, onSave }) => {
  const [form, setForm] = useState(registrant);
  const change = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <ModalShell onClose={onClose} size="lg">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-yrugray-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Pencil className="w-5 h-5 text-yrupink-500 dark:text-yrupink-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">แก้ไขข้อมูลผู้ลงทะเบียน</h3>
        </div>
        <button onClick={onClose} className="text-slate-500 dark:text-yrugray-400 hover:text-slate-900 dark:hover:text-white p-1 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={submit} className="overflow-y-auto flex-1">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="ชื่อ - นามสกุล" icon={<User className="w-4 h-4" />} required className="md:col-span-2">
            <input
              value={form.fullName}
              onChange={(e) => change('fullName', e.target.value)}
              required
              className={inputCls}
            />
          </Field>

          <Field label="อีเมล" icon={<Mail className="w-4 h-4" />} required>
            <input
              type="email"
              value={form.email}
              onChange={(e) => change('email', e.target.value)}
              required
              className={inputCls}
            />
          </Field>

          <Field label="เบอร์โทร" icon={<Phone className="w-4 h-4" />} required>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => change('phone', e.target.value)}
              required
              className={inputCls}
            />
          </Field>

          <Field label="หน่วยงาน / สถานศึกษา" icon={<Building2 className="w-4 h-4" />}>
            <input
              value={form.organization || ''}
              onChange={(e) => change('organization', e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="ตำแหน่ง" icon={<Briefcase className="w-4 h-4" />}>
            <input
              value={form.position || ''}
              onChange={(e) => change('position', e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="สถานะ" className="md:col-span-2">
            <select
              value={form.status}
              onChange={(e) => change('status', e.target.value)}
              className={inputCls}
            >
              <option value="รอตรวจสอบ">รอตรวจสอบ</option>
              <option value="อนุมัติ">อนุมัติ</option>
              <option value="ปฏิเสธ">ปฏิเสธ</option>
            </select>
          </Field>

          <Field label="หมายเหตุ / ความคาดหวัง" icon={<MessageSquare className="w-4 h-4" />} className="md:col-span-2">
            <textarea
              value={form.note || ''}
              onChange={(e) => change('note', e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Field>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-yrugray-800 flex items-center justify-end gap-2 bg-white dark:bg-yrugray-900/50 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[15px] font-medium text-slate-700 dark:text-yrugray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-yrugray-800 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-yrupink-600 hover:bg-yrupink-500 text-white text-[15px] font-semibold shadow-lg shadow-yrupink-500/20 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            บันทึกการแก้ไข
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

const DeleteConfirmModal = ({ registrant, onClose, onConfirm }) => (
  <ModalShell onClose={onClose}>
    <div className="p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">ยืนยันการลบผู้ลงทะเบียน</h3>
      <p className="text-[15px] text-slate-700 dark:text-yrugray-300 mb-1">คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลของ</p>
      <p className="text-[15px] font-semibold text-slate-900 dark:text-white mb-4">"{registrant.fullName}"</p>
      <p className="text-sm text-slate-600 dark:text-yrugray-500 mb-6">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={onClose}
          className="px-5 py-2 rounded-lg text-[15px] font-medium text-slate-700 dark:text-yrugray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-yrugray-800 transition-colors border border-slate-300 dark:border-yrugray-700"
        >
          ยกเลิก
        </button>
        <button
          onClick={onConfirm}
          className="px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[15px] font-semibold shadow-lg shadow-red-500/20 transition-colors flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          ลบข้อมูล
        </button>
      </div>
    </div>
  </ModalShell>
);

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

export default ActivityRegistrants;
