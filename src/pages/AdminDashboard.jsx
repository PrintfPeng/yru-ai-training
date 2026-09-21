import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  LogOut,
  Bell,
  Search,
  Users,
  Award,
  Menu,
  PlusCircle,
  ClipboardCheck,
  AlertCircle,
  RefreshCw,
  CalendarRange,
} from 'lucide-react';
import CreateActivity from './CreateActivity';
import ManageActivities from './ManageActivities';
import CreateAssessment from './CreateAssessment';
import { activitiesApi } from '../api';

const ROLE_LABEL = {
  super_admin: 'ผู้ดูแลระบบสูงสุด',
  admin: 'ผู้ดูแลระบบ',
};

const STATUS_META = {
  draft:      { label: 'ร่าง',       cls: 'bg-yrugray-500/10 text-yrugray-300' },
  published:  { label: 'เผยแพร่แล้ว', cls: 'bg-green-500/10 text-green-400' },
  completed:  { label: 'สิ้นสุดแล้ว',  cls: 'bg-blue-500/10 text-blue-400' },
  cancelled:  { label: 'ยกเลิก',     cls: 'bg-red-500/10 text-red-400' },
};

const fmtThaiDate = (iso) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return iso; }
};

const AdminDashboard = ({ admin, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('ภาพรวมระบบ');

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const menuItems = [
    { name: 'ภาพรวมระบบ', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'สร้างกิจกรรม', icon: <PlusCircle className="w-5 h-5" /> },
    { name: 'จัดการหลักสูตร', icon: <BookOpen className="w-5 h-5" /> },
    { name: 'สร้างแบบฟอร์มประเมินและออกใบรับรอง', icon: <ClipboardCheck className="w-5 h-5" /> },
    { name: 'จัดการการจองห้อง', icon: <CalendarCheck className="w-5 h-5" /> },
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

  // Derived stats — all computed from the same activities list (uses v_activity_summary).
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
        icon: <BookOpen className="w-6 h-6 text-yrupink-400" />,
      },
      {
        title: 'ผู้ลงทะเบียนสะสม',
        value: totalRegistered,
        sub: `ยืนยันแล้ว ${totalConfirmed}`,
        icon: <Users className="w-6 h-6 text-yrupink-400" />,
      },
      {
        title: 'ผู้อบรมสำเร็จ',
        value: totalAttended,
        sub: 'นับตามใบรับรองที่ออก',
        icon: <Award className="w-6 h-6 text-yrupink-400" />,
      },
      {
        title: 'หลักสูตรที่กำลังจะมาถึง',
        value: upcoming,
        sub: 'สถานะเผยแพร่ + ยังไม่ถึงวันจัด',
        icon: <CalendarRange className="w-6 h-6 text-yrupink-400" />,
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
    <div className="min-h-screen bg-yrugray-950 flex font-sans text-white">

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-yrugray-900 border-r border-yrugray-800 transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Branding */}
        <div className="h-20 flex items-center px-6 border-b border-yrugray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yrupink-400 to-yrupink-700 rounded-lg flex items-center justify-center font-bold text-white shadow-lg text-sm">
              AI
            </div>
            <div>
              <span className="font-bold text-lg tracking-wide text-white block">CENTER <span className="text-yrupink-400">YRU</span></span>
              <span className="text-xs text-yrupink-400 font-medium bg-yrupink-500/10 px-2 py-0.5 rounded-full inline-block mt-0.5">ADMIN</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow py-6 px-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setActiveMenu(item.name);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeMenu === item.name
                ? 'bg-yrupink-600/10 text-yrupink-400 border border-yrupink-500/20 shadow-inner'
                : 'text-yrugray-400 hover:text-yrugray-100 hover:bg-yrugray-800/50'
              }`}
            >
              {item.icon}
              <span className="font-medium text-sm">{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-yrugray-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-yrugray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header */}
        <header className="h-20 bg-yrugray-900/80 backdrop-blur-md border-b border-yrugray-800 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-yrugray-400 hover:text-white"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white hidden sm:block">ภาพรวม / {activeMenu}</h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Search */}
            <div className="hidden md:flex items-center relative">
              <Search className="w-4 h-4 text-yrugray-500 absolute left-3" />
              <input
                type="text"
                placeholder="ค้นหา..."
                className="bg-yrugray-800 border border-yrugray-700 text-sm rounded-full pl-9 pr-4 py-2 text-white focus:outline-none focus:border-yrupink-500 focus:ring-1 focus:ring-yrupink-500 w-64 transition-all"
              />
            </div>

            {/* Notifications */}
            <button className="relative text-yrugray-400 hover:text-white transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-yrupink-500 rounded-full border-2 border-yrugray-900"></span>
            </button>

            {/* Profile */}
            <div className="flex items-center gap-3 pl-6 border-l border-yrugray-800 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white group-hover:text-yrupink-400 transition-colors">{adminDisplayName}</p>
                <p className="text-xs text-yrugray-500">{adminRoleLabel}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-yrugray-700 border-2 border-yrupink-500/50 flex items-center justify-center overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}`} alt={adminDisplayName} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-yrugray-950 relative">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[300px] bg-yrupink-600/5 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="max-w-7xl mx-auto space-y-8 relative z-10">
            {activeMenu === 'สร้างกิจกรรม' ? (
              <CreateActivity />
            ) : activeMenu === 'จัดการหลักสูตร' ? (
              <ManageActivities onGoCreate={() => setActiveMenu('สร้างกิจกรรม')} />
            ) : activeMenu === 'สร้างแบบฟอร์มประเมินและออกใบรับรอง' ? (
              <CreateAssessment />
            ) : (
              <>
                {/* Quick Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="bg-yrugray-900 border border-yrugray-800 rounded-2xl p-6 shadow-sm hover:border-yrupink-500/30 transition-colors group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-yrugray-800 rounded-xl group-hover:bg-yrupink-500/10 transition-colors">
                          {stat.icon}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-yrugray-400 text-sm font-medium mb-1">{stat.title}</h3>
                        <p className="text-3xl font-bold text-white">
                          {loading ? <span className="inline-block w-12 h-8 bg-yrugray-800 rounded animate-pulse" /> : stat.value.toLocaleString('th-TH')}
                        </p>
                        <p className="text-xs text-yrugray-500 mt-2">{stat.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Main Data Container */}
                <div className="bg-yrugray-900 border border-yrugray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-yrugray-800 flex justify-between items-center bg-yrugray-900/50">
                    <div>
                      <h3 className="text-lg font-bold text-white">หลักสูตรล่าสุด</h3>
                      <p className="text-xs text-yrugray-500 mt-1">
                        เรียงตามวันที่จัดล่าสุด — แสดง {recent.length} จาก {activities.length} รายการ
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRefreshTick((n) => n + 1)}
                        disabled={loading}
                        className="p-2 text-yrugray-400 hover:text-white hover:bg-yrugray-800 rounded-lg transition-colors disabled:opacity-50"
                        title="รีเฟรช"
                      >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => setActiveMenu('จัดการหลักสูตร')}
                        className="px-4 py-2 bg-yrupink-600 hover:bg-yrupink-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-yrupink-500/20 transition-colors"
                      >
                        ดูทั้งหมด
                      </button>
                    </div>
                  </div>

                  {error ? (
                    <div className="p-8 flex flex-col items-center justify-center text-center">
                      <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                      <p className="text-yrugray-300 font-medium mb-1">โหลดข้อมูลไม่สำเร็จ</p>
                      <p className="text-xs text-yrugray-500 mb-4">{error}</p>
                      <button
                        onClick={() => setRefreshTick((n) => n + 1)}
                        className="px-4 py-2 bg-yrugray-800 hover:bg-yrugray-700 text-sm rounded-lg"
                      >
                        ลองใหม่
                      </button>
                    </div>
                  ) : loading ? (
                    <div className="p-8 space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-14 bg-yrugray-800/50 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : recent.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-yrugray-800 rounded-full flex items-center justify-center mb-4">
                        <BookOpen className="w-8 h-8 text-yrugray-500" />
                      </div>
                      <h4 className="text-lg font-bold text-yrugray-300 mb-2">ยังไม่มีหลักสูตร</h4>
                      <p className="text-yrugray-500 mb-6 max-w-md">
                        เริ่มต้นด้วยการสร้างหลักสูตรแรก แล้วเปิดให้ผู้เรียนลงทะเบียนได้ทันที
                      </p>
                      <button
                        onClick={() => setActiveMenu('สร้างกิจกรรม')}
                        className="px-4 py-2 bg-yrupink-600 hover:bg-yrupink-500 text-white text-sm font-semibold rounded-lg"
                      >
                        + สร้างกิจกรรม
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-yrugray-900/50 text-yrugray-400 text-xs uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-3 text-left font-medium">หลักสูตร</th>
                            <th className="px-6 py-3 text-left font-medium hidden md:table-cell">วันที่จัด</th>
                            <th className="px-6 py-3 text-left font-medium hidden lg:table-cell">สถานที่</th>
                            <th className="px-6 py-3 text-center font-medium">ผู้ลงทะเบียน</th>
                            <th className="px-6 py-3 text-center font-medium">สถานะ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-yrugray-800">
                          {recent.map((a) => {
                            const status = STATUS_META[a.status] || { label: a.status, cls: 'bg-yrugray-500/10 text-yrugray-400' };
                            const registered = Number(a.total_registered) || 0;
                            const capacity   = Number(a.capacity) || 0;
                            return (
                              <tr key={a.id} className="hover:bg-yrugray-800/40 transition-colors">
                                <td className="px-6 py-4">
                                  <p className="font-medium text-white line-clamp-1">{a.title}</p>
                                  <p className="text-xs text-yrugray-500 mt-0.5 md:hidden">
                                    {fmtThaiDate(a.start_date)}
                                  </p>
                                </td>
                                <td className="px-6 py-4 text-yrugray-300 hidden md:table-cell">
                                  {fmtThaiDate(a.start_date)}
                                </td>
                                <td className="px-6 py-4 text-yrugray-400 hidden lg:table-cell">
                                  {a.location || '-'}
                                </td>
                                <td className="px-6 py-4 text-center text-yrugray-300">
                                  {registered}{capacity > 0 ? ` / ${capacity}` : ''}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.cls}`}>
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
  );
};

export default AdminDashboard;
