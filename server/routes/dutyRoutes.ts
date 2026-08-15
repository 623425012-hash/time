import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest, requirePermission, logActivity } from '../auth';
import { TelegramService } from '../telegram';
import { DutyRoster, DutyGroup, DutySchedule, DutyMember } from '../types';

export const dutyRouter = Router();

// ==========================================
// 1. DUTY GROUPS (ชุดเวร)
// ==========================================

// Get all duty groups
dutyRouter.get('/groups', (req, res) => {
  const groups = db.getData().dutyGroups || [];
  res.json({ groups });
});

// Get single duty group
dutyRouter.get('/groups/:id', (req, res) => {
  const group = (db.getData().dutyGroups || []).find((g) => g.id === req.params.id);
  if (!group) {
    res.status(404).json({ error: 'ไม่พบข้อมูลชุดเวร' });
    return;
  }
  res.json({ group });
});

// Create Duty Group
dutyRouter.post('/groups', authenticateToken, requirePermission('duties.manage'), (req: AuthRequest, res: Response) => {
  const { name, code, color, description, responsibilities, members } = req.body;

  if (!name) {
    res.status(400).json({ error: 'กรุณาระบุชื่อชุดเวร' });
    return;
  }

  const groups = db.getData().dutyGroups || [];
  const newGroup: DutyGroup = {
    id: `group-${Date.now()}`,
    name,
    code: code || `GROUP-${groups.length + 1}`,
    color: color || '#2563eb',
    description: description || '',
    responsibilities: responsibilities || [
      'ดูแลความเรียบร้อยและความปลอดภัยบริเวณโรงเรียน',
      'ต้อนรับและดูแลความปลอดภัยนักเรียนบริเวณประตูโรงเรียน',
      'ตรวจสอบพื้นที่และอาคารเรียน',
      'ปฏิบัติหน้าที่ตามที่ได้รับมอบหมายจากสถานศึกษา',
    ],
    members: Array.isArray(members) ? members : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!db.getData().dutyGroups) {
    db.getData().dutyGroups = [];
  }
  db.getData().dutyGroups!.push(newGroup);
  db.save();

  logActivity(req.user, 'CREATE_DUTY', `เพิ่มชุดเวรใหม่: ${newGroup.name}`, req);
  res.status(201).json({ message: 'สร้างชุดเวรสำเร็จ', group: newGroup });
});

// Update Duty Group
dutyRouter.put('/groups/:id', authenticateToken, requirePermission('duties.manage'), (req: AuthRequest, res: Response) => {
  const groups = db.getData().dutyGroups || [];
  const group = groups.find((g) => g.id === req.params.id);

  if (!group) {
    res.status(404).json({ error: 'ไม่พบชุดเวรที่ต้องการแก้ไข' });
    return;
  }

  const { name, code, color, description, responsibilities, members } = req.body;
  if (name) group.name = name;
  if (code) group.code = code;
  if (color) group.color = color;
  if (description !== undefined) group.description = description;
  if (responsibilities) group.responsibilities = responsibilities;
  if (members) group.members = members;
  group.updatedAt = new Date().toISOString();

  db.save();
  logActivity(req.user, 'UPDATE_SETTINGS', `แก้ไขชุดเวร: ${group.name}`, req);

  res.json({ message: 'แก้ไขข้อมูลชุดเวรสำเร็จ', group });
});

// Delete Duty Group
dutyRouter.delete('/groups/:id', authenticateToken, requirePermission('duties.manage'), (req: AuthRequest, res: Response) => {
  const groups = db.getData().dutyGroups || [];
  const index = groups.findIndex((g) => g.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: 'ไม่พบชุดเวรที่ต้องการลบ' });
    return;
  }

  const removed = groups[index];
  groups.splice(index, 1);
  db.save();

  logActivity(req.user, 'DELETE_DUTY', `ลบชุดเวร: ${removed.name}`, req);
  res.json({ message: 'ลบชุดเวรสำเร็จ' });
});

// ==========================================
// 2. DUTY SCHEDULES (ตารางการขึ้นเวร)
// ==========================================

// Get all schedules
dutyRouter.get('/schedules', (req, res) => {
  const { date, startDate, endDate, month } = req.query;
  let schedules = db.getData().dutySchedules || [];

  if (date) {
    schedules = schedules.filter((s) => s.date === date);
  }
  if (startDate) {
    schedules = schedules.filter((s) => s.date >= String(startDate));
  }
  if (endDate) {
    schedules = schedules.filter((s) => s.date <= String(endDate));
  }
  if (month) {
    // e.g. "2026-08"
    schedules = schedules.filter((s) => s.date.startsWith(String(month)));
  }

  schedules.sort((a, b) => a.date.localeCompare(b.date));

  // Populate group metadata if missing
  const groups = db.getData().dutyGroups || [];
  const populated = schedules.map((s) => {
    const group = groups.find((g) => g.id === s.groupId);
    return {
      ...s,
      groupName: group?.name || s.groupName || 'ชุดเวร',
      groupColor: group?.color || s.groupColor || '#2563eb',
      groupMembers: s.membersSnapshot || group?.members || [],
      groupResponsibilities: s.customResponsibilities || group?.responsibilities || [],
    };
  });

  res.json({ schedules: populated });
});

// Get today's duty
dutyRouter.get('/today', (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const schedule = (db.getData().dutySchedules || []).find((s) => s.date === todayStr);
  if (!schedule) {
    res.json({ schedule: null, group: null });
    return;
  }

  const group = (db.getData().dutyGroups || []).find((g) => g.id === schedule.groupId);
  res.json({
    schedule,
    group: group || null,
    members: schedule.membersSnapshot || group?.members || [],
    responsibilities: schedule.customResponsibilities || group?.responsibilities || [],
  });
});

// Set single day duty schedule
dutyRouter.post('/schedule', authenticateToken, requirePermission('duties.manage'), (req: AuthRequest, res: Response) => {
  const { date, groupId, notes, customResponsibilities, membersSnapshot, shift, sendTelegramNow } = req.body;

  if (!date || !groupId) {
    res.status(400).json({ error: 'กรุณาระบุวันที่และชุดเวร' });
    return;
  }

  const groups = db.getData().dutyGroups || [];
  const group = groups.find((g) => g.id === groupId);
  if (!group) {
    res.status(404).json({ error: 'ไม่พบชุดเวรที่ระบุ' });
    return;
  }

  if (!db.getData().dutySchedules) {
    db.getData().dutySchedules = [];
  }

  // Check if schedule for this date already exists -> update or insert
  const existingIdx = db.getData().dutySchedules!.findIndex((s) => s.date === date);
  let savedSchedule: DutySchedule;

  if (existingIdx >= 0) {
    const existing = db.getData().dutySchedules![existingIdx];
    existing.groupId = groupId;
    existing.groupName = group.name;
    existing.groupColor = group.color;
    existing.notes = notes !== undefined ? notes : existing.notes;
    existing.customResponsibilities = customResponsibilities || existing.customResponsibilities;
    existing.membersSnapshot = membersSnapshot || existing.membersSnapshot;
    existing.shift = shift || existing.shift || 'ALL_DAY';
    existing.updatedAt = new Date().toISOString();
    savedSchedule = existing;
  } else {
    savedSchedule = {
      id: `sched-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date,
      groupId,
      groupName: group.name,
      groupColor: group.color,
      notes: notes || '',
      customResponsibilities: customResponsibilities || group.responsibilities,
      membersSnapshot: membersSnapshot || group.members,
      shift: shift || 'ALL_DAY',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.getData().dutySchedules!.push(savedSchedule);
  }

  db.save();
  logActivity(req.user, 'CREATE_DUTY', `จัดตารางเวรวันที่ ${date} -> ${group.name}`, req);

  if (sendTelegramNow) {
    TelegramService.sendDutyGroupReminder(savedSchedule, group).catch((err) =>
      console.error('Duty group telegram error:', err)
    );
  }

  res.status(201).json({ message: 'บันทึกตารางเวรสำเร็จ', schedule: savedSchedule });
});

// Update specific schedule (e.g. mark completed, single day override)
dutyRouter.put('/schedule/:id', authenticateToken, requirePermission('duties.manage'), (req: AuthRequest, res: Response) => {
  const schedules = db.getData().dutySchedules || [];
  const schedule = schedules.find((s) => s.id === req.params.id || s.date === req.params.id);

  if (!schedule) {
    res.status(404).json({ error: 'ไม่พบรายการตารางเวร' });
    return;
  }

  const { groupId, notes, customResponsibilities, membersSnapshot, status, shift } = req.body;
  if (groupId) {
    const group = (db.getData().dutyGroups || []).find((g) => g.id === groupId);
    if (group) {
      schedule.groupId = groupId;
      schedule.groupName = group.name;
      schedule.groupColor = group.color;
    }
  }

  if (notes !== undefined) schedule.notes = notes;
  if (customResponsibilities) schedule.customResponsibilities = customResponsibilities;
  if (membersSnapshot) schedule.membersSnapshot = membersSnapshot;
  if (status) schedule.status = status;
  if (shift) schedule.shift = shift;
  schedule.updatedAt = new Date().toISOString();

  db.save();
  logActivity(req.user, 'UPDATE_SETTINGS', `แก้ไขตารางเวรวันที่ ${schedule.date}`, req);

  res.json({ message: 'แก้ไขข้อมูลสำเร็จ', schedule });
});

// Delete specific schedule
dutyRouter.delete('/schedule/:id', authenticateToken, requirePermission('duties.manage'), (req: AuthRequest, res: Response) => {
  const schedules = db.getData().dutySchedules || [];
  const index = schedules.findIndex((s) => s.id === req.params.id || s.date === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: 'ไม่พบรายการตารางเวร' });
    return;
  }

  const removed = schedules[index];
  schedules.splice(index, 1);
  db.save();

  logActivity(req.user, 'DELETE_DUTY', `ลบตารางเวรวันที่ ${removed.date}`, req);
  res.json({ message: 'ลบตารางเวรสำเร็จ' });
});

// ==========================================
// 3. AUTO-ROTATION GENERATOR (ระบบเวรแบบหมุนอัตโนมัติ)
// ==========================================
dutyRouter.post('/generate-rotation', authenticateToken, requirePermission('duties.manage'), (req: AuthRequest, res: Response) => {
  const { startDate, endDate, startGroupId, skipWeekends = true, skipHolidays = true, replaceExisting = true } = req.body;

  if (!startDate || !endDate) {
    res.status(400).json({ error: 'กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด' });
    return;
  }

  const groups = db.getData().dutyGroups || [];
  if (groups.length === 0) {
    res.status(400).json({ error: 'ไม่พบชุดเวรในระบบ กรุณาสร้างชุดเวรก่อนสร้างตารางเวร' });
    return;
  }

  let startIndex = 0;
  if (startGroupId) {
    const idx = groups.findIndex((g) => g.id === startGroupId);
    if (idx >= 0) startIndex = idx;
  }

  if (!db.getData().dutySchedules) {
    db.getData().dutySchedules = [];
  }

  const holidays = db.getData().holidays || [];
  const holidayDates = new Set(
    holidays.filter((h) => h.type === 'HOLIDAY').map((h) => h.date)
  );

  let currentDate = new Date(startDate);
  const end = new Date(endDate);
  let groupCursor = startIndex;
  let generatedCount = 0;

  while (currentDate <= end) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday

    let shouldSkip = false;

    // Check Weekend
    if (skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      shouldSkip = true;
    }

    // Check Holiday
    if (skipHolidays && holidayDates.has(dateStr)) {
      shouldSkip = true;
    }

    if (!shouldSkip) {
      const assignedGroup = groups[groupCursor % groups.length];
      const existingIdx = db.getData().dutySchedules!.findIndex((s) => s.date === dateStr);

      if (existingIdx >= 0) {
        if (replaceExisting) {
          db.getData().dutySchedules![existingIdx] = {
            id: db.getData().dutySchedules![existingIdx].id,
            date: dateStr,
            groupId: assignedGroup.id,
            groupName: assignedGroup.name,
            groupColor: assignedGroup.color,
            customResponsibilities: assignedGroup.responsibilities,
            membersSnapshot: assignedGroup.members,
            shift: 'ALL_DAY',
            status: 'PENDING',
            createdAt: db.getData().dutySchedules![existingIdx].createdAt,
            updatedAt: new Date().toISOString(),
          };
          generatedCount++;
        }
      } else {
        db.getData().dutySchedules!.push({
          id: `sched-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          date: dateStr,
          groupId: assignedGroup.id,
          groupName: assignedGroup.name,
          groupColor: assignedGroup.color,
          customResponsibilities: assignedGroup.responsibilities,
          membersSnapshot: assignedGroup.members,
          shift: 'ALL_DAY',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        generatedCount++;
      }

      groupCursor++;
    }

    // Next Day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  db.save();
  logActivity(
    req.user,
    'CREATE_DUTY',
    `สร้างตารางเวรหมุนเวียนอัตโนมัติ ${startDate} ถึง ${endDate} (ทั้งหมด ${generatedCount} วัน)`,
    req
  );

  res.json({
    message: `สร้างตารางเวรหมุนเวียนอัตโนมัติสำเร็จ (${generatedCount} วัน)`,
    count: generatedCount,
    schedules: db.getData().dutySchedules,
  });
});

// ==========================================
// 4. TELEGRAM NOTIFICATION FOR DUTY SET
// ==========================================
dutyRouter.post('/schedule/:id/notify-telegram', authenticateToken, requirePermission('duties.manage'), async (req: AuthRequest, res: Response) => {
  const schedules = db.getData().dutySchedules || [];
  const schedule = schedules.find((s) => s.id === req.params.id || s.date === req.params.id);

  if (!schedule) {
    res.status(404).json({ error: 'ไม่พบข้อมูลตารางเวร' });
    return;
  }

  const group = (db.getData().dutyGroups || []).find((g) => g.id === schedule.groupId);
  if (!group) {
    res.status(404).json({ error: 'ไม่พบชุดเวรของตารางนี้' });
    return;
  }

  const result = await TelegramService.sendDutyGroupReminder(schedule, group);
  res.json(result);
});

// ==========================================
// 5. LEGACY / FALLBACK DUTY ROSTER ENDPOINTS
// ==========================================
dutyRouter.get('/', (req, res) => {
  const { date, startDate, endDate } = req.query;
  let duties = db.getData().duties || [];

  if (date) {
    duties = duties.filter((d) => d.date === date);
  }
  if (startDate) {
    duties = duties.filter((d) => d.date >= String(startDate));
  }
  if (endDate) {
    duties = duties.filter((d) => d.date <= String(endDate));
  }

  duties.sort((a, b) => a.date.localeCompare(b.date));
  res.json({ duties });
});

dutyRouter.post('/', authenticateToken, requirePermission('duties.manage'), async (req: AuthRequest, res: Response) => {
  const { date, dutyType, staffName, department, phone, notes, shiftTime } = req.body;

  if (!date || !dutyType || !staffName) {
    res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    return;
  }

  const newDuty: DutyRoster = {
    id: `duty-${Date.now()}`,
    date,
    dutyType,
    staffName,
    department: department || 'ทั่วไป',
    phone: phone || '',
    notes: notes || '',
    shiftTime: shiftTime || 'ALL_DAY',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  db.getData().duties.push(newDuty);
  db.save();

  res.status(201).json({ message: 'บันทึกสำเร็จ', duty: newDuty });
});

dutyRouter.put('/:id', authenticateToken, requirePermission('duties.manage'), (req: AuthRequest, res: Response) => {
  const duty = db.getData().duties.find((d) => d.id === req.params.id);
  if (!duty) {
    res.status(404).json({ error: 'ไม่พบข้อมูล' });
    return;
  }
  const { date, dutyType, staffName, department, phone, notes, shiftTime, status } = req.body;
  if (date) duty.date = date;
  if (dutyType) duty.dutyType = dutyType;
  if (staffName) duty.staffName = staffName;
  if (department) duty.department = department;
  if (phone !== undefined) duty.phone = phone;
  if (notes !== undefined) duty.notes = notes;
  if (shiftTime) duty.shiftTime = shiftTime;
  if (status) duty.status = status;
  db.save();
  res.json({ message: 'แก้ไขสำเร็จ', duty });
});

dutyRouter.delete('/:id', authenticateToken, requirePermission('duties.manage'), (req: AuthRequest, res: Response) => {
  const index = db.getData().duties.findIndex((d) => d.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'ไม่พบข้อมูล' });
    return;
  }
  db.getData().duties.splice(index, 1);
  db.save();
  res.json({ message: 'ลบสำเร็จ' });
});

