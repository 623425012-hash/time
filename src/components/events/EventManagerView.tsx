import React, { useState, useEffect } from 'react';
import {
  TableProperties,
  PlusCircle,
  Search,
  Filter,
  Download,
  Printer,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Building,
  User,
  MapPin,
  Send,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SchoolEvent, EventCategory } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatThaiDate } from '../../utils/thaiDate';

interface EventManagerViewProps {
  onSelectEvent: (event: SchoolEvent) => void;
  onOpenCreateEvent: () => void;
  onEditEvent: (event: SchoolEvent) => void;
  onRefreshEvents?: () => void;
}

export const EventManagerView: React.FC<EventManagerViewProps> = ({
  onSelectEvent,
  onOpenCreateEvent,
  onEditEvent,
  onRefreshEvents,
}) => {
  const { user, isAdmin, hasPermission } = useAuth();
  const { showToast, confirm } = useToast();

  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'UPCOMING_FIRST' | 'DATE_DESC' | 'DATE_ASC'>('UPCOMING_FIRST');
  const [filterTimeScope, setFilterTimeScope] = useState<'ALL' | 'UPCOMING' | 'PAST'>('UPCOMING');

  // Telegram sending state
  const [sendingTelegramId, setSendingTelegramId] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const [eventsRes, catsRes] = await Promise.all([
        api.get<{ events: SchoolEvent[] }>('/events?includePending=true'),
        api.get<{ categories: EventCategory[] }>('/events/categories/list'),
      ]);
      setEvents(eventsRes.events || []);
      setCategories(catsRes.categories || []);
    } catch (e) {
      console.error('Error loading events table:', e);
      showToast('error', 'ไม่สามารถโหลดข้อมูลกิจกรรมได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDeleteEvent = async (event: SchoolEvent) => {
    const ok = await confirm({
      title: 'ยืนยันการลบกิจกรรม?',
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบ "${event.title}" ออกจากระบบ? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      type: 'danger',
      confirmText: 'ลบกิจกรรม',
    });
    if (!ok) return;

    try {
      await api.delete(`/events/${event.id}`);
      showToast('success', 'ลบกิจกรรมสำเร็จ', `ลบ "${event.title}" ออกจากระบบเรียบร้อยแล้ว`);
      fetchEvents();
      if (onRefreshEvents) onRefreshEvents();
    } catch (err: any) {
      console.error(err);
      showToast('error', err?.response?.data?.error || 'เกิดข้อผิดพลาดในการลบกิจกรรม');
    }
  };

  const handleApproveEvent = async (event: SchoolEvent) => {
    try {
      await api.post(`/events/${event.id}/approve`);
      showToast('success', `อนุมัติกิจกรรม "${event.title}" เรียบร้อยแล้ว`);
      fetchEvents();
      if (onRefreshEvents) onRefreshEvents();
    } catch (err: any) {
      showToast('error', err?.message || 'เกิดข้อผิดพลาดในการอนุมัติ');
    }
  };

  const handleSendTelegram = async (event: SchoolEvent) => {
    setSendingTelegramId(event.id);
    try {
      const res = await api.post<{ success: boolean; message: string }>(`/events/${event.id}/notify-telegram`);
      if (res.success) {
        showToast('success', 'ส่งแจ้งเตือน Telegram สำเร็จ', `ส่งการแจ้งเตือน "${event.title}" เรียบร้อยแล้ว`);
      } else {
        showToast('warning', 'ส่งไม่สำเร็จ', res.message || 'กรุณาตรวจสอบการตั้งค่า Bot');
      }
    } catch (err: any) {
      showToast('error', 'เกิดข้อผิดพลาด', err?.message);
    } finally {
      setSendingTelegramId(null);
    }
  };

  // Export Table to CSV
  const handleExportCSV = () => {
    window.open('/api/reports/export/csv', '_blank');
  };

  // Helper: calculate distance in days from today
  const todayStr = new Date().toISOString().split('T')[0];

  const getProximityBadge = (startDate: string, endDate: string) => {
    const today = new Date(todayStr).getTime();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate || startDate).getTime();
    const diffDays = Math.round((start - today) / (1000 * 60 * 60 * 24));

    if (today >= start && today <= end) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 animate-pulse flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>กำลังจัดกิจกรรม</span>
        </span>
      );
    }

    if (diffDays === 0) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200">
          ⚡ วันนี้
        </span>
      );
    } else if (diffDays === 1) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200">
          ⏳ พรุ่งนี้
        </span>
      );
    } else if (diffDays > 1 && diffDays <= 7) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200">
          🔔 อีก {diffDays} วัน
        </span>
      );
    } else if (diffDays > 7) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          อีก {diffDays} วัน
        </span>
      );
    } else {
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400">
          ผ่านมาแล้ว
        </span>
      );
    }
  };

  // Filter & Sort Logic
  const filteredEvents = events.filter((ev) => {
    if (selectedStatus !== 'ALL' && ev.status !== selectedStatus) return false;
    if (selectedCategory !== 'ALL' && ev.categoryId !== selectedCategory) return false;
    if (selectedDept !== 'ALL' && ev.department !== selectedDept) return false;

    if (filterTimeScope === 'UPCOMING' && ev.endDate < todayStr) return false;
    if (filterTimeScope === 'PAST' && ev.endDate >= todayStr) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        ev.title.toLowerCase().includes(q) ||
        (ev.description && ev.description.toLowerCase().includes(q)) ||
        (ev.location && ev.location.toLowerCase().includes(q)) ||
        (ev.coordinator && ev.coordinator.toLowerCase().includes(q)) ||
        (ev.department && ev.department.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Sort events: Upcoming events closest to today first
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortOrder === 'UPCOMING_FIRST') {
      const aIsUpcoming = a.endDate >= todayStr;
      const bIsUpcoming = b.endDate >= todayStr;

      if (aIsUpcoming && !bIsUpcoming) return -1;
      if (!aIsUpcoming && bIsUpcoming) return 1;

      if (aIsUpcoming && bIsUpcoming) {
        return a.startDate.localeCompare(b.startDate) || (a.startTime || '').localeCompare(b.startTime || '');
      }
      return b.startDate.localeCompare(a.startDate);
    } else if (sortOrder === 'DATE_ASC') {
      return a.startDate.localeCompare(b.startDate);
    } else {
      return b.startDate.localeCompare(a.startDate);
    }
  });

  const departments = Array.from(new Set(events.map((e) => e.department).filter(Boolean)));

  return (
    <div id="event-manager-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
            <TableProperties className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>จัดการรายงานกิจกรรมปฏิทิน (ตารางกิจกรรม)</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                {sortedEvents.length} รายการ
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              แสดงข้อมูลกิจกรรมแบบตาราง เรียงลำดับตามกิจกรรมที่ใกล้จะมาถึงก่อน พร้อมฟังก์ชัน ลบ แก้ไข เพิ่ม และส่งออกข้อมูล
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {hasPermission('events.create') && (
            <button
              type="button"
              onClick={onOpenCreateEvent}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>เพิ่มกิจกรรมใหม่</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
            title="ส่งออกเป็นไฟล์ CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์</span>
          </button>
        </div>
      </div>

      {/* Filter & Controls Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาตามชื่องาน, สถานที่, ผู้รับผิดชอบ, กลุ่มสาระ..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Time Scope Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
            {[
              { id: 'UPCOMING', label: 'กิจกรรมใกล้จะถึง / ปัจจุบัน' },
              { id: 'ALL', label: 'ทั้งหมด' },
              { id: 'PAST', label: 'กิจกรรมที่ผ่านไปแล้ว' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTimeScope(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterTimeScope === tab.id
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>กรองตาม:</span>
          </span>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium"
          >
            <option value="ALL">ทุกสถานะ</option>
            <option value="APPROVED">อนุมัติแล้ว (Approved)</option>
            <option value="PENDING">รออนุมัติ (Pending)</option>
            <option value="REJECTED">ไม่อนุมัติ (Rejected)</option>
          </select>

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium"
          >
            <option value="ALL">ทุกหมวดหมู่กิจกรรม</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Department */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium"
          >
            <option value="ALL">ทุกกลุ่มสาระ/ฝ่าย</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Sort Order */}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-slate-400">เรียงตาม:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold"
            >
              <option value="UPCOMING_FIRST">✨ กิจกรรมใกล้จะมาถึงก่อน (ใกล้แจ้งเตือน)</option>
              <option value="DATE_ASC">วันที่จัด (น้อยไปมาก)</option>
              <option value="DATE_DESC">วันที่จัด (มากไปน้อย)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-3" />
          <p className="text-sm font-medium">กำลังโหลดข้อมูลตารางกิจกรรม...</p>
        </div>
      ) : sortedEvents.length === 0 ? (
        <div className="text-center p-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
          <TableProperties className="w-14 h-14 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
            ไม่พบรายการกิจกรรมตามเงื่อนไขที่เลือก
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            ลองปรับเปลี่ยนการค้นหาหรือเพิ่มกิจกรรมใหม่ลงในระบบ
          </p>
          {hasPermission('events.create') && (
            <button
              type="button"
              onClick={onOpenCreateEvent}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>เพิ่มกิจกรรมใหม่</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3.5 px-4">กำหนดเวลา & ระยะห่าง</th>
                  <th className="py-3.5 px-4 min-w-[240px]">ชื่องานกิจกรรม / รายละเอียด</th>
                  <th className="py-3.5 px-4">หมวดหมู่</th>
                  <th className="py-3.5 px-4">สถานที่</th>
                  <th className="py-3.5 px-4">ฝ่ายงาน / ผู้รับผิดชอบ</th>
                  <th className="py-3.5 px-4 text-center">สถานะ</th>
                  <th className="py-3.5 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedEvents.map((ev) => {
                  const category = categories.find((c) => c.id === ev.categoryId);
                  const canEdit =
                    isAdmin ||
                    (hasPermission('events.edit') && (ev.createdBy === user?.id || user?.role === 'ADMIN'));
                  const canDelete =
                    isAdmin ||
                    (hasPermission('events.delete') && (ev.createdBy === user?.id || user?.role === 'ADMIN'));
                  const isSendingTelegram = sendingTelegramId === ev.id;

                  return (
                    <tr
                      key={ev.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Date & Proximity */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {ev.startDate === ev.endDate
                              ? formatThaiDate(ev.startDate, { format: 'short' })
                              : `${formatThaiDate(ev.startDate, { format: 'short' })} - ${formatThaiDate(ev.endDate, { format: 'short' })}`}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {ev.isAllDay ? 'ตลอดทั้งวัน' : `${ev.startTime || '00:00'} - ${ev.endTime || '23:59'} น.`}
                          </div>
                          <div>{getProximityBadge(ev.startDate, ev.endDate)}</div>
                        </div>
                      </td>

                      {/* Title & Priority */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              onClick={() => onSelectEvent(ev)}
                              className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                            >
                              {ev.title}
                            </span>
                            {ev.priority === 'URGENT' && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                ด่วนที่สุด
                              </span>
                            )}
                          </div>

                          {ev.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                              {ev.description}
                            </p>
                          )}

                          {ev.attachments && ev.attachments.length > 0 && (
                            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                              📎 {ev.attachments.length} ไฟล์แนบ
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 align-top">
                        <span
                          style={{
                            backgroundColor: `${category?.color || '#2563eb'}18`,
                            color: category?.color || '#2563eb',
                            borderColor: `${category?.color || '#2563eb'}30`,
                          }}
                          className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                        >
                          {category?.name || 'กิจกรรม'}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 align-top text-slate-600 dark:text-slate-300">
                        {ev.location ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{ev.location}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Department / Coordinator */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">
                          {ev.department || 'ไม่ระบุ'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {ev.coordinator || ev.createdByName || '-'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 align-top text-center">
                        {ev.status === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> อนุมัติ
                          </span>
                        ) : ev.status === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <XCircle className="w-3 h-3" /> ไม่อนุมัติ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3" /> รออนุมัติ
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectEvent(ev)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleSendTelegram(ev)}
                              disabled={isSendingTelegram}
                              className="p-1.5 rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors"
                              title="ส่งแจ้งเตือน Telegram ทันที"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}

                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => onEditEvent(ev)}
                              className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                              title="แก้ไขกิจกรรม"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(ev)}
                              className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                              title="ลบกิจกรรม"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
