import React, { useEffect, useRef, useState } from 'react';
import { Download, Share2, CheckCircle2, Home, AlertCircle, Loader2 } from 'lucide-react';
import { certificatesApi } from '../api';
import { useToast } from '../contexts/ToastContext';

// A4-landscape reference size at ~96dpi. The cert is designed/rendered at this
// fixed width so stored px font sizes stay proportional and never clip.
const CERT_REF_W = 1123;
const CERT_REF_H = Math.round((CERT_REF_W * 210) / 297); // ≈ 794

/**
 * Props:
 *   activity, registrant   — from the trainee flow chain
 *   certificateCode        — set from AssessmentSurvey submit result;
 *                            when present we fetch the real cert from API
 *   onBackHome
 */
const CertificateDownload = ({ activity, registrant, certificateCode, onBackHome, verify = false }) => {
  const toast = useToast();
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(!!certificateCode);
  const [loadError, setLoadError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const certRef = useRef(null);

  useEffect(() => {
    if (!certificateCode) return;
    let cancelled = false;
    certificatesApi.getByCode(certificateCode)
      .then((d) => { if (!cancelled) setCertData(d); })
      .catch((e) => { if (!cancelled) setLoadError(e); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [certificateCode]);

  // Render the certificate element to an A4-landscape PDF and download it.
  // jsPDF + html2canvas are dynamically imported so they don't bloat the main
  // bundle — they only load when the user actually clicks download.
  const handleDownloadPdf = async () => {
    if (!certRef.current || downloading) return;
    setDownloading(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);
      // Wait for the embedded Google Fonts to finish loading, otherwise
      // html2canvas can snapshot a fallback font (or none) and clip glyphs.
      if (document.fonts?.ready) {
        try { await document.fonts.ready; } catch { /* ignore */ }
      }
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: CERT_REF_W,
        height: CERT_REF_H,
        windowWidth: CERT_REF_W,
      });
      const img = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.addImage(img, 'JPEG', 0, 0,
        pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
      // '/' is illegal in filenames → swap for '-'
      const code = certData?.certificate?.code || 'certificate';
      pdf.save(`${String(code).replace(/[\\/]/g, '-')}.pdf`);
    } catch (e) {
      toast.error('ดาวน์โหลด PDF ไม่สำเร็จ กรุณาลองใหม่', { title: 'ดาวน์โหลดไม่สำเร็จ' });
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = () => {
    if (!certData) return;
    const url = `${window.location.origin}/?verify=${encodeURIComponent(certData.certificate.code)}`;
    navigator.clipboard?.writeText(url).then(
      () => toast.success('คัดลอกลิงก์ยืนยันแล้ว', { title: 'คัดลอกแล้ว' }),
      () => toast.info('ลิงก์ยืนยัน: ' + url)
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
            {verify ? 'ตรวจสอบวุฒิบัตร' : 'ขอบคุณสำหรับความคิดเห็น'}
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-yrugray-300 max-w-lg mx-auto">
            {verify
              ? 'วุฒิบัตรนี้ออกโดยศูนย์ปัญญาประดิษฐ์ มหาวิทยาลัยราชภัฏยะลา'
              : 'ข้อเสนอแนะของคุณช่วยให้ศูนย์ AI YRU พัฒนาหลักสูตรให้ดียิ่งขึ้น — วุฒิบัตรของคุณพร้อมดาวน์โหลดแล้ว'}
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

        {/* Visible preview — the reference-size layout scaled to fit. */}
        <div className="cert-print-area rounded-2xl overflow-hidden shadow-2xl">
          <ScaledCert cert={cert} substitutions={substitutions} />
        </div>

        {/* Hidden reference-size copy used as the PDF capture source so the
            output is identical on every device and never clipped. */}
        <div aria-hidden style={{ position: 'absolute', left: -99999, top: 0, pointerEvents: 'none' }}>
          <div ref={certRef} style={{ width: CERT_REF_W, height: CERT_REF_H }}>
            <CertPreview cert={cert} substitutions={substitutions} fixedWidth={CERT_REF_W} />
          </div>
        </div>

        {/* Actions */}
        <div className="no-print mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="py-3 px-4 rounded-lg bg-yrupink-600 hover:bg-yrupink-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-lg shadow-yrupink-500/20 flex items-center justify-center gap-2 transition-colors sm:col-span-2"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังสร้าง PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                ดาวน์โหลด PDF
              </>
            )}
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
          <code className="text-yrupink-500 dark:text-yrupink-400 break-all">
            aicenter.yru.ac.th/?verify={certId}
          </code>
        </div>
      </main>
    </div>
  );
};

// Renders the reference-size cert scaled down to fit its container width, so
// the on-screen preview matches the PDF exactly.
const ScaledCert = ({ cert, substitutions }) => {
  const boxRef = useRef(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const measure = () => {
      if (boxRef.current) setScale(boxRef.current.clientWidth / CERT_REF_W);
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro && boxRef.current) ro.observe(boxRef.current);
    window.addEventListener('resize', measure);
    return () => { ro?.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  return (
    <div ref={boxRef} style={{ width: '100%', height: scale ? CERT_REF_H * scale : undefined, overflow: 'hidden' }}>
      {scale > 0 && (
        <div style={{ width: CERT_REF_W, height: CERT_REF_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <CertPreview cert={cert} substitutions={substitutions} fixedWidth={CERT_REF_W} />
        </div>
      )}
    </div>
  );
};

// Read-only cert renderer (mirrors CertificateEditor but no interactivity).
// Handles both the API shape (backgroundImageUrl) and the older mock shape (backgroundImage).
//
// `fixedWidth` (px) renders at an exact A4-landscape size instead of the
// responsive `w-full` box. The download flow renders one hidden copy at the
// reference width (CERT_REF_W) to capture a crisp, non-clipped PDF, and the
// on-screen preview scales that same layout down — so preview == PDF on any
// device. Without a fixed width, the stored px font sizes overflow a narrow
// cert and get clipped by the container ("ตัวอักษรขาด").
const CertPreview = ({ cert, substitutions, fixedWidth }) => {
  const bgUrl = cert.backgroundImageUrl || cert.backgroundImage;
  const sizeStyle = fixedWidth
    ? { width: fixedWidth, height: Math.round((fixedWidth * 210) / 297) }
    : undefined;
  return (
  <div
    className={`relative bg-gradient-to-br from-yellow-500/20 to-yellow-800/10 bg-slate-50 dark:bg-yrugray-950 ${fixedWidth ? '' : 'aspect-[297/210] w-full'}`}
    style={{
      ...sizeStyle,
      ...(bgUrl
        ? {
            backgroundImage: `url(${bgUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }
        : {}),
    }}
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
          className="absolute whitespace-pre-line"
          style={{
            ...style,
            fontFamily: el.fontFamily || '"Noto Sans Thai", sans-serif',
            fontSize: `${el.fontSize}px`,
            fontWeight: el.fontWeight || 'normal',
            color: el.color || '#ffffff',
            textAlign: el.textAlign || 'center',
            letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
            // A little extra line height so Thai upper/lower vowels and tone
            // marks aren't clipped at the glyph box edges.
            lineHeight: 1.35,
            paddingTop: '0.08em',
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
