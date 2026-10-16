import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarCheck,
  RefreshCw,
  Search,
  ExternalLink,
  Clock,
  Phone,
  Building2,
  Users,
  CalendarDays,
  CalendarRange,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { roomsApi } from '../api';
import { errorMessage } from '../utils/errorMessage';

// ลิงก์ Google Sheet/ฟอร์มจองห้อง (เปิดดู/จองเพิ่มได้ — หน้านี้อ่านอย่างเดียว)
const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/16kTVFVuZNuCpChaN557EusPtbpwrK-Hx3Ld8Kl80dRE/edit?gid=0#gid=0';

const inputCls =
  'w-full bg-white dark:bg-yrugray-800 border border-slate-300 dark:border-yrugray-700 text-[15px] rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-yrugray-500 focus:outline-none focus:border-yrupink-500 focus:ring-1 focus:ring-yrupink-500 transition-all';

// YYYY-MM-DD ของวันนี้ (ตาม local) ใช้เทียบแบบ string ได้ตรง ๆ
const todayStr = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

// "2025-10-20" → "20 ต.ค. 2568" (ปี พ.ศ. ผ่าน locale th-TH). เผื่อรูปแบบเพี้ยน → คืนค่าเดิม
const formatThai = (raw) => {
  if (!raw) return '-';
  const d = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
};

const RoomBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('upcoming'); // upcoming | today | all

  const load = (force = false) => {
    if (force) setRefreshing(true); else setLoading(true);
    setLoadError(null);
    roomsApi
      .listBookings(force ? { refresh: 1 } : {})
      .then((rows) => setBookings(Array.isArray(rows) ? rows : []))
      .catch((e) => setLoadError(e))
      .finally(() => { setLoading(false); setRefreshing(false); });
  };
  useEffect(() => { load(); }, []);

  const today = todayStr();

  const counts = useMemo(() => ({
    total: bookings.length,
    today: bookings.filter((b) => b.date === today).length,
    upcoming: bookings.filter((b) => b.date >= today).length,
  }), [bookings, today]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      if (dateFilter === 'today' && b.date !== today) return false;
      if (dateFilter === 'upcoming' && !(b.date >= today)) return false;
      if (!q) return true;
      return (
        (b.booker || '').toLowerCase().includes(q) ||
        (b.organization || '').toLowerCase().includes(q) ||
        (b.purpose || '').toLowerCase().includes(q) ||
        (b.phone || '').toLowerCase().includes(q)
      );
    });
  }, [bookings, search, dateFilter, today]);

  const filterBtns = [
    ['upcoming', 'กำลังจะถึง'],
    ['today', 'วันนี้'],
    ['all', 'ทั้งหมด'],
  ];

  return (
    <div className="space-y-6">
      {/* Header strip */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-slate-600 dark:text-yrugray-400 mb-0.5">จัดการการจองห้อง</p>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
            รายการจองห้องประชุม
          </h2>
          <p className="text-xs text-slate-500 dark:text-yrugray-400 mt-0.5">
            ดึงข้อมูลจาก Google Sheet (อ่านอย่างเดียว) — จองเพิ่ม/แก้ไขที่ชีตโดยตรง
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            disabled={loading || refreshing}
            className="p-2.5 text-slate-600 dark:text-yrugray-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-yrugray-800 border border-slate-300 dark:border-yrugray-700 hover:bg-slate-50 dark:hover:bg-yrugray-700 rounded-lg transition-all disabled:opacity-50"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <a
            href={SHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-yrupink-600 hover:bg-yrupink-500 text-white text-[15px] font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            เปิด Google Sheet
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<Users className="w-5 h-5 text-yrupink-400" />} label="การจองทั้งหมด" value={counts.total} />
        <StatCard icon={<CalendarRange className="w-5 h-5 text-amber-500" />} label="กำลังจะถึง" value={counts.upcoming} />
        <StatCard icon={<CalendarDays className="w-5 h-5 text-emerald-500" />} label="วันนี้" value={counts.today} />
      </div>

      {/* Search + filter */}
      <div className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="w-4 h-4 text-slate-400 dark:text-yrugray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหา ผู้จอง, หน่วยงาน, วัตถุประสงค์, เบอร์..."
            className={`${inputCls} pl-9`}
          />
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-yrugray-800 rounded-lg p-1">
          {filterBtns.map(([val, label]) => (
            <button
              key={val}
              onClick={() => setDateFilter(val)}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors ${
                dateFilter === val
                  ? 'bg-yrupink-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-yrugray-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {label}
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
                <p className="text-slate-600 dark:text-yrugray-400 text-[15px]">กำลังโหลดข้อมูลการจอง...</p>
              </>
            ) : loadError ? (
              <>
                <div className="w-14 h-14 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-slate-800 dark:text-yrugray-200 text-[15px] font-semibold mb-1">โหลดข้อมูลไม่สำเร็จ</p>
                <p className="text-sm text-slate-600 dark:text-yrugray-400 mb-4">{errorMessage(loadError, 'ดึงข้อมูลจาก Google Sheet ไม่สำเร็จ')}</p>
                <button onClick={() => load(true)} className="px-4 py-2 bg-slate-100 dark:bg-yrugray-800 hover:bg-slate-200 dark:hover:bg-yrugray-700 text-[15px] font-medium rounded-lg text-slate-700 dark:text-slate-200">
                  ลองใหม่
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-slate-100 dark:bg-yrugray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CalendarCheck className="w-6 h-6 text-slate-500 dark:text-yrugray-500" />
                </div>
                <p className="text-slate-700 dark:text-yrugray-300 text-[15px] font-medium mb-1">
                  {bookings.length === 0 ? 'ยังไม่มีรายการจองห้อง' : 'ไม่พบรายการที่ตรงกับเงื่อนไข'}
                </p>
                {bookings.length > 0 && (search || dateFilter !== 'all') && (
                  <button
                    onClick={() => { setSearch(''); setDateFilter('all'); }}
                    className="text-sm text-yrupink-600 dark:text-yrupink-400 hover:underline"
                  >
                    ล้างตัวกรอง
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
                  <th className="px-5 py-4">วันที่</th>
                  <th className="px-5 py-4">เวลา</th>
                  <th className="px-5 py-4">ผู้จอง</th>
                  <th className="px-5 py-4">หน่วยงาน</th>
                  <th className="px-5 py-4">วัตถุประสงค์</th>
                  <th className="px-5 py-4">เบอร์ติดต่อ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-yrugray-800 text-[15px]">
                {filtered.map((b, i) => (
                  <tr key={i} className="hover:bg-slate-100/60 dark:hover:bg-yrugray-800/40 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`font-medium ${b.date === today ? 'text-yrupink-600 dark:text-yrupink-400' : 'text-slate-900 dark:text-white'}`}>
                        {formatThai(b.date)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-700 dark:text-yrugray-200">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-yrugray-500" />
                        {b.timeFrom || '-'}{b.timeTo ? ` - ${b.timeTo}` : ''}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-900 dark:text-white font-medium">{b.booker || '-'}</td>
                    <td className="px-5 py-3.5 text-slate-700 dark:text-yrugray-200">
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-yrugray-500 shrink-0" />
                        <span className="line-clamp-1 max-w-[200px]">{b.organization || '-'}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 dark:text-yrugray-200">
                      <span className="line-clamp-2 max-w-[280px]">{b.purpose || '-'}</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-700 dark:text-yrugray-200">
                      {b.phone ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400 dark:text-yrugray-500" />
                          {b.phone}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !loadError && filtered.length > 0 && (
        <p className="text-xs text-slate-500 dark:text-yrugray-400 text-right">
          แสดง {filtered.length} จากทั้งหมด {bookings.length} รายการ
        </p>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl p-5">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 bg-slate-100 dark:bg-yrugray-800 rounded-lg">{icon}</div>
    </div>
    <p className="text-[15px] font-semibold text-slate-700 dark:text-yrugray-300 mb-1">{label}</p>
    <p className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">{value.toLocaleString('th-TH')}</p>
  </div>
);

export default RoomBookings;
