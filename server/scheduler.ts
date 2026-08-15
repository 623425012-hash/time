import { db } from './db';
import { TelegramService } from './telegram';

class NotificationScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isChecking = false;

  public start(): void {
    if (this.timer) return;
    console.log('[Scheduler] Background notification scheduler started');
    // Run initial check after a slight delay (5s), then every 60 seconds
    setTimeout(() => {
      this.checkJobs();
    }, 5000);

    this.timer = setInterval(() => {
      this.checkJobs();
    }, 60 * 1000);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public async checkJobs(): Promise<void> {
    if (this.isChecking) return;
    this.isChecking = true;

    try {
      const now = new Date();
      // Format current date in YYYY-MM-DD
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
        return;
      }

      // 1. Daily morning summary & Birthdays & Duty Groups Check
      const summaryEnabled = tSettings.notifyDailySummary || (tSettings as any).dailySummary;
      if (summaryEnabled && tSettings.lastDailySummaryDate !== todayStr) {
        const targetSummaryTime = tSettings.dailySummaryTime || '07:00';
        if (currentTimeStr >= targetSummaryTime) {
          console.log(`[Scheduler] Dispatching automated daily summary for ${todayStr}`);
          await TelegramService.sendDailySummary(todayStr);

          // Today's Duty Set notification
          const todayDutySchedule = (data.dutySchedules || []).find((s) => s.date === todayStr);
          if (todayDutySchedule) {
            const dutyGroup = (data.dutyGroups || []).find((g) => g.id === todayDutySchedule.groupId);
            if (dutyGroup) {
              const alreadyNotifiedGroup = data.notificationLogs.some(
                (l) => l.type === 'DUTY_REMINDER' && l.content?.includes(dutyGroup.name) && l.sentAt?.startsWith(todayStr)
              );
              if (!alreadyNotifiedGroup) {
                await TelegramService.sendDutyGroupReminder(todayDutySchedule, dutyGroup);
              }
            }
          }

          // Birthday greetings
          const todayMMDD = `${month}-${day}`;
          for (const bday of data.birthdays || []) {
            if (bday.birthDate && bday.birthDate.endsWith(todayMMDD)) {
              if (!bday.greetingsSentYears) bday.greetingsSentYears = [];
              if (!bday.greetingsSentYears.includes(year)) {
                await TelegramService.sendBirthdayGreeting(bday);
                bday.greetingsSentYears.push(year);
              }
            }
          }

          tSettings.lastDailySummaryDate = todayStr;
          db.save();
        }
      }

      // 2. Event Reminder Schedules (3 days, 1 day, 3 hours, 1 hour, on start)
      const approvedEvents = (data.events || []).filter((e) => e.status === 'APPROVED' && e.sendTelegram);

      for (const event of approvedEvents) {
        if (!event.notifySchedule || event.notifySchedule.length === 0) continue;

        // Parse target event start datetime
        const startTime = event.isAllDay ? '08:30' : (event.startTime || '08:30');
        const eventStartDateTime = new Date(`${event.startDate}T${startTime}:00`);
        const diffMs = eventStartDateTime.getTime() - now.getTime();
        const diffMinutes = Math.floor(diffMs / (60 * 1000));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        // Check each reminder condition
        for (const schedule of event.notifySchedule) {
          let shouldTrigger = false;
          let reminderTag = '';

          if (schedule === '3_DAYS_BEFORE' && diffDays >= 2 && diffDays <= 3 && diffHours >= 70 && diffHours <= 72) {
            shouldTrigger = true;
            reminderTag = '3_DAYS_BEFORE';
          } else if (schedule === '1_DAY_BEFORE' && (diffDays === 1 || (diffHours >= 22 && diffHours <= 24))) {
            shouldTrigger = true;
            reminderTag = '1_DAY_BEFORE';
          } else if (schedule === '3_HOURS_BEFORE' && diffHours >= 2 && diffHours <= 3 && diffMinutes >= 170 && diffMinutes <= 180) {
            shouldTrigger = true;
            reminderTag = '3_HOURS_BEFORE';
          } else if (schedule === '1_HOUR_BEFORE' && diffHours >= 0 && diffMinutes >= 50 && diffMinutes <= 60) {
            shouldTrigger = true;
            reminderTag = '1_HOUR_BEFORE';
          } else if (schedule === 'ON_START' && diffMinutes >= -5 && diffMinutes <= 5) {
            shouldTrigger = true;
            reminderTag = 'ON_START';
          }

          if (shouldTrigger) {
            // Check if already notified for this event + schedule
            const alreadySent = (data.notificationLogs || []).some(
              (l) => l.eventId === event.id && l.content?.includes(`[REMINDER_${reminderTag}]`)
            );
            if (!alreadySent) {
              const reminderHeader = `🔔 <b>แจ้งเตือนกิจกรรมใกล้ถึงเวลา</b> [REMINDER_${reminderTag}]`;
              await TelegramService.sendEventNotification(event, reminderHeader);
            }
          }
        }
      }
    } catch (err) {
      console.error('[Scheduler Error]:', err);
    } finally {
      this.isChecking = false;
    }
  }
}

export const scheduler = new NotificationScheduler();

