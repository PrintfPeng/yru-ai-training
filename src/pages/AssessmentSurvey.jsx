import React, { useState, useMemo } from 'react';
import { ArrowRight, CheckCircle2, AlertCircle, Send, ClipboardList, User } from 'lucide-react';
import { MOCK_ASSESSMENT } from '../data/mockEventData';

const AssessmentSurvey = ({ activity, registrant, onComplete, onCancel }) => {
  const assessment = MOCK_ASSESSMENT[activity.id];
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});

  if (!assessment) {
    return <MessageState title="ยังไม่มีแบบประเมินสำหรับกิจกรรมนี้" onBack={onCancel} />;
  }

  const setAnswer = (qid, value) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
    setErrors((prev) => ({ ...prev, [qid]: null }));
  };

  const validate = () => {
    const errs = {};
    assessment.questions.forEach((q) => {
      if (!q.required) return;
      const val = answers[q.id];
      if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
        errs[q.id] = 'กรุณาตอบข้อนี้';
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      const firstErrorId = Object.keys(errors)[0] || Object.keys(validateForm(assessment, answers))[0];
      if (firstErrorId) {
        document.getElementById(`q-${firstErrorId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    console.log('Assessment submitted:', { activityId: activity.id, registrantId: registrant.id, answers });
    onComplete(answers);
  };

  const answeredCount = useMemo(
    () =>
      assessment.questions.filter((q) => {
        const v = answers[q.id];
        return v !== undefined && v !== null && v !== '' && (!Array.isArray(v) || v.length > 0);
      }).length,
    [answers, assessment]
  );

  const progress = Math.round((answeredCount / assessment.questions.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-yrugray-950 pb-24">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-yrugray-900/90 backdrop-blur border-b border-gray-200 dark:border-yrugray-800">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-yrugray-400 flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" />
                {assessment.title}
              </p>
              <h1 className="text-base md:text-lg font-bold text-gray-900 dark:text-white truncate">
                {activity.title}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-yrugray-300 shrink-0 ml-3">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{registrant.fullName}</span>
            </div>
          </div>
          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-yrugray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yrupink-500 to-yrupink-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-600 dark:text-yrugray-300 font-medium">
              {answeredCount}/{assessment.questions.length}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-6">
        {/* Description */}
        {assessment.description && (
          <div className="mb-6 p-4 bg-yrupink-500/5 border border-yrupink-500/20 rounded-xl text-sm text-gray-700 dark:text-yrugray-200">
            💡 {assessment.description}
          </div>
        )}

        {/* Questions */}
        <div className="space-y-4">
          {assessment.questions.map((q, idx) => (
            <QuestionCard
              key={q.id}
              index={idx + 1}
              question={q}
              value={answers[q.id]}
              error={errors[q.id]}
              onChange={(v) => setAnswer(q.id, v)}
            />
          ))}
        </div>

        {/* Submit */}
        <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end items-stretch sm:items-center">
          <button
            onClick={onCancel}
            className="px-5 py-3 rounded-lg text-gray-700 dark:text-yrugray-300 hover:bg-gray-100 dark:hover:bg-yrugray-800 border border-gray-200 dark:border-yrugray-700 text-sm font-medium"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-3 rounded-lg bg-yrupink-600 hover:bg-yrupink-500 text-white text-sm font-semibold shadow-lg shadow-yrupink-500/20 flex items-center justify-center gap-2 transition-colors"
          >
            <Send className="w-4 h-4" />
            ส่งแบบประเมิน
          </button>
        </div>
      </main>
    </div>
  );
};

// ---- Sub components ----

const QuestionCard = ({ index, question, value, error, onChange }) => (
  <div
    id={`q-${question.id}`}
    className={`bg-white dark:bg-yrugray-900 border rounded-2xl p-5 md:p-6 transition-colors ${
      error ? 'border-red-400 dark:border-red-500/50' : 'border-gray-200 dark:border-yrugray-800'
    }`}
  >
    <div className="flex items-start gap-3 mb-4">
      <span className="w-7 h-7 rounded-full bg-yrupink-500/10 text-yrupink-600 dark:text-yrupink-400 text-xs font-bold flex items-center justify-center shrink-0">
        {index}
      </span>
      <div className="flex-1">
        <p className="text-base font-semibold text-gray-900 dark:text-white leading-snug">
          {question.question || '(ไม่มีคำถาม)'}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </p>
        {!question.required && (
          <p className="text-xs text-gray-400 dark:text-yrugray-500 mt-0.5">ไม่บังคับตอบ</p>
        )}
      </div>
    </div>

    <div className="ml-10">
      <AnswerInput question={question} value={value} onChange={onChange} />
      {error && (
        <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  </div>
);

const AnswerInput = ({ question, value, onChange }) => {
  const baseCls =
    'w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-yrugray-800 border border-gray-200 dark:border-yrugray-700 text-gray-900 dark:text-white focus:outline-none focus:border-yrupink-500 focus:ring-1 focus:ring-yrupink-500';

  switch (question.type) {
    case 'short_answer':
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="พิมพ์คำตอบของคุณ..."
          className={baseCls}
        />
      );

    case 'paragraph':
      return (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder="พิมพ์คำตอบของคุณ..."
          className={`${baseCls} resize-none`}
        />
      );

    case 'multiple_choice':
      return (
        <div className="space-y-2">
          {question.options.map((opt, i) => (
            <label
              key={i}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer select-none transition-colors ${
                value === opt
                  ? 'bg-yrupink-500/10 border-yrupink-500 text-gray-900 dark:text-white'
                  : 'bg-gray-50 dark:bg-yrugray-800 border-gray-200 dark:border-yrugray-700 text-gray-700 dark:text-yrugray-200 hover:border-yrupink-500/50'
              }`}
            >
              <input
                type="radio"
                name={question.id}
                checked={value === opt}
                onChange={() => onChange(opt)}
                className="w-4 h-4 accent-yrupink-500"
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      );

    case 'checkboxes':
      return (
        <div className="space-y-2">
          {question.options.map((opt, i) => {
            const current = Array.isArray(value) ? value : [];
            const checked = current.includes(opt);
            return (
              <label
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer select-none transition-colors ${
                  checked
                    ? 'bg-yrupink-500/10 border-yrupink-500 text-gray-900 dark:text-white'
                    : 'bg-gray-50 dark:bg-yrugray-800 border-gray-200 dark:border-yrugray-700 text-gray-700 dark:text-yrugray-200 hover:border-yrupink-500/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = checked
                      ? current.filter((o) => o !== opt)
                      : [...current, opt];
                    onChange(next);
                  }}
                  className="w-4 h-4 accent-yrupink-500"
                />
                <span className="text-sm">{opt}</span>
              </label>
            );
          })}
        </div>
      );

    case 'dropdown':
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={baseCls}
        >
          <option value="">— เลือกคำตอบ —</option>
          {question.options.map((opt, i) => (
            <option key={i} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );

    case 'file_upload':
      return (
        <div>
          <input
            type="file"
            onChange={(e) => onChange(e.target.files?.[0]?.name || '')}
            className="w-full text-sm text-gray-700 dark:text-yrugray-200 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yrupink-500/10 file:text-yrupink-600 dark:file:text-yrupink-400 hover:file:bg-yrupink-500/20"
          />
          {value && (
            <p className="mt-1 text-xs text-gray-500 dark:text-yrugray-400">📎 {value}</p>
          )}
        </div>
      );

    case 'date':
      return (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={baseCls}
        />
      );

    case 'time':
      return (
        <input
          type="time"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={baseCls}
        />
      );

    default:
      return <p className="text-sm text-gray-400">คำถามประเภทไม่รู้จัก: {question.type}</p>;
  }
};

const MessageState = ({ title, onBack }) => (
  <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-yrugray-950">
    <div className="max-w-md w-full text-center">
      <p className="text-lg text-gray-700 dark:text-yrugray-200 mb-4">{title}</p>
      <button
        onClick={onBack}
        className="px-5 py-2 bg-yrupink-600 hover:bg-yrupink-500 text-white text-sm font-semibold rounded-lg"
      >
        กลับ
      </button>
    </div>
  </div>
);

// Helper (kept outside so validate() logic stays pure)
const validateForm = (assessment, answers) => {
  const errs = {};
  assessment.questions.forEach((q) => {
    if (!q.required) return;
    const val = answers[q.id];
    if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
      errs[q.id] = 'กรุณาตอบข้อนี้';
    }
  });
  return errs;
};

export default AssessmentSurvey;
