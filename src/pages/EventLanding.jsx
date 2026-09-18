import React, { useState, useEffect } from 'react';
import { Phone, User, ArrowRight, ArrowLeft, CheckCircle2, XCircle, MapPin, Calendar, Loader2 } from 'lucide-react';
import { activitiesApi, registrationsApi, ApiError } from '../api';

const normalizePhone = (raw) => String(raw || '').replace(/\D/g, '').replace(/^66/, '0');

const EventLanding = ({ activityId, onVerified, onCancel }) => {
  const [activity, setActivity] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [activityError, setActivityError] = useState(null);

  const [step, setStep] = useState('phone'); // 'phone' | 'confirm'
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [foundRegistrant, setFoundRegistrant] = useState(null);

  // Load activity by slug (URL param feeds `activityId` which is actually the slug)
  useEffect(() => {
    let cancelled = false;
    activitiesApi.getBySlug(activityId)
      .then((a) => { if (!cancelled) setActivity(a); })
      .catch((e) => { if (!cancelled) setActivityError(e); })
      .finally(() => { if (!cancelled) setLoadingActivity(false); });
    return () => { cancelled = true; };
  }, [activityId]);

  if (loadingActivity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-yrugray-950">
        <Loader2 className="w-8 h-8 text-yrupink-500 animate-spin" />
      </div>
    );
  }

  if (activityError || !activity) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-yrugray-950">
        <div className="max-w-md w-full bg-white dark:bg-yrugray-900 border border-gray-200 dark:border-yrugray-800 rounded-2xl p-8 text-center">
          <XCircle className="w-14 h-14 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">ไม่พบกิจกรรม</h2>
          <p className="text-sm text-gray-600 dark:text-yrugray-300 mb-4">
            ลิงก์อาจหมดอายุ หรือ QR ไม่ถูกต้อง
          </p>
          <button
            onClick={onCancel}
            className="px-5 py-2 bg-yrupink-600 hover:bg-yrupink-500 text-white text-sm font-semibold rounded-lg"
          >
            กลับหน้าแรก
          </button>
        </div>
      </div>
    );
  }

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    const cleanPhone = normalizePhone(phone);
    if (cleanPhone.length !== 10) {
      setError('กรุณากรอกเบอร์โทรให้ครบ 10 หลัก');
      return;
    }
    setSubmitting(true);
    try {
      const { participant } = await registrationsApi.verifyPhone(activity.slug, phone);
      // Backend returns masked fields — flatten to legacy `fullName` shape
      // so the confirm step + downstream pages don't need changes.
      setFoundRegistrant({
        id: participant.id,
        fullName: `${participant.first_name} ${participant.last_name}`,
        first_name: participant.first_name,
        last_name: participant.last_name,
        organization: participant.organization,
        position: participant.position,
        phone: `••• ••• ${participant.phone_last4}`,
        email: participant.email_masked,
        registration_id: participant.registration_id,
      });
      setStep('confirm');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'RATE_LIMITED') {
        setError('พยายามเกินจำนวนที่กำหนด กรุณาลองใหม่ใน 15 นาที');
      } else if (err instanceof ApiError && err.code === 'NOT_REGISTERED') {
        setError('ไม่พบเบอร์นี้ในรายชื่อผู้ลงทะเบียนของหลักสูตร');
      } else {
        setError(err?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = () => {
    onVerified(foundRegistrant, activity);
  };

  const handleNotMe = () => {
    setStep('phone');
    setFoundRegistrant(null);
    setPhone('');
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-50 dark:bg-yrugray-950">
      {/* Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yrupink-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-yrupink-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Banner */}
      <div className="relative w-full h-40 md:h-56 overflow-hidden bg-yrugray-900">
        {activity.cover_image_url && (
          <img src={activity.cover_image_url} alt="" className="w-full h-full object-cover opacity-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-yrugray-950 via-transparent to-transparent" />
        <button
          onClick={onCancel}
          className="absolute top-4 left-4 px-3 py-1.5 bg-white/80 dark:bg-yrugray-800/80 hover:bg-white dark:hover:bg-yrugray-700 backdrop-blur border border-gray-200 dark:border-yrugray-700 rounded-lg text-sm text-gray-700 dark:text-yrugray-200 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับ
        </button>
        <div className="absolute bottom-4 left-6 right-6 z-10">
          <div className="flex items-center gap-2 mb-1 text-xs">
            <span className="px-2 py-0.5 bg-yrupink-500/20 border border-yrupink-500/40 text-yrupink-100 rounded-full backdrop-blur">
              {activity.status === 'published' ? 'เปิดรับสมัคร' : activity.status}
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white drop-shadow-lg">
            {activity.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-white/90">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(activity.start_date).toLocaleDateString('th-TH', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
            {activity.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {activity.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="flex-grow flex items-start justify-center px-4 py-8 z-10">
        <div className="w-full max-w-md bg-white dark:bg-yrugray-900 border border-gray-200 dark:border-yrugray-800 rounded-2xl shadow-xl overflow-hidden">
          {step === 'phone' ? (
            <PhoneStep
              phone={phone}
              setPhone={setPhone}
              error={error}
              onSubmit={handleSearch}
              onCancel={onCancel}
              submitting={submitting}
            />
          ) : (
            <ConfirmStep
              registrant={foundRegistrant}
              onConfirm={handleConfirm}
              onNotMe={handleNotMe}
            />
          )}
        </div>
      </div>

      <footer className="text-center text-xs text-gray-500 dark:text-yrugray-500 py-4 z-10">
        &copy; {new Date().getFullYear()} AI Center YRU
      </footer>
    </div>
  );
};

const PhoneStep = ({ phone, setPhone, error, onSubmit, submitting }) => (
  <>
    <div className="px-6 py-5 border-b border-gray-200 dark:border-yrugray-800">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Phone className="w-5 h-5 text-yrupink-500" />
        ยืนยันตัวตนเพื่อทำแบบประเมิน
      </h2>
      <p className="text-sm text-gray-600 dark:text-yrugray-300 mt-1">
        กรอกเบอร์โทรที่ใช้ลงทะเบียนอบรม
      </p>
    </div>

    <form onSubmit={onSubmit} className="p-6 space-y-4">
      <div>
        <label className="text-sm text-gray-700 dark:text-yrugray-300 mb-1.5 block">
          📞 เบอร์โทรศัพท์
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08X-XXX-XXXX"
          autoFocus
          disabled={submitting}
          className="w-full px-4 py-3 rounded-lg bg-white dark:bg-yrugray-800 border border-gray-300 dark:border-yrugray-700 text-gray-900 dark:text-white text-lg tracking-wide placeholder:text-gray-400 dark:placeholder:text-yrugray-500 focus:outline-none focus:border-yrupink-500 focus:ring-1 focus:ring-yrupink-500 disabled:opacity-60"
        />
        {error && (
          <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center gap-1.5">
            <XCircle className="w-4 h-4 shrink-0" />
            {error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!phone.trim() || submitting}
        className="w-full py-3 rounded-lg bg-yrupink-600 hover:bg-yrupink-500 disabled:bg-yrugray-300 dark:disabled:bg-yrugray-700 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-lg shadow-yrupink-500/20 transition-colors flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            กำลังค้นหา...
          </>
        ) : (
          <>
            ค้นหา
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="pt-4 border-t border-gray-200 dark:border-yrugray-800 text-center">
        <p className="text-xs text-gray-500 dark:text-yrugray-400 mb-2">
          ⚠️ ไม่พบชื่อในรายการ? อาจยังไม่ได้รับการอนุมัติ
        </p>
        <a
          href="https://line.me/R/ti/p/@aicenter-yru"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-yrupink-600 dark:text-yrupink-400 hover:underline"
        >
          📱 ติดต่อผู้จัดทาง LINE
        </a>
      </div>
    </form>
  </>
);

const ConfirmStep = ({ registrant, onConfirm, onNotMe }) => (
  <>
    <div className="px-6 py-5 border-b border-gray-200 dark:border-yrugray-800 bg-green-50/50 dark:bg-green-500/5">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" />
        พบข้อมูลของคุณ
      </h2>
      <p className="text-sm text-gray-600 dark:text-yrugray-300 mt-1">
        กรุณายืนยันว่าเป็นข้อมูลของคุณ
      </p>
    </div>

    <div className="p-6 space-y-4">
      <div className="bg-gradient-to-br from-yrupink-500/10 to-yrupink-600/5 border border-yrupink-500/20 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yrupink-500 to-yrupink-700 flex items-center justify-center text-white font-bold text-xl shrink-0">
            {registrant.fullName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500 dark:text-yrugray-400 uppercase mb-1">ชื่อผู้เข้าอบรม</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{registrant.fullName}</p>
            <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-yrugray-300">
              {registrant.organization && <p>🏢 {registrant.organization}</p>}
              {registrant.position && <p>💼 {registrant.position}</p>}
              <p>📞 {registrant.phone}</p>
              {registrant.email && <p>✉️ {registrant.email}</p>}
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-center text-gray-700 dark:text-yrugray-200 font-medium">
        ใช่คุณหรือไม่?
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onNotMe}
          className="py-3 rounded-lg bg-gray-100 dark:bg-yrugray-800 hover:bg-gray-200 dark:hover:bg-yrugray-700 text-gray-700 dark:text-yrugray-200 text-sm font-semibold border border-gray-200 dark:border-yrugray-700 transition-colors flex items-center justify-center gap-2"
        >
          <XCircle className="w-4 h-4" />
          ไม่ใช่
        </button>
        <button
          onClick={onConfirm}
          className="py-3 rounded-lg bg-yrupink-600 hover:bg-yrupink-500 text-white text-sm font-semibold shadow-lg shadow-yrupink-500/20 transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          ใช่, เริ่มเลย
        </button>
      </div>

      <p className="text-xs text-center text-gray-500 dark:text-yrugray-400 pt-2">
        เมื่อยืนยันแล้วจะเข้าสู่แบบประเมินความพึงพอใจ
      </p>
    </div>
  </>
);

export default EventLanding;
