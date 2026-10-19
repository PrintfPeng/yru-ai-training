import React from 'react';
import { Lock, Users } from 'lucide-react';
import DynamicFormBuilder, { makeRegistrationDefaults } from './DynamicFormBuilder';

// Shared editor for an activity's registration model (เดี่ยว/ทีม) + its form
// questions. Used by both "สร้างกิจกรรม" and the "ฟอร์มลงทะเบียน" edit tab.
//
// Controlled component:
//   value    : { regType, teamCertMode, teamMax, questions }
//   onChange : (nextValue) => void
//   locked   : when true (activity already has registrants) the registration
//              type is frozen.
//
// Team model (ตั้งแต่ 2026-10): ออกแบบคำถามสมาชิก "ชุดเดียว" แล้วกำหนดจำนวนสมาชิก
// สูงสุด (teamMax) เอง — ผู้สมัครเพิ่มสมาชิกได้ 1..teamMax คน โดยทุกคนตอบคำถามชุด
// เดียวกัน (เลิกใช้การ tag member:1..N แบบเดิม).

const TEAM_MAX_LIMIT = 20;

// ---- schema <-> editor-state conversion (single source of truth) ----

// activity row (register_form_schema + registration_type + team_cert_mode) → editor state
export const schemaToEditorState = (activity) => {
  const regType = activity?.registration_type === 'team' ? 'team' : 'individual';
  const teamCertMode = activity?.team_cert_mode === 'team' ? 'team' : 'per_person';
  const teamMax = Math.min(TEAM_MAX_LIMIT, Math.max(1, Number(activity?.team_max_members) || 5));
  const schema = activity?.register_form_schema;
  let fields = Array.isArray(schema?.fields) ? schema.fields : null;

  // Legacy team schemas tagged each member block (member:1..N). The new model
  // keeps ONE question set, so collapse to the first member block.
  if (regType === 'team' && fields && fields.some((f) => f.member)) {
    fields = fields.filter((f) => !f.member || f.member === 1);
  }

  let questions;
  if (fields && fields.length) {
    questions = fields.map((f, i) => ({
      id: `${Date.now()}_${i}_${Math.random()}`,
      type: f.type,
      question: f.label,
      required: !!f.required,
      options: f.options?.length ? f.options : ['ตัวเลือก 1'],
      ...(f.core && f.key ? { key: f.key } : {}),
      ...(f.allowOther ? { allowOther: true } : {}),
    }));
  } else {
    // No saved schema → the 5 core questions (one set, works for both types).
    questions = makeRegistrationDefaults();
  }
  return { regType, teamCertMode, teamMax, questions };
};

// editor state → payload fields for activitiesApi (create/update)
export const editorStateToPayload = (state) => {
  const { regType, teamCertMode, teamMax, questions } = state;
  const register_form_schema = questions.length ? {
    fields: questions.map((q) => ({
      key:      q.key || `custom_${q.id}`,
      type:     q.type,
      label:    q.question,
      required: !!q.required,
      options:  q.options?.length ? q.options : undefined,
      ...(q.key ? { core: true } : {}),
      ...(q.allowOther ? { allowOther: true } : {}),
    })),
  } : null;
  return {
    registration_type: regType,
    register_form_schema,
    team_cert_mode: regType === 'team' ? teamCertMode : null,
    // team_max_members is NOT NULL in the DB; omit it for individual (undefined
    // keys are dropped from the JSON body) rather than sending null.
    team_max_members: regType === 'team' ? Math.max(1, Number(teamMax) || 1) : undefined,
  };
};

const RegistrationFormEditor = ({ value, onChange, locked = false, addButtonSide = 'left' }) => {
  const { regType, teamCertMode, teamMax = 5, questions } = value;

  const patch = (next) => onChange({ ...value, ...next });

  const changeRegType = (type) => {
    if (locked || type === regType) return;
    patch({ regType: type, questions: makeRegistrationDefaults(), teamMax: 5 });
  };

  const setTeamMax = (n) => {
    const v = Math.min(TEAM_MAX_LIMIT, Math.max(1, Number(n) || 1));
    patch({ teamMax: v });
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
              <label className="text-sm font-medium text-slate-700 dark:text-yrugray-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-yrupink-500" /> จำนวนสมาชิกในทีม (คงที่)
              </label>
              <input
                type="number"
                min={1}
                max={TEAM_MAX_LIMIT}
                value={teamMax}
                onChange={(e) => setTeamMax(e.target.value)}
                className="w-24 bg-white dark:bg-yrugray-800 border border-slate-300 dark:border-yrugray-700 text-[15px] rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-yrupink-500 focus:ring-1 focus:ring-yrupink-500"
              />
              <span className="text-sm text-slate-500 dark:text-yrugray-400">คน (หน้าสมัครจะแสดงช่องกรอกครบ {teamMax} คนทันที ใช้คำถามชุดเดียวกันต่อคน)</span>
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
        floatingAdd
        floatingAddSide={addButtonSide}
        title={regType === 'team' ? 'คำถามสำหรับสมาชิกแต่ละคน (ทีม)' : 'คำถามฟอร์มลงทะเบียน (เดี่ยว)'}
        description="แก้ไข/เพิ่มคำถามได้ — คำถาม default (คำนำหน้า/ชื่อ/นามสกุล/เบอร์/อีเมล/หน่วยงาน) จะจับคู่กับข้อมูลผู้สมัครอัตโนมัติ"
        emptyText={'ยังไม่มีคำถาม — กดปุ่ม "สร้างคำถาม" เพื่อเริ่ม'}
      />
    </div>
  );
};

export default RegistrationFormEditor;
