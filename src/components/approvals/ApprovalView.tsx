import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  CheckCheck,
  Search,
  Filter,
  RefreshCw,
  Building,
  User,
  Calendar,
  MapPin,
  FileText,
  AlertTriangle,
  Send,
  Eye,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { SchoolEvent, EventCategory } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatThaiDate } from '../../utils/thaiDate';

interface ApprovalViewProps {
  onSelectEvent: (event: SchoolEvent) => void;
  onRefreshStats?: () => void;
}

export const ApprovalView: React.FC<ApprovalViewProps> = ({
  onSelectEvent,
  onRefreshStats,
}) => {
  const { user, isAdmin } = useAuth();
  const { showToast, confirm } = useToast();

  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Selected items for batch actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetEvent, setRejectTargetEvent] = useState<SchoolEvent | null>(null);
  const [rejectReason, setRejectReason] = useState('');

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
      console.error('Error fetching approval events:', e);
      showToast('error', 'ไม่สามารถโหลดข้อมูลกิจกรรมได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleApprove = async (event: SchoolEvent) => {
    try {
      await api.post(`/events/${event.id}/approve`);
      showToast('success', `อนุมัติกิจกรรม "${event.title}" เรียบร้อยแล้ว`);
      fetchEvents();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      showToast('error', err?.message || 'เกิดข้อผิดพลาดในการอนุมัติ');
    }
  };

  const handleOpenReject = (event: SchoolEvent) => {
    setRejectTargetEvent(event);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectTargetEvent) return;
    if (!rejectReason.trim()) {
      showToast('warning', 'กรุณาระบุเหตุผลการไม่อนุมัติ');
      return;
    }

    try {
      await api.post(`/events/${rejectTargetEvent.id}/reject`, {
        reason: rejectReason.trim(),
      });
      showToast('info', `ปฏิเสธกิจกรรม "${rejectTargetEvent.title}" เรียบร้อยแล้ว`);
      setRejectModalOpen(false);
      setRejectTargetEvent(null);
      fetchEvents();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      showToast('error', err?.message || 'เกิดข้อผิดพลาด');
    }
  };

  // Batch Approve
  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return;

    const ok = await confirm({
      title: 'อนุมัติกิจกรรมทั้งหมดที่เลือก?',
      message: `คุณต้องการอนุมัติกิจกรรมที่เลือกจำนวน ${selectedIds.length} รายการพร้อมกันหรือไม่?`,
      type: 'info',
      confirmText: 'อนุมัติทั้งหมด',
    });
    if (!ok) return;

    setBatchLoading(true);
    try {
      for (const id of selectedIds) {
        await api.post(`/events/${id}/approve`);
      }
      showToast('success', `อนุมัติสำเร็จ ${selectedIds.length} รายการ`);
      setSelectedIds([]);
      fetchEvents();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      showToast('error', 'เกิดข้อผิดพลาดในการอนุมัติแบบกลุ่ม');
    } finally {
      setBatchLoading(false);
    }
  };

  // Filtered list
  const filteredEvents = events.filter((e) => {
    if (e.status !== activeTab) return false;
    if (selectedCategory !== 'ALL' && e.categoryId !== selectedCategory) return false;
    if (selectedDept !== 'ALL' && e.department !== selectedDept) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.coordinator && e.coordinator.toLowerCase().includes(q)) ||
        (e.department && e.department.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Unique departments
  const departments = Array.from(new Set(events.map((e) => e.department).filter(Boolean)));

  const pendingCount = events.filter((e) => e.status === 'PENDING').length;
  const approvedCount = events.filter((e) => e.status === 'APPROVED').length;
  const rejectedCount = events.filter((e) => e.status === 'REJECTED').length;

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredEvents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEvents.map((e) => e.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div id="approvals-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>ระบบอนุมัติกิจกรรมโรงเรียน</span>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                  {pendingCount} รอการตรวจสอบ
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ตรวจสอบและอนุมัติกิจกรรมที่ส่งโดยคณะครู/บุคลากร พร้อมระบบแจ้งเตือน Telegram อัตโนมัติ
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchEvents}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('PENDING');
              setSelectedIds([]);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PENDING'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>รอดำเนินการอนุมัติ</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                activeTab === 'PENDING' ? 'bg-amber-700/60 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('APPROVED');
              setSelectedIds([]);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'APPROVED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>อนุมัติแล้ว</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                activeTab === 'APPROVED' ? 'bg-emerald-800/60 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {approvedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('REJECTED');
              setSelectedIds([]);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'REJECTED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>ไม่อนุมัติ</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                activeTab === 'REJECTED' ? 'bg-rose-800/60 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {rejectedCount}
            </span>
          </button>
        </div>

        {/* Batch Action Buttons if PENDING */}
        {activeTab === 'PENDING' && selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              เลือก {selectedIds.length} รายการ
            </span>
            <button
              type="button"
              onClick={handleBatchApprove}
              disabled={batchLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all"
            >
              <CheckCheck className="w-4 h-4" />
              <span>อนุมัติทั้งหมดที่เลือก</span>
            </button>
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหากิจกรรม, ผู้เสนอ, หรือฝ่ายงาน..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium"
          >
            <option value="ALL">กลุ่มสาระ / ทุกฝ่าย</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium"
          >
            <option value="ALL">ทุกหมวดหมู่</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mb-3" />
          <p className="text-sm font-medium">กำลังโหลดข้อมูลคำขออนุมัติ...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center p-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
          <CheckCircle className="w-14 h-14 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
            {activeTab === 'PENDING'
              ? 'ไม่มีกิจกรรมที่รอการอนุมัติในขณะนี้'
              : activeTab === 'APPROVED'
              ? 'ยังไม่มีรายการกิจกรรมที่อนุมัติ'
              : 'ไม่มีรายการที่ถูกปฏิเสธ'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {activeTab === 'PENDING'
              ? 'ทุกคำขอได้รับการตรวจสอบเรียบร้อยแล้ว'
              : 'สามารถดูรายการในแท็บอื่นได้'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {activeTab === 'PENDING' && (
            <div className="flex items-center justify-between px-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredEvents.length && filteredEvents.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
                />
                <span>เลือกทั้งหมด ({filteredEvents.length} รายการ)</span>
              </label>
            </div>
          )}

          {filteredEvents.map((event) => {
            const category = categories.find((c) => c.id === event.categoryId);
            const isSelected = selectedIds.includes(event.id);

            return (
              <div
                key={event.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all p-5 shadow-xs hover:shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isSelected
                    ? 'border-amber-400 dark:border-amber-500 bg-amber-50/20 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Left Information */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {activeTab === 'PENDING' && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(event.id)}
                      className="mt-1 rounded text-amber-500 focus:ring-amber-400 w-4 h-4 shrink-0"
                    />
                  )}

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        style={{
                          backgroundColor: `${category?.color || '#2563eb'}18`,
                          color: category?.color || '#2563eb',
                          borderColor: `${category?.color || '#2563eb'}30`,
                        }}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                      >
                        {category?.name || 'กิจกรรม'}
                      </span>

                      {event.priority === 'URGENT' && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200">
                          ด่วนที่สุด
                        </span>
                      )}

                      {event.attachments && event.attachments.length > 0 && (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
                          <FileText className="w-3 h-3" />
                          <span>{event.attachments.length} ไฟล์แนบ</span>
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => onSelectEvent(event)}
                      className="text-base font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors leading-snug"
                    >
                      {event.title}
                    </h3>

                    {/* Metadata chips */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {event.startDate === event.endDate
                            ? formatThaiDate(event.startDate, { format: 'medium' })
                            : `${formatThaiDate(event.startDate, { format: 'short' })} - ${formatThaiDate(event.endDate, { format: 'short' })}`}
                        </span>
                        <span>({event.isAllDay ? 'ตลอดวัน' : `${event.startTime} - ${event.endTime} น.`})</span>
                      </span>

                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>{event.location}</span>
                        </span>
                      )}

                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-blue-500" />
                        <span>ผู้เสนอ: <b>{event.createdByName || event.coordinator}</b></span>
                        {event.department && <span className="text-slate-400">({event.department})</span>}
                      </span>
                    </div>

                    {/* Rejection reason if REJECTED */}
                    {event.status === 'REJECTED' && event.rejectionReason && (
                      <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs">
                        <b>เหตุผลที่ไม่อนุมัติ:</b> {event.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    <span>ดูรายละเอียด</span>
                  </button>

                  {event.status === 'PENDING' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenReject(event)}
                        className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800 transition-all"
                      >
                        ไม่อนุมัติ
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApprove(event)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>อนุมัติกิจกรรม</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && rejectTargetEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ไม่อนุมัติกิจกรรม: {rejectTargetEvent.title}
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              กรุณาระบุเหตุผลหรือคำแนะนำเพื่อให้ผู้ส่งคำขอทราบและปรับปรุงแก้ไข:
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="เช่น วันเวลาซ้ำซ้อนกับกิจกรรมอื่น, ขอให้แนบเอกสารโครงการเพิ่มเติม..."
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                ยืนยันการไม่อนุมัติ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
