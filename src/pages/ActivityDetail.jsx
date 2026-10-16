import React, { useState, useEffect, useMemo } from 'react';
import {
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
  Award,
  Loader2,
  XCircle,
  Info,
  CalendarRange,
  Wallet,
  ExternalLink,
} from 'lucide-react';
import { activitiesApi, registrationsApi, assessmentsApi, ApiError } from '../api';
import { formatThaiDate as fmtThaiDate, formatThaiDateTime as fmtThaiDateTime, durationText as durationInDays, registrationWindowState, beToLocalDate } from '../utils/thaiDate';
import RegistrationForm from '../components/RegistrationForm';
import Navbar from '../components/Navbar';
import PageBack from '../components/PageBack';
import Breadcrumb from '../components/Breadcrumb';


const STATUS_LABEL = {
  published: 'เปิดรับสมัคร',
  assessment: 'เปิดทำแบบประเมิน',
  draft: 'ยังไม่เปิดรับสมัคร',
  completed: 'จบไปแล้ว',
  cancelled: 'ยกเลิก',
};

// ms → "D วัน HH:MM:SS" (drops the day part when < 1 day).
const formatCountdown = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n) => String(n).padStart(2, '0');
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return (d > 0 ? `${d} วัน ` : '') + `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const ActivityDetail = ({ activity: initialActivity, onBack, onNavigate, isAdmin }) => {
  // Prefer the freshest server copy — reloading gives us up-to-date seats_left
  // and status even if the caller was cached. Fall back to the prop while
  // fetching so the banner + hero don't flicker to empty.
  const [activity, setActivity] = useState(initialActivity || null);
  const [reloading, setReloading] = useState(false);
  // True iff the admin has published an assessment for this activity.
  // Drives the "ทำแบบประเมิน..." CTA at the bottom of the form aside.
  const [assessmentAvailable, setAssessmentAvailable] = useState(false);
  // Masked list of people already registered (public confirmation list).
  const [registrants, setRegistrants] = useState([]);
  // Ticks every second so the registration window flips live (ยังไม่เปิด →
  // เปิดรับสมัคร → ปิดรับ) without the visitor pressing F5.
  const [nowTick, setNowTick] = useState(() => Date.now());

  const loadRegistrants = (slug) =>
    registrationsApi.publicList(slug)
      .then((rows) => setRegistrants(Array.isArray(rows) ? rows : []))
      .catch(() => setRegistrants([]));

  useEffect(() => {
    const slug = initialActivity?.slug;
    if (!slug) return;
    let cancelled = false;
    loadRegistrants(slug);
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

    // Check if a published assessment exists for this activity. 404 = no
    // published assessment yet → hide the CTA. Any other error is silent.
    assessmentsApi.getActiveBySlug(slug)
      .then((row) => { if (!cancelled) setAssessmentAvailable(!!row); })
      .catch(() => { if (!cancelled) setAssessmentAvailable(false); });

    return () => { cancelled = true; };
  }, [initialActivity?.slug]);

  // Drive the live registration-window countdown. Only runs while a window is
  // actually set; recomputing windowState on each tick flips the UI by itself.
  useEffect(() => {
    if (!activity?.register_open_at && !activity?.register_close_date) return undefined;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [activity?.register_open_at, activity?.register_close_date]);

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
    // Validate on the client with clear Thai messages so the user knows which
    // field is wrong, instead of a generic "Request validation failed".
    const fullName = formData.fullName.trim();
    const email = formData.email.trim();
    const phoneDigits = formData.phone.replace(/\D/g, ''); // keep digits only

    if (!fullName) {
      setSubmitError('กรุณากรอกชื่อ - นามสกุล');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSubmitError('กรุณากรอกอีเมลให้ถูกต้อง เช่น name@example.com');
      return;
    }
    if (phoneDigits.length !== 10) {
      setSubmitError('กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก');
      return;
    }

    const [first, ...rest] = fullName.split(/\s+/);
    const last = rest.join(' ') || '-';

    setSubmitting(true);
    try {
      await registrationsApi.publicRegister(
        activity.slug,
        {
          first_name:   first,
          last_name:    last,
          email:        email,
          phone:        phoneDigits,
          organization: formData.organization || null,
          position:     formData.position || null,
        },
        formData.note || null,
      );
      setSubmitted(true);
      loadRegistrants(activity.slug); // show the new (masked) name in the list
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
      } else if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') {
        setSubmitError('ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบชื่อ-นามสกุล อีเมล และเบอร์โทรศัพท์อีกครั้ง');
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
  const unlimited = capacity === 0;               // capacity 0 = ไม่จำกัดที่นั่ง (seats_left = NULL)
  const soldOut   = !unlimited && seatsLeft <= 0; // เต็มเฉพาะเมื่อมีโควตาจำกัดเท่านั้น
  const assessmentMode = activity?.status === 'assessment';
  // Registration window (date+time). 'none' = no window set → gated by status only.
  // Recomputed every render; nowTick (1s) re-renders so this flips by itself.
  void nowTick;
  const windowState = registrationWindowState(activity?.register_open_at, activity?.register_close_date);
  const isOpen = activity?.status === 'published' && !soldOut && windowState !== 'before' && windowState !== 'closed';
  // Live countdown to the open moment (only meaningful while 'before').
  const openAt = beToLocalDate(activity?.register_open_at);
  const openCountdown = windowState === 'before' && openAt
    ? formatCountdown(openAt.getTime() - nowTick)
    : null;
  // Hero status chip reflects the live window for published activities.
  const statusChipLabel = activity?.status === 'published'
    ? (windowState === 'before' ? 'ยังไม่เปิดรับสมัคร'
      : windowState === 'closed' ? 'ปิดรับสมัครแล้ว'
      : 'เปิดรับสมัคร')
    : (STATUS_LABEL[activity?.status] || 'ไม่ทราบสถานะ');
  const cannotRegister = activity && activity.status !== 'published'
    ? 'หลักสูตรยังไม่เปิดรับสมัคร'
    : windowState === 'before'
      ? `ยังไม่ถึงเวลาเปิดรับสมัคร (เปิด ${fmtThaiDateTime(activity.register_open_at)})`
      : windowState === 'closed'
        ? 'ปิดรับสมัครแล้ว'
        : soldOut
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
      <Navbar onNavigate={onNavigate} isAdmin={isAdmin} active="training" />

      <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-8 z-10">
        {/* Breadcrumb trail (left) + back to course list (right) */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Breadcrumb
            items={[
              { label: 'หน้าแรก', onClick: () => onNavigate?.('home') },
              { label: 'หลักสูตรอบรม', onClick: onBack },
              { label: activity?.title || 'รายละเอียดหลักสูตร' },
            ]}
          />
          <PageBack onClick={onBack} label="กลับหน้ารายการหลักสูตร" className="shrink-0" />
        </div>

        {/* Banner */}
        {activity?.image && (
          <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden mb-8 border border-gray-200 dark:border-yrugray-800 shadow-xl">
            <img
              src={activity.image}
              alt={activity.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
            {activity?.start_date && activity?.end_date && (
              <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-1.5">
                <span className="self-start px-3 py-1 text-xs md:text-sm font-semibold rounded-full bg-white/90 text-gray-800 backdrop-blur">
                  รอบวันที่ : {fmtThaiDate(activity.start_date)} – {fmtThaiDate(activity.end_date)}
                </span>
                {activity?.location && (
                  <span className="text-xs md:text-sm text-white/90 drop-shadow flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {activity.location}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Hero */}
        <section className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
              isOpen
                ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30'
                : 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-yrugray-500/10 dark:text-yrugray-300 dark:border-yrugray-500/30'
            }`}>
              {statusChipLabel}
            </span>
            {reloading && <Loader2 className="w-3.5 h-3.5 text-yrupink-400 animate-spin" />}
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-1.5 text-gray-900 dark:text-white">
            <span className="text-gradient">{activity?.title || 'รายละเอียดหลักสูตร'}</span>
          </h1>

          {/* 3 stat cards — จำนวนรับ / สมัครแล้ว / ระยะเวลา */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            <QuickStat
              icon={<Users className="w-5 h-5 text-yrupink-500 dark:text-yrupink-400" />}
              label="จำนวนรับ"
              value={capacity > 0 ? `${capacity} คน` : 'ไม่จำกัด'}
            />
            <QuickStat
              icon={<CheckCircle2 className="w-5 h-5 text-yrupink-500 dark:text-yrupink-400" />}
              label="สมัครแล้ว"
              value={`${registered} คน`}
            />
            <QuickStat
              icon={<Clock className="w-5 h-5 text-yrupink-500 dark:text-yrupink-400" />}
              label="ระยะเวลา"
              value={activity?.start_date && activity?.end_date
                ? durationInDays(activity.start_date, activity.end_date)
                : '-'}
            />
          </div>
        </section>

        {/* Note box */}
        {activity?.note_text && (
          <div className="mb-6 flex items-start gap-2 p-4 rounded-xl bg-yrupink-500/5 border border-yrupink-500/20 text-sm text-gray-700 dark:text-yrugray-200">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-yrupink-500 dark:text-yrupink-400" />
            <span className="whitespace-pre-line"><b>หมายเหตุ:</b> {activity.note_text}</span>
          </div>
        )}

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
              <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">รายละเอียด</h2>
              <div className="divide-y divide-gray-200 dark:divide-yrugray-800">
                {activity?.register_open_at && (
                  <DetailRow
                    icon={<Calendar className="w-4 h-4" />}
                    label="เปิดรับสมัคร"
                    value={fmtThaiDateTime(activity.register_open_at)}
                    valueClass="text-green-600 dark:text-green-400 font-semibold"
                  />
                )}
                {activity?.register_close_date && (
                  <DetailRow
                    icon={<Calendar className="w-4 h-4" />}
                    label="ปิดรับสมัคร"
                    value={fmtThaiDateTime(activity.register_close_date)}
                    valueClass="text-red-600 dark:text-red-400 font-semibold"
                  />
                )}
                {activity?.start_date && activity?.end_date && (
                  <DetailRow
                    icon={<CalendarRange className="w-4 h-4" />}
                    label="ช่วงอบรม"
                    value={`${fmtThaiDate(activity.start_date)} – ${fmtThaiDate(activity.end_date)}`}
                  />
                )}
                {activity?.fee_text && (
                  <DetailRow icon={<Wallet className="w-4 h-4" />} label="ค่าลงทะเบียน" value={activity.fee_text} />
                )}
                {activity?.travel_text && (
                  <DetailRow icon={<Wallet className="w-4 h-4" />} label="ค่าเดินทาง" value={activity.travel_text} />
                )}
                <DetailRow
                  icon={<MapPin className="w-4 h-4" />}
                  label="สถานที่"
                  value={
                    <div>
                      <p>{activity?.location || 'ยังไม่ระบุ'}</p>
                      {Array.isArray(activity?.venue_links) && activity.venue_links.map((v, i) => (
                        <a
                          key={i}
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-yrupink-600 dark:text-yrupink-400 hover:underline text-sm mt-1 mr-4"
                        >
                          {v.label} <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  }
                />
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

            {/* Public registrants (masked) — lets applicants confirm their signup */}
            <section className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                รายชื่อผู้ลงทะเบียน
                {registrants.length > 0 && (
                  <span className="text-sm font-normal text-gray-500 dark:text-yrugray-400"> ({registrants.length})</span>
                )}
              </h2>
              <p className="text-xs text-gray-500 dark:text-yrugray-400 mb-4">
                ตรวจสอบว่าคุณลงทะเบียนสำเร็จ
              </p>
              {registrants.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-yrugray-400">ยังไม่มีผู้ลงทะเบียน</p>
              ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {registrants.map((r, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-gray-700 dark:text-yrugray-200 bg-white/50 dark:bg-yrugray-900/40 rounded-lg px-3 py-2 border border-gray-200 dark:border-yrugray-700"
                    >
                      <span className="w-6 h-6 rounded-full bg-yrupink-500/10 text-yrupink-600 dark:text-yrupink-400 text-xs font-semibold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="truncate min-w-0">
                        {r.first_name} {r.last_name}
                        {r.organization && (
                          <span className="text-gray-500 dark:text-yrugray-400"> · {r.organization}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Right: registration form */}
          <aside className="lg:col-span-1">
            <div className="glass-card rounded-2xl p-6 lg:sticky lg:top-24">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {assessmentMode ? 'ทำแบบประเมิน' : 'แบบฟอร์มลงทะเบียน'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-yrugray-400 mt-1">
                  {assessmentMode
                    ? 'หลักสูตรนี้ปิดรับสมัครแล้ว — เปิดให้ผู้ลงทะเบียนทำแบบประเมิน'
                    : 'กรอกข้อมูลเพื่อสำรองสิทธิ์เข้าร่วมอบรม'}
                </p>
              </div>

              {assessmentMode ? (
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-yrupink-500/10 border border-yrupink-500/30 mb-3">
                    <Award className="w-7 h-7 text-yrupink-600 dark:text-yrupink-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    หลักสูตรนี้เปิดให้ทำแบบประเมิน
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-yrugray-300 mb-4">
                    ผู้ที่ลงทะเบียนไว้แล้ว ยืนยันตัวด้วยเบอร์โทรเพื่อทำแบบประเมินและรับใบประกาศนียบัตร
                  </p>
                  <a
                    href={`/?e=${activity?.slug || activity?.id}`}
                    className="w-full py-3 rounded-lg flex items-center justify-center gap-2 text-[15px] font-semibold text-white bg-gradient-to-r from-yrupink-500 to-yrupink-600 hover:from-yrupink-600 hover:to-yrupink-700 shadow-lg shadow-yrupink-500/25 hover:shadow-yrupink-500/40 transition-all"
                  >
                    <Award className="w-4 h-4" />
                    ทำแบบประเมิน
                  </a>
                </div>
              ) : cannotRegister ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 dark:bg-yrugray-800 border border-slate-300 dark:border-yrugray-700 mb-3">
                    <XCircle className="w-7 h-7 text-slate-500 dark:text-yrugray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{cannotRegister}</h3>
                  {openCountdown ? (
                    <>
                      <p className="text-sm text-gray-600 dark:text-yrugray-300 mb-2">เปิดรับสมัครในอีก</p>
                      <p className="text-2xl font-extrabold tabular-nums text-yrupink-600 dark:text-yrupink-400 tracking-tight">
                        {openCountdown}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-yrugray-400 mt-2">
                        ปุ่มลงทะเบียนจะเปิดให้อัตโนมัติเมื่อถึงเวลา
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-yrugray-300">
                      ตรวจสอบหลักสูตรอื่น ๆ ในหน้ารายการได้เลย
                    </p>
                  )}
                </div>
              ) : (
                <RegistrationForm
                  activity={activity}
                  onSuccess={() => {
                    loadRegistrants(activity.slug);
                    activitiesApi.getBySlug(activity.slug)
                      .then((row) => setActivity((prev) => ({ ...prev, ...row, seats: row.capacity })))
                      .catch(() => {});
                  }}
                />
              )}

              {/* Assessment CTA — shown only when the admin has published an
                  assessment for this activity. Jumps into the trainee flow
                  (App.jsx picks up ?e=<slug>). */}
              {assessmentAvailable && !assessmentMode && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-yrugray-700">
                  <a
                    href={`/?e=${activity?.slug || activity?.id}`}
                    className="w-full py-3 rounded-lg flex items-center justify-center gap-2 text-[15px] font-semibold text-white bg-gradient-to-r from-yrupink-500 to-yrupink-600 hover:from-yrupink-600 hover:to-yrupink-700 shadow-lg shadow-yrupink-500/25 hover:shadow-yrupink-500/40 transition-all"
                  >
                    <Award className="w-4 h-4" />
                    ทำแบบประเมินเพื่อรับใบประกาศนียบัตร
                  </a>
                  <p className="text-xs text-center text-gray-500 dark:text-yrugray-400 mt-2">
                    ยืนยันตัวด้วยเบอร์ที่ลงทะเบียน → ทำแบบประเมิน → ดาวน์โหลดใบประกาศนียบัตร
                  </p>
                </div>
              )}
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
    <div className="p-2.5 rounded-lg bg-yrupink-500/10 dark:bg-yrupink-600/20 shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 dark:text-yrugray-400">{label}</p>
      <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{value}</p>
    </div>
  </div>
);

const DetailRow = ({ icon, label, value, valueClass = '' }) => (
  <div className="flex items-start gap-3 py-3">
    <div className="flex items-center gap-2 w-32 md:w-40 shrink-0 text-gray-600 dark:text-yrugray-300">
      <span className="text-yrupink-500 dark:text-yrupink-400">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </div>
    <div className={`flex-1 text-[15px] text-gray-900 dark:text-white ${valueClass}`}>{value}</div>
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
