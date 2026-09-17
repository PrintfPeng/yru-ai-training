import React, { useState, useRef, useEffect } from 'react';
import {
  Type as TypeIcon,
  Sparkles,
  Trash2,
  PenLine,
  Bold,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Move,
  Plus,
  ImagePlus,
  Upload,
  X,
  Baseline,
} from 'lucide-react';

// Font family options — เพิ่ม/ลด ที่นี่ได้ (Google Fonts ถูก preload ไว้ใน index.html)
export const FONT_OPTIONS = [
  { value: '"Noto Sans Thai", Inter, sans-serif', label: 'Noto Sans Thai', category: 'Sans (Modern)' },
  { value: '"Sarabun", sans-serif', label: 'Sarabun', category: 'Sans (Modern)' },
  { value: '"Prompt", sans-serif', label: 'Prompt', category: 'Sans (Modern)' },
  { value: '"Kanit", sans-serif', label: 'Kanit', category: 'Sans (Modern)' },
  { value: '"Mitr", sans-serif', label: 'Mitr', category: 'Sans (Rounded)' },
  { value: '"Bai Jamjuree", sans-serif', label: 'Bai Jamjuree', category: 'Sans (Rounded)' },
  { value: '"Chakra Petch", sans-serif', label: 'Chakra Petch', category: 'Display (Tech)' },
  { value: '"Noto Serif Thai", serif', label: 'Noto Serif Thai', category: 'Serif (Formal)' },
  { value: '"Playfair Display", "Noto Serif Thai", serif', label: 'Playfair Display', category: 'Serif (Formal)' },
  { value: '"Charm", "Noto Serif Thai", serif', label: 'Charm', category: 'Handwriting' },
  { value: '"Charmonman", cursive', label: 'Charmonman', category: 'Handwriting' },
];

const DEFAULT_FONT = FONT_OPTIONS[0].value;

const inputCls =
  'w-full bg-yrugray-800 border border-yrugray-700 text-sm rounded-lg px-3 py-2 text-white placeholder:text-yrugray-500 focus:outline-none focus:border-yrupink-500 focus:ring-1 focus:ring-yrupink-500 transition-all';

// Placeholder fields available to add to the canvas
// หมายเหตุ: ไม่มี placeholder "คะแนน" เพราะเป็นแบบสอบถามความพึงพอใจ ไม่ใช่ทดสอบความรู้
const PLACEHOLDER_FIELDS = [
  { field: 'participantName', label: 'ชื่อผู้เข้าอบรม', sample: '[ ชื่อผู้เข้าอบรม ]' },
  { field: 'courseTitle', label: 'ชื่อหลักสูตร', sample: '[ ชื่อหลักสูตร ]' },
  { field: 'issueDate', label: 'วันที่ออกใบรับรอง', sample: '[ วันที่ ]' },
  { field: 'trainingHours', label: 'จำนวนชั่วโมงอบรม', sample: '[ ชั่วโมงอบรม ]' },
  { field: 'certificateId', label: 'เลขที่ใบรับรอง', sample: '[ CERT-XXXX ]' },
  { field: 'signerName', label: 'ชื่อผู้ลงนาม', sample: '[ ผู้ลงนาม ]' },
  { field: 'signerPosition', label: 'ตำแหน่งผู้ลงนาม', sample: '[ ตำแหน่ง ]' },
];

const uid = () => `el_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

export const DEFAULT_ELEMENTS = () => [
  {
    id: uid(),
    kind: 'text',
    content: 'CERTIFICATE OF COMPLETION',
    x: 15, y: 12, width: 70, fontSize: 12, fontWeight: 'normal', color: '#9ca3af', textAlign: 'center', letterSpacing: 4,
  },
  {
    id: uid(),
    kind: 'text',
    content: 'ใบรับรองการอบรม',
    x: 15, y: 20, width: 70, fontSize: 28, fontWeight: 'bold', color: '#ffffff', textAlign: 'center',
  },
  {
    id: uid(),
    kind: 'text',
    content: 'มอบให้กับ',
    x: 20, y: 38, width: 60, fontSize: 14, fontWeight: 'normal', color: '#d1d5db', textAlign: 'center',
  },
  {
    id: uid(),
    kind: 'placeholder',
    field: 'participantName',
    x: 15, y: 46, width: 70, fontSize: 26, fontWeight: 'bold', color: '#ffffff', textAlign: 'center',
  },
  {
    id: uid(),
    kind: 'text',
    content: 'เพื่อรับรองว่าได้ผ่านการอบรมหลักสูตร',
    x: 15, y: 62, width: 70, fontSize: 13, fontWeight: 'normal', color: '#d1d5db', textAlign: 'center',
  },
  {
    id: uid(),
    kind: 'placeholder',
    field: 'courseTitle',
    x: 15, y: 68, width: 70, fontSize: 16, fontWeight: 'bold', color: '#f472b6', textAlign: 'center',
  },
];

const CertificateEditor = ({ cert, onChange, template }) => {
  const elements = cert.elements || [];
  const [selectedId, setSelectedId] = useState(null);
  const [guides, setGuides] = useState({ v: [], h: [] }); // smart-guide lines during drag
  const canvasRef = useRef(null);
  const dragRef = useRef(null); // { mode: 'move'|'resize', startPX, startPY, startX, startY, startWidth, startFontSize }
  const bgInputRef = useRef(null);
  const sigInputRef = useRef(null);

  // Keep latest state accessible in document-level pointer handlers without stale closures
  const liveRef = useRef({ cert, elements, onChange });
  useEffect(() => {
    liveRef.current = { cert, elements, onChange };
  });

  const selected = elements.find((e) => e.id === selectedId);

  const updateElement = (id, updates) => {
    // Always read latest state to survive rapid drag updates
    const { cert: c, elements: els, onChange: fn } = liveRef.current;
    fn({ ...c, elements: els.map((e) => (e.id === id ? { ...e, ...updates } : e)) });
  };

  const addElement = (el) => {
    const newEl = { id: uid(), ...el };
    onChange({ ...cert, elements: [...elements, newEl] });
    setSelectedId(newEl.id);
  };

  const removeElement = (id) => {
    onChange({ ...cert, elements: elements.filter((e) => e.id !== id) });
    if (selectedId === id) setSelectedId(null);
  };

  // ---- Drag & resize ----
  const onPointerDownElement = (e, id, mode = 'move') => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(id);
    const el = elements.find((x) => x.id === id);
    if (!el) return;
    const rect = canvasRef.current.getBoundingClientRect();
    dragRef.current = {
      id,
      mode,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: el.x,
      startY: el.y,
      startWidth: el.width || 30,
      startHeight: el.height,
      startFontSize: el.fontSize || 14,
      rectW: rect.width,
      rectH: rect.height,
    };
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startClientX;
    const dy = e.clientY - d.startClientY;
    const dxPct = (dx / d.rectW) * 100;
    const dyPct = (dy / d.rectH) * 100;

    const currentEls = liveRef.current.elements;
    const el = currentEls.find((x) => x.id === d.id);
    if (!el) return;

    if (d.mode === 'move') {
      const rawX = clamp(d.startX + dxPct, 0, 100 - (el.width || 20));
      const rawY = clamp(d.startY + dyPct, 0, 98);
      const { x: nextX, y: nextY, activeV, activeH } = snapToGuides(el, rawX, rawY, currentEls, d.rectH);
      updateElement(d.id, { x: nextX, y: nextY });
      setGuides({ v: activeV, h: activeH });
    } else if (d.mode === 'resize') {
      if (el.kind === 'image') {
        const nextW = clamp(d.startWidth + dxPct, 5, 95);
        const nextH = clamp((d.startHeight || 10) + (dy / d.rectH) * 100, 3, 80);
        updateElement(d.id, { width: nextW, height: nextH });
      } else {
        const nextFS = clamp(d.startFontSize + dx * 0.4, 8, 80);
        const nextW = clamp(d.startWidth + dxPct, 10, 95);
        updateElement(d.id, { fontSize: Math.round(nextFS), width: nextW });
      }
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
    setGuides({ v: [], h: [] });
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
  };

  // ---- File uploads ----
  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onBackgroundSelect = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์พื้นหลังต้องไม่เกิน 5MB');
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    onChange({ ...cert, backgroundImage: dataUrl, backgroundName: file.name });
  };

  const onSignatureSelect = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('ขนาดไฟล์ลายเซ็นต้องไม่เกิน 2MB');
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    // Also add as image element on the canvas if not present
    const hasSignature = elements.some((e) => e.kind === 'image' && e.role === 'signature');
    const nextElements = hasSignature
      ? elements.map((e) => (e.kind === 'image' && e.role === 'signature' ? { ...e, src: dataUrl } : e))
      : [
          ...elements,
          {
            id: uid(),
            kind: 'image',
            role: 'signature',
            src: dataUrl,
            x: 35, y: 78, width: 30, height: 12,
          },
        ];
    onChange({ ...cert, signatureImage: dataUrl, signatureName: file.name, elements: nextElements });
  };

  return (
    <div className="space-y-4">
      {/* File uploaders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FileField
          label="พื้นหลังใบรับรอง (upload)"
          hint="รองรับ JPG/PNG/WebP ≤ 5MB — แนะนำอัตราส่วน A4 แนวนอน (297×210)"
          previewSrc={cert.backgroundImage}
          fileName={cert.backgroundName}
          inputRef={bgInputRef}
          onSelect={onBackgroundSelect}
          onRemove={() => onChange({ ...cert, backgroundImage: '', backgroundName: '' })}
          height="h-24"
        />
        <FileField
          label="ลายเซ็นอิเล็กทรอนิกส์"
          hint="PNG แบบพื้นหลังโปร่งใส (≤ 2MB) — จะถูกวางบนใบรับรองอัตโนมัติ"
          previewSrc={cert.signatureImage}
          fileName={cert.signatureName}
          inputRef={sigInputRef}
          onSelect={onSignatureSelect}
          onRemove={() => {
            const filtered = elements.filter((e) => !(e.kind === 'image' && e.role === 'signature'));
            onChange({ ...cert, signatureImage: '', signatureName: '', elements: filtered });
          }}
          height="h-24"
        />
      </div>

      {/* Toolbar */}
      <div className="bg-yrugray-800/60 border border-yrugray-700 rounded-xl p-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() =>
            addElement({
              kind: 'text',
              content: 'ข้อความใหม่',
              x: 30, y: 50, width: 40, fontSize: 16, fontWeight: 'normal', color: '#ffffff', textAlign: 'center',
            })
          }
          className="px-3 py-1.5 bg-yrupink-600 hover:bg-yrupink-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5"
        >
          <TypeIcon className="w-3.5 h-3.5" />
          เพิ่มข้อความ
        </button>

        <PlaceholderMenu onPick={(f) =>
          addElement({
            kind: 'placeholder',
            field: f.field,
            x: 30, y: 50, width: 40, fontSize: 20, fontWeight: 'bold', color: '#ffffff', textAlign: 'center',
          })
        } />

        <button
          type="button"
          onClick={() => sigInputRef.current?.click()}
          className="px-3 py-1.5 bg-yrugray-700 hover:bg-yrugray-600 text-white text-xs font-medium rounded-lg flex items-center gap-1.5"
        >
          <PenLine className="w-3.5 h-3.5" />
          {cert.signatureImage ? 'เปลี่ยนลายเซ็น' : 'อัปโหลดลายเซ็น'}
        </button>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => onChange({ ...cert, elements: DEFAULT_ELEMENTS() })}
          className="px-3 py-1.5 bg-yrugray-700 hover:bg-yrugray-600 text-yrugray-200 text-xs font-medium rounded-lg"
        >
          รีเซ็ตเป็นเทมเพลตเริ่มต้น
        </button>

        {selectedId && (
          <button
            type="button"
            onClick={() => removeElement(selectedId)}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded-lg flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            ลบที่เลือก
          </button>
        )}
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        onPointerDown={() => setSelectedId(null)}
        className={`relative aspect-[297/210] rounded-xl border-2 border-yrugray-700 overflow-hidden bg-gradient-to-br ${template?.accent || 'from-yrugray-800 to-yrugray-900'} bg-yrugray-950 select-none touch-none`}
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
        {/* Decorative frame (only when no background image) */}
        {!cert.backgroundImage && (
          <>
            <div className="pointer-events-none absolute inset-4 border border-white/20 rounded-lg" />
            <div className="pointer-events-none absolute inset-6 border border-white/10 rounded-lg" />
          </>
        )}

        {elements.map((el) => (
          <CanvasElement
            key={el.id}
            element={el}
            selected={selectedId === el.id}
            onPointerDown={(e) => onPointerDownElement(e, el.id, 'move')}
            onResizePointerDown={(e) => onPointerDownElement(e, el.id, 'resize')}
            onSelect={() => setSelectedId(el.id)}
          />
        ))}

        {/* Smart guides (canva-style alignment lines) */}
        {guides.v.map((g) => (
          <div
            key={`v-${g.pos}-${g.kind}`}
            className={`absolute top-0 bottom-0 w-px pointer-events-none z-30 ${
              g.kind === 'canvas' ? 'bg-fuchsia-400' : 'bg-yrupink-400'
            }`}
            style={{ left: `${g.pos}%`, boxShadow: '0 0 4px rgba(244,114,182,0.8)' }}
          />
        ))}
        {guides.h.map((g) => (
          <div
            key={`h-${g.pos}-${g.kind}`}
            className={`absolute left-0 right-0 h-px pointer-events-none z-30 ${
              g.kind === 'canvas' ? 'bg-fuchsia-400' : 'bg-yrupink-400'
            }`}
            style={{ top: `${g.pos}%`, boxShadow: '0 0 4px rgba(244,114,182,0.8)' }}
          />
        ))}

        {/* Empty-state hint */}
        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-xs text-yrugray-400">เพิ่ม element จาก toolbar ด้านบน</p>
          </div>
        )}
      </div>

      {/* Property panel */}
      {selected && (
        <PropertyPanel
          element={selected}
          onChange={(updates) => updateElement(selected.id, updates)}
        />
      )}

      {/* Hidden inputs */}
      <input
        ref={bgInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onBackgroundSelect(e.target.files?.[0])}
      />
      <input
        ref={sigInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onSignatureSelect(e.target.files?.[0])}
      />
    </div>
  );
};

// ---- Sub components ----

const CanvasElement = ({ element, selected, onPointerDown, onResizePointerDown, onSelect }) => {
  const displayText =
    element.kind === 'placeholder'
      ? PLACEHOLDER_FIELDS.find((f) => f.field === element.field)?.sample || `[ ${element.field} ]`
      : element.content;

  const commonStyle = {
    left: `${element.x}%`,
    top: `${element.y}%`,
    width: `${element.width}%`,
  };

  return (
    <div
      onPointerDown={(e) => {
        onSelect();
        onPointerDown(e);
      }}
      className={`absolute cursor-move ${
        selected ? 'ring-2 ring-yrupink-500 ring-offset-1 ring-offset-transparent' : 'hover:ring-1 hover:ring-yrupink-500/50'
      }`}
      style={commonStyle}
    >
      {element.kind === 'image' ? (
        <img
          src={element.src}
          alt=""
          draggable={false}
          style={{ width: '100%', height: `${element.height}%`, minHeight: 30 }}
          className="object-contain pointer-events-none"
        />
      ) : (
        <div
          style={{
            fontFamily: element.fontFamily || DEFAULT_FONT,
            fontSize: `${element.fontSize}px`,
            fontWeight: element.fontWeight || 'normal',
            color: element.color || '#ffffff',
            textAlign: element.textAlign || 'center',
            letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : undefined,
            lineHeight: 1.2,
            fontStyle: element.kind === 'placeholder' ? 'italic' : 'normal',
            borderBottom: element.kind === 'placeholder' ? '1px solid rgba(244, 114, 182, 0.5)' : undefined,
            paddingBottom: element.kind === 'placeholder' ? 2 : undefined,
          }}
          className="pointer-events-none whitespace-nowrap overflow-hidden text-ellipsis"
        >
          {displayText}
        </div>
      )}

      {/* Resize handle (bottom-right) */}
      {selected && (
        <div
          onPointerDown={onResizePointerDown}
          className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-yrupink-500 border border-white rounded cursor-nwse-resize"
          title="ลากเพื่อปรับขนาด"
        />
      )}
    </div>
  );
};

const PropertyPanel = ({ element, onChange }) => {
  return (
    <div className="bg-yrugray-800/50 border border-yrugray-700 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Move className="w-4 h-4 text-yrupink-400" />
        <h4 className="text-sm font-semibold text-white">
          Element ที่เลือก: <span className="text-yrupink-400">{elementLabel(element)}</span>
        </h4>
      </div>

      {element.kind !== 'image' && (
        <>
          {element.kind === 'text' && (
            <div>
              <label className="text-xs text-yrugray-400 mb-1 block">ข้อความ</label>
              <input
                value={element.content || ''}
                onChange={(e) => onChange({ content: e.target.value })}
                className={inputCls}
              />
            </div>
          )}

          {element.kind === 'placeholder' && (
            <div>
              <label className="text-xs text-yrugray-400 mb-1 block">ประเภท Placeholder</label>
              <select
                value={element.field}
                onChange={(e) => onChange({ field: e.target.value })}
                className={inputCls}
              >
                {PLACEHOLDER_FIELDS.map((f) => (
                  <option key={f.field} value={f.field}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs text-yrugray-400 mb-1 flex items-center gap-1.5">
              <Baseline className="w-3.5 h-3.5" /> รูปแบบตัวอักษร (Font)
            </label>
            <select
              value={element.fontFamily || DEFAULT_FONT}
              onChange={(e) => onChange({ fontFamily: e.target.value })}
              className={inputCls}
              style={{ fontFamily: element.fontFamily || DEFAULT_FONT }}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                  {f.label} — {f.category}
                </option>
              ))}
            </select>
            {/* Preview strip */}
            <div
              className="mt-2 px-3 py-2 rounded-lg bg-yrugray-900/60 border border-yrugray-700 text-white text-base"
              style={{ fontFamily: element.fontFamily || DEFAULT_FONT }}
            >
              AaBbCc 123 — ตัวอย่าง ก ข ค ง จ ฉ
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-yrugray-400 mb-1 block">ขนาดตัวอักษร ({element.fontSize}px)</label>
              <input
                type="range"
                min="8"
                max="60"
                value={element.fontSize}
                onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
                className="w-full accent-yrupink-500"
              />
            </div>
            <div>
              <label className="text-xs text-yrugray-400 mb-1 block">สีตัวอักษร</label>
              <input
                type="color"
                value={element.color || '#ffffff'}
                onChange={(e) => onChange({ color: e.target.value })}
                className="w-full h-9 rounded-lg bg-yrugray-800 border border-yrugray-700 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs text-yrugray-400 mb-1 block">น้ำหนัก</label>
              <button
                type="button"
                onClick={() => onChange({ fontWeight: element.fontWeight === 'bold' ? 'normal' : 'bold' })}
                className={`w-full h-9 rounded-lg text-sm flex items-center justify-center gap-1.5 border ${
                  element.fontWeight === 'bold'
                    ? 'bg-yrupink-500/20 border-yrupink-500 text-white'
                    : 'bg-yrugray-800 border-yrugray-700 text-yrugray-300 hover:border-yrupink-500/50'
                }`}
              >
                <Bold className="w-3.5 h-3.5" />
                {element.fontWeight === 'bold' ? 'Bold' : 'Normal'}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-yrugray-400 mb-1 block">การจัดวางข้อความ</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: 'left', icon: AlignLeft },
                { v: 'center', icon: AlignCenter },
                { v: 'right', icon: AlignRight },
              ].map((a) => (
                <button
                  key={a.v}
                  type="button"
                  onClick={() => onChange({ textAlign: a.v })}
                  className={`h-9 rounded-lg flex items-center justify-center border ${
                    (element.textAlign || 'center') === a.v
                      ? 'bg-yrupink-500/20 border-yrupink-500 text-white'
                      : 'bg-yrugray-800 border-yrugray-700 text-yrugray-400 hover:border-yrupink-500/50'
                  }`}
                >
                  <a.icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {element.kind === 'image' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-yrugray-400 mb-1 block">ความกว้าง ({Math.round(element.width)}%)</label>
            <input
              type="range"
              min="5"
              max="95"
              value={element.width}
              onChange={(e) => onChange({ width: Number(e.target.value) })}
              className="w-full accent-yrupink-500"
            />
          </div>
          <div>
            <label className="text-xs text-yrugray-400 mb-1 block">ความสูง ({Math.round(element.height)}%)</label>
            <input
              type="range"
              min="3"
              max="80"
              value={element.height}
              onChange={(e) => onChange({ height: Number(e.target.value) })}
              className="w-full accent-yrupink-500"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-yrugray-400 mb-1 block">ตำแหน่ง X ({Math.round(element.x)}%)</label>
          <input
            type="range"
            min="0"
            max="90"
            value={element.x}
            onChange={(e) => onChange({ x: Number(e.target.value) })}
            className="w-full accent-yrupink-500"
          />
        </div>
        <div>
          <label className="text-xs text-yrugray-400 mb-1 block">ตำแหน่ง Y ({Math.round(element.y)}%)</label>
          <input
            type="range"
            min="0"
            max="95"
            value={element.y}
            onChange={(e) => onChange({ y: Number(e.target.value) })}
            className="w-full accent-yrupink-500"
          />
        </div>
      </div>

      <p className="text-[11px] text-yrugray-500 pt-1 border-t border-yrugray-700">
        เคล็ดลับ: ลากตัว element เพื่อเลื่อน • ลากมุมล่างขวา (จุดชมพู) เพื่อปรับขนาด • คลิกที่ว่างเพื่อยกเลิกการเลือก
      </p>
    </div>
  );
};

const PlaceholderMenu = ({ onPick }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-1.5 bg-yrugray-700 hover:bg-yrugray-600 text-white text-xs font-medium rounded-lg flex items-center gap-1.5"
      >
        <Sparkles className="w-3.5 h-3.5" />
        เพิ่ม Placeholder
        <Plus className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-yrugray-800 border border-yrugray-700 rounded-lg shadow-xl z-20 py-1">
          {PLACEHOLDER_FIELDS.map((f) => (
            <button
              key={f.field}
              type="button"
              onClick={() => {
                onPick(f);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs text-yrugray-200 hover:bg-yrugray-700 hover:text-white"
            >
              {f.label}
              <span className="text-yrugray-500 ml-2">{f.sample}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const FileField = ({ label, hint, previewSrc, fileName, inputRef, onSelect, onRemove, height = 'h-24' }) => (
  <div>
    <label className="text-sm text-yrugray-300 mb-1.5 flex items-center gap-1.5">
      <ImagePlus className="w-4 h-4" />
      {label}
    </label>
    {previewSrc ? (
      <div className={`relative group rounded-xl overflow-hidden border border-yrugray-700 ${height} bg-yrugray-800 flex items-center justify-center`}>
        <img src={previewSrc} alt="preview" className="max-h-full max-w-full object-contain" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white text-xs flex items-center gap-1"
          >
            <Upload className="w-3 h-3" /> เปลี่ยน
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="px-3 py-1 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-xs flex items-center gap-1"
          >
            <X className="w-3 h-3" /> ลบ
          </button>
        </div>
      </div>
    ) : (
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all ${height} flex items-center justify-center text-center px-4 border-yrugray-700 hover:border-yrupink-500/50 hover:bg-yrugray-800/30 bg-yrugray-800/20`}
      >
        <div>
          <ImagePlus className="w-5 h-5 text-yrupink-400 mx-auto mb-1" />
          <p className="text-xs font-medium text-white">คลิกเพื่อเลือกไฟล์</p>
          <p className="text-[11px] text-yrugray-400 mt-0.5">{hint}</p>
        </div>
      </div>
    )}
    {fileName && <p className="text-[11px] text-yrugray-500 mt-1 truncate">{fileName}</p>}
  </div>
);

const elementLabel = (el) => {
  if (el.kind === 'image') return el.role === 'signature' ? 'ลายเซ็น' : 'รูปภาพ';
  if (el.kind === 'placeholder')
    return PLACEHOLDER_FIELDS.find((f) => f.field === el.field)?.label || el.field;
  return `ข้อความ "${(el.content || '').slice(0, 20)}${(el.content || '').length > 20 ? '…' : ''}"`;
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// Approx element height (%) — image has real height, text approximated from fontSize
const elementHeightPct = (el, canvasHeightPx) => {
  if (el.kind === 'image') return el.height || 10;
  const fs = el.fontSize || 14;
  // fontSize px → % of canvas height; add ~20% for line-height
  return canvasHeightPx > 0 ? ((fs * 1.2) / canvasHeightPx) * 100 : 5;
};

/**
 * Canva-style smart guides: compare dragged element's edges & centers
 * against canvas center and all other elements' edges & centers.
 * Returns snapped x/y (%) + arrays of active guide positions to draw.
 */
const SNAP_THRESHOLD = 1.2; // % tolerance for snap+guide

const snapToGuides = (dragged, rawX, rawY, allElements, canvasHeightPx) => {
  const others = allElements.filter((e) => e.id !== dragged.id);
  const dW = dragged.width || 20;
  const dH = elementHeightPct(dragged, canvasHeightPx);

  const dLeft = rawX;
  const dCenterX = rawX + dW / 2;
  const dRight = rawX + dW;
  const dTop = rawY;
  const dCenterY = rawY + dH / 2;
  const dBottom = rawY + dH;

  // Build reference targets from canvas + other elements
  const vRefs = [{ pos: 50, kind: 'canvas' }];
  const hRefs = [{ pos: 50, kind: 'canvas' }];

  others.forEach((o) => {
    const oW = o.width || 20;
    const oH = elementHeightPct(o, canvasHeightPx);
    vRefs.push({ pos: o.x, kind: 'element' });
    vRefs.push({ pos: o.x + oW / 2, kind: 'element' });
    vRefs.push({ pos: o.x + oW, kind: 'element' });
    hRefs.push({ pos: o.y, kind: 'element' });
    hRefs.push({ pos: o.y + oH / 2, kind: 'element' });
    hRefs.push({ pos: o.y + oH, kind: 'element' });
  });

  let snapX = rawX;
  let snapY = rawY;
  const activeV = [];
  const activeH = [];
  let bestVDelta = SNAP_THRESHOLD;
  let bestHDelta = SNAP_THRESHOLD;

  // Vertical alignment (X axis)
  vRefs.forEach((ref) => {
    // dragged center vs ref
    let delta = Math.abs(dCenterX - ref.pos);
    if (delta < SNAP_THRESHOLD) {
      if (delta < bestVDelta) {
        bestVDelta = delta;
        snapX = ref.pos - dW / 2;
      }
      activeV.push(ref);
    }
    // dragged left vs ref
    delta = Math.abs(dLeft - ref.pos);
    if (delta < SNAP_THRESHOLD) {
      if (delta < bestVDelta) {
        bestVDelta = delta;
        snapX = ref.pos;
      }
      activeV.push(ref);
    }
    // dragged right vs ref
    delta = Math.abs(dRight - ref.pos);
    if (delta < SNAP_THRESHOLD) {
      if (delta < bestVDelta) {
        bestVDelta = delta;
        snapX = ref.pos - dW;
      }
      activeV.push(ref);
    }
  });

  // Horizontal alignment (Y axis)
  hRefs.forEach((ref) => {
    let delta = Math.abs(dCenterY - ref.pos);
    if (delta < SNAP_THRESHOLD) {
      if (delta < bestHDelta) {
        bestHDelta = delta;
        snapY = ref.pos - dH / 2;
      }
      activeH.push(ref);
    }
    delta = Math.abs(dTop - ref.pos);
    if (delta < SNAP_THRESHOLD) {
      if (delta < bestHDelta) {
        bestHDelta = delta;
        snapY = ref.pos;
      }
      activeH.push(ref);
    }
    delta = Math.abs(dBottom - ref.pos);
    if (delta < SNAP_THRESHOLD) {
      if (delta < bestHDelta) {
        bestHDelta = delta;
        snapY = ref.pos - dH;
      }
      activeH.push(ref);
    }
  });

  // Dedupe by pos (keep 'canvas' kind if both present)
  const dedupe = (arr) => {
    const map = new Map();
    arr.forEach((g) => {
      const key = g.pos.toFixed(2);
      if (!map.has(key) || g.kind === 'canvas') map.set(key, g);
    });
    return [...map.values()];
  };

  return { x: snapX, y: snapY, activeV: dedupe(activeV), activeH: dedupe(activeH) };
};

export default CertificateEditor;
