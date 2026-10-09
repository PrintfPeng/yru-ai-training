import React, { useState, useRef } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  Users,
  MapPin,
  Trash2,
  Upload,
  Save,
  X,
  ImagePlus,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import DynamicFormBuilder from '../components/DynamicFormBuilder';
import { activitiesApi, assessmentsApi, ApiError } from '../api';

const adminInputCls =
  'w-full bg-white dark:bg-yrugray-800 border border-slate-300 dark:border-yrugray-700 text-[15px] rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-yrugray-500 focus:outline-none focus:border-yrupink-500 focus:ring-1 focus:ring-yrupink-500 transition-all';

const CreateActivity = () => {
  // Activity metadata
  const [activity, setActivity] = useState({
    title: '',
    titleEn: '',
    batchNo: '',
    category: '',
    level: 'เริ่มต้น',
    description: '',
    startDate: '',
    endDate: '',
    registerCloseDate: '',
    hasSelection: false,
    feeText: '',
    travelText: '',
    noteText: '',
    seats: '',
    location: '',
  });
  const [venueLinks, setVenueLinks] = useState([]); // [{label, url}]

  // Banner image
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [bannerError, setBannerError] = useState('');

  // Dynamic form questions
  const [questions, setQuestions] = useState([]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleActivityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setActivity((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // venue_links repeater helpers
  const addVenueLink = () => setVenueLinks((p) => [...p, { label: '', url: '' }]);
  const updateVenueLink = (i, key, val) =>
    setVenueLinks((p) => p.map((v, idx) => (idx === i ? { ...v, [key]: val } : v)));
  const removeVenueLink = (i) => setVenueLinks((p) => p.filter((_, idx) => idx !== i));

  const handleBannerSelect = (file) => {
    setBannerError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setBannerError('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WebP, GIF)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setBannerError('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setBannerPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleBannerRemove = () => {
    setBannerFile(null);
    setBannerPreview('');
    setBannerError('');
  };

  const handleSave = async () => {
    setSaveError('');
    if (!activity.title.trim() || !activity.startDate || !activity.endDate) {
      setSaveError('กรุณากรอกชื่อหลักสูตร วันเริ่ม และวันสิ้นสุดอบรม');
      return;
    }
    if (activity.endDate < activity.startDate) {
      setSaveError('วันสิ้นสุดต้องไม่ก่อนวันเริ่มอบรม');
      return;
    }
    setSaving(true);
    try {
      const start = `${activity.startDate} 09:00:00`;
      const end = `${activity.endDate} 16:30:00`;
      const links = venueLinks.filter((v) => v.label.trim() && v.url.trim());

      const created = await activitiesApi.create({
        title:       activity.title.trim(),
        title_en:    activity.titleEn.trim() || undefined,
        batch_no:    activity.batchNo ? Number(activity.batchNo) : undefined,
        description: activity.description || undefined,
        location:    activity.location || undefined,
        start_date:  start,
        end_date:    end,
        register_close_date: activity.registerCloseDate || undefined,
        has_selection: activity.hasSelection,
        fee_text:    activity.feeText.trim() || undefined,
        travel_text: activity.travelText.trim() || undefined,
        note_text:   activity.noteText.trim() || undefined,
        venue_links: links.length ? links : undefined,
        capacity:    Number(activity.seats) || 0,
        status:      'draft',
        cover_image_url: bannerPreview || undefined,
      });

      // If admin added dynamic form questions, save them as a satisfaction assessment.
      if (questions.length > 0) {
        await assessmentsApi.create(created.id, {
          title:        `แบบสอบถามความพึงพอใจ — ${activity.title.trim()}`,
          description:  activity.description || undefined,
          type:         'satisfaction',
          form_schema:  { fields: questions.map((q) => ({
            id: String(q.id), type: q.type, label: q.question,
            required: !!q.required,
            options: q.options?.length ? q.options : undefined,
          })) },
          is_published: false,
        });
      }
      alert(`บันทึกกิจกรรมเรียบร้อย (id: ${created.id})`);
      // Reset form
      setActivity({ title: '', titleEn: '', batchNo: '', category: '', level: 'เริ่มต้น',
                    description: '', startDate: '', endDate: '', registerCloseDate: '',
                    hasSelection: false, feeText: '', travelText: '', noteText: '',
                    seats: '', location: '' });
      setVenueLinks([]);
      setQuestions([]);
      setBannerFile(null);
      setBannerPreview('');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'DUPLICATE_SLUG') {
        setSaveError('มีหลักสูตรชื่อ (slug) นี้อยู่แล้ว กรุณาเปลี่ยนชื่อ');
      } else {
        setSaveError(err?.message || 'บันทึกไม่สำเร็จ');
      }
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

      {saveError && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-700 dark:text-red-300">
          {saveError}
        </div>
      )}

      {/* Section: รายละเอียดกิจกรรม */}
      <section className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-yrugray-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-yrupink-500 dark:text-yrupink-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">รายละเอียดกิจกรรม</h3>
        </div>

        <div className="p-6 pb-0">
          <BannerUploader
            preview={bannerPreview}
            fileName={bannerFile?.name}
            fileSize={bannerFile?.size}
            error={bannerError}
            onSelect={handleBannerSelect}
            onRemove={handleBannerRemove}
          />
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <AdminField label="ชื่อกิจกรรม / หลักสูตร" required>
            <input
              name="title"
              value={activity.title}
              onChange={handleActivityChange}
              placeholder="เช่น Prompt Engineering ขั้นสูง"
              className={adminInputCls}
            />
          </AdminField>

          <AdminField label="ชื่อภาษาอังกฤษ (subtitle)">
            <input
              name="titleEn"
              value={activity.titleEn}
              onChange={handleActivityChange}
              placeholder="e.g. Advanced Prompt Engineering"
              className={adminInputCls}
            />
          </AdminField>

          <AdminField label="รุ่นที่">
            <input
              type="number"
              min={1}
              name="batchNo"
              value={activity.batchNo}
              onChange={handleActivityChange}
              placeholder="เช่น 1"
              className={adminInputCls}
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

          <AdminField label="วันเริ่มอบรม" required icon={<Calendar className="w-4 h-4" />}>
            <input
              type="date"
              name="startDate"
              value={activity.startDate}
              onChange={handleActivityChange}
              className={adminInputCls}
            />
          </AdminField>

          <AdminField label="วันสิ้นสุดอบรม" required icon={<Calendar className="w-4 h-4" />}>
            <input
              type="date"
              name="endDate"
              value={activity.endDate}
              onChange={handleActivityChange}
              className={adminInputCls}
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

          <AdminField label="วันปิดรับสมัคร" icon={<Calendar className="w-4 h-4" />}>
            <input
              type="date"
              name="registerCloseDate"
              value={activity.registerCloseDate}
              onChange={handleActivityChange}
              className={adminInputCls}
            />
          </AdminField>

          <AdminField label="การพิจารณาคัดเลือก">
            <label className="flex items-center gap-2 h-full text-[15px] text-slate-700 dark:text-yrugray-300 cursor-pointer select-none">
              <input
                type="checkbox"
                name="hasSelection"
                checked={activity.hasSelection}
                onChange={handleActivityChange}
                className="w-4 h-4 accent-yrupink-500"
              />
              มีการพิจารณาคัดเลือก
            </label>
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

      {/* Section: Dynamic Form Builder (shared component) */}
      <DynamicFormBuilder
        questions={questions}
        onChange={setQuestions}
        title="ฟอร์มลงทะเบียน (Dynamic Form)"
        description="ออกแบบคำถามที่ต้องการให้ผู้ลงทะเบียนกรอก — ลากเพื่อจัดลำดับ (จะเปิดใช้ในเวอร์ชันถัดไป)"
      />

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

const AdminField = ({ label, icon, required, className = '', children }) => (
  <div className={className}>
    <label className="text-[15px] font-medium text-slate-800 dark:text-yrugray-200 mb-1.5 flex items-center gap-1.5">
      {icon}
      {label}
      {required && <span className="text-yrupink-500 dark:text-yrupink-400">*</span>}
    </label>
    {children}
  </div>
);

const BannerUploader = ({ preview, fileName, fileSize, error, onSelect, onRemove }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onSelect(file);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div>
      <label className="text-sm text-slate-600 dark:text-yrugray-300 mb-1.5 flex items-center gap-1.5">
        <ImageIcon className="w-4 h-4" />
        รูปแบนเนอร์กิจกรรม
        <span className="text-slate-400 dark:text-yrugray-500 font-normal text-xs">(แนะนำอัตราส่วน 16:9, สูงสุด 5MB)</span>
      </label>

      {preview ? (
        <div className="relative group rounded-xl overflow-hidden border border-slate-300 dark:border-yrugray-700">
          <img
            src={preview}
            alt="banner preview"
            className="w-full h-56 md:h-64 object-cover bg-slate-100 dark:bg-yrugray-800"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="text-sm text-slate-900 dark:text-white">
              <p className="font-medium truncate max-w-[240px]">{fileName}</p>
              <p className="text-xs text-slate-600 dark:text-yrugray-300">{formatSize(fileSize)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-slate-900 dark:text-white text-xs font-medium flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                เปลี่ยนรูป
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="px-3 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-xs font-medium flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ลบ
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all h-48 md:h-56 flex flex-col items-center justify-center text-center px-6 ${
            dragActive
              ? 'border-yrupink-500 bg-yrupink-500/10'
              : 'border-yrugray-700 hover:border-yrupink-500/50 hover:bg-yrugray-800/30 bg-yrugray-800/20'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-yrupink-500/10 border border-yrupink-500/30 flex items-center justify-center mb-3">
            <ImagePlus className="w-6 h-6 text-yrupink-400" />
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
            คลิกเพื่อเลือกรูป หรือ ลากไฟล์มาวางที่นี่
          </p>
          <p className="text-xs text-slate-500 dark:text-yrugray-400">รองรับ JPG, PNG, WebP, GIF ขนาดไม่เกิน 5MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0])}
      />

      {error && (
        <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
          <X className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
};

export default CreateActivity;
