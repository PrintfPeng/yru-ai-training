import React, { useState, useEffect, useMemo } from 'react';
import { formatThaiDate as fmtThaiDate } from '../utils/thaiDate';
import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  LogOut,
  Bell,
  Users,
  Award,
  Menu,
  X,
  AlertCircle,
  RefreshCw,
  CalendarRange,
} from 'lucide-react';
import CreateActivity from './CreateActivity';
import ManageActivities from './ManageActivities';
import RoomBookings from './RoomBookings';
import ThemeToggle from '../components/ThemeToggle';
import Navbar from '../components/Navbar';
import { activitiesApi } from '../api';

const ROLE_LABEL = {
  super_admin: 'ผู้ดูแลระบบสูงสุด',
  admin: 'ผู้ดูแลระบบ',
};

const STATUS_META = {
  draft:      { label: 'ร่าง',       cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700' },
  published:  { label: 'เผยแพร่แล้ว', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60' },
  completed:  { label: 'สิ้นสุดแล้ว',  cls: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/60' },
  cancelled:  { label: 'ยกเลิก',     cls: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60' },
};

const STATUS_FALLBACK_CLS = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700';

const TAB_SLUG = {
  'ภาพรวมระบบ': 'overview',
  'จัดการหลักสูตร': 'courses',
  'จัดการการจองห้อง': 'rooms',
  'สร้างกิจกรรม': 'create',
};
const SLUG_TAB = Object.fromEntries(Object.entries(TAB_SLUG).map(([k, v]) => [v, k]));
const readTab = () => {
  try {
    const t = new URLSearchParams(window.location.search).get('tab');
    return SLUG_TAB[t] || 'ภาพรวมระบบ';
  } catch { return 'ภาพรวมระบบ'; }
};

const AdminDashboard = ({ admin, onLogout, onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(() => readTab());
  // When a new activity is created we jump to "จัดการหลักสูตร" and ask it to
  // open that activity's detail panel straight away.
  const [openActivityId, setOpenActivityId] = useState(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const slug = TAB_SLUG[activeMenu] || 'overview';
      if (slug === 'overview') params.delete('tab'); else params.set('tab', slug);
      const qs = params.toString();
      const next = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash;
      if (next !== window.location.pathname + window.location.search + window.location.hash) {
        window.history.replaceState(window.history.state, '', next);
      }
    } catch { /* ignore */ }
  }, [activeMenu]);

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const menuItems = [
    { name: 'ภาพรวมระบบ', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'จัดการหลักสูตร', icon: <BookOpen className="w-4 h-4" /> },
    { name: 'จัดการการจองห้อง', icon: <CalendarCheck className="w-4 h-4" /> },
  ];

  useEffect(() => {
    let cancelled = false; 
    setLoading(true);
    setError(null);
    activitiesApi.list({ limit: 200 })
      .then((rows) => { if (!cancelled) setActivities(Array.isArray(rows) ? rows : []); })
      .catch((err) => { if (!cancelled) setError(err?.message || 'โหลดข้อมูลไม่สำเร็จ'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refreshTick]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('admin-scale');
    return () => root.classList.remove('admin-scale');
  }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const total = activities.length;
    const published = activities.filter((a) => a.status === 'published').length;
    const upcoming = activities.filter(
      (a) => a.status === 'published' && a.start_date && new Date(a.start_date).getTime() >= now,
    ).length;
    const totalRegistered = activities.reduce((s, a) => s + (Number(a.total_registered) || 0), 0);
    const totalAttended   = activities.reduce((s, a) => s + (Number(a.total_attended)   || 0), 0);
    const totalConfirmed  = activities.reduce((s, a) => s + (Number(a.total_confirmed)  || 0), 0);

    return [
      {
        title: 'หลักสูตรทั้งหมด',
        value: total,
        sub: `เผยแพร่แล้ว ${published}`,
        icon: <BookOpen className="w-4 h-4 text-yrupink-500" />,
        badgeColor: 'bg-yrupink-500/10 dark:bg-yrupink-500/20 text-yrupink-600 dark:text-yrupink-400',
      },
      {
        title: 'ผู้ลงทะเบียนทั้งหมด',
        value: totalRegistered,
        sub: `ยืนยันแล้ว ${totalConfirmed}`,
        icon: <Users className="w-4 h-4 text-blue-500" />,
        badgeColor: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
      },
      {
        title: 'ผู้ตอบแบบประเมิน',
        value: totalAttended,
        sub: 'นับตามใบรับรองที่ออก',
        icon: <Award className="w-4 h-4 text-emerald-500" />,
        badgeColor: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      },
      {
        title: 'กำลังจะมาถึง',
        value: upcoming,
        sub: 'สถานะเผยแพร่ + ยังไม่ถึงวันจัด',
        icon: <CalendarRange className="w-4 h-4 text-amber-500" />,
        badgeColor: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
      },
    ];
  }, [activities]);

  const recent = useMemo(() => activities.slice(0, 8), [activities]);

  const adminDisplayName = admin
    ? `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || admin.username
    : 'ผู้ดูแลระบบ';
  const adminRoleLabel = ROLE_LABEL[admin?.role] || 'ผู้ดูแลระบบ';
  const avatarSeed = admin?.username || 'Admin';

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-yrugray-950 flex flex-col font-sans text-slate-900 dark:text-white antialiased text-sm">

      {/* Public site navbar — lets the admin jump back to the public pages.
          Wrapped so admin-scale (120%) doesn't make it bigger than on public pages. */}
      <div className="admin-navbar-unscale">
        <Navbar onNavigate={onNavigate} isAdmin />
      </div>

      <div className="flex flex-1 min-h-0">

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ปรับขนาดความกว้างให้พอดี w-64 */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-yrugray-900 border-r border-slate-200/80 dark:border-yrugray-800 shadow-xl lg:shadow-none transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Section label — brand ตัดออก (ไปแสดงที่ navbar ด้านบนแล้ว) กัน AI CENTER YRU ซ้ำ */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200/80 dark:border-yrugray-800">
          <span className="text-xs font-bold text-yrupink-600 dark:text-yrupink-400 tracking-wider uppercase bg-yrupink-500/10 px-2.5 py-1 rounded">
            เมนูผู้ดูแลระบบ
          </span>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-grow py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeMenu === item.name;
            return (
              <button
                key={item.name}
                onClick={() => {
                  setActiveMenu(item.name);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-150 group ${
                  isActive
                  ? 'bg-yrupink-600 text-white shadow-sm shadow-yrupink-600/20 font-medium'
                  : 'text-slate-600 dark:text-yrugray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-yrugray-800/60 font-normal'
                }`}
              >
                <span className={`transition-transform duration-150 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-yrupink-500'}`}>
                  {item.icon}
                </span>
                <span className="text-xs sm:text-sm leading-snug text-left">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-200/80 dark:border-yrugray-800 bg-slate-50/50 dark:bg-yrugray-900/50">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-600 dark:text-yrugray-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-150 font-normal"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
            <span className="text-xs sm:text-sm">ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header */}
        <header className="h-16 bg-white/80 dark:bg-yrugray-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-yrugray-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 rounded-lg text-slate-600 dark:text-yrugray-300 hover:bg-slate-100 dark:hover:bg-yrugray-800 transition-colors"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="เปิดเมนู"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span className="text-slate-400 font-normal hidden md:inline">ภาพรวม</span> 
                <span className="text-slate-300 dark:text-slate-700 hidden md:inline">/</span> 
                <span>{activeMenu}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Theme toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <button 
              className="relative p-1.5 rounded-lg text-slate-600 dark:text-yrugray-300 hover:bg-slate-100 dark:hover:bg-yrugray-800 transition-colors"
              aria-label="การแจ้งเตือน"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-yrupink-500 rounded-full ring-2 ring-white dark:ring-yrugray-900"></span>
            </button>

            {/* Profile */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-yrugray-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">{adminDisplayName}</p>
                <p className="text-[11px] text-yrupink-600 dark:text-yrupink-400 font-medium">{adminRoleLabel}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yrupink-500 to-yrupink-300 p-0.5 shadow-xs">
                <div className="w-full h-full rounded-full bg-white dark:bg-yrugray-800 overflow-hidden flex items-center justify-center">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}`} alt={adminDisplayName} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/70 dark:bg-yrugray-950 relative">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] max-w-4xl h-[200px] bg-yrupink-500/5 dark:bg-yrupink-500/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="max-w-7xl mx-auto space-y-6 relative z-10">
            {activeMenu === 'สร้างกิจกรรม' ? (
              <CreateActivity
                onCreated={(created) => {
                  setOpenActivityId(created?.id ?? null);
                  setActiveMenu('จัดการหลักสูตร');
                }}
              />
            ) : activeMenu === 'จัดการหลักสูตร' ? (
              <ManageActivities
                onGoCreate={() => setActiveMenu('สร้างกิจกรรม')}
                initialSelectedId={openActivityId}
                onConsumedInitialSelect={() => setOpenActivityId(null)}
              />
            ) : activeMenu === 'จัดการการจองห้อง' ? (
              <RoomBookings />
            ) : (
              <>
                {/* Quick Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map((stat, index) => (
                    <div 
                      key={index} 
                      className="bg-white dark:bg-yrugray-900 border border-slate-200/80 dark:border-yrugray-800/80 rounded-xl p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-yrupink-500/40 transition-all duration-200 group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-slate-500 dark:text-yrugray-400 text-xs font-semibold tracking-wide">{stat.title}</span>
                        <div className={`p-2 rounded-lg ${stat.badgeColor} transition-transform group-hover:scale-105 duration-200`}>
                          {stat.icon}
                        </div>
                      </div>
                      <div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                          {loading ? <span className="inline-block w-16 h-8 bg-slate-200 dark:bg-yrugray-800 rounded animate-pulse" /> : stat.value.toLocaleString('th-TH')}
                        </p>
                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-yrugray-400 mt-1 font-medium">
                          {stat.sub}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Main Data Container */}
                <div className="bg-white dark:bg-yrugray-900 border border-slate-200/80 dark:border-yrugray-800/80 rounded-xl shadow-2xs overflow-hidden flex flex-col">
                  {/* Table Header Action Bar */}
                  <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-yrugray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50 dark:bg-yrugray-900/50">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">หลักสูตรล่าสุด</h3>
                      <p className="text-xs text-slate-500 dark:text-yrugray-400 mt-0.5">
                        แสดงข้อมูล {recent.length} จากทั้งหมด {activities.length} รายการ
                      </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => setRefreshTick((n) => n + 1)}
                        disabled={loading}
                        className="p-2 text-slate-600 dark:text-yrugray-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-yrugray-800 border border-slate-200 dark:border-yrugray-700 hover:bg-slate-50 dark:hover:bg-yrugray-700 rounded-lg transition-all disabled:opacity-50 shadow-2xs"
                        title="รีเฟรชข้อมูล"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => setActiveMenu('จัดการหลักสูตร')}
                        className="px-3.5 py-2 bg-yrupink-600 hover:bg-yrupink-500 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm shadow-yrupink-600/20 transition-all"
                      >
                        ดูทั้งหมด
                      </button>
                    </div>
                  </div>

                  {error ? (
                    <div className="p-10 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-xl flex items-center justify-center mb-2.5">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <p className="text-slate-900 dark:text-slate-100 font-bold text-sm mb-1">ไม่สามารถโหลดข้อมูลได้</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-xs">{error}</p>
                      <button
                        onClick={() => setRefreshTick((n) => n + 1)}
                        className="px-3.5 py-1.5 bg-slate-100 dark:bg-yrugray-800 hover:bg-slate-200 dark:hover:bg-yrugray-700 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        ลองใหม่อีกครั้ง
                      </button>
                    </div>
                  ) : loading ? (
                    <div className="p-5 space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-12 bg-slate-100 dark:bg-yrugray-800/60 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : recent.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-yrugray-800 rounded-xl flex items-center justify-center mb-3 text-slate-400">
                        <BookOpen className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">ยังไม่มีหลักสูตรในระบบ</h4>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-yrugray-400 mb-5 max-w-sm">
                        เริ่มต้นสร้างหลักสูตรแรกของคุณเพื่อให้ผู้เข้าร่วมสามารถลงทะเบียนได้ทันที
                      </p>
                      <button
                        onClick={() => setActiveMenu('สร้างกิจกรรม')}
                        className="px-4 py-2 bg-yrupink-600 hover:bg-yrupink-500 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm shadow-yrupink-600/20 transition-all"
                      >
                        + สร้างกิจกรรมใหม่
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/70 dark:bg-yrugray-900/70 border-b border-slate-200/80 dark:border-yrugray-800 text-slate-500 dark:text-yrugray-400 text-[11px] uppercase tracking-wider">
                            <th className="px-5 py-3 font-semibold">หลักสูตร / กิจกรรม</th>
                            <th className="px-5 py-3 font-semibold hidden md:table-cell">วันที่จัดกิจกรรม</th>
                            <th className="px-5 py-3 font-semibold hidden lg:table-cell">สถานที่</th>
                            <th className="px-5 py-3 font-semibold text-center">ผู้ลงทะเบียน</th>
                            <th className="px-5 py-3 font-semibold text-center">สถานะ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/60 dark:divide-yrugray-800 text-xs sm:text-sm">
                          {recent.map((a) => {
                            const status = STATUS_META[a.status] || { label: a.status, cls: STATUS_FALLBACK_CLS };
                            const registered = Number(a.total_registered) || 0;
                            const capacity   = Number(a.capacity) || 0;
                            return (
                              <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-yrugray-800/40 transition-colors">
                                <td className="px-5 py-3">
                                  <p className="font-semibold text-slate-900 dark:text-white line-clamp-1">{a.title}</p>
                                  <p className="text-[11px] text-slate-500 dark:text-yrugray-400 mt-0.5 md:hidden">
                                    {fmtThaiDate(a.start_date)}
                                  </p>
                                </td>
                                <td className="px-5 py-3 text-slate-700 dark:text-yrugray-300 font-medium hidden md:table-cell whitespace-nowrap">
                                  {fmtThaiDate(a.start_date)}
                                </td>
                                <td className="px-5 py-3 text-slate-600 dark:text-yrugray-400 hidden lg:table-cell max-w-xs break-words">
                                  {a.location || '-'}
                                </td>
                                <td className="px-5 py-3 text-center text-slate-700 dark:text-yrugray-200 font-semibold tabular-nums">
                                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-yrugray-800 text-xs">
                                    {registered}{capacity > 0 ? ` / ${capacity}` : ''}
                                  </span>
                                </td>
                                <td className="px-5 py-3 text-center">
                                  <span className={`inline-flex items-center justify-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${status.cls}`}>
                                    {status.label}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
      </div>
    </div>
  );
};

export default AdminDashboard;