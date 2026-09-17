// Centralized mock data for the trainee flow (EventLanding → Survey → Cert)
// In production this comes from API. Keep structure aligned with backend contract.

export const MOCK_EVENT_ACTIVITIES = {
  'prompt-oct68': {
    id: 'prompt-oct68',
    title: 'Prompt Engineering ขั้นสูง',
    category: 'Prompt Engineering',
    date: '22 ต.ค. 2568',
    duration: '1 วัน',
    location: 'ห้อง Lab AI Center มหาวิทยาลัยราชภัฏยะลา',
    banner: 'https://picsum.photos/seed/prompt-eng/1200/400',
  },
  'ai-basic-oct68': {
    id: 'ai-basic-oct68',
    title: 'พื้นฐาน AI สำหรับผู้เริ่มต้น',
    category: 'พื้นฐาน AI',
    date: '15 ต.ค. 2568',
    duration: '2 วัน',
    location: 'ห้องประชุมชั้น 3 อาคาร AI Center',
    banner: 'https://picsum.photos/seed/ai-intro/1200/400',
  },
};

// Registrants approved for each activity — user verifies via phone
export const MOCK_REGISTRANTS = {
  'prompt-oct68': [
    { id: 'r1', fullName: 'สมชาย ใจดี', phone: '0812345678', organization: 'มหาวิทยาลัยราชภัฏยะลา', position: 'อาจารย์' },
    { id: 'r2', fullName: 'สมหญิง รักเรียน', phone: '0898765432', organization: 'โรงเรียนคณะราษฎรบำรุง', position: 'ครู' },
    { id: 'r3', fullName: 'อาลี ฮะซัน', phone: '0865551234', organization: 'ศูนย์ ICT ยะลา', position: 'นักพัฒนา' },
    { id: 'r4', fullName: 'นูรฟาติมะห์ สาแม', phone: '0821112222', organization: 'มหาวิทยาลัยฟาฏอนี', position: 'นักศึกษา' },
    { id: 'r5', fullName: 'อภิชาติ ประเสริฐ', phone: '0834445555', organization: 'บริษัท SME พาณิชย์', position: 'ผู้ประกอบการ' },
  ],
  'ai-basic-oct68': [
    { id: 'a1', fullName: 'มณีรัตน์ วงษ์ทอง', phone: '0899998888', organization: 'อบต. ตำบลสะเตง', position: 'นักวิชาการ' },
    { id: 'a2', fullName: 'ธนวัฒน์ สุขใจ', phone: '0877776666', organization: 'มหาวิทยาลัยราชภัฏยะลา', position: 'นักศึกษา' },
  ],
};

// Satisfaction survey per activity (uses same schema as DynamicFormBuilder)
export const MOCK_ASSESSMENT = {
  'prompt-oct68': {
    title: 'แบบประเมินความพึงพอใจ',
    description: 'ขอความอนุเคราะห์ท่านตอบแบบสอบถามเพื่อนำไปพัฒนาการจัดหลักสูตรครั้งต่อไป',
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'ความพึงพอใจต่อวิทยากรโดยรวม',
        options: ['พอใจมาก', 'พอใจ', 'ปานกลาง', 'ไม่พอใจ', 'ไม่พอใจมาก'],
        required: true,
      },
      {
        id: 'q2',
        type: 'multiple_choice',
        question: 'ความพึงพอใจต่อเนื้อหาหลักสูตร',
        options: ['พอใจมาก', 'พอใจ', 'ปานกลาง', 'ไม่พอใจ', 'ไม่พอใจมาก'],
        required: true,
      },
      {
        id: 'q3',
        type: 'multiple_choice',
        question: 'ความพึงพอใจต่อสถานที่และอุปกรณ์',
        options: ['พอใจมาก', 'พอใจ', 'ปานกลาง', 'ไม่พอใจ', 'ไม่พอใจมาก'],
        required: true,
      },
      {
        id: 'q4',
        type: 'checkboxes',
        question: 'หัวข้อใดที่คุณสนใจให้จัดในรอบถัดไป (เลือกได้มากกว่า 1)',
        options: ['Machine Learning', 'Deep Learning', 'Computer Vision', 'NLP', 'AI Ethics', 'MLOps'],
        required: false,
      },
      {
        id: 'q5',
        type: 'dropdown',
        question: 'คุณทราบข่าวการอบรมครั้งนี้จากช่องทางใด',
        options: ['Facebook', 'Line', 'Website ศูนย์ AI', 'เพื่อน / เพื่อนร่วมงานแนะนำ', 'อื่นๆ'],
        required: true,
      },
      {
        id: 'q6',
        type: 'paragraph',
        question: 'ข้อเสนอแนะเพิ่มเติม',
        required: false,
      },
    ],
  },
  'ai-basic-oct68': {
    title: 'แบบประเมินความพึงพอใจ',
    description: 'กรุณาให้ความคิดเห็นเพื่อพัฒนาการอบรมครั้งต่อไป',
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'ความพึงพอใจโดยรวมต่อการอบรม',
        options: ['พอใจมาก', 'พอใจ', 'ปานกลาง', 'ไม่พอใจ'],
        required: true,
      },
      {
        id: 'q2',
        type: 'paragraph',
        question: 'สิ่งที่คุณได้จากการอบรมครั้งนี้',
        required: false,
      },
    ],
  },
};

// Certificate template (in production ดึงจาก cert.elements ของ activity)
export const MOCK_CERT_TEMPLATE = {
  name: 'ใบรับรองการอบรม AI Center YRU',
  signerName: 'ดร. สมชาย เจริญสุข',
  signerPosition: 'ผู้อำนวยการศูนย์ AI YRU',
  backgroundImage: '',
  signatureImage: '',
  elements: [
    {
      id: 'e1',
      kind: 'text',
      content: 'CERTIFICATE OF COMPLETION',
      x: 15, y: 12, width: 70, fontSize: 14, fontWeight: 'normal', color: '#9ca3af',
      textAlign: 'center', letterSpacing: 4,
      fontFamily: '"Playfair Display", serif',
    },
    {
      id: 'e2',
      kind: 'text',
      content: 'ใบรับรองการอบรม',
      x: 15, y: 20, width: 70, fontSize: 32, fontWeight: 'bold', color: '#ffffff',
      textAlign: 'center',
      fontFamily: '"Noto Serif Thai", serif',
    },
    {
      id: 'e3',
      kind: 'text',
      content: 'มอบให้กับ',
      x: 20, y: 36, width: 60, fontSize: 14, fontWeight: 'normal', color: '#d1d5db',
      textAlign: 'center',
      fontFamily: '"Sarabun", sans-serif',
    },
    {
      id: 'e4',
      kind: 'placeholder',
      field: 'participantName',
      x: 15, y: 44, width: 70, fontSize: 32, fontWeight: 'bold', color: '#ffffff',
      textAlign: 'center',
      fontFamily: '"Charmonman", cursive',
    },
    {
      id: 'e5',
      kind: 'text',
      content: 'เพื่อรับรองว่าได้ผ่านการอบรมหลักสูตร',
      x: 15, y: 62, width: 70, fontSize: 13, fontWeight: 'normal', color: '#d1d5db',
      textAlign: 'center',
      fontFamily: '"Sarabun", sans-serif',
    },
    {
      id: 'e6',
      kind: 'placeholder',
      field: 'courseTitle',
      x: 15, y: 68, width: 70, fontSize: 18, fontWeight: 'bold', color: '#f472b6',
      textAlign: 'center',
      fontFamily: '"Prompt", sans-serif',
    },
    {
      id: 'e7',
      kind: 'placeholder',
      field: 'issueDate',
      x: 20, y: 82, width: 25, fontSize: 11, fontWeight: 'normal', color: '#9ca3af',
      textAlign: 'left',
      fontFamily: '"Sarabun", sans-serif',
    },
    {
      id: 'e8',
      kind: 'placeholder',
      field: 'certificateId',
      x: 55, y: 82, width: 25, fontSize: 11, fontWeight: 'normal', color: '#9ca3af',
      textAlign: 'right',
      fontFamily: '"Sarabun", sans-serif',
    },
    {
      id: 'e9',
      kind: 'placeholder',
      field: 'signerName',
      x: 35, y: 88, width: 30, fontSize: 13, fontWeight: 'bold', color: '#ffffff',
      textAlign: 'center',
      fontFamily: '"Sarabun", sans-serif',
    },
    {
      id: 'e10',
      kind: 'placeholder',
      field: 'signerPosition',
      x: 30, y: 93, width: 40, fontSize: 10, fontWeight: 'normal', color: '#9ca3af',
      textAlign: 'center',
      fontFamily: '"Sarabun", sans-serif',
    },
  ],
};

// Normalize phone: strip non-digits, remove leading 66/+66, ensure 10 digits
export const normalizePhone = (raw) => {
  if (!raw) return '';
  let digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('66')) digits = '0' + digits.slice(2);
  return digits;
};

// Find registrant across all activities by phone (for portal-first flow, we scope by activityId)
export const findRegistrantByPhone = (activityId, phone) => {
  const normalized = normalizePhone(phone);
  const list = MOCK_REGISTRANTS[activityId] || [];
  return list.find((r) => normalizePhone(r.phone) === normalized) || null;
};

// Generate a stable cert ID for a given registrant+activity
export const generateCertId = (activityId, registrantId) => {
  const year = new Date().getFullYear() + 543; // Buddhist year
  const shortAct = activityId.slice(0, 4).toUpperCase();
  const shortReg = String(registrantId).replace(/\D/g, '').padStart(4, '0').slice(-4);
  return `CERT-${year}-${shortAct}-${shortReg}`;
};
