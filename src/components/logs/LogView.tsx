import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Search,
  Calendar,
  User,
  RefreshCw,
  Activity,
  Shield,
} from 'lucide-react';
import { ActivityLog } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const LogView: React.FC = () => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ logs: ActivityLog[] }>('/logs');
      setLogs(res.logs || []);
    } catch (e) {
      console.error('Error fetching logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q)
    );
  });

  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
        <Shield className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          จำกัดสิทธิ์เฉพาะผู้ดูแลระบบ (Admin)
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          คุณไม่มีสิทธิ์เข้าถึงบันทึกประวัติการใช้งานระบบ (Audit Logs)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              บันทึกกิจกรรมและประวัติการทำงาน (Audit Logs)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ตรวจสอบการเข้าสู่ระบบ การสร้าง แก้ไข และลบข้อมูลในระบบทั้งหมด
            </p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>รีเฟรช</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาตามการกระทำ, รายละเอียด, หรือชื่อผู้ใช้..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">วันและเวลา</th>
                <th className="py-3.5 px-4">ผู้ดำเนินการ</th>
                <th className="py-3.5 px-4">ประเภทกิจกรรม</th>
                <th className="py-3.5 px-4">รายละเอียด</th>
                <th className="py-3.5 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('th-TH')}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {log.userName}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-md">
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                    {log.ipAddress || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
