// Client-side Direct Telegram Dispatcher & Message Formatters
// Ensures ALL Telegram notification features work 100% reliably on Vercel, Serverless, and Client-side offline/local environments.

import { SchoolEvent, StaffBirthday, DutySchedule, DutyGroup, Announcement, TelegramLog, TelegramSettings } from '../types';
import { formatThaiDate, formatThaiDateRange, formatThaiDayOfWeek } from './thaiDate';

export interface DirectTelegramResult {
  success: boolean;
  message: string;
  error?: string;
}

export function cleanToken(token: string): string {
  if (!token) return '';
  let cleaned = token.trim();
  if (cleaned.toLowerCase().startsWith('bot')) {
    cleaned = cleaned.substring(3).trim();
  }
  return cleaned;
}

export function cleanChatId(chatId: string): string {
  if (!chatId) return '';
  return chatId.trim();
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
    return 'ไม่พบ Chat ID กรุณาตรวจสอบว่ากรอก Chat ID ถูกต้อง และได้ดึงบอทเข้ากลุ่ม/แชแนลแล้วหรือยัง (หรือกด /start กับบอทหากส่งเข้าแชทส่วนตัว)';
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

// ----------------------------------------------------
// Message Formatters
// ----------------------------------------------------

export function formatEventMessage(
  event: SchoolEvent,
  schoolName = 'โรงเรียนตัวอย่างวิทยา',
  customHeader?: string
): string {
  const priorityLabel =
    event.priority === 'URGENT' ? '🔴 ด่วนที่สุด' : event.priority === 'IMPORTANT' ? '🟠 สำคัญ' : '🔵 ทั่วไป';
  const dateText =
    event.startDate === event.endDate
      ? formatThaiDate(event.startDate, { format: 'medium' })
      : formatThaiDateRange(event.startDate, event.endDate);
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
  message += `🏫 <i>${escapeHtml(schoolName)}</i>`;

  return message;
}

export function formatEventChangeMessage(
  oldEvent: { title: string; date: string; time: string; location: string; coordinator: string },
  newEvent: SchoolEvent,
  schoolName = 'โรงเรียนตัวอย่างวิทยา'
): string {
  const newDateText =
    newEvent.startDate === newEvent.endDate
      ? formatThaiDate(newEvent.startDate, { format: 'medium' })
      : formatThaiDateRange(newEvent.startDate, newEvent.endDate);
  const newTimeText = newEvent.isAllDay ? 'ตลอดทั้งวัน' : `${newEvent.startTime || '08:30'} - ${newEvent.endTime || '16:30'} น.`;

  let message = `⚠️ <b>มีการเปลี่ยนแปลงข้อมูลกิจกรรมโรงเรียน</b>\n`;
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
  message += `🏫 <i>${escapeHtml(schoolName)}</i>`;

  return message;
}

export function formatAdvanceEventReminderMessage(
  event: SchoolEvent,
  timingLabel: string,
  schoolName = 'โรงเรียนตัวอย่างวิทยา'
): string {
  const priorityLabel =
    event.priority === 'URGENT' ? '🔴 ด่วนที่สุด' : event.priority === 'IMPORTANT' ? '🟠 สำคัญ' : '🔵 ทั่วไป';
  const dateText =
    event.startDate === event.endDate
      ? formatThaiDate(event.startDate, { format: 'medium' })
      : formatThaiDateRange(event.startDate, event.endDate);
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
  message += `🏫 <i>${escapeHtml(schoolName)}</i>`;

  return message;
}

export function formatAdvanceDutyReminderMessage(
  schedule: DutySchedule,
  group: DutyGroup,
  schoolName = 'โรงเรียนตัวอย่างวิทยา'
): string {
  const fullDate = formatThaiDate(schedule.date, { format: 'medium' });
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
  message += `🏫 <i>${escapeHtml(schoolName)}</i>`;

  return message;
}

export function formatDutyGroupReminderMessage(
  schedule: DutySchedule,
  group: DutyGroup,
  schoolName = 'โรงเรียนตัวอย่างวิทยา'
): string {
  const fullDate = formatThaiDate(schedule.date, { format: 'medium' });
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
  message += `🏫 <i>${escapeHtml(schoolName)}</i>`;

  return message;
}

export function formatBirthdayGreetingMessage(
  birthday: StaffBirthday,
  schoolName = 'โรงเรียนตัวอย่างวิทยา'
): string {
  let message = `🎂 <b>สุขสันต์วันคล้ายวันเกิด</b> 🎉\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `ขอร่วมแสดงความยินดีและอวยพรวันเกิดแด่:\n`;
  message += `✨ <b>${escapeHtml(birthday.name)}</b> ${birthday.nickname ? `(${escapeHtml(birthday.nickname)})` : ''}\n`;
  message += `🏢 ตำแหน่ง: ${escapeHtml(birthday.position)} (${escapeHtml(birthday.department)})\n\n`;
  if (birthday.customWish) {
    message += `💌 <i>"${escapeHtml(birthday.customWish)}"</i>\n\n`;
  } else {
    message += `ขออัญเชิญคุณพระศรีรัตนตรัยและสิ่งศักดิ์สิทธิ์ ดลบันดาลให้ท่านและครอบครัวประสบแต่ความสุข ความเจริญ มีสุขภาพพลานามัยที่แข็งแรง สมปรารถนาในสิ่งดีงามทุกประการ 💐\n\n`;
  }
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🏫 <i>คณะครูและบุคลากร ${escapeHtml(schoolName)}</i>`;

  return message;
}

export function formatAnnouncementMessage(
  announcement: Announcement,
  schoolName = 'โรงเรียนตัวอย่างวิทยา'
): string {
  const priorityLabel =
    announcement.priority === 'URGENT' ? '🔴 ด่วนที่สุด' : announcement.priority === 'IMPORTANT' ? '🟠 สำคัญ' : '🔵 ทั่วไป';

  let message = `📢 <b>ประกาศจากสถานศึกษา</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `📌 <b>หัวข้อ</b>: ${escapeHtml(announcement.title)}\n`;
  message += `⚠️ <b>ระดับความสำคัญ</b>: ${priorityLabel}\n\n`;
  message += `${escapeHtml(announcement.content)}\n`;
  message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🏫 <i>${escapeHtml(schoolName)}</i>`;

  return message;
}

export function formatDailySummaryMessage(
  events: SchoolEvent[],
  dutySchedule: DutySchedule | null,
  dutyGroup: DutyGroup | null,
  todayBirthdays: StaffBirthday[],
  schoolName = 'โรงเรียนตัวอย่างวิทยา',
  targetDateStr?: string
): string {
  const dateStr = targetDateStr || new Date().toISOString().split('T')[0];
  const dayName = formatThaiDayOfWeek(dateStr);
  const fullDate = formatThaiDate(dateStr, { format: 'medium' });

  let message = `🌅 <b>สรุปกิจกรรมและภารกิจประจำวัน</b>\n`;
  message += `📅 <b>${dayName}ที่ ${fullDate}</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  // 1. Events Today
  const approvedEvents = events.filter(
    (e) => e.status === 'APPROVED' && e.startDate <= dateStr && e.endDate >= dateStr
  );

  if (approvedEvents.length === 0) {
    message += `✨ <b>กิจกรรมวันนี้</b>: ไม่มีกิจกรรมในปฏิทิน\n\n`;
  } else {
    approvedEvents.sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
    message += `📌 <b>กิจกรรมวันนี้ (${approvedEvents.length} รายการ)</b>:\n`;
    approvedEvents.forEach((ev, idx) => {
      const timeStr = ev.isAllDay ? 'ตลอดวัน' : `${ev.startTime || '08:30'} น.`;
      message += `${idx + 1}. ⏰ <b>${timeStr}</b>: ${escapeHtml(ev.title)}\n`;
      message += `   📍 ${escapeHtml(ev.location || 'ในโรงเรียน')} | 👤 ${escapeHtml(ev.coordinator || '-')}\n`;
    });
    message += `\n`;
  }

  // 2. Duty Schedule
  if (dutySchedule && dutyGroup) {
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

  // 3. Birthdays Today
  if (todayBirthdays.length > 0) {
    message += `🎂 <b>สุขสันต์วันคล้ายวันเกิดวันนี้</b>:\n`;
    todayBirthdays.forEach((b) => {
      message += `✨ ${escapeHtml(b.name)} ${b.nickname ? `(${escapeHtml(b.nickname)})` : ''} - ${escapeHtml(b.position)}\n`;
    });
    message += `\n`;
  }

  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🏫 <i>${escapeHtml(schoolName)}</i>`;

  return message;
}

export function formatTestMessage(schoolName = 'โรงเรียนตัวอย่างวิทยา'): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  let message = `✅ <b>ทดสอบการเชื่อมต่อระบบแจ้งเตือน Telegram สำเร็จ!</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `ระบบปฏิทินกิจกรรมสถานศึกษาพร้อมส่งการแจ้งเตือนไปยังกลุ่ม/แชทนี้แล้ว\n\n`;
  message += `📅 <b>วันที่ทดสอบ</b>: ${formatThaiDate(dateStr, { format: 'medium' })}\n`;
  message += `⏰ <b>เวลา</b>: ${timeStr} น.\n`;
  message += `🏫 <b>สถานศึกษา</b>: ${escapeHtml(schoolName)}\n\n`;
  message += `ฟังก์ชันที่เปิดใช้งาน:\n`;
  message += `• แจ้งเตือนเมื่อมีการอนุมัติกิจกรรมใหม่\n`;
  message += `• แจ้งเตือนเมื่อกิจกรรมมีการเปลี่ยนแปลง\n`;
  message += `• แจ้งเตือนชุดเวรประจำวันและหน้าที่\n`;
  message += `• อวยพรวันเกิดบุคลากรประจำวัน\n`;
  message += `• สรุปภารกิจประจำวันเวลาเช้า (07:00 น.)\n`;
  message += `• กระจายข่าวสารและประกาศสำคัญ\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🚀 <i>ระบบปฏิทินกิจกรรมโรงเรียน (School Event Management System)</i>`;

  return message;
}

// ----------------------------------------------------
// Direct HTTP Dispatcher to Telegram Bot API
// ----------------------------------------------------

export async function sendTelegramDirect(
  token: string,
  chatId: string,
  messageText: string
): Promise<DirectTelegramResult> {
  const cleanedToken = cleanToken(token);
  const cleanedChatId = cleanChatId(chatId);

  if (!cleanedToken || !cleanedChatId) {
    return {
      success: false,
      message: 'กรุณากรอก Telegram Bot Token และ Chat ID ให้ครบถ้วน',
    };
  }

  const url = `https://api.telegram.org/bot${cleanedToken}/sendMessage`;

  try {
    // 1st attempt: HTML formatted
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: cleanedChatId,
        text: messageText,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    });

    let data = await response.json();

    // If HTML format parsing failed, retry with plain text
    if (!data.ok && data.description && data.description.toLowerCase().includes('parse')) {
      console.warn('[TelegramDirect] HTML parse failed, falling back to plain text:', data.description);
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: cleanedChatId,
          text: stripHtml(messageText),
          disable_web_page_preview: false,
        }),
      });
      data = await response.json();
    }

    if (data.ok) {
      return {
        success: true,
        message: 'ส่งข้อความแจ้งเตือนเข้า Telegram สำเร็จเรียบร้อยแล้ว',
      };
    } else {
      const friendlyDesc = translateTelegramError(data.description, response.status);
      return {
        success: false,
        message: friendlyDesc,
        error: data.description,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'ไม่สามารถเชื่อมต่อกับ Telegram API ได้',
      error: String(err),
    };
  }
}
