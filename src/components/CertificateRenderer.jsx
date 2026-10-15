import React, { useRef, useState, useEffect } from 'react';

// A4 landscape reference size (px). The cert stores font sizes in px at this
// width; everything scales from here so the on-screen preview matches the PDF.
export const CERT_REF_W = 1123;
export const CERT_REF_H = Math.round((CERT_REF_W * 210) / 297); // ≈ 794

// Sample values for designing/previewing a certificate before any is issued.
export const SAMPLE_SUBSTITUTIONS = {
  participantName: 'สมชาย ใจดี',
  teamName: 'ทีมตัวอย่าง',
  courseTitle: 'หลักสูตรตัวอย่าง',
  issueDate: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
  trainingHours: '6 ชั่วโมง',
  certificateId: `ควท.มรย.${new Date().getFullYear() + 543}/03/001`,
  signerName: 'ผู้อำนวยการศูนย์ AI YRU',
  signerPosition: 'AI Center, Yala Rajabhat University',
};

// Renders the reference-size cert scaled down to fit its container width, so
// the on-screen preview matches the PDF exactly.
export const ScaledCert = ({ cert, substitutions }) => {
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
export const CertPreview = ({ cert, substitutions, fixedWidth }) => {
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
