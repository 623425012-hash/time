import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  DatabaseSchema,
  User,
  EventCategory,
  SchoolEvent,
  ThaiHoliday,
  DutyRoster,
  StaffBirthday,
  DutyGroup,
  DutySchedule,
  Announcement,
  TelegramSettings,
  SystemSettings,
  NotificationLog,
  ActivityLog,
  UserPermission,
} from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const ALL_PERMISSIONS: UserPermission[] = [
  'events.view',
  'events.create',
  'events.edit',
  'events.delete',
  'events.approve',
  'holidays.manage',
  'duties.manage',
  'birthdays.manage',
  'announcements.manage',
  'users.view',
  'users.create',
  'users.edit',
  'users.delete',
  'settings.manage',
  'telegram.manage',
  'reports.view',
  'logs.view',
];

export const STAFF_PERMISSIONS: UserPermission[] = [
  'events.view',
  'events.create',
  'events.edit',
  'duties.manage',
  'birthdays.manage',
  'announcements.manage',
  'reports.view',
];

export const VIEWER_PERMISSIONS: UserPermission[] = [
  'events.view',
  'reports.view',
];

function getInitialDatabase(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('admin123', salt);
  const staffPasswordHash = bcrypt.hashSync('staff123', salt);
  const viewerPasswordHash = bcrypt.hashSync('viewer123', salt);

  const initialUsers: User[] = [
    {
      id: 'usr-admin-1',
      name: 'สมศักดิ์',
      surname: 'ใจดี (ผู้ดูแลระบบ)',
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      department: 'กลุ่มบริหารทั่วไป / เทคโนโลยี',
      position: 'ผู้อำนวยการฝ่ายเทคโนโลยีสารสนเทศ',
      role: 'ADMIN',
      permissions: ALL_PERMISSIONS,
      status: 'ACTIVE',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'usr-staff-1',
      name: 'นภาพร',
      surname: 'สุขเกษม',
      username: 'staff',
      email: 'staff@example.com',
      passwordHash: staffPasswordHash,
      department: 'กลุ่มบริหารงานวิชาการ',
      position: 'ครูชำนาญการพิเศษ / หัวหน้ากลุ่มวิชาการ',
      role: 'STAFF',
      permissions: STAFF_PERMISSIONS,
      status: 'ACTIVE',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'usr-viewer-1',
      name: 'วิชัย',
      surname: 'พัฒนาศิริ',
      username: 'viewer',
      email: 'viewer@example.com',
      passwordHash: viewerPasswordHash,
      department: 'สมาคมผู้ปกครองและครู',
      position: 'ผู้แทนผู้ปกครอง',
      role: 'VIEWER',
      permissions: VIEWER_PERMISSIONS,
      status: 'ACTIVE',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
  ];

  const initialCategories: EventCategory[] = [
    { id: 'cat-general', name: 'กิจกรรมทั่วไป', color: '#2563eb', textColor: '#ffffff', icon: 'Calendar', isSystem: true },
    { id: 'cat-academic', name: 'การเรียนการสอน', color: '#16a34a', textColor: '#ffffff', icon: 'BookOpen', isSystem: true },
    { id: 'cat-meeting', name: 'การประชุม', color: '#ea580c', textColor: '#ffffff', icon: 'Users', isSystem: true },
    { id: 'cat-training', name: 'การอบรม/สัมมนา', color: '#9333ea', textColor: '#ffffff', icon: 'GraduationCap', isSystem: true },
    { id: 'cat-important', name: 'กิจกรรมสำคัญ', color: '#dc2626', textColor: '#ffffff', icon: 'AlertCircle', isSystem: true },
    { id: 'cat-special-day', name: 'วันสำคัญ', color: '#ca8a04', textColor: '#ffffff', icon: 'Star', isSystem: true },
    { id: 'cat-holiday', name: 'วันหยุดราชการ', color: '#475569', textColor: '#ffffff', icon: 'SunMedium', isSystem: true },
  ];

  const initialHolidays: ThaiHoliday[] = [
    // 2025 Holidays
    { id: 'h-2025-1', date: '2025-01-01', name: 'วันขึ้นปีใหม่', type: 'HOLIDAY', year: 2025, description: 'วันหยุดราชการประจำปี', color: '#475569' },
    { id: 'h-2025-2', date: '2025-01-16', name: 'วันครูแห่งชาติ', type: 'SCHOOL_DAY', year: 2025, description: 'วันสำคัญของสถานศึกษาและครูอาจารย์', color: '#2563eb' },
    { id: 'h-2025-3', date: '2025-02-12', name: 'วันมาฆบูชา', type: 'HOLIDAY', year: 2025, description: 'วันสำคัญทางพระพุทธศาสนา', color: '#ca8a04' },
    { id: 'h-2025-4', date: '2025-04-06', name: 'วันจักรี (ชดเชย 7 เม.ย.)', type: 'HOLIDAY', year: 2025, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-2025-5', date: '2025-04-13', name: 'วันสงกรานต์', type: 'HOLIDAY', year: 2025, description: 'วันขึ้นปีใหม่ไทย', color: '#475569' },
    { id: 'h-2025-6', date: '2025-04-14', name: 'วันสงกรานต์ (วันครอบครัว)', type: 'HOLIDAY', year: 2025, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-2025-7', date: '2025-04-15', name: 'วันสงกรานต์ (วันผู้สูงอายุ)', type: 'HOLIDAY', year: 2025, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-2025-8', date: '2025-05-01', name: 'วันแรงงานแห่งชาติ', type: 'HOLIDAY', year: 2025, description: 'วันหยุดราชการ/ประเพณี', color: '#475569' },
    { id: 'h-2025-9', date: '2025-05-05', name: 'วันฉัตรมงคล (ชดเชย)', type: 'HOLIDAY', year: 2025, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-2025-10', date: '2025-05-11', name: 'วันวิสาขบูชา', type: 'HOLIDAY', year: 2025, description: 'วันสำคัญสากลทางพระพุทธศาสนา', color: '#ca8a04' },
    { id: 'h-2025-11', date: '2025-06-03', name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี', type: 'HOLIDAY', year: 2025, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-2025-12', date: '2025-07-10', name: 'วันอาสาฬหบูชา', type: 'HOLIDAY', year: 2025, description: 'วันสำคัญทางพุทธศาสนา', color: '#ca8a04' },
    { id: 'h-2025-13', date: '2025-07-11', name: 'วันเข้าพรรษา', type: 'HOLIDAY', year: 2025, description: 'วันหยุดราชการ', color: '#ca8a04' },
    { id: 'h-2025-14', date: '2025-07-28', name: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว', type: 'HOLIDAY', year: 2025, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-2025-15', date: '2025-08-12', name: 'วันแม่แห่งชาติ / วันเฉลิมพระชนมพรรษาพระบรมราชชนนีพันปีหลวง', type: 'HOLIDAY', year: 2025, description: 'วันแม่แห่งชาติและวันหยุดราชการ', color: '#475569' },
    { id: 'h-2025-16', date: '2025-08-18', name: 'วันวิทยาศาสตร์แห่งชาติ', type: 'IMPORTANT_DAY', year: 2025, description: 'จัดกิจกรรมสัปดาห์วิทยาศาสตร์', color: '#2563eb' },
    { id: 'h-2025-17', date: '2025-10-13', name: 'วันนวมินทรมหาราช', type: 'HOLIDAY', year: 2025, description: 'วันคล้ายวันสวรรคตรัชกาลที่ 9', color: '#475569' },
    { id: 'h-2025-18', date: '2025-10-23', name: 'วันปิยมหาราช', type: 'HOLIDAY', year: 2025, description: 'วันคล้ายวันสวรรคตพระบาทสมเด็จพระจุลจอมเกล้าเจ้าอยู่หัว', color: '#475569' },
    { id: 'h-2025-19', date: '2025-12-05', name: 'วันพ่อแห่งชาติ / วันชาติ', type: 'HOLIDAY', year: 2025, description: 'วันคล้ายวันพระบรมราชสมภพรัชกาลที่ 9', color: '#475569' },
    { id: 'h-2025-20', date: '2025-12-10', name: 'วันรัฐธรรมนูญ', type: 'HOLIDAY', year: 2025, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-2025-21', date: '2025-12-31', name: 'วันสิ้นปี', type: 'HOLIDAY', year: 2025, description: 'วันหยุดราชการส่งท้ายปีเก่า', color: '#475569' },

    // 2026 Holidays
    { id: 'h-1', date: '2026-01-01', name: 'วันขึ้นปีใหม่', type: 'HOLIDAY', year: 2026, description: 'วันหยุดราชการประจำปี', color: '#475569' },
    { id: 'h-2', date: '2026-01-16', name: 'วันครูแห่งชาติ', type: 'SCHOOL_DAY', year: 2026, description: 'วันสำคัญของสถานศึกษาและครูอาจารย์', color: '#2563eb' },
    { id: 'h-3', date: '2026-03-03', name: 'วันมาฆบูชา', type: 'HOLIDAY', year: 2026, description: 'วันสำคัญทางพระพุทธศาสนา', color: '#ca8a04' },
    { id: 'h-4', date: '2026-04-06', name: 'วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราช (วันจักรี)', type: 'HOLIDAY', year: 2026, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-5', date: '2026-04-13', name: 'วันสงกรานต์', type: 'HOLIDAY', year: 2026, description: 'วันขึ้นปีใหม่ไทย', color: '#475569' },
    { id: 'h-6', date: '2026-04-14', name: 'วันสงกรานต์ (วันครอบครัว)', type: 'HOLIDAY', year: 2026, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-7', date: '2026-04-15', name: 'วันสงกรานต์', type: 'HOLIDAY', year: 2026, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-8', date: '2026-05-01', name: 'วันแรงงานแห่งชาติ', type: 'HOLIDAY', year: 2026, description: 'วันหยุดราชการ/ประเพณี', color: '#475569' },
    { id: 'h-9', date: '2026-05-04', name: 'วันฉัตรมงคล', type: 'HOLIDAY', year: 2026, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-10', date: '2026-05-31', name: 'วันวิสาขบูชา', type: 'HOLIDAY', year: 2026, description: 'วันสำคัญสากลทางพระพุทธศาสนา', color: '#ca8a04' },
    { id: 'h-11', date: '2026-06-03', name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี', type: 'HOLIDAY', year: 2026, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-12', date: '2026-07-28', name: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว', type: 'HOLIDAY', year: 2026, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-13', date: '2026-07-29', name: 'วันอาสาฬหบูชา', type: 'HOLIDAY', year: 2026, description: 'วันสำคัญทางพุทธศาสนา', color: '#ca8a04' },
    { id: 'h-14', date: '2026-07-30', name: 'วันเข้าพรรษา', type: 'HOLIDAY', year: 2026, description: 'วันหยุดราชการ', color: '#ca8a04' },
    { id: 'h-15', date: '2026-08-12', name: 'วันแม่แห่งชาติ / วันเฉลิมพระชนมพรรษาพระบรมราชชนนีพันปีหลวง', type: 'HOLIDAY', year: 2026, description: 'วันแม่แห่งชาติและวันหยุดราชการ', color: '#475569' },
    { id: 'h-16', date: '2026-08-18', name: 'วันวิทยาศาสตร์แห่งชาติ', type: 'IMPORTANT_DAY', year: 2026, description: 'จัดกิจกรรมสัปดาห์วิทยาศาสตร์และนิทรรศการโครงงาน', color: '#2563eb' },
    { id: 'h-17', date: '2026-10-13', name: 'วันนวมินทรมหาราช', type: 'HOLIDAY', year: 2026, description: 'วันคล้ายวันสวรรคตรัชกาลที่ 9', color: '#475569' },
    { id: 'h-18', date: '2026-10-23', name: 'วันปิยมหาราช', type: 'HOLIDAY', year: 2026, description: 'วันคล้ายวันสวรรคตพระบาทสมเด็จพระจุลจอมเกล้าเจ้าอยู่หัว', color: '#475569' },
    { id: 'h-19', date: '2026-12-05', name: 'วันพ่อแห่งชาติ / วันชาติ', type: 'HOLIDAY', year: 2026, description: 'วันคล้ายวันพระบรมราชสมภพรัชกาลที่ 9', color: '#475569' },
    { id: 'h-20', date: '2026-12-10', name: 'วันรัฐธรรมนูญ', type: 'HOLIDAY', year: 2026, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-21', date: '2026-12-31', name: 'วันสิ้นปี', type: 'HOLIDAY', year: 2026, description: 'วันหยุดราชการส่งท้ายปีเก่า', color: '#475569' },

    // 2027 Holidays
    { id: 'h-2027-1', date: '2027-01-01', name: 'วันขึ้นปีใหม่', type: 'HOLIDAY', year: 2027, description: 'วันหยุดราชการประจำปี', color: '#475569' },
    { id: 'h-2027-2', date: '2027-01-16', name: 'วันครูแห่งชาติ', type: 'SCHOOL_DAY', year: 2027, description: 'วันสำคัญของสถานศึกษาและครูอาจารย์', color: '#2563eb' },
    { id: 'h-2027-3', date: '2027-02-21', name: 'วันมาฆบูชา', type: 'HOLIDAY', year: 2027, description: 'วันสำคัญทางพระพุทธศาสนา', color: '#ca8a04' },
    { id: 'h-2027-4', date: '2027-04-06', name: 'วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราช (วันจักรี)', type: 'HOLIDAY', year: 2027, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-2027-5', date: '2027-04-13', name: 'วันสงกรานต์', type: 'HOLIDAY', year: 2027, description: 'วันขึ้นปีใหม่ไทย', color: '#475569' },
    { id: 'h-2027-6', date: '2027-04-14', name: 'วันสงกรานต์ (วันครอบครัว)', type: 'HOLIDAY', year: 2027, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-2027-7', date: '2027-04-15', name: 'วันสงกรานต์', type: 'HOLIDAY', year: 2027, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-2027-8', date: '2027-05-01', name: 'วันแรงงานแห่งชาติ', type: 'HOLIDAY', year: 2027, description: 'วันหยุดราชการ/ประเพณี', color: '#475569' },
    { id: 'h-2027-9', date: '2027-05-04', name: 'วันฉัตรมงคล', type: 'HOLIDAY', year: 2027, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-2027-10', date: '2027-05-20', name: 'วันวิสาขบูชา', type: 'HOLIDAY', year: 2027, description: 'วันสำคัญสากลทางพระพุทธศาสนา', color: '#ca8a04' },
    { id: 'h-2027-11', date: '2027-06-03', name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี', type: 'HOLIDAY', year: 2027, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-2027-12', date: '2027-07-18', name: 'วันอาสาฬหบูชา', type: 'HOLIDAY', year: 2027, description: 'วันสำคัญทางพุทธศาสนา', color: '#ca8a04' },
    { id: 'h-2027-13', date: '2027-07-19', name: 'วันเข้าพรรษา', type: 'HOLIDAY', year: 2027, description: 'วันหยุดราชการ', color: '#ca8a04' },
    { id: 'h-2027-14', date: '2027-07-28', name: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว', type: 'HOLIDAY', year: 2027, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-2027-15', date: '2027-08-12', name: 'วันแม่แห่งชาติ / วันเฉลิมพระชนมพรรษาพระบรมราชชนนีพันปีหลวง', type: 'HOLIDAY', year: 2027, description: 'วันแม่แห่งชาติและวันหยุดราชการ', color: '#475569' },
    { id: 'h-2027-16', date: '2027-08-18', name: 'วันวิทยาศาสตร์แห่งชาติ', type: 'IMPORTANT_DAY', year: 2027, description: 'จัดกิจกรรมสัปดาห์วิทยาศาสตร์', color: '#2563eb' },
    { id: 'h-2027-17', date: '2027-10-13', name: 'วันนวมินทรมหาราช', type: 'HOLIDAY', year: 2027, description: 'วันคล้ายวันสวรรคตรัชกาลที่ 9', color: '#475569' },
    { id: 'h-2027-18', date: '2027-10-23', name: 'วันปิยมหาราช', type: 'HOLIDAY', year: 2027, description: 'วันคล้ายวันสวรรคตพระบาทสมเด็จพระจุลจอมเกล้าเจ้าอยู่หัว', color: '#475569' },
    { id: 'h-2027-19', date: '2027-12-05', name: 'วันพ่อแห่งชาติ / วันชาติ', type: 'HOLIDAY', year: 2027, description: 'วันคล้ายวันพระบรมราชสมภพรัชกาลที่ 9', color: '#475569' },
    { id: 'h-2027-20', date: '2027-12-10', name: 'วันรัฐธรรมนูญ', type: 'HOLIDAY', year: 2027, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-2027-21', date: '2027-12-31', name: 'วันสิ้นปี', type: 'HOLIDAY', year: 2027, description: 'วันหยุดราชการส่งท้ายปีเก่า', color: '#475569' },
  ];

  const initialEvents: SchoolEvent[] = [
    {
      id: 'evt-1',
      title: 'ประชุมคณะกรรมการบริหารสถานศึกษาประจำเดือนสิงหาคม',
      categoryId: 'cat-meeting',
      startDate: '2026-08-15',
      endDate: '2026-08-15',
      startTime: '09:00',
      endTime: '12:00',
      isAllDay: false,
      location: 'ห้องประชุมเฉลิมพระเกียรติ อาคาร 1 ชั้น 3',
      description: 'ประชุมวางแผนการจัดงานสัปดาห์วิทยาศาสตร์ การประเมินผลกลางภาคเรียนที่ 1 และรายงานผลการเบิกจ่ายงบประมาณ',
      coordinator: 'ดร.สมศักดิ์ ใจดี',
      department: 'กลุ่มบริหารงานทั่วไป',
      targetGroup: 'คณะผู้บริหาร และหัวหน้ากลุ่มสาระฯ ทุกกลุ่ม',
      priority: 'URGENT',
      status: 'APPROVED',
      attachments: [],
      recurrence: 'NONE',
      notifySchedule: ['IMMEDIATE', '1_DAY_BEFORE', '1_HOUR_BEFORE'],
      sendTelegram: true,
      createdBy: 'usr-admin-1',
      createdByName: 'สมศักดิ์ ใจดี',
      createdAt: '2026-08-10T08:30:00.000Z',
      updatedAt: '2026-08-10T08:30:00.000Z',
    },
    {
      id: 'evt-2',
      title: 'กิจกรรมตรวจสุขภาพและสุขอนามัยนักเรียนประจำปี',
      categoryId: 'cat-important',
      startDate: '2026-08-15',
      endDate: '2026-08-15',
      startTime: '13:00',
      endTime: '16:00',
      isAllDay: false,
      location: 'หอประชุมใหญ่ (อาคารกิจกรรม)',
      description: 'ตรวจสุขภาพสายตา ทันตกรรม และชั่งน้ำหนักวัดส่วนสูงโดยทีมแพทย์โรงพยาบาลส่งเสริมสุขภาพตำบล',
      coordinator: 'ครูณัฐฐา ประเสริฐ',
      department: 'งานอนามัยโรงเรียน',
      targetGroup: 'นักเรียนชั้นมัธยมศึกษาปีที่ 1 - 6',
      priority: 'IMPORTANT',
      status: 'APPROVED',
      attachments: [],
      recurrence: 'NONE',
      notifySchedule: ['1_DAY_BEFORE', '1_HOUR_BEFORE'],
      sendTelegram: true,
      createdBy: 'usr-staff-1',
      createdByName: 'นภาพร สุขเกษม',
      createdAt: '2026-08-11T09:00:00.000Z',
      updatedAt: '2026-08-11T09:00:00.000Z',
    },
    {
      id: 'evt-3',
      title: 'อบรมเชิงปฏิบัติการ: การใช้ระบบปฏิทินและเทคโนโลยี AI เพื่อการสอน',
      categoryId: 'cat-training',
      startDate: '2026-08-16',
      endDate: '2026-08-16',
      startTime: '08:30',
      endTime: '16:30',
      isAllDay: false,
      location: 'ห้องปฏิบัติการคอมพิวเตอร์ 1 อาคาร 3',
      description: 'อบรมพัฒนาทักษะดิจิทัลสำหรับครูผู้สอนเพื่อประยุกต์ใช้ในการจัดตารางสอนและการสื่อสารกับผู้ปกครอง',
      coordinator: 'ครูพงษ์ศักดิ์ ศรีวิชัย',
      department: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
      targetGroup: 'คณะครูและบุคลากรทางการศึกษาทุกท่าน',
      priority: 'IMPORTANT',
      status: 'APPROVED',
      attachments: [],
      recurrence: 'NONE',
      notifySchedule: ['3_DAYS_BEFORE', '1_DAY_BEFORE', '1_HOUR_BEFORE'],
      sendTelegram: true,
      createdBy: 'usr-staff-1',
      createdByName: 'นภาพร สุขเกษม',
      createdAt: '2026-08-12T10:00:00.000Z',
      updatedAt: '2026-08-12T10:00:00.000Z',
    },
    {
      id: 'evt-4',
      title: 'นิทรรศการสัปดาห์วันวิทยาศาสตร์แห่งชาติ ประจำปีการศึกษา 2569',
      categoryId: 'cat-academic',
      startDate: '2026-08-18',
      endDate: '2026-08-19',
      startTime: '08:30',
      endTime: '15:30',
      isAllDay: false,
      location: 'โดมอเนกประสงค์ และลานกิจกรรมหน้าอาคาร 2',
      description: 'การประกวดโครงงานวิทยาศาสตร์ แข่งขันหุ่นยนต์ นิทรรศการดาราศาสตร์ และตอบปัญหาวิทยาศาสตร์ชิงทุนการศึกษา',
      coordinator: 'ครูวิเชียร มั่งมี',
      department: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
      targetGroup: 'นักเรียนทุกระดับชั้น และผู้ปกครองที่สนใจ',
      priority: 'IMPORTANT',
      status: 'APPROVED',
      attachments: [],
      recurrence: 'NONE',
      notifySchedule: ['3_DAYS_BEFORE', '1_DAY_BEFORE', 'ON_START'],
      sendTelegram: true,
      createdBy: 'usr-staff-1',
      createdByName: 'นภาพร สุขเกษม',
      createdAt: '2026-08-05T08:00:00.000Z',
      updatedAt: '2026-08-05T08:00:00.000Z',
    },
    {
      id: 'evt-5',
      title: 'การสอบวัดผลกลางภาคเรียนที่ 1 ประจำปีการศึกษา 2569',
      categoryId: 'cat-academic',
      startDate: '2026-08-24',
      endDate: '2026-08-28',
      startTime: '08:30',
      endTime: '15:00',
      isAllDay: false,
      location: 'อาคารเรียน 1, 2, 3',
      description: 'การทดสอบวัดผลการเรียนรู้กลางภาคเรียนที่ 1 ทุกกลุ่มสาระการเรียนรู้',
      coordinator: 'นางนภาพร สุขเกษม',
      department: 'กลุ่มบริหารงานวิชาการ',
      targetGroup: 'นักเรียนทุกระดับชั้น',
      priority: 'URGENT',
      status: 'APPROVED',
      attachments: [],
      recurrence: 'NONE',
      notifySchedule: ['3_DAYS_BEFORE', '1_DAY_BEFORE'],
      sendTelegram: true,
      createdBy: 'usr-admin-1',
      createdByName: 'สมศักดิ์ ใจดี',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'evt-6',
      title: 'กิจกรรมแนะแนวการศึกษาต่อระดับอุดมศึกษา (Open House เตรียมพร้อม TCAS)',
      categoryId: 'cat-general',
      startDate: '2026-08-20',
      endDate: '2026-08-20',
      startTime: '10:00',
      endTime: '15:00',
      isAllDay: false,
      location: 'หอประชุมใหญ่',
      description: 'การบรรยายพิเศษจากวิทยากรตัวแทนมหาวิทยาลัยชั้นนำและศิษย์เก่า',
      coordinator: 'ครูศศิธร บุญญา',
      department: 'งานแนะแนวการศึกษา',
      targetGroup: 'นักเรียนชั้นมัธยมศึกษาปีที่ 5 และ 6',
      priority: 'NORMAL',
      status: 'PENDING',
      attachments: [],
      recurrence: 'NONE',
      notifySchedule: ['1_DAY_BEFORE'],
      sendTelegram: true,
      createdBy: 'usr-staff-1',
      createdByName: 'นภาพร สุขเกษม',
      createdAt: '2026-08-14T11:00:00.000Z',
      updatedAt: '2026-08-14T11:00:00.000Z',
    },
    {
      id: 'evt-7',
      title: 'การแข่งขันกีฬาภายในโรงเรียน (กีฬาสีประจำปี 2569)',
      categoryId: 'cat-important',
      startDate: '2026-09-08',
      endDate: '2026-09-11',
      startTime: '08:00',
      endTime: '17:00',
      isAllDay: true,
      location: 'สนามฟุตบอลและโรงยิมเนเซียม',
      description: 'ขบวนพาเหรด การประกวดกองเชียร์และผู้นำเชียร์ พร้อมการแข่งขันกีฬา 8 ชนิดกีฬา',
      coordinator: 'ครูชูเกียรติ กลิ่นแก้ว',
      department: 'กลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา',
      targetGroup: 'คณะครู บุคลากร และนักเรียนทุกคณะสี',
      priority: 'IMPORTANT',
      status: 'APPROVED',
      attachments: [],
      recurrence: 'NONE',
      notifySchedule: ['3_DAYS_BEFORE', '1_DAY_BEFORE'],
      sendTelegram: true,
      createdBy: 'usr-admin-1',
      createdByName: 'สมศักดิ์ ใจดี',
      createdAt: '2026-08-02T14:00:00.000Z',
      updatedAt: '2026-08-02T14:00:00.000Z',
    },
    {
      id: 'evt-8',
      title: 'ประชุมผู้ปกครองชั้นเรียน (Classroom Meeting ภาคเรียนที่ 1)',
      categoryId: 'cat-meeting',
      startDate: '2026-08-30',
      endDate: '2026-08-30',
      startTime: '09:00',
      endTime: '12:00',
      isAllDay: false,
      location: 'ห้องเรียนประจำชั้นทุกห้อง',
      description: 'พบปะครูที่ปรึกษาเพื่อรับฟังรายงานผลการเรียน พฤติกรรม และมอบทุนการศึกษา',
      coordinator: 'ครูอำนวย ชนะกิจ',
      department: 'กลุ่มบริหารกิจการนักเรียน',
      targetGroup: 'ผู้ปกครองและครูที่ปรึกษาทุกระดับชั้น',
      priority: 'IMPORTANT',
      status: 'APPROVED',
      attachments: [],
      recurrence: 'NONE',
      notifySchedule: ['3_DAYS_BEFORE', '1_DAY_BEFORE', '1_HOUR_BEFORE'],
      sendTelegram: true,
      createdBy: 'usr-staff-1',
      createdByName: 'นภาพร สุขเกษม',
      createdAt: '2026-08-08T09:30:00.000Z',
      updatedAt: '2026-08-08T09:30:00.000Z',
    }
  ];

  const initialDutyGroups: DutyGroup[] = [
    {
      id: 'group-1',
      name: 'ชุดเวรที่ 1',
      code: 'GROUP-1',
      color: '#2563eb',
      description: 'ดูแลความสงบเรียบร้อย ต้อนรับนักเรียนประตูหลัก และตรวจตราอาคารเรียน 1-2',
      responsibilities: [
        'ดูแลความเรียบร้อยและความปลอดภัยบริเวณโรงเรียน',
        'ต้อนรับและดูแลความปลอดภัยนักเรียนบริเวณประตูโรงเรียน (06:45 - 08:15 น.)',
        'ตรวจสอบพื้นที่และอาคารเรียน 1-2',
        'ดูแลความเรียบร้อยโรงอาหารช่วงพักกลางวัน',
        'ปฏิบัติหน้าที่ตามที่ได้รับมอบหมายจากสถานศึกษา',
      ],
      members: [
        { id: 'm-1-1', name: 'นายสมศักดิ์ ใจดี', roleInGroup: 'LEADER', position: 'ผู้อำนวยการฝ่ายเทคโนโลยี', department: 'กลุ่มบริหารทั่วไป', phone: '081-999-8888' },
        { id: 'm-1-2', name: 'นางนภาพร สุขเกษม', roleInGroup: 'MEMBER', position: 'ครูชำนาญการพิเศษ', department: 'กลุ่มสาระภาษาไทย', phone: '082-111-2233' },
        { id: 'm-1-3', name: 'นายวิชัย พัฒนาศิริ', roleInGroup: 'MEMBER', position: 'ผู้แทนผู้ปกครอง', department: 'สมาคมผู้ปกครองและครู', phone: '083-444-5566' },
        { id: 'm-1-4', name: 'นางสาวศศิวรรณ กาญณา', roleInGroup: 'MEMBER', position: 'ครูผู้ช่วย', department: 'กลุ่มสาระคณิตศาสตร์', phone: '084-555-6677' },
      ],
      createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'group-2',
      name: 'ชุดเวรที่ 2',
      code: 'GROUP-2',
      color: '#7c3aed',
      description: 'ดูแลประตู 2 ทางเข้าด้านหลัง และโรงยิมเนเซียม',
      responsibilities: [
        'ดูแลความเรียบร้อยและความปลอดภัยบริเวณโรงเรียน',
        'ต้อนรับนักเรียนประตู 2 (ประตูหลังโรงเรียน)',
        'ตรวจสอบพื้นที่อาคาร 3 และโรงยิมเนเซียม',
        'ดูแลความเรียบร้อยโรงอาหารช่วงพักกลางวัน',
        'ปฏิบัติหน้าที่ตามที่ได้รับมอบหมาย',
      ],
      members: [
        { id: 'm-2-1', name: 'นายพงษ์ศักดิ์ ศรีวิชัย', roleInGroup: 'LEADER', position: 'หัวหน้ากลุ่มงานอาชีพ', department: 'กลุ่มสาระการงานอาชีพ', phone: '089-876-5432' },
        { id: 'm-2-2', name: 'นางนิภาวรรณ มั่นคง', roleInGroup: 'MEMBER', position: 'พยาบาลวิชาชีพ', department: 'งานอนามัยโรงเรียน', phone: '086-555-1234' },
        { id: 'm-2-3', name: 'นายธีรพล ยอดเยี่ยม', roleInGroup: 'MEMBER', position: 'ครู ค.ศ. 2', department: 'กลุ่มสาระคณิตศาสตร์', phone: '084-321-9876' },
        { id: 'm-2-4', name: 'นางสาวปัทมา คุ้มศรี', roleInGroup: 'MEMBER', position: 'ครูผู้สอน', department: 'กลุ่มสาระวิทยาศาสตร์', phone: '085-666-7788' },
      ],
      createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'group-3',
      name: 'ชุดเวรที่ 3',
      code: 'GROUP-3',
      color: '#059669',
      description: 'ดูแลความเรียบร้อยลานอเนกประสงค์ และหอประชุม',
      responsibilities: [
        'ดูแลความเรียบร้อยและความปลอดภัยบริเวณโรงเรียน',
        'ดูแลแถวนักเรียนช่วงเข้าแถวเคารพธงชาติ',
        'ตรวจสอบพื้นที่หอประชุมและลานกิจกรรม',
        'ดูแลการเดินทางกลับของนักเรียนช่วงเย็น',
        'ปฏิบัติหน้าที่ตามที่ได้รับมอบหมาย',
      ],
      members: [
        { id: 'm-3-1', name: 'นางสาวศศิธร บุญญา', roleInGroup: 'LEADER', position: 'หัวหน้างานแนะแนว', department: 'งานแนะแนวการศึกษา', phone: '086-777-8899' },
        { id: 'm-3-2', name: 'นายชูเกียรติ กลิ่นแก้ว', roleInGroup: 'MEMBER', position: 'ครูผู้สอน', department: 'กลุ่มสาระสุขศึกษาและพลศึกษา', phone: '087-888-9900' },
        { id: 'm-3-3', name: 'นายอำนวย ชนะกิจ', roleInGroup: 'MEMBER', position: 'รองหัวหน้าฝ่ายกิจการนักเรียน', department: 'กลุ่มบริหารกิจการนักเรียน', phone: '088-999-0011' },
        { id: 'm-3-4', name: 'นางสาวอังคณา จันธิมา', roleInGroup: 'MEMBER', position: 'ครู ค.ศ. 1', department: 'กลุ่มสาระภาษาต่างประเทศ', phone: '089-000-1122' },
      ],
      createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'group-4',
      name: 'ชุดเวรที่ 4',
      code: 'GROUP-4',
      color: '#ea580c',
      description: 'ดูแลบริเวณสนามฟุตบอล อาคาร 4 และลานจอดรถ',
      responsibilities: [
        'ดูแลความเรียบร้อยและความปลอดภัยบริเวณโรงเรียน',
        'จัดการจราจรและลานจอดรถผู้ปกครอง',
        'ตรวจสอบอาคาร 4 และห้องปฏิบัติการศิลปะ',
        'ดูแลความสะอาดรอบบริเวณสนามกีฬา',
        'ปฏิบัติหน้าที่ตามที่ได้รับมอบหมาย',
      ],
      members: [
        { id: 'm-4-1', name: 'นางปิยะวรรณ แสงอรุณ', roleInGroup: 'LEADER', position: 'ครูชำนาญการพิเศษ', department: 'กลุ่มสาระสังคมศึกษา', phone: '081-333-4455' },
        { id: 'm-4-2', name: 'นายมนัส เจริญสุข', roleInGroup: 'MEMBER', position: 'ครู ค.ศ. 2', department: 'กลุ่มสาระวิทยาศาสตร์', phone: '082-444-5566' },
        { id: 'm-4-3', name: 'นางรัตนา ศรีสุวรรณ', roleInGroup: 'MEMBER', position: 'ครูผู้สอน', department: 'กลุ่มสาระศิลปะ', phone: '083-555-6677' },
        { id: 'm-4-4', name: 'นายธนาคาร สุขสวัสดิ์', roleInGroup: 'MEMBER', position: 'เจ้าหน้าที่โสตฯ', department: 'งานเทคโนโลยีการศึกษา', phone: '084-666-7788' },
      ],
      createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'group-5',
      name: 'ชุดเวรที่ 5',
      code: 'GROUP-5',
      color: '#0284c7',
      description: 'ดูแลอาคารอำนวยการ ห้องสมุด และเรือนพยาบาล',
      responsibilities: [
        'ดูแลความเรียบร้อยและความปลอดภัยบริเวณโรงเรียน',
        'ต้อนรับแขกผู้มาติดต่อราชการที่อาคารอำนวยการ',
        'ตรวจสอบความเรียบร้อยห้องสมุดและห้องเรียนสารบรรณ',
        'ดูแลนักเรียนที่มีอาการเจ็บป่วย',
        'ปฏิบัติหน้าที่ตามที่ได้รับมอบหมาย',
      ],
      members: [
        { id: 'm-5-1', name: 'นายธวัชชัย รัตนตรัย', roleInGroup: 'LEADER', position: 'หัวหน้างานการเงิน', department: 'กลุ่มบริหารงบประมาณ', phone: '085-777-8899' },
        { id: 'm-5-2', name: 'นางพิมพ์ใจ สดใส', roleInGroup: 'MEMBER', position: 'เจ้าหน้าที่ทะเบียน', department: 'งานทะเบียนและวัดผล', phone: '086-888-9900' },
        { id: 'm-5-3', name: 'นายสุรชัย เกรียงไกร', roleInGroup: 'MEMBER', position: 'เจ้าหน้าที่ธุรการ', department: 'งานสารบรรณ', phone: '087-999-0011' },
        { id: 'm-5-4', name: 'นางกานดา ชัยชนะ', roleInGroup: 'MEMBER', position: 'ครู ค.ศ. 1', department: 'กลุ่มสาระภาษาไทย', phone: '088-000-1122' },
      ],
      createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'group-6',
      name: 'ชุดเวรที่ 6',
      code: 'GROUP-6',
      color: '#e11d48',
      description: 'ดูแลอาคารวิทยาศาสตร์ ห้องปฏิบัติการคอมพิวเตอร์ และสวนพฤกษศาสตร์',
      responsibilities: [
        'ดูแลความเรียบร้อยและความปลอดภัยบริเวณโรงเรียน',
        'ตรวจเช็กการปิด-เปิดห้องปฏิบัติการพิเศษ',
        'ตรวจสอบความปลอดภัยบริเวณสวนพฤกษศาสตร์โรงเรียน',
        'ตรวจตราความเรียบร้อยรอบรั้วโรงเรียน',
        'ปฏิบัติหน้าที่ตามที่ได้รับมอบหมาย',
      ],
      members: [
        { id: 'm-6-1', name: 'นางสาวณัฐฐา ประเสริฐ', roleInGroup: 'LEADER', position: 'ครูชำนาญการ', department: 'กลุ่มสาระภาษาไทย', phone: '081-234-5678' },
        { id: 'm-6-2', name: 'นายวิเชียร มั่งมี', roleInGroup: 'MEMBER', position: 'หัวหน้างานประกันคุณภาพ', department: 'ฝ่ายบริหารวิชาการ', phone: '082-345-6789' },
        { id: 'm-6-3', name: 'นางสาวพนิดา พิทักษ์ธรรม', roleInGroup: 'MEMBER', position: 'ครูผู้สอน', department: 'งานกิจกรรมพัฒนาผู้เรียน', phone: '083-456-7890' },
        { id: 'm-6-4', name: 'นายกิตติศักดิ์ ชัยเจริญ', roleInGroup: 'MEMBER', position: 'พนักงานขับรถ', department: 'งานยานพาหนะ', phone: '084-567-8901' },
      ],
      createdAt: '2026-08-01T00:00:00.000Z',
    },
  ];

  const initialDutySchedules: DutySchedule[] = [
    { id: 'sched-1', date: '2026-08-15', groupId: 'group-1', groupName: 'ชุดเวรที่ 1', groupColor: '#2563eb', status: 'PENDING', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sched-2', date: '2026-08-16', groupId: 'group-2', groupName: 'ชุดเวรที่ 2', groupColor: '#7c3aed', status: 'PENDING', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sched-3', date: '2026-08-17', groupId: 'group-3', groupName: 'ชุดเวรที่ 3', groupColor: '#059669', status: 'PENDING', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sched-4', date: '2026-08-18', groupId: 'group-4', groupName: 'ชุดเวรที่ 4', groupColor: '#ea580c', status: 'PENDING', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sched-5', date: '2026-08-19', groupId: 'group-5', groupName: 'ชุดเวรที่ 5', groupColor: '#0284c7', status: 'PENDING', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sched-6', date: '2026-08-20', groupId: 'group-6', groupName: 'ชุดเวรที่ 6', groupColor: '#e11d48', status: 'PENDING', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sched-7', date: '2026-08-21', groupId: 'group-1', groupName: 'ชุดเวรที่ 1', groupColor: '#2563eb', status: 'PENDING', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sched-8', date: '2026-08-24', groupId: 'group-2', groupName: 'ชุดเวรที่ 2', groupColor: '#7c3aed', status: 'PENDING', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sched-9', date: '2026-08-25', groupId: 'group-3', groupName: 'ชุดเวรที่ 3', groupColor: '#059669', status: 'PENDING', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sched-10', date: '2026-08-26', groupId: 'group-4', groupName: 'ชุดเวรที่ 4', groupColor: '#ea580c', status: 'PENDING', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sched-11', date: '2026-08-27', groupId: 'group-5', groupName: 'ชุดเวรที่ 5', groupColor: '#0284c7', status: 'PENDING', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sched-12', date: '2026-08-28', groupId: 'group-6', groupName: 'ชุดเวรที่ 6', groupColor: '#e11d48', status: 'PENDING', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sched-13', date: '2026-08-31', groupId: 'group-1', groupName: 'ชุดเวรที่ 1', groupColor: '#2563eb', status: 'PENDING', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' },
  ];

  const initialDuties: DutyRoster[] = [
    {
      id: 'duty-1',
      date: '2026-08-15',
      dutyType: 'ครูเวรประจำวัน (หัวหน้าเวร)',
      staffName: 'ครูณัฐฐา ประเสริฐ',
      department: 'กลุ่มสาระภาษาไทย',
      phone: '081-234-5678',
      shiftTime: 'ALL_DAY',
      status: 'PENDING',
      notes: 'ดูแลความสงบเรียบร้อยทั่วบริเวณโรงเรียน',
      createdAt: '2026-08-10T00:00:00.000Z',
    },
    {
      id: 'duty-2',
      date: '2026-08-15',
      dutyType: 'เวรต้อนรับหน้าประตูโรงเรียน',
      staffName: 'ครูพงษ์ศักดิ์ ศรีวิชัย',
      department: 'กลุ่มสาระการงานอาชีพ',
      phone: '089-876-5432',
      shiftTime: 'MORNING',
      status: 'PENDING',
      notes: 'ต้อนรับนักเรียนและผู้ปกครอง 06:45 - 08:15 น.',
      createdAt: '2026-08-10T00:00:00.000Z',
    },
    {
      id: 'duty-3',
      date: '2026-08-15',
      dutyType: 'เวรตรวจสุขอนามัยโรงอาหาร',
      staffName: 'ครูนิภาวรรณ มั่นคง',
      department: 'งานอนามัยโรงเรียน',
      phone: '086-555-1234',
      shiftTime: 'AFTERNOON',
      status: 'PENDING',
      notes: 'ตรวจความสะอาดและการจำหน่ายอาหารกลางวัน 11:30 - 13:30 น.',
      createdAt: '2026-08-10T00:00:00.000Z',
    },
    {
      id: 'duty-4',
      date: '2026-08-16',
      dutyType: 'ครูเวรประจำวัน (วันหยุด)',
      staffName: 'ครูธีรพล ยอดเยี่ยม',
      department: 'กลุ่มสาระคณิตศาสตร์',
      phone: '084-321-9876',
      shiftTime: 'ALL_DAY',
      status: 'PENDING',
      notes: 'ตรวจตราอาคารเรียนและความเรียบร้อยทั่วไป',
      createdAt: '2026-08-10T00:00:00.000Z',
    },
    {
      id: 'duty-5',
      date: '2026-08-17',
      dutyType: 'เวรต้อนรับหน้าประตูโรงเรียน',
      staffName: 'ครูอรุณีย์ ศิริพร',
      department: 'กลุ่มสาระภาษาต่างประเทศ',
      phone: '087-111-2233',
      shiftTime: 'MORNING',
      status: 'PENDING',
      notes: 'ต้อนรับนักเรียนและผู้ปกครองช่วงเช้า',
      createdAt: '2026-08-10T00:00:00.000Z',
    }
  ];

  const initialBirthdays: StaffBirthday[] = [
    {
      id: 'bday-1',
      name: 'ดร.สมศักดิ์ ใจดี',
      nickname: 'ผอ.ศักดิ์',
      birthDate: '1978-08-15',
      department: 'ฝ่ายบริหารสถานศึกษา',
      position: 'ผู้อำนวยการสถานศึกษา',
      phone: '081-999-8888',
      createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'bday-2',
      name: 'นางนภาพร สุขเกษม',
      nickname: 'ครูภา',
      birthDate: '1985-08-18',
      department: 'กลุ่มบริหารงานวิชาการ',
      position: 'ครูชำนาญการพิเศษ',
      phone: '089-777-6666',
      createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'bday-3',
      name: 'นายกิตติศักดิ์ เจริญพร',
      nickname: 'ครูต่อ',
      birthDate: '1992-08-25',
      department: 'กลุ่มสาระศิลปะและดนตรี',
      position: 'ครูผู้ช่วย',
      phone: '082-333-4444',
      createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'bday-4',
      name: 'นางสาวพิมลพรรณ วงศ์สว่าง',
      nickname: 'ครูพิม',
      birthDate: '1990-09-02',
      department: 'กลุ่มสาระวิทยาศาสตร์',
      position: 'ครู',
      phone: '085-444-5555',
      createdAt: '2026-08-01T00:00:00.000Z',
    }
  ];

  const initialAnnouncements: Announcement[] = [
    {
      id: 'ann-1',
      title: 'แจ้งกำหนดการจัดงานสัปดาห์วิทยาศาสตร์และนิทรรศการวิชาการ 2569',
      content: 'ขอเชิญคณะครู นักเรียน และผู้ปกครองเข้าร่วมชมนิทรรศการผลงานสิ่งประดิษฐ์ โครงงานวิทยาศาสตร์ และการแสดง Science Show ในวันที่ 18-19 สิงหาคม 2569 ณ โดมอเนกประสงค์',
      priority: 'IMPORTANT',
      showDashboard: true,
      sendTelegram: true,
      startDate: '2026-08-12',
      endDate: '2026-08-20',
      status: 'ACTIVE',
      createdBy: 'usr-admin-1',
      createdByName: 'สมศักดิ์ ใจดี',
      createdAt: '2026-08-12T08:00:00.000Z',
    },
    {
      id: 'ann-2',
      title: 'แนวปฏิบัติการสอบวัดผลกลางภาคเรียนที่ 1/2569',
      content: 'ให้นักเรียนแต่งกายด้วยเครื่องแบบนักเรียนที่ถูกต้องตามระเบียบ และนำบัตรประจำตัวนักเรียนเข้าห้องสอบ ห้ามนำอุปกรณ์สื่อสารทุกชนิดเข้าห้องสอบโดยเด็ดขาด',
      priority: 'URGENT',
      showDashboard: true,
      sendTelegram: true,
      startDate: '2026-08-14',
      endDate: '2026-08-29',
      status: 'ACTIVE',
      createdBy: 'usr-admin-1',
      createdByName: 'สมศักดิ์ ใจดี',
      createdAt: '2026-08-14T09:00:00.000Z',
    }
  ];

  const initialTelegramSettings: TelegramSettings = {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
    enabled: process.env.TELEGRAM_ENABLED === 'true',
    notifyOnCreate: false,
    notifyOnApprove: true,
    notifyOnChange: true,
    notifyDailySummary: true,
    dailySummaryTime: '07:00',
    defaultNotifyTimes: ['1_DAY_BEFORE', '1_HOUR_BEFORE'],
  };

  const initialSystemSettings: SystemSettings = {
    schoolName: 'โรงเรียนสาธิตพัฒนาวิทยาคม',
    schoolShortName: 'ส.พ.ว.',
    schoolMotto: 'คุณธรรมนำความรู้ มุ่งสู่ความเป็นเลิศ',
    schoolLogoUrl: '',
    enableDemoMode: true,
    academicYear: '2569',
    semester: '1',
    primaryColor: '#2563eb',
    secondaryColor: '#0d9488',
    sidebarColor: '#0f172a',
    headerColor: '#ffffff',
    presetTheme: 'blue',
    allowSelfRegistration: false,
    defaultEventApprovalRequired: true,
  };

  const initialActivityLogs: ActivityLog[] = [
    {
      id: 'act-1',
      timestamp: '2026-08-15T07:30:00.000Z',
      userId: 'usr-admin-1',
      userName: 'สมศักดิ์ ใจดี',
      action: 'LOGIN',
      details: 'เข้าสู่ระบบสำเร็จผ่านเว็บแอปพลิเคชัน',
      ipAddress: '127.0.0.1',
    },
    {
      id: 'act-2',
      timestamp: '2026-08-15T08:00:00.000Z',
      userId: 'usr-admin-1',
      userName: 'สมศักดิ์ ใจดี',
      action: 'APPROVE_EVENT',
      details: 'อนุมัติกิจกรรม "กิจกรรมตรวจสุขภาพและสุขอนามัยนักเรียนประจำปี"',
      ipAddress: '127.0.0.1',
    }
  ];

  return {
    users: initialUsers,
    categories: initialCategories,
    events: initialEvents,
    holidays: initialHolidays,
    duties: initialDuties,
    dutyGroups: initialDutyGroups,
    dutySchedules: initialDutySchedules,
    birthdays: initialBirthdays,
    announcements: initialAnnouncements,
    telegramSettings: initialTelegramSettings,
    notificationLogs: [],
    activityLogs: initialActivityLogs,
    systemSettings: initialSystemSettings,
  };
}

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    const initial = getInitialDatabase();
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        
        // Ensure holidays are populated if empty or missing
        const holidays = (parsed.holidays && Array.isArray(parsed.holidays) && parsed.holidays.length > 0)
          ? parsed.holidays
          : initial.holidays;

        // Ensure categories are populated if empty
        const categories = (parsed.categories && Array.isArray(parsed.categories) && parsed.categories.length > 0)
          ? parsed.categories
          : initial.categories;

        // Ensure dutyGroups are populated if empty
        const dutyGroups = (parsed.dutyGroups && Array.isArray(parsed.dutyGroups) && parsed.dutyGroups.length > 0)
          ? parsed.dutyGroups
          : initial.dutyGroups;

        // Ensure dutySchedules are populated if empty
        const dutySchedules = (parsed.dutySchedules && Array.isArray(parsed.dutySchedules) && parsed.dutySchedules.length > 0)
          ? parsed.dutySchedules
          : initial.dutySchedules;

        return {
          ...initial,
          ...parsed,
          holidays,
          categories,
          dutyGroups,
          dutySchedules,
          telegramSettings: {
            ...initial.telegramSettings,
            ...(parsed.telegramSettings || {}),
          },
          systemSettings: {
            ...initial.systemSettings,
            ...(parsed.systemSettings || {}),
          },
        };
      }
    } catch (e) {
      console.error('Error reading database file, initializing default database:', e);
    }
    this.saveDirect(initial);
    return initial;
  }

  private saveDirect(data: DatabaseSchema): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database to disk:', e);
    }
  }

  public save(): void {
    this.saveDirect(this.data);
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  public resetToDefault(): DatabaseSchema {
    this.data = getInitialDatabase();
    this.save();
    return this.data;
  }
}

export const db = new DatabaseManager();
