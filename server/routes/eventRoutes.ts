import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest, requirePermission, logActivity } from '../auth';
import { TelegramService, formatThaiDate } from '../telegram';
import { SchoolEvent, EventCategory } from '../types';

export const eventRouter = Router();

// Helper to check time overlap
export function isOverlapping(
  start1: string,
  end1: string,
  timeStart1: string,
  timeEnd1: string,
  start2: string,
  end2: string,
  timeStart2: string,
  timeEnd2: string
): boolean {
  // Date range check
  if (start1 > end2 || start2 > end1) return false;

  // Time range check
  const t1s = timeStart1 || '00:00';
  const t1e = timeEnd1 || '23:59';
  const t2s = timeStart2 || '00:00';
  const t2e = timeEnd2 || '23:59';

  return t1s < t2e && t2s < t1e;
}

// Get all events with filtering
eventRouter.get('/', (req, res) => {
  const {
    startDate,
    endDate,
    categoryId,
    department,
    priority,
    status,
    search,
    includePending,
  } = req.query;

  let events = db.getData().events;

  // Filter status
  if (status) {
    events = events.filter((e) => e.status === status);
  } else if (includePending !== 'true') {
    // By default for regular public calendar, return APPROVED
    events = events.filter((e) => e.status === 'APPROVED');
  }

  if (categoryId) {
    events = events.filter((e) => e.categoryId === categoryId);
  }
  if (department) {
    events = events.filter((e) => e.department.toLowerCase().includes(String(department).toLowerCase()));
  }
  if (priority) {
    events = events.filter((e) => e.priority === priority);
  }
  if (startDate) {
    events = events.filter((e) => e.endDate >= String(startDate));
  }
  if (endDate) {
    events = events.filter((e) => e.startDate <= String(endDate));
  }
  if (search) {
    const q = String(search).toLowerCase();
    events = events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.location && e.location.toLowerCase().includes(q)) ||
        (e.coordinator && e.coordinator.toLowerCase().includes(q)) ||
        (e.department && e.department.toLowerCase().includes(q))
    );
  }

  // Sort by startDate, startTime
  events.sort((a, b) => {
    if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
    return (a.startTime || '00:00').localeCompare(b.startTime || '00:00');
  });

  res.json({ events });
});

// Check location/time conflict
eventRouter.post('/check-conflict', (req, res) => {
  const { eventId, location, startDate, endDate, startTime, endTime } = req.body;

  if (!location || !startDate || !endDate) {
    res.json({ hasConflict: false, conflictingEvents: [] });
    return;
  }

  const conflicts = db.getData().events.filter((e) => {
    if (e.id === eventId) return false;
    if (e.status === 'REJECTED') return false;
    if (!e.location || e.location.trim().toLowerCase() !== location.trim().toLowerCase()) return false;

    return isOverlapping(
      startDate,
      endDate,
      startTime || '00:00',
      endTime || '23:59',
      e.startDate,
      e.endDate,
      e.startTime || '00:00',
      e.endTime || '23:59'
    );
  });

  res.json({
    hasConflict: conflicts.length > 0,
    conflictingEvents: conflicts,
  });
});

// Category Endpoints (MUST be before /:id)
eventRouter.get('/categories', (req, res) => {
  res.json({ categories: db.getData().categories });
});

eventRouter.get('/categories/list', (req, res) => {
  res.json({ categories: db.getData().categories });
});

eventRouter.get('/categories/all', (req, res) => {
  res.json({ categories: db.getData().categories });
});

eventRouter.post('/categories', authenticateToken, requirePermission('settings.manage'), (req: AuthRequest, res: Response) => {
  const { name, color, textColor, icon } = req.body;
  if (!name || !color) {
    res.status(400).json({ error: 'กรุณากรอกชื่อและรหัสสีประเภทกิจกรรม' });
    return;
  }

  const newCat: EventCategory = {
    id: `cat-${Date.now()}`,
    name,
    color,
    textColor: textColor || '#ffffff',
    icon: icon || 'Calendar',
    isSystem: false,
  };

  db.getData().categories.push(newCat);
  db.save();
  res.status(201).json({ message: 'เพิ่มประเภทกิจกรรมสำเร็จ', category: newCat });
});

eventRouter.put('/categories/:id', authenticateToken, requirePermission('settings.manage'), (req: AuthRequest, res: Response) => {
  const cat = db.getData().categories.find((c) => c.id === req.params.id);
  if (!cat) {
    res.status(404).json({ error: 'ไม่พบประเภทกิจกรรม' });
    return;
  }
  const { name, color, textColor, icon } = req.body;
  if (name) cat.name = name;
  if (color) cat.color = color;
  if (textColor) cat.textColor = textColor;
  if (icon) cat.icon = icon;

  db.save();
  res.json({ message: 'อัปเดตประเภทกิจกรรมสำเร็จ', category: cat });
});

eventRouter.delete('/categories/:id', authenticateToken, requirePermission('settings.manage'), (req: AuthRequest, res: Response) => {
  const index = db.getData().categories.findIndex((c) => c.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'ไม่พบประเภทกิจกรรม' });
    return;
  }
  db.getData().categories.splice(index, 1);
  db.save();
  res.json({ message: 'ลบประเภทกิจกรรมสำเร็จ' });
});

// Get single event
eventRouter.get('/:id', (req, res) => {
  if (req.params.id === 'categories') {
    res.json({ categories: db.getData().categories });
    return;
  }
  const event = db.getData().events.find((e) => e.id === req.params.id);
  if (!event) {
    res.status(404).json({ error: 'ไม่พบกิจกรรมที่ระบุ' });
    return;
  }
  res.json({ event });
});

// Create Event
eventRouter.post('/', authenticateToken, requirePermission('events.create'), async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const systemSettings = db.getData().systemSettings;

  const {
    title,
    categoryId,
    startDate,
    endDate,
    startTime,
    endTime,
    isAllDay,
    location,
    description,
    coordinator,
    department,
    targetGroup,
    priority,
    attachments,
    recurrence,
    recurrenceEndDate,
    notifySchedule,
    sendTelegram,
    statusOverride,
  } = req.body;

  if (!title || !startDate || !categoryId) {
    res.status(400).json({ error: 'กรุณากรอกชื่อกิจกรรม วันที่ และประเภทกิจกรรม' });
    return;
  }

  // Determine initial status
  let status: SchoolEvent['status'] = 'PENDING';
  if (user.role === 'ADMIN' || !systemSettings.defaultEventApprovalRequired) {
    status = statusOverride || 'APPROVED';
  }

  const newEvent: SchoolEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    title,
    categoryId,
    startDate,
    endDate: endDate || startDate,
    startTime: isAllDay ? '' : (startTime || '08:30'),
    endTime: isAllDay ? '' : (endTime || '16:30'),
    isAllDay: !!isAllDay,
    location: location || '',
    description: description || '',
    coordinator: coordinator || `${user.name} ${user.surname}`,
    department: department || user.department,
    targetGroup: targetGroup || 'ทุกคนในโรงเรียน',
    priority: priority || 'NORMAL',
    status,
    attachments: attachments || [],
    recurrence: recurrence || 'NONE',
    recurrenceEndDate: recurrenceEndDate || undefined,
    notifySchedule: notifySchedule || ['1_DAY_BEFORE', '1_HOUR_BEFORE'],
    sendTelegram: sendTelegram !== undefined ? sendTelegram : true,
    createdBy: user.id,
    createdByName: `${user.name} ${user.surname}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.getData().events.push(newEvent);

  // If recurring, generate child events
  if (newEvent.recurrence !== 'NONE' && newEvent.recurrenceEndDate) {
    let currStart = new Date(newEvent.startDate);
    const endLimit = new Date(newEvent.recurrenceEndDate);

    while (true) {
      if (newEvent.recurrence === 'DAILY') {
        currStart.setDate(currStart.getDate() + 1);
      } else if (newEvent.recurrence === 'WEEKLY') {
        currStart.setDate(currStart.getDate() + 7);
      } else if (newEvent.recurrence === 'MONTHLY') {
        currStart.setMonth(currStart.getMonth() + 1);
      } else if (newEvent.recurrence === 'YEARLY') {
        currStart.setFullYear(currStart.getFullYear() + 1);
      }

      if (currStart > endLimit) break;

      const dateStr = currStart.toISOString().split('T')[0];
      const childEvent: SchoolEvent = {
        ...newEvent,
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        startDate: dateStr,
        endDate: dateStr,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.getData().events.push(childEvent);
    }
  }

  db.save();
  logActivity(user, 'CREATE_EVENT', `สร้างกิจกรรมใหม่: "${newEvent.title}" (สถานะ: ${newEvent.status})`, req);

  // If approved immediately and sendTelegram enabled
  if (newEvent.status === 'APPROVED' && newEvent.sendTelegram) {
    TelegramService.sendEventNotification(newEvent).catch((err) =>
      console.error('Telegram dispatch error on create:', err)
    );
  }

  res.status(201).json({
    message: newEvent.status === 'APPROVED' ? 'สร้างกิจกรรมสำเร็จ' : 'สร้างกิจกรรมสำเร็จและส่งเพื่อรอการอนุมัติ',
    event: newEvent,
  });
});

// Update Event
eventRouter.put('/:id', authenticateToken, requirePermission('events.edit'), async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const eventId = req.params.id;
  const eventIndex = db.getData().events.findIndex((e) => e.id === eventId);

  if (eventIndex === -1) {
    res.status(404).json({ error: 'ไม่พบกิจกรรมที่ต้องการแก้ไข' });
    return;
  }

  const existing = db.getData().events[eventIndex];

  // If staff, ensure they created the event or are admin
  if (user.role !== 'ADMIN' && existing.createdBy !== user.id) {
    res.status(403).json({ error: 'คุณสามารถแก้ไขได้เฉพาะกิจกรรมที่คุณเป็นผู้สร้างเท่านั้น' });
    return;
  }

  const oldSnapshot = {
    title: existing.title,
    date: existing.startDate === existing.endDate ? formatThaiDate(existing.startDate) : `${formatThaiDate(existing.startDate)} - ${formatThaiDate(existing.endDate)}`,
    time: existing.isAllDay ? 'ตลอดวัน' : `${existing.startTime} - ${existing.endTime} น.`,
    location: existing.location,
    coordinator: existing.coordinator,
  };

  const {
    title,
    categoryId,
    startDate,
    endDate,
    startTime,
    endTime,
    isAllDay,
    location,
    description,
    coordinator,
    department,
    targetGroup,
    priority,
    status,
    attachments,
    recurrence,
    notifySchedule,
    sendTelegram,
  } = req.body;

  if (title) existing.title = title;
  if (categoryId) existing.categoryId = categoryId;
  if (startDate) existing.startDate = startDate;
  if (endDate) existing.endDate = endDate;
  if (startTime !== undefined) existing.startTime = startTime;
  if (endTime !== undefined) existing.endTime = endTime;
  if (isAllDay !== undefined) existing.isAllDay = isAllDay;
  if (location !== undefined) existing.location = location;
  if (description !== undefined) existing.description = description;
  if (coordinator) existing.coordinator = coordinator;
  if (department) existing.department = department;
  if (targetGroup) existing.targetGroup = targetGroup;
  if (priority) existing.priority = priority;
  if (status && user.role === 'ADMIN') existing.status = status;
  if (attachments) existing.attachments = attachments;
  if (recurrence) existing.recurrence = recurrence;
  if (notifySchedule) existing.notifySchedule = notifySchedule;
  if (sendTelegram !== undefined) existing.sendTelegram = sendTelegram;
  existing.updatedAt = new Date().toISOString();

  db.save();
  logActivity(user, 'UPDATE_EVENT', `แก้ไขกิจกรรม: "${existing.title}"`, req);

  // Check if significant fields changed
  const dateChanged = oldSnapshot.date !== (existing.startDate === existing.endDate ? formatThaiDate(existing.startDate) : `${formatThaiDate(existing.startDate)} - ${formatThaiDate(existing.endDate)}`);
  const timeChanged = oldSnapshot.time !== (existing.isAllDay ? 'ตลอดวัน' : `${existing.startTime} - ${existing.endTime} น.`);
  const locChanged = oldSnapshot.location !== existing.location;
  const coordChanged = oldSnapshot.coordinator !== existing.coordinator;

  if (existing.status === 'APPROVED' && existing.sendTelegram && (dateChanged || timeChanged || locChanged || coordChanged)) {
    TelegramService.sendEventChangeNotification(oldSnapshot, existing).catch((err) =>
      console.error('Telegram change notification error:', err)
    );
  }

  res.json({ message: 'แก้ไขกิจกรรมสำเร็จ', event: existing });
});

// Delete Event
eventRouter.delete('/:id', authenticateToken, requirePermission('events.delete'), (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const eventId = req.params.id;
  const eventIndex = db.getData().events.findIndex((e) => e.id === eventId);

  if (eventIndex === -1) {
    res.status(404).json({ error: 'ไม่พบกิจกรรมที่ต้องการลบ' });
    return;
  }

  const existing = db.getData().events[eventIndex];
  if (user.role !== 'ADMIN' && existing.createdBy !== user.id) {
    res.status(403).json({ error: 'คุณสามารถลบได้เฉพาะกิจกรรมที่คุณเป็นผู้สร้างเท่านั้น' });
    return;
  }

  db.getData().events.splice(eventIndex, 1);
  db.save();
  logActivity(user, 'DELETE_EVENT', `ลบกิจกรรม: "${existing.title}"`, req);

  res.json({ message: 'ลบกิจกรรมสำเร็จ' });
});

// Approve Event (Admin Only)
eventRouter.post('/:id/approve', authenticateToken, requirePermission('events.approve'), async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const event = db.getData().events.find((e) => e.id === req.params.id);

  if (!event) {
    res.status(404).json({ error: 'ไม่พบกิจกรรมที่ระบุ' });
    return;
  }

  event.status = 'APPROVED';
  event.rejectionReason = undefined;
  event.updatedAt = new Date().toISOString();

  db.save();
  logActivity(user, 'APPROVE_EVENT', `อนุมัติกิจกรรม: "${event.title}"`, req);

  if (event.sendTelegram) {
    TelegramService.sendEventNotification(event, '✅ <b>อนุมัติกิจกรรมโรงเรียนใหม่</b>').catch((err) =>
      console.error('Telegram dispatch error on approve:', err)
    );
  }

  res.json({ message: 'อนุมัติกิจกรรมสำเร็จ และส่งแจ้งเตือนเรียบร้อยแล้ว', event });
});

// Reject Event (Admin Only)
eventRouter.post('/:id/reject', authenticateToken, requirePermission('events.approve'), (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { reason } = req.body;
  const event = db.getData().events.find((e) => e.id === req.params.id);

  if (!event) {
    res.status(404).json({ error: 'ไม่พบกิจกรรมที่ระบุ' });
    return;
  }

  event.status = 'REJECTED';
  event.rejectionReason = reason || 'ไม่อนุมัติโดยผู้ดูแลระบบ';
  event.updatedAt = new Date().toISOString();

  db.save();
  logActivity(user, 'REJECT_EVENT', `ปฏิเสธกิจกรรม: "${event.title}" (เหตุผล: ${event.rejectionReason})`, req);

  res.json({ message: 'ปฏิเสธกิจกรรมสำเร็จ', event });
});

// Instant Telegram Notification for an Event
eventRouter.post('/:id/notify-telegram', authenticateToken, requirePermission('events.view'), async (req: AuthRequest, res: Response) => {
  const event = db.getData().events.find((e) => e.id === req.params.id);

  if (!event) {
    res.status(404).json({ error: 'ไม่พบกิจกรรมที่ระบุ' });
    return;
  }

  const result = await TelegramService.sendEventNotification(event, '📢 <b>แจ้งเตือนกิจกรรมโรงเรียน</b>');
  res.json(result);
});

