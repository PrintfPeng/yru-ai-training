import React, { useMemo } from 'react';
import { Download, Printer, Share2, CheckCircle2, Home, AlertCircle } from 'lucide-react';
import { MOCK_CERT_TEMPLATE, generateCertId } from '../data/mockEventData';

const CertificateDownload = ({ activity, registrant, onBackHome }) => {
  const cert = MOCK_CERT_TEMPLATE;
  const certId = useMemo(() => generateCertId(activity.id, registrant.id), [activity.id, registrant.id]);

  const substitutions = {
    participantName: registrant.fullName,
    courseTitle: activity.title,
    issueDate: new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    certificateId: certId,
    signerName: cert.signerName,
    signerPosition: cert.signerPosition,
  };

  const handlePrint = () => window.print();

  const handleShare = () => {
    const url = `${window.location.origin}/verify/${certId}`;
    navigator.clipboard?.writeText(url).then(
      () => alert('คัดลอกลิงก์ยืนยันแล้ว:\n' + url),
      () => alert('ลิงก์ยืนยัน: ' + url)
    );
  };

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
            <p className="text-lg font-bold text-gray-900 dark:text-white">{registrant.fullName}</p>
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

// Read-only cert renderer (mirrors CertificateEditor but no interactivity)
const CertPreview = ({ cert, substitutions }) => (
  <div
    className="relative aspect-[297/210] w-full bg-gradient-to-br from-yellow-500/20 to-yellow-800/10 bg-yrugray-950"
    style={
      cert.backgroundImage
        ? {
            backgroundImage: `url(${cert.backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }
        : undefined
    }
  >
    {/* Decorative frame */}
    {!cert.backgroundImage && (
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

export default CertificateDownload;
