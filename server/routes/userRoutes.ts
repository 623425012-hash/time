import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, ALL_PERMISSIONS, STAFF_PERMISSIONS, VIEWER_PERMISSIONS } from '../db';
import { authenticateToken, AuthRequest, requirePermission, logActivity } from '../auth';
import { User, UserRole, UserPermission } from '../types';

export const userRouter = Router();

// Get all users
userRouter.get('/', authenticateToken, requirePermission('users.view'), (req: AuthRequest, res: Response) => {
  const users = db.getData().users.map(({ passwordHash, ...safe }) => safe);
  res.json({ users });
});

// Create User (Admin)
userRouter.post('/', authenticateToken, requirePermission('users.create'), (req: AuthRequest, res: Response) => {
  const { name, surname, username, email, password, department, position, role, permissions, status, profileImage } = req.body;

  if (!name || !surname || !username || !email || !password) {
    res.status(400).json({ error: 'กรุณากรอกชื่อ นามสกุล Username Email และรหัสผ่าน' });
    return;
  }

  const existing = db.getData().users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()
  );
  if (existing) {
    res.status(400).json({ error: 'Username หรือ Email นี้ถูกใช้งานแล้ว' });
    return;
  }

  const assignedRole: UserRole = role || 'STAFF';
  let assignedPermissions: UserPermission[] = permissions;
  if (!assignedPermissions || assignedPermissions.length === 0) {
    if (assignedRole === 'ADMIN') assignedPermissions = ALL_PERMISSIONS;
    else if (assignedRole === 'STAFF') assignedPermissions = STAFF_PERMISSIONS;
    else assignedPermissions = VIEWER_PERMISSIONS;
  }

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
    permissions: assignedPermissions,
    status: status || 'ACTIVE',
    profileImage: profileImage || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.getData().users.push(newUser);
  db.save();

  logActivity(req.user, 'CREATE_USER', `สร้างบัญชีผู้ใช้ใหม่: ${newUser.username} (${newUser.role})`, req);

  const { passwordHash: _, ...safe } = newUser;
  res.status(201).json({ message: 'สร้างผู้ใช้งานสำเร็จ', user: safe });
});

// Update User (Admin)
userRouter.put('/:id', authenticateToken, requirePermission('users.edit'), (req: AuthRequest, res: Response) => {
  const user = db.getData().users.find((u) => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: 'ไม่พบผู้ใช้งานที่ระบุ' });
    return;
  }

  const { name, surname, email, password, department, position, role, permissions, status, profileImage } = req.body;

  if (name) user.name = name;
  if (surname) user.surname = surname;
  if (email) user.email = email;
  if (department) user.department = department;
  if (position) user.position = position;
  if (role) user.role = role;
  if (permissions) user.permissions = permissions;
  if (status) user.status = status;
  if (profileImage !== undefined) user.profileImage = profileImage;

  if (password && password.trim().length >= 6) {
    const salt = bcrypt.genSaltSync(10);
    user.passwordHash = bcrypt.hashSync(password, salt);
  }

  user.updatedAt = new Date().toISOString();
  db.save();

  logActivity(req.user, 'UPDATE_USER', `แก้ไขข้อมูลผู้ใช้: ${user.username} (${user.role})`, req);

  const { passwordHash: _, ...safe } = user;
  res.json({ message: 'แก้ไขข้อมูลผู้ใช้งานสำเร็จ', user: safe });
});

// Delete User (Admin)
userRouter.delete('/:id', authenticateToken, requirePermission('users.delete'), (req: AuthRequest, res: Response) => {
  if (req.user?.id === req.params.id) {
    res.status(400).json({ error: 'ไม่สามารถลบบัญชีผู้ใช้งานของตนเองได้' });
    return;
  }

  const index = db.getData().users.findIndex((u) => u.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'ไม่พบผู้ใช้งานที่ระบุ' });
    return;
  }

  const removed = db.getData().users[index];
  db.getData().users.splice(index, 1);
  db.save();

  logActivity(req.user, 'DELETE_USER', `ลบบัญชีผู้ใช้: ${removed.username}`, req);
  res.json({ message: 'ลบผู้ใช้งานสำเร็จ' });
});
