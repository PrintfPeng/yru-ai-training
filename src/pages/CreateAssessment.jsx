import React, { useState } from 'react';
import {
  ClipboardCheck,
  Award,
  Save,
  Timer,
  Pencil,
  BookOpen,
  FileSignature,
  Eye,
  Palette,
  Type as TypeIcon,
} from 'lucide-react';
import DynamicFormBuilder from '../components/DynamicFormBuilder';
import CertificateEditor, { DEFAULT_ELEMENTS } from '../components/CertificateEditor';

const adminInputCls =
  'w-full bg-yrugray-800 border border-yrugray-700 text-sm rounded-lg px-3 py-2 text-white placeholder:text-yrugray-500 focus:outline-none focus:border-yrupink-500 focus:ring-1 focus:ring-yrupink-500 transition-all';

// Mock: activities that this assessment can attach to — ในของจริงดึงจาก API
const ACTIVITY_OPTIONS = [
  { id: 1, title: 'พื้นฐาน AI สำหรับผู้เริ่มต้น' },
  { id: 2, title: 'Prompt Engineering ขั้นสูง' },
  { id: 3, title: 'Machine Learning ด้วย Python' },
  { id: 4, title: 'Deep Learning และ Neural Networks' },
  { id: 5, title: 'AI สำหรับ SME และผู้ประกอบการ' },
  { id: 6, title: 'สร้าง Chatbot ด้วย AI Agent' },
];

const CERT_TEMPLATES = [
  { value: 'classic', label: 'Classic (ทางการ)', accent: 'from-yellow-500/30 to-yellow-700/20' },
  { value: 'modern', label: 'Modern (สมัยใหม่)', accent: 'from-yrupink-500/30 to-yrupink-700/20' },
  { value: 'minimal', label: 'Minimal (เรียบง่าย)', accent: 'from-gray-400/20 to-gray-600/10' },
];

const CreateAssessment = () => {
  const [meta, setMeta] = useState({
    title: '',
    activityId: '',
    description: '',
    timeLimit: 0,       // 0 = ไม่จำกัดเวลา (default สำหรับแบบสอบถามความพึงพอใจ)
    allowEdit: true,    // อนุญาตให้แก้ไขคำตอบภายหลัง
  });

  const [questions, setQuestions] = useState([]);

  const [cert, setCert] = useState({
    enabled: true,
    name: 'ใบรับรองการอบรม AI Center YRU',
    template: 'classic',
    signerName: '',
    signerPosition: '',
    backgroundImage: '',
    backgroundName: '',
    signatureImage: '',
    signatureName: '',
    elements: DEFAULT_ELEMENTS(),
  });

  const changeMeta = (name, value) => setMeta((prev) => ({ ...prev, [name]: value }));
  const changeCert = (name, value) => setCert((prev) => ({ ...prev, [name]: value }));

  const handleSave = () => {
    const payload = {
      ...meta,
      questions,
      certificate: cert.enabled ? cert : null,
    };
    console.log('Create satisfaction survey payload:', payload);
    alert('บันทึกแบบสอบถามความพึงพอใจเรียบร้อย (mockup) — ดู payload ใน console');
  };

  const selectedTemplate = CERT_TEMPLATES.find((t) => t.value === cert.template);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">สร้างแบบฟอร์มประเมินและออกใบรับรอง</h2>
          <p className="text-sm text-yrugray-400 mt-1">
            ออกแบบแบบสอบถามความพึงพอใจสำหรับผู้เข้าอบรม พร้อมตั้งค่าใบรับรองที่จะออกให้อัตโนมัติเมื่อผู้เข้าอบรมส่งแบบสอบถาม
          </p>
        </div>
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-yrupink-600 hover:bg-yrupink-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-yrupink-500/20 transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          บันทึกแบบสอบถาม
        </button>
      </div>

      {/* Section: รายละเอียดแบบสอบถาม */}
      <section className="bg-yrugray-900 border border-yrugray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-yrugray-800 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-yrupink-400" />
          <h3 className="text-lg font-bold text-white">รายละเอียดแบบสอบถามความพึงพอใจ</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <AdminField label="ชื่อแบบสอบถาม" required className="md:col-span-2">
            <input
              value={meta.title}
              onChange={(e) => changeMeta('title', e.target.value)}
              placeholder="เช่น แบบสอบถามความพึงพอใจ Prompt Engineering ขั้นสูง"
              className={adminInputCls}
            />
          </AdminField>

          <AdminField label="ผูกกับหลักสูตร" icon={<BookOpen className="w-4 h-4" />} required>
            <select
              value={meta.activityId}
              onChange={(e) => changeMeta('activityId', e.target.value)}
              className={adminInputCls}
            >
              <option value="">— เลือกหลักสูตร —</option>
              {ACTIVITY_OPTIONS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </AdminField>

          <AdminField label="เวลาทำ (นาที)" icon={<Timer className="w-4 h-4" />}>
            <input
              type="number"
              min="0"
              value={meta.timeLimit}
              onChange={(e) => changeMeta('timeLimit', Number(e.target.value))}
              placeholder="0 = ไม่จำกัดเวลา (แนะนำสำหรับความพึงพอใจ)"
              className={adminInputCls}
            />
            <p className="text-xs text-yrugray-500 mt-1">💡 แบบสอบถามความพึงพอใจไม่ควรจับเวลา ตั้ง 0 เพื่อไม่จำกัด</p>
          </AdminField>

          <AdminField label="แก้ไขคำตอบภายหลัง" icon={<Pencil className="w-4 h-4" />}>
            <label className="flex items-center gap-3 h-[38px] px-3 rounded-lg bg-yrugray-800 border border-yrugray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={meta.allowEdit}
                onChange={(e) => changeMeta('allowEdit', e.target.checked)}
                className="w-4 h-4 accent-yrupink-500"
              />
              <span className="text-sm text-yrugray-200">
                {meta.allowEdit ? 'อนุญาตให้แก้ไขคำตอบภายหลังได้' : 'ส่งได้ครั้งเดียว แก้ไขไม่ได้'}
              </span>
            </label>
          </AdminField>

          <AdminField label="คำอธิบาย / คำแนะนำ" className="md:col-span-2">
            <textarea
              value={meta.description}
              onChange={(e) => changeMeta('description', e.target.value)}
              rows={3}
              placeholder="เช่น ขอความอนุเคราะห์ให้ท่านตอบแบบสอบถามเพื่อนำไปพัฒนาการจัดหลักสูตรครั้งต่อไป..."
              className={`${adminInputCls} resize-none`}
            />
          </AdminField>
        </div>
      </section>

      {/* Section: Dynamic Form Builder (shared) */}
      <DynamicFormBuilder
        questions={questions}
        onChange={setQuestions}
        title="คำถามในแบบสอบถาม (Dynamic Form)"
        description="ออกแบบคำถามที่ต้องการให้ผู้เข้าอบรมตอบ — รองรับ 8 ประเภทคำถาม (เหมาะกับ Likert, ตัวเลือก, ข้อความ)"
        emptyText='ยังไม่มีคำถาม — กดปุ่ม "สร้างคำถาม" เพื่อเริ่มต้น'
      />

      {/* Section: ใบรับรอง */}
      <section className="bg-yrugray-900 border border-yrugray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-yrugray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yrupink-400" />
            <div>
              <h3 className="text-lg font-bold text-white">การออกใบรับรอง</h3>
              <p className="text-xs text-yrugray-400 mt-0.5">
                ใบรับรองจะถูกออกให้ผู้เข้าอบรมโดยอัตโนมัติเมื่อส่งแบบสอบถามเรียบร้อยแล้ว
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-yrugray-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={cert.enabled}
              onChange={(e) => changeCert('enabled', e.target.checked)}
              className="w-4 h-4 accent-yrupink-500"
            />
            เปิดใช้งาน
          </label>
        </div>

        {cert.enabled && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminField label="ชื่อใบรับรอง" icon={<TypeIcon className="w-4 h-4" />} className="md:col-span-2">
                <input
                  value={cert.name}
                  onChange={(e) => changeCert('name', e.target.value)}
                  className={adminInputCls}
                />
              </AdminField>

              <AdminField label="ผู้ลงนาม" icon={<FileSignature className="w-4 h-4" />}>
                <input
                  value={cert.signerName}
                  onChange={(e) => changeCert('signerName', e.target.value)}
                  placeholder="เช่น ดร. สมชาย"
                  className={adminInputCls}
                />
              </AdminField>

              <AdminField label="ตำแหน่งผู้ลงนาม">
                <input
                  value={cert.signerPosition}
                  onChange={(e) => changeCert('signerPosition', e.target.value)}
                  placeholder="เช่น ผู้อำนวยการศูนย์ AI"
                  className={adminInputCls}
                />
              </AdminField>
            </div>

            {/* Template picker */}
            <div>
              <label className="text-sm text-yrugray-300 mb-2 flex items-center gap-1.5">
                <Palette className="w-4 h-4" />
                เทมเพลตใบรับรอง (ใช้เป็น gradient พื้นหลังเมื่อยังไม่ได้อัปโหลดรูป)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CERT_TEMPLATES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => changeCert('template', t.value)}
                    className={`text-left rounded-xl border transition-all overflow-hidden ${
                      cert.template === t.value
                        ? 'border-yrupink-500 ring-2 ring-yrupink-500/30'
                        : 'border-yrugray-700 hover:border-yrupink-500/50'
                    }`}
                  >
                    <div className={`aspect-[4/3] bg-gradient-to-br ${t.accent} flex items-center justify-center relative`}>
                      <Award className="w-10 h-10 text-white/60" />
                      <div className="absolute bottom-2 left-2 right-2 h-1 bg-white/30 rounded-full" />
                    </div>
                    <div className="px-3 py-2 bg-yrugray-800/70 text-sm text-white">{t.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive certificate editor */}
            <div>
              <label className="text-sm text-yrugray-300 mb-2 flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                ดีไซน์ใบรับรอง (แก้ไข / เลื่อน / ปรับขนาด / เพิ่ม / ลบได้)
              </label>
              <CertificateEditor cert={cert} onChange={setCert} template={selectedTemplate} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

// ---- Sub components ----

const AdminField = ({ label, icon, required, className = '', children }) => (
  <div className={className}>
    <label className="text-sm text-yrugray-300 mb-1.5 flex items-center gap-1.5">
      {icon}
      {label}
      {required && <span className="text-yrupink-400">*</span>}
    </label>
    {children}
  </div>
);

export default CreateAssessment;
