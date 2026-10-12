import React from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  Type,
  AlignLeft,
  CircleDot,
  CheckSquare,
  ChevronDown,
  Upload,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Table2,
  Phone as PhoneIcon,
  AtSign,
  X,
} from 'lucide-react';

// Question type registry — เพิ่ม/ลด ที่นี่ครบจบใน object เดียว
export const QUESTION_TYPES = [
  { value: 'short_answer', label: 'คำตอบสั้นๆ (Short answer)', icon: Type, hasOptions: false },
  { value: 'paragraph', label: 'ย่อหน้า (Paragraph)', icon: AlignLeft, hasOptions: false },
  { value: 'multiple_choice', label: 'หลายตัวเลือก (Multiple choice)', icon: CircleDot, hasOptions: true },
  { value: 'checkboxes', label: 'ช่องทำเครื่องหมาย (Checkboxes)', icon: CheckSquare, hasOptions: true },
  { value: 'dropdown', label: 'เลื่อนลง (Dropdown)', icon: ChevronDown, hasOptions: true },
  { value: 'file_upload', label: 'อัปโหลดไฟล์ (File upload)', icon: Upload, hasOptions: false },
  { value: 'date', label: 'วันที่ (Date)', icon: CalendarIcon, hasOptions: false },
  { value: 'time', label: 'เวลา (Time)', icon: ClockIcon, hasOptions: false },
  { value: 'phone', label: 'เบอร์โทรศัพท์ (10 หลัก)', icon: PhoneIcon, hasOptions: false },
  { value: 'email', label: 'อีเมล (Email)', icon: AtSign, hasOptions: false },
  // Matrix of sub-questions sharing one numeric score scale (1..scaleMax).
  // `options[]` is reused as the row labels (ข้อย่อย/ด้าน…).
  { value: 'rating_matrix', label: 'ตารางให้คะแนน (Rating matrix)', icon: Table2, hasOptions: true },
];

export const DEFAULT_SCALE_MAX = 5;

// ----- Registration-form defaults (เดี่ยว/ทีม) -----
export const PREFIX_OPTIONS = ['นาย', 'นาง', 'นางสาว', 'เด็กชาย', 'เด็กหญิง'];

/**
 * The 5 default registration questions. Pass a member number for team blocks
 * (labels get a "สมาชิกคนที่ N" prefix and a `member` tag).
 */
export const makeRegistrationDefaults = (memberNo = null) => {
  const tag = memberNo ? `สมาชิกคนที่ ${memberNo} · ` : '';
  const base = (key, type, label, extra = {}) => ({
    id: Date.now() + Math.random(),
    key, type, question: tag + label, required: true,
    options: extra.options || ['ตัวเลือก 1'],
    ...(memberNo ? { member: memberNo } : {}),
    ...extra,
  });
  return [
    base('prefix',     'dropdown',     'คำนำหน้าชื่อ', { options: [...PREFIX_OPTIONS] }),
    base('first_name', 'short_answer', 'ชื่อ (ไม่ต้องใส่คำนำหน้า)'),
    base('last_name',  'short_answer', 'นามสกุล'),
    base('phone',      'phone',        'เบอร์โทรศัพท์'),
    base('email',      'email',        'email'),
  ];
};

export const makeEmptyQuestion = () => ({
  id: Date.now() + Math.random(),
  type: 'short_answer',
  question: '',
  options: ['ตัวเลือก 1'],
  required: false,
});

const inputCls =
  'w-full bg-white dark:bg-yrugray-800 border border-slate-300 dark:border-yrugray-700 text-[15px] rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-yrugray-500 focus:outline-none focus:border-yrupink-500 focus:ring-1 focus:ring-yrupink-500 transition-all';

/**
 * Controlled dynamic form builder.
 * Props:
 *   questions: Array<Question>
 *   onChange: (nextQuestions) => void
 *   title?: string       — section title
 *   description?: string — small hint under title
 *   emptyText?: string   — text shown when there are no questions
 */
const DynamicFormBuilder = ({
  questions,
  onChange,
  title = 'ฟอร์มลงทะเบียน (Dynamic Form)',
  description = 'ออกแบบคำถามที่ต้องการให้ผู้ใช้กรอก — ลากเพื่อจัดลำดับ (จะเปิดใช้ในเวอร์ชันถัดไป)',
  emptyText = 'ยังไม่มีคำถาม — กดปุ่ม "สร้างคำถาม" เพื่อเริ่มต้น',
}) => {
  const addQuestion = () => onChange([...questions, makeEmptyQuestion()]);

  const updateQuestion = (id, updates) =>
    onChange(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));

  const removeQuestion = (id) => onChange(questions.filter((q) => q.id !== id));

  const addOption = (qid) =>
    onChange(
      questions.map((q) =>
        q.id === qid ? { ...q, options: [...q.options, `ตัวเลือก ${q.options.length + 1}`] } : q
      )
    );

  const updateOption = (qid, idx, value) =>
    onChange(
      questions.map((q) =>
        q.id === qid ? { ...q, options: q.options.map((o, i) => (i === idx ? value : o)) } : q
      )
    );

  const removeOption = (qid, idx) =>
    onChange(
      questions.map((q) =>
        q.id === qid ? { ...q, options: q.options.filter((_, i) => i !== idx) } : q
      )
    );

  return (
    <section className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-yrugray-800 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          {description && <p className="text-sm text-slate-600 dark:text-yrugray-400 mt-1">{description}</p>}
        </div>
        <button
          onClick={addQuestion}
          type="button"
          className="px-4 py-2 bg-yrupink-600 hover:bg-yrupink-500 text-white text-[15px] font-semibold rounded-lg shadow-lg shadow-yrupink-500/20 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          สร้างคำถาม
        </button>
      </div>

      <div className="p-6 space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-300 dark:border-yrugray-800 rounded-xl bg-slate-50/50 dark:bg-transparent">
            <div className="w-14 h-14 bg-slate-100 dark:bg-yrugray-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-slate-500 dark:text-yrugray-500" />
            </div>
            <p className="text-slate-600 dark:text-yrugray-400 text-[15px]">{emptyText}</p>
          </div>
        ) : (
          questions.map((q, idx) => (
            <QuestionEditor
              key={q.id}
              index={idx}
              question={q}
              onUpdate={(updates) => updateQuestion(q.id, updates)}
              onRemove={() => removeQuestion(q.id)}
              onAddOption={() => addOption(q.id)}
              onUpdateOption={(i, v) => updateOption(q.id, i, v)}
              onRemoveOption={(i) => removeOption(q.id, i)}
            />
          ))
        )}
      </div>
    </section>
  );
};

// ---- Sub components (kept private to this module) ----

const QuestionEditor = ({ index, question, onUpdate, onRemove, onAddOption, onUpdateOption, onRemoveOption }) => {
  const currentType = QUESTION_TYPES.find((t) => t.value === question.type);
  const TypeIcon = currentType?.icon || Type;

  return (
    <div className="bg-slate-50 dark:bg-yrugray-800/50 border border-slate-200 dark:border-yrugray-800 rounded-xl p-5 hover:border-yrupink-500/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="text-slate-400 dark:text-yrugray-600 pt-2 cursor-move" title="ลากเพื่อจัดลำดับ">
          <GripVertical className="w-5 h-5" />
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-yrupink-600 dark:text-yrupink-400 bg-yrupink-500/10 px-2.5 py-1 rounded-full">
              คำถามที่ {index + 1}
            </span>
            <div className="flex-1"></div>
            <div className="relative">
              <TypeIcon className="w-4 h-4 text-slate-500 dark:text-yrugray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={question.type}
                onChange={(e) => onUpdate({ type: e.target.value })}
                className={`${inputCls} pl-9 pr-8 appearance-none cursor-pointer min-w-[240px]`}
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 dark:text-yrugray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <textarea
            value={question.question}
            onChange={(e) => onUpdate({ question: e.target.value })}
            placeholder={question.type === 'rating_matrix'
              ? 'หัวข้อ (เช่น อำนวยความสะดวก) — กด Enter เพื่อขึ้นบรรทัดใหม่ใส่หมายเหตุได้'
              : 'พิมพ์คำถามของคุณ... (กด Enter เพื่อขึ้นบรรทัดใหม่)'}
            rows={2}
            className={`${inputCls} resize-y`}
          />

          {question.type === 'rating_matrix' && (
            <div className="flex items-center gap-2 text-[15px] text-slate-700 dark:text-yrugray-300">
              <span>ระดับคะแนนสูงสุด</span>
              <input
                type="number"
                min={2}
                max={10}
                value={question.scaleMax ?? DEFAULT_SCALE_MAX}
                onChange={(e) =>
                  onUpdate({ scaleMax: Math.max(2, Math.min(10, Number(e.target.value) || DEFAULT_SCALE_MAX)) })
                }
                className={`${inputCls} w-20`}
              />
              <span className="text-slate-500 dark:text-yrugray-500">
                (ผู้ตอบให้คะแนน 1 ถึง {question.scaleMax ?? DEFAULT_SCALE_MAX} ต่อข้อย่อย)
              </span>
            </div>
          )}

          {currentType?.hasOptions ? (
            <OptionsEditor
              type={question.type}
              options={question.options}
              onAdd={onAddOption}
              onUpdate={onUpdateOption}
              onRemove={onRemoveOption}
            />
          ) : (
            <TypePreview type={question.type} />
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-yrugray-800">
            <label className="flex items-center gap-2 text-[15px] text-slate-700 dark:text-yrugray-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                className="w-4 h-4 accent-yrupink-500"
              />
              บังคับตอบ
            </label>
            <button
              type="button"
              onClick={onRemove}
              className="text-slate-500 dark:text-yrugray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors flex items-center gap-2 text-[15px] font-medium"
            >
              <Trash2 className="w-4 h-4" />
              ลบคำถาม
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const OptionsEditor = ({ type, options, onAdd, onUpdate, onRemove }) => {
  const isMatrix = type === 'rating_matrix';
  const noun = isMatrix ? 'ข้อย่อย' : 'ตัวเลือก';
  const marker = (i) => {
    if (isMatrix)
      return <span className="text-slate-500 dark:text-yrugray-500 text-xs font-medium w-4 text-center">{i + 1}.</span>;
    if (type === 'multiple_choice') return <CircleDot className="w-4 h-4 text-slate-500 dark:text-yrugray-500" />;
    if (type === 'checkboxes') return <CheckSquare className="w-4 h-4 text-slate-500 dark:text-yrugray-500" />;
    return <span className="text-slate-500 dark:text-yrugray-500 text-xs font-medium w-4 text-center">{'▾'}</span>;
  };

  return (
    <div className="space-y-2 pl-1">
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          {marker(i)}
          <input
            value={opt}
            onChange={(e) => onUpdate(i, e.target.value)}
            className={`${inputCls} flex-1`}
            placeholder={isMatrix ? `ข้อย่อย ${i + 1} (เช่น ด้านสถานที่)` : `ตัวเลือก ${i + 1}`}
          />
          {options.length > 1 && (
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="text-slate-500 dark:text-yrugray-500 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded transition-colors"
              title={`ลบ${noun}`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="text-[15px] font-medium text-yrupink-600 dark:text-yrupink-400 hover:text-yrupink-500 dark:hover:text-yrupink-300 flex items-center gap-1.5 mt-1 ml-6"
      >
        <Plus className="w-3.5 h-3.5" />
        เพิ่ม{noun}
      </button>
    </div>
  );
};

const TypePreview = ({ type }) => {
  const previewCls =
    'w-full bg-slate-100 dark:bg-yrugray-900/60 border border-dashed border-slate-300 dark:border-yrugray-700 rounded-lg px-3 py-2 text-[15px] text-slate-500 dark:text-yrugray-500';
  switch (type) {
    case 'short_answer':
      return <div className={previewCls}>ผู้ตอบจะเห็นช่องพิมพ์คำตอบสั้นๆ</div>;
    case 'phone':
      return <div className={`${previewCls} flex items-center gap-2`}><PhoneIcon className="w-4 h-4" /> เบอร์โทร 10 หลัก (ตัวเลขเท่านั้น, ห้ามซ้ำในกิจกรรม)</div>;
    case 'email':
      return <div className={`${previewCls} flex items-center gap-2`}><AtSign className="w-4 h-4" /> อีเมล (ตรวจรูปแบบ)</div>;
    case 'paragraph':
      return <div className={`${previewCls} h-20`}>ผู้ตอบจะเห็นช่องพิมพ์ข้อความยาว</div>;
    case 'file_upload':
      return (
        <div className={`${previewCls} flex items-center gap-2`}>
          <Upload className="w-4 h-4" /> ผู้ตอบจะสามารถแนบไฟล์
        </div>
      );
    case 'date':
      return (
        <div className={`${previewCls} flex items-center gap-2`}>
          <CalendarIcon className="w-4 h-4" /> ผู้ตอบจะเลือกวันที่
        </div>
      );
    case 'time':
      return (
        <div className={`${previewCls} flex items-center gap-2`}>
          <ClockIcon className="w-4 h-4" /> ผู้ตอบจะเลือกเวลา
        </div>
      );
    default:
      return null;
  }
};

export default DynamicFormBuilder;
