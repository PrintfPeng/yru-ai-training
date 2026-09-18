import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Calendar, Clock, Users, MapPin, Search, Filter, ArrowRight, Loader2 } from 'lucide-react';
import ActivityDetail from './ActivityDetail';
import { activitiesApi } from '../api';

const TrainingActivity = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    activitiesApi.list({ status: 'published' })
      .then((rows) => {
        if (cancelled) return;
        // Normalize API rows to the shape the card UI already expects.
        const mapped = (rows || []).map((r) => ({
          id: r.id,
          slug: r.slug,
          title: r.title,
          description: r.description,
          location: r.location,
          date: new Date(r.start_date).toLocaleDateString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric',
          }),
          duration: r.end_date && r.start_date
            ? `${Math.max(1, Math.ceil((new Date(r.end_date) - new Date(r.start_date)) / 86400000))} วัน`
            : '',
          seats: r.capacity,
          seats_left: r.seats_left,
          image: r.cover_image_url,
          level: 'เริ่มต้น', // API schema doesn't carry level yet — placeholder
          category: '',      // same — future field
          raw: r,
        }));
        setActivities(mapped);
      })
      .catch((e) => !cancelled && setLoadError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  // Categories are derived from the loaded rows (extendable when API adds a `category` field)
  const categories = ['ทั้งหมด'];

  const filteredActivities = activities.filter((a) => {
    const q = searchQuery.toLowerCase();
    return !q ||
      (a.title || '').toLowerCase().includes(q) ||
      (a.description || '').toLowerCase().includes(q);
  });

  const levelColor = (level) => {
    switch (level) {
      case 'เริ่มต้น':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30';
      case 'ปานกลาง':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      case 'ขั้นสูง':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30';
    }
  };

  if (selectedActivity) {
    return (
      <ActivityDetail
        activity={selectedActivity}
        onBack={() => setSelectedActivity(null)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Abstract Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yrupink-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-yrupink-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="w-full glass sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
            <div className="w-8 h-8 bg-gradient-to-br from-yrupink-400 to-yrupink-700 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">
              AI
            </div>
            <span className="font-bold text-xl tracking-wide text-gray-900 dark:text-white transition-colors duration-300">
              CENTER <span className="text-yrupink-400">YRU</span>
            </span>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg bg-white/60 dark:bg-yrugray-800/60 hover:bg-gray-100 dark:hover:bg-yrugray-700 backdrop-blur border border-gray-200 dark:border-yrugray-700 text-sm text-gray-700 dark:text-yrugray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2 shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับสู่หน้าแรก
          </button>
        </div>
      </header>

      <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-12 z-10">
        {/* Hero */}
        <section className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yrupink-500/10 dark:bg-yrupink-600/20 border border-yrupink-500/30 text-yrupink-600 dark:text-yrupink-400 text-sm font-medium mb-4">
            <BookOpen className="w-4 h-4" />
            หลักสูตรอบรม AI
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 text-gray-900 dark:text-white transition-colors duration-300">
            <span className="text-gradient">หลักสูตรทั้งหมด</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-yrugray-100 max-w-2xl mx-auto opacity-90 transition-colors duration-300">
            ค้นหาหลักสูตรและกิจกรรมอบรมที่ตรงกับความสนใจของคุณ จากศูนย์ AI มหาวิทยาลัยราชภัฏยะลา
          </p>
        </section>

        {/* Search & Filter */}
        <section className="mb-10">
          <div className="glass-card rounded-2xl p-4 md:p-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-yrugray-400" />
              <input
                type="text"
                placeholder="ค้นหาหลักสูตร..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/70 dark:bg-yrugray-900/40 border border-gray-200 dark:border-yrugray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-yrugray-400 focus:outline-none focus:border-yrupink-500 dark:focus:border-yrupink-400 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-yrugray-300">
              <Filter className="w-4 h-4" />
              <span>{filteredActivities.length} หลักสูตร</span>
            </div>
          </div>

        </section>

        {/* Activities Grid */}
        <section>
          {loading ? (
            <div className="glass-card rounded-2xl p-12 text-center flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-yrupink-500 animate-spin" />
            </div>
          ) : loadError ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <p className="text-red-500 dark:text-red-400">โหลดหลักสูตรไม่สำเร็จ: {loadError.message}</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <p className="text-gray-500 dark:text-yrugray-400">ไม่พบหลักสูตรที่ตรงกับการค้นหา</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredActivities.map((a) => (
                <article
                  key={a.id}
                  className="group glass-card rounded-2xl flex flex-col relative overflow-hidden h-full"
                >
                  {/* Glow */}
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-yrupink-500/10 rounded-full blur-2xl group-hover:bg-yrupink-500/20 transition-all duration-500 pointer-events-none z-0"></div>

                  {/* Banner image */}
                  <div className="relative w-full aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-yrugray-800">
                    {a.image ? (
                      <img
                        src={a.image}
                        alt={a.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yrupink-500/20 to-yrupink-600/10">
                        <BookOpen className="w-12 h-12 text-yrupink-400" />
                      </div>
                    )}
                    {/* Gradient overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                    {/* Level badge overlay */}
                    <span className={`absolute top-3 right-3 px-2.5 py-1 text-xs font-medium rounded-full border backdrop-blur ${levelColor(a.level)}`}>
                      {a.level}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-grow relative z-10">
                    <span className="text-xs text-yrupink-600 dark:text-yrupink-400 font-medium mb-2">
                      {a.category}
                    </span>
                    <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-yrupink-600 dark:group-hover:text-yrupink-300 transition-colors duration-300">
                      {a.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-yrugray-100 mb-5 leading-relaxed opacity-80 flex-grow">
                      {a.description}
                    </p>

                    <div className="space-y-2 mb-5 text-sm text-gray-700 dark:text-yrugray-100/80">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-yrupink-500 dark:text-yrupink-400 shrink-0" />
                        <span>{a.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yrupink-500 dark:text-yrupink-400 shrink-0" />
                        <span>{a.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-yrupink-500 dark:text-yrupink-400 shrink-0" />
                        <span>รับ {a.seats} คน</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-yrupink-500 dark:text-yrupink-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{a.location}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedActivity(a)}
                      className="mt-auto w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold text-gray-800 bg-gray-100 hover:text-white hover:bg-yrupink-600 border border-gray-200 dark:text-white dark:bg-yrugray-800 dark:hover:bg-yrupink-600 dark:border-yrugray-700 dark:hover:border-yrupink-500 transition-all duration-300"
                    >
                      ดูรายละเอียด
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer (แบบเรียบง่ายให้เข้ากับ layout) */}
      <footer className="w-full glass border-t border-gray-200 dark:border-yrugray-800/50 mt-auto transition-colors duration-300 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-xs text-gray-500 dark:text-yrugray-100/50">
          &copy; {new Date().getFullYear()} AI Center YRU, มหาวิทยาลัยราชภัฏยะลา. สงวนลิขสิทธิ์
        </div>
      </footer>
    </div>
  );
};

export default TrainingActivity;
