import React, { useState } from 'react';
import {
  Award, Search, Loader2, Calendar, AlertCircle, XCircle, Inbox, Phone, Eye,
} from 'lucide-react';
import { activitiesApi, registrationsApi, ApiError } from '../api';
import { formatThaiDate } from '../utils/thaiDate';
import Navbar from '../components/Navbar';
import PageBack from '../components/PageBack';
import Breadcrumb from '../components/Breadcrumb';
import CertificateDownload from './CertificateDownload';

// Same normalization the QR trainee flow uses (EventLanding).
const normalizePhone = (raw) => String(raw || '').replace(/\D/g, '').replace(/^66/, '0');

// Only these statuses can have an issued certificate (certs are created when the
// trainee submits the activity's assessment). Skipping draft/cancelled keeps the
// per-activity verify-phone fan-out small.
const CERT_STATUSES = ['published', 'assessment', 'completed'];

// Run `fn` over `items` with a bounded number of concurrent calls so a site with
// many activities doesn't fire dozens of requests at once.
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );
  return results;
}

/**
 * Public "รับเกียรติบัตร" page (frontend-only).
 *
 * The backend has no "search certificates by person" endpoint, so we reuse the
 * existing public verify-phone endpoint: enter the phone used at registration,
 * fan it out across every activity, and collect the ones that already have an
 * issued certificate (verify-phone returns `certificate_code` only after the
 * assessment was submitted). Picking one opens the shared CertificateDownload
 * view so viewing + PDF download match the QR flow exactly.
 *
 * Props: onBackHome, onNavigate(target, hash?), isAdmin
 */
const MyCertificates = ({ onBackHome, onNavigate, isAdmin }) => {
  const [phone, setPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null); // null = not searched; [] = none
  const [selectedCode, setSelectedCode] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    const clean = normalizePhone(phone);
    if (clean.length !== 10) {
      setError('กรุณากรอกเบอร์โทรให้ครบ 10 หลัก');
      return;
    }
    setSearching(true);
    setResults(null);
    try {
      // Pull the activities that could have certificates, then verify the phone
      // against each one in parallel (bounded concurrency).
      const activities = await activitiesApi.list({ limit: 200 });
      const candidates = (activities || []).filter((a) => CERT_STATUSES.includes(a.status));

      let rateLimited = false;
      const matches = await mapLimit(candidates, 5, async (a) => {
        try {
          const { participant } = await registrationsApi.verifyPhone(a.slug, clean);
          if (!participant?.certificate_code) return null; // registered but no cert yet
          return {
            code: participant.certificate_code,
            participant_name: `${participant.first_name} ${participant.last_name}`,
            email_masked: participant.email_masked,
            activity: { title: a.title, slug: a.slug, start_date: a.start_date },
          };
        } catch (err) {
          // Not registered for this activity is the normal "no match" case.
          if (err instanceof ApiError && err.code === 'RATE_LIMITED') rateLimited = true;
          return null;
        }
      });

      // Dedupe by certificate code (one cert per activity, but be safe).
      const seen = new Set();
      const found = matches.filter((m) => m && !seen.has(m.code) && seen.add(m.code));

      if (!found.length && rateLimited) {
        setError('ระบบตรวจสอบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่');
        setResults(null);
      } else {
        setResults(found);
      }
    } catch (err) {
      setError(err?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      setResults(null);
    } finally {
      setSearching(false);
    }
  };

  // A certificate is picked → hand off to the shared download/preview view.
  if (selectedCode) {
    return (
      <CertificateDownload
        certificateCode={selectedCode}
        verify
        onBackHome={() => setSelectedCode(null)}
        onNavigate={onNavigate}
        isAdmin={isAdmin}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-50 dark:bg-yrugray-950">
      {/* Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yrupink-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-yrupink-500/10 rounded-full blur-[100px] pointer-events-none" />

      <Navbar onNavigate={onNavigate} isAdmin={isAdmin} active="certificates" />

      <main className="flex-grow px-6 z-10 w-full max-w-7xl mx-auto pt-8 pb-16">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Breadcrumb
            items={[
              { label: 'หน้าแรก', onClick: onBackHome },
              { label: 'รับเกียรติบัตร' },
            ]}
          />
          <PageBack onClick={onBackHome} label="กลับหน้าแรก" className="shrink-0" />
        </div>

        {/* Search card */}
        <div className="w-full max-w-2xl mx-auto bg-white dark:bg-yrugray-900 border border-gray-200 dark:border-yrugray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-6 border-b border-gray-200 dark:border-yrugray-800 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-yrupink-500/10 border border-yrupink-500/30 mb-3">
              <Award className="w-7 h-7 text-yrupink-500" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              รับเกียรติบัตร
            </h1>
            <p className="text-sm text-gray-600 dark:text-yrugray-300 mt-1 max-w-md mx-auto">
              กรอกเบอร์โทรที่ใช้ลงทะเบียน เพื่อค้นหาเกียรติบัตรของคุณจากทุกกิจกรรม
            </p>
          </div>

          <form onSubmit={handleSearch} className="p-6 space-y-4">
            <div>
              <label className="text-sm text-gray-700 dark:text-yrugray-300 mb-1.5 block">
                📞 เบอร์โทรศัพท์
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-yrugray-500 pointer-events-none">
                  <Phone className="w-5 h-5" />
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08X-XXX-XXXX"
                  autoFocus
                  disabled={searching}
                  className="w-full pl-11 pr-4 py-3 rounded-lg bg-white dark:bg-yrugray-800 border border-gray-300 dark:border-yrugray-700 text-gray-900 dark:text-white text-lg tracking-wide placeholder:text-gray-400 dark:placeholder:text-yrugray-500 focus:outline-none focus:border-yrupink-500 focus:ring-1 focus:ring-yrupink-500 disabled:opacity-60"
                />
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 shrink-0" />
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!phone.trim() || searching}
              className="w-full py-3 rounded-lg bg-yrupink-600 hover:bg-yrupink-500 disabled:bg-yrugray-300 dark:disabled:bg-yrugray-700 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-lg shadow-yrupink-500/20 transition-colors flex items-center justify-center gap-2"
            >
              {searching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังค้นหาเกียรติบัตร...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  ค้นหาเกียรติบัตร
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {results !== null && (
          <div className="w-full max-w-2xl mx-auto mt-6">
            {results.length === 0 ? (
              <div className="bg-white dark:bg-yrugray-900 border border-gray-200 dark:border-yrugray-800 rounded-2xl p-8 text-center">
                <Inbox className="w-12 h-12 text-gray-300 dark:text-yrugray-600 mx-auto mb-3" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                  ไม่พบเกียรติบัตร
                </h2>
                <p className="text-sm text-gray-600 dark:text-yrugray-300 max-w-sm mx-auto">
                  ไม่พบเกียรติบัตรของเบอร์นี้ — ตรวจสอบว่าใช้เบอร์เดียวกับตอนลงทะเบียน
                </p>
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-xl text-sm text-yellow-800 dark:text-yellow-300 flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    เกียรติบัตรจะออกให้หลังจากทำแบบประเมินของกิจกรรมเสร็จแล้ว —
                    หากยังไม่ได้ทำ กรุณาสแกน QR ของกิจกรรมเพื่อทำแบบประเมินก่อน
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-yrugray-300 mb-3 px-1">
                  พบเกียรติบัตร {results.length} รายการ
                </p>
                <div className="space-y-3">
                  {results.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setSelectedCode(c.code)}
                      className="w-full text-left bg-white dark:bg-yrugray-900 border border-gray-200 dark:border-yrugray-800 hover:border-yrupink-500/60 dark:hover:border-yrupink-500/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl bg-yrupink-500/10 border border-yrupink-500/20 flex items-center justify-center shrink-0">
                          <Award className="w-5 h-5 text-yrupink-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                            {c.activity.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-yrugray-300 mt-0.5 truncate">
                            👤 {c.participant_name}
                            {c.email_masked && (
                              <span className="text-gray-400 dark:text-yrugray-500"> · {c.email_masked}</span>
                            )}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-yrugray-400">
                            {c.activity.start_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatThaiDate(c.activity.start_date)}
                              </span>
                            )}
                            <span className="font-mono">เลขที่: {c.code}</span>
                          </div>
                        </div>
                        <span className="shrink-0 self-center inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-yrupink-600 group-hover:bg-yrupink-500 text-white text-xs font-semibold transition-colors">
                          <Eye className="w-4 h-4" />
                          ดู / ดาวน์โหลด
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-gray-500 dark:text-yrugray-500 py-4 z-10">
        &copy; {new Date().getFullYear()} AI Center YRU
      </footer>
    </div>
  );
};

export default MyCertificates;
