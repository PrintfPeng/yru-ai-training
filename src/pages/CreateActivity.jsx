import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  Users,
  MapPin,
  Save,
  X,
  Loader2,
} from 'lucide-react';
import { makeRegistrationDefaults } from '../components/DynamicFormBuilder';
import RegistrationFormEditor, { editorStateToPayload } from '../components/RegistrationFormEditor';
import BannerUploader from '../components/BannerUploader';
import { activitiesApi } from '../api';
import { toBE } from '../utils/thaiDate';
import { useToast } from '../contexts/ToastContext';
import { errorMessage } from '../utils/errorMessage';

const adminInputCls =
  'w-full bg-white dark:bg-yrugray-800 border border-slate-300 dark:border-yrugray-700 text-[15px] rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-yrugray-500 focus:outline-none focus:border-yrupink-500 focus:ring-1 focus:ring-yrupink-500 transition-all';

// Appended to an input's class when its field has a validation error.
const errBorder = '!border-red-500 focus:!border-red-500 focus:!ring-red-500';

const CreateActivity = ({ onCreated } = {}) => {
  const toast = useToast();
  // Activity metadata
  const [activity, setActivity] = useState({
    title: '',
    category: '',
    level: 'เริ่มต้น',
    description: '',
    startDate: '',
    endDate: '',
    registerOpenAt: '',       // datetime-local 'YYYY-MM-DDTHH:mm'
    registerCloseDate: '',    // datetime-local 'YYYY-MM-DDTHH:mm'
    feeText: '',
    travelText: '',
    noteText: '',
    seats: '',
    location: '',
  });
  const [venueLinks, setVenueLinks] = useState([]); // [{label, url}]

  // Banner image — cropped 16:9 JPEG data URL (from BannerUploader)
  const [banner, setBanner] = useState('');

  // Registration form (ฟอร์มลงทะเบียน) — managed by RegistrationFormEditor.
  const [regForm, setRegForm] = useState({
    regType: 'individual',
    teamCertMode: 'per_person',
    questions: makeRegistrationDefaults(), // default: เดี่ยว 5 ข้อ
  });

  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({}); // { fieldName: 'ข้อความ' }

  const handleActivityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setActivity((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    // Clear a field's error as soon as the user edits it.
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  // Client-side validation → { field: 'ข้อความ' }. Empty object = valid.
  const validate = () => {
    const errs = {};
    if (!activity.title.trim()) errs.title = 'กรุณากรอกชื่อหลักสูตร';
    if (!activity.startDate) errs.startDate = 'กรุณาเลือกวันเริ่มอบรม';
    if (!activity.endDate) errs.endDate = 'กรุณาเลือกวันสิ้นสุดอบรม';
    if (!activity.registerCloseDate) errs.registerCloseDate = 'กรุณาเลือกวันเวลาปิดรับสมัคร';
    if (activity.startDate && activity.endDate && activity.endDate < activity.startDate) {
      errs.endDate = 'วันสิ้นสุดต้องไม่ก่อนวันเริ่มอบรม';
    }
    // datetime-local 'YYYY-MMM-DDTHH:mm' strings compare lexicographically.
    if (activity.registerOpenAt && activity.registerCloseDate &&
        activity.registerOpenAt >= activity.registerCloseDate) {
      errs.registerCloseDate = 'เวลาปิดรับสมัครต้องหลังเวลาเปิดรับสมัคร';
    }
    if (activity.registerCloseDate && activity.startDate &&
        activity.registerCloseDate.slice(0, 10) > activity.startDate) {
      errs.registerCloseDate = 'วันปิดรับสมัครต้องไม่เกินวันเริ่มอบรม';
    }
    return errs;
  };

  // venue_links repeater helpers
  const addVenueLink = () => setVenueLinks((p) => [...p, { label: '', url: '' }]);
  const updateVenueLink = (i, key, val) =>
    setVenueLinks((p) => p.map((v, idx) => (idx === i ? { ...v, [key]: val } : v)));
  const removeVenueLink = (i) => setVenueLinks((p) => p.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน', { title: 'บันทึกไม่สำเร็จ' });
      // Scroll to the first field with an error.
      const firstKey = Object.keys(errs)[0];
      const el = document.querySelector(`[name="${firstKey}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus?.({ preventScroll: true });
      return;
    }
    setSaving(true);
    try {
      // Everything is stored in พ.ศ.; normalize in case the picker returned ค.ศ.
      const start = `${toBE(activity.startDate)} 09:00:00`;
      const end = `${toBE(activity.endDate)} 16:30:00`;
      // datetime-local 'YYYY-MM-DDTHH:mm' → SQL 'YYYY-MM-DD HH:mm:00' (พ.ศ.)
      const dtLocalToSql = (v) => (v ? `${toBE(v).replace('T', ' ')}:00` : undefined);
      const links = venueLinks.filter((v) => v.label.trim() && v.url.trim());

      // Registration model (type + cert mode + form schema).
      const regPayload = editorStateToPayload(regForm);

      const created = await activitiesApi.create({
        title:       activity.title.trim(),
        description: activity.description || undefined,
        location:    activity.location || undefined,
        start_date:  start,
        end_date:    end,
        register_open_at: dtLocalToSql(activity.registerOpenAt),
        register_close_date: dtLocalToSql(activity.registerCloseDate),
        fee_text:    activity.feeText.trim() || undefined,
        travel_text: activity.travelText.trim() || undefined,
        note_text:   activity.noteText.trim() || undefined,
        venue_links: links.length ? links : undefined,
        capacity:    Number(activity.seats) || 0,
        status:      'draft',
        cover_image_url: banner || undefined,
        // registration model (registration_type, register_form_schema, team_*)
        ...regPayload,
      });

      toast.success('บันทึกกิจกรรมเรียบร้อยแล้ว', { title: 'สำเร็จ' });
      // Hand control back to the dashboard (→ จัดการหลักสูตร). The component
      // unmounts, so there is no need to reset the local form state here.
      if (typeof onCreated === 'function') {
        onCreated(created);
      }
    } catch (err) {
      toast.error(errorMessage(err, 'บันทึกไม่สำเร็จ'), { title: 'บันทึกไม่สำเร็จ' });
    } finally {
      setSaving(false);
    }
  };

  return (
    // pb-28 reserves space below for the floating save button so the last
    // form row isn't hidden behind it on short viewports.
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div>
        <h2 className="text-[22px] md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">สร้างกิจกรรม</h2>
        <p className="text-sm text-slate-600 dark:text-yrugray-400 mt-1">
          กรอกรายละเอียดกิจกรรม และออกแบบฟอร์มลงทะเบียนแบบไดนามิก
        </p>
      </div>

      {/* Section: รายละเอียดกิจกรรม */}
      <section className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-yrugray-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-yrupink-500 dark:text-yrupink-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">รายละเอียดกิจกรรม</h3>
        </div>

        <div className="p-6 pb-0">
          <BannerUploader value={banner} onChange={setBanner} />
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <AdminField label="ชื่อกิจกรรม / หลักสูตร" required error={fieldErrors.title}>
            <input
              name="title"
              value={activity.title}
              onChange={handleActivityChange}
              placeholder="เช่น Prompt Engineering ขั้นสูง"
              className={`${adminInputCls} ${fieldErrors.title ? errBorder : ''}`}
            />
          </AdminField>

          <AdminField label="หมวดหมู่">
            <input
              name="category"
              value={activity.category}
              onChange={handleActivityChange}
              placeholder="เช่น Prompt Engineering"
              className={adminInputCls}
            />
          </AdminField>

          <AdminField label="ระดับ">
            <select
              name="level"
              value={activity.level}
              onChange={handleActivityChange}
              className={adminInputCls}
            >
              <option value="เริ่มต้น">เริ่มต้น</option>
              <option value="ปานกลาง">ปานกลาง</option>
              <option value="ขั้นสูง">ขั้นสูง</option>
            </select>
          </AdminField>

          <AdminField label="วันเริ่มอบรม" required icon={<Calendar className="w-4 h-4" />} error={fieldErrors.startDate}>
            <input
              type="date"
              name="startDate"
              value={activity.startDate}
              onChange={handleActivityChange}
              className={`${adminInputCls} ${fieldErrors.startDate ? errBorder : ''}`}
            />
          </AdminField>

          <AdminField label="วันสิ้นสุดอบรม" required icon={<Calendar className="w-4 h-4" />} error={fieldErrors.endDate}>
            <input
              type="date"
              name="endDate"
              value={activity.endDate}
              onChange={handleActivityChange}
              className={`${adminInputCls} ${fieldErrors.endDate ? errBorder : ''}`}
            />
          </AdminField>

          <AdminField label="จำนวนที่รับ" icon={<Users className="w-4 h-4" />}>
            <input
              type="number"
              name="seats"
              value={activity.seats}
              onChange={handleActivityChange}
              placeholder="เช่น 30"
              className={adminInputCls}
            />
          </AdminField>

          <AdminField label="สถานที่" icon={<MapPin className="w-4 h-4" />} className="md:col-span-2">
            <input
              name="location"
              value={activity.location}
              onChange={handleActivityChange}
              placeholder="เช่น ห้อง Lab AI Center"
              className={adminInputCls}
            />
          </AdminField>

          <AdminField label="รายละเอียดหลักสูตร" className="md:col-span-2">
            <textarea
              name="description"
              value={activity.description}
              onChange={handleActivityChange}
              rows={4}
              placeholder="อธิบายเนื้อหาและวัตถุประสงค์ของหลักสูตร..."
              className={`${adminInputCls} resize-none`}
            />
          </AdminField>

          <AdminField label="วันเวลาเปิดรับสมัคร" icon={<Clock className="w-4 h-4" />} error={fieldErrors.registerOpenAt}>
            <input
              type="datetime-local"
              name="registerOpenAt"
              value={activity.registerOpenAt}
              onChange={handleActivityChange}
              className={`${adminInputCls} ${fieldErrors.registerOpenAt ? errBorder : ''}`}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-yrugray-500">เว้นว่าง = เปิดรับทันทีเมื่อเผยแพร่</p>
          </AdminField>

          <AdminField label="วันเวลาปิดรับสมัคร" required icon={<Clock className="w-4 h-4" />} error={fieldErrors.registerCloseDate}>
            <input
              type="datetime-local"
              name="registerCloseDate"
              value={activity.registerCloseDate}
              onChange={handleActivityChange}
              className={`${adminInputCls} ${fieldErrors.registerCloseDate ? errBorder : ''}`}
            />
          </AdminField>

          <AdminField label="ค่าลงทะเบียน">
            <input
              name="feeText"
              value={activity.feeText}
              onChange={handleActivityChange}
              placeholder="เช่น ไม่มีค่าลงทะเบียน"
              className={adminInputCls}
            />
          </AdminField>

          <AdminField label="ค่าเดินทาง">
            <input
              name="travelText"
              value={activity.travelText}
              onChange={handleActivityChange}
              placeholder="เช่น สนับสนุนแบบเหมาจ่าย ท่านละ 1,000 บาท"
              className={adminInputCls}
            />
          </AdminField>

          <AdminField label="ลิงก์สถานที่ (แผนที่ / เว็บไซต์)" className="md:col-span-2">
            <div className="space-y-2">
              {venueLinks.map((v, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={v.label}
                    onChange={(e) => updateVenueLink(i, 'label', e.target.value)}
                    placeholder="ชื่อ (เช่น โรงแรม / ห้องประชุม)"
                    className={`${adminInputCls} flex-1`}
                  />
                  <input
                    value={v.url}
                    onChange={(e) => updateVenueLink(i, 'url', e.target.value)}
                    placeholder="https://..."
                    className={`${adminInputCls} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => removeVenueLink(i)}
                    className="px-3 text-slate-500 hover:text-red-500"
                    title="ลบ"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addVenueLink}
                className="text-[15px] font-medium text-yrupink-600 dark:text-yrupink-400 hover:underline"
              >
                + เพิ่มลิงก์สถานที่
              </button>
            </div>
          </AdminField>

          <AdminField label="หมายเหตุ" className="md:col-span-2">
            <textarea
              name="noteText"
              value={activity.noteText}
              onChange={handleActivityChange}
              rows={2}
              placeholder="เช่น รายชื่อและจำนวนผู้สมัครได้รับการยืนยันสิทธิ์แล้ว..."
              className={`${adminInputCls} resize-none`}
            />
          </AdminField>
        </div>
      </section>

      {/* Section: ฟอร์มลงทะเบียน (ประเภท + คำถาม) */}
      <RegistrationFormEditor value={regForm} onChange={setRegForm} />

      {/* Floating save button — bottom-right, visible while scrolling. */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="fixed bottom-6 right-6 z-40 px-6 py-3.5 bg-yrupink-600 hover:bg-yrupink-500 disabled:opacity-60 text-white text-[15px] font-semibold rounded-xl shadow-2xl shadow-yrupink-500/30 hover:shadow-yrupink-500/50 transition-all hover:-translate-y-0.5 flex items-center gap-2"
      >
        {saving
          ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...</>
          : <><Save className="w-4 h-4" /> บันทึกกิจกรรม</>}
      </button>
    </div>
  );
};

// ---- Sub components ----

const AdminField = ({ label, icon, required, error, className = '', children }) => (
  <div className={className}>
    <label className="text-[15px] font-medium text-slate-800 dark:text-yrugray-200 mb-1.5 flex items-center gap-1.5">
      {icon}
      {label}
      {required && <span className="text-yrupink-500 dark:text-yrupink-400">*</span>}
    </label>
    {children}
    {error && (
      <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
        <X className="w-3.5 h-3.5 flex-shrink-0" />
        {error}
      </p>
    )}
  </div>
);
export default CreateActivity;
