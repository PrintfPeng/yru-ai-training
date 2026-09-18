import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  Users,
  MapPin,
  CheckCircle2,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  MessageSquare,
  Send,
  Info,
  QrCode,
  Loader2,
  XCircle,
} from 'lucide-react';
import { registrationsApi, ApiError } from '../api';

const ActivityDetail = ({ activity, onBack }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    organization: '',
    position: '',
    note: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!activity?.slug) {
      setSubmitError('ไม่พบข้อมูลหลักสูตร กรุณาลองใหม่');
      return;
    }
    // Split fullName into first + last (best-effort)
    const [first, ...rest] = formData.fullName.trim().split(/\s+/);
    const last = rest.join(' ') || '-';

    setSubmitting(true);
    try {
      await registrationsApi.publicRegister(
        activity.slug,
        {
          first_name:   first,
          last_name:    last,
          email:        formData.email.trim(),
          phone:        formData.phone.trim(),
          organization: formData.organization || null,
          position:     formData.position || null,
        },
        formData.note || null,
      );
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'DUPLICATE_REGISTRATION') {
        setSubmitError('คุณลงทะเบียนหลักสูตรนี้ไว้แล้ว');
      } else if (err instanceof ApiError && err.code === 'OVER_CAPACITY') {
        setSubmitError('หลักสูตรนี้เต็มแล้ว กรุณาติดต่อผู้จัด');
      } else if (err instanceof ApiError && err.code === 'ACTIVITY_NOT_OPEN') {
        setSubmitError('หลักสูตรยังไม่เปิดรับสมัคร');
      } else {
        setSubmitError(err?.message || 'ส่งไม่สำเร็จ กรุณาลองใหม่');
      }
    } finally {
      setSubmitting(false);
    }
  };

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

  // Mockup content — ในอนาคตดึงจาก activity หรือ API
  const topics = [
    'ทำความเข้าใจแนวคิดและทฤษฎีพื้นฐาน',
    'ฝึกปฏิบัติจริงผ่าน workshop',
    'กรณีศึกษาจากการใช้งานในองค์กร',
    'แนวทางการต่อยอดและประยุกต์ใช้',
    'ถาม-ตอบกับผู้เชี่ยวชาญ',
  ];

  const prerequisites = [
    'ความรู้พื้นฐานด้านคอมพิวเตอร์',
    'มี Notebook ส่วนตัวสำหรับการปฏิบัติ',
    'สนใจในเทคโนโลยี AI และการเรียนรู้',
  ];

  const schedule = [
    { time: '09:00 - 10:30', title: 'บรรยายภาคทฤษฎี' },
    { time: '10:30 - 10:45', title: 'พักเบรก' },
    { time: '10:45 - 12:00', title: 'Workshop ภาคที่ 1' },
    { time: '12:00 - 13:00', title: 'พักกลางวัน' },
    { time: '13:00 - 15:00', title: 'Workshop ภาคที่ 2' },
    { time: '15:00 - 16:00', title: 'สรุป / ถาม-ตอบ' },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Abstract Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yrupink-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-yrupink-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="w-full glass sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
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
            กลับหน้ารายการหลักสูตร
          </button>
        </div>
      </header>

      <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-10 z-10">
        {/* Banner */}
        {activity?.image && (
          <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden mb-8 border border-gray-200 dark:border-yrugray-800 shadow-xl">
            <img
              src={activity.image}
              alt={activity.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </div>
        )}

        {/* Hero */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-yrugray-300">
            <span className="text-yrupink-600 dark:text-yrupink-400 font-medium">
              {activity?.category || 'หมวดหมู่หลักสูตร'}
            </span>
            <span>•</span>
            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${levelColor(activity?.level)}`}>
              {activity?.level || '-'}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-gray-900 dark:text-white">
            <span className="text-gradient">{activity?.title || 'รายละเอียดหลักสูตร'}</span>
          </h1>

          <p className="text-lg text-gray-600 dark:text-yrugray-100 max-w-3xl leading-relaxed opacity-90">
            {activity?.description ||
              'รายละเอียดของหลักสูตรจะปรากฏที่นี่ เมื่อดึงข้อมูลจากระบบหลังบ้านสมบูรณ์แล้ว'}
          </p>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            <div className="glass-card rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yrupink-500/10 dark:bg-yrupink-600/20">
                <Calendar className="w-5 h-5 text-yrupink-500 dark:text-yrupink-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-yrugray-400">วันที่</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{activity?.date || '-'}</p>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yrupink-500/10 dark:bg-yrupink-600/20">
                <Clock className="w-5 h-5 text-yrupink-500 dark:text-yrupink-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-yrugray-400">ระยะเวลา</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{activity?.duration || '-'}</p>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yrupink-500/10 dark:bg-yrupink-600/20">
                <Users className="w-5 h-5 text-yrupink-500 dark:text-yrupink-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-yrugray-400">รับสมัคร</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{activity?.seats || '-'} คน</p>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yrupink-500/10 dark:bg-yrupink-600/20">
                <BookOpen className="w-5 h-5 text-yrupink-500 dark:text-yrupink-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-yrugray-400">ค่าลงทะเบียน</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">ฟรี</p>
              </div>
            </div>
          </div>
        </section>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: content */}
          <div className="lg:col-span-2 space-y-6">
            <section className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">หัวข้อที่จะได้เรียน</h2>
              <ul className="space-y-3">
                {topics.map((t, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700 dark:text-yrugray-100">
                    <CheckCircle2 className="w-5 h-5 text-yrupink-500 dark:text-yrupink-400 shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">คุณสมบัติผู้เข้าอบรม</h2>
              <ul className="space-y-2 text-gray-700 dark:text-yrugray-100">
                {prerequisites.map((p, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-yrupink-500 dark:bg-yrupink-400 mt-2 shrink-0"></span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">ตารางเวลา (ต่อวัน)</h2>
              <div className="space-y-2">
                {schedule.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3 rounded-lg bg-white/40 dark:bg-yrugray-800/40 border border-gray-100 dark:border-yrugray-700/50"
                  >
                    <div className="text-sm font-mono text-yrupink-600 dark:text-yrupink-400 shrink-0 w-28">
                      {s.time}
                    </div>
                    <div className="text-sm text-gray-800 dark:text-yrugray-100">{s.title}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">สถานที่จัดอบรม</h2>
              <div className="flex items-start gap-3 text-gray-700 dark:text-yrugray-100">
                <MapPin className="w-5 h-5 text-yrupink-500 dark:text-yrupink-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{activity?.location || '-'}</p>
                  <p className="text-sm opacity-80 mt-1">
                    มหาวิทยาลัยราชภัฏยะลา 133 ถนนเทศบาล 3 ตำบลสะเตง อำเภอเมือง จังหวัดยะลา 95000
                  </p>
                </div>
              </div>
              <div className="mt-4 h-40 rounded-lg bg-gradient-to-br from-yrupink-500/10 to-yrupink-600/5 dark:from-yrupink-500/15 dark:to-yrupink-600/5 border border-dashed border-yrupink-500/30 flex items-center justify-center text-sm text-gray-500 dark:text-yrugray-400">
                Placeholder — แผนที่จะแสดงที่นี่
              </div>
            </section>
          </div>

          {/* Right: registration form (mockup) */}
          <aside className="lg:col-span-1">
            <div className="glass-card rounded-2xl p-6 lg:sticky lg:top-24">
              <div className="flex items-start gap-2 mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">แบบฟอร์มลงทะเบียน</h2>
                  <p className="text-xs text-gray-500 dark:text-yrugray-400 mt-1">
                    กรอกข้อมูลเพื่อสำรองสิทธิ์เข้าร่วมอบรม
                  </p>
                </div>
              </div>

              <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-yrupink-500/5 dark:bg-yrupink-600/10 border border-yrupink-500/20 text-xs text-gray-600 dark:text-yrugray-300">
                <Info className="w-4 h-4 text-yrupink-500 dark:text-yrupink-400 shrink-0 mt-0.5" />
                <span>
                  Mockup ฟอร์ม — ในอนาคตจะถูกแทนที่ด้วย dynamic form ที่กำหนดฟิลด์จากหลังบ้าน
                </span>
              </div>

              {submitted ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 mb-3">
                    <CheckCircle2 className="w-7 h-7 text-green-500 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">ลงทะเบียนสำเร็จ</h3>
                  <p className="text-sm text-gray-600 dark:text-yrugray-300">
                    ระบบได้บันทึกข้อมูลของคุณแล้ว (mockup)
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 text-sm text-yrupink-600 dark:text-yrupink-400 hover:underline"
                  >
                    ลงทะเบียนอีกครั้ง
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <Field
                    icon={<User className="w-4 h-4" />}
                    label="ชื่อ - นามสกุล"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                  <Field
                    icon={<Mail className="w-4 h-4" />}
                    label="อีเมล"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <Field
                    icon={<Phone className="w-4 h-4" />}
                    label="เบอร์โทรศัพท์"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                  <Field
                    icon={<Building2 className="w-4 h-4" />}
                    label="หน่วยงาน / สถานศึกษา"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                  />
                  <Field
                    icon={<Briefcase className="w-4 h-4" />}
                    label="ตำแหน่ง"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                  />
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-yrugray-200 mb-1">
                      <span className="inline-flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4" /> หมายเหตุ / ความคาดหวัง
                      </span>
                    </label>
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-white/70 dark:bg-yrugray-900/40 border border-gray-200 dark:border-yrugray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-yrugray-400 focus:outline-none focus:border-yrupink-500 dark:focus:border-yrupink-400 transition-colors resize-none"
                      placeholder="สิ่งที่คุณอยากได้จากการอบรม..."
                    />
                  </div>

                  {submitError && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-600 dark:text-red-400">
                      <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-2 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-yrupink-500 to-yrupink-600 hover:from-yrupink-600 hover:to-yrupink-700 disabled:opacity-60 shadow-lg shadow-yrupink-500/20 hover:shadow-yrupink-500/40 transition-all duration-300"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        กำลังส่ง...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        ลงทะเบียน
                      </>
                    )}
                  </button>

                  <p className="text-xs text-center text-gray-500 dark:text-yrugray-400 mt-2">
                    เมื่อลงทะเบียน ถือว่ายอมรับเงื่อนไขของศูนย์ AI YRU
                  </p>
                </form>
              )}

              {/* Demo entry point for trainee QR flow */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-yrugray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  สำหรับผู้อบรม (วันจัดกิจกรรม)
                </p>
                <a
                  href={`/?e=${activity?.id}`}
                  className="w-full py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold text-gray-800 dark:text-yrugray-100 bg-white/70 dark:bg-yrugray-800/60 hover:bg-white dark:hover:bg-yrugray-700 backdrop-blur border border-gray-200 dark:border-yrugray-700 shadow-sm transition-all"
                >
                  <QrCode className="w-4 h-4 text-yrupink-500" />
                  ทดลอง scan QR วันงาน
                </a>
                <p className="text-xs text-center text-gray-500 dark:text-yrugray-400 mt-2">
                  💡 ในการใช้งานจริง ผู้อบรม scan QR ที่ป้ายในสถานที่จัดงาน
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="w-full glass border-t border-gray-200 dark:border-yrugray-800/50 mt-auto transition-colors duration-300 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-xs text-gray-500 dark:text-yrugray-100/50">
          &copy; {new Date().getFullYear()} AI Center YRU, มหาวิทยาลัยราชภัฏยะลา. สงวนลิขสิทธิ์
        </div>
      </footer>
    </div>
  );
};

const Field = ({ icon, label, name, value, onChange, type = 'text', required = false }) => (
  <div>
    <label className="block text-sm text-gray-700 dark:text-yrugray-200 mb-1">
      <span className="inline-flex items-center gap-1.5">
        {icon} {label}
        {required && <span className="text-yrupink-500">*</span>}
      </span>
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full px-3 py-2 rounded-lg bg-white/70 dark:bg-yrugray-900/40 border border-gray-200 dark:border-yrugray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-yrugray-400 focus:outline-none focus:border-yrupink-500 dark:focus:border-yrupink-400 transition-colors"
    />
  </div>
);

export default ActivityDetail;
