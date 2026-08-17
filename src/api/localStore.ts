import {
  SchoolEvent,
  EventCategory,
  ThaiHoliday,
  DutyGroup,
  DutySchedule,
  StaffBirthday,
  Announcement,
  User,
  TelegramSettings,
  TelegramLog,
  SystemSettings,
  ActivityLog,
  EventAttachment,
} from '../types';
import {
  sendTelegramDirect,
  formatEventMessage,
  formatEventChangeMessage,
  formatAdvanceEventReminderMessage,
  formatAdvanceDutyReminderMessage,
  formatDutyGroupReminderMessage,
  formatBirthdayGreetingMessage,
  formatAnnouncementMessage,
  formatDailySummaryMessage,
  formatTestMessage,
} from '../utils/telegramDirect';
import { formatThaiDate, formatThaiDateRange, getBangkokDateTime } from '../utils/thaiDate';

const STORAGE_KEY = 'school_calendar_local_db_v2';

export interface LocalDatabaseSchema {
  users: User[];
  categories: EventCategory[];
  events: SchoolEvent[];
  holidays: ThaiHoliday[];
  dutyGroups: DutyGroup[];
  dutySchedules: DutySchedule[];
  birthdays: StaffBirthday[];
  announcements: Announcement[];
  telegramSettings: TelegramSettings;
  systemSettings: SystemSettings;
  notificationLogs: TelegramLog[];
  activityLogs: ActivityLog[];
  attachments: EventAttachment[];
}

function getInitialLocalDatabase(): LocalDatabaseSchema {
  const categories: EventCategory[] = [
    { id: 'cat-academic', name: 'วิชาการ / การสอบ', color: '#2563eb', textColor: '#ffffff', icon: 'BookOpen', isSystem: true },
    { id: 'cat-activity', name: 'กิจกรรมนักเรียน / ประเพณี', color: '#059669', textColor: '#ffffff', icon: 'Sparkles', isSystem: true },
    { id: 'cat-meeting', name: 'การประชุม / อบรม', color: '#d97706', textColor: '#ffffff', icon: 'Users', isSystem: true },
    { id: 'cat-admin', name: 'งานบริหาร / นโยบาย', color: '#7c3aed', textColor: '#ffffff', icon: 'Briefcase', isSystem: true },
    { id: 'cat-holiday', name: 'วันหยุดราชการ / พิเศษ', color: '#475569', textColor: '#ffffff', icon: 'CalendarOff', isSystem: true },
    { id: 'cat-duty', name: 'ครูเวร / ประจำวัน', color: '#0284c7', textColor: '#ffffff', icon: 'ShieldCheck', isSystem: true },
  ];

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const events: SchoolEvent[] = [
    {
      id: 'evt-1',
      title: 'พิธีเปิดค่ายวิชาการและนิทรรศการโครงงานวิทยาศาสตร์',
      categoryId: 'cat-academic',
      startDate: todayStr,
      endDate: todayStr,
      startTime: '08:30',
      endTime: '15:30',
      isAllDay: false,
      location: 'หอประชุมใหญ่ อาคารเฉลิมพระเกียรติ',
      description: 'กิจกรรมเปิดค่ายวิชาการ นิทรรศการแสดงผลงานโครงงานของนักเรียนทุกระดับชั้น พร้อมมอบรางวัลเกียรติบัตร',
      coordinator: 'ครูนภาพร สุขเกษม',
      department: 'กลุ่มบริหารงานวิชาการ',
      targetGroup: 'นักเรียนและครูทุกระดับชั้น',
      priority: 'IMPORTANT',
      status: 'APPROVED',
      attachments: [
        {
          id: 'att-1',
          originalName: 'กำหนดการเปิดค่ายวิชาการ.pdf',
          fileName: 'schedule_academic_camp.pdf',
          mimeType: 'application/pdf',
          size: 1048576,
          uploadedBy: 'usr-staff-1',
          uploadedByName: 'นภาพร สุขเกษม',
          uploadedAt: `${todayStr}T08:00:00Z`,
        },
      ],
      recurrence: 'NONE',
      notifySchedule: ['1_DAY_BEFORE', '1_HOUR_BEFORE'],
      sendTelegram: true,
      createdBy: 'usr-staff-1',
      createdByName: 'นภาพร สุขเกษม',
      createdAt: `${todayStr}T07:30:00Z`,
    },
    {
      id: 'evt-2',
      title: 'ประชุมคณะกรรมการบริหารสถานศึกษา ประจำเดือน',
      categoryId: 'cat-meeting',
      startDate: todayStr,
      endDate: todayStr,
      startTime: '13:30',
      endTime: '16:00',
      isAllDay: false,
      location: 'ห้องประชุมเกียรติยศ อาคาร 1 ชั้น 2',
      description: 'ประชุมวางแผนงบประมาณ การพัฒนาสถานศึกษา และการเตรียมงานกิจกรรมประจำภาคเรียน',
      coordinator: 'ผอ.สมศักดิ์ ใจดี',
      department: 'กลุ่มบริหารงานบุคคลและแผนงาน',
      targetGroup: 'คณะผู้บริหารและหัวหน้ากลุ่มสาระฯ',
      priority: 'URGENT',
      status: 'APPROVED',
      attachments: [],
      recurrence: 'MONTHLY',
      notifySchedule: ['1_DAY_BEFORE'],
      sendTelegram: true,
      createdBy: 'usr-admin-1',
      createdByName: 'สมศักดิ์ ใจดี',
      createdAt: `${todayStr}T08:00:00Z`,
    },
    {
      id: 'evt-3',
      title: 'กิจกรรมส่งเสริมประชาธิปไตยและการเลือกตั้งสภานักเรียน',
      categoryId: 'cat-activity',
      startDate: `${year}-${month}-20`,
      endDate: `${year}-${month}-20`,
      startTime: '09:00',
      endTime: '12:00',
      isAllDay: false,
      location: 'ลานอเนกประสงค์ / โดมโรงเรียน',
      description: 'การลงคะแนนเสียงเลือกตั้งประธานและคณะกรรมการสภานักเรียนชุดใหม่ ประจำปีการศึกษา',
      coordinator: 'ครูวิชัย เก่งการ',
      department: 'กลุ่มบริหารกิจการนักเรียน',
      targetGroup: 'นักเรียนทุกระดับชั้น',
      priority: 'NORMAL',
      status: 'APPROVED',
      attachments: [],
      recurrence: 'NONE',
      notifySchedule: ['1_DAY_BEFORE'],
      sendTelegram: true,
      createdBy: 'usr-staff-2',
      createdByName: 'วิชัย เก่งการ',
      createdAt: `${todayStr}T08:00:00Z`,
    },
    {
      id: 'evt-4',
      title: 'โครงการอบรมเชิงปฏิบัติการ การประยุกต์ใช้ AI สำหรับการจัดการเรียนรู้',
      categoryId: 'cat-meeting',
      startDate: `${year}-${month}-25`,
      endDate: `${year}-${month}-26`,
      startTime: '09:00',
      endTime: '16:00',
      isAllDay: false,
      location: 'ห้องปฏิบัติการคอมพิวเตอร์ 402',
      description: 'อบรมพัฒนาครูและบุคลากรทางการศึกษาในการนำ Generative AI และเครื่องมือดิจิทัลมาใช้ออกแบบสื่อการสอน',
      coordinator: 'ครูธนากร เทคโน',
      department: 'กลุ่มบริหารงานวิชาการ / ศูนย์เทคโนโลยี',
      targetGroup: 'คณะครูและบุคลากรทางการศึกษา',
      priority: 'IMPORTANT',
      status: 'PENDING',
      attachments: [],
      recurrence: 'NONE',
      notifySchedule: ['1_DAY_BEFORE'],
      sendTelegram: false,
      createdBy: 'usr-staff-1',
      createdByName: 'นภาพร สุขเกษม',
      createdAt: `${todayStr}T09:00:00Z`,
    },
  ];

  const holidays: ThaiHoliday[] = [
    { id: 'h-1', date: `${year}-01-01`, name: 'วันขึ้นปีใหม่', type: 'HOLIDAY', year, description: 'วันหยุดราชการประจำปี', color: '#475569' },
    { id: 'h-2', date: `${year}-01-16`, name: 'วันครูแห่งชาติ', type: 'SCHOOL_DAY', year, description: 'วันสำคัญของสถานศึกษาและครูอาจารย์', color: '#2563eb' },
    { id: 'h-3', date: `${year}-03-03`, name: 'วันมาฆบูชา', type: 'HOLIDAY', year, description: 'วันสำคัญทางพระพุทธศาสนา', color: '#ca8a04' },
    { id: 'h-4', date: `${year}-04-06`, name: 'วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราช (วันจักรี)', type: 'HOLIDAY', year, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-5', date: `${year}-04-13`, name: 'วันสงกรานต์', type: 'HOLIDAY', year, description: 'วันขึ้นปีใหม่ไทย', color: '#475569' },
    { id: 'h-6', date: `${year}-04-14`, name: 'วันสงกรานต์ (วันครอบครัว)', type: 'HOLIDAY', year, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-7', date: `${year}-04-15`, name: 'วันสงกรานต์', type: 'HOLIDAY', year, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-8', date: `${year}-05-01`, name: 'วันแรงงานแห่งชาติ', type: 'HOLIDAY', year, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-9', date: `${year}-05-04`, name: 'วันฉัตรมงคล', type: 'HOLIDAY', year, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-10', date: `${year}-05-31`, name: 'วันวิสาขบูชา', type: 'HOLIDAY', year, description: 'วันสำคัญสากลทางพระพุทธศาสนา', color: '#ca8a04' },
    { id: 'h-11', date: `${year}-06-03`, name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี', type: 'HOLIDAY', year, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-12', date: `${year}-07-28`, name: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว', type: 'HOLIDAY', year, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-13', date: `${year}-07-29`, name: 'วันอาสาฬหบูชา', type: 'HOLIDAY', year, description: 'วันสำคัญทางพุทธศาสนา', color: '#ca8a04' },
    { id: 'h-14', date: `${year}-07-30`, name: 'วันเข้าพรรษา', type: 'HOLIDAY', year, description: 'วันหยุดราชการ', color: '#ca8a04' },
    { id: 'h-15', date: `${year}-08-12`, name: 'วันแม่แห่งชาติ / วันเฉลิมพระชนมพรรษาพระบรมราชชนนีพันปีหลวง', type: 'HOLIDAY', year, description: 'วันแม่แห่งชาติและวันหยุดราชการ', color: '#475569' },
    { id: 'h-16', date: `${year}-08-18`, name: 'วันวิทยาศาสตร์แห่งชาติ', type: 'IMPORTANT_DAY', year, description: 'จัดกิจกรรมสัปดาห์วิทยาศาสตร์และนิทรรศการโครงงาน', color: '#2563eb' },
    { id: 'h-17', date: `${year}-10-13`, name: 'วันนวมินทรมหาราช', type: 'HOLIDAY', year, description: 'วันคล้ายวันสวรรคตรัชกาลที่ 9', color: '#475569' },
    { id: 'h-18', date: `${year}-10-23`, name: 'วันปิยมหาราช', type: 'HOLIDAY', year, description: 'วันคล้ายวันสวรรคตพระบาทสมเด็จพระจุลจอมเกล้าเจ้าอยู่หัว', color: '#475569' },
    { id: 'h-19', date: `${year}-12-05`, name: 'วันพ่อแห่งชาติ / วันชาติ', type: 'HOLIDAY', year, description: 'วันคล้ายวันพระบรมราชสมภพรัชกาลที่ 9', color: '#475569' },
    { id: 'h-20', date: `${year}-12-10`, name: 'วันรัฐธรรมนูญ', type: 'HOLIDAY', year, description: 'วันหยุดราชการ', color: '#475569' },
    { id: 'h-21', date: `${year}-12-31`, name: 'วันสิ้นปี', type: 'HOLIDAY', year, description: 'วันหยุดราชการส่งท้ายปีเก่า', color: '#475569' },
  ];

  const dutyGroups: DutyGroup[] = [
    {
      id: 'grp-1',
      name: 'ชุดเวรที่ 1 (ประตูหน้าและอาคาร 1-2)',
      code: 'DUTY-GRP-1',
      color: '#2563eb',
      description: 'รับผิดชอบดูแลความปลอดภัยบริเวณประตูหน้าโรงเรียน และตรวจตราอาคารเรียน 1-2',
      responsibilities: [
        'ตรวจตราความเรียบร้อยและต้อนรับนักเรียนบริเวณประตูใหญ่ 07:00 - 08:00 น.',
        'ดูแลความสงบเรียบร้อยในช่วงพักกลางวันบริเวณโรงอาหาร 1',
        'ตรวจเช็กการปิดอาคารเรียน ห้องเรียน และระบบไฟฟ้าหลังเลิกเรียน 16:30 น.',
      ],
      members: [
        { id: 'm-1', name: 'ครูสมชาย รักเรียน', department: 'กลุ่มสาระฯ วิทยาศาสตร์', roleInGroup: 'LEADER', phone: '081-111-2233' },
        { id: 'm-2', name: 'ครูนภาพร สุขเกษม', department: 'กลุ่มสาระฯ ภาษาไทย', roleInGroup: 'MEMBER', phone: '082-222-3344' },
        { id: 'm-3', name: 'ครูพิเชษฐ์ ดิจิทัล', department: 'กลุ่มสาระฯ การงานอาชีพ', roleInGroup: 'MEMBER', phone: '083-333-4455' },
      ],
    },
    {
      id: 'grp-2',
      name: 'ชุดเวรที่ 2 (ประตูหลังและลานกีฬา)',
      code: 'DUTY-GRP-2',
      color: '#059669',
      description: 'รับผิดชอบดูแลความปลอดภัยบริเวณประตูหลังโรงเรียน ลานกีฬา และโรงอาหาร',
      responsibilities: [
        'ดูแลการจราจรและความปลอดภัยบริเวณประตูหลัง 07:00 - 08:00 น.',
        'ตรวจตราบริเวณสนามกีฬาและสระว่ายน้ำในช่วงพักกลางวัน',
        'ดูแลความปลอดภัยช่วงปล่อยนักเรียนกลับบ้าน 15:30 - 16:30 น.',
      ],
      members: [
        { id: 'm-4', name: 'ครูวิชัย เก่งการ', department: 'กลุ่มสาระฯ สุขศึกษาและพลศึกษา', roleInGroup: 'LEADER', phone: '084-444-5566' },
        { id: 'm-5', name: 'ครูสุดารัตน์ ใจงาม', department: 'กลุ่มสาระฯ คณิตศาสตร์', roleInGroup: 'MEMBER', phone: '085-555-6677' },
      ],
    },
    {
      id: 'grp-3',
      name: 'ชุดเวรที่ 3 (อาคารเฉลิมพระเกียรติและหอประชุม)',
      code: 'DUTY-GRP-3',
      color: '#d97706',
      description: 'ดูแลความสงบเรียบร้อยบริเวณอาคาร 3-4 ห้องสมุด และหอประชุมใหญ่',
      responsibilities: [
        'ตรวจตราพื้นที่อาคารเรียนและห้องสมุด',
        'ดูแลกิจกรรมช่วงเข้าแถวเคารพธงชาติ',
        'ตรวจความเรียบร้อยก่อนปิดทำการสถานศึกษา',
      ],
      members: [
        { id: 'm-6', name: 'ครูอัญชลี พัฒนา', department: 'กลุ่มสาระฯ ภาษาต่างประเทศ', roleInGroup: 'LEADER', phone: '086-666-7788' },
        { id: 'm-7', name: 'ครูกิตติพงษ์ ศิลปะ', department: 'กลุ่มสาระฯ ศิลปะ', roleInGroup: 'MEMBER', phone: '087-777-8899' },
      ],
    },
  ];

  // Generate duty schedules for the current month
  const dutySchedules: DutySchedule[] = [];
  for (let d = 1; d <= 31; d++) {
    const curDate = new Date(year, now.getMonth(), d);
    if (curDate.getMonth() !== now.getMonth()) break;
    const curDayOfWeek = curDate.getDay();
    if (curDayOfWeek !== 0 && curDayOfWeek !== 6) {
      const curDateStr = `${year}-${month}-${String(d).padStart(2, '0')}`;
      const groupIdx = (d % dutyGroups.length);
      const assignedGroup = dutyGroups[groupIdx];
      dutySchedules.push({
        id: `sched-${curDateStr}`,
        date: curDateStr,
        groupId: assignedGroup.id,
        groupName: assignedGroup.name,
        groupColor: assignedGroup.color,
        membersSnapshot: assignedGroup.members,
        customResponsibilities: assignedGroup.responsibilities,
        notes: 'ปฏิบัติหน้าที่ตามจุดที่ได้รับมอบหมาย',
        shift: 'ALL_DAY',
        status: curDateStr <= todayStr ? 'COMPLETED' : 'PENDING',
      });
    }
  }

  const birthdays: StaffBirthday[] = [
    {
      id: 'bday-1',
      name: 'ครูนภาพร สุขเกษม',
      nickname: 'ครูอุ้ม',
      birthDate: `${year}-${month}-${day}`,
      department: 'กลุ่มบริหารงานวิชาการ',
      position: 'ครูชำนาญการพิเศษ',
      phone: '082-222-3344',
      greetingsSentYears: [year],
    },
    {
      id: 'bday-2',
      name: 'ครูสมชาย รักเรียน',
      nickname: 'ครูชาย',
      birthDate: `${year}-${month}-24`,
      department: 'กลุ่มสาระฯ วิทยาศาสตร์',
      position: 'ครูชำนาญการ',
      phone: '081-111-2233',
      greetingsSentYears: [],
    },
    {
      id: 'bday-3',
      name: 'ผอ.สมศักดิ์ ใจดี',
      nickname: 'ผอ.ศักดิ์',
      birthDate: `${year}-${month}-28`,
      department: 'กลุ่มบริหารงานบุคคลและแผนงาน',
      position: 'ผู้อำนวยการสถานศึกษา',
      phone: '089-999-0000',
      greetingsSentYears: [],
    },
  ];

  const announcements: Announcement[] = [
    {
      id: 'ann-1',
      title: 'แจ้งกำหนดการประเมินคุณภาพการศึกษาและการตรวจราชการ',
      content: 'ขอให้คณะครูและบุคลากรทุกกลุ่มสาระฯ เตรียมความพร้อมเอกสารประกอบการจัดการเรียนรู้ แผนการสอน และบันทึกหลังสอน เพื่อรับการนิเทศติดตาม',
      priority: 'IMPORTANT',
      showDashboard: true,
      sendTelegram: true,
      startDate: todayStr,
      endDate: `${year}-12-31`,
      status: 'ACTIVE',
      createdBy: 'usr-admin-1',
      createdByName: 'สมศักดิ์ ใจดี',
      createdAt: `${todayStr}T08:00:00Z`,
    },
    {
      id: 'ann-2',
      title: 'ขอเชิญครูผู้สอนร่วมตอบแบบสอบถามความพึงพอใจการใช้ระบบปฏิทินดิจิทัล',
      content: 'สามารถให้ข้อเสนอแนะและร่วมพัฒนาการแจ้งเตือนอัตโนมัติผ่าน Telegram Bot เพื่อเพิ่มประสิทธิภาพการปฏิบัติงาน',
      priority: 'NORMAL',
      showDashboard: true,
      sendTelegram: false,
      startDate: todayStr,
      endDate: `${year}-12-31`,
      status: 'ACTIVE',
      createdBy: 'usr-staff-1',
      createdByName: 'นภาพร สุขเกษม',
      createdAt: `${todayStr}T09:00:00Z`,
    },
  ];

  const users: User[] = [
    {
      id: 'usr-admin-1',
      name: 'สมศักดิ์',
      surname: 'ใจดี (ผู้ดูแลระบบ)',
      username: 'admin',
      email: 'admin@school.ac.th',
      department: 'กลุ่มบริหารงานบุคคลและแผนงาน',
      position: 'ผู้อำนวยการสถานศึกษา / ผู้ดูแลระบบ',
      role: 'ADMIN',
      permissions: [
        'events.view', 'events.create', 'events.edit', 'events.delete', 'events.approve',
        'holidays.manage', 'duties.manage', 'birthdays.manage', 'announcements.manage',
        'users.view', 'users.create', 'users.edit', 'users.delete', 'settings.manage',
        'telegram.manage', 'reports.view', 'logs.view',
      ],
      status: 'ACTIVE',
      createdAt: '2026-08-01T00:00:00Z',
    },
    {
      id: 'usr-staff-1',
      name: 'นภาพร',
      surname: 'สุขเกษม',
      username: 'staff',
      email: 'staff@school.ac.th',
      department: 'กลุ่มบริหารงานวิชาการ',
      position: 'ครูชำนาญการพิเศษ / หัวหน้ากลุ่มสาระฯ',
      role: 'STAFF',
      permissions: [
        'events.view', 'events.create', 'events.edit', 'duties.manage',
        'birthdays.manage', 'announcements.manage', 'reports.view',
      ],
      status: 'ACTIVE',
      createdAt: '2026-08-01T00:00:00Z',
    },
    {
      id: 'usr-viewer-1',
      name: 'กิตติศักดิ์',
      surname: 'มุ่งมั่น',
      username: 'viewer',
      email: 'viewer@school.ac.th',
      department: 'นักเรียน / ผู้ปกครอง',
      position: 'ผู้เยี่ยมชมและติดตามข่าวสาร',
      role: 'VIEWER',
      permissions: ['events.view', 'reports.view'],
      status: 'ACTIVE',
      createdAt: '2026-08-01T00:00:00Z',
    },
  ];

  const telegramSettings: TelegramSettings = {
    botToken: '123456789:AAF_SAMPLE_TOKEN_FOR_SCHOOL_TELEGRAM_NOTIF',
    chatId: '-1001234567890',
    enabled: true,
    notifyOnCreate: true,
    notifyOnApprove: true,
    notifyOnChange: true,
    notifyDailySummary: true,
    dailySummaryTime: '07:00',
    defaultNotifyTimes: ['1_DAY_BEFORE', '1_HOUR_BEFORE'],
  };

  const systemSettings: SystemSettings = {
    schoolName: 'โรงเรียนสุขสันต์วิทยา (สังกัด สพฐ.)',
    schoolShortName: 'ส.ส.ว.',
    schoolLogoUrl: '',
    academicYear: '2569',
    semester: '1',
    primaryColor: '#2563eb',
    secondaryColor: '#4f46e5',
    sidebarColor: '#1e293b',
    defaultEventApprovalRequired: true,
  };

  const notificationLogs: TelegramLog[] = [
    {
      id: 'notif-1',
      type: 'EVENT_REMINDER',
      recipient: '-1001234567890 (กลุ่มครูและบุคลากร)',
      message: '📢 แจ้งเตือน: พิธีเปิดค่ายวิชาการและนิทรรศการโครงงานวิทยาศาสตร์ วันนี้เวลา 08:30 น.',
      content: '📢 แจ้งเตือน: พิธีเปิดค่ายวิชาการและนิทรรศการโครงงานวิทยาศาสตร์ วันนี้เวลา 08:30 น.',
      status: 'SUCCESS',
      sentAt: `${todayStr} 07:00:00`,
    },
    {
      id: 'notif-2',
      type: 'DUTY_REMINDER',
      recipient: '-1001234567890 (กลุ่มครูและบุคลากร)',
      message: '🛡️ แจ้งเตือนครูเวรประจำวัน: ชุดเวรที่ 1 (ประตูหน้าและอาคาร 1-2) วันนี้',
      content: '🛡️ แจ้งเตือนครูเวรประจำวัน: ชุดเวรที่ 1 (ประตูหน้าและอาคาร 1-2) วันนี้',
      status: 'SUCCESS',
      sentAt: `${todayStr} 06:45:00`,
    },
  ];

  const activityLogs: ActivityLog[] = [
    {
      id: 'log-1',
      userId: 'usr-admin-1',
      userName: 'สมศักดิ์ ใจดี (ผู้ดูแลระบบ)',
      action: 'APPROVE_EVENT',
      details: 'อนุมัติกิจกรรม: "พิธีเปิดค่ายวิชาการและนิทรรศการโครงงานวิทยาศาสตร์"',
      timestamp: `${todayStr} 07:30:00`,
      ipAddress: '127.0.0.1',
    },
    {
      id: 'log-2',
      userId: 'usr-staff-1',
      userName: 'นภาพร สุขเกษม',
      action: 'CREATE_EVENT',
      details: 'สร้างกิจกรรมใหม่: "พิธีเปิดค่ายวิชาการและนิทรรศการโครงงานวิทยาศาสตร์"',
      timestamp: `${todayStr} 07:25:00`,
      ipAddress: '127.0.0.1',
    },
  ];

  const attachments: EventAttachment[] = [
    {
      id: 'att-1',
      originalName: 'กำหนดการเปิดค่ายวิชาการ.pdf',
      fileName: 'schedule_academic_camp.pdf',
      mimeType: 'application/pdf',
      size: 1048576,
      uploadedBy: 'usr-staff-1',
      uploadedByName: 'นภาพร สุขเกษม',
      uploadedAt: `${todayStr}T08:00:00Z`,
      dataUrl: '#',
    },
    {
      id: 'att-2',
      originalName: 'ระเบียบการจัดเวรครูประจำวัน_2569.pdf',
      fileName: 'duty_guidelines_2569.pdf',
      mimeType: 'application/pdf',
      size: 2097152,
      uploadedBy: 'usr-admin-1',
      uploadedByName: 'สมศักดิ์ ใจดี',
      uploadedAt: `${todayStr}T08:30:00Z`,
      dataUrl: '#',
    },
  ];

  return {
    users,
    categories,
    events,
    holidays,
    dutyGroups,
    dutySchedules,
    birthdays,
    announcements,
    telegramSettings,
    systemSettings,
    notificationLogs,
    activityLogs,
    attachments,
  };
}

class LocalStore {
  private data: LocalDatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): LocalDatabaseSchema {
    const initial = getInitialLocalDatabase();
    try {
      // Check cached standalone settings
      let cachedSystemSettings = null;
      try {
        const rawSettings = localStorage.getItem('school_calendar_system_settings');
        if (rawSettings) cachedSystemSettings = JSON.parse(rawSettings);
      } catch {}

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.events) && Array.isArray(parsed.categories)) {
          if (cachedSystemSettings) {
            parsed.systemSettings = { ...parsed.systemSettings, ...cachedSystemSettings };
          }
          return parsed;
        }
      }
      if (cachedSystemSettings) {
        initial.systemSettings = { ...initial.systemSettings, ...cachedSystemSettings };
      }
    } catch {
      // ignore
    }
    this.persist(initial);
    return initial;
  }

  private persist(data: LocalDatabaseSchema) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      // Auto push updates to Cloud Firestore in the background
      import('./firestoreService').then(({ uploadFullStateToFirestore, isFirestoreConfigured }) => {
        if (isFirestoreConfigured()) {
          uploadFullStateToFirestore({
            events: data.events,
            categories: data.categories,
            holidays: data.holidays,
            dutyGroups: data.dutyGroups,
            dutySchedules: data.dutySchedules,
            birthdays: data.birthdays,
            announcements: data.announcements,
            users: data.users,
            telegramSettings: data.telegramSettings,
            settings: data.systemSettings,
          }).catch((e) => console.warn('Background Cloud sync silent catch:', e));
        }
      }).catch(() => {});
    } catch {
      // ignore storage quota error
    }
  }

  public getData(): LocalDatabaseSchema {
    return this.data;
  }

  public save() {
    this.persist(this.data);
  }

  public saveData() {
    this.persist(this.data);
  }

  public resetToDefault(): LocalDatabaseSchema {
    this.data = getInitialLocalDatabase();
    this.save();
    return this.data;
  }

  // Core Telegram Notification Dispatcher for LocalStore / Vercel
  public async dispatchTelegram(
    textOrType: string,
    payloadOrType?: any,
    eventId?: string,
    overrideToken?: string,
    overrideChatId?: string,
    skipEnabledCheck = false
  ): Promise<{ success: boolean; message: string; rawError?: string }> {
    let text = '';
    let type: TelegramLog['type'] = 'EVENT_NEW';
    const schoolName = this.data.systemSettings?.schoolName || 'โรงเรียนตัวอย่างวิทยา';

    // Flexible parameter detection
    if (typeof payloadOrType === 'object' && payloadOrType !== null) {
      // Called as dispatchTelegram(type, payload, eventId)
      type = textOrType as any;
      const payload = payloadOrType;

      if (type === 'EVENT_REMINDER' && payload.event) {
        text = formatAdvanceEventReminderMessage(
          payload.event,
          payload.timingLabel || 'เตือนล่วงหน้า',
          schoolName
        );
      } else if (type === 'ADVANCE_DUTY_REMINDER' && payload.schedule && payload.group) {
        text = formatAdvanceDutyReminderMessage(payload.schedule, payload.group, schoolName);
      } else if (type === 'DUTY_REMINDER' && payload.schedule && payload.group) {
        text = formatDutyGroupReminderMessage(payload.schedule, payload.group, schoolName);
      } else if (type === 'DAILY_SUMMARY') {
        const todayStr = payload.dateStr || new Date().toISOString().split('T')[0];
        const todaySched = (this.data.dutySchedules || []).find((s) => s.date === todayStr);
        const todayGrp = todaySched ? (this.data.dutyGroups || []).find((g) => g.id === todaySched.groupId) || null : null;
        const todayMMDD = todayStr.substring(5);
        const todayBirthdays = (this.data.birthdays || []).filter((b) => b.birthDate && b.birthDate.endsWith(todayMMDD));
        text = formatDailySummaryMessage(this.data.events, todaySched || null, todayGrp || null, todayBirthdays, schoolName, todayStr);
      } else if (type === 'BIRTHDAY' && payload.birthday) {
        text = formatBirthdayGreetingMessage(payload.birthday, schoolName);
      } else if (type === 'EVENT_APPROVED' && payload.event) {
        text = formatEventMessage(payload.event, schoolName, '✅ <b>อนุมัติกิจกรรมใหม่เรียบร้อยแล้ว</b>');
      } else if (type === 'EVENT_CHANGED' && payload.newEvent && payload.oldEvent) {
        text = formatEventChangeMessage(payload.oldEvent, payload.newEvent, schoolName);
      } else if (type === 'ANNOUNCEMENT' && payload.announcement) {
        text = formatAnnouncementMessage(payload.announcement, schoolName);
      } else {
        text = payload.text || payload.content || String(payload);
      }
    } else {
      // Called as dispatchTelegram(text, type, eventId, overrideToken, overrideChatId, skipEnabledCheck)
      text = textOrType;
      type = (payloadOrType as any) || 'EVENT_NEW';
    }

    const settings = this.data.telegramSettings;
    const isEnabled = settings.enabled || skipEnabledCheck || !!overrideToken;
    if (!isEnabled && !overrideToken) {
      return { success: false, message: 'การแจ้งเตือน Telegram ถูกปิดการใช้งานอยู่ในการตั้งค่า' };
    }

    const token = (overrideToken || settings.botToken || (typeof process !== 'undefined' ? process.env?.TELEGRAM_BOT_TOKEN : '') || '').trim();
    const chatId = (overrideChatId || settings.chatId || (typeof process !== 'undefined' ? process.env?.TELEGRAM_CHAT_ID : '') || '').trim();

    if (!token || !chatId) {
      const errorMsg = 'ยังไม่ได้ระบุ Telegram Bot Token หรือ Chat ID (กรุณาตั้งค่าในเมนู "ตั้งค่าการแจ้งเตือน Telegram")';
      const log: TelegramLog = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        eventId,
        type,
        recipient: chatId || 'N/A',
        content: text,
        sentAt: new Date().toISOString(),
        status: 'FAILED',
        errorMessage: errorMsg,
      };
      this.data.notificationLogs.unshift(log);
      this.save();
      return { success: false, message: errorMsg };
    }

    const result = await sendTelegramDirect(token, chatId, text);

    const log: TelegramLog = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      eventId,
      type,
      recipient: chatId,
      content: text,
      sentAt: new Date().toISOString(),
      status: result.success ? 'SUCCESS' : 'FAILED',
      errorMessage: result.success ? undefined : (result.message || result.error || 'Failed to send Telegram message'),
    };

    this.data.notificationLogs.unshift(log);
    if (this.data.notificationLogs.length > 200) {
      this.data.notificationLogs = this.data.notificationLogs.slice(0, 200);
    }
    this.save();

    return {
      success: result.success,
      message: result.message,
      rawError: result.error,
    };
  }

  // Router handler for mock/fallback requests
  public async handleMockRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const method = (options.method || 'GET').toUpperCase();
    const cleanUrl = endpoint.replace(/^\/api/, '');
    const [pathPart, queryPart] = cleanUrl.split('?');
    const params = new URLSearchParams(queryPart || '');

    // 1. Auth routes
    if (pathPart === '/auth/me') {
      const authHeader = (options.headers as any)?.['Authorization'] || (options.headers as any)?.['authorization'];
      let currentUser = this.data.users[0];
      if (authHeader && typeof authHeader === 'string') {
        const tokenVal = authHeader.replace('Bearer ', '').trim();
        const userId = tokenVal.replace('local-token-', '');
        const matched = this.data.users.find((u) => u.id === userId);
        if (matched) currentUser = matched;
      }
      return { user: currentUser };
    }
    if (pathPart === '/auth/login') {
      let body: any = {};
      try {
        if (options.body && typeof options.body === 'string') {
          body = JSON.parse(options.body);
        } else if (options.body) {
          body = options.body;
        }
      } catch {}

      const usernameOrEmail = (body.usernameOrEmail || '').trim().toLowerCase();
      const password = body.password || '';

      if (!usernameOrEmail) {
        throw new Error('กรุณากรอกชื่อผู้ใช้งาน หรืออีเมล');
      }

      let user = this.data.users.find(
        (u) =>
          u.username.toLowerCase() === usernameOrEmail ||
          (u.email && u.email.toLowerCase() === usernameOrEmail)
      );

      // Role shorthand matching (e.g. typing "admin", "staff", "viewer")
      if (!user) {
        if (usernameOrEmail === 'admin') user = this.data.users.find((u) => u.role === 'ADMIN');
        else if (usernameOrEmail === 'staff' || usernameOrEmail === 'teacher')
          user = this.data.users.find((u) => u.role === 'STAFF');
        else if (usernameOrEmail === 'viewer') user = this.data.users.find((u) => u.role === 'VIEWER');
      }

      if (!user) {
        // If still not found, provide the first admin as fallback
        user = this.data.users[0];
      }

      if (user.status === 'INACTIVE') {
        throw new Error('บัญชีผู้ใช้งานนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
      }

      return {
        token: 'local-token-' + user.id,
        user,
        message: `เข้าสู่ระบบสำเร็จในบทบาท ${user.role}`,
      };
    }
    if (pathPart === '/auth/quick-login') {
      let body: any = {};
      try {
        if (options.body && typeof options.body === 'string') {
          body = JSON.parse(options.body);
        } else if (options.body) {
          body = options.body;
        }
      } catch {}
      const targetRole = body.role === 'ADMIN' ? 'ADMIN' : body.role === 'STAFF' ? 'STAFF' : 'VIEWER';
      const user =
        this.data.users.find((u) => u.role === targetRole && u.status === 'ACTIVE') ||
        this.data.users.find((u) => u.role === targetRole) ||
        this.data.users[0];
      return {
        token: 'local-token-' + user.id,
        user,
        message: `เข้าสู่ระบบในบทบาท ${user.role} สำเร็จ`,
      };
    }
    if (pathPart === '/auth/profile') {
      if (method === 'PUT') {
        let body: any = {};
        try {
          if (options.body && typeof options.body === 'string') {
            body = JSON.parse(options.body);
          } else if (options.body) {
            body = options.body;
          }
        } catch {}
        const authHeader = (options.headers as any)?.['Authorization'] || (options.headers as any)?.['authorization'];
        let targetUser = this.data.users[0];
        if (authHeader && typeof authHeader === 'string') {
          const tokenVal = authHeader.replace('Bearer ', '').trim();
          const userId = tokenVal.replace('local-token-', '');
          const matched = this.data.users.find((u) => u.id === userId);
          if (matched) targetUser = matched;
        }
        Object.assign(targetUser, body);
        this.save();
        return { message: 'อัปเดตข้อมูลส่วนตัวสำเร็จ', user: targetUser };
      }
    }
    if (pathPart === '/auth/logout') {
      return { message: 'ออกจากระบบสำเร็จ' };
    }

    // 2. Dashboard summary
    if (pathPart === '/dashboard/summary' || pathPart === '/dashboard' || pathPart === '/reports/summary') {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

      const todayEvents = this.data.events.filter((e) => e.status === 'APPROVED' && e.startDate <= todayStr && e.endDate >= todayStr);
      const tomorrowEvents = this.data.events.filter((e) => e.status === 'APPROVED' && e.startDate <= tomorrowStr && e.endDate >= tomorrowStr);
      const pendingEvents = this.data.events.filter((e) => e.status === 'PENDING');
      const activeAnnouncements = this.data.announcements.filter((a) => a.status === 'ACTIVE');
      const todayBirthdays = this.data.birthdays.filter((b) => b.birthDate.endsWith(`${month}-${day}`));
      const todayDuties = this.data.dutySchedules.filter((s) => s.date === todayStr);
      const todayDutySchedule = this.data.dutySchedules.find((s) => s.date === todayStr) || null;
      const todayDutyGroup = todayDutySchedule ? this.data.dutyGroups.find((g) => g.id === todayDutySchedule.groupId) : null;
      const upcomingHolidays = this.data.holidays.filter((h) => h.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date));

      const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const monthlyData = thaiMonths.map((m, idx) => ({
        month: m,
        events: this.data.events.filter((e) => e.startDate.startsWith(`${year}-${String(idx + 1).padStart(2, '0')}`)).length,
        total: this.data.events.filter((e) => e.startDate.startsWith(`${year}-${String(idx + 1).padStart(2, '0')}`)).length,
      }));

      const categoryData = this.data.categories.map((c) => ({
        name: c.name,
        value: this.data.events.filter((e) => e.categoryId === c.id).length,
        color: c.color,
      })).filter((c) => c.value > 0);

      return {
        todayEventsCount: todayEvents.length,
        tomorrowEventsCount: tomorrowEvents.length,
        pendingEventsCount: pendingEvents.length,
        usersCount: this.data.users.length,
        announcementsCount: activeAnnouncements.length,
        nextHoliday: upcomingHolidays[0] || null,
        todayEvents,
        tomorrowEvents,
        pendingEvents,
        activeAnnouncements,
        todayBirthdays,
        todayDuties,
        todayDutySchedule,
        todayDutyGroup,
        totalEvents: this.data.events.length,
        approvedEvents: this.data.events.filter((e) => e.status === 'APPROVED').length,
        totalNotifications: this.data.notificationLogs.length,
        successfulNotifications: this.data.notificationLogs.filter((n) => n.status === 'SUCCESS').length,
        totalAttachments: this.data.attachments.length,
        monthlyData,
        categoryData,
      };
    }

    // 3. Category routes
    if (pathPart === '/events/categories/list' || pathPart === '/events/categories') {
      if (method === 'GET') {
        return { categories: this.data.categories };
      }
      if (method === 'POST') {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
        const newCat: EventCategory = {
          id: `cat-${Date.now()}`,
          name: body.name || 'หมวดหมู่ใหม่',
          color: body.color || '#2563eb',
          textColor: body.textColor || '#ffffff',
          icon: body.icon || 'Calendar',
          isSystem: false,
        };
        this.data.categories.push(newCat);
        this.save();
        return { message: 'เพิ่มหมวดหมู่กิจกรรมสำเร็จ', category: newCat };
      }
    }

    if (pathPart.startsWith('/events/categories/')) {
      const catId = pathPart.replace('/events/categories/', '');
      const catIdx = this.data.categories.findIndex((c) => c.id === catId);
      if (method === 'PUT' && catIdx >= 0) {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
        this.data.categories[catIdx] = {
          ...this.data.categories[catIdx],
          ...body,
        };
        this.save();
        return { message: 'แก้ไขหมวดหมู่กิจกรรมสำเร็จ', category: this.data.categories[catIdx] };
      }
      if (method === 'DELETE' && catIdx >= 0) {
        this.data.categories.splice(catIdx, 1);
        this.save();
        return { message: 'ลบหมวดหมู่กิจกรรมสำเร็จ' };
      }
    }

    // Events Main Routes
    if (pathPart === '/events') {
      if (method === 'GET') {
        const includePending = params.get('includePending') === 'true';
        let evts = this.data.events;
        if (!includePending) {
          evts = evts.filter((e) => e.status === 'APPROVED');
        }
        return { events: evts };
      }
      if (method === 'POST') {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
        const newEvt: SchoolEvent = {
          id: `evt-${Date.now()}`,
          title: body.title || 'กิจกรรมใหม่',
          categoryId: body.categoryId || 'cat-academic',
          startDate: body.startDate || new Date().toISOString().split('T')[0],
          endDate: body.endDate || body.startDate,
          startTime: body.startTime || '08:30',
          endTime: body.endTime || '16:30',
          isAllDay: !!body.isAllDay,
          location: body.location || '',
          description: body.description || '',
          coordinator: body.coordinator || 'ผู้รับผิดชอบ',
          department: body.department || 'ทั่วไป',
          targetGroup: body.targetGroup || 'ทุกคน',
          priority: body.priority || 'NORMAL',
          status: body.status || 'APPROVED',
          attachments: body.attachments || [],
          recurrence: body.recurrence || 'NONE',
          notifySchedule: body.notifySchedule || ['1_DAY_BEFORE'],
          sendTelegram: body.sendTelegram !== false,
          createdBy: 'usr-admin-1',
          createdByName: 'สมศักดิ์ ใจดี',
          createdAt: new Date().toISOString(),
        };
        this.data.events.push(newEvt);
        this.save();

        // Send Telegram notification if approved and requested
        if (newEvt.sendTelegram && newEvt.status === 'APPROVED') {
          const msg = formatEventMessage(newEvt, this.data.systemSettings.schoolName, '✅ <b>กิจกรรมโรงเรียนใหม่</b>');
          this.dispatchTelegram(msg, 'EVENT_NEW', newEvt.id).catch((err) => console.warn('[Telegram Dispatch]', err));
        }

        return { message: 'สร้างกิจกรรมสำเร็จ', event: newEvt };
      }
    }

    // Event actions
    if (pathPart.startsWith('/events/')) {
      const parts = pathPart.split('/');
      const eventId = parts[2];
      const subAction = parts[3];

      const evtIndex = this.data.events.findIndex((e) => e.id === eventId);
      const evt = this.data.events[evtIndex];

      if (subAction === 'approve' && evt) {
        evt.status = 'APPROVED';
        this.save();

        if (evt.sendTelegram) {
          const msg = formatEventMessage(evt, this.data.systemSettings.schoolName, '✅ <b>อนุมัติกิจกรรมโรงเรียนเรียบร้อย</b>');
          await this.dispatchTelegram(msg, 'EVENT_APPROVED', evt.id);
        }

        return { message: 'อนุมัติกิจกรรมสำเร็จ', event: evt };
      }
      if (subAction === 'reject' && evt) {
        evt.status = 'REJECTED';
        this.save();
        return { message: 'ปฏิเสธกิจกรรมเรียบร้อยแล้ว', event: evt };
      }
      if (subAction === 'notify-telegram' && evt) {
        const msg = formatEventMessage(evt, this.data.systemSettings.schoolName, '📢 <b>แจ้งเตือนกิจกรรมโรงเรียน</b>');
        const res = await this.dispatchTelegram(msg, 'EVENT_NEW', evt.id, undefined, undefined, true);
        return res;
      }
      if (method === 'DELETE' && evtIndex >= 0) {
        this.data.events.splice(evtIndex, 1);
        this.save();
        return { message: 'ลบกิจกรรมสำเร็จ' };
      }
      if (method === 'PUT' && evt) {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
        const oldSnapshot = {
          title: evt.title,
          date: evt.startDate === evt.endDate ? formatThaiDate(evt.startDate, { format: 'medium' }) : formatThaiDateRange(evt.startDate, evt.endDate),
          time: evt.isAllDay ? 'ตลอดวัน' : `${evt.startTime} - ${evt.endTime} น.`,
          location: evt.location || '-',
          coordinator: evt.coordinator || '-',
        };

        const wasApproved = evt.status === 'APPROVED';
        Object.assign(evt, body);
        this.save();

        if (evt.status === 'APPROVED' && evt.sendTelegram) {
          if (wasApproved && (body.startDate || body.startTime || body.location || body.coordinator)) {
            const changeMsg = formatEventChangeMessage(oldSnapshot, evt, this.data.systemSettings.schoolName);
            this.dispatchTelegram(changeMsg, 'EVENT_CHANGED', evt.id).catch((err) => console.warn('[Telegram Change Dispatch]', err));
          }
        }

        return { message: 'แก้ไขกิจกรรมสำเร็จ', event: evt };
      }
    }

    // 4. Holidays
    if (pathPart === '/holidays') {
      if (method === 'GET') {
        return { holidays: this.data.holidays };
      }
      if (method === 'POST') {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
        const newH: ThaiHoliday = {
          id: `h-${Date.now()}`,
          date: body.date,
          name: body.name,
          type: body.type || 'HOLIDAY',
          description: body.description || '',
          color: body.color || '#475569',
        };
        this.data.holidays.push(newH);
        this.save();
        return { message: 'เพิ่มวันสำคัญสำเร็จ', holiday: newH };
      }
    }
    if (pathPart === '/holidays/restore-defaults') {
      const initial = getInitialLocalDatabase();
      this.data.holidays = initial.holidays;
      this.save();
      return { message: 'คืนค่าวันสำคัญเรียบร้อยแล้ว', holidays: this.data.holidays };
    }
    if (pathPart.startsWith('/holidays/')) {
      const id = pathPart.split('/')[2];
      const idx = this.data.holidays.findIndex((h) => h.id === id);
      if (method === 'DELETE' && idx >= 0) {
        this.data.holidays.splice(idx, 1);
        this.save();
        return { message: 'ลบวันสำคัญสำเร็จ' };
      }
      if (method === 'PUT' && idx >= 0) {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
        Object.assign(this.data.holidays[idx], body);
        this.save();
        return { message: 'แก้ไขวันสำคัญสำเร็จ', holiday: this.data.holidays[idx] };
      }
    }

    // 5. Duties
    if (pathPart === '/duties/groups') {
      if (method === 'GET') {
        return { groups: this.data.dutyGroups };
      }
      if (method === 'POST') {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
        const newGrp: DutyGroup = {
          id: `grp-${Date.now()}`,
          name: body.name,
          code: body.code || `GROUP-${this.data.dutyGroups.length + 1}`,
          color: body.color || '#2563eb',
          description: body.description || '',
          responsibilities: body.responsibilities || ['ดูแลความเรียบร้อย'],
          members: body.members || [],
        };
        this.data.dutyGroups.push(newGrp);
        this.save();
        return { message: 'สร้างชุดเวรสำเร็จ', group: newGrp };
      }
    }
    if (pathPart.startsWith('/duties/groups/')) {
      const id = pathPart.split('/')[3];
      const idx = this.data.dutyGroups.findIndex((g) => g.id === id);
      if (method === 'DELETE' && idx >= 0) {
        this.data.dutyGroups.splice(idx, 1);
        this.save();
        return { message: 'ลบชุดเวรสำเร็จ' };
      }
      if (method === 'PUT' && idx >= 0) {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
        Object.assign(this.data.dutyGroups[idx], body);
        this.save();
        return { message: 'แก้ไขชุดเวรสำเร็จ', group: this.data.dutyGroups[idx] };
      }
    }
    if (pathPart === '/duties/schedules') {
      return { schedules: this.data.dutySchedules };
    }
    if (pathPart === '/duties/schedule') {
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
      const grp = this.data.dutyGroups.find((g) => g.id === body.groupId);
      const existingIdx = this.data.dutySchedules.findIndex((s) => s.date === body.date);
      const sched: DutySchedule = {
        id: `sched-${body.date}`,
        date: body.date,
        groupId: body.groupId,
        groupName: grp?.name || 'ชุดเวร',
        groupColor: grp?.color || '#2563eb',
        membersSnapshot: grp?.members || [],
        customResponsibilities: grp?.responsibilities || [],
        notes: body.notes || '',
        shift: body.shift || 'ALL_DAY',
        status: 'PENDING',
      };
      if (existingIdx >= 0) {
        this.data.dutySchedules[existingIdx] = sched;
      } else {
        this.data.dutySchedules.push(sched);
      }
      this.save();

      // If requested to send notification immediately
      if (body.sendTelegramNow && grp) {
        const msg = formatDutyGroupReminderMessage(sched, grp, this.data.systemSettings.schoolName);
        this.dispatchTelegram(msg, 'DUTY_REMINDER', undefined, undefined, undefined, true).catch(console.error);
      }

      return { message: 'บันทึกตารางเวรสำเร็จ', schedule: sched };
    }
    if (pathPart.startsWith('/duties/schedule/')) {
      const parts = pathPart.split('/');
      const idOrDate = parts[3];
      const subAction = parts[4];
      const idx = this.data.dutySchedules.findIndex((s) => s.id === idOrDate || s.date === idOrDate);
      const sched = this.data.dutySchedules[idx];

      if (subAction === 'notify-telegram') {
        if (!sched) {
          return { success: false, message: 'ไม่พบข้อมูลตารางเวรที่ระบุ' };
        }
        const grp = this.data.dutyGroups.find((g) => g.id === sched.groupId);
        if (!grp) {
          return { success: false, message: 'ไม่พบชุดเวรสำหรับตารางนี้' };
        }
        const msg = formatDutyGroupReminderMessage(sched, grp, this.data.systemSettings.schoolName);
        const res = await this.dispatchTelegram(msg, 'DUTY_REMINDER', undefined, undefined, undefined, true);
        return res;
      }
      if (method === 'DELETE' && idx >= 0) {
        this.data.dutySchedules.splice(idx, 1);
        this.save();
        return { message: 'ลบตารางเวรสำเร็จ' };
      }
    }
    if (pathPart === '/duties/generate-rotation') {
      return { message: 'สร้างตารางเวรหมุนเวียนอัตโนมัติสำเร็จ', count: 20 };
    }

    // 6. Birthdays
    if (pathPart === '/birthdays') {
      if (method === 'GET') {
        return { birthdays: this.data.birthdays };
      }
      if (method === 'POST') {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
        const newB: StaffBirthday = {
          id: `bday-${Date.now()}`,
          name: body.name,
          nickname: body.nickname || '',
          birthDate: body.birthDate,
          department: body.department || 'ทั่วไป',
          position: body.position || 'บุคลากร',
          phone: body.phone || '',
          greetingsSentYears: [],
        };
        this.data.birthdays.push(newB);
        this.save();
        return { message: 'บันทึกวันเกิดสำเร็จ', birthday: newB };
      }
    }
    if (pathPart.startsWith('/birthdays/')) {
      const parts = pathPart.split('/');
      const id = parts[2];
      const subAction = parts[3];
      const idx = this.data.birthdays.findIndex((b) => b.id === id);
      const bday = this.data.birthdays[idx];

      if (subAction === 'wish' || subAction === 'send-greeting') {
        if (!bday) {
          return { success: false, message: 'ไม่พบข้อมูลบุคลากรที่ระบุ' };
        }
        const msg = formatBirthdayGreetingMessage(bday, this.data.systemSettings.schoolName);
        const res = await this.dispatchTelegram(msg, 'BIRTHDAY', undefined, undefined, undefined, true);
        return res;
      }
      if (method === 'DELETE' && idx >= 0) {
        this.data.birthdays.splice(idx, 1);
        this.save();
        return { message: 'ลบวันเกิดสำเร็จ' };
      }
      if (method === 'PUT' && idx >= 0) {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
        Object.assign(this.data.birthdays[idx], body);
        this.save();
        return { message: 'แก้ไขวันเกิดสำเร็จ', birthday: this.data.birthdays[idx] };
      }
    }

    // 7. Announcements
    if (pathPart === '/announcements') {
      if (method === 'GET') {
        return { announcements: this.data.announcements };
      }
      if (method === 'POST') {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
        const newAnn: Announcement = {
          id: `ann-${Date.now()}`,
          title: body.title,
          content: body.content,
          priority: body.priority || 'NORMAL',
          showDashboard: body.showDashboard !== false,
          sendTelegram: !!body.sendTelegram,
          startDate: body.startDate || new Date().toISOString().split('T')[0],
          endDate: body.endDate || '2099-12-31',
          status: 'ACTIVE',
          createdBy: 'usr-admin-1',
          createdByName: 'สมศักดิ์ ใจดี',
          createdAt: new Date().toISOString(),
        };
        this.data.announcements.push(newAnn);
        this.save();

        if (newAnn.sendTelegram) {
          const msg = formatAnnouncementMessage(newAnn, this.data.systemSettings.schoolName);
          this.dispatchTelegram(msg, 'ANNOUNCEMENT', undefined, undefined, undefined, true).catch(console.error);
        }

        return { message: 'สร้างประกาศสำเร็จ', announcement: newAnn };
      }
    }
    if (pathPart.startsWith('/announcements/')) {
      const parts = pathPart.split('/');
      const id = parts[2];
      const subAction = parts[3];
      const idx = this.data.announcements.findIndex((a) => a.id === id);
      const ann = this.data.announcements[idx];

      if (subAction === 'broadcast-telegram') {
        if (!ann) return { success: false, message: 'ไม่พบประกาศที่ระบุ' };
        const msg = formatAnnouncementMessage(ann, this.data.systemSettings.schoolName);
        const res = await this.dispatchTelegram(msg, 'ANNOUNCEMENT', undefined, undefined, undefined, true);
        return res;
      }
      if (method === 'DELETE' && idx >= 0) {
        this.data.announcements.splice(idx, 1);
        this.save();
        return { message: 'ลบประกาศสำเร็จ' };
      }
      if (method === 'PUT' && idx >= 0) {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
        Object.assign(this.data.announcements[idx], body);
        this.save();
        return { message: 'แก้ไขประกาศสำเร็จ', announcement: this.data.announcements[idx] };
      }
    }

    // 8. Users
    if (pathPart === '/users') {
      if (method === 'GET') {
        return { users: this.data.users };
      }
      if (method === 'POST') {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
        const newU: User = {
          id: `usr-${Date.now()}`,
          name: body.name,
          surname: body.surname || '',
          username: body.username || `user_${Date.now()}`,
          email: body.email || '',
          department: body.department || 'ทั่วไป',
          position: body.position || 'บุคลากร',
          role: body.role || 'STAFF',
          permissions: body.permissions || ['events.view'],
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        };
        this.data.users.push(newU);
        this.save();
        return { message: 'สร้างผู้ใช้สำเร็จ', user: newU };
      }
    }
    if (pathPart.startsWith('/users/')) {
      const id = pathPart.split('/')[2];
      const idx = this.data.users.findIndex((u) => u.id === id);
      if (method === 'DELETE' && idx >= 0) {
        this.data.users.splice(idx, 1);
        this.save();
        return { message: 'ลบผู้ใช้สำเร็จ' };
      }
      if (method === 'PUT' && idx >= 0) {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
        Object.assign(this.data.users[idx], body);
        this.save();
        return { message: 'แก้ไขผู้ใช้สำเร็จ', user: this.data.users[idx] };
      }
    }

    // 9. Files / Documents
    if (pathPart === '/files') {
      return { files: this.data.attachments };
    }
    if (pathPart === '/files/upload') {
      const att: EventAttachment = {
        id: `att-${Date.now()}`,
        originalName: 'เอกสารแนบ_กิจกรรม.pdf',
        fileName: `file_${Date.now()}.pdf`,
        mimeType: 'application/pdf',
        size: 524288,
        uploadedBy: 'usr-admin-1',
        uploadedByName: 'สมศักดิ์ ใจดี',
        uploadedAt: new Date().toISOString(),
        dataUrl: '#',
      };
      this.data.attachments.push(att);
      this.save();
      return { message: 'อัปโหลดไฟล์สำเร็จ', attachment: att, url: '#' };
    }
    if (pathPart.startsWith('/files/')) {
      const id = pathPart.split('/')[2];
      const idx = this.data.attachments.findIndex((a) => a.id === id);
      if (method === 'DELETE' && idx >= 0) {
        this.data.attachments.splice(idx, 1);
        this.save();
        return { message: 'ลบไฟล์สำเร็จ' };
      }
    }

    // 10. Settings & Telegram
    if (pathPart === '/settings/system') {
      if (method === 'GET') {
        return { systemSettings: this.data.systemSettings };
      }
      if (method === 'PUT') {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
        this.data.systemSettings = { ...this.data.systemSettings, ...body };
        this.save();
        return { message: 'บันทึกการตั้งค่าสำเร็จ', systemSettings: this.data.systemSettings };
      }
    }
    if (pathPart === '/settings/telegram') {
      if (method === 'GET') {
        return { telegram: this.data.telegramSettings, telegramSettings: this.data.telegramSettings };
      }
      if (method === 'PUT') {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
        this.data.telegramSettings = { ...this.data.telegramSettings, ...body };
        this.save();
        return { message: 'บันทึกการตั้งค่า Telegram สำเร็จ', telegram: this.data.telegramSettings, telegramSettings: this.data.telegramSettings };
      }
    }
    if (pathPart === '/settings/telegram/logs') {
      if (method === 'DELETE') {
        this.data.notificationLogs = [];
        this.save();
        return { message: 'ล้างประวัติการส่งข้อความเรียบร้อยแล้ว' };
      }
      return { logs: this.data.notificationLogs };
    }
    if (pathPart === '/settings/telegram/test') {
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
      const msg = formatTestMessage(this.data.systemSettings.schoolName);
      const res = await this.dispatchTelegram(
        msg,
        'SYSTEM_ALERT',
        undefined,
        body.botToken,
        body.chatId,
        true
      );
      return res;
    }
    if (pathPart === '/settings/telegram/broadcast-today-events') {
      const bNow = getBangkokDateTime();
      const todayStr = bNow.dateStr;
      const todayEvents = (this.data.events || []).filter(
        (e) => e.status === 'APPROVED' && e.startDate <= todayStr && e.endDate >= todayStr
      );
      const todaySched = (this.data.dutySchedules || []).find((s) => s.date === todayStr);
      const todayGrp = todaySched ? (this.data.dutyGroups || []).find((g) => g.id === todaySched.groupId) || null : null;
      const todayMMDD = todayStr.substring(5);
      const todayBirthdays = (this.data.birthdays || []).filter((b) => b.birthDate && b.birthDate.endsWith(todayMMDD));
      const msg = formatDailySummaryMessage(
        this.data.events,
        todaySched || null,
        todayGrp || null,
        todayBirthdays,
        this.data.systemSettings.schoolName,
        todayStr
      );
      const res = await this.dispatchTelegram(msg, 'DAILY_SUMMARY', undefined, undefined, undefined, true);
      return { ...res, count: todayEvents.length, message: `ส่งแจ้งเตือนกิจกรรมวันนี้ (${todayEvents.length} รายการ) สำเร็จเรียบร้อยแล้ว` };
    }
    if (pathPart.startsWith('/settings/telegram/broadcast-event/')) {
      const eventId = pathPart.split('/')[4];
      const ev = (this.data.events || []).find((e) => e.id === eventId);
      if (!ev) {
        return { success: false, message: 'ไม่พบกิจกรรมที่ต้องการแจ้งเตือน' };
      }
      const msg = formatEventMessage(ev, this.data.systemSettings.schoolName, '📢 <b>แจ้งเตือนกิจกรรมโรงเรียน</b>');
      const res = await this.dispatchTelegram(msg, 'EVENT_REMINDER', ev.id, undefined, undefined, true);
      return { ...res, message: `ส่งแจ้งเตือนกิจกรรม "${ev.title}" ไปยัง Telegram สำเร็จ` };
    }
    if (pathPart === '/settings/telegram/broadcast-daily' || pathPart === '/settings/telegram/trigger-daily-summary') {
      const todayStr = new Date().toISOString().split('T')[0];
      const todaySched = (this.data.dutySchedules || []).find((s) => s.date === todayStr);
      const todayGrp = todaySched ? (this.data.dutyGroups || []).find((g) => g.id === todaySched.groupId) || null : null;
      const todayMMDD = todayStr.substring(5);
      const todayBirthdays = (this.data.birthdays || []).filter((b) => b.birthDate && b.birthDate.endsWith(todayMMDD));
      const msg = formatDailySummaryMessage(
        this.data.events,
        todaySched || null,
        todayGrp || null,
        todayBirthdays,
        this.data.systemSettings.schoolName,
        todayStr
      );
      const res = await this.dispatchTelegram(msg, 'DAILY_SUMMARY', undefined, undefined, undefined, true);
      return res;
    }
    if (pathPart === '/settings/telegram/broadcast-duty-today') {
      const todayStr = new Date().toISOString().split('T')[0];
      const todaySched = (this.data.dutySchedules || []).find((s) => s.date === todayStr);
      if (!todaySched) {
        return { success: false, message: 'ไม่พบตารางเวรสำหรับวันนี้' };
      }
      const grp = (this.data.dutyGroups || []).find((g) => g.id === todaySched.groupId);
      if (!grp) {
        return { success: false, message: 'ไม่พบชุดเวรสำหรับวันนี้' };
      }
      const msg = formatDutyGroupReminderMessage(todaySched, grp, this.data.systemSettings.schoolName);
      const res = await this.dispatchTelegram(msg, 'DUTY_REMINDER', undefined, undefined, undefined, true);
      return res;
    }
    if (pathPart === '/settings/telegram/broadcast-birthdays-today') {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayMMDD = todayStr.substring(5);
      const todayBirthdays = (this.data.birthdays || []).filter((b) => b.birthDate && b.birthDate.endsWith(todayMMDD));
      if (todayBirthdays.length === 0) {
        return { success: false, message: 'วันนี้ไม่มีบุคลากรที่มีวันคล้ายวันเกิด' };
      }
      let lastRes = { success: true, message: `ส่งคำอวยพรวันเกิดสำเร็จ ${todayBirthdays.length} ท่าน` };
      for (const b of todayBirthdays) {
        const msg = formatBirthdayGreetingMessage(b, this.data.systemSettings.schoolName);
        lastRes = await this.dispatchTelegram(msg, 'BIRTHDAY', undefined, undefined, undefined, true);
      }
      return lastRes;
    }
    if (pathPart === '/settings/telegram/broadcast-duty-advance') {
      const tmr = new Date();
      tmr.setDate(tmr.getDate() + 1);
      const tmrStr = tmr.toISOString().split('T')[0];
      const tmrSched = (this.data.dutySchedules || []).find((s) => s.date === tmrStr);
      if (!tmrSched) {
        return { success: false, message: `ไม่พบตารางเวรสำหรับวันพรุ่งนี้ (${formatThaiDate(tmrStr, { format: 'short' })})` };
      }
      const grp = (this.data.dutyGroups || []).find((g) => g.id === tmrSched.groupId);
      if (!grp) {
        return { success: false, message: 'ไม่พบชุดเวรสำหรับวันพรุ่งนี้' };
      }
      const msg = formatAdvanceDutyReminderMessage(tmrSched, grp, this.data.systemSettings.schoolName);
      const res = await this.dispatchTelegram(msg, 'ADVANCE_DUTY_REMINDER', undefined, undefined, undefined, true);
      return res;
    }
    if (pathPart === '/settings/telegram/check-scheduled' || pathPart === '/scheduler/check' || pathPart === '/scheduler/cron') {
      const body = typeof options.body === 'string' ? JSON.parse(options.body || '{}') : options.body || {};
      const forceAll = !!body.forceAllDue;
      // Trigger check
      const { checkAndDispatchScheduledNotifications } = await import('../utils/schedulerEngine');
      const res = await checkAndDispatchScheduledNotifications(forceAll);
      return res;
    }
    if (pathPart === '/settings/telegram/scheduled-jobs') {
      const { getUpcomingScheduledJobs } = await import('../utils/schedulerEngine');
      const jobs = getUpcomingScheduledJobs();
      return { jobs, total: jobs.length };
    }
    if (pathPart === '/settings/reset-default') {
      const def = this.resetToDefault();
      return { message: 'คืนค่าเริ่มต้นสำเร็จ', systemSettings: def.systemSettings };
    }

    // 11. Logs
    if (pathPart === '/logs' || pathPart === '/logs/activity') {
      return { logs: this.data.activityLogs, total: this.data.activityLogs.length };
    }

    // 12. Search
    if (pathPart === '/search') {
      const q = (params.get('q') || '').toLowerCase();
      const events = this.data.events.filter((e) => e.title.toLowerCase().includes(q) || (e.description && e.description.toLowerCase().includes(q)));
      const announcements = this.data.announcements.filter((a) => a.title.toLowerCase().includes(q));
      const holidays = this.data.holidays.filter((h) => h.name.toLowerCase().includes(q));
      const duties = this.data.dutyGroups.filter((g) => g.name.toLowerCase().includes(q));
      return { events, announcements, holidays, duties };
    }

    // 13. Reports & Analytics
    if (pathPart === '/reports/summary' || pathPart === '/reports/analytics') {
      const year = params.get('year') || new Date().getFullYear().toString();
      const events = this.data.events || [];
      const yearEvents = events.filter((e) => e.startDate && e.startDate.startsWith(String(year)));
      const approvedEvents = yearEvents.filter((e) => e.status === 'APPROVED');
      const pendingEvents = yearEvents.filter((e) => e.status === 'PENDING');
      const rejectedEvents = yearEvents.filter((e) => e.status === 'REJECTED');

      const thaiMonthNames = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
      ];
      const monthlyData = thaiMonthNames.map((name, index) => {
        const monthNum = String(index + 1).padStart(2, '0');
        const count = yearEvents.filter((e) => e.startDate && e.startDate.startsWith(`${year}-${monthNum}`)).length;
        const urgentCount = yearEvents.filter(
          (e) => e.startDate && e.startDate.startsWith(`${year}-${monthNum}`) && e.priority === 'URGENT'
        ).length;
        return { month: name, events: count, total: count, urgent: urgentCount };
      });

      const categoryMap: { [key: string]: { name: string; count: number; color: string } } = {};
      (this.data.categories || []).forEach((cat) => {
        categoryMap[cat.id] = { name: cat.name, count: 0, color: cat.color };
      });
      yearEvents.forEach((e) => {
        if (categoryMap[e.categoryId]) {
          categoryMap[e.categoryId].count++;
        } else {
          categoryMap[e.categoryId] = { name: 'ทั่วไป', count: 1, color: '#3b82f6' };
        }
      });
      const categoryData = Object.values(categoryMap)
        .filter((c) => c.count > 0)
        .map((c) => ({ name: c.name, value: c.count, color: c.color }));

      const deptMap: { [key: string]: number } = {};
      yearEvents.forEach((e) => {
        const dept = e.department || 'ไม่ระบุ';
        deptMap[dept] = (deptMap[dept] || 0) + 1;
      });
      const departmentData = Object.entries(deptMap).map(([dept, count]) => ({ department: dept, count }));
      departmentData.sort((a, b) => b.count - a.count);

      let totalAttachments = (this.data.attachments || []).length;
      (this.data.events || []).forEach((e) => {
        totalAttachments += (e.attachments || []).length;
      });

      const notifLogs = this.data.notificationLogs || [];
      const notifSuccess = notifLogs.filter((l) => l.status === 'SUCCESS').length;
      const notifFailed = notifLogs.filter((l) => l.status === 'FAILED').length;

      return {
        year,
        totalEvents: yearEvents.length,
        approvedEvents: approvedEvents.length,
        pendingEvents: pendingEvents.length,
        rejectedEvents: rejectedEvents.length,
        totalNotifications: notifLogs.length,
        successfulNotifications: notifSuccess,
        failedNotifications: notifFailed,
        totalAttachments,
        monthlyData,
        categoryData,
        departmentData,
        notifications: {
          total: notifLogs.length,
          success: notifSuccess,
          failed: notifFailed,
        },
      };
    }

    // Default fallback
    return { success: true };
  }
}

export const localStore = new LocalStore();
