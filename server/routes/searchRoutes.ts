import { Router } from 'express';
import { db } from '../db';

export const searchRouter = Router();

// Global Search endpoint
searchRouter.get('/', (req, res) => {
  const query = String(req.query.q || '').trim().toLowerCase();

  if (!query) {
    res.json({
      events: [],
      announcements: [],
      holidays: [],
      duties: [],
    });
    return;
  }

  const data = db.getData();

  // 1. Search Events
  const events = (data.events || []).filter((e) => {
    return (
      (e.title && e.title.toLowerCase().includes(query)) ||
      (e.description && e.description.toLowerCase().includes(query)) ||
      (e.location && e.location.toLowerCase().includes(query)) ||
      (e.coordinator && e.coordinator.toLowerCase().includes(query)) ||
      (e.department && e.department.toLowerCase().includes(query))
    );
  }).slice(0, 15);

  // 2. Search Announcements
  const announcements = (data.announcements || []).filter((a) => {
    return (
      (a.title && a.title.toLowerCase().includes(query)) ||
      (a.content && a.content.toLowerCase().includes(query))
    );
  }).slice(0, 10);

  // 3. Search Holidays
  const holidays = (data.holidays || []).filter((h) => {
    return (
      (h.name && h.name.toLowerCase().includes(query)) ||
      (h.description && h.description.toLowerCase().includes(query)) ||
      (h.date && h.date.includes(query))
    );
  }).slice(0, 10);

  // 4. Search Duties (Groups and Schedules)
  const dutyGroups = (data.dutyGroups || []).filter((g) => {
    const nameMatch = g.name && g.name.toLowerCase().includes(query);
    const memberMatch = (g.members || []).some((m) =>
      m.name.toLowerCase().includes(query) || (m.roleInGroup && m.roleInGroup.toLowerCase().includes(query))
    );
    return nameMatch || memberMatch;
  });

  const dutySchedules = (data.dutySchedules || []).filter((s) => {
    const dateMatch = s.date && s.date.includes(query);
    const notesMatch = s.notes && s.notes.toLowerCase().includes(query);
    const groupNameMatch = s.groupName && s.groupName.toLowerCase().includes(query);
    const memberMatch = (s.membersSnapshot || []).some((m) =>
      m.name.toLowerCase().includes(query)
    );
    return dateMatch || notesMatch || groupNameMatch || memberMatch;
  });

  // Combine duty results
  const duties = [
    ...dutyGroups.map((g) => ({
      id: g.id,
      title: `ชุดเวร: ${g.name}`,
      description: `${g.members?.length || 0} คน - ${g.members?.map((m) => m.name).join(', ')}`,
      type: 'group',
    })),
    ...dutySchedules.map((s) => ({
      id: s.id,
      title: `ตารางเวรวันที่ ${s.date} (${s.groupName || 'ชุดเวร'})`,
      description: s.notes || (s.membersSnapshot?.map((m) => m.name).join(', ') || ''),
      date: s.date,
      type: 'schedule',
    })),
  ].slice(0, 10);

  res.json({
    events,
    announcements,
    holidays,
    duties,
  });
});
