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
];

export const makeEmptyQuestion = () => ({
  id: Date.now() + Math.random(),
  type: 'short_answer',
  question: '',
  options: ['ตัวเลือก 1'],
  required: false,
});

const inputCls =
  'w-full bg-yrugray-800 border border-yrugray-700 text-sm rounded-lg px-3 py-2 text-white placeholder:text-yrugray-500 focus:outline-none focus:border-yrupink-500 focus:ring-1 focus:ring-yrupink-500 transition-all';

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
    <section className="bg-yrugray-900 border border-yrugray-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-yrugray-800 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          {description && <p className="text-xs text-yrugray-400 mt-1">{description}</p>}
        </div>
        <button
          onClick={addQuestion}
          type="button"
          className="px-4 py-2 bg-yrupink-600 hover:bg-yrupink-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-yrupink-500/20 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          สร้างคำถาม
        </button>
      </div>

      <div className="p-6 space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-yrugray-800 rounded-xl">
            <div className="w-14 h-14 bg-yrugray-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-yrugray-500" />
            </div>
            <p className="text-yrugray-400 text-sm">{emptyText}</p>
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
    <div className="bg-yrugray-800/50 border border-yrugray-800 rounded-xl p-5 hover:border-yrupink-500/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="text-yrugray-600 pt-2 cursor-move" title="ลากเพื่อจัดลำดับ">
          <GripVertical className="w-5 h-5" />
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-yrupink-400 bg-yrupink-500/10 px-2.5 py-1 rounded-full">
              คำถามที่ {index + 1}
            </span>
            <div className="flex-1"></div>
            <div className="relative">
              <TypeIcon className="w-4 h-4 text-yrugray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
              <ChevronDown className="w-4 h-4 text-yrugray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <input
            value={question.question}
            onChange={(e) => onUpdate({ question: e.target.value })}
            placeholder="พิมพ์คำถามของคุณ..."
            className={`${inputCls} text-base`}
          />

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

          <div className="flex items-center justify-between pt-3 border-t border-yrugray-800">
            <label className="flex items-center gap-2 text-sm text-yrugray-300 cursor-pointer select-none">
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
              className="text-yrugray-400 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
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
  const markerIcon = () => {
    if (type === 'multiple_choice') return <CircleDot className="w-4 h-4 text-yrugray-500" />;
    if (type === 'checkboxes') return <CheckSquare className="w-4 h-4 text-yrugray-500" />;
    return <span className="text-yrugray-500 text-xs font-medium w-4 text-center">{'▾'}</span>;
  };

  return (
    <div className="space-y-2 pl-1">
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          {markerIcon()}
          <input
            value={opt}
            onChange={(e) => onUpdate(i, e.target.value)}
            className={`${inputCls} flex-1`}
            placeholder={`ตัวเลือก ${i + 1}`}
          />
          {options.length > 1 && (
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="text-yrugray-500 hover:text-red-400 p-1.5 rounded transition-colors"
              title="ลบตัวเลือก"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="text-sm text-yrupink-400 hover:text-yrupink-300 flex items-center gap-1.5 mt-1 ml-6"
      >
        <Plus className="w-3.5 h-3.5" />
        เพิ่มตัวเลือก
      </button>
    </div>
  );
};

const TypePreview = ({ type }) => {
  const previewCls =
    'w-full bg-yrugray-900/60 border border-dashed border-yrugray-700 rounded-lg px-3 py-2 text-sm text-yrugray-500';
  switch (type) {
    case 'short_answer':
      return <div className={previewCls}>ผู้ตอบจะเห็นช่องพิมพ์คำตอบสั้นๆ</div>;
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
