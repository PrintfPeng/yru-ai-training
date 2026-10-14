import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, BookOpen, Calendar, Clock, Users, MapPin, Search, Filter, ArrowRight, Loader2, ClipboardList } from 'lucide-react';
import ActivityDetail from './ActivityDetail';
import { activitiesApi } from '../api';
import { formatThaiDate, durationText, registrationWindowState } from '../utils/thaiDate';

// Registration-status chip for a card, based on the real-time window state.
const cardBadge = (row) => {
  if (row?.status === 'assessment') {
    return { label: 'เปิดทำแบบประเมิน', cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/80 dark:text-sky-300' };
  }
  const ws = registrationWindowState(row?.register_open_at, row?.register_close_date);
  if (ws === 'before') return { label: 'ยังไม่เปิดรับสมัคร', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300' };
  if (ws === 'closed') return { label: 'ปิดรับสมัครแล้ว', cls: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800/80 dark:text-slate-300' };
  return { label: 'เปิดรับสมัคร', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300' };
};

// Normalize an API row into the card shape the UI expects.
const normalizeRow = (r) => ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  description: r.description,
  location: r.location,
  date: r.start_date ? formatThaiDate(r.start_date) : '',
  endDate: r.end_date ? formatThaiDate(r.end_date) : '',
  duration: r.end_date && r.start_date ? durationText(r.start_date, r.end_date) : '',
  seats: r.capacity,
  seats_left: r.seats_left,
  registrants_count: r.total_registered ?? 0, 
  registerCloseDateDisplay: r.register_close_date ? formatThaiDate(r.register_close_date) : '',
  image: r.cover_image_url,
  level: 'เริ่มต้น',
  category: '',
  raw: r,
});

// Read ?a=<slug> so refresh on the detail view keeps the user there.
const readSlugFromUrl = () => {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('a');
};

const TrainingActivity = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Mirror selectedActivity to the URL via ?a=<slug> so F5 stays on the
  // detail page and the browser Back button pops back to the grid.
  const setSelectedAndSync = useCallback((activity) => {
    setSelectedActivity(activity);
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (activity?.slug) params.set('a', activity.slug);
    else params.delete('a');
    const qs = params.toString();
    const next = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash;
    window.history.pushState({ a: activity?.slug || null }, '', next);
  }, []);

  // On browser Back/Forward, re-sync local state from the URL.
  useEffect(() => {
    const onPop = () => {
      const slug = readSlugFromUrl();
      if (!slug) { setSelectedActivity(null); return; }
      const found = activities.find((a) => a.slug === slug);
      if (found) setSelectedActivity(found);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [activities]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      activitiesApi.list({ status: 'published' }),
      activitiesApi.list({ status: 'assessment' }).catch(() => []),
    ])
      .then(([pub, assess]) => {
        if (cancelled) return;
        const mapped = [...(pub || []), ...(assess || [])].map(normalizeRow);
        setActivities(mapped);
        const slug = readSlugFromUrl();
        if (slug) {
          const found = mapped.find((a) => a.slug === slug);
          if (found) setSelectedActivity(found);
        }
      })
      .catch((e) => !cancelled && setLoadError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const filteredActivities = activities.filter((a) => {
    const q = searchQuery.toLowerCase();
    return !q ||
      (a.title || '').toLowerCase().includes(q) ||
      (a.description || '').toLowerCase().includes(q);
  });

  const levelColor = (level) => {
    switch (level) {
      case 'เริ่มต้น':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'ปานกลาง':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'ขั้นสูง':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  if (selectedActivity) {
    return (
      <ActivityDetail
        activity={selectedActivity}
        onBack={() => setSelectedAndSync(null)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300 bg-slate-50/50 dark:bg-yrugray-950">
      {/* Abstract Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yrupink-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-yrupink-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="w-full glass sticky top-0 z-50 transition-colors duration-300 border-b border-slate-200/80 dark:border-yrugray-800 bg-white/80 dark:bg-yrugray-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onBack}>
            <div className="w-9 h-9 bg-gradient-to-br from-yrupink-500 to-yrupink-700 rounded-xl flex items-center justify-center font-bold text-white shadow-md">
              AI
            </div>
            <span className="font-bold text-lg tracking-wide text-slate-900 dark:text-white">
              CENTER <span className="text-yrupink-500">YRU</span>
            </span>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-yrugray-800 hover:bg-slate-200 dark:hover:bg-yrugray-700 border border-slate-200 dark:border-yrugray-700 text-sm font-semibold text-slate-700 dark:text-yrugray-300 transition-colors flex items-center gap-2 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับสู่หน้าแรก
          </button>
        </div>
      </header>

      <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-12 z-10">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yrupink-500/10 border border-yrupink-500/30 text-yrupink-600 dark:text-yrupink-400 text-xs font-semibold mb-4">
            <BookOpen className="w-4 h-4" />
            หลักสูตรอบรม AI ทั้งหมด
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-slate-900 dark:text-white">
            หลักสูตรและกิจกรรมอบรม
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-yrugray-400 max-w-2xl mx-auto">
            ค้นหาหลักสูตรและกิจกรรมอบรมที่ตรงกับความสนใจของคุณ จากศูนย์ AI มหาวิทยาลัยราชภัฏยะลา
          </p>
        </section>

        {/* Search & Filter Bar */}
        <section className="mb-10">
          <div className="bg-white dark:bg-yrugray-900 border border-slate-200/80 dark:border-yrugray-800 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row gap-4 items-stretch md:items-center shadow-xs">
            <div className="relative flex-grow">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อหลักสูตร หรือรายละเอียด..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-yrugray-800 border border-slate-200 dark:border-yrugray-700 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-yrupink-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-yrugray-300 px-2">
              <Filter className="w-4 h-4 text-yrupink-500" />
              <span>พบทั้งหมด {filteredActivities.length} หลักสูตร</span>
            </div>
          </div>
        </section>

        {/* Activities Grid */}
        <section>
          {loading ? (
            <div className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl p-16 text-center flex items-center justify-center shadow-xs">
              <Loader2 className="w-7 h-7 text-yrupink-500 animate-spin" />
            </div>
          ) : loadError ? (
            <div className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl p-12 text-center shadow-xs">
              <p className="text-rose-600 dark:text-rose-400 text-sm font-medium">โหลดหลักสูตรไม่สำเร็จ: {loadError.message}</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl p-16 text-center shadow-xs">
              <p className="text-slate-500 dark:text-yrugray-400 text-sm">ไม่พบหลักสูตรที่ตรงกับการค้นหาของคุณ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredActivities.map((a) => {
                const percent = a.seats > 0 ? Math.min(100, Math.round((a.registrants_count / a.seats) * 100)) : 0;
                const badge = cardBadge(a.raw);

                return (
                  <article
                    key={a.id}
                    className="group bg-white dark:bg-yrugray-900 border border-slate-200/90 dark:border-yrugray-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl hover:border-yrupink-500/50 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Banner รูปภาพด้านบน */}
                      <div className="relative aspect-[16/9] bg-slate-100 dark:bg-yrugray-800 overflow-hidden">
                        {a.image ? (
                          <img
                            src={a.image}
                            alt={a.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yrupink-500/15 to-yrupink-600/5">
                            <BookOpen className="w-10 h-10 text-yrupink-500" />
                          </div>
                        )}
                        
                        {/* สถานะหลักสูตร — สะท้อนช่วงเวลารับสมัครตามเวลาจริง */}
                        <div className="absolute top-3 right-3 shadow-md">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full border backdrop-blur-xs ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>

                      {/* เนื้อหาการ์ด */}
                      <div className="p-5 space-y-4">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-yrupink-600 dark:group-hover:text-yrupink-400 transition-colors leading-snug">
                            {a.title}
                          </h3>
                           

                          {/* สถิติย่อยแบบ 2 กล่อง (จำนวนรับ / สมัครแล้ว) */}
                          <div className="grid grid-cols-2 gap-2 my-4">
                            <div className="bg-slate-50 dark:bg-yrugray-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-yrugray-800">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-yrugray-400 mb-0.5">
                                <Users className="w-3.5 h-3.5 text-yrupink-500" />
                                <span>จำนวนรับ</span>
                              </div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                                {a.seats ? `${a.seats} คน` : 'ไม่จำกัด'}
                              </p>
                            </div>

                            <div className="bg-slate-50 dark:bg-yrugray-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-yrugray-800">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-yrugray-400 mb-0.5">
                                <ClipboardList className="w-3.5 h-3.5 text-blue-500" />
                                <span>สมัครแล้ว</span>
                              </div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                                {a.registrants_count} คน
                              </p>
                            </div>
                          </div>

                          {/* ข้อมูลรายละเอียด (วันที่, สถานที่) */}
                          <div className="space-y-2 text-xs text-slate-600 dark:text-yrugray-300 pt-2 border-t border-slate-100 dark:border-yrugray-800">
                            {a.registerCloseDateDisplay && (
                                <div className="flex items-center justify-between text-slate-500 dark:text-yrugray-400">
                                  <span>ปิดรับสมัคร:</span>
                                  <span className="font-semibold text-slate-700 dark:text-slate-200">{a.registerCloseDateDisplay}</span>
                                </div>
                              )}
                            <div className="flex items-start gap-2">
                              <Calendar className="w-4 h-4 text-yrupink-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-slate-400 block text-[11px]">ช่วงอบรม</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {a.date}{a.endDate && a.date !== a.endDate ? ` - ${a.endDate}` : ''}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-yrupink-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-slate-400 block text-[11px]">สถานที่</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 break-words">{a.location || 'ยังไม่ระบุสถานที่'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* แถบสัดส่วนผู้สมัคร (Progress Bar) & ปุ่มกด */}
                    <div className="p-5 pt-0 space-y-3"> 
                      <button
                        onClick={() => setSelectedAndSync(a)}
                        className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-white bg-yrupink-600 hover:bg-yrupink-500 shadow-md shadow-yrupink-500/20 transition-all"
                      >
                        ดูรายละเอียดหลักสูตร
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )} 
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-yrugray-800 bg-white dark:bg-yrugray-900 mt-auto py-6 text-center text-xs text-slate-500 dark:text-yrugray-400">
        <div className="max-w-7xl mx-auto px-6">
          &copy; {new Date().getFullYear()} AI Center YRU, มหาวิทยาลัยราชภัฏยะลา. สงวนลิขสิทธิ์
        </div>
      </footer>
    </div>
  );
};

export default TrainingActivity;