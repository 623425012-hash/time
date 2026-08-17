// Client-side & Universal Advance Notification Scheduler Engine
// Ensures scheduled advance notifications (1 day before, 3 days before, morning summary, duty reminders, etc.)
// trigger accurately according to dates & times on Vercel, Serverless, and in-browser environments.

import { localStore } from '../api/localStore';
import { SchoolEvent, TelegramSettings, ScheduledJobItem } from '../types';
import { formatThaiDate, getBangkokDateTime } from './thaiDate';

export interface TimingConfig {
  key: string;
  label: string;
  daysOffset?: number;
  minutesOffset?: number;
  useMorningTime: boolean;
}

export const NOTIFICATION_TIMINGS: Record<string, TimingConfig> = {
  '7_DAYS_BEFORE': {
    key: '7_DAYS_BEFORE',
    label: 'เตือนล่วงหน้า 7 วัน (1 สัปดาห์)',
    daysOffset: -7,
    useMorningTime: true,
  },
  '3_DAYS_BEFORE': {
    key: '3_DAYS_BEFORE',
    label: 'เตือนล่วงหน้า 3 วัน',
    daysOffset: -3,
    useMorningTime: true,
  },
  '2_DAYS_BEFORE': {
    key: '2_DAYS_BEFORE',
    label: 'เตือนล่วงหน้า 2 วัน',
    daysOffset: -2,
    useMorningTime: true,
  },
  '1_DAY_BEFORE': {
    key: '1_DAY_BEFORE',
    label: 'เตือนล่วงหน้า 1 วัน',
    daysOffset: -1,
    useMorningTime: true,
  },
  'SAME_DAY_MORNING': {
    key: 'SAME_DAY_MORNING',
    label: 'เตือนเช้าวันจัดกิจกรรม (06:00 น.)',
    daysOffset: 0,
    useMorningTime: true,
  },
  '3_HOURS_BEFORE': {
    key: '3_HOURS_BEFORE',
    label: 'เตือนก่อนเริ่ม 3 ชั่วโมง',
    minutesOffset: -180,
    useMorningTime: false,
  },
  '1_HOUR_BEFORE': {
    key: '1_HOUR_BEFORE',
    label: 'เตือนก่อนเริ่ม 1 ชั่วโมง',
    minutesOffset: -60,
    useMorningTime: false,
  },
  '30_MIN_BEFORE': {
    key: '30_MIN_BEFORE',
    label: 'เตือนก่อนเริ่ม 30 นาที',
    minutesOffset: -30,
    useMorningTime: false,
  },
  'ON_START': {
    key: 'ON_START',
    label: 'เตือนเมื่อถึงเวลาเริ่มกิจกรรม',
    minutesOffset: 0,
    useMorningTime: false,
  },
};

/**
 * Calculates the exact trigger Date for an event and timing key.
 */
export function calculateEventTriggerDate(
  event: SchoolEvent,
  timingKey: string,
  advanceNotificationTime = '06:00'
): Date | null {
  const config = NOTIFICATION_TIMINGS[timingKey];
  if (!config) return null;

  try {
    const [startYear, startMonth, startDay] = event.startDate.split('-').map(Number);
    const eventTimeStr = event.isAllDay ? '08:30' : event.startTime || '08:30';
    const [startH, startM] = eventTimeStr.split(':').map(Number);

    if (config.useMorningTime) {
      // Day-offset based reminder, triggers at morning advance time
      const [advH, advM] = (advanceNotificationTime || '06:00').split(':').map(Number);
      const targetDate = new Date(startYear, startMonth - 1, startDay, advH || 6, advM || 0, 0, 0);
      if (config.daysOffset) {
        targetDate.setDate(targetDate.getDate() + config.daysOffset);
      }
      return targetDate;
    } else {
      // Minute-offset based reminder relative to exact event start time
      const exactStartDate = new Date(startYear, startMonth - 1, startDay, startH, startM, 0, 0);
      if (config.minutesOffset !== undefined) {
        exactStartDate.setMinutes(exactStartDate.getMinutes() + config.minutesOffset);
      }
      return exactStartDate;
    }
  } catch (err) {
    console.error('Error calculating trigger date:', err);
    return null;
  }
}

/**
 * Computes list of upcoming and pending scheduled notification jobs for visualization and inspection.
 */
export function getUpcomingScheduledJobs(): ScheduledJobItem[] {
  const data = localStore.getData();
  const settings = data.telegramSettings || ({} as TelegramSettings);
  const sentMap = settings.sentAdvanceReminders || {};
  const advanceTime = settings.advanceNotificationTime || settings.dailySummaryTime || '06:00';
  const bNow = getBangkokDateTime();
  const nowMs = bNow.timestamp;
  const jobs: ScheduledJobItem[] = [];

  // 1. Events Advance Notifications
  const approvedEvents = (data.events || []).filter((e) => e.status === 'APPROVED' && e.sendTelegram);

  for (const ev of approvedEvents) {
    const notifyList = ev.notifySchedule && ev.notifySchedule.length > 0
      ? ev.notifySchedule
      : ['SAME_DAY_MORNING'];

    for (const timing of notifyList) {
      const config = NOTIFICATION_TIMINGS[timing];
      if (!config) continue;

      const triggerDate = calculateEventTriggerDate(ev, timing, advanceTime);
      if (!triggerDate) continue;

      const reminderKey = `event_${ev.id}_${timing}_${ev.startDate}`;
      const isSent = !!sentMap[reminderKey] || (data.notificationLogs || []).some(
        (l) => l.eventId === ev.id && l.content?.includes(`[${timing}]`)
      );

      const diffMs = triggerDate.getTime() - nowMs;
      let status: ScheduledJobItem['status'] = 'PENDING';
      let isDue = false;

      if (isSent) {
        status = 'SENT';
      } else if (diffMs <= 0) {
        // Event ended?
        const [endYear, endMonth, endDay] = ev.endDate.split('-').map(Number);
        const [endH, endM] = (ev.endTime || '16:30').split(':').map(Number);
        const eventEndDate = new Date(endYear, endMonth - 1, endDay, endH, endM, 0, 0);
        if (nowMs > eventEndDate.getTime() + 30 * 60 * 1000) {
          continue; // skip expired past events
        }
        status = 'DUE_NOW';
        isDue = true;
      }

      const hours = String(triggerDate.getHours()).padStart(2, '0');
      const mins = String(triggerDate.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${mins}`;
      const y = triggerDate.getFullYear();
      const m = String(triggerDate.getMonth() + 1).padStart(2, '0');
      const d = String(triggerDate.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const trigStr = `${dateStr} ${timeStr}:00`;

      jobs.push({
        id: reminderKey,
        title: ev.title,
        categoryName: 'กิจกรรมโรงเรียน',
        type: 'EVENT_ADVANCE',
        targetDate: dateStr,
        targetTime: timeStr,
        timingLabel: config.label,
        scheduledDateTime: trigStr,
        triggerDateTime: trigStr,
        status,
        isSent,
        isDue,
        details: `กำหนดจัด: ${formatThaiDate(ev.startDate, { format: 'short' })} (${ev.startTime || '08:30'} น.)`,
      });
    }
  }

  // 2. Daily Summary Job for today
  const todayStr = bNow.dateStr;
  const summaryTime = settings.dailySummaryTime || '06:00';
  const summarySent = settings.lastDailySummaryDate === todayStr;
  const summaryDue = bNow.timeStr >= summaryTime && !summarySent;

  jobs.push({
    id: `daily_summary_${todayStr}`,
    title: `สรุปกิจกรรมและภารกิจประจำวัน (${formatThaiDate(todayStr, { format: 'short' })})`,
    categoryName: 'สรุปประจำวัน',
    type: 'DAILY_SUMMARY',
    targetDate: todayStr,
    targetTime: summaryTime,
    timingLabel: `ทุกวัน เวลา ${summaryTime} น.`,
    scheduledDateTime: `${todayStr} ${summaryTime}:00`,
    triggerDateTime: `${todayStr} ${summaryTime}:00`,
    status: summarySent ? 'SENT' : summaryDue ? 'DUE_NOW' : 'PENDING',
    isSent: summarySent,
    isDue: summaryDue,
    details: 'รวบรวมกิจกรรมประจำวัน ตารางครูเวร และวันเกิดบุคลากร',
  });

  // 3. Today Duty Reminder
  const dutyTime = settings.dutyReminderTime || '06:00';
  const todayDutySchedule = (data.dutySchedules || []).find((s) => s.date === todayStr);
  if (todayDutySchedule) {
    const group = (data.dutyGroups || []).find((g) => g.id === todayDutySchedule.groupId);
    const dutySent = settings.lastDutyReminderDate === todayStr;
    const dutyDue = bNow.timeStr >= dutyTime && !dutySent;
    jobs.push({
      id: `duty_today_${todayStr}`,
      title: `แจ้งเตือนครูเวรประจำวัน (${group?.name || 'ชุดเวร'})`,
      categoryName: 'ตารางครูเวร',
      type: 'DUTY_TODAY',
      targetDate: todayStr,
      targetTime: dutyTime,
      timingLabel: `ทุกวัน เวลา ${dutyTime} น.`,
      scheduledDateTime: `${todayStr} ${dutyTime}:00`,
      triggerDateTime: `${todayStr} ${dutyTime}:00`,
      status: dutySent ? 'SENT' : dutyDue ? 'DUE_NOW' : 'PENDING',
      isSent: dutySent,
      isDue: dutyDue,
      details: group ? `สมาชิก ${group.members?.length || 0} คน` : undefined,
    });
  }

  // 4. Advance Duty Reminder (Tomorrow's Duty Group)
  if (settings.advanceDutyReminder !== false) {
    const tmrDateObj = new Date(bNow.timestamp + 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000);
    const tmrStr = `${tmrDateObj.getUTCFullYear()}-${String(tmrDateObj.getUTCMonth() + 1).padStart(2, '0')}-${String(tmrDateObj.getUTCDate()).padStart(2, '0')}`;
    const tmrDutySchedule = (data.dutySchedules || []).find((s) => s.date === tmrStr);
    if (tmrDutySchedule) {
      const tmrGroup = (data.dutyGroups || []).find((g) => g.id === tmrDutySchedule.groupId);
      const advDutyTime = settings.advanceDutyReminderTime || '17:00';
      const advSent = settings.lastAdvanceDutyReminderDate === tmrStr;
      const advDue = bNow.timeStr >= advDutyTime && !advSent;
      jobs.push({
        id: `duty_advance_${tmrStr}`,
        title: `เตือนครูเวรวันพรุ่งนี้ล่วงหน้า (${tmrGroup?.name || 'ชุดเวร'})`,
        categoryName: 'ตารางครูเวรล่วงหน้า',
        type: 'DUTY_ADVANCE',
        targetDate: todayStr,
        targetTime: advDutyTime,
        timingLabel: `วันก่อนหน้า เวลา ${advDutyTime} น.`,
        scheduledDateTime: `${todayStr} ${advDutyTime}:00`,
        triggerDateTime: `${todayStr} ${advDutyTime}:00`,
        status: advSent ? 'SENT' : advDue ? 'DUE_NOW' : 'PENDING',
        isSent: advSent,
        isDue: advDue,
        details: `เตรียมความพร้อมสำหรับเวรวันที่ ${formatThaiDate(tmrStr, { format: 'short' })}`,
      });
    }
  }

  // Sort by scheduledDateTime
  jobs.sort((a, b) => a.scheduledDateTime.localeCompare(b.scheduledDateTime));

  return jobs;
}

/**
 * Main Check & Dispatch routine
 * Iterates all scheduled alerts, checks if due, and dispatches them directly.
 */
export async function checkAndDispatchScheduledNotifications(forceAllDue = false): Promise<{
  success: boolean;
  dispatchedCount: number;
  dispatchedItems: string[];
  message: string;
}> {
  const data = localStore.getData();
  const settings = data.telegramSettings;

  if (!settings || !settings.enabled) {
    return {
      success: false,
      dispatchedCount: 0,
      dispatchedItems: [],
      message: 'ระบบแจ้งเตือน Telegram ถูกปิดการใช้งานอยู่ (กรุณาเปิดใช้งานในการตั้งค่า)',
    };
  }

  if (!settings.botToken || !settings.chatId) {
    return {
      success: false,
      dispatchedCount: 0,
      dispatchedItems: [],
      message: 'ยังไม่ได้ระบุ Telegram Bot Token หรือ Chat ID',
    };
  }

  if (!settings.sentAdvanceReminders) {
    settings.sentAdvanceReminders = {};
  }

  const bNow = getBangkokDateTime();
  const todayStr = bNow.dateStr;
  const currentTimeStr = bNow.timeStr;
  const nowMs = bNow.timestamp;

  const advanceTime = settings.advanceNotificationTime || settings.dailySummaryTime || '06:00';
  const dispatchedItems: string[] = [];

  // ==========================================
  // 1. Advance Event Reminders Check
  // ==========================================
  const approvedEvents = (data.events || []).filter((e) => e.status === 'APPROVED' && e.sendTelegram);

  for (const event of approvedEvents) {
    const notifyList = event.notifySchedule && event.notifySchedule.length > 0
      ? event.notifySchedule
      : ['SAME_DAY_MORNING'];

    // Check if event has ended completely
    const [endYear, endMonth, endDay] = event.endDate.split('-').map(Number);
    const [endH, endM] = (event.endTime || '16:30').split(':').map(Number);
    const eventEndDate = new Date(endYear, endMonth - 1, endDay, endH, endM, 0, 0);

    if (nowMs > eventEndDate.getTime() + 30 * 60 * 1000 && !forceAllDue) {
      continue;
    }

    for (const timing of notifyList) {
      const config = NOTIFICATION_TIMINGS[timing];
      if (!config) continue;

      const triggerDate = calculateEventTriggerDate(event, timing, advanceTime);
      if (!triggerDate) continue;

      const reminderKey = `event_${event.id}_${timing}_${event.startDate}`;
      const isAlreadySent = !!settings.sentAdvanceReminders[reminderKey];

      if (isAlreadySent && !forceAllDue) continue;

      // Determine if time has reached
      const isDue = nowMs >= triggerDate.getTime();

      if (isDue || forceAllDue) {
        console.log(`[SchedulerEngine] Triggering advance alert [${timing}] for event: ${event.title}`);
        const header = `⏰ <b>แจ้งเตือนกิจกรรม: ${config.label}</b>`;
        const res = await localStore.dispatchTelegram(
          'EVENT_REMINDER',
          { event, customHeader: header, timingLabel: config.label },
          event.id
        );

        if (res.success) {
          settings.sentAdvanceReminders[reminderKey] = new Date().toISOString();
          dispatchedItems.push(`กิจกรรม "${event.title}" (${config.label})`);
        }
      }
    }
  }

  // ==========================================
  // 2. Daily Summary Check
  // ==========================================
  const summaryEnabled = settings.notifyDailySummary !== false && (settings as any).dailySummary !== false;
  const summaryTime = settings.dailySummaryTime || '06:00';

  if (summaryEnabled && (settings.lastDailySummaryDate !== todayStr || forceAllDue)) {
    if (currentTimeStr >= summaryTime || forceAllDue) {
      console.log(`[SchedulerEngine] Triggering Daily Summary for ${todayStr}`);
      const res = await localStore.dispatchTelegram('DAILY_SUMMARY', { dateStr: todayStr });
      if (res.success) {
        settings.lastDailySummaryDate = todayStr;
        dispatchedItems.push(`สรุปกิจกรรมประจำวัน (${todayStr})`);
      }
    }
  }

  // ==========================================
  // 3. Today's Duty Group Reminder Check
  // ==========================================
  const dutyTime = settings.dutyReminderTime || '06:00';
  if (settings.lastDutyReminderDate !== todayStr || forceAllDue) {
    if (currentTimeStr >= dutyTime || forceAllDue) {
      const todaySchedule = (data.dutySchedules || []).find((s) => s.date === todayStr);
      if (todaySchedule) {
        const dutyGroup = (data.dutyGroups || []).find((g) => g.id === todaySchedule.groupId);
        if (dutyGroup) {
          console.log(`[SchedulerEngine] Triggering Today's Duty Reminder for ${dutyGroup.name}`);
          const res = await localStore.dispatchTelegram('DUTY_REMINDER', { schedule: todaySchedule, group: dutyGroup });
          if (res.success) {
            settings.lastDutyReminderDate = todayStr;
            dispatchedItems.push(`ครูเวรประจำวัน "${dutyGroup.name}" (${todayStr})`);
          }
        }
      }
    }
  }

  // ==========================================
  // 4. Advance Duty Reminder Check (Tomorrow's Duty)
  // ==========================================
  if (settings.advanceDutyReminder !== false) {
    const tmrDateObj = new Date(bNow.timestamp + 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000);
    const tmrStr = `${tmrDateObj.getUTCFullYear()}-${String(tmrDateObj.getUTCMonth() + 1).padStart(2, '0')}-${String(tmrDateObj.getUTCDate()).padStart(2, '0')}`;
    const advDutyTime = settings.advanceDutyReminderTime || '17:00';

    if (settings.lastAdvanceDutyReminderDate !== tmrStr || forceAllDue) {
      if (currentTimeStr >= advDutyTime || forceAllDue) {
        const tmrSchedule = (data.dutySchedules || []).find((s) => s.date === tmrStr);
        if (tmrSchedule) {
          const tmrGroup = (data.dutyGroups || []).find((g) => g.id === tmrSchedule.groupId);
          if (tmrGroup) {
            console.log(`[SchedulerEngine] Triggering Advance Duty Reminder for tomorrow: ${tmrGroup.name}`);
            const res = await localStore.dispatchTelegram('ADVANCE_DUTY_REMINDER', { schedule: tmrSchedule, group: tmrGroup });
            if (res.success) {
              settings.lastAdvanceDutyReminderDate = tmrStr;
              dispatchedItems.push(`เตือนครูเวรวันพรุ่งนี้ล่วงหน้า "${tmrGroup.name}"`);
            }
          }
        }
      }
    }
  }

  // ==========================================
  // 5. Birthday Greetings Check
  // ==========================================
  const bdayTime = settings.birthdayGreetingTime || '06:00';
  if (currentTimeStr >= bdayTime || forceAllDue) {
    const todayMMDD = `${bNow.month}-${bNow.day}`;
    for (const bday of data.birthdays || []) {
      if (bday.birthDate && bday.birthDate.endsWith(todayMMDD)) {
        if (!bday.greetingsSentYears) bday.greetingsSentYears = [];
        if (!bday.greetingsSentYears.includes(bNow.year) || forceAllDue) {
          console.log(`[SchedulerEngine] Triggering Birthday Greeting for ${bday.name}`);
          const res = await localStore.dispatchTelegram('BIRTHDAY', { birthday: bday });
          if (res.success) {
            if (!bday.greetingsSentYears.includes(bNow.year)) {
              bday.greetingsSentYears.push(bNow.year);
            }
            dispatchedItems.push(`อวยพรวันเกิดคุณ ${bday.name}`);
          }
        }
      }
    }
  }

  // Save changes
  localStore.save();

  if (dispatchedItems.length > 0) {
    return {
      success: true,
      dispatchedCount: dispatchedItems.length,
      dispatchedItems,
      message: `ส่งการแจ้งเตือนตามกำหนดเวลาสำเร็จ ${dispatchedItems.length} รายการ: ${dispatchedItems.join(', ')}`,
    };
  }

  return {
    success: true,
    dispatchedCount: 0,
    dispatchedItems: [],
    message: 'ตรวจสอบแล้ว ไม่มีรายการแจ้งเตือนที่ถึงกำหนดในรอบนี้ (ระบบจะตรวจสอบให้อัตโนมัติทุก 30 วินาที)',
  };
}

// ----------------------------------------------------
// Background Scheduler Lifecycle Runner (Browser & App)
// ----------------------------------------------------

let schedulerInterval: any = null;
let isCheckingRunning = false;

export function startBackgroundScheduler(onTick?: (result: any) => void) {
  if (typeof window === 'undefined') return;

  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }

  const runCheck = async () => {
    if (isCheckingRunning) return;
    isCheckingRunning = true;
    try {
      const result = await checkAndDispatchScheduledNotifications();
      if (result.dispatchedCount > 0 && onTick) {
        onTick(result);
      }
    } catch (e) {
      console.warn('[SchedulerRunner Error]:', e);
    } finally {
      isCheckingRunning = false;
    }
  };

  // Run initial check after 3 seconds, then every 30 seconds
  setTimeout(runCheck, 3000);
  schedulerInterval = setInterval(runCheck, 30 * 1000);

  // Also listen for document visibility change (runs when tab is reopened or screen unlocked)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      runCheck();
    }
  });

  console.log('[SchedulerEngine] Client background scheduler ticker initialized');
}
