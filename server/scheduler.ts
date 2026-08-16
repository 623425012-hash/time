import { db } from './db';
import { TelegramService } from './telegram';

const NOTIFICATION_TIMINGS: Record<string, { label: string; daysOffset?: number; minutesOffset?: number; useMorningTime: boolean }> = {
  '7_DAYS_BEFORE': { label: 'เตือนล่วงหน้า 7 วัน (1 สัปดาห์)', daysOffset: -7, useMorningTime: true },
  '3_DAYS_BEFORE': { label: 'เตือนล่วงหน้า 3 วัน', daysOffset: -3, useMorningTime: true },
  '2_DAYS_BEFORE': { label: 'เตือนล่วงหน้า 2 วัน', daysOffset: -2, useMorningTime: true },
  '1_DAY_BEFORE': { label: 'เตือนล่วงหน้า 1 วัน', daysOffset: -1, useMorningTime: true },
  'SAME_DAY_MORNING': { label: 'เตือนเช้าวันจัดกิจกรรม', daysOffset: 0, useMorningTime: true },
  '3_HOURS_BEFORE': { label: 'เตือนก่อนเริ่ม 3 ชั่วโมง', minutesOffset: -180, useMorningTime: false },
  '1_HOUR_BEFORE': { label: 'เตือนก่อนเริ่ม 1 ชั่วโมง', minutesOffset: -60, useMorningTime: false },
  '30_MIN_BEFORE': { label: 'เตือนก่อนเริ่ม 30 นาที', minutesOffset: -30, useMorningTime: false },
  'ON_START': { label: 'เตือนเมื่อถึงเวลาเริ่มกิจกรรม', minutesOffset: 0, useMorningTime: false },
};

function calculateEventTriggerDate(
  event: any,
  timingKey: string,
  advanceNotificationTime = '07:00'
): Date | null {
  const config = NOTIFICATION_TIMINGS[timingKey];
  if (!config) return null;

  try {
    const [startYear, startMonth, startDay] = event.startDate.split('-').map(Number);
    const eventTimeStr = event.isAllDay ? '08:30' : event.startTime || '08:30';
    const [startH, startM] = eventTimeStr.split(':').map(Number);

    if (config.useMorningTime) {
      const [advH, advM] = advanceNotificationTime.split(':').map(Number);
      const targetDate = new Date(startYear, startMonth - 1, startDay, advH || 7, advM || 0, 0, 0);
      if (config.daysOffset) {
        targetDate.setDate(targetDate.getDate() + config.daysOffset);
      }
      return targetDate;
    } else {
      const exactStartDate = new Date(startYear, startMonth - 1, startDay, startH, startM, 0, 0);
      if (config.minutesOffset !== undefined) {
        exactStartDate.setMinutes(exactStartDate.getMinutes() + config.minutesOffset);
      }
      return exactStartDate;
    }
  } catch {
    return null;
  }
}

class NotificationScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isChecking = false;

  public start(): void {
    if (this.timer) return;
    console.log('[Scheduler] Background notification scheduler started');
    // Run initial check after 5s, then every 30 seconds
    setTimeout(() => {
      this.checkJobs();
    }, 5000);

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

  public async checkJobs(forceAllDue = false): Promise<{ dispatchedCount: number; details: string[] }> {
    if (this.isChecking) return { dispatchedCount: 0, details: [] };
    this.isChecking = true;
    const dispatchedDetails: string[] = [];

    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      const data = db.getData();
      const tSettings = data.telegramSettings;

      if (!tSettings.enabled) {
        this.isChecking = false;
        return { dispatchedCount: 0, details: [] };
      }

      if (!tSettings.sentAdvanceReminders) {
        tSettings.sentAdvanceReminders = {};
      }

      const advanceTime = tSettings.advanceNotificationTime || tSettings.dailySummaryTime || '07:00';

      // 1. Advance Event Reminders
      const approvedEvents = (data.events || []).filter((e) => e.status === 'APPROVED' && e.sendTelegram);

      for (const event of approvedEvents) {
        if (!event.notifySchedule || event.notifySchedule.length === 0) continue;

        // Skip events that have fully ended in the past
        const [endYear, endMonth, endDay] = event.endDate.split('-').map(Number);
        const [endH, endM] = (event.endTime || '16:30').split(':').map(Number);
        const eventEndDate = new Date(endYear, endMonth - 1, endDay, endH, endM, 0, 0);

        if (now > eventEndDate) continue;

        for (const timing of event.notifySchedule) {
          const config = NOTIFICATION_TIMINGS[timing];
          if (!config) continue;

          const triggerDate = calculateEventTriggerDate(event, timing, advanceTime);
          if (!triggerDate) continue;

          const reminderKey = `event_${event.id}_${timing}_${event.startDate}`;
          const isAlreadySent = !!tSettings.sentAdvanceReminders[reminderKey];

          if (isAlreadySent) continue;

          const isDue = now.getTime() >= triggerDate.getTime();

          if (isDue || forceAllDue) {
            console.log(`[Scheduler] Triggering advance alert [${timing}] for event: ${event.title}`);
            const res = await TelegramService.sendAdvanceEventReminder(event, config.label);
            if (res.success) {
              tSettings.sentAdvanceReminders[reminderKey] = new Date().toISOString();
              dispatchedDetails.push(`กิจกรรม "${event.title}" (${config.label})`);
            }
          }
        }
      }

      // 2. Daily morning summary
      const summaryEnabled = tSettings.notifyDailySummary || (tSettings as any).dailySummary;
      const targetSummaryTime = tSettings.dailySummaryTime || '07:00';
      if (summaryEnabled && (tSettings.lastDailySummaryDate !== todayStr || forceAllDue)) {
        if (currentTimeStr >= targetSummaryTime || forceAllDue) {
          console.log(`[Scheduler] Dispatching automated daily summary for ${todayStr}`);
          const res = await TelegramService.sendDailySummary(todayStr);
          if (res.success) {
            tSettings.lastDailySummaryDate = todayStr;
            dispatchedDetails.push(`สรุปกิจกรรมประจำวัน (${todayStr})`);
          }
        }
      }

      // 3. Today's Duty Set reminder
      const dutyTime = tSettings.dutyReminderTime || tSettings.dailySummaryTime || '06:30';
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

      // 4. Advance Duty Reminder (Tomorrow's Duty Group)
      if (tSettings.advanceDutyReminder !== false) {
        const tmr = new Date(now);
        tmr.setDate(tmr.getDate() + 1);
        const tmrStr = `${tmr.getFullYear()}-${String(tmr.getMonth() + 1).padStart(2, '0')}-${String(tmr.getDate()).padStart(2, '0')}`;
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

      // 5. Birthday greetings
      const bdayTime = tSettings.birthdayGreetingTime || '07:00';
      if (currentTimeStr >= bdayTime || forceAllDue) {
        const todayMMDD = `${month}-${day}`;
        for (const bday of data.birthdays || []) {
          if (bday.birthDate && bday.birthDate.endsWith(todayMMDD)) {
            if (!bday.greetingsSentYears) bday.greetingsSentYears = [];
            if (!bday.greetingsSentYears.includes(year) || forceAllDue) {
              const res = await TelegramService.sendBirthdayGreeting(bday);
              if (res.success) {
                if (!bday.greetingsSentYears.includes(year)) {
                  bday.greetingsSentYears.push(year);
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

