import React, { useState } from 'react';
import { Phone, User, ArrowRight, ArrowLeft, CheckCircle2, XCircle, MapPin, Calendar } from 'lucide-react';
import {
  MOCK_EVENT_ACTIVITIES,
  findRegistrantByPhone,
  normalizePhone,
} from '../data/mockEventData';

const MAX_ATTEMPTS = 5;

const EventLanding = ({ activityId, onVerified, onCancel }) => {
  const activity = MOCK_EVENT_ACTIVITIES[activityId];
  const [step, setStep] = useState('phone'); // 'phone' | 'confirm'
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [foundRegistrant, setFoundRegistrant] = useState(null);

  if (!activity) {
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

  const handleSearch = (e) => {
    e.preventDefault();
    setError('');
    if (attempts >= MAX_ATTEMPTS) {
      setError('พยายามเกินจำนวนที่กำหนด กรุณาลองใหม่ใน 15 นาที');
      return;
    }
    const cleanPhone = normalizePhone(phone);
    if (cleanPhone.length !== 10) {
      setError('กรุณากรอกเบอร์โทรให้ครบ 10 หลัก');
      return;
    }
    const reg = findRegistrantByPhone(activityId, phone);
    if (!reg) {
      setAttempts((a) => a + 1);
      setError(`ไม่พบเบอร์นี้ในรายชื่อผู้ลงทะเบียน (พยายามได้อีก ${MAX_ATTEMPTS - attempts - 1} ครั้ง)`);
      return;
    }
    setFoundRegistrant(reg);
    setStep('confirm');
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
        {activity.banner && (
          <img src={activity.banner} alt="" className="w-full h-full object-cover opacity-80" />
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
              {activity.category}
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white drop-shadow-lg">
            {activity.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-white/90">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {activity.date}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {activity.location}
            </span>
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
              attempts={attempts}
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

const PhoneStep = ({ phone, setPhone, error, onSubmit, attempts }) => (
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
          className="w-full px-4 py-3 rounded-lg bg-white dark:bg-yrugray-800 border border-gray-300 dark:border-yrugray-700 text-gray-900 dark:text-white text-lg tracking-wide placeholder:text-gray-400 dark:placeholder:text-yrugray-500 focus:outline-none focus:border-yrupink-500 focus:ring-1 focus:ring-yrupink-500"
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
        disabled={!phone.trim() || attempts >= MAX_ATTEMPTS}
        className="w-full py-3 rounded-lg bg-yrupink-600 hover:bg-yrupink-500 disabled:bg-yrugray-300 dark:disabled:bg-yrugray-700 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-lg shadow-yrupink-500/20 transition-colors flex items-center justify-center gap-2"
      >
        ค้นหา
        <ArrowRight className="w-4 h-4" />
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

      {/* Demo hint (mockup only) */}
      <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-lg text-xs text-yellow-800 dark:text-yellow-300">
        💡 <strong>สำหรับทดสอบ:</strong> ใช้เบอร์ 0812345678 (สมชาย), 0898765432 (สมหญิง), 0865551234 (อาลี)
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
              <p>🏢 {registrant.organization}</p>
              <p>💼 {registrant.position}</p>
              <p>📞 {registrant.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}</p>
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
