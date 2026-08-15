import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest, requirePermission } from '../auth';

export const reportRouter = Router();

// Helper to build analytics & summary reports for ReportView
function buildReportsSummary(yearStr?: string) {
  const data = db.getData();
  const year = yearStr || new Date().getFullYear().toString();

  // Filter events by selected year
  const yearEvents = (data.events || []).filter((e) => e.startDate.startsWith(String(year)));
  const approvedEvents = yearEvents.filter((e) => e.status === 'APPROVED');
  const pendingEvents = yearEvents.filter((e) => e.status === 'PENDING');
  const rejectedEvents = yearEvents.filter((e) => e.status === 'REJECTED');

  // Monthly breakdown for recharts bar chart: { month: 'ม.ค.', events: 5, urgent: 1 }
  const thaiMonthNames = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const monthlyData = thaiMonthNames.map((name, index) => {
    const monthNum = String(index + 1).padStart(2, '0');
    const count = yearEvents.filter((e) => e.startDate.startsWith(`${year}-${monthNum}`)).length;
    const urgentCount = yearEvents.filter(
      (e) => e.startDate.startsWith(`${year}-${monthNum}`) && e.priority === 'URGENT'
    ).length;
    return { month: name, events: count, total: count, urgent: urgentCount };
  });

  // Category breakdown for recharts pie chart: { name: 'วิชาการ', value: 12, color: '#...' }
  const categoryMap: { [key: string]: { name: string; count: number; color: string } } = {};
  (data.categories || []).forEach((cat) => {
    categoryMap[cat.id] = { name: cat.name, count: 0, color: cat.color };
  });
  yearEvents.forEach((e) => {
    if (categoryMap[e.categoryId]) {
      categoryMap[e.categoryId].count++;
    } else {
      categoryMap[e.categoryId] = { name: 'ทั่วไป', count: 1, color: '#3b82f6' };
    }
  });
  const categoryData = Object.values(categoryMap)
    .filter((c) => c.count > 0)
    .map((c) => ({ name: c.name, value: c.count, color: c.color }));

  // Department breakdown
  const deptMap: { [key: string]: number } = {};
  yearEvents.forEach((e) => {
    const dept = e.department || 'ไม่ระบุ';
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  });
  const departmentData = Object.entries(deptMap).map(([dept, count]) => ({ department: dept, count }));
  departmentData.sort((a, b) => b.count - a.count);

  // Total Attachments
  let totalAttachments = 0;
  (data.events || []).forEach((e) => {
    totalAttachments += (e.attachments || []).length;
  });
  (data.announcements || []).forEach((a) => {
    if (a.file) totalAttachments += 1;
  });

  // Telegram Notifications statistics
  const notifLogs = data.notificationLogs || [];
  const notifSuccess = notifLogs.filter((l) => l.status === 'SUCCESS').length;
  const notifFailed = notifLogs.filter((l) => l.status === 'FAILED').length;

  return {
    year,
    totalEvents: yearEvents.length,
    approvedEvents: approvedEvents.length,
    pendingEvents: pendingEvents.length,
    rejectedEvents: rejectedEvents.length,
    totalNotifications: notifLogs.length,
    successfulNotifications: notifSuccess,
    failedNotifications: notifFailed,
    totalAttachments,
    monthlyData,
    categoryData,
    departmentData,
    notifications: {
      total: notifLogs.length,
      success: notifSuccess,
      failed: notifFailed,
    },
  };
}

// GET /api/reports/summary
reportRouter.get('/summary', (req, res) => {
  const { year } = req.query;
  const summary = buildReportsSummary(year as string | undefined);
  res.json(summary);
});

// GET /api/reports/analytics
reportRouter.get('/analytics', (req, res) => {
  const { year } = req.query;
  const summary = buildReportsSummary(year as string | undefined);
  res.json(summary);
});

// GET /api/reports/export/csv
reportRouter.get('/export/csv', (_req, res) => {
  const data = db.getData();
  const events = data.events || [];

  const headers = ['ID', 'ชื่อกิจกรรม', 'หมวดหมู่', 'วันที่เริ่มต้น', 'วันที่สิ้นสุด', 'เวลา', 'สถานที่', 'ผู้รับผิดชอบ', 'กลุ่มสาระ/ฝ่าย', 'สถานะ', 'ระดับความสำคัญ'];
  
  const rows = events.map((e) => {
    const cat = data.categories?.find((c) => c.id === e.categoryId)?.name || e.categoryId;
    const timeStr = e.isAllDay ? 'ตลอดวัน' : `${e.startTime || ''} - ${e.endTime || ''}`;
    return [
      `"${e.id}"`,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${(cat || '').replace(/"/g, '""')}"`,
      `"${e.startDate || ''}"`,
      `"${e.endDate || ''}"`,
      `"${timeStr}"`,
      `"${(e.location || '').replace(/"/g, '""')}"`,
      `"${(e.coordinator || '').replace(/"/g, '""')}"`,
      `"${(e.department || '').replace(/"/g, '""')}"`,
      `"${e.status || ''}"`,
      `"${e.priority || ''}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=school_events_export_${new Date().toISOString().split('T')[0]}.csv`);
  res.send(csvContent);
});
