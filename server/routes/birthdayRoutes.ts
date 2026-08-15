import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest, requirePermission, logActivity } from '../auth';
import { TelegramService } from '../telegram';
import { StaffBirthday } from '../types';

export const birthdayRouter = Router();

// Get all birthdays
birthdayRouter.get('/', (req, res) => {
  const { month } = req.query;
  let birthdays = db.getData().birthdays;

  if (month) {
    const formattedMonth = String(month).padStart(2, '0');
    birthdays = birthdays.filter((b) => b.birthDate.split('-')[1] === formattedMonth);
  }

  // Sort by month and day
  birthdays.sort((a, b) => {
    const mmddA = a.birthDate.substring(5);
    const mmddB = b.birthDate.substring(5);
    return mmddA.localeCompare(mmddB);
  });

  res.json({ birthdays });
});

// Create Birthday
birthdayRouter.post('/', authenticateToken, requirePermission('birthdays.manage'), (req: AuthRequest, res: Response) => {
  const { name, nickname, birthDate, department, position, phone, profileImage } = req.body;

  if (!name || !birthDate) {
    res.status(400).json({ error: 'กรุณากรอกชื่อและวันเดือนปีเกิด' });
    return;
  }

  const newBirthday: StaffBirthday = {
    id: `bday-${Date.now()}`,
    name,
    nickname: nickname || '',
    birthDate,
    department: department || 'ทั่วไป',
    position: position || 'บุคลากร',
    phone: phone || '',
    profileImage: profileImage || '',
    greetingsSentYears: [],
    createdAt: new Date().toISOString(),
  };

  db.getData().birthdays.push(newBirthday);
  db.save();

  logActivity(req.user, 'CREATE_USER', `เพิ่มข้อมูลวันเกิดบุคลากร: ${newBirthday.name}`, req);
  res.status(201).json({ message: 'บันทึกวันเกิดบุคลากรสำเร็จ', birthday: newBirthday });
});

// Update Birthday
birthdayRouter.put('/:id', authenticateToken, requirePermission('birthdays.manage'), (req: AuthRequest, res: Response) => {
  const birthday = db.getData().birthdays.find((b) => b.id === req.params.id);
  if (!birthday) {
    res.status(404).json({ error: 'ไม่พบข้อมูลวันเกิดบุคลากร' });
    return;
  }

  const { name, nickname, birthDate, department, position, phone, profileImage } = req.body;
  if (name) birthday.name = name;
  if (nickname !== undefined) birthday.nickname = nickname;
  if (birthDate) birthday.birthDate = birthDate;
  if (department) birthday.department = department;
  if (position) birthday.position = position;
  if (phone !== undefined) birthday.phone = phone;
  if (profileImage !== undefined) birthday.profileImage = profileImage;

  db.save();
  logActivity(req.user, 'UPDATE_USER', `แก้ไขข้อมูลวันเกิดบุคลากร: ${birthday.name}`, req);

  res.json({ message: 'แก้ไขข้อมูลสำเร็จ', birthday });
});

// Delete Birthday
birthdayRouter.delete('/:id', authenticateToken, requirePermission('birthdays.manage'), (req: AuthRequest, res: Response) => {
  const index = db.getData().birthdays.findIndex((b) => b.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'ไม่พบข้อมูลวันเกิดบุคลากร' });
    return;
  }

  const removed = db.getData().birthdays[index];
  db.getData().birthdays.splice(index, 1);
  db.save();

  logActivity(req.user, 'DELETE_USER', `ลบข้อมูลวันเกิด: ${removed.name}`, req);
  res.json({ message: 'ลบข้อมูลสำเร็จ' });
});

// Send Birthday Greeting via Telegram
birthdayRouter.post('/:id/send-greeting', authenticateToken, requirePermission('birthdays.manage'), async (req: AuthRequest, res: Response) => {
  const birthday = db.getData().birthdays.find((b) => b.id === req.params.id);
  if (!birthday) {
    res.status(404).json({ error: 'ไม่พบข้อมูลวันเกิดบุคลากร' });
    return;
  }

  const result = await TelegramService.sendBirthdayGreeting(birthday);
  res.json(result);
});

// Alias for wish / send greeting
birthdayRouter.post('/:id/wish', authenticateToken, requirePermission('birthdays.manage'), async (req: AuthRequest, res: Response) => {
  const birthday = db.getData().birthdays.find((b) => b.id === req.params.id);
  if (!birthday) {
    res.status(404).json({ error: 'ไม่พบข้อมูลวันเกิดบุคลากร' });
    return;
  }

  const result = await TelegramService.sendBirthdayGreeting(birthday);
  res.json(result);
});
