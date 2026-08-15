import { Router } from 'express';
import { db } from '../db';

export const dashboardRouter = Router();

function buildDashboardData() {
  const data = db.getData();
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  const todayEvents = (data.events || []).filter(
    (e) => e.status === 'APPROVED' && e.startDate <= todayStr && e.endDate >= todayStr
  );
  todayEvents.sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));

  const tomorrowEvents = (data.events || []).filter(
    (e) => e.status === 'APPROVED' && e.startDate <= tomorrowStr && e.endDate >= tomorrowStr
  );

  const pendingEvents = (data.events || []).filter((e) => e.status === 'PENDING');
  const activeAnnouncements = (data.announcements || []).filter((a) => a.showDashboard && a.status === 'ACTIVE');

  // Next upcoming holiday
  const upcomingHolidays = (data.holidays || []).filter((h) => h.date >= todayStr);
  upcomingHolidays.sort((a, b) => a.date.localeCompare(b.date));
  const nextHoliday = upcomingHolidays.length > 0 ? upcomingHolidays[0] : null;

  // Today's staff birthdays
  const todayMMDD = `${month}-${day}`;
  const todayBirthdays = (data.birthdays || []).filter((b) => b.birthDate.endsWith(todayMMDD));

  // Today's duties (Flat + Set System)
  const todayDuties = (data.duties || []).filter((d) => d.date === todayStr);
  const todayDutySchedule = (data.dutySchedules || []).find((s) => s.date === todayStr) || null;
  const todayDutyGroup = todayDutySchedule
    ? (data.dutyGroups || []).find((g) => g.id === todayDutySchedule.groupId) || null
    : null;

  return {
    todayEventsCount: todayEvents.length,
    tomorrowEventsCount: tomorrowEvents.length,
    pendingEventsCount: pendingEvents.length,
    usersCount: (data.users || []).length,
    announcementsCount: activeAnnouncements.length,
    nextHoliday,
    todayEvents,
    tomorrowEvents,
    pendingEvents,
    activeAnnouncements,
    todayBirthdays,
    todayDuties,
    todayDutySchedule,
    todayDutyGroup,
  };
}

// GET /api/dashboard/summary
dashboardRouter.get('/summary', (_req, res) => {
  res.json(buildDashboardData());
});

// GET /api/dashboard
dashboardRouter.get('/', (_req, res) => {
  res.json(buildDashboardData());
});
