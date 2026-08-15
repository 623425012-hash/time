import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest, requirePermission } from '../auth';

export const logRouter = Router();

// Get Activity Logs (default endpoint for /api/logs and /api/logs/activity)
logRouter.get('/', authenticateToken, requirePermission('logs.view'), (req: AuthRequest, res: Response) => {
  const { action, userId, search, limit = '100' } = req.query;
  let logs = db.getData().activityLogs;

  if (action) {
    logs = logs.filter((l) => l.action === action);
  }
  if (userId) {
    logs = logs.filter((l) => l.userId === userId);
  }
  if (search) {
    const q = String(search).toLowerCase();
    logs = logs.filter((l) => l.details.toLowerCase().includes(q) || l.userName.toLowerCase().includes(q));
  }

  const max = Number(limit) || 100;
  res.json({ logs: logs.slice(0, max), total: logs.length });
});

// Get Activity Logs
logRouter.get('/activity', authenticateToken, requirePermission('logs.view'), (req: AuthRequest, res: Response) => {
  const { action, userId, search, limit = '100' } = req.query;
  let logs = db.getData().activityLogs;

  if (action) {
    logs = logs.filter((l) => l.action === action);
  }
  if (userId) {
    logs = logs.filter((l) => l.userId === userId);
  }
  if (search) {
    const q = String(search).toLowerCase();
    logs = logs.filter((l) => l.details.toLowerCase().includes(q) || l.userName.toLowerCase().includes(q));
  }

  const max = Number(limit) || 100;
  res.json({ logs: logs.slice(0, max), total: logs.length });
});

// Get Notification Logs
logRouter.get('/notifications', authenticateToken, requirePermission('telegram.manage'), (req: AuthRequest, res: Response) => {
  const { status, type, limit = '100' } = req.query;
  let notifLogs = db.getData().notificationLogs;

  if (status) {
    notifLogs = notifLogs.filter((n) => n.status === status);
  }
  if (type) {
    notifLogs = notifLogs.filter((n) => n.type === type);
  }

  const max = Number(limit) || 100;
  res.json({ notificationLogs: notifLogs.slice(0, max), total: notifLogs.length });
});

// Clear Notification Logs
logRouter.delete('/notifications/clear', authenticateToken, requirePermission('telegram.manage'), (req: AuthRequest, res: Response) => {
  db.getData().notificationLogs = [];
  db.save();
  res.json({ message: 'ล้างประวัติการแจ้งเตือนสำเร็จ' });
});
