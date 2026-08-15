import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, ALL_PERMISSIONS, STAFF_PERMISSIONS, VIEWER_PERMISSIONS } from '../db';
import { authenticateToken, AuthRequest, generateToken, logActivity } from '../auth';
import { User } from '../types';

export const authRouter = Router();

// Login
authRouter.post('/login', (req, res) => {
  const { usernameOrEmail, password } = req.body;
  if (!usernameOrEmail || !password) {
    res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้งาน/อีเมล และรหัสผ่าน' });
    return;
  }

  const user = db.getData().users.find(
    (u) => u.username.toLowerCase() === usernameOrEmail.toLowerCase() || u.email.toLowerCase() === usernameOrEmail.toLowerCase()
  );

  if (!user) {
    res.status(401).json({ error: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' });
    return;
  }

  if (user.status === 'INACTIVE') {
    res.status(403).json({ error: 'บัญชีผู้ใช้งานนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' });
    return;
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ error: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' });
    return;
  }

  const token = generateToken(user);
  logActivity(user, 'LOGIN', `เข้าสู่ระบบสำเร็จในบทบาท ${user.role}`, req);

  const { passwordHash: _, ...userSafe } = user;
  res.json({
    message: 'เข้าสู่ระบบสำเร็จ',
    token,
    user: userSafe,
  });
});

// Quick Demo Login
authRouter.post('/quick-login', (req, res) => {
  const { role } = req.body;
  const targetRole = role === 'ADMIN' ? 'ADMIN' : role === 'STAFF' ? 'STAFF' : 'VIEWER';
  
  // Find first active user with matching role
  let user = db.getData().users.find((u) => u.role === targetRole && u.status === 'ACTIVE');
  
  if (!user) {
    // If not found, find any user with that role
    user = db.getData().users.find((u) => u.role === targetRole);
  }

  if (!user) {
    res.status(404).json({ error: `ไม่พบบัญชีผู้ใช้ในบทบาท ${targetRole}` });
    return;
  }

  const token = generateToken(user);
  logActivity(user, 'LOGIN', `เข้าสู่ระบบด่วน (Demo Login) ในบทบาท ${user.role}`, req);

  const { passwordHash: _, ...userSafe } = user;
  res.json({
    message: `เข้าสู่ระบบในฐานะ ${user.role} สำเร็จ`,
    token,
    user: userSafe,
  });
});

// Get current user profile
authRouter.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { passwordHash: _, ...userSafe } = req.user;
  res.json({ user: userSafe });
});

// Update current user profile
authRouter.put('/profile', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { name, surname, email, department, position, profileImage } = req.body;

  const targetUser = db.getData().users.find((u) => u.id === req.user!.id);
  if (!targetUser) {
    res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้งาน' });
    return;
  }

  if (name) targetUser.name = name;
  if (surname) targetUser.surname = surname;
  if (email) targetUser.email = email;
  if (department) targetUser.department = department;
  if (position) targetUser.position = position;
  if (profileImage !== undefined) targetUser.profileImage = profileImage;
  targetUser.updatedAt = new Date().toISOString();

  db.save();
  logActivity(targetUser, 'UPDATE_USER', 'อัปเดตข้อมูลโปรไฟล์ส่วนตัว', req);

  const { passwordHash: _, ...userSafe } = targetUser;
  res.json({ message: 'อัปเดตโปรไฟล์สำเร็จ', user: userSafe });
});

// Change Password
authRouter.put('/password', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'กรุณากรอกรหัสผ่านเดิมและรหัสผ่านใหม่' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
    return;
  }

  const targetUser = db.getData().users.find((u) => u.id === req.user!.id);
  if (!targetUser) {
    res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้งาน' });
    return;
  }

  const isMatch = bcrypt.compareSync(currentPassword, targetUser.passwordHash);
  if (!isMatch) {
    res.status(400).json({ error: 'รหัสผ่านเดิมไม่ถูกต้อง' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  targetUser.passwordHash = bcrypt.hashSync(newPassword, salt);
  targetUser.updatedAt = new Date().toISOString();

  db.save();
  logActivity(targetUser, 'UPDATE_USER', 'เปลี่ยนรหัสผ่านสำเร็จ', req);

  res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
});

// Register (Public or Admin)
authRouter.post('/register', (req, res) => {
  const settings = db.getData().systemSettings;
  const { name, surname, username, email, password, department, position, role } = req.body;

  if (!name || !surname || !username || !email || !password) {
    res.status(400).json({ error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
    return;
  }

  const existingUser = db.getData().users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()
  );
  if (existingUser) {
    res.status(400).json({ error: 'ชื่อผู้ใช้งานหรืออีเมลนี้มีอยู่ในระบบแล้ว' });
    return;
  }

  const assignedRole = (role === 'ADMIN' || role === 'STAFF' || role === 'VIEWER') ? role : 'STAFF';
  let permissions = STAFF_PERMISSIONS;
  if (assignedRole === 'ADMIN') permissions = ALL_PERMISSIONS;
  if (assignedRole === 'VIEWER') permissions = VIEWER_PERMISSIONS;

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser: User = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name,
    surname,
    username,
    email,
    passwordHash,
    department: department || 'ทั่วไป',
    position: position || 'บุคลากร',
    role: assignedRole,
    permissions,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.getData().users.push(newUser);
  db.save();

  logActivity(newUser, 'CREATE_USER', `ลงทะเบียนผู้ใช้งานใหม่: ${newUser.username} (${newUser.role})`, req);

  const token = generateToken(newUser);
  const { passwordHash: _, ...userSafe } = newUser;
  res.status(201).json({ message: 'ลงทะเบียนสำเร็จ', token, user: userSafe });
});

// Logout
authRouter.post('/logout', authenticateToken, (req: AuthRequest, res: Response) => {
  if (req.user) {
    logActivity(req.user, 'LOGOUT', 'ออกจากระบบ', req);
  }
  res.json({ message: 'ออกจากระบบสำเร็จ' });
});
