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
  passwordHash: string;
  department: string;
  position: string;
  role: UserRole;
  permissions: UserPermission[];
  status: 'ACTIVE' | 'INACTIVE';
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
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
  dataUrl?: string; // base64 or stored URL
}

export interface SchoolEvent {
  id: string;
  title: string;
  categoryId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
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
  notifySchedule: string[]; // e.g. ['IMMEDIATE', '3_DAYS_BEFORE', '1_DAY_BEFORE', '3_HOURS_BEFORE', '1_HOUR_BEFORE', 'ON_START']
  sendTelegram: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventCategory {
  id: string;
  name: string;
  color: string;
  textColor?: string;
  icon?: string;
  isSystem?: boolean;
}

export type HolidayType = 'HOLIDAY' | 'IMPORTANT_DAY' | 'SCHOOL_DAY';

export interface ThaiHoliday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  type: HolidayType;
  description?: string;
  year: number;
  color?: string;
}

export interface DutyMember {
  id: string;
  name: string;
  department?: string;
  position?: string;
  phone?: string;
  roleInGroup?: 'LEADER' | 'MEMBER';
}

export interface DutyGroup {
  id: string;
  name: string; // e.g. "ชุดเวรที่ 1", "ชุดที่ 1"
  code?: string;
  color: string;
  description?: string;
  responsibilities: string[];
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
  date: string; // YYYY-MM-DD
  dutyType: string; // e.g. "ครูเวรประจำวัน", "เวรหน้าประตู", "เวรอนามัย"
  staffId?: string;
  staffName: string;
  department: string;
  phone?: string;
  notes?: string;
  shiftTime: 'MORNING' | 'AFTERNOON' | 'ALL_DAY';
  status: 'PENDING' | 'COMPLETED' | 'ABSENT';
  createdAt: string;
}

export interface StaffBirthday {
  id: string;
  name: string;
  nickname?: string;
  birthDate: string; // YYYY-MM-DD
  department: string;
  position: string;
  phone?: string;
  profileImage?: string;
  greetingsSentYears?: number[];
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  image?: string;
  file?: EventAttachment;
  priority: EventPriority;
  showDashboard: boolean;
  sendTelegram: boolean;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface TelegramSettings {
  botToken: string;
  chatId: string;
  enabled: boolean;
  notifyOnCreate: boolean;
  notifyOnApprove: boolean;
  notifyOnChange: boolean;
  notifyDailySummary: boolean;
  dailySummaryTime: string; // e.g. "07:00"
  dutyReminderTime?: string; // e.g. "06:30" or "07:00"
  advanceDutyReminder?: boolean; // แจ้งเตือนครูเวรล่วงหน้า 1 วัน
  advanceDutyReminderTime?: string; // e.g. "17:00"
  birthdayGreetingTime?: string; // e.g. "07:00"
  advanceNotificationTime?: string; // e.g. "07:00"
  notifyAdvanceDays?: number[];
  defaultNotifyTimes: string[];
  lastDailySummaryDate?: string;
  lastDutyReminderDate?: string;
  lastAdvanceDutyReminderDate?: string;
  sentAdvanceReminders?: { [reminderKey: string]: string };
}

export interface NotificationLog {
  id: string;
  eventId?: string;
  type: 'EVENT_NEW' | 'EVENT_APPROVED' | 'EVENT_REMINDER' | 'EVENT_CHANGED' | 'DAILY_SUMMARY' | 'BIRTHDAY' | 'DUTY_REMINDER' | 'ANNOUNCEMENT' | 'TEST';
  recipient: string;
  content: string;
  sentAt: string;
  status: 'SUCCESS' | 'FAILED';
  errorMessage?: string;
}

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
  action: ActivityAction;
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

export interface DatabaseSchema {
  users: User[];
  categories: EventCategory[];
  events: SchoolEvent[];
  holidays: ThaiHoliday[];
  duties: DutyRoster[];
  dutyGroups?: DutyGroup[];
  dutySchedules?: DutySchedule[];
  birthdays: StaffBirthday[];
  announcements: Announcement[];
  telegramSettings: TelegramSettings;
  notificationLogs: NotificationLog[];
  activityLogs: ActivityLog[];
  systemSettings: SystemSettings;
}
