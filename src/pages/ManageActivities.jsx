import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Pencil,
  Trash2,
  Plus,
  X,
  Calendar,
  Clock,
  Users,
  MapPin,
  AlertTriangle,
  Save,
  Image as ImageIcon,
  Filter,
  ClipboardList,
  QrCode,
  Printer,
  Copy,
} from 'lucide-react';
import ActivityRegistrants from './ActivityRegistrants';

// Mock registrants generator — โครงข้อมูลตรงกับที่ frontend submit ในหน้าลงทะเบียน
const genRegistrants = (activityId, count) => {
  const names = [
    'สมชาย ใจดี', 'สมหญิง รักเรียน', 'อาลี ฮะซัน', 'นูรฟาติมะห์ สาแม',
    'อภิชาติ ประเสริฐ', 'มณีรัตน์ วงษ์ทอง', 'ไซดี ยะโก๊ะ', 'ปิยะฉัตร มาลี',
    'อนุพงษ์ ศรีทอง', 'ฟาริดา บินอิสมาแอล', 'ธนวัฒน์ สุขใจ', 'อาอีชะห์ แวหะยี',
  ];
  const orgs = [
    'มหาวิทยาลัยราชภัฏยะลา', 'โรงเรียนคณะราษฎรบำรุง', 'บริษัท SME พาณิชย์',
    'ศูนย์ ICT ยะลา', 'มหาวิทยาลัยฟาฏอนี', 'องค์การบริหารส่วนตำบล',
  ];
  const positions = ['นักศึกษา', 'อาจารย์', 'นักพัฒนาซอฟต์แวร์', 'ผู้ประกอบการ', 'ครู', 'นักวิเคราะห์ข้อมูล'];
  const statuses = ['รอตรวจสอบ', 'อนุมัติ', 'ปฏิเสธ', 'อนุมัติ', 'อนุมัติ']; // bias toward approved

  return Array.from({ length: count }, (_, i) => {
    const seed = activityId * 100 + i;
    const nameIdx = seed % names.length;
    return {
      id: `${activityId}-${i + 1}`,
      fullName: names[nameIdx],
      email: `user${seed}@example.com`,
      phone: `08${(1000000 + seed * 137) % 10000000}`.slice(0, 10),
      organization: orgs[seed % orgs.length],
      position: positions[seed % positions.length],
      note: i % 3 === 0 ? 'อยากเรียนรู้เพิ่มเติมเกี่ยวกับ AI เพื่อประยุกต์ใช้ในงาน' : '',
      registeredAt: `${5 + (seed % 20)} ต.ค. 2568`,
      status: statuses[seed % statuses.length],
    };
  });
};

// Mock seed data — โครงเดียวกับหน้าลิสต์ฝั่งผู้ใช้ ไว้เชื่อม API ทีหลัง
const INITIAL_ACTIVITIES = [
  {
    id: 1,
    title: 'พื้นฐาน AI สำหรับผู้เริ่มต้น',
    category: 'พื้นฐาน AI',
    description: 'เรียนรู้แนวคิดพื้นฐานของปัญญาประดิษฐ์ ประเภทของ AI และการประยุกต์ใช้ในชีวิตประจำวัน',
    date: '15 ต.ค. 2568',
    duration: '2 วัน',
    seats: 30,
    location: 'ห้องประชุมชั้น 3 อาคาร AI Center',
    level: 'เริ่มต้น',
    image: 'https://picsum.photos/seed/ai-intro/800/450',
    status: 'เปิดรับสมัคร',
    registrants: genRegistrants(1, 12),
  },
  {
    id: 2,
    title: 'Prompt Engineering ขั้นสูง',
    category: 'Prompt Engineering',
    description: 'เทคนิคการเขียน Prompt เพื่อสั่งงาน LLM ให้ได้ผลลัพธ์ตามต้องการ พร้อม workshop จริง',
    date: '22 ต.ค. 2568',
    duration: '1 วัน',
    seats: 25,
    location: 'ห้อง Lab AI Center',
    level: 'ปานกลาง',
    image: 'https://picsum.photos/seed/prompt-eng/800/450',
    status: 'เปิดรับสมัคร',
    registrants: genRegistrants(2, 18),
  },
  {
    id: 3,
    title: 'Machine Learning ด้วย Python',
    category: 'Machine Learning',
    description: 'เขียน ML model ด้วย scikit-learn ตั้งแต่ preprocessing ไปจนถึง evaluation',
    date: '5 พ.ย. 2568',
    duration: '3 วัน',
    seats: 20,
    location: 'ห้อง Lab คอมพิวเตอร์ อาคาร 20',
    level: 'ปานกลาง',
    image: 'https://picsum.photos/seed/ml-python/800/450',
    status: 'เปิดรับสมัคร',
    registrants: genRegistrants(3, 15),
  },
  {
    id: 4,
    title: 'Deep Learning และ Neural Networks',
    category: 'Deep Learning',
    description: 'ทำความเข้าใจ Neural Network, CNN, RNN และการสร้างโมเดลด้วย TensorFlow/PyTorch',
    date: '19 พ.ย. 2568',
    duration: '4 วัน',
    seats: 15,
    location: 'ห้อง Lab AI Center',
    level: 'ขั้นสูง',
    image: 'https://picsum.photos/seed/deep-learning/800/450',
    status: 'ร่าง',
    registrants: [],
  },
  {
    id: 5,
    title: 'AI สำหรับ SME และผู้ประกอบการ',
    category: 'AI สำหรับธุรกิจ',
    description: 'นำ AI มาปรับใช้กับธุรกิจ SME ในพื้นที่ 3 จังหวัดชายแดนใต้ พร้อมกรณีศึกษาจริง',
    date: '3 ธ.ค. 2568',
    duration: '2 วัน',
    seats: 40,
    location: 'ห้องประชุมใหญ่ มหาวิทยาลัยราชภัฏยะลา',
    level: 'เริ่มต้น',
    image: 'https://picsum.photos/seed/ai-sme/800/450',
    status: 'เปิดรับสมัคร',
    registrants: genRegistrants(5, 22),
  },
  {
    id: 6,
    title: 'สร้าง Chatbot ด้วย AI Agent',
    category: 'พื้นฐาน AI',
    description: 'workshop ปฏิบัติจริงในการสร้าง Chatbot ด้วย LLM และ Framework สมัยใหม่',
    date: '17 ธ.ค. 2568',
    duration: '2 วัน',
    seats: 25,
    location: 'ห้อง Lab AI Center',
    level: 'ปานกลาง',
    image: 'https://picsum.photos/seed/chatbot-agent/800/450',
    status: 'ปิดรับสมัคร',
    registrants: genRegistrants(6, 25),
  },
];

const inputCls =
  'w-full bg-yrugray-800 border border-yrugray-700 text-sm rounded-lg px-3 py-2 text-white placeholder:text-yrugray-500 focus:outline-none focus:border-yrupink-500 focus:ring-1 focus:ring-yrupink-500 transition-all';

const ManageActivities = ({ onGoCreate }) => {
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ทั้งหมด');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [viewingRegistrants, setViewingRegistrants] = useState(null);
  const [viewingQR, setViewingQR] = useState(null);

  const statuses = ['ทั้งหมด', 'เปิดรับสมัคร', 'ปิดรับสมัคร', 'ร่าง'];

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      const matchStatus = statusFilter === 'ทั้งหมด' || a.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [activities, searchQuery, statusFilter]);

  const handleUpdate = (updated) => {
    setActivities((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setEditing(null);
  };

  const handleDelete = () => {
    setActivities((prev) => prev.filter((a) => a.id !== deleting.id));
    setDeleting(null);
  };

  const handleRegistrantsChange = (activityId, nextRegistrants) => {
    setActivities((prev) => prev.map((a) => (a.id === activityId ? { ...a, registrants: nextRegistrants } : a)));
  };

  if (viewingRegistrants) {
    // Always show latest data from activities state
    const current = activities.find((a) => a.id === viewingRegistrants.id) || viewingRegistrants;
    return (
      <ActivityRegistrants
        activity={current}
        onBack={() => setViewingRegistrants(null)}
        onChange={(next) => handleRegistrantsChange(current.id, next)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">จัดการหลักสูตร</h2>
          <p className="text-sm text-yrugray-400 mt-1">
            หลักสูตรทั้งหมด {activities.length} รายการ — ค้นหา แก้ไข หรือลบได้จากตารางด้านล่าง
          </p>
        </div>
        <button
          onClick={onGoCreate}
          className="px-5 py-2.5 bg-yrupink-600 hover:bg-yrupink-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-yrupink-500/20 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          สร้างกิจกรรมใหม่
        </button>
      </div>

      {/* Search + Filter */}
      <div className="bg-yrugray-900 border border-yrugray-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="w-4 h-4 text-yrugray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อหลักสูตร หรือหมวดหมู่..."
            className={`${inputCls} pl-9`}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-yrugray-500" />
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                statusFilter === s
                  ? 'bg-yrupink-600 text-white border-yrupink-500'
                  : 'bg-yrugray-800 text-yrugray-300 border-yrugray-700 hover:border-yrupink-500/50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-yrugray-900 border border-yrugray-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-yrugray-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6 text-yrugray-500" />
            </div>
            <p className="text-yrugray-400 text-sm">ไม่พบหลักสูตรที่ตรงกับเงื่อนไข</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-yrugray-900/50 border-b border-yrugray-800">
                <tr className="text-left text-xs font-semibold text-yrugray-400 uppercase tracking-wider">
                  <th className="px-6 py-3">หลักสูตร</th>
                  <th className="px-6 py-3">หมวดหมู่ / ระดับ</th>
                  <th className="px-6 py-3">วันที่</th>
                  <th className="px-6 py-3">ที่นั่ง</th>
                  <th className="px-6 py-3">สถานะ</th>
                  <th className="px-6 py-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-yrugray-800">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-yrugray-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-yrugray-800 shrink-0 border border-yrugray-700">
                          {a.image ? (
                            <img src={a.image} alt={a.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-yrugray-500" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate max-w-[280px]">{a.title}</p>
                          <p className="text-xs text-yrugray-400 truncate max-w-[280px] mt-0.5">{a.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-yrupink-400 font-medium">{a.category}</p>
                      <p className="text-xs text-yrugray-400 mt-0.5">{a.level}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-yrugray-200">{a.date}</p>
                      <p className="text-xs text-yrugray-400 mt-0.5">{a.duration}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-yrugray-200">
                        <span className="text-yrupink-400 font-semibold">{a.registrants?.length || 0}</span>
                        <span className="text-yrugray-500"> / {a.seats} คน</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingQR(a)}
                          title="แสดง QR ป้ายงาน"
                          className="p-2 text-yrugray-400 hover:text-yrupink-400 hover:bg-yrupink-500/10 rounded-lg transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewingRegistrants(a)}
                          title="ดูรายชื่อผู้ลงทะเบียน"
                          className="p-2 text-yrugray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors relative"
                        >
                          <ClipboardList className="w-4 h-4" />
                          {a.registrants?.length > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-yrupink-500 text-white border-2 border-yrugray-900">
                              {a.registrants.length}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => setEditing(a)}
                          title="แก้ไข"
                          className="p-2 text-yrugray-400 hover:text-yrupink-400 hover:bg-yrupink-500/10 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(a)}
                          title="ลบ"
                          className="p-2 text-yrugray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <EditActivityModal
          activity={editing}
          onClose={() => setEditing(null)}
          onSave={handleUpdate}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleting && (
        <DeleteConfirmModal
          activity={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      )}

      {/* QR Modal */}
      {viewingQR && (
        <QRModal
          activity={viewingQR}
          onClose={() => setViewingQR(null)}
        />
      )}
    </div>
  );
};

const QRModal = ({ activity, onClose }) => {
  // In production activityId = a stable slug; for demo we map ids 1,2 → known mock slugs
  const slug = activity.id === 1 ? 'ai-basic-oct68' : activity.id === 2 ? 'prompt-oct68' : `activity-${activity.id}`;
  const url = `${window.location.origin}/?e=${slug}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data=${encodeURIComponent(url)}`;

  const copyUrl = () => {
    navigator.clipboard?.writeText(url).then(
      () => alert('คัดลอกลิงก์แล้ว'),
      () => alert('URL: ' + url)
    );
  };

  const printQR = () => {
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>QR - ${activity.title}</title>
      <style>
        body { font-family: 'Noto Sans Thai', sans-serif; margin: 0; padding: 40px; text-align: center; }
        h1 { font-size: 28px; margin: 0 0 8px; }
        h2 { font-size: 20px; margin: 0 0 24px; color: #666; }
        img { max-width: 400px; margin: 24px auto; display: block; border: 2px solid #eee; padding: 12px; }
        .meta { font-size: 16px; color: #333; margin-bottom: 8px; }
        .url { font-family: monospace; font-size: 14px; color: #db2777; margin-top: 12px; word-break: break-all; }
        .hint { font-size: 14px; color: #888; margin-top: 20px; }
        @media print { body { padding: 0; } }
      </style>
      </head><body>
        <h1>AI Center YRU</h1>
        <h2>${activity.title}</h2>
        <div class="meta">📅 ${activity.date}</div>
        <div class="meta">📍 ${activity.location || ''}</div>
        <img src="${qrSrc}" alt="QR" />
        <div class="hint">📱 สแกนเพื่อทำแบบประเมินและดาวน์โหลดวุฒิบัตร</div>
        <div class="url">${url}</div>
      </body></html>
    `);
    w.document.close();
    setTimeout(() => { w.print(); }, 500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div onClick={onClose} className="absolute inset-0" />
      <div className="relative bg-yrugray-900 border border-yrugray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-yrugray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-yrupink-400" />
            <h3 className="text-lg font-bold text-white">QR ป้ายงาน</h3>
          </div>
          <button onClick={onClose} className="text-yrugray-400 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-xs text-yrugray-400 mb-1">หลักสูตร</p>
          <p className="text-sm font-semibold text-white mb-4">{activity.title}</p>

          <div className="bg-white rounded-xl p-4 mb-4 flex items-center justify-center">
            <img src={qrSrc} alt="QR" className="w-64 h-64" />
          </div>

          <div className="mb-4">
            <p className="text-xs text-yrugray-400 mb-1">URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-yrupink-400 bg-yrugray-800 border border-yrugray-700 rounded-lg px-3 py-2 truncate">
                {url}
              </code>
              <button
                onClick={copyUrl}
                title="คัดลอก URL"
                className="p-2 text-yrugray-400 hover:text-white hover:bg-yrugray-800 rounded-lg"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-3 bg-yrupink-500/10 border border-yrupink-500/30 rounded-lg text-xs text-yrugray-300 mb-4">
            💡 <strong>วิธีใช้:</strong> พิมพ์ QR ขนาด A4 ติดที่โต๊ะเช็คอิน / ฉายบนจอ — ผู้อบรมสแกน → กรอกเบอร์ที่ลงทะเบียน → ทำแบบประเมิน → โหลดวุฒิบัตร
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={printQR}
              className="py-2.5 rounded-lg bg-yrupink-600 hover:bg-yrupink-500 text-white text-sm font-semibold shadow-lg shadow-yrupink-500/20 flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              พิมพ์ป้าย A4
            </button>
            <a
              href={qrSrc}
              download={`qr-${activity.id}.png`}
              className="py-2.5 rounded-lg bg-yrugray-800 hover:bg-yrugray-700 border border-yrugray-700 text-yrugray-200 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              ดาวน์โหลด PNG
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- Sub components ----

const StatusBadge = ({ status }) => {
  const map = {
    'เปิดรับสมัคร': 'bg-green-500/10 text-green-400 border-green-500/30',
    'ปิดรับสมัคร': 'bg-red-500/10 text-red-400 border-red-500/30',
    'ร่าง': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${map[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/30'}`}>
      {status}
    </span>
  );
};

const ModalShell = ({ children, onClose, size = 'md' }) => {
  const sizeCls = size === 'lg' ? 'max-w-3xl' : 'max-w-md';
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        onClick={onClose}
        className="absolute inset-0"
      />
      <div className={`relative bg-yrugray-900 border border-yrugray-800 rounded-2xl shadow-2xl w-full ${sizeCls} max-h-[90vh] overflow-hidden flex flex-col`}>
        {children}
      </div>
    </div>
  );
};

const EditActivityModal = ({ activity, onClose, onSave }) => {
  const [form, setForm] = useState(activity);

  const change = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <ModalShell onClose={onClose} size="lg">
      <div className="px-6 py-4 border-b border-yrugray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pencil className="w-5 h-5 text-yrupink-400" />
          <h3 className="text-lg font-bold text-white">แก้ไขหลักสูตร</h3>
        </div>
        <button onClick={onClose} className="text-yrugray-400 hover:text-white p-1 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={submit} className="overflow-y-auto flex-1">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="ชื่อหลักสูตร" required className="md:col-span-2">
            <input
              value={form.title}
              onChange={(e) => change('title', e.target.value)}
              required
              className={inputCls}
            />
          </Field>

          <Field label="หมวดหมู่">
            <input
              value={form.category}
              onChange={(e) => change('category', e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="ระดับ">
            <select
              value={form.level}
              onChange={(e) => change('level', e.target.value)}
              className={inputCls}
            >
              <option value="เริ่มต้น">เริ่มต้น</option>
              <option value="ปานกลาง">ปานกลาง</option>
              <option value="ขั้นสูง">ขั้นสูง</option>
            </select>
          </Field>

          <Field label="วันที่" icon={<Calendar className="w-4 h-4" />}>
            <input
              value={form.date}
              onChange={(e) => change('date', e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="ระยะเวลา" icon={<Clock className="w-4 h-4" />}>
            <input
              value={form.duration}
              onChange={(e) => change('duration', e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="จำนวนที่รับ" icon={<Users className="w-4 h-4" />}>
            <input
              type="number"
              value={form.seats}
              onChange={(e) => change('seats', Number(e.target.value))}
              className={inputCls}
            />
          </Field>

          <Field label="สถานะ">
            <select
              value={form.status}
              onChange={(e) => change('status', e.target.value)}
              className={inputCls}
            >
              <option value="เปิดรับสมัคร">เปิดรับสมัคร</option>
              <option value="ปิดรับสมัคร">ปิดรับสมัคร</option>
              <option value="ร่าง">ร่าง</option>
            </select>
          </Field>

          <Field label="สถานที่" icon={<MapPin className="w-4 h-4" />} className="md:col-span-2">
            <input
              value={form.location}
              onChange={(e) => change('location', e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="URL รูปแบนเนอร์" icon={<ImageIcon className="w-4 h-4" />} className="md:col-span-2">
            <input
              value={form.image || ''}
              onChange={(e) => change('image', e.target.value)}
              className={inputCls}
              placeholder="https://..."
            />
            {form.image && (
              <div className="mt-2 rounded-lg overflow-hidden border border-yrugray-700 aspect-[16/9] bg-yrugray-800">
                <img src={form.image} alt="preview" className="w-full h-full object-cover" />
              </div>
            )}
          </Field>

          <Field label="รายละเอียด" className="md:col-span-2">
            <textarea
              value={form.description}
              onChange={(e) => change('description', e.target.value)}
              rows={4}
              className={`${inputCls} resize-none`}
            />
          </Field>
        </div>

        <div className="px-6 py-4 border-t border-yrugray-800 flex items-center justify-end gap-2 bg-yrugray-900/50 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-yrugray-300 hover:text-white hover:bg-yrugray-800 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-yrupink-600 hover:bg-yrupink-500 text-white text-sm font-semibold shadow-lg shadow-yrupink-500/20 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            บันทึกการแก้ไข
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

const DeleteConfirmModal = ({ activity, onClose, onConfirm }) => (
  <ModalShell onClose={onClose}>
    <div className="p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-7 h-7 text-red-400" />
      </div>
      <h3 className="text-lg font-bold text-white mb-1">ยืนยันการลบหลักสูตร</h3>
      <p className="text-sm text-yrugray-300 mb-1">
        คุณแน่ใจหรือไม่ว่าต้องการลบ
      </p>
      <p className="text-sm font-semibold text-white mb-4 line-clamp-2">
        "{activity.title}"
      </p>
      <p className="text-xs text-yrugray-500 mb-6">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={onClose}
          className="px-5 py-2 rounded-lg text-sm text-yrugray-300 hover:text-white hover:bg-yrugray-800 transition-colors border border-yrugray-700"
        >
          ยกเลิก
        </button>
        <button
          onClick={onConfirm}
          className="px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold shadow-lg shadow-red-500/20 transition-colors flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          ลบหลักสูตร
        </button>
      </div>
    </div>
  </ModalShell>
);

const Field = ({ label, icon, required, className = '', children }) => (
  <div className={className}>
    <label className="text-sm text-yrugray-300 mb-1.5 flex items-center gap-1.5">
      {icon}
      {label}
      {required && <span className="text-yrupink-400">*</span>}
    </label>
    {children}
  </div>
);

export default ManageActivities;
