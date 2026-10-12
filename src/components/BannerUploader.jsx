import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Upload, X, ImagePlus, Image as ImageIcon, Crop, Check, ZoomIn } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

// Reusable banner picker used by both "สร้างกิจกรรม" and the inline edit form.
// Workflow: pick/drop a file → crop to 16:9 → emit a cropped JPEG data URL via
// onChange. An existing value can be re-cropped ("ปรับตำแหน่ง") or removed.
//
// Props:
//   value    : current image (http(s) URL or data: URL), '' when none
//   onChange : (dataUrl | '') => void
//   aspect   : crop aspect ratio (default 16/9)

const MAX_FILE_MB = 5;
const OUT_WIDTH = 1600; // exported JPEG width; height derived from aspect

const BannerUploader = ({ value, onChange, aspect = 16 / 9 }) => {
  const toast = useToast();
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [cropSrc, setCropSrc] = useState(null); // image being cropped (raw data URL)

  const pickFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.warning('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WebP, GIF)');
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.warning(`ขนาดไฟล์ต้องไม่เกิน ${MAX_FILE_MB}MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div>
      <label className="text-sm text-slate-600 dark:text-yrugray-300 mb-1.5 flex items-center gap-1.5">
        <ImageIcon className="w-4 h-4" />
        รูปแบนเนอร์กิจกรรม
        <span className="text-slate-400 dark:text-yrugray-500 font-normal text-xs">(อัตราส่วน 16:9, สูงสุด {MAX_FILE_MB}MB)</span>
      </label>

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-slate-300 dark:border-yrugray-700">
          <img src={value} alt="banner preview" className="w-full aspect-[16/9] object-cover bg-slate-100 dark:bg-yrugray-800" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" onClick={() => setCropSrc(value)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white text-xs font-medium flex items-center gap-1.5">
              <Crop className="w-3.5 h-3.5" /> ปรับตำแหน่ง
            </button>
            <button type="button" onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white text-xs font-medium flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" /> เปลี่ยนรูป
            </button>
            <button type="button" onClick={() => onChange('')}
              className="px-3 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-xs font-medium flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> ลบ
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all aspect-[16/9] max-h-64 flex flex-col items-center justify-center text-center px-6 ${
            dragActive
              ? 'border-yrupink-500 bg-yrupink-500/10'
              : 'border-slate-300 dark:border-yrugray-700 hover:border-yrupink-500/50 hover:bg-slate-50 dark:hover:bg-yrugray-800/30'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-yrupink-500/10 border border-yrupink-500/30 flex items-center justify-center mb-3">
            <ImagePlus className="w-6 h-6 text-yrupink-400" />
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">คลิกเพื่อเลือกรูป หรือ ลากไฟล์มาวางที่นี่</p>
          <p className="text-xs text-slate-500 dark:text-yrugray-400">รองรับ JPG, PNG, WebP, GIF ขนาดไม่เกิน {MAX_FILE_MB}MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ''; }}
      />

      {cropSrc && (
        <BannerCropper
          src={cropSrc}
          aspect={aspect}
          onCancel={() => setCropSrc(null)}
          onConfirm={(dataUrl) => { onChange(dataUrl); setCropSrc(null); }}
        />
      )}
    </div>
  );
};

// ---- Crop modal: pan (drag) + zoom (slider/wheel), export cropped JPEG ----

const BannerCropper = ({ src, aspect, onCancel, onConfirm }) => {
  const frameRef = useRef(null);
  const imgRef = useRef(null);
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const [img, setImg] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);        // user zoom multiplier (>= 1)
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // image top-left vs frame top-left (px)
  const drag = useRef(null);

  // Base scale so the image fully covers the frame at zoom = 1.
  const baseScale = (frame.w && img.w)
    ? Math.max(frame.w / img.w, frame.h / img.h)
    : 1;
  const dispW = img.w * baseScale * zoom;
  const dispH = img.h * baseScale * zoom;

  // Keep the frame fully covered: clamp offset so no gap shows.
  const clamp = useCallback((o, dw = dispW, dh = dispH) => ({
    x: Math.min(0, Math.max(frame.w - dw, o.x)),
    y: Math.min(0, Math.max(frame.h - dh, o.y)),
  }), [frame.w, frame.h, dispW, dispH]);

  // Measure the frame once it renders (and on resize).
  useEffect(() => {
    const measure = () => {
      const el = frameRef.current;
      if (el) setFrame({ w: el.clientWidth, h: el.clientHeight });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Load image natural size, then center it.
  useEffect(() => {
    const image = new Image();
    image.onload = () => setImg({ w: image.naturalWidth, h: image.naturalHeight });
    image.src = src;
    imgRef.current = image;
  }, [src]);

  // Re-center whenever geometry changes (frame measured / image loaded / zoom).
  useEffect(() => {
    if (!frame.w || !img.w) return;
    setOffset((o) => clamp({
      x: o.x || (frame.w - dispW) / 2,
      y: o.y || (frame.h - dispH) / 2,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame.w, frame.h, img.w, img.h]);

  const onZoom = (z) => {
    const nz = Math.min(4, Math.max(1, z));
    const ndw = img.w * baseScale * nz;
    const ndh = img.h * baseScale * nz;
    // Zoom toward the frame center so it feels anchored.
    setOffset((o) => {
      const cx = frame.w / 2, cy = frame.h / 2;
      const rx = (cx - o.x) / dispW;
      const ry = (cy - o.y) / dispH;
      return clamp({ x: cx - rx * ndw, y: cy - ry * ndh }, ndw, ndh);
    });
    setZoom(nz);
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.sx;
    const dy = e.clientY - drag.current.sy;
    setOffset(clamp({ x: drag.current.ox + dx, y: drag.current.oy + dy }));
  };
  const onPointerUp = () => { drag.current = null; };

  const confirm = () => {
    const image = imgRef.current;
    if (!image || !frame.w) return;
    const s = baseScale * zoom;              // frame-px per image-px
    const sx = -offset.x / s;                // source rect (image pixels)
    const sy = -offset.y / s;
    const sw = frame.w / s;
    const sh = frame.h / s;
    const canvas = document.createElement('canvas');
    canvas.width = OUT_WIDTH;
    canvas.height = Math.round(OUT_WIDTH / aspect);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    onConfirm(canvas.toDataURL('image/jpeg', 0.85));
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="w-full max-w-2xl bg-white dark:bg-yrugray-900 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-200 dark:border-yrugray-800 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Crop className="w-4 h-4 text-yrupink-500" /> ปรับตำแหน่งรูปแบนเนอร์ (16:9)
          </h3>
          <button onClick={onCancel} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <div
            ref={frameRef}
            className="relative w-full aspect-[16/9] overflow-hidden rounded-xl bg-slate-200 dark:bg-yrugray-950 cursor-grab active:cursor-grabbing touch-none select-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onWheel={(e) => onZoom(zoom + (e.deltaY < 0 ? 0.1 : -0.1))}
          >
            {img.w > 0 && (
              <img
                src={src}
                alt="crop"
                draggable={false}
                className="absolute top-0 left-0 max-w-none pointer-events-none"
                style={{ width: dispW, height: dispH, transform: `translate(${offset.x}px, ${offset.y}px)` }}
              />
            )}
            {/* grid overlay */}
            <div className="pointer-events-none absolute inset-0 border-2 border-white/60" />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <ZoomIn className="w-4 h-4 text-slate-500 dark:text-yrugray-400 flex-shrink-0" />
            <input
              type="range" min="1" max="4" step="0.01" value={zoom}
              onChange={(e) => onZoom(Number(e.target.value))}
              className="w-full accent-yrupink-500"
            />
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-yrugray-400">ลากรูปเพื่อเลื่อน · เลื่อนแถบหรือหมุนเมาส์เพื่อซูม</p>
        </div>

        <div className="px-5 py-4 border-t border-slate-200 dark:border-yrugray-800 flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-yrugray-300 hover:bg-slate-100 dark:hover:bg-yrugray-800">
            ยกเลิก
          </button>
          <button onClick={confirm} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-yrupink-600 hover:bg-yrupink-500 flex items-center gap-1.5">
            <Check className="w-4 h-4" /> ใช้รูปนี้
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BannerUploader;
