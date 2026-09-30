import React, { useState, useEffect, useMemo } from 'react';
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
  QrCode,
  Loader2,
  XCircle,
} from 'lucide-react';
import { activitiesApi, registrationsApi, ApiError } from '../api';

const fmtThaiDate = (iso) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return '-'; }
};

const durationInDays = (start, end) => {
  if (!start || !end) return '';
  const days = Math.max(1, Math.ceil((new Date(end) - new Date(start)) / 86400000));
  return `${days} วัน`;
};

const STATUS_LABEL = {
  published: 'เปิดรับสมัคร',
  draft: 'ยังไม่เปิดรับสมัคร',
  completed: 'จบไปแล้ว',
  cancelled: 'ยกเลิก',
};

const ActivityDetail = ({ activity: initialActivity, onBack }) => {
  // Prefer the freshest server copy — reloading gives us up-to-date seats_left
  // and status even if the caller was cached. Fall back to the prop while
  // fetching so the banner + hero don't flicker to empty.
  const [activity, setActivity] = useState(initialActivity || null);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    const slug = initialActivity?.slug;
    if (!slug) return;
    let cancelled = false;
    setReloading(true);
    activitiesApi.getBySlug(slug)
      .then((row) => {
        if (cancelled) return;
        // Merge server-truth fields into the prop shape so the UI below
        // (which was written for the card shape) keeps working.
        setActivity((prev) => ({
          ...prev,
          ...row,
          date: fmtThaiDate(row.start_date),
          duration: durationInDays(row.start_date, row.end_date),
          seats: row.capacity,
          image: row.cover_image_url,
        }));
      })
      .catch(() => { /* keep the prop as-is on error */ })
      .finally(() => !cancelled && setReloading(false));
    return () => { cancelled = true; };
  }, [initialActivity?.slug]);

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
      // Refresh seats_left after a successful signup
      activitiesApi.getBySlug(activity.slug)
        .then((row) => setActivity((prev) => ({ ...prev, ...row, seats: row.capacity })))
        .catch(() => {});
    } catch (err) {
      if (err instanceof ApiError && err.code === 'DUPLICATE_REGISTRATION') {
        setSubmitError('อีเมลนี้ลงทะเบียนหลักสูตรนี้ไว้แล้ว');
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

  const seatsLeft = Number(activity?.seats_left ?? activity?.capacity ?? 0);
  const capacity  = Number(activity?.capacity ?? activity?.seats ?? 0);
  const registered = Math.max(0, capacity - seatsLeft);
  const isOpen = activity?.status === 'published' && seatsLeft > 0;
  const cannotRegister = activity && activity.status !== 'published'
    ? 'หลักสูตรยังไม่เปิดรับสมัคร'
    : seatsLeft === 0
      ? 'หลักสูตรเต็มแล้ว'
      : null;

  // Split description into paragraphs on double newline for nicer prose
  const descriptionParas = useMemo(() => {
    const raw = (activity?.description || '').trim();
    if (!raw) return [];
    return raw.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  }, [activity?.description]);

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
          <div className="flex items-center gap-2 mb-4 text-sm">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
              isOpen
                ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30'
                : 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-yrugray-500/10 dark:text-yrugray-300 dark:border-yrugray-500/30'
            }`}>
              {STATUS_LABEL[activity?.status] || 'ไม่ทราบสถานะ'}
            </span>
            {reloading && <Loader2 className="w-3.5 h-3.5 text-yrupink-400 animate-spin" />}
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-gray-900 dark:text-white">
            <span className="text-gradient">{activity?.title || 'รายละเอียดหลักสูตร'}</span>
          </h1>

          {/* Quick stats — from real API fields */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            <QuickStat
              icon={<Calendar className="w-5 h-5 text-yrupink-500 dark:text-yrupink-400" />}
              label="วันที่จัด"
              value={activity?.start_date ? fmtThaiDate(activity.start_date) : activity?.date || '-'}
            />
            <QuickStat
              icon={<Clock className="w-5 h-5 text-yrupink-500 dark:text-yrupink-400" />}
              label="ระยะเวลา"
              value={activity?.start_date && activity?.end_date
                ? durationInDays(activity.start_date, activity.end_date)
                : activity?.duration || '-'}
            />
            <QuickStat
              icon={<Users className="w-5 h-5 text-yrupink-500 dark:text-yrupink-400" />}
              label="ที่นั่ง"
              value={capacity > 0
                ? `เหลือ ${seatsLeft} / ${capacity} คน`
                : 'ไม่จำกัด'}
            />
            <QuickStat
              icon={<BookOpen className="w-5 h-5 text-yrupink-500 dark:text-yrupink-400" />}
              label="ค่าลงทะเบียน"
              value="ฟรี"
            />
          </div>
        </section>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: content */}
          <div className="lg:col-span-2 space-y-6">
            {descriptionParas.length > 0 && (
              <section className="glass-card rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">รายละเอียดหลักสูตร</h2>
                <div className="space-y-3 text-gray-700 dark:text-yrugray-100 leading-relaxed">
                  {descriptionParas.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </section>
            )}

            <section className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">สถานที่จัดอบรม</h2>
              <div className="flex items-start gap-3 text-gray-700 dark:text-yrugray-100">
                <MapPin className="w-5 h-5 text-yrupink-500 dark:text-yrupink-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{activity?.location || 'ยังไม่ระบุ'}</p>
                  <p className="text-sm opacity-80 mt-1">
                    มหาวิทยาลัยราชภัฏยะลา 133 ถนนเทศบาล 3 ตำบลสะเตง อำเภอเมือง จังหวัดยะลา 95000
                  </p>
                </div>
              </div>
            </section>

            <section className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">ผู้ลงทะเบียน</h2>
              <div className="flex items-center gap-6 text-gray-700 dark:text-yrugray-100">
                <div className="text-center">
                  <p className="text-3xl font-extrabold text-yrupink-600 dark:text-yrupink-400 tabular-nums">{registered}</p>
                  <p className="text-xs text-gray-500 dark:text-yrugray-400 mt-1">คนสมัครแล้ว</p>
                </div>
                {capacity > 0 && (
                  <>
                    <div className="text-3xl text-gray-300 dark:text-yrugray-700">/</div>
                    <div className="text-center">
                      <p className="text-3xl font-extrabold text-gray-900 dark:text-white tabular-nums">{capacity}</p>
                      <p className="text-xs text-gray-500 dark:text-yrugray-400 mt-1">รับได้ทั้งหมด</p>
                    </div>
                    <div className="flex-1 max-w-xs ml-auto">
                      <div className="h-2 bg-slate-200 dark:bg-yrugray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-yrupink-500 to-yrupink-600 transition-all"
                          style={{ width: `${Math.min(100, (registered / capacity) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-yrugray-400 mt-1.5 text-right">
                        เหลืออีก {seatsLeft} ที่นั่ง
                      </p>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>

          {/* Right: registration form */}
          <aside className="lg:col-span-1">
            <div className="glass-card rounded-2xl p-6 lg:sticky lg:top-24">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">แบบฟอร์มลงทะเบียน</h2>
                <p className="text-xs text-gray-500 dark:text-yrugray-400 mt-1">
                  กรอกข้อมูลเพื่อสำรองสิทธิ์เข้าร่วมอบรม
                </p>
              </div>

              {submitted ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 mb-3">
                    <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">ลงทะเบียนสำเร็จ</h3>
                  <p className="text-sm text-gray-600 dark:text-yrugray-300">
                    ระบบบันทึกข้อมูลของคุณแล้ว รายละเอียดเพิ่มเติมจะติดต่อกลับทางอีเมล
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ fullName: '', email: '', phone: '', organization: '', position: '', note: '' });
                    }}
                    className="mt-4 text-sm text-yrupink-600 dark:text-yrupink-400 hover:underline"
                  >
                    ลงทะเบียนอีกคน
                  </button>
                </div>
              ) : cannotRegister ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 dark:bg-yrugray-800 border border-slate-300 dark:border-yrugray-700 mb-3">
                    <XCircle className="w-7 h-7 text-slate-500 dark:text-yrugray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{cannotRegister}</h3>
                  <p className="text-sm text-gray-600 dark:text-yrugray-300">
                    ตรวจสอบหลักสูตรอื่น ๆ ในหน้ารายการได้เลย
                  </p>
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
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-700 dark:text-red-400">
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

              {/* Trainee QR entry — for admin preview / on-site scan */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-yrugray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  สำหรับผู้อบรม (วันจัดกิจกรรม)
                </p>
                <a
                  href={`/?e=${activity?.slug || activity?.id}`}
                  className="w-full py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold text-gray-800 dark:text-yrugray-100 bg-white/70 dark:bg-yrugray-800/60 hover:bg-white dark:hover:bg-yrugray-700 backdrop-blur border border-gray-200 dark:border-yrugray-700 shadow-sm transition-all"
                >
                  <QrCode className="w-4 h-4 text-yrupink-500" />
                  scan QR วันงาน (พิมพ์ + ติดที่โต๊ะเช็คอิน)
                </a>
                <p className="text-xs text-center text-gray-500 dark:text-yrugray-400 mt-2">
                  ในการใช้งานจริง ผู้อบรม scan QR ที่ป้ายในสถานที่จัดงาน
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

const QuickStat = ({ icon, label, value }) => (
  <div className="glass-card rounded-xl p-4 flex items-center gap-3">
    <div className="p-2 rounded-lg bg-yrupink-500/10 dark:bg-yrupink-600/20">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 dark:text-yrugray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{value}</p>
    </div>
  </div>
);

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
