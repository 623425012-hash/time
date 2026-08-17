import { db } from './db';
import { SchoolEvent, NotificationLog, StaffBirthday, DutyRoster, DutyGroup, DutySchedule, Announcement } from './types';

// Helper for Thai date formatting
export function formatThaiDate(dateStr: string, short = false): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const thaiMonthsShort = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const thaiYear = year + 543;
    const thaiYearShort = String(thaiYear).slice(-2);
    if (short) {
      return `${day} ${thaiMonthsShort[month - 1]} ${thaiYearShort}`;
    }
    return `${day} ${thaiMonths[month - 1]} ${thaiYear}`;
  } catch {
    return dateStr;
  }
}

export function formatThaiDayOfWeek(dateStr: string, short = false): string {
  try {
    const days = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    const daysShort = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    const d = new Date(dateStr);
    return short ? daysShort[d.getDay()] : days[d.getDay()];
  } catch {
    return '';
  }
}

export function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function stripHtml(str: string): string {
  if (!str) return '';
  return String(str).replace(/<[^>]*>?/gm, '');
}

export function translateTelegramError(description: string, status?: number): string {
  const desc = (description || '').toLowerCase();
  if (desc.includes('unauthorized') || desc.includes('invalid token') || status === 401) {
    return 'Telegram Bot Token ไม่ถูกต้อง กรุณาตรวจสอบ Token จาก @BotFather บน Telegram';
  }
  if (desc.includes('chat not found') || desc.includes('chat_id_invalid')) {
    return 'ไม่พบ Chat ID กรุณาตรวจสอบว่ากรอก Chat ID ถูกต้อง และได้ดึงบอทเข้ากลุ่ม/แชแนลนั้นแล้วหรือยัง (หรือกด /start กับบอทหากส่งเข้าแชทส่วนตัว)';
  }
  if (desc.includes('bot was blocked by the user')) {
    return 'บอทถูกบล็อกโดยผู้ใช้ หรือผู้ใช้ยังไม่ได้เปิดแชทและกด /start กับบอท';
  }
  if (desc.includes('group chat was migrated to a supergroup')) {
    return 'กลุ่ม Telegram ถูกอัปเกรดเป็น Supergroup ทำให้ Chat ID เปลี่ยน กรุณาหา Chat ID ใหม่ (มักขึ้นต้นด้วย -100)';
  }
  if (desc.includes('not enough rights') || desc.includes('have no rights') || desc.includes('need administrator rights')) {
    return 'บอทไม่มีสิทธิ์ส่งข้อความในกลุ่ม/แชแนล กรุณาตั้งให้บอทเป็น Administrator ในกลุ่ม หรือเปิดสิทธิ์ Send Messages';
  }
  if (desc.includes('cant parse entities') || desc.includes("can't parse entities")) {
    return 'รูปแบบข้อความ HTML มีอักขระพิเศษที่ไม่ถูกต้อง (ระบบได้ส่งเป็นข้อความธรรมดาให้อัตโนมัติ)';
  }
  return description || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ Telegram API';
}

export interface SendMessageOptions {
  overrideToken?: string;
  overrideChatId?: string;
  skipEnabledCheck?: boolean;
}

export class TelegramService {
  public static cleanToken(token: string): string {
    if (!token) return '';
    let cleaned = token.trim();
    if (cleaned.toLowerCase().startsWith('bot')) {
      cleaned = cleaned.substring(3).trim();
    }
    return cleaned;
  }

  public static cleanChatId(chatId: string): string {
    if (!chatId) return '';
    return chatId.trim();
  }

  public static async sendMessage(
    text: string,
    type: NotificationLog['type'] = 'EVENT_NEW',
    eventId?: string,
    options?: SendMessageOptions
  ): Promise<{ success: boolean; message: string; rawError?: string }> {
    const settings = db.getData().telegramSettings;

    if (!options?.skipEnabledCheck && !settings.enabled && !options?.overrideToken) {
      return { success: false, message: 'การแจ้งเตือน Telegram ถูกปิดการใช้งานอยู่ (กรุณาเปิดใช้งานในการตั้งค่า)' };
    }

    const rawToken = options?.overrideToken || settings.botToken || process.env.TELEGRAM_BOT_TOKEN || '';
    const rawChatId = options?.overrideChatId || settings.chatId || process.env.TELEGRAM_CHAT_ID || '';

    const token = this.cleanToken(rawToken);
    const chatId = this.cleanChatId(rawChatId);

    if (!token || !chatId) {
      const errorMsg = 'ยังไม่ได้ระบุ Telegram Bot Token หรือ Chat ID';
      const log: NotificationLog = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        eventId,
        type,
        recipient: chatId || 'N/A',
        content: text,
        sentAt: new Date().toISOString(),
        status: 'FAILED',
        errorMessage: errorMsg,
      };
      db.getData().notificationLogs.unshift(log);
      db.save();
      return { success: false, message: errorMsg };
    }

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      
      // First attempt: HTML parse mode
      let response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
          disable_web_page_preview: false,
        }),
      });

      let data = (await response.json()) as any;

      // If HTML parse failed, retry with plain text (strip tags)
      if (!data.ok && data.description && data.description.toLowerCase().includes('parse')) {
        console.warn('[TelegramService] HTML parse error, retrying with stripped text:', data.description);
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: stripHtml(text),
            disable_web_page_preview: false,
          }),
        });
        data = (await response.json()) as any;
      }

      const isSuccess = Boolean(data.ok);
      const friendlyError = isSuccess ? undefined : translateTelegramError(data.description, response.status);

      const log: NotificationLog = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        eventId,
        type,
        recipient: chatId,
        content: text,
        sentAt: new Date().toISOString(),
        status: isSuccess ? 'SUCCESS' : 'FAILED',
        errorMessage: isSuccess ? undefined : (friendlyError || data.description || 'Unknown Telegram API error'),
      };

      db.getData().notificationLogs.unshift(log);
      // Keep only last 200 logs
      if (db.getData().notificationLogs.length > 200) {
        db.getData().notificationLogs = db.getData().notificationLogs.slice(0, 200);
      }
      db.save();

      if (isSuccess) {
        return { success: true, message: 'ส่งข้อความ Telegram สำเร็จเรียบร้อยแล้ว' };
      } else {
        return {
          success: false,
          message: friendlyError || data.description || 'Telegram API Error',
          rawError: data.description,
        };
      }
    } catch (error: any) {
      const errorMsg = error?.message || 'ข้อผิดพลาดเครือข่ายในการเชื่อมต่อไปยัง api.telegram.org';
      const log: NotificationLog = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        eventId,
        type,
        recipient: chatId,
        content: text,
        sentAt: new Date().toISOString(),
        status: 'FAILED',
        errorMessage: errorMsg,
      };
      db.getData().notificationLogs.unshift(log);
      db.save();
      return { success: false, message: errorMsg, rawError: error?.message };
    }
  }

  public static async sendEventNotification(event: SchoolEvent, customHeader?: string): Promise<{ success: boolean; message: string }> {
    const priorityLabel = event.priority === 'URGENT' ? '🔴 ด่วนที่สุด' : event.priority === 'IMPORTANT' ? '🟠 สำคัญ' : '🔵 ทั่วไป';
    const dateText = event.startDate === event.endDate
      ? formatThaiDate(event.startDate)
      : `${formatThaiDate(event.startDate)} - ${formatThaiDate(event.endDate)}`;
    const timeText = event.isAllDay ? 'ตลอดทั้งวัน' : `${event.startTime || '08:30'} - ${event.endTime || '16:30'} น.`;

    const header = customHeader || '🔔 <b>แจ้งเตือนกิจกรรมโรงเรียน</b>';

    let message = `${header}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📌 <b>กิจกรรม</b>: ${escapeHtml(event.title)}\n`;
    message += `📅 <b>วันที่</b>: ${dateText}\n`;
    message += `⏰ <b>เวลา</b>: ${timeText}\n`;
    message += `📍 <b>สถานที่</b>: ${escapeHtml(event.location || '-')}\n`;
    message += `👤 <b>ผู้รับผิดชอบ</b>: ${escapeHtml(event.coordinator || '-')} (${escapeHtml(event.department || '-')})\n`;
    message += `👥 <b>กลุ่มเป้าหมาย</b>: ${escapeHtml(event.targetGroup || '-')}\n`;
    message += `⚠️ <b>ระดับความสำคัญ</b>: ${priorityLabel}\n`;
    if (event.description) {
      message += `📝 <b>รายละเอียด</b>: ${escapeHtml(event.description)}\n`;
    }
    if (event.attachments && event.attachments.length > 0) {
      message += `📎 <b>เอกสารแนบ</b>: ${event.attachments.length} ไฟล์\n`;
    }
    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🏫 <i>${escapeHtml(db.getData().systemSettings.schoolName)}</i>`;

    return this.sendMessage(message, 'EVENT_APPROVED', event.id);
  }

  public static async sendEventChangeNotification(
    oldEvent: { title: string; date: string; time: string; location: string; coordinator: string },
    newEvent: SchoolEvent
  ): Promise<{ success: boolean; message: string }> {
    const newDateText = newEvent.startDate === newEvent.endDate
      ? formatThaiDate(newEvent.startDate)
      : `${formatThaiDate(newEvent.startDate)} - ${formatThaiDate(newEvent.endDate)}`;
    const newTimeText = newEvent.isAllDay ? 'ตลอดทั้งวัน' : `${newEvent.startTime || '08:30'} - ${newEvent.endTime || '16:30'} น.`;

    let message = `⚠️ <b>มีการเปลี่ยนแปลงกิจกรรมโรงเรียน</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📌 <b>กิจกรรม</b>: ${escapeHtml(newEvent.title)}\n\n`;
    message += `<b>[ข้อมูลเดิม]</b>:\n`;
    message += `• วันที่: ${escapeHtml(oldEvent.date)}\n`;
    message += `• เวลา: ${escapeHtml(oldEvent.time)}\n`;
    message += `• สถานที่: ${escapeHtml(oldEvent.location)}\n`;
    message += `• ผู้รับผิดชอบ: ${escapeHtml(oldEvent.coordinator)}\n\n`;
    message += `<b>[ข้อมูลใหม่ที่มีการแก้ไข]</b>:\n`;
    message += `• วันที่: ${newDateText}\n`;
    message += `• เวลา: ${newTimeText}\n`;
    message += `• สถานที่: ${escapeHtml(newEvent.location || '-')}\n`;
    message += `• ผู้รับผิดชอบ: ${escapeHtml(newEvent.coordinator || '-')} (${escapeHtml(newEvent.department || '-')})\n`;
    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🏫 <i>${escapeHtml(db.getData().systemSettings.schoolName)}</i>`;

    return this.sendMessage(message, 'EVENT_CHANGED', newEvent.id);
  }

  public static async sendTodayAllEventsAlert(targetDateStr: string): Promise<{ success: boolean; message: string; count: number }> {
    const events = db.getData().events.filter(
      (e) => e.status === 'APPROVED' && e.startDate <= targetDateStr && e.endDate >= targetDateStr
    );
    const dayName = formatThaiDayOfWeek(targetDateStr);
    const fullDate = formatThaiDate(targetDateStr);

    let message = `🔔 <b>แจ้งเตือนกิจกรรมประจำวันนี้ (${dayName}ที่ ${fullDate})</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (events.length === 0) {
      message += `✨ <b>วันนี้ไม่มีกิจกรรมที่กำหนดไว้ในปฏิทินโรงเรียน</b>\n\n`;
    } else {
      events.sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
      message += `📌 <b>กิจกรรมที่จัดขึ้นในวันนี้ (${events.length} รายการ)</b>:\n\n`;
      events.forEach((ev, idx) => {
        const timeStr = ev.isAllDay ? 'ตลอดทั้งวัน' : `${ev.startTime || '08:30'} - ${ev.endTime || '16:30'} น.`;
        const priorityIcon = ev.priority === 'URGENT' ? '🔴 [ด่วนที่สุด]' : ev.priority === 'IMPORTANT' ? '🟠 [สำคัญ]' : '🔵 [ทั่วไป]';
        message += `<b>${idx + 1}. ${escapeHtml(ev.title)}</b> ${priorityIcon}\n`;
        message += `   ⏰ <b>เวลา</b>: ${timeStr}\n`;
        message += `   📍 <b>สถานที่</b>: ${escapeHtml(ev.location || 'ในสถานศึกษา')}\n`;
        message += `   👤 <b>ผู้รับผิดชอบ</b>: ${escapeHtml(ev.coordinator || '-')} (${escapeHtml(ev.department || '-')})\n`;
        if (ev.targetGroup) {
          message += `   👥 <b>กลุ่มเป้าหมาย</b>: ${escapeHtml(ev.targetGroup)}\n`;
        }
        if (ev.description) {
          message += `   📝 <i>${escapeHtml(ev.description)}</i>\n`;
        }
        message += `\n`;
      });
    }

    // Include Duty Set information
    const dutySchedule = (db.getData().dutySchedules || []).find((s) => s.date === targetDateStr);
    if (dutySchedule) {
      const dutyGroup = (db.getData().dutyGroups || []).find((g) => g.id === dutySchedule.groupId);
      if (dutyGroup) {
        message += `🛡️ <b>ชุดครูเวรประจำวัน</b>: <b>${escapeHtml(dutyGroup.name)}</b>\n`;
        const members = dutySchedule.membersSnapshot || dutyGroup.members || [];
        const leader = members.find((m) => m.roleInGroup === 'LEADER');
        if (leader) {
          const leaderPhone = leader.phone ? ` (📞 ${leader.phone})` : '';
          message += `• 👑 หัวหน้าชุด: ${escapeHtml(leader.name)}${leaderPhone}\n`;
        }
        const regularMembers = members.filter((m) => m.roleInGroup !== 'LEADER');
        if (regularMembers.length > 0) {
          message += `• 👥 สมาชิก: ${regularMembers.map((m) => escapeHtml(m.name)).join(', ')}\n`;
        }
        message += `\n`;
      }
    }

    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🏫 <i>${escapeHtml(db.getData().systemSettings.schoolName)}</i>`;

    const res = await this.sendMessage(message, 'DAILY_SUMMARY');
    return { ...res, count: events.length };
  }

  public static async sendDailySummary(targetDateStr: string): Promise<{ success: boolean; message: string }> {
    const events = db.getData().events.filter(
      (e) => e.status === 'APPROVED' && e.startDate <= targetDateStr && e.endDate >= targetDateStr
    );
    const dayName = formatThaiDayOfWeek(targetDateStr);
    const fullDate = formatThaiDate(targetDateStr);

    let message = `🌅 <b>สรุปกิจกรรมและภารกิจประจำวัน</b>\n`;
    message += `📅 <b>${dayName}ที่ ${fullDate}</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    // 1. Events Today
    if (events.length === 0) {
      message += `✨ <b>กิจกรรมวันนี้</b>: ไม่มีกิจกรรมในปฏิทิน\n\n`;
    } else {
      events.sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
      message += `📌 <b>กิจกรรมวันนี้ (${events.length} รายการ)</b>:\n`;
      events.forEach((ev, idx) => {
        const timeStr = ev.isAllDay ? 'ตลอดวัน' : `${ev.startTime || '08:30'} น.`;
        message += `${idx + 1}. ⏰ <b>${timeStr}</b>: ${escapeHtml(ev.title)}\n`;
        message += `   📍 ${escapeHtml(ev.location || 'ในโรงเรียน')} | 👤 ${escapeHtml(ev.coordinator || '-')}\n`;
      });
      message += `\n`;
    }

    // 2. Duty Schedule (New Duty Set / Group system)
    const dutySchedule = (db.getData().dutySchedules || []).find((s) => s.date === targetDateStr);
    if (dutySchedule) {
      const dutyGroup = (db.getData().dutyGroups || []).find((g) => g.id === dutySchedule.groupId);
      if (dutyGroup) {
        message += `🛡️ <b>ชุดเวรประจำวัน: ${escapeHtml(dutyGroup.name)}</b>\n`;
        const members = dutySchedule.membersSnapshot || dutyGroup.members || [];
        const leader = members.find((m) => m.roleInGroup === 'LEADER');
        if (leader) {
          const leaderPhone = leader.phone ? ` (📞 ${leader.phone})` : '';
          message += `👑 <b>หัวหน้าชุด</b>: ${escapeHtml(leader.name)}${leaderPhone}\n`;
        }
        const regularMembers = members.filter((m) => m.roleInGroup !== 'LEADER');
        if (regularMembers.length > 0) {
          message += `👥 <b>สมาชิกในชุด</b>: ${regularMembers.map((m) => escapeHtml(m.name)).join(', ')}\n`;
        }
        message += `\n`;
      }
    } else {
      // Legacy duty fallback
      const duties = (db.getData().duties || []).filter((d) => d.date === targetDateStr);
      if (duties.length > 0) {
        message += `📋 <b>ตารางครูเวรปฏิบัติหน้าที่</b>:\n`;
        duties.forEach((d) => {
          message += `• ${escapeHtml(d.dutyType)}: ${escapeHtml(d.staffName)} (${escapeHtml(d.department)})\n`;
        });
        message += `\n`;
      }
    }

    // 3. Today's Birthdays
    const [year, month, day] = targetDateStr.split('-');
    const todayMMDD = `${month}-${day}`;
    const todayBirthdays = (db.getData().birthdays || []).filter((b) => b.birthDate && b.birthDate.endsWith(todayMMDD));
    if (todayBirthdays.length > 0) {
      message += `🎂 <b>สุขสันต์วันคล้ายวันเกิดวันนี้</b>:\n`;
      todayBirthdays.forEach((b) => {
        message += `✨ ${escapeHtml(b.name)} ${b.nickname ? `(${escapeHtml(b.nickname)})` : ''} - ${escapeHtml(b.position)}\n`;
      });
      message += `\n`;
    }

    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🏫 <i>${escapeHtml(db.getData().systemSettings.schoolName)}</i>`;

    return this.sendMessage(message, 'DAILY_SUMMARY');
  }

  public static async sendBirthdayGreeting(birthday: StaffBirthday): Promise<{ success: boolean; message: string }> {
    let message = `🎂 <b>สุขสันต์วันคล้ายวันเกิด</b> 🎉\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `ขอร่วมแสดงความยินดีและอวยพรวันเกิดแด่:\n`;
    message += `✨ <b>${escapeHtml(birthday.name)}</b> ${birthday.nickname ? `(${escapeHtml(birthday.nickname)})` : ''}\n`;
    message += `🏢 ตำแหน่ง: ${escapeHtml(birthday.position)} (${escapeHtml(birthday.department)})\n\n`;
    message += `ขออัญเชิญคุณพระศรีรัตนตรัยและสิ่งศักดิ์สิทธิ์ ดลบันดาลให้ท่านและครอบครัวประสบแต่ความสุข ความเจริญ มีสุขภาพพลานามัยที่แข็งแรง สมปรารถนาในสิ่งดีงามทุกประการ 💐\n`;
    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🏫 <i>คณะครูและบุคลากร ${escapeHtml(db.getData().systemSettings.schoolName)}</i>`;

    return this.sendMessage(message, 'BIRTHDAY');
  }

  public static async sendDutyGroupReminder(
    schedule: DutySchedule,
    group: DutyGroup
  ): Promise<{ success: boolean; message: string }> {
    const fullDate = formatThaiDate(schedule.date);
    const dayName = formatThaiDayOfWeek(schedule.date);

    let message = `🛡️ <b>แจ้งเตือนการปฏิบัติหน้าที่ชุดเวรประจำวัน</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📅 <b>วันที่</b>: ${dayName}ที่ ${fullDate}\n`;
    message += `🛡️ <b>ชุดเวรที่ปฏิบัติหน้าที่</b>: <b>${escapeHtml(group.name)}</b>\n\n`;

    const members = schedule.membersSnapshot || group.members;
    if (members && members.length > 0) {
      message += `👥 <b>รายชื่อสมาชิกในชุดเวร</b>:\n`;
      members.forEach((m, idx) => {
        const isLeader = m.roleInGroup === 'LEADER';
        const roleLabel = isLeader ? ' 👑 (หัวหน้าชุด)' : '';
        const deptLabel = m.department ? ` - ${m.department}` : '';
        const phoneLabel = m.phone ? ` 📞 ${m.phone}` : '';
        message += `${idx + 1}. <b>${escapeHtml(m.name)}</b>${roleLabel}${escapeHtml(deptLabel)}${phoneLabel}\n`;
      });
      message += `\n`;
    }

    const responsibilities = schedule.customResponsibilities || group.responsibilities;
    if (responsibilities && responsibilities.length > 0) {
      message += `📋 <b>หน้าที่ความรับผิดชอบ</b>:\n`;
      responsibilities.forEach((r) => {
        message += `• ${escapeHtml(r)}\n`;
      });
      message += `\n`;
    }

    if (schedule.notes) {
      message += `📝 <b>หมายเหตุเพิ่มเติม</b>: ${escapeHtml(schedule.notes)}\n\n`;
    }

    message += `ขอให้คณะครูและบุคลากรทุกท่านปฏิบัติหน้าที่ตรงต่อเวลา ร่วมมือกันรักษาความปลอดภัย และดูแลนักเรียนอย่างอบอุ่น\n`;
    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🏫 <i>${escapeHtml(db.getData().systemSettings.schoolName)}</i>`;

    return this.sendMessage(message, 'DUTY_REMINDER');
  }

  public static async sendAdvanceEventReminder(
    event: SchoolEvent,
    timingLabel: string
  ): Promise<{ success: boolean; message: string }> {
    const priorityLabel = event.priority === 'URGENT' ? '🔴 ด่วนที่สุด' : event.priority === 'IMPORTANT' ? '🟠 สำคัญ' : '🔵 ทั่วไป';
    const dateText = event.startDate === event.endDate
      ? formatThaiDate(event.startDate)
      : `${formatThaiDate(event.startDate)} - ${formatThaiDate(event.endDate)}`;
    const timeText = event.isAllDay ? 'ตลอดทั้งวัน' : `${event.startTime || '08:30'} - ${event.endTime || '16:30'} น.`;

    let message = `⏰ <b>แจ้งเตือนกิจกรรมล่วงหน้า: ${escapeHtml(timingLabel)}</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📌 <b>กิจกรรม</b>: <b>${escapeHtml(event.title)}</b>\n`;
    message += `📅 <b>วันที่จัดกิจกรรม</b>: ${dateText}\n`;
    message += `⏰ <b>เวลา</b>: ${timeText}\n`;
    message += `📍 <b>สถานที่</b>: ${escapeHtml(event.location || '-')}\n`;
    message += `👤 <b>ผู้รับผิดชอบ</b>: ${escapeHtml(event.coordinator || '-')} (${escapeHtml(event.department || '-')})\n`;
    message += `👥 <b>กลุ่มเป้าหมาย</b>: ${escapeHtml(event.targetGroup || '-')}\n`;
    message += `⚠️ <b>ระดับความสำคัญ</b>: ${priorityLabel}\n`;
    if (event.description) {
      message += `\n📝 <b>รายละเอียด / กำหนดการ</b>:\n${escapeHtml(event.description)}\n`;
    }
    if (event.attachments && event.attachments.length > 0) {
      message += `📎 <b>เอกสารแนบ</b>: ${event.attachments.length} ไฟล์\n`;
    }
    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🏫 <i>${escapeHtml(db.getData().systemSettings.schoolName)}</i>`;

    return this.sendMessage(message, 'EVENT_REMINDER', event.id);
  }

  public static async sendAdvanceDutyReminder(
    schedule: DutySchedule,
    group: DutyGroup
  ): Promise<{ success: boolean; message: string }> {
    const fullDate = formatThaiDate(schedule.date);
    const dayName = formatThaiDayOfWeek(schedule.date);

    let message = `🛡️ <b>แจ้งเตือนเตรียมความพร้อมครูเวร (วันพรุ่งนี้)</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📅 <b>วันที่ปฏิบัติหน้าที่</b>: ${dayName}ที่ ${fullDate}\n`;
    message += `🛡️ <b>ชุดเวรที่ปฏิบัติหน้าที่</b>: <b>${escapeHtml(group.name)}</b>\n\n`;

    const members = schedule.membersSnapshot || group.members;
    if (members && members.length > 0) {
      message += `👥 <b>รายชื่อสมาชิกผู้ปฏิบัติหน้าที่</b>:\n`;
      members.forEach((m, idx) => {
        const isLeader = m.roleInGroup === 'LEADER';
        const roleLabel = isLeader ? ' 👑 (หัวหน้าชุด)' : '';
        const deptLabel = m.department ? ` - ${m.department}` : '';
        const phoneLabel = m.phone ? ` 📞 ${m.phone}` : '';
        message += `${idx + 1}. <b>${escapeHtml(m.name)}</b>${roleLabel}${escapeHtml(deptLabel)}${phoneLabel}\n`;
      });
      message += `\n`;
    }

    const responsibilities = schedule.customResponsibilities || group.responsibilities;
    if (responsibilities && responsibilities.length > 0) {
      message += `📋 <b>หน้าที่ความรับผิดชอบ</b>:\n`;
      responsibilities.forEach((r) => {
        message += `• ${escapeHtml(r)}\n`;
      });
      message += `\n`;
    }

    if (schedule.notes) {
      message += `📝 <b>หมายเหตุเพิ่มเติม</b>: ${escapeHtml(schedule.notes)}\n\n`;
    }

    message += `ขอให้คุณครูและบุคลากรในชุดเวรเตรียมความพร้อมสำหรับการปฏิบัติหน้าที่ในวันพรุ่งนี้ครับ\n`;
    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🏫 <i>${escapeHtml(db.getData().systemSettings.schoolName)}</i>`;

    return this.sendMessage(message, 'DUTY_REMINDER');
  }

  public static async sendDutyReminder(duty: DutyRoster): Promise<{ success: boolean; message: string }> {
    const fullDate = formatThaiDate(duty.date);
    const dayName = formatThaiDayOfWeek(duty.date);

    let message = `📋 <b>แจ้งเตือนการปฏิบัติหน้าที่เวรประจำวัน</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📅 <b>วันที่ปฏิบัติหน้าที่</b>: ${dayName}ที่ ${fullDate}\n`;
    message += `📌 <b>หน้าที่</b>: ${escapeHtml(duty.dutyType)}\n`;
    message += `👤 <b>ผู้รับผิดชอบ</b>: ${escapeHtml(duty.staffName)} (${escapeHtml(duty.department)})\n`;
    if (duty.phone) {
      message += `📞 <b>เบอร์ติดต่อ</b>: ${escapeHtml(duty.phone)}\n`;
    }
    if (duty.notes) {
      message += `📝 <b>หมายเหตุ</b>: ${escapeHtml(duty.notes)}\n`;
    }
    message += `\nขอให้ปฏิบัติหน้าที่ตรงต่อเวลาและดูแลความเรียบร้อยด้วยความตั้งใจ\n`;
    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🏫 <i>${escapeHtml(db.getData().systemSettings.schoolName)}</i>`;

    return this.sendMessage(message, 'DUTY_REMINDER');
  }

  public static async sendAnnouncement(announcement: Announcement): Promise<{ success: boolean; message: string }> {
    const priorityLabel = announcement.priority === 'URGENT' ? '🔴 ด่วนที่สุด' : announcement.priority === 'IMPORTANT' ? '🟠 สำคัญ' : '🔵 ทั่วไป';

    let message = `📢 <b>ประกาศจากสถานศึกษา</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📌 <b>หัวข้อ</b>: ${escapeHtml(announcement.title)}\n`;
    message += `⚠️ <b>ระดับความสำคัญ</b>: ${priorityLabel}\n\n`;
    message += `${escapeHtml(announcement.content)}\n`;
    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🏫 <i>${escapeHtml(db.getData().systemSettings.schoolName)}</i>`;

    return this.sendMessage(message, 'ANNOUNCEMENT');
  }
}

