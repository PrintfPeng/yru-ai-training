import React, { useMemo, useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, Send, Users } from 'lucide-react';
import { registrationsApi, ApiError } from '../api';

// Fallback schema for older activities with no register_form_schema.
const CORE_FALLBACK = [
  { key: 'prefix',     type: 'dropdown',     label: 'คำนำหน้าชื่อ', options: ['นาย', 'นาง', 'นางสาว', 'เด็กชาย', 'เด็กหญิง'], required: true, core: true },
  { key: 'first_name', type: 'short_answer', label: 'ชื่อ',          required: true, core: true },
  { key: 'last_name',  type: 'short_answer', label: 'นามสกุล',       required: true, core: true },
  { key: 'phone',        type: 'phone',        label: 'เบอร์โทรศัพท์',  required: true, core: true },
  { key: 'email',        type: 'email',        label: 'อีเมล',         required: true, core: true },
  { key: 'organization', type: 'short_answer', label: 'หน่วยงาน',       required: true, core: true },
];

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-white/70 dark:bg-yrugray-900/40 border border-gray-200 dark:border-yrugray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-yrugray-400 focus:outline-none focus:border-yrupink-500 transition-colors';

const cleanLabel = (s) => String(s || '').replace(/^สมาชิกคนที่\s*\d+\s*·\s*/, '');

const OTHER = '__other__';

// Dropdown with an optional "อื่นๆ (ระบุ)" choice that reveals a free-text box.
// The stored value is always the final answer (the typed text when "other").
const DropdownField = ({ field, value, onChange }) => {
  const opts = field.options || [];
  // "other" when a value exists that isn't one of the fixed options.
  const [other, setOther] = useState(!!field.allowOther && !!value && !opts.includes(value));
  const selectVal = other ? OTHER : (value ?? '');
  return (
    <>
      <select
        value={selectVal}
        onChange={(e) => {
          if (e.target.value === OTHER) { setOther(true); onChange(''); }
          else { setOther(false); onChange(e.target.value); }
        }}
        className={inputCls}
      >
        <option value="">— เลือก —</option>
        {opts.map((o, i) => <option key={i} value={o}>{o}</option>)}
        {field.allowOther && <option value={OTHER}>อื่นๆ (ระบุ)</option>}
      </select>
      {other && (
        <input
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="โปรดระบุ"
          className={`${inputCls} mt-2`}
        />
      )}
    </>
  );
};

// Single field renderer.
const RegField = ({ field, value, onChange }) => {
  const common = { value: value ?? '', onChange: (e) => onChange(e.target.value), className: inputCls };
  switch (field.type) {
    case 'dropdown':
      return <DropdownField field={field} value={value} onChange={onChange} />;
    case 'multiple_choice':
      return (
        <div className="space-y-1.5">
          {(field.options || []).map((o, i) => (
            <label key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-yrugray-200">
              <input type="radio" checked={value === o} onChange={() => onChange(o)} className="w-4 h-4 accent-yrupink-500" />
              {o}
            </label>
          ))}
        </div>
      );
    case 'paragraph':
      return <textarea {...common} rows={3} className={`${inputCls} resize-none`} />;
    case 'phone':
      return <input {...common} type="tel" inputMode="numeric" maxLength={10} placeholder="08XXXXXXXX" />;
    case 'email':
      return <input {...common} type="email" placeholder="name@example.com" />;
    case 'date':
      return <input {...common} type="date" />;
    case 'time':
      return <input {...common} type="time" />;
    default:
      return <input {...common} type="text" />;
  }
};

const FieldRow = ({ field, value, onChange }) => (
  <div>
    <label className="block text-sm text-gray-700 dark:text-yrugray-200 mb-1">
      {cleanLabel(field.label)}
      {field.required && <span className="text-yrupink-500 ml-1">*</span>}
    </label>
    <RegField field={field} value={value} onChange={onChange} />
  </div>
);

// Validate one answer set; returns an error message or null.
const validateSet = (fields, ans) => {
  for (const f of fields) {
    const v = String(ans[f.key] ?? '').trim();
    if (f.required && !v) return `กรุณากรอก "${cleanLabel(f.label)}"`;
    if (v && f.type === 'phone' && v.replace(/\D/g, '').length !== 10)
      return `"${cleanLabel(f.label)}" ต้องเป็นตัวเลข 10 หลัก`;
    if (v && f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
      return `"${cleanLabel(f.label)}" รูปแบบอีเมลไม่ถูกต้อง`;
  }
  return null;
};

// Normalize core values before sending (phone → digits only).
const normalizeAns = (fields, ans) => {
  const out = { ...ans };
  for (const f of fields) {
    if (f.type === 'phone' && out[f.key]) out[f.key] = String(out[f.key]).replace(/\D/g, '');
  }
  return out;
};

const RegistrationForm = ({ activity, onSuccess }) => {
  const regType = activity?.registration_type || 'individual';
  const schemaFields = activity?.register_form_schema?.fields?.length
    ? activity.register_form_schema.fields
    : CORE_FALLBACK;

  // individual: fields without a member tag.
  const indivFields = useMemo(() => schemaFields.filter((f) => !f.member), [schemaFields]);
  // team: every question is the per-member template. New schemas have no member
  // tag; legacy ones duplicated member:1..N, so keep untagged + the first block.
  const memberTemplate = useMemo(() => {
    const t = schemaFields.filter((f) => !f.member || f.member === 1);
    return t.length ? t : CORE_FALLBACK;
  }, [schemaFields]);
  // Fixed team size set by the admin — the form shows exactly this many member
  // blocks up front (no add/remove by the applicant).
  const teamSize = Math.max(1, activity?.team_max_members || 1);

  const [answers, setAnswers] = useState({});                 // individual
  const [teamName, setTeamName] = useState('');               // team
  const [members, setMembers] = useState(() => Array.from({ length: teamSize }, () => ({})));
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const indivFieldsResolved = indivFields.length ? indivFields : CORE_FALLBACK;

  // Keep the number of member blocks in sync with the admin's configured size
  // (e.g. when the activity row loads/changes after mount).
  useEffect(() => {
    setMembers((prev) => {
      if (prev.length === teamSize) return prev;
      const next = prev.slice(0, teamSize);
      while (next.length < teamSize) next.push({});
      return next;
    });
  }, [teamSize]);

  const setMemberVal = (idx, key, val) =>
    setMembers((prev) => prev.map((m, i) => (i === idx ? { ...m, [key]: val } : m)));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!activity?.slug) { setError('ไม่พบข้อมูลหลักสูตร'); return; }

    try {
      setSubmitting(true);
      if (regType === 'team') {
        if (!teamName.trim()) { setError('กรุณากรอกชื่อทีม'); return; }
        for (let i = 0; i < members.length; i++) {
          const err = validateSet(memberTemplate, members[i]);
          if (err) { setError(`สมาชิกคนที่ ${i + 1}: ${err}`); return; }
        }
        const payload = members.map((m) => normalizeAns(memberTemplate, m));
        const phones = payload.map((m) => m.phone);
        const dupPhone = phones.find((p, i) => phones.indexOf(p) !== i);
        if (dupPhone) { setError(`เบอร์ซ้ำกันในทีม: ${dupPhone}`); return; }
        const emails = payload.map((m) => (m.email || '').trim().toLowerCase());
        const dupEmail = emails.find((e, i) => e && emails.indexOf(e) !== i);
        if (dupEmail) { setError(`อีเมลซ้ำกันในทีม: ${dupEmail}`); return; }
        await registrationsApi.publicRegisterTeam(activity.slug, { team_name: teamName.trim(), members: payload });
      } else {
        const err = validateSet(indivFieldsResolved, answers);
        if (err) { setError(err); return; }
        const ans = normalizeAns(indivFieldsResolved, answers);
        await registrationsApi.publicRegister(activity.slug, ans, null, ans);
      }
      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      if (err instanceof ApiError) {
        // Backend sends field-specific Thai text for DUPLICATE_PHONE /
        // DUPLICATE_EMAIL / *_IN_TEAM / TOO_MANY_MEMBERS / etc. — show it as-is
        // so "อีเมลซ้ำ" and "เบอร์ซ้ำ" each report their own message.
        if (err.code === 'OVER_CAPACITY') setError('หลักสูตรนี้เต็มแล้ว');
        else if (err.code === 'ACTIVITY_NOT_OPEN' || err.code === 'REGISTRATION_NOT_OPEN') setError('หลักสูตรยังไม่เปิดรับสมัคร');
        else if (err.code === 'REGISTRATION_CLOSED') setError('ปิดรับสมัครแล้ว');
        else setError(err.message || 'ส่งไม่สำเร็จ กรุณาลองใหม่');
      } else {
        setError(err?.message || 'ส่งไม่สำเร็จ กรุณาลองใหม่');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 mb-3">
          <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">ลงทะเบียนสำเร็จ</h3>
        <p className="text-sm text-gray-600 dark:text-yrugray-300">
          ระบบบันทึกข้อมูลของคุณแล้ว — ทำแบบประเมินได้ด้วยเบอร์ที่ลงทะเบียน
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {regType === 'team' ? (
        <>
          <div>
            <label className="block text-sm text-gray-700 dark:text-yrugray-200 mb-1">
              ชื่อทีม <span className="text-yrupink-500">*</span>
            </label>
            <input value={teamName} onChange={(e) => setTeamName(e.target.value)} className={inputCls} placeholder="ชื่อทีมของคุณ" />
          </div>

          {members.map((m, idx) => (
            <div key={idx} className="rounded-xl border border-gray-200 dark:border-yrugray-700 p-4 space-y-3 bg-white/40 dark:bg-yrugray-900/30">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-yrupink-600 dark:text-yrupink-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> สมาชิกคนที่ {idx + 1}
                </span>
              </div>
              {memberTemplate.map((f) => (
                <FieldRow key={f.key} field={f} value={m[f.key]} onChange={(v) => setMemberVal(idx, f.key, v)} />
              ))}
            </div>
          ))}
        </>
      ) : (
        indivFieldsResolved.map((f) => (
          <FieldRow key={f.key} field={f} value={answers[f.key]} onChange={(v) => setAnswers((prev) => ({ ...prev, [f.key]: v }))} />
        ))
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-700 dark:text-red-400">
          <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-yrupink-500 to-yrupink-600 hover:from-yrupink-600 hover:to-yrupink-700 disabled:opacity-60 shadow-lg shadow-yrupink-500/20 transition-all"
      >
        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังส่ง...</> : <><Send className="w-4 h-4" /> ลงทะเบียน</>}
      </button>
    </form>
  );
};

export default RegistrationForm;
