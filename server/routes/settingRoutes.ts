import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest, requirePermission, logActivity } from '../auth';
import { TelegramService } from '../telegram';
import { SystemSettings, TelegramSettings } from '../types';

export const settingRouter = Router();

// Get System Settings
settingRouter.get('/system', (req, res) => {
  res.json({
    systemSettings: db.getData().systemSettings,
  });
});

// Update System Settings
settingRouter.put('/system', (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    let currentUser = undefined;
    if (token) {
      try {
        const payload = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'school-calendar-secret-jwt-key-2026') as any;
        currentUser = db.getData().users.find((u) => u.id === payload.id);
      } catch {}
    }

    const updates: Partial<SystemSettings> = req.body || {};
    const current = db.getData().systemSettings;

    db.getData().systemSettings = {
      ...current,
      ...updates,
    } as SystemSettings;
    db.save();

    if (currentUser) {
      logActivity(currentUser, 'UPDATE_SETTINGS', 'อัปเดตการตั้งค่าระบบ โลโก้ และธีมสี', req);
    }
    
    res.json({ message: 'บันทึกการตั้งค่าระบบสำเร็จ', systemSettings: db.getData().systemSettings });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า' });
  }
});

// Get Telegram Settings (Admin only)
settingRouter.get('/telegram', authenticateToken, requirePermission('telegram.manage'), (req: AuthRequest, res: Response) => {
  const settings = db.getData().telegramSettings;
  // Mask bot token for security in display if desired, but keep raw in storage
  const maskedToken = settings.botToken
    ? settings.botToken.substring(0, 6) + '...' + settings.botToken.substring(Math.max(0, settings.botToken.length - 4))
    : '';

  const payload = {
    ...settings,
    dailySummary: settings.notifyDailySummary, // Provide alias for frontend
    botTokenMasked: maskedToken,
  };

  res.json({
    telegram: payload,
    telegramSettings: payload,
  });
});

// Update Telegram Settings (Admin only)
settingRouter.put('/telegram', authenticateToken, requirePermission('telegram.manage'), (req: AuthRequest, res: Response) => {
  const {
    botToken,
    chatId,
    enabled,
    notifyOnCreate,
    notifyOnApprove,
    notifyOnChange,
    notifyDailySummary,
    dailySummary,
    dailySummaryTime,
    defaultNotifyTimes,
    notifyAdvanceDays,
    dutyReminderTime,
    advanceDutyReminder,
    advanceDutyReminderTime,
    birthdayGreetingTime,
    advanceNotificationTime,
  } = req.body;

  const current = db.getData().telegramSettings;

  if (botToken !== undefined && !botToken.includes('...')) {
    current.botToken = TelegramService.cleanToken(botToken);
  }
  if (chatId !== undefined) {
    current.chatId = TelegramService.cleanChatId(chatId);
  }
  if (enabled !== undefined) current.enabled = Boolean(enabled);
  if (notifyOnCreate !== undefined) current.notifyOnCreate = Boolean(notifyOnCreate);
  if (notifyOnApprove !== undefined) current.notifyOnApprove = Boolean(notifyOnApprove);
  if (notifyOnChange !== undefined) current.notifyOnChange = Boolean(notifyOnChange);
  
  if (notifyDailySummary !== undefined) {
    current.notifyDailySummary = Boolean(notifyDailySummary);
  } else if (dailySummary !== undefined) {
    current.notifyDailySummary = Boolean(dailySummary);
  }

  if (dailySummaryTime !== undefined) current.dailySummaryTime = dailySummaryTime;
  if (dutyReminderTime !== undefined) current.dutyReminderTime = dutyReminderTime;
  if (advanceDutyReminder !== undefined) current.advanceDutyReminder = Boolean(advanceDutyReminder);
  if (advanceDutyReminderTime !== undefined) current.advanceDutyReminderTime = advanceDutyReminderTime;
  if (birthdayGreetingTime !== undefined) current.birthdayGreetingTime = birthdayGreetingTime;
  if (advanceNotificationTime !== undefined) current.advanceNotificationTime = advanceNotificationTime;
  if (defaultNotifyTimes !== undefined) current.defaultNotifyTimes = defaultNotifyTimes;
  if (notifyAdvanceDays !== undefined) current.defaultNotifyTimes = notifyAdvanceDays.map(String);

  db.save();
  logActivity(req.user, 'UPDATE_SETTINGS', 'อัปเดตการตั้งค่าการแจ้งเตือน Telegram', req);

  const responsePayload = {
    ...current,
    dailySummary: current.notifyDailySummary,
  };

  res.json({
    message: 'บันทึกการตั้งค่า Telegram สำเร็จ',
    telegram: responsePayload,
    telegramSettings: responsePayload,
  });
});

// Check and trigger scheduled jobs immediately
settingRouter.post('/telegram/check-scheduled', authenticateToken, requirePermission('telegram.manage'), async (req: AuthRequest, res: Response) => {
  const { scheduler } = await import('../scheduler');
  const forceAll = Boolean(req.body?.forceAllDue);
  const result = await scheduler.checkJobs(forceAll);
  logActivity(req.user, 'SEND_TELEGRAM', `สั่งตรวจหาและส่งการแจ้งเตือนตามกำหนดเวลา (${result.dispatchedCount} รายการ)`, req);
  res.json({
    success: true,
    dispatchedCount: result.dispatchedCount,
    dispatchedItems: result.details,
    message: result.dispatchedCount > 0
      ? `ส่งการแจ้งเตือนตามกำหนดเวลาสำเร็จ ${result.dispatchedCount} รายการ`
      : 'ตรวจสอบแล้ว ไม่มีรายการที่ถึงกำหนดในรอบนี้',
  });
});

// Broadcast Tomorrow's Duty Group (Advance Duty Reminder)
settingRouter.post('/telegram/broadcast-duty-advance', authenticateToken, requirePermission('telegram.manage'), async (req: AuthRequest, res: Response) => {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  const tmrStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const schedule = (db.getData().dutySchedules || []).find((s) => s.date === tmrStr);
  if (schedule) {
    const group = (db.getData().dutyGroups || []).find((g) => g.id === schedule.groupId);
    if (group) {
      const result = await TelegramService.sendAdvanceDutyReminder(schedule, group);
      if (result.success) {
        logActivity(req.user, 'SEND_TELEGRAM', `ส่งแจ้งเตือนครูเวรวันพรุ่งนี้ล่วงหน้า (${group.name}) ไปยัง Telegram`, req);
        res.json({ success: true, message: `ส่งแจ้งเตือนครูเวรวันพรุ่งนี้ "${group.name}" สำเร็จ`, result });
        return;
      }
      res.status(400).json({ success: false, error: result.message, message: result.message });
      return;
    }
  }

  res.status(404).json({ success: false, error: `ไม่พบตารางครูเวรสำหรับวันพรุ่งนี้ (${tmrStr})` });
});

// Test Telegram Bot Connection (accepts optional live botToken and chatId from body)
settingRouter.post('/telegram/test', authenticateToken, requirePermission('telegram.manage'), async (req: AuthRequest, res: Response) => {
  const { customMessage, botToken, chatId } = req.body;

  const msg = customMessage || `🔔 <b>ทดสอบการเชื่อมต่อระบบแจ้งเตือน Telegram</b>\n━━━━━━━━━━━━━━━━━━━━\n✅ ทดสอบส่งข้อความสำเร็จ! ระบบสามารถเชื่อมต่อและแจ้งเตือนเข้ากลุ่มได้ตามปกติ\n📅 วันที่และเวลา: ${new Date().toLocaleString('th-TH')}\n🏫 ${db.getData().systemSettings.schoolName}`;

  // If user typed botToken / chatId in frontend, test with those credentials
  const options = {
    overrideToken: botToken && !botToken.includes('...') ? TelegramService.cleanToken(botToken) : undefined,
    overrideChatId: chatId ? TelegramService.cleanChatId(chatId) : undefined,
    skipEnabledCheck: true, // Allow testing even if toggled off
  };

  const result = await TelegramService.sendMessage(msg, 'TEST', undefined, options);
  
  if (result.success) {
    logActivity(req.user, 'SEND_TELEGRAM', 'ทดสอบส่งข้อความ Telegram สำเร็จ', req);
    res.json({ success: true, message: 'ทดสอบส่งข้อความสำเร็จ กรุณาตรวจสอบใน Telegram' });
  } else {
    res.status(400).json({ success: false, error: result.message, message: result.message, rawError: result.rawError });
  }
});

// Broadcast Today's Daily Summary
settingRouter.post('/telegram/broadcast-daily', authenticateToken, requirePermission('telegram.manage'), async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const result = await TelegramService.sendDailySummary(todayStr);

  if (result.success) {
    logActivity(req.user, 'SEND_TELEGRAM', `ส่งสรุปกิจกรรมประจำวัน (${todayStr}) ไปยัง Telegram`, req);
    res.json({ success: true, message: 'ส่งสรุปกิจกรรมประจำวันสำเร็จเรียบร้อยแล้ว', result });
  } else {
    res.status(400).json({ success: false, error: result.message, message: result.message, result });
  }
});

// Broadcast Today's Duty Set
settingRouter.post('/telegram/broadcast-duty-today', authenticateToken, requirePermission('telegram.manage'), async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const schedule = (db.getData().dutySchedules || []).find((s) => s.date === todayStr);
  if (schedule) {
    const group = (db.getData().dutyGroups || []).find((g) => g.id === schedule.groupId);
    if (group) {
      const result = await TelegramService.sendDutyGroupReminder(schedule, group);
      if (result.success) {
        logActivity(req.user, 'SEND_TELEGRAM', `ส่งแจ้งเตือนชุดเวรประจำวัน (${group.name}) ไปยัง Telegram`, req);
        res.json({ success: true, message: `ส่งแจ้งเตือนชุดเวร "${group.name}" สำเร็จ`, result });
        return;
      }
      res.status(400).json({ success: false, error: result.message, message: result.message });
      return;
    }
  }

  // Fallback to legacy duty roster
  const todayDuties = (db.getData().duties || []).filter((d) => d.date === todayStr);
  if (todayDuties.length > 0) {
    let allOk = true;
    for (const d of todayDuties) {
      const resDuty = await TelegramService.sendDutyReminder(d);
      if (!resDuty.success) allOk = false;
    }
    res.json({ success: allOk, message: 'ส่งแจ้งเตือนครูเวรประจำวันเรียบร้อยแล้ว' });
    return;
  }

  res.status(404).json({ success: false, error: 'ไม่พบตารางครูเวรที่ลงไว้สำหรับวันนี้' });
});

// Broadcast Today's Birthdays
settingRouter.post('/telegram/broadcast-birthdays-today', authenticateToken, requirePermission('telegram.manage'), async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayMMDD = `${month}-${day}`;

  const todayBirthdays = (db.getData().birthdays || []).filter((b) => b.birthDate && b.birthDate.endsWith(todayMMDD));
  if (todayBirthdays.length === 0) {
    res.status(404).json({ success: false, error: 'วันนี้ไม่มีวันคล้ายวันเกิดของบุคลากรในระบบ' });
    return;
  }

  let count = 0;
  for (const b of todayBirthdays) {
    const resB = await TelegramService.sendBirthdayGreeting(b);
    if (resB.success) count++;
  }

  logActivity(req.user, 'SEND_TELEGRAM', `ส่งคำอวยพรวันเกิดบุคลากร (${count} ท่าน) ไปยัง Telegram`, req);
  res.json({ success: true, message: `ส่งคำอวยพรวันเกิดสำเร็จ (${count}/${todayBirthdays.length} ท่าน)` });
});

// Trigger Instant Daily Summary Test (Alias)
settingRouter.post('/telegram/trigger-daily-summary', authenticateToken, requirePermission('telegram.manage'), async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const result = await TelegramService.sendDailySummary(todayStr);

  if (result.success) {
    logActivity(req.user, 'SEND_TELEGRAM', `ส่งสรุปกิจกรรมประจำวัน (${todayStr}) ไปยัง Telegram`, req);
    res.json({ success: true, message: 'ส่งสรุปกิจกรรมประจำวันสำเร็จ', result });
  } else {
    res.status(400).json({ success: false, error: result.message, result });
  }
});

// Get Notification Logs
settingRouter.get('/telegram/logs', authenticateToken, requirePermission('telegram.manage'), (req: AuthRequest, res: Response) => {
  const logs = db.getData().notificationLogs || [];
  res.json({ logs: logs.slice() });
});

// Clear Notification Logs
settingRouter.delete('/telegram/logs', authenticateToken, requirePermission('telegram.manage'), (req: AuthRequest, res: Response) => {
  db.getData().notificationLogs = [];
  db.save();
  res.json({ message: 'ล้างประวัติการส่งข้อความเรียบร้อยแล้ว' });
});

// Backup Database (Export full JSON)
settingRouter.get('/backup', authenticateToken, requirePermission('settings.manage'), (req: AuthRequest, res: Response) => {
  const data = db.getData();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=school_calendar_backup_${Date.now()}.json`);
  res.json(data);
});

// Reset Database to Default Seed
settingRouter.post('/reset-default', authenticateToken, requirePermission('settings.manage'), (req: AuthRequest, res: Response) => {
  const restored = db.resetToDefault();
  logActivity(req.user, 'UPDATE_SETTINGS', 'คืนค่าระบบเป็นค่าเริ่มต้น (Reset to Default)', req);
  res.json({ message: 'คืนค่าระบบเป็นค่าเริ่มต้นเรียบร้อยแล้ว', systemSettings: restored.systemSettings });
});

