import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest, requirePermission, logActivity } from '../auth';
import { TelegramService } from '../telegram';
import { Announcement } from '../types';

export const announcementRouter = Router();

// Get announcements
announcementRouter.get('/', (req, res) => {
  const { status, onlyDashboard } = req.query;
  let announcements = db.getData().announcements;

  if (status) {
    announcements = announcements.filter((a) => a.status === status);
  }
  if (onlyDashboard === 'true') {
    announcements = announcements.filter((a) => a.showDashboard && a.status === 'ACTIVE');
  }

  announcements.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ announcements });
});

// Create Announcement
announcementRouter.post('/', authenticateToken, requirePermission('announcements.manage'), async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { title, content, image, file, priority, showDashboard, sendTelegram, startDate, endDate } = req.body;

  if (!title || !content) {
    res.status(400).json({ error: 'กรุณากรอกหัวข้อและรายละเอียดประกาศ' });
    return;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const newAnnouncement: Announcement = {
    id: `ann-${Date.now()}`,
    title,
    content,
    image: image || '',
    file: file || undefined,
    priority: priority || 'NORMAL',
    showDashboard: showDashboard !== undefined ? showDashboard : true,
    sendTelegram: !!sendTelegram,
    startDate: startDate || todayStr,
    endDate: endDate || '2099-12-31',
    status: 'ACTIVE',
    createdBy: user.id,
    createdByName: `${user.name} ${user.surname}`,
    createdAt: new Date().toISOString(),
  };

  db.getData().announcements.push(newAnnouncement);
  db.save();

  logActivity(user, 'CREATE_EVENT', `สร้างประกาศใหม่: "${newAnnouncement.title}"`, req);

  if (newAnnouncement.sendTelegram) {
    TelegramService.sendAnnouncement(newAnnouncement).catch((err) =>
      console.error('Telegram announcement error:', err)
    );
  }

  res.status(201).json({ message: 'สร้างประกาศสำเร็จ', announcement: newAnnouncement });
});

// Update Announcement
announcementRouter.put('/:id', authenticateToken, requirePermission('announcements.manage'), (req: AuthRequest, res: Response) => {
  const announcement = db.getData().announcements.find((a) => a.id === req.params.id);
  if (!announcement) {
    res.status(404).json({ error: 'ไม่พบประกาศที่ระบุ' });
    return;
  }

  const { title, content, image, file, priority, showDashboard, sendTelegram, startDate, endDate, status } = req.body;
  if (title) announcement.title = title;
  if (content) announcement.content = content;
  if (image !== undefined) announcement.image = image;
  if (file !== undefined) announcement.file = file;
  if (priority) announcement.priority = priority;
  if (showDashboard !== undefined) announcement.showDashboard = showDashboard;
  if (sendTelegram !== undefined) announcement.sendTelegram = sendTelegram;
  if (startDate) announcement.startDate = startDate;
  if (endDate) announcement.endDate = endDate;
  if (status) announcement.status = status;

  db.save();
  logActivity(req.user, 'UPDATE_EVENT', `แก้ไขประกาศ: "${announcement.title}"`, req);

  res.json({ message: 'แก้ไขประกาศสำเร็จ', announcement });
});

// Delete Announcement
announcementRouter.delete('/:id', authenticateToken, requirePermission('announcements.manage'), (req: AuthRequest, res: Response) => {
  const index = db.getData().announcements.findIndex((a) => a.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'ไม่พบประกาศที่ระบุ' });
    return;
  }

  const removed = db.getData().announcements[index];
  db.getData().announcements.splice(index, 1);
  db.save();

  logActivity(req.user, 'DELETE_EVENT', `ลบประกาศ: "${removed.title}"`, req);
  res.json({ message: 'ลบประกาศสำเร็จ' });
});

// Broadcast Announcement to Telegram
announcementRouter.post('/:id/broadcast-telegram', authenticateToken, requirePermission('announcements.manage'), async (req: AuthRequest, res: Response) => {
  const announcement = db.getData().announcements.find((a) => a.id === req.params.id);
  if (!announcement) {
    res.status(404).json({ error: 'ไม่พบประกาศที่ระบุ' });
    return;
  }

  const result = await TelegramService.sendAnnouncement(announcement);
  res.json(result);
});
