import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  Building,
  AlertTriangle,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Send,
  Sparkles,
  Share2,
  CalendarPlus,
  Image,
  ExternalLink,
} from 'lucide-react';
import { SchoolEvent, EventAttachment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';
import { formatThaiDate } from '../../utils/thaiDate';

import { FilePreviewModal } from '../common/FilePreviewModal';

interface EventDetailModalProps {
  event: SchoolEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: SchoolEvent) => void;
  onRefresh: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  onEdit,
  onRefresh,
}) => {
  const { user, isAdmin, hasPermission } = useAuth();
  const { showToast, confirm } = useToast();
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Attachment preview state (Eye icon modal)
  const [previewAttachment, setPreviewAttachment] = useState<EventAttachment | null>(null);

  if (!isOpen || !event) return null;

  const canEdit =
    isAdmin ||
    (hasPermission('events.edit') && (event.createdBy === user?.id || user?.role === 'ADMIN'));
  const canDelete =
    isAdmin ||
    (hasPermission('events.delete') && (event.createdBy === user?.id || user?.role === 'ADMIN'));
  const canApprove = isAdmin || hasPermission('events.approve');

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await api.post(`/events/${event.id}/approve`);
      showToast('success', 'อนุมัติกิจกรรมสำเร็จ', `กิจกรรม "${event.title}" ได้รับการอนุมัติแล้ว`);
      onRefresh();
      onClose();
    } catch (err: any) {
      showToast('error', 'อนุมัติไม่สำเร็จ', err?.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showToast('warning', 'กรุณาระบุเหตุผล', 'โปรดใส่เหตุผลการไม่อนุมัติหรือข้อเสนอแนะ');
      return;
    }
    try {
      setActionLoading(true);
      await api.post(`/events/${event.id}/reject`, { reason: rejectionReason });
      showToast('info', 'ปฏิเสธกิจกรรมเรียบร้อย', `บันทึกสถานะไม่อนุมัติสำหรับ "${event.title}"`);
      setRejectionModalOpen(false);
      onRefresh();
      onClose();
    } catch (err: any) {
      showToast('error', 'ดำเนินการไม่สำเร็จ', err?.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = () => {
    confirm({
      title: 'ยืนยันการลบกิจกรรม?',
      message: `คุณต้องการลบกิจกรรม "${event.title}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      type: 'danger',
      confirmText: 'ลบกิจกรรม',
      onConfirm: async () => {
        await api.delete(`/events/${event.id}`);
        showToast('success', 'ลบกิจกรรมสำเร็จ', `ลบ "${event.title}" ออกจากระบบแล้ว`);
        onRefresh();
        onClose();
      },
    });
  };

  const handleSendInstantTelegram = async () => {
    try {
      setActionLoading(true);
      const res = await api.post<{ success: boolean; message: string }>(`/events/${event.id}/notify-telegram`);
      if (res.success) {
        showToast('success', 'ส่งการแจ้งเตือนสำเร็จ', `ส่งข้อความแจ้งเตือนกิจกรรมไปยัง Telegram เรียบร้อยแล้ว`);
      } else {
        showToast('warning', 'ส่งข้อความไม่สำเร็จ', res.message || 'โปรดตรวจสอบการตั้งค่า Telegram Bot Token และ Chat ID');
      }
    } catch (err: any) {
      showToast('error', 'ส่งแจ้งเตือนไม่สำเร็จ', err?.message || 'ตรวจสอบการตั้งค่าบอท Telegram');
    } finally {
      setActionLoading(false);
    }
  };

  // Export to Google Calendar format link
  const generateGoogleCalendarLink = () => {
    const startIso = event.startDate.replace(/-/g, '') + (event.isAllDay ? '' : 'T' + (event.startTime || '00:00').replace(/:/g, '') + '00');
    const endIso = event.endDate.replace(/-/g, '') + (event.isAllDay ? '' : 'T' + (event.endTime || '23:59').replace(/:/g, '') + '00');
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', event.title);
    url.searchParams.append('dates', `${startIso}/${endIso}`);
    url.searchParams.append('details', `${event.description || ''}\nผู้ประสานงาน: ${event.coordinator || ''}\nฝ่าย: ${event.department || ''}`);
    url.searchParams.append('location', event.location || '');
    return url.toString();
  };

  const getPriorityBadge = (p: SchoolEvent['priority']) => {
    switch (p) {
      case 'URGENT':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">ด่วนที่สุด</span>;
      case 'IMPORTANT':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">สำคัญ</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">ทั่วไป</span>;
    }
  };

  const getStatusBadge = (s: SchoolEvent['status']) => {
    switch (s) {
      case 'APPROVED':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> อนุมัติแล้ว</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> ไม่อนุมัติ</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> รอการอนุมัติ</span>;
    }
  };

  const isImageFile = (mimeType?: string, fileName?: string) => {
    if (mimeType && mimeType.startsWith('image/')) return true;
    if (fileName && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(fileName)) return true;
    return false;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in zoom-in-95 duration-150 my-8 flex flex-col max-h-[90vh]">
        {/* Header with Title & Status Badges */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {getStatusBadge(event.status)}
                {getPriorityBadge(event.priority)}
                {event.recurrence && event.recurrence !== 'NONE' && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    เกิดซ้ำ ({event.recurrence})
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {event.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Rejection Notice if rejected */}
          {event.status === 'REJECTED' && event.rejectionReason && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 text-xs">
              <p className="font-bold flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>เหตุผลที่ไม่อนุมัติ:</span>
              </p>
              <p className="leading-relaxed">{event.rejectionReason}</p>
            </div>
          )}

          {/* Schedule Info Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">วันที่จัดกิจกรรม</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {event.startDate === event.endDate
                    ? formatThaiDate(event.startDate, { format: 'full' })
                    : `${formatThaiDate(event.startDate, { format: 'medium' })} ถึง ${formatThaiDate(event.endDate, { format: 'medium' })}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">เวลา</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {event.isAllDay ? 'ตลอดทั้งวัน (All Day)' : `${event.startTime || '00:00'} - ${event.endTime || '23:59'} น.`}
                </p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">สถานที่</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                    {event.location}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Details Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-500" />
                <span>กลุ่มสาระ / ฝ่ายงาน</span>
              </p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {event.department || 'ไม่ระบุ'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>ผู้รับผิดชอบโครงการ</span>
              </p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {event.coordinator || event.createdByName || 'ไม่ระบุ'}
              </p>
            </div>

            {event.targetGroup && (
              <div className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 sm:col-span-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  <span>กลุ่มเป้าหมาย / ผู้เข้าร่วม</span>
                </p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {event.targetGroup}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                รายละเอียดและวัตถุประสงค์
              </h4>
              <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {event.description}
              </div>
            </div>
          )}

          {/* Attachments with Eye Preview Button */}
          {event.attachments && event.attachments.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>เอกสารแนบ ({event.attachments.length})</span>
              </h4>
              <div className="space-y-2">
                {event.attachments.map((att) => {
                  const isImg = isImageFile(att.mimeType, att.fileName || att.originalName);
                  const fileUrl = att.dataUrl || `/api/files/download/${att.fileName}`;

                  return (
                    <div
                      key={att.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isImg ? (
                          <Image className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {att.originalName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {(att.size / 1024).toFixed(1)} KB • อัปโหลดโดย {att.uploadedByName || 'ครู'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Eye Icon for Preview */}
                        <button
                          type="button"
                          onClick={() => setPreviewAttachment(att)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 text-xs font-bold transition-all shadow-2xs"
                          title="ดูตัวอย่างไฟล์ (Preview)"
                        >
                          <Eye className="w-4 h-4" />
                          <span>ดูไฟล์</span>
                        </button>

                        <a
                          href={fileUrl}
                          download={att.originalName}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                          title="ดาวน์โหลดไฟล์"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sync / Share Actions */}
          <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
              <CalendarPlus className="w-4 h-4 text-blue-600" />
              <span>ซิงค์ลงปฏิทิน & แจ้งเตือน</span>
            </span>
            <div className="flex gap-2">
              <a
                href={generateGoogleCalendarLink()}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-all shadow-2xs"
              >
                + Google Calendar
              </a>
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleSendInstantTelegram}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ส่งเตือน Telegram ทันที</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer with Approve / Reject / Edit / Delete */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading}
                className="p-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="ลบกิจกรรม"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(event);
                }}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>แก้ไขกิจกรรม</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canApprove && event.status === 'PENDING' && (
              <>
                <button
                  type="button"
                  onClick={() => setRejectionModalOpen(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800 transition-colors"
                >
                  ไม่อนุมัติ
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  อนุมัติกิจกรรม
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>

      {/* Attachment Preview Modal */}
      <FilePreviewModal
        file={previewAttachment}
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />

      {/* Rejection Modal */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="font-bold text-base text-slate-900 dark:text-white">
              ระบุเหตุผลที่ไม่อนุมัติกิจกรรม
            </h4>
            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="กรอกเหตุผลหรือข้อเสนอแนะเพื่อให้ผู้ส่งกิจกรรมทราบ..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectionModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="px-4 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700"
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
