export type UserRole = 'ADMIN' | 'STAFF' | 'VIEWER';

export type UserPermission =
  | 'events.view'
  | 'events.create'
  | 'events.edit'
  | 'events.delete'
  | 'events.approve'
  | 'holidays.manage'
  | 'duties.manage'
  | 'birthdays.manage'
  | 'announcements.create'
  | 'announcements.manage'
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'settings.manage'
  | 'telegram.manage'
  | 'reports.view'
  | 'logs.view';

export interface User {
  id: string;
  name: string;
  surname: string;
  username: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
  role: UserRole;
  permissions: UserPermission[];
  status: 'ACTIVE' | 'INACTIVE';
  profileImage?: string;
  createdAt: string;
  updatedAt?: string;
}

export type EventPriority = 'NORMAL' | 'IMPORTANT' | 'URGENT';
export type EventStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type EventRecurrence = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface EventAttachment {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  createdAt?: string;
  dataUrl?: string;
}

export interface SchoolEvent {
  id: string;
  title: string;
  categoryId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  location: string;
  description: string;
  coordinator: string;
  department: string;
  targetGroup: string;
  priority: EventPriority;
  status: EventStatus;
  rejectionReason?: string;
  attachments: EventAttachment[];
  recurrence: EventRecurrence;
  recurrenceEndDate?: string;
  notifySchedule: string[];
  sendTelegram: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EventCategory {
  id: string;
  name: string;
  color: string;
  textColor?: string;
  icon?: string;
  isSystem?: boolean;
}

export type HolidayType = 'HOLIDAY' | 'IMPORTANT_DAY' | 'OBSERVANCE' | 'SCHOOL_SPECIAL' | 'SCHOOL_DAY';

export interface ThaiHoliday {
  id: string;
  date: string;
  name: string;
  type: HolidayType;
  description?: string;
  year?: number;
  color?: string;
  isCustom?: boolean;
}

export interface DutyMember {
  id: string;
  name: string;
  department?: string;
  position?: string;
  phone?: string;
  roleInGroup?: 'LEADER' | 'MEMBER'; // หัวหน้าชุด / สมาชิก
}

export interface DutyGroup {
  id: string;
  name: string; // e.g. "ชุดเวรที่ 1", "ชุดที่ 1"
  code?: string; // e.g. "GROUP-1"
  color: string; // e.g. "#3b82f6"
  description?: string;
  responsibilities: string[]; // ['ดูแลความเรียบร้อย', 'ดูแลความปลอดภัยนักเรียนบริเวณประตูโรงเรียน', 'ตรวจสอบพื้นที่และอาคารเรียน', 'ปฏิบัติหน้าที่ตามที่ได้รับมอบหมาย']
  members: DutyMember[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DutySchedule {
  id: string;
  date: string; // YYYY-MM-DD
  groupId: string; // references DutyGroup.id
  groupName?: string;
  groupColor?: string;
  membersSnapshot?: DutyMember[];
  customResponsibilities?: string[];
  notes?: string;
  shift?: 'MORNING' | 'AFTERNOON' | 'ALL_DAY';
  status: 'PENDING' | 'COMPLETED' | 'ABSENT';
  checkedInMembers?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DutyRoster {
  id: string;
  date: string;
  dutyType?: string;
  type?: string;
  staffId?: string;
  teacherId?: string;
  staffName?: string;
  teacherName?: string;
  department?: string;
  location?: string;
  phone?: string;
  notes?: string;
  shiftTime?: 'MORNING' | 'AFTERNOON' | 'ALL_DAY';
  shift?: 'MORNING' | 'AFTERNOON' | 'ALL_DAY';
  status: 'PENDING' | 'COMPLETED' | 'ABSENT';
  createdAt?: string;
}

export interface StaffBirthday {
  id: string;
  name: string;
  nickname?: string;
  birthDate: string;
  department: string;
  position: string;
  phone?: string;
  customWish?: string;
  profileImage?: string;
  greetingsSentYears?: number[];
  createdAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type?: 'GENERAL' | 'URGENT' | 'EVENT';
  priority?: EventPriority;
  isPinned?: boolean;
  expiresAt?: string;
  targetRole?: 'ALL' | 'TEACHER' | 'STUDENT' | 'PARENT';
  image?: string;
  file?: EventAttachment;
  attachments?: EventAttachment[];
  showDashboard?: boolean;
  sendTelegram?: boolean;
  startDate?: string;
  endDate?: string;
  status?: 'ACTIVE' | 'ARCHIVED';
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export type SchoolAnnouncement = Announcement;

export interface TelegramSettings {
  botToken?: string;
  botTokenMasked?: string;
  chatId: string;
  enabled: boolean;
  notifyOnCreate: boolean;
  notifyOnApprove: boolean;
  notifyOnChange: boolean;
  dailySummary?: boolean;
  notifyDailySummary?: boolean;
  dailySummaryTime: string; // e.g. "07:00"
  dutyReminderTime?: string; // e.g. "06:30" or "07:00"
  advanceDutyReminder?: boolean; // แจ้งเตือนครูเวรล่วงหน้า 1 วัน
  advanceDutyReminderTime?: string; // e.g. "17:00"
  birthdayGreetingTime?: string; // e.g. "07:00"
  advanceNotificationTime?: string; // เวลาส่งแจ้งเตือนกิจกรรมล่วงหน้าของแต่ละวัน e.g. "07:00"
  notifyAdvanceDays?: number[];
  defaultNotifyTimes?: string[];
  lastDailySummaryDate?: string;
  lastDutyReminderDate?: string;
  lastAdvanceDutyReminderDate?: string;
  sentAdvanceReminders?: { [reminderKey: string]: string };
}

export interface ScheduledJobItem {
  id: string;
  title: string;
  categoryName?: string;
  type: 'EVENT_ADVANCE' | 'DAILY_SUMMARY' | 'DUTY_TODAY' | 'DUTY_ADVANCE' | 'BIRTHDAY';
  targetDate: string;
  targetTime: string;
  timingLabel: string;
  scheduledDateTime: string;
  status: 'PENDING' | 'SENT' | 'DUE_NOW';
  details?: string;
}

export interface NotificationLog {
  id: string;
  eventId?: string;
  type: string;
  recipient?: string;
  content?: string;
  message?: string;
  timestamp?: string;
  sentAt?: string;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
  errorMessage?: string;
}

export type TelegramLog = NotificationLog;

export type ActivityAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE_EVENT'
  | 'UPDATE_EVENT'
  | 'DELETE_EVENT'
  | 'APPROVE_EVENT'
  | 'REJECT_EVENT'
  | 'UPLOAD_FILE'
  | 'DOWNLOAD_FILE'
  | 'SEND_TELEGRAM'
  | 'UPDATE_SETTINGS'
  | 'CREATE_DUTY'
  | 'DELETE_DUTY'
  | 'CREATE_HOLIDAY'
  | 'DELETE_HOLIDAY'
  | 'RESTORE_HOLIDAYS'
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'DELETE_USER';

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: ActivityAction | string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SystemSettings {
  schoolName: string;
  schoolMotto?: string;
  schoolShortName?: string;
  schoolLogoUrl?: string;
  enableDemoMode?: boolean;
  academicYear: string;
  semester: string;
  primaryColor: string;
  secondaryColor: string;
  sidebarColor: string;
  headerColor?: string;
  presetTheme?: string;
  allowSelfRegistration?: boolean;
  defaultEventApprovalRequired?: boolean;
}

export type ActiveNavTab =
  | 'dashboard'
  | 'calendar'
  | 'approvals'
  | 'event-manager'
  | 'announcements'
  | 'holidays'
  | 'duties'
  | 'birthdays'
  | 'telegram'
  | 'documents'
  | 'reports'
  | 'users'
  | 'settings'
  | 'logs'
  | 'login';
