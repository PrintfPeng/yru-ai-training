import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Calendar, Clock, Users, MapPin, Search, Filter, ArrowRight } from 'lucide-react';
import ActivityDetail from './ActivityDetail';

const TrainingActivity = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');
  const [selectedActivity, setSelectedActivity] = useState(null);

  const categories = ['ทั้งหมด', 'พื้นฐาน AI', 'Machine Learning', 'Deep Learning', 'Prompt Engineering', 'AI สำหรับธุรกิจ'];

  // Placeholder data — ในอนาคตดึงจาก API/Admin ได้
  const activities = [
    {
      id: 1,
      title: 'พื้นฐาน AI สำหรับผู้เริ่มต้น',
      category: 'พื้นฐาน AI',
      description: 'เรียนรู้แนวคิดพื้นฐานของปัญญาประดิษฐ์ ประเภทของ AI และการประยุกต์ใช้ในชีวิตประจำวัน',
      date: '15 ต.ค. 2568',
      duration: '2 วัน',
      seats: 30,
      location: 'ห้องประชุมชั้น 3 อาคาร AI Center',
      level: 'เริ่มต้น',
      image: 'https://picsum.photos/seed/ai-intro/800/450',
    },
    {
      id: 2,
      title: 'Prompt Engineering ขั้นสูง',
      category: 'Prompt Engineering',
      description: 'เทคนิคการเขียน Prompt เพื่อสั่งงาน LLM ให้ได้ผลลัพธ์ตามต้องการ พร้อม workshop จริง',
      date: '22 ต.ค. 2568',
      duration: '1 วัน',
      seats: 25,
      location: 'ห้อง Lab AI Center',
      level: 'ปานกลาง',
      image: 'https://picsum.photos/seed/prompt-eng/800/450',
    },
    {
      id: 3,
      title: 'Machine Learning ด้วย Python',
      category: 'Machine Learning',
      description: 'เขียน ML model ด้วย scikit-learn ตั้งแต่ preprocessing ไปจนถึง evaluation',
      date: '5 พ.ย. 2568',
      duration: '3 วัน',
      seats: 20,
      location: 'ห้อง Lab คอมพิวเตอร์ อาคาร 20',
      level: 'ปานกลาง',
      image: 'https://picsum.photos/seed/ml-python/800/450',
    },
    {
      id: 4,
      title: 'Deep Learning และ Neural Networks',
      category: 'Deep Learning',
      description: 'ทำความเข้าใจ Neural Network, CNN, RNN และการสร้างโมเดลด้วย TensorFlow/PyTorch',
      date: '19 พ.ย. 2568',
      duration: '4 วัน',
      seats: 15,
      location: 'ห้อง Lab AI Center',
      level: 'ขั้นสูง',
      image: 'https://picsum.photos/seed/deep-learning/800/450',
    },
    {
      id: 5,
      title: 'AI สำหรับ SME และผู้ประกอบการ',
      category: 'AI สำหรับธุรกิจ',
      description: 'นำ AI มาปรับใช้กับธุรกิจ SME ในพื้นที่ 3 จังหวัดชายแดนใต้ พร้อมกรณีศึกษาจริง',
      date: '3 ธ.ค. 2568',
      duration: '2 วัน',
      seats: 40,
      location: 'ห้องประชุมใหญ่ มหาวิทยาลัยราชภัฏยะลา',
      level: 'เริ่มต้น',
      image: 'https://picsum.photos/seed/ai-sme/800/450',
    },
    {
      id: 6,
      title: 'สร้าง Chatbot ด้วย AI Agent',
      category: 'พื้นฐาน AI',
      description: 'workshop ปฏิบัติจริงในการสร้าง Chatbot ด้วย LLM และ Framework สมัยใหม่',
      date: '17 ธ.ค. 2568',
      duration: '2 วัน',
      seats: 25,
      location: 'ห้อง Lab AI Center',
      level: 'ปานกลาง',
      image: 'https://picsum.photos/seed/chatbot-agent/800/450',
    },
  ];

  const filteredActivities = activities.filter((a) => {
    const matchCategory = activeCategory === 'ทั้งหมด' || a.category === activeCategory;
    const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        a.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
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

          {/* Category chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm border transition-all duration-300 ${
                  activeCategory === cat
                    ? 'bg-yrupink-600 text-white border-yrupink-500 shadow-lg shadow-yrupink-500/20'
                    : 'bg-white/60 dark:bg-yrugray-800/50 text-gray-700 dark:text-yrugray-100 border-gray-200 dark:border-yrugray-700 hover:border-yrupink-400 dark:hover:border-yrupink-500'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Activities Grid */}
        <section>
          {filteredActivities.length === 0 ? (
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
