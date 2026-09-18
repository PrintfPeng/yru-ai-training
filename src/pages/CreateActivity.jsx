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
  'w-full bg-yrugray-800 border border-yrugray-700 text-sm rounded-lg px-3 py-2 text-white placeholder:text-yrugray-500 focus:outline-none focus:border-yrupink-500 focus:ring-1 focus:ring-yrupink-500 transition-all';

const CreateActivity = () => {
  // Activity metadata
  const [activity, setActivity] = useState({
    title: '',
    category: '',
    level: 'เริ่มต้น',
    description: '',
    date: '',
    duration: '',
    seats: '',
    location: '',
  });

  // Banner image
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [bannerError, setBannerError] = useState('');

  // Dynamic form questions
  const [questions, setQuestions] = useState([]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleActivityChange = (e) => {
    const { name, value } = e.target;
    setActivity((prev) => ({ ...prev, [name]: value }));
  };

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
    if (!activity.title.trim() || !activity.date) {
      setSaveError('กรุณากรอกชื่อหลักสูตรและวันที่จัดอบรม');
      return;
    }
    setSaving(true);
    try {
      // Duration is entered as "N วัน" — convert to end_date by adding N-1 days.
      const days = Math.max(1, parseInt(activity.duration, 10) || 1);
      const start = `${activity.date} 09:00:00`;
      const endDate = new Date(activity.date);
      endDate.setDate(endDate.getDate() + (days - 1));
      const end = `${endDate.toISOString().slice(0, 10)} 16:30:00`;

      const created = await activitiesApi.create({
        title:       activity.title.trim(),
        description: activity.description || undefined,
        location:    activity.location || undefined,
        start_date:  start,
        end_date:    end,
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
      setActivity({ title: '', category: '', level: 'เริ่มต้น', description: '',
                    date: '', duration: '', seats: '', location: '' });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">สร้างกิจกรรม</h2>
          <p className="text-sm text-yrugray-400 mt-1">
            กรอกรายละเอียดกิจกรรม และออกแบบฟอร์มลงทะเบียนแบบไดนามิก
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-yrupink-600 hover:bg-yrupink-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg shadow-lg shadow-yrupink-500/20 transition-colors flex items-center gap-2"
        >
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...</>
            : <><Save className="w-4 h-4" /> บันทึกกิจกรรม</>}
        </button>
      </div>

      {saveError && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">
          {saveError}
        </div>
      )}

      {/* Section: รายละเอียดกิจกรรม */}
      <section className="bg-yrugray-900 border border-yrugray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-yrugray-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-yrupink-400" />
          <h3 className="text-lg font-bold text-white">รายละเอียดกิจกรรม</h3>
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

          <AdminField label="วันที่จัดอบรม" icon={<Calendar className="w-4 h-4" />}>
            <input
              type="date"
              name="date"
              value={activity.date}
              onChange={handleActivityChange}
              className={adminInputCls}
            />
          </AdminField>

          <AdminField label="ระยะเวลา" icon={<Clock className="w-4 h-4" />}>
            <input
              name="duration"
              value={activity.duration}
              onChange={handleActivityChange}
              placeholder="เช่น 2 วัน"
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
        </div>
      </section>

      {/* Section: Dynamic Form Builder (shared component) */}
      <DynamicFormBuilder
        questions={questions}
        onChange={setQuestions}
        title="ฟอร์มลงทะเบียน (Dynamic Form)"
        description="ออกแบบคำถามที่ต้องการให้ผู้ลงทะเบียนกรอก — ลากเพื่อจัดลำดับ (จะเปิดใช้ในเวอร์ชันถัดไป)"
      />
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
      <label className="text-sm text-yrugray-300 mb-1.5 flex items-center gap-1.5">
        <ImageIcon className="w-4 h-4" />
        รูปแบนเนอร์กิจกรรม
        <span className="text-yrugray-500 font-normal text-xs">(แนะนำอัตราส่วน 16:9, สูงสุด 5MB)</span>
      </label>

      {preview ? (
        <div className="relative group rounded-xl overflow-hidden border border-yrugray-700">
          <img
            src={preview}
            alt="banner preview"
            className="w-full h-56 md:h-64 object-cover bg-yrugray-800"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="text-sm text-white">
              <p className="font-medium truncate max-w-[240px]">{fileName}</p>
              <p className="text-xs text-yrugray-300">{formatSize(fileSize)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white text-xs font-medium flex items-center gap-1.5"
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
          <p className="text-sm font-semibold text-white mb-1">
            คลิกเพื่อเลือกรูป หรือ ลากไฟล์มาวางที่นี่
          </p>
          <p className="text-xs text-yrugray-400">รองรับ JPG, PNG, WebP, GIF ขนาดไม่เกิน 5MB</p>
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
