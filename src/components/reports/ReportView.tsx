import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  PieChart as PieChartIcon,
  TrendingUp,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
  FileSpreadsheet,
  RefreshCw,
  Building,
  Layers,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';

export const ReportView: React.FC = () => {
  const { showToast } = useToast();
  const { systemSettings } = useTheme();
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async (year: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<any>(`/reports/summary?year=${year}`);
      if (res) {
        setData(res);
      }
    } catch (e: any) {
      console.error('Error fetching reports:', e);
      setError(e?.message || 'ไม่สามารถโหลดข้อมูลรายงานได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(selectedYear);
  }, [selectedYear]);

  const COLORS = ['#2563eb', '#0d9488', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#10b981', '#6366f1', '#f43f5e'];

  const handleExportCSV = async () => {
    try {
      const eventsRes = await api.get<{ events: any[]; categories: any[] }>('/events');
      const events = eventsRes?.events || [];
      const categories = eventsRes?.categories || [];

      const headers = ['ลำดับ', 'ชื่อกิจกรรม', 'หมวดหมู่', 'วันที่เริ่มต้น', 'วันที่สิ้นสุด', 'เวลา', 'สถานที่', 'ผู้รับผิดชอบ', 'กลุ่มสาระ/ฝ่าย', 'สถานะ', 'ระดับความสำคัญ'];
      const rows = events.map((e, index) => {
        const cat = categories.find((c: any) => c.id === e.categoryId)?.name || e.categoryId || '-';
        const timeStr = e.isAllDay ? 'ตลอดวัน' : `${e.startTime || ''} - ${e.endTime || ''}`;
        return [
          index + 1,
          `"${(e.title || '').replace(/"/g, '""')}"`,
          `"${cat.replace(/"/g, '""')}"`,
          `"${e.startDate || ''}"`,
          `"${e.endDate || ''}"`,
          `"${timeStr}"`,
          `"${(e.location || '').replace(/"/g, '""')}"`,
          `"${(e.coordinator || '').replace(/"/g, '""')}"`,
          `"${(e.department || '').replace(/"/g, '""')}"`,
          `"${e.status === 'APPROVED' ? 'อนุมัติแล้ว' : e.status === 'PENDING' ? 'รออนุมัติ' : 'ไม่อนุมัติ'}"`,
          `"${e.priority === 'URGENT' ? 'ด่วนที่สุด' : e.priority === 'HIGH' ? 'สำคัญมาก' : 'ปกติ'}"`,
        ].join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `รายงานกิจกรรมโรงเรียน_${systemSettings.schoolName || 'school'}_${selectedYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('success', 'ส่งออกข้อมูลสำเร็จ', 'ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว');
    } catch (err) {
      showToast('error', 'เกิดข้อผิดพลาดในการส่งออกไฟล์ CSV');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 shadow-inner">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              รายงานและสถิติกิจกรรมโรงเรียน
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              สรุปภาพรวมการดำเนินงาน สถิติกิจกรรมตามกลุ่มสาระ และการแจ้งเตือน
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Year Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl px-3 py-1.5 border border-slate-200 dark:border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">ปี พ.ศ.</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {[2027, 2026, 2025, 2024].map((y) => (
                <option key={y} value={String(y)} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {y + 543} ({y})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchReports(selectedYear)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์รายงาน</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>ส่งออก CSV</span>
          </button>
        </div>
      </div>

      {/* Error / Loading notice */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchReports(selectedYear)}
            className="text-xs underline font-bold hover:text-red-900"
          >
            ลองใหม่
          </button>
        </div>
      )}

      {/* Stats Summary Cards */}
      {data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-all">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">กิจกรรมทั้งหมด</p>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
              {data.totalEvents || 0} <span className="text-xs font-normal text-slate-400">รายการ</span>
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>อนุมัติแล้ว {data.approvedEvents || 0} รายการ</span>
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-700 transition-all">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">รอการอนุมัติ</p>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
              {data.pendingEvents || 0} <span className="text-xs font-normal text-slate-400">คำขอ</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {data.rejectedEvents ? `ปฏิเสธ ${data.rejectedEvents} รายการ` : 'รอดำเนินการตรวจสอบ'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">การแจ้งเตือน Telegram</p>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
              {data.totalNotifications || 0} <span className="text-xs font-normal text-slate-400">ครั้ง</span>
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              ส่งสำเร็จ {data.successfulNotifications || 0} ครั้ง
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-300 dark:hover:border-teal-700 transition-all">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">เอกสารในระบบ</p>
              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-2">
              {data.totalAttachments || 0} <span className="text-xs font-normal text-slate-400">ไฟล์</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">พร้อมใช้งานและดาวน์โหลด</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Events Bar Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-600" />
              <span>สถิติกิจกรรมรายเดือน (ปี พ.ศ. {parseInt(selectedYear, 10) + 543})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              จำนวนกิจกรรมที่จัดขึ้นในแต่ละเดือนตลอดทั้งปีการศึกษา
            </p>
          </div>
          <div className="h-64 sm:h-72 w-full">
            {data?.monthlyData && data.monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                <BarChart data={data.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      color: '#fff',
                      borderRadius: '12px',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Bar dataKey="events" name="จำนวนกิจกรรม" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400">
                <BarChart2 className="w-8 h-8 opacity-20 mb-2" />
                <span>ไม่มีข้อมูลสถิติสำหรับปีนี้</span>
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-indigo-600" />
              <span>สัดส่วนกิจกรรมตามหมวดหมู่</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              การกระจายตัวของกิจกรรมตามหมวดหมู่ประเภทต่างๆ
            </p>
          </div>
          <div className="h-64 sm:h-72 w-full">
            {data?.categoryData && data.categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                <PieChart>
                  <Pie
                    data={data.categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {data.categoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      color: '#fff',
                      borderRadius: '12px',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400">
                <PieChartIcon className="w-8 h-8 opacity-20 mb-2" />
                <span>ไม่มีข้อมูลหมวดหมู่กิจกรรม</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Department Breakdown Table */}
      {data?.departmentData && data.departmentData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-600" />
            <span>สถิติกิจกรรมแยกตามกลุ่มสาระ / ฝ่ายงาน</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-2.5 px-4">กลุ่มสาระ / ฝ่ายงาน</th>
                  <th className="py-2.5 px-4 text-center">จำนวนกิจกรรม</th>
                  <th className="py-2.5 px-4 text-right">สัดส่วน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {data.departmentData.map((dept: any, index: number) => {
                  const percent = data.totalEvents > 0 ? Math.round((dept.count / data.totalEvents) * 100) : 0;
                  return (
                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {dept.department}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        {dept.count}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="font-semibold text-slate-600 dark:text-slate-400 w-8">
                            {percent}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
