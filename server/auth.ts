import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { User, UserRole, UserPermission, ActivityAction, ActivityLog } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'school-calendar-secret-jwt-key-2026';

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      name: user.name,
      surname: user.surname,
      department: user.department,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ error: 'ไม่พบ Token ยืนยันตัวตน กรุณาเข้าสู่ระบบ' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const user = db.getData().users.find((u) => u.id === payload.id);
    if (!user || user.status === 'INACTIVE') {
      res.status(403).json({ error: 'บัญชีผู้ใช้นี้ถูกระงับหรือไม่พบในระบบ' });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Token หมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่' });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'ยังไม่ได้เข้าสู่ระบบ' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้ (สิทธิ์ไม่เพียงพอ)' });
      return;
    }
    next();
  };
}

export function requirePermission(permission: UserPermission) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'ยังไม่ได้เข้าสู่ระบบ' });
      return;
    }
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      res.status(403).json({ error: `คุณไม่มีสิทธิ์การใช้งาน: ${permission}` });
      return;
    }
    next();
  };
}

export function logActivity(
  user: User | undefined,
  action: ActivityAction,
  details: string,
  req?: Request
): void {
  const ipAddress = (req?.headers['x-forwarded-for'] as string) || req?.socket.remoteAddress || '127.0.0.1';
  const userAgent = req?.headers['user-agent'] || 'Web Browser';

  const log: ActivityLog = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    userId: user ? user.id : 'SYSTEM',
    userName: user ? `${user.name} ${user.surname}` : 'ระบบอัตโนมัติ',
    action,
    details,
    ipAddress,
    userAgent,
  };

  db.getData().activityLogs.unshift(log);
  if (db.getData().activityLogs.length > 500) {
    db.getData().activityLogs = db.getData().activityLogs.slice(0, 500);
  }
  db.save();
}
