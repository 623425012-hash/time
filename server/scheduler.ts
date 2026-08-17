import { db } from './db';
import { TelegramService } from './telegram';
import { getBangkokNow, getBangkokTimestamp } from './timeUtils';

export const NOTIFICATION_TIMINGS: Record<
  string,
  { label: string; daysOffset?: number; minutesOffset?: number; useMorningTime: boolean }
> = {
  '7_DAYS_BEFORE': { label: 'เตือนล่วงหน้า 7 วัน (1 สัปดาห์)', daysOffset: -7, useMorningTime: true },
  '3_DAYS_BEFORE': { label: 'เตือนล่วงหน้า 3 วัน', daysOffset: -3, useMorningTime: true },
  '2_DAYS_BEFORE': { label: 'เตือนล่วงหน้า 2 วัน', daysOffset: -2, useMorningTime: true },
  '1_DAY_BEFORE': { label: 'เตือนล่วงหน้า 1 วัน', daysOffset: -1, useMorningTime: true },
  'SAME_DAY_MORNING': { label: 'เตือนเช้าวันจัดกิจกรรม (06:00 น.)', daysOffset: 0, useMorningTime: true },
  '3_HOURS_BEFORE': { label: 'เตือนก่อนเริ่ม 3 ชั่วโมง', minutesOffset: -180, useMorningTime: false },
  '1_HOUR_BEFORE': { label: 'เตือนก่อนเริ่ม 1 ชั่วโมง', minutesOffset: -60, useMorningTime: false },
  '30_MIN_BEFORE': { label: 'เตือนก่อนเริ่ม 30 นาที', minutesOffset: -30, useMorningTime: false },
  'ON_START': { label: 'เตือนเมื่อถึงเวลาเริ่มกิจกรรม', minutesOffset: 0, useMorningTime: false },
};

/**
 * Calculates epoch timestamp for an event reminder timing in Bangkok timezone (UTC+7)
 */
export function calculateEventTriggerTimestamp(
  event: any,
  timingKey: string,
  morningTime = '06:00'
): number | null {
  const config = NOTIFICATION_TIMINGS[timingKey];
  if (!config) return null;

  try {
    const [startYear, startMonth, startDay] = event.startDate.split('-').map(Number);
    const eventTimeStr = event.isAllDay ? '08:30' : event.startTime || '08:30';
    const [startH, startM] = eventTimeStr.split(':').map(Number);

    if (config.useMorningTime) {
      const [advH, advM] = (morningTime || '06:00').split(':').map(Number);
      // Construct date object for target day
      const targetDate = new Date(startYear, startMonth - 1, startDay, advH || 6, advM || 0, 0, 0);
      if (config.daysOffset) {
        targetDate.setDate(targetDate.getDate() + config.daysOffset);
      }
      const tYear = targetDate.getFullYear();
      const tMonth = String(targetDate.getMonth() + 1).padStart(2, '0');
      const tDay = String(targetDate.getDate()).padStart(2, '0');
      const tHour = String(targetDate.getHours()).padStart(2, '0');
      const tMin = String(targetDate.getMinutes()).padStart(2, '0');

      return getBangkokTimestamp(`${tYear}-${tMonth}-${tDay}`, `${tHour}:${tMin}`);
    } else {
      // Relative minutes to start time
      const exactStartDate = new Date(startYear, startMonth - 1, startDay, startH, startM, 0, 0);
      if (config.minutesOffset !== undefined) {
        exactStartDate.setMinutes(exactStartDate.getMinutes() + config.minutesOffset);
      }
      const tYear = exactStartDate.getFullYear();
      const tMonth = String(exactStartDate.getMonth() + 1).padStart(2, '0');
      const tDay = String(exactStartDate.getDate()).padStart(2, '0');
      const tHour = String(exactStartDate.getHours()).padStart(2, '0');
      const tMin = String(exactStartDate.getMinutes()).padStart(2, '0');

      return getBangkokTimestamp(`${tYear}-${tMonth}-${tDay}`, `${tHour}:${tMin}`);
    }
  } catch {
    return null;
  }
}

export interface ScheduledJobView {
  id: string;
  title: string;
  categoryName?: string;
  type: 'EVENT_ADVANCE' | 'DAILY_SUMMARY' | 'DUTY_TODAY' | 'DUTY_ADVANCE' | 'BIRTHDAY';
  targetDate: string;
  targetTime: string;
  timingLabel: string;
  scheduledDateTime: string;
  triggerDateTime: string;
  status: 'PENDING' | 'SENT' | 'DUE_NOW';
  isSent: boolean;
  isDue: boolean;
  details?: string;
}

class NotificationScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isChecking = false;

  public start(): void {
    if (this.timer) return;
    console.log('[Scheduler] Background notification scheduler started (Asia/Bangkok timezone aware)');
    
    // Initial check after 3 seconds
    setTimeout(() => {
      this.checkJobs();
    }, 3000);

    // Periodic check every 30 seconds
    this.timer = setInterval(() => {
      this.checkJobs();
    }, 30 * 1000);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Retrieves list of all scheduled jobs for dashboard/queue display
   */
  public getScheduledJobs(): ScheduledJobView[] {
    const data = db.getData();
    const tSettings = data.telegramSettings;
    const bNow = getBangkokNow();
    const currentTimestamp = bNow.timestamp;
    const todayStr = bNow.dateStr;
    const morningTime = tSettings.advanceNotificationTime || tSettings.dailySummaryTime || '06:00';
    const sentMap = tSettings.sentAdvanceReminders || {};

    const jobs: ScheduledJobView[] = [];

    // 1. Daily morning summary job
    const summaryTime = tSettings.dailySummaryTime || '06:00';
    const summarySent = tSettings.lastDailySummaryDate === todayStr;
    const summaryTimestamp = getBangkokTimestamp(todayStr, summaryTime);
    const summaryIsDue = currentTimestamp >= summaryTimestamp;

    jobs.push({
      id: `daily-summary-${todayStr}`,
      title: '🌅 สรุปกิจกรรมและภารกิจประจำวัน',
      type: 'DAILY_SUMMARY',
      targetDate: todayStr,
      targetTime: summaryTime,
      timingLabel: `ทุกเช้าเวลา ${summaryTime} น.`,
      scheduledDateTime: `${todayStr} ${summaryTime}:00`,
      triggerDateTime: `${todayStr} ${summaryTime}:00`,
      status: summarySent ? 'SENT' : summaryIsDue ? 'DUE_NOW' : 'PENDING',
      isSent: summarySent,
      isDue: summaryIsDue && !summarySent,
      details: 'สรุปกิจกรรมทั้งหมดในวันนี้, ชุดครูเวร และวันเกิดบุคลากร',
    });

    // 2. Duty Today Job
    const dutyTime = tSettings.dutyReminderTime || '06:00';
    const dutySent = tSettings.lastDutyReminderDate === todayStr;
    const dutyTimestamp = getBangkokTimestamp(todayStr, dutyTime);
    const dutyIsDue = currentTimestamp >= dutyTimestamp;

    const todayDutySchedule = (data.dutySchedules || []).find((s) => s.date === todayStr);
    const todayDutyGroup = todayDutySchedule ? (data.dutyGroups || []).find((g) => g.id === todayDutySchedule.groupId) : null;

    jobs.push({
      id: `duty-today-${todayStr}`,
      title: todayDutyGroup ? `🛡️ แจ้งเตือนครูเวร: ${todayDutyGroup.name}` : '🛡️ แจ้งเตือนครูเวรประจำวัน',
      type: 'DUTY_TODAY',
      targetDate: todayStr,
      targetTime: dutyTime,
      timingLabel: `เช้าวันปฏิบัติหน้าที่ (${dutyTime} น.)`,
      scheduledDateTime: `${todayStr} ${dutyTime}:00`,
      triggerDateTime: `${todayStr} ${dutyTime}:00`,
      status: dutySent ? 'SENT' : dutyIsDue ? 'DUE_NOW' : 'PENDING',
      isSent: dutySent,
      isDue: dutyIsDue && !dutySent,
      details: todayDutyGroup ? `ชุดเวร: ${todayDutyGroup.name}` : 'ตารางครูเวรประจำวัน',
    });

    // 3. Approved Event Reminders
    const approvedEvents = (data.events || []).filter((e) => e.status === 'APPROVED' && e.sendTelegram);

    for (const event of approvedEvents) {
      const notifyList = event.notifySchedule && event.notifySchedule.length > 0
        ? event.notifySchedule
        : ['SAME_DAY_MORNING'];

      for (const timing of notifyList) {
        const config = NOTIFICATION_TIMINGS[timing];
        if (!config) continue;

        const triggerTs = calculateEventTriggerTimestamp(event, timing, morningTime);
        if (!triggerTs) continue;

        const reminderKey = `event_${event.id}_${timing}_${event.startDate}`;
        const isSent = !!sentMap[reminderKey];
        const isDue = currentTimestamp >= triggerTs;

        const triggerDateObj = new Date(triggerTs + 7 * 60 * 60 * 1000);
        const trigYear = triggerDateObj.getUTCFullYear();
        const trigMonth = String(triggerDateObj.getUTCMonth() + 1).padStart(2, '0');
        const trigDay = String(triggerDateObj.getUTCDate()).padStart(2, '0');
        const trigH = String(triggerDateObj.getUTCHours()).padStart(2, '0');
        const trigM = String(triggerDateObj.getUTCMinutes()).padStart(2, '0');
        const trigStr = `${trigYear}-${trigMonth}-${trigDay} ${trigH}:${trigM}:00`;

        jobs.push({
          id: reminderKey,
          title: `📌 กิจกรรม: ${event.title}`,
          type: 'EVENT_ADVANCE',
          targetDate: event.startDate,
          targetTime: event.startTime || '08:30',
          timingLabel: config.label,
          scheduledDateTime: trigStr,
          triggerDateTime: trigStr,
          status: isSent ? 'SENT' : isDue ? 'DUE_NOW' : 'PENDING',
          isSent,
          isDue: isDue && !isSent,
          details: `สถานที่: ${event.location || 'ในโรงเรียน'} | ผู้ประสานงาน: ${event.coordinator || '-'}`,
        });
      }
    }

    // Sort: Due now first, then upcoming by trigger time
    jobs.sort((a, b) => {
      if (a.isDue && !b.isDue) return -1;
      if (!a.isDue && b.isDue) return 1;
      if (!a.isSent && b.isSent) return -1;
      if (a.isSent && !b.isSent) return 1;
      return a.scheduledDateTime.localeCompare(b.scheduledDateTime);
    });

    return jobs;
  }

  /**
   * Main checking and dispatching engine
   */
  public async checkJobs(forceAllDue = false): Promise<{ dispatchedCount: number; details: string[] }> {
    if (this.isChecking) return { dispatchedCount: 0, details: [] };
    this.isChecking = true;
    const dispatchedDetails: string[] = [];

    try {
      const bNow = getBangkokNow();
      const todayStr = bNow.dateStr;
      const currentTimeStr = bNow.timeStr;
      const currentTimestamp = bNow.timestamp;

      const data = db.getData();
      const tSettings = data.telegramSettings;

      if (!tSettings.enabled) {
        this.isChecking = false;
        return { dispatchedCount: 0, details: [] };
      }

      if (!tSettings.sentAdvanceReminders) {
        tSettings.sentAdvanceReminders = {};
      }

      const morningTime = tSettings.advanceNotificationTime || tSettings.dailySummaryTime || '06:00';

      // ==========================================
      // 1. Advance & Same-Day Event Reminders
      // ==========================================
      const approvedEvents = (data.events || []).filter((e) => e.status === 'APPROVED' && e.sendTelegram);

      for (const event of approvedEvents) {
        const notifyList = event.notifySchedule && event.notifySchedule.length > 0
          ? event.notifySchedule
          : ['SAME_DAY_MORNING'];

        // Skip events that ended in the past (Bangkok Time)
        const [endYear, endMonth, endDay] = event.endDate.split('-').map(Number);
        const [endH, endM] = (event.endTime || '16:30').split(':').map(Number);
        const eventEndTimestamp = getBangkokTimestamp(`${endYear}-${endMonth}-${endDay}`, `${endH}:${endM}`);

        if (currentTimestamp > eventEndTimestamp + 30 * 60 * 1000 && !forceAllDue) {
          continue;
        }

        for (const timing of notifyList) {
          const config = NOTIFICATION_TIMINGS[timing];
          if (!config) continue;

          const triggerTimestamp = calculateEventTriggerTimestamp(event, timing, morningTime);
          if (!triggerTimestamp) continue;

          const reminderKey = `event_${event.id}_${timing}_${event.startDate}`;
          const isAlreadySent = !!tSettings.sentAdvanceReminders[reminderKey];

          if (isAlreadySent && !forceAllDue) continue;

          const isDue = currentTimestamp >= triggerTimestamp;

          if (isDue || forceAllDue) {
            console.log(`[Scheduler] Dispatching event alert [${timing}] for: ${event.title}`);
            const res = await TelegramService.sendAdvanceEventReminder(event, config.label);
            if (res.success) {
              tSettings.sentAdvanceReminders[reminderKey] = new Date().toISOString();
              dispatchedDetails.push(`กิจกรรม "${event.title}" (${config.label})`);
            }
          }
        }
      }

      // ==========================================
      // 2. Daily Morning Summary (สรุปกิจกรรมประจำวันตอนเช้า)
      // ==========================================
      const summaryEnabled = tSettings.notifyDailySummary !== false && (tSettings as any).dailySummary !== false;
      const targetSummaryTime = tSettings.dailySummaryTime || '06:00';

      if (summaryEnabled && (tSettings.lastDailySummaryDate !== todayStr || forceAllDue)) {
        if (currentTimeStr >= targetSummaryTime || forceAllDue) {
          console.log(`[Scheduler] Dispatching automated daily summary for ${todayStr} (at ${currentTimeStr})`);
          const res = await TelegramService.sendDailySummary(todayStr);
          if (res.success) {
            tSettings.lastDailySummaryDate = todayStr;
            dispatchedDetails.push(`สรุปกิจกรรมและภารกิจประจำวัน (${todayStr})`);
          }
        }
      }

      // ==========================================
      // 3. Today's Duty Set Reminder
      // ==========================================
      const dutyTime = tSettings.dutyReminderTime || '06:00';
      if (tSettings.lastDutyReminderDate !== todayStr || forceAllDue) {
        if (currentTimeStr >= dutyTime || forceAllDue) {
          const todayDutySchedule = (data.dutySchedules || []).find((s) => s.date === todayStr);
          if (todayDutySchedule) {
            const dutyGroup = (data.dutyGroups || []).find((g) => g.id === todayDutySchedule.groupId);
            if (dutyGroup) {
              console.log(`[Scheduler] Dispatching Today's Duty Reminder for ${dutyGroup.name}`);
              const res = await TelegramService.sendDutyGroupReminder(todayDutySchedule, dutyGroup);
              if (res.success) {
                tSettings.lastDutyReminderDate = todayStr;
                dispatchedDetails.push(`ครูเวรประจำวัน "${dutyGroup.name}" (${todayStr})`);
              }
            }
          }
        }
      }

      // ==========================================
      // 4. Advance Duty Reminder (Tomorrow's Duty Group - Evening)
      // ==========================================
      if (tSettings.advanceDutyReminder !== false) {
        const tmrDateObj = new Date(currentTimestamp + 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000);
        const tmrYear = tmrDateObj.getUTCFullYear();
        const tmrMonth = String(tmrDateObj.getUTCMonth() + 1).padStart(2, '0');
        const tmrDay = String(tmrDateObj.getUTCDate()).padStart(2, '0');
        const tmrStr = `${tmrYear}-${tmrMonth}-${tmrDay}`;

        const advDutyTime = tSettings.advanceDutyReminderTime || '17:00';

        if (tSettings.lastAdvanceDutyReminderDate !== tmrStr || forceAllDue) {
          if (currentTimeStr >= advDutyTime || forceAllDue) {
            const tmrSchedule = (data.dutySchedules || []).find((s) => s.date === tmrStr);
            if (tmrSchedule) {
              const tmrGroup = (data.dutyGroups || []).find((g) => g.id === tmrSchedule.groupId);
              if (tmrGroup) {
                console.log(`[Scheduler] Dispatching Advance Duty Reminder for tomorrow: ${tmrGroup.name}`);
                const res = await TelegramService.sendAdvanceDutyReminder(tmrSchedule, tmrGroup);
                if (res.success) {
                  tSettings.lastAdvanceDutyReminderDate = tmrStr;
                  dispatchedDetails.push(`เตือนครูเวรวันพรุ่งนี้ล่วงหน้า "${tmrGroup.name}"`);
                }
              }
            }
          }
        }
      }

      // ==========================================
      // 5. Birthday Greetings
      // ==========================================
      const bdayTime = tSettings.birthdayGreetingTime || '06:00';
      if (currentTimeStr >= bdayTime || forceAllDue) {
        const todayMMDD = `${bNow.month}-${bNow.day}`;
        for (const bday of data.birthdays || []) {
          if (bday.birthDate && bday.birthDate.endsWith(todayMMDD)) {
            if (!bday.greetingsSentYears) bday.greetingsSentYears = [];
            if (!bday.greetingsSentYears.includes(bNow.year) || forceAllDue) {
              const res = await TelegramService.sendBirthdayGreeting(bday);
              if (res.success) {
                if (!bday.greetingsSentYears.includes(bNow.year)) {
                  bday.greetingsSentYears.push(bNow.year);
                }
                dispatchedDetails.push(`อวยพรวันเกิดคุณ ${bday.name}`);
              }
            }
          }
        }
      }

      db.save();
    } catch (err) {
      console.error('[Scheduler Error]:', err);
    } finally {
      this.isChecking = false;
    }

    return {
      dispatchedCount: dispatchedDetails.length,
      details: dispatchedDetails,
    };
  }
}

export const scheduler = new NotificationScheduler();
