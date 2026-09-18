import React, { useEffect, useState } from 'react';
import { Download, Printer, Share2, CheckCircle2, Home, AlertCircle, Loader2 } from 'lucide-react';
import { certificatesApi } from '../api';

/**
 * Props:
 *   activity, registrant   — from the trainee flow chain
 *   certificateCode        — set from AssessmentSurvey submit result;
 *                            when present we fetch the real cert from API
 *   onBackHome
 */
const CertificateDownload = ({ activity, registrant, certificateCode, onBackHome }) => {
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(!!certificateCode);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!certificateCode) return;
    let cancelled = false;
    certificatesApi.getByCode(certificateCode)
      .then((d) => { if (!cancelled) setCertData(d); })
      .catch((e) => { if (!cancelled) setLoadError(e); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [certificateCode]);

  const handlePrint = () => window.print();

  const handleShare = () => {
    if (!certData) return;
    const url = `${window.location.origin}/verify/${certData.certificate.code}`;
    navigator.clipboard?.writeText(url).then(
      () => alert('คัดลอกลิงก์ยืนยันแล้ว:\n' + url),
      () => alert('ลิงก์ยืนยัน: ' + url)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-yrugray-950">
        <Loader2 className="w-8 h-8 text-yrupink-500 animate-spin" />
      </div>
    );
  }

  if (loadError || !certData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-yrugray-950">
        <div className="text-center max-w-md">
          <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">โหลดวุฒิบัตรไม่สำเร็จ</h2>
          <p className="text-sm text-gray-600 dark:text-yrugray-300 mb-4">
            {loadError?.message || 'ไม่พบวุฒิบัตรที่ระบุ'}
          </p>
          <button
            onClick={onBackHome}
            className="px-5 py-2 bg-yrupink-600 hover:bg-yrupink-500 text-white text-sm font-semibold rounded-lg"
          >
            กลับหน้าแรก
          </button>
        </div>
      </div>
    );
  }

  const cert = certData.certificate.template;
  const substitutions = certData.substitutions;
  const certId = certData.certificate.code;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-yrugray-950">
      {/* Print styles: hide everything except cert */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .cert-print-area { padding: 0 !important; margin: 0 !important; box-shadow: none !important; }
          @page { size: A4 landscape; margin: 0; }
        }
      `}</style>

      {/* Success header */}
      <div className="no-print bg-gradient-to-b from-green-500/5 to-transparent border-b border-gray-200 dark:border-yrugray-800">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 mb-3">
            <CheckCircle2 className="w-8 h-8 text-green-500 dark:text-green-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ขอบคุณสำหรับความคิดเห็น
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-yrugray-300 max-w-lg mx-auto">
            ข้อเสนอแนะของคุณช่วยให้ศูนย์ AI YRU พัฒนาหลักสูตรให้ดียิ่งขึ้น — วุฒิบัตรของคุณพร้อมดาวน์โหลดแล้ว
          </p>
        </div>
      </div>

      {/* Cert preview */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500 dark:text-yrugray-400 uppercase mb-0.5">วุฒิบัตรของ</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {certData.participant.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-yrugray-400 mt-0.5">เลขที่: {certId}</p>
          </div>
          <span className="px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-xs font-semibold rounded-full">
            ออกให้แล้ว
          </span>
        </div>

        <div className="cert-print-area rounded-2xl overflow-hidden shadow-2xl">
          <CertPreview cert={cert} substitutions={substitutions} />
        </div>

        {/* Actions */}
        <div className="no-print mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handlePrint}
            className="py-3 px-4 rounded-lg bg-yrupink-600 hover:bg-yrupink-500 text-white text-sm font-semibold shadow-lg shadow-yrupink-500/20 flex items-center justify-center gap-2 transition-colors sm:col-span-2"
          >
            <Download className="w-4 h-4" />
            ดาวน์โหลด PDF / พิมพ์
          </button>
          <button
            onClick={handleShare}
            className="py-3 px-4 rounded-lg bg-white dark:bg-yrugray-800 hover:bg-gray-50 dark:hover:bg-yrugray-700 border border-gray-200 dark:border-yrugray-700 text-gray-700 dark:text-yrugray-200 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            คัดลอกลิงก์ยืนยัน
          </button>
        </div>

        {/* Notice about name */}
        <div className="no-print mt-4 p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-xl text-sm text-yellow-800 dark:text-yellow-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p>
              กรุณาตรวจสอบสะกดชื่อของคุณบนวุฒิบัตร — หากไม่ตรง ให้ติดต่อผู้จัดเพื่อแก้ไข
              แล้วโหลดใหม่ได้ทันที
            </p>
          </div>
        </div>

        {/* Home button */}
        <div className="no-print mt-6 text-center">
          <button
            onClick={onBackHome}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm text-gray-600 dark:text-yrugray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <Home className="w-4 h-4" />
            กลับสู่หน้าแรก
          </button>
        </div>

        {/* Verify note */}
        <div className="no-print mt-8 pb-8 text-center text-xs text-gray-500 dark:text-yrugray-500">
          🔗 ลิงก์ยืนยันสาธารณะ: <br />
          <code className="text-yrupink-500 dark:text-yrupink-400">
            aicenter.yru.ac.th/verify/{certId}
          </code>
        </div>
      </main>
    </div>
  );
};

// Read-only cert renderer (mirrors CertificateEditor but no interactivity).
// Handles both the API shape (backgroundImageUrl) and the older mock shape (backgroundImage).
const CertPreview = ({ cert, substitutions }) => {
  const bgUrl = cert.backgroundImageUrl || cert.backgroundImage;
  return (
  <div
    className="relative aspect-[297/210] w-full bg-gradient-to-br from-yellow-500/20 to-yellow-800/10 bg-yrugray-950"
    style={
      bgUrl
        ? {
            backgroundImage: `url(${bgUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }
        : undefined
    }
  >
    {/* Decorative frame */}
    {!bgUrl && (
      <>
        <div className="pointer-events-none absolute inset-4 border border-white/20 rounded-lg" />
        <div className="pointer-events-none absolute inset-6 border border-white/10 rounded-lg" />
      </>
    )}

    {(cert.elements || []).map((el) => {
      const style = {
        left: `${el.x}%`,
        top: `${el.y}%`,
        width: `${el.width}%`,
      };

      if (el.kind === 'image') {
        return (
          <div key={el.id} className="absolute" style={style}>
            <img
              src={el.src}
              alt=""
              style={{ width: '100%', height: `${el.height}%`, minHeight: 30 }}
              className="object-contain"
            />
          </div>
        );
      }

      const displayText =
        el.kind === 'placeholder'
          ? substitutions[el.field] ?? `[ ${el.field} ]`
          : el.content;

      return (
        <div
          key={el.id}
          className="absolute whitespace-nowrap overflow-hidden text-ellipsis"
          style={{
            ...style,
            fontFamily: el.fontFamily || '"Noto Sans Thai", sans-serif',
            fontSize: `${el.fontSize}px`,
            fontWeight: el.fontWeight || 'normal',
            color: el.color || '#ffffff',
            textAlign: el.textAlign || 'center',
            letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
            lineHeight: 1.2,
          }}
        >
          {displayText}
        </div>
      );
    })}
  </div>
  );
};

export default CertificateDownload;
