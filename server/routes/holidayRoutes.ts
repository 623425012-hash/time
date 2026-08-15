import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest, requirePermission, logActivity } from '../auth';
import { ThaiHoliday } from '../types';

export const holidayRouter = Router();

// Get all holidays
holidayRouter.get('/', (req, res) => {
  const { year, type } = req.query;
  let holidays = db.getData().holidays;

  if (year) {
    holidays = holidays.filter((h) => h.year === Number(year));
  }
  if (type) {
    holidays = holidays.filter((h) => h.type === type);
  }

  holidays.sort((a, b) => a.date.localeCompare(b.date));
  res.json({ holidays });
});

// Restore Default Thai Holidays
holidayRouter.post('/restore-defaults', authenticateToken, requirePermission('holidays.manage'), (req: AuthRequest, res: Response) => {
  const years = [2025, 2026, 2027];
  const standardHolidays: ThaiHoliday[] = [];
  
  years.forEach((yr) => {
    standardHolidays.push(
      { id: `h-${yr}-1`, date: `${yr}-01-01`, name: 'วันขึ้นปีใหม่', type: 'HOLIDAY', year: yr, description: 'วันหยุดราชการประจำปี', color: '#475569' },
      { id: `h-${yr}-2`, date: `${yr}-01-16`, name: 'วันครูแห่งชาติ', type: 'SCHOOL_DAY', year: yr, description: 'วันสำคัญของสถานศึกษาและครูอาจารย์', color: '#2563eb' },
      { id: `h-${yr}-3`, date: `${yr}-03-03`, name: 'วันมาฆบูชา', type: 'HOLIDAY', year: yr, description: 'วันสำคัญทางพระพุทธศาสนา', color: '#ca8a04' },
      { id: `h-${yr}-4`, date: `${yr}-04-06`, name: 'วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราช (วันจักรี)', type: 'HOLIDAY', year: yr, description: 'วันหยุดราชการ', color: '#475569' },
      { id: `h-${yr}-5`, date: `${yr}-04-13`, name: 'วันสงกรานต์', type: 'HOLIDAY', year: yr, description: 'วันขึ้นปีใหม่ไทย', color: '#475569' },
      { id: `h-${yr}-6`, date: `${yr}-04-14`, name: 'วันสงกรานต์ (วันครอบครัว)', type: 'HOLIDAY', year: yr, description: 'วันหยุดราชการ', color: '#475569' },
      { id: `h-${yr}-7`, date: `${yr}-04-15`, name: 'วันสงกรานต์', type: 'HOLIDAY', year: yr, description: 'วันหยุดราชการ', color: '#475569' },
      { id: `h-${yr}-8`, date: `${yr}-05-01`, name: 'วันแรงงานแห่งชาติ', type: 'HOLIDAY', year: yr, description: 'วันหยุดราชการ/ประเพณี', color: '#475569' },
      { id: `h-${yr}-9`, date: `${yr}-05-04`, name: 'วันฉัตรมงคล', type: 'HOLIDAY', year: yr, description: 'วันหยุดราชการ', color: '#475569' },
      { id: `h-${yr}-10`, date: `${yr}-05-31`, name: 'วันวิสาขบูชา', type: 'HOLIDAY', year: yr, description: 'วันสำคัญสากลทางพระพุทธศาสนา', color: '#ca8a04' },
      { id: `h-${yr}-11`, date: `${yr}-06-03`, name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี', type: 'HOLIDAY', year: yr, description: 'วันหยุดราชการ', color: '#475569' },
      { id: `h-${yr}-12`, date: `${yr}-07-28`, name: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว', type: 'HOLIDAY', year: yr, description: 'วันหยุดราชการ', color: '#475569' },
      { id: `h-${yr}-13`, date: `${yr}-07-29`, name: 'วันอาสาฬหบูชา', type: 'HOLIDAY', year: yr, description: 'วันสำคัญทางพุทธศาสนา', color: '#ca8a04' },
      { id: `h-${yr}-14`, date: `${yr}-07-30`, name: 'วันเข้าพรรษา', type: 'HOLIDAY', year: yr, description: 'วันหยุดราชการ', color: '#ca8a04' },
      { id: `h-${yr}-15`, date: `${yr}-08-12`, name: 'วันแม่แห่งชาติ / วันเฉลิมพระชนมพรรษาพระบรมราชชนนีพันปีหลวง', type: 'HOLIDAY', year: yr, description: 'วันแม่แห่งชาติและวันหยุดราชการ', color: '#475569' },
      { id: `h-${yr}-16`, date: `${yr}-08-18`, name: 'วันวิทยาศาสตร์แห่งชาติ', type: 'IMPORTANT_DAY', year: yr, description: 'จัดกิจกรรมสัปดาห์วิทยาศาสตร์และนิทรรศการโครงงาน', color: '#2563eb' },
      { id: `h-${yr}-17`, date: `${yr}-10-13`, name: 'วันนวมินทรมหาราช', type: 'HOLIDAY', year: yr, description: 'วันคล้ายวันสวรรคตรัชกาลที่ 9', color: '#475569' },
      { id: `h-${yr}-18`, date: `${yr}-10-23`, name: 'วันปิยมหาราช', type: 'HOLIDAY', year: yr, description: 'วันคล้ายวันสวรรคตพระบาทสมเด็จพระจุลจอมเกล้าเจ้าอยู่หัว', color: '#475569' },
      { id: `h-${yr}-19`, date: `${yr}-12-05`, name: 'วันพ่อแห่งชาติ / วันชาติ', type: 'HOLIDAY', year: yr, description: 'วันคล้ายวันพระบรมราชสมภพรัชกาลที่ 9', color: '#475569' },
      { id: `h-${yr}-20`, date: `${yr}-12-10`, name: 'วันรัฐธรรมนูญ', type: 'HOLIDAY', year: yr, description: 'วันหยุดราชการ', color: '#475569' },
      { id: `h-${yr}-21`, date: `${yr}-12-31`, name: 'วันสิ้นปี', type: 'HOLIDAY', year: yr, description: 'วันหยุดราชการส่งท้ายปีเก่า', color: '#475569' }
    );
  });

  db.getData().holidays = standardHolidays;
  db.save();
  logActivity(req.user, 'RESTORE_HOLIDAYS', 'รีเซ็ตวันหยุดราชการและวันสำคัญกลับเป็นค่าเริ่มต้น', req);

  res.json({ message: 'คืนค่าวันสำคัญและวันหยุดราชการเรียบร้อยแล้ว', holidays: standardHolidays });
});

// Create Holiday
holidayRouter.post('/', authenticateToken, requirePermission('holidays.manage'), (req: AuthRequest, res: Response) => {
  const { date, name, type, description, color } = req.body;
  if (!date || !name || !type) {
    res.status(400).json({ error: 'กรุณากรอกวันที่ ชื่อวัน และประเภทวันสำคัญ/วันหยุด' });
    return;
  }

  const year = new Date(date).getFullYear();
  const newHoliday: ThaiHoliday = {
    id: `h-${Date.now()}`,
    date,
    name,
    type,
    description: description || '',
    year,
    color: color || (type === 'HOLIDAY' ? '#475569' : type === 'IMPORTANT_DAY' ? '#ca8a04' : '#2563eb'),
  };

  db.getData().holidays.push(newHoliday);
  db.save();
  logActivity(req.user, 'CREATE_HOLIDAY', `เพิ่มวันสำคัญ/วันหยุด: "${newHoliday.name}" (${newHoliday.date})`, req);

  res.status(201).json({ message: 'เพิ่มวันสำคัญ/วันหยุดสำเร็จ', holiday: newHoliday });
});

// Update Holiday
holidayRouter.put('/:id', authenticateToken, requirePermission('holidays.manage'), (req: AuthRequest, res: Response) => {
  const holiday = db.getData().holidays.find((h) => h.id === req.params.id);
  if (!holiday) {
    res.status(404).json({ error: 'ไม่พบข้อมูลวันสำคัญ' });
    return;
  }

  const { date, name, type, description, color } = req.body;
  if (date) {
    holiday.date = date;
    holiday.year = new Date(date).getFullYear();
  }
  if (name) holiday.name = name;
  if (type) holiday.type = type;
  if (description !== undefined) holiday.description = description;
  if (color) holiday.color = color;

  db.save();
  logActivity(req.user, 'UPDATE_SETTINGS', `แก้ไขวันสำคัญ/วันหยุด: "${holiday.name}"`, req);

  res.json({ message: 'แก้ไขข้อมูลสำเร็จ', holiday });
});

// Delete Holiday
holidayRouter.delete('/:id', authenticateToken, requirePermission('holidays.manage'), (req: AuthRequest, res: Response) => {
  const index = db.getData().holidays.findIndex((h) => h.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'ไม่พบข้อมูลวันสำคัญ' });
    return;
  }

  const removed = db.getData().holidays[index];
  db.getData().holidays.splice(index, 1);
  db.save();
  logActivity(req.user, 'DELETE_HOLIDAY', `ลบวันสำคัญ/วันหยุด: "${removed.name}"`, req);

  res.json({ message: 'ลบข้อมูลสำเร็จ' });
});
