import React from 'react';
import { Plus, Lock } from 'lucide-react';
import DynamicFormBuilder, { makeRegistrationDefaults } from './DynamicFormBuilder';

// Shared editor for an activity's registration model (เดี่ยว/ทีม) + its form
// questions. Used by both "สร้างกิจกรรม" and the "ฟอร์มลงทะเบียน" edit tab.
//
// Controlled component:
//   value    : { regType, teamCertMode, questions }
//   onChange : (nextValue) => void
//   locked   : when true (activity already has registrants) the registration
//              type is frozen and the team member count can only grow.

const MAX_MEMBERS = 5;

// ---- schema <-> editor-state conversion (single source of truth) ----

// activity row (register_form_schema + registration_type + team_cert_mode) → editor state
export const schemaToEditorState = (activity) => {
  const regType = activity?.registration_type === 'team' ? 'team' : 'individual';
  const teamCertMode = activity?.team_cert_mode === 'team' ? 'team' : 'per_person';
  const schema = activity?.register_form_schema;
  const fields = Array.isArray(schema?.fields) ? schema.fields : null;

  let questions;
  if (fields && fields.length) {
    questions = fields.map((f, i) => ({
      id: `${Date.now()}_${i}_${Math.random()}`,
      type: f.type,
      question: f.label,
      required: !!f.required,
      options: f.options?.length ? f.options : ['ตัวเลือก 1'],
      ...(f.member ? { member: f.member } : {}),
      ...(f.core && f.key ? { key: f.key } : {}),
    }));
  } else {
    // No saved schema → sensible defaults for the type.
    questions = regType === 'team' ? [] : makeRegistrationDefaults();
  }
  return { regType, teamCertMode, questions };
};

// editor state → payload fields for activitiesApi (create/update)
export const editorStateToPayload = (state) => {
  const { regType, teamCertMode, questions } = state;
  const register_form_schema = questions.length ? {
    fields: questions.map((q) => ({
      key:      q.key || `custom_${q.id}`,
      type:     q.type,
      label:    q.question,
      required: !!q.required,
      options:  q.options?.length ? q.options : undefined,
      ...(q.member ? { member: q.member } : {}),
      ...(q.key ? { core: true } : {}),
    })),
  } : null;
  const memberCount = new Set(questions.filter((q) => q.member).map((q) => q.member)).size;
  return {
    registration_type: regType,
    register_form_schema,
    team_cert_mode: regType === 'team' ? teamCertMode : null,
    // team_max_members is NOT NULL in the DB; omit it for individual (undefined
    // keys are dropped from the JSON body) rather than sending null.
    team_max_members: regType === 'team' ? Math.max(1, memberCount) : undefined,
  };
};

const RegistrationFormEditor = ({ value, onChange, locked = false }) => {
  const { regType, teamCertMode, questions } = value;
  const memberCount = new Set(questions.filter((q) => q.member).map((q) => q.member)).size;

  const patch = (next) => onChange({ ...value, ...next });

  const changeRegType = (type) => {
    if (locked || type === regType) return;
    patch({
      regType: type,
      questions: type === 'individual' ? makeRegistrationDefaults() : [],
    });
  };

  const addMemberDefaults = () => {
    if (memberCount >= MAX_MEMBERS) return;
    patch({ questions: [...questions, ...makeRegistrationDefaults(memberCount + 1)] });
  };

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">ฟอร์มลงทะเบียน</h3>
          <p className="text-sm text-slate-600 dark:text-yrugray-400 mt-1">เลือกประเภทการลงทะเบียน แล้วปรับคำถามได้ตามต้องการ</p>
        </div>

        {locked && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm text-amber-700 dark:text-amber-300">
            <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>มีผู้ลงทะเบียนแล้ว — เปลี่ยนประเภท (เดี่ยว/ทีม) ไม่ได้ และหากลบคำถาม คำตอบเดิมของผู้สมัครในข้อนั้นจะไม่แสดง</span>
          </div>
        )}

        <div className="flex gap-3">
          {[['individual', 'เดี่ยว'], ['team', 'ทีม']].map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => changeRegType(val)}
              disabled={locked && regType !== val}
              className={`px-6 py-2.5 rounded-lg border text-[15px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                regType === val
                  ? 'bg-yrupink-600 text-white border-yrupink-500'
                  : 'bg-white dark:bg-yrugray-800 text-slate-700 dark:text-yrugray-300 border-slate-300 dark:border-yrugray-700 hover:border-yrupink-500/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {regType === 'team' && (
          <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-yrugray-800/40 border border-slate-200 dark:border-yrugray-800">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={addMemberDefaults}
                disabled={memberCount >= MAX_MEMBERS}
                className="px-4 py-2 bg-yrupink-600 hover:bg-yrupink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[15px] font-semibold rounded-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> เพิ่มคำถาม Default สมาชิก
              </button>
              <span className="text-sm text-slate-600 dark:text-yrugray-400">สมาชิก {memberCount}/{MAX_MEMBERS} คน (ผู้สมัครกรอกชื่อทีมในหน้าสมัคร)</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-yrugray-300 mb-1.5">รูปแบบใบรับรอง (ทีม)</p>
              <div className="flex flex-col sm:flex-row gap-3">
                {[['per_person', 'แยก — ชื่อผู้ทำ + ชื่อทีม'], ['team', 'ทีม — ชื่อทุกคน + ชื่อทีม']].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 text-[15px] text-slate-700 dark:text-yrugray-300 cursor-pointer">
                    <input type="radio" name="teamCertMode" checked={teamCertMode === val} onChange={() => patch({ teamCertMode: val })} className="w-4 h-4 accent-yrupink-500" />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <DynamicFormBuilder
        questions={questions}
        onChange={(q) => patch({ questions: q })}
        title={regType === 'team' ? 'คำถามของสมาชิก (ทีม)' : 'คำถามฟอร์มลงทะเบียน (เดี่ยว)'}
        description="แก้ไข/เพิ่มคำถามได้ — คำถาม default (คำนำหน้า/ชื่อ/นามสกุล/เบอร์/อีเมล) จะจับคู่กับข้อมูลผู้สมัครอัตโนมัติ"
        emptyText={regType === 'team' ? 'กดปุ่ม "เพิ่มคำถาม Default สมาชิก" เพื่อเริ่ม' : 'ยังไม่มีคำถาม'}
      />
    </div>
  );
};

export default RegistrationFormEditor;
