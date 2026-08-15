import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  PlusCircle,
  Pin,
  AlertCircle,
  FileText,
  Download,
  Trash2,
  Edit,
  Clock,
  Send,
  Eye,
  Sparkles,
  X,
  UploadCloud,
} from 'lucide-react';
import { SchoolAnnouncement, EventAttachment } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FilePreviewModal } from '../common/FilePreviewModal';

export const AnnouncementView: React.FC = () => {
  const { user, isAdmin, hasPermission } = useAuth();
  const { showToast, confirm } = useToast();

  const [announcements, setAnnouncements] = useState<SchoolAnnouncement[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<SchoolAnnouncement | null>(null);
  const [previewFile, setPreviewFile] = useState<EventAttachment | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<SchoolAnnouncement['type']>('GENERAL');
  const [isPinned, setIsPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [targetRole, setTargetRole] = useState<'ALL' | 'TEACHER' | 'STUDENT' | 'PARENT'>('ALL');
  const [sendTelegram, setSendTelegram] = useState(true);
  const [attachments, setAttachments] = useState<EventAttachment[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ announcements: SchoolAnnouncement[] }>('/announcements');
      setAnnouncements(res.announcements || []);
    } catch (e) {
      console.error('Error fetching announcements:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleOpenCreate = () => {
    setEditingAnn(null);
    setTitle('');
    setContent('');
    setType('GENERAL');
    setIsPinned(false);
    setExpiresAt('');
    setTargetRole('ALL');
    setSendTelegram(true);
    setAttachments([]);
    setModalOpen(true);
  };

  const handleOpenEdit = (ann: SchoolAnnouncement) => {
    setEditingAnn(ann);
    setTitle(ann.title);
    setContent(ann.content);
    setType(ann.type);
    setIsPinned(ann.isPinned);
    setExpiresAt(ann.expiresAt ? ann.expiresAt.split('T')[0] : '');
    setTargetRole(ann.targetRole);
    setSendTelegram(false);
    setAttachments(ann.attachments || []);
    setModalOpen(true);
  };

  const [broadcastingAnnId, setBroadcastingAnnId] = useState<string | null>(null);

  const handleBroadcastTelegram = async (ann: SchoolAnnouncement) => {
    setBroadcastingAnnId(ann.id);
    try {
      const res = await api.post<{ success: boolean; message: string }>(`/announcements/${ann.id}/broadcast-telegram`);
      if (res.success) {
        showToast('success', 'ส่งข่าวสารผ่าน Telegram สำเร็จ', `กระจายข่าวสาร "${ann.title}" ไปยังกลุ่ม Telegram เรียบร้อยแล้ว`);
      } else {
        showToast('warning', 'ส่งไม่สำเร็จ', res.message || 'กรุณาตรวจสอบการตั้งค่า Telegram Bot');
      }
    } catch (err: any) {
      showToast('error', 'ส่งข่าวสารไม่สำเร็จ', err?.message || 'เกิดข้อผิดพลาดในการส่งข้อความ');
    } finally {
      setBroadcastingAnnId(null);
    }
  };

  const handleDelete = (ann: SchoolAnnouncement) => {
    confirm({
      title: 'ยืนยันการลบประกาศ?',
      message: `คุณต้องการลบประกาศ "${ann.title}" ใช่หรือไม่?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/announcements/${ann.id}`);
          showToast('success', 'ลบประกาศสำเร็จ', `ลบประกาศ "${ann.title}" เรียบร้อยแล้ว`);
          fetchAnnouncements();
        } catch (e: any) {
          showToast('error', 'ลบประกาศไม่สำเร็จ', e?.message);
        }
      },
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post<{ attachment: EventAttachment }>('/files/upload', formData);
        if (res.attachment) {
          setAttachments((prev) => [...prev, res.attachment]);
        }
      }
      showToast('success', 'อัปโหลดไฟล์สำเร็จ');
    } catch (err: any) {
      showToast('error', 'อัปโหลดล้มเหลว', err?.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast('warning', 'กรอกข้อมูลไม่ครบ', 'กรุณากรอกหัวข้อและเนื้อหาประกาศ');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        content,
        type,
        isPinned,
        expiresAt: expiresAt || undefined,
        targetRole,
        sendTelegram,
        attachments,
      };

      if (editingAnn) {
        await api.put(`/announcements/${editingAnn.id}`, payload);
        showToast('success', 'แก้ไขประกาศสำเร็จ');
      } else {
        await api.post('/announcements', payload);
        showToast('success', 'เผยแพร่ประกาศสำเร็จ', sendTelegram ? 'กระจายข่าวสารไปยัง Telegram แล้ว' : undefined);
      }
      setModalOpen(false);
      fetchAnnouncements();
    } catch (err: any) {
      showToast('error', 'บันทึกไม่สำเร็จ', err?.message);
    } finally {
      setSaving(false);
    }
  };

  const canManage = isAdmin || hasPermission('announcements.create');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              ข่าวประชาสัมพันธ์โรงเรียน
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ศูนย์รวมประกาศ ข่าวสารด่วน และหนังสือแจ้งเวียนภายในสถานศึกษา
            </p>
          </div>
        </div>

        {canManage && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>สร้างประกาศใหม่</span>
          </button>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
            <Megaphone className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">ยังไม่มีประกาศข่าวสารในขณะนี้</p>
          </div>
        ) : (
          announcements.map((ann) => {
            const isUrgent = ann.type === 'URGENT';
            return (
              <div
                key={ann.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border transition-all hover:shadow-md ${
                  ann.isPinned
                    ? 'border-amber-300 dark:border-amber-700/60 bg-linear-to-r from-amber-50/30 to-transparent dark:from-amber-950/20'
                    : isUrgent
                    ? 'border-rose-300 dark:border-rose-700/60 bg-linear-to-r from-rose-50/30 to-transparent dark:from-rose-950/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Announcement Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {ann.isPinned && (
                        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                          <Pin className="w-3 h-3 fill-amber-500 text-amber-500" /> ปักหมุด
                        </span>
                      )}
                      {isUrgent ? (
                        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> ข่าวด่วน
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {ann.type === 'EVENT' ? 'ข่าวกิจกรรม' : 'ทั่วไป'}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ann.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                      {ann.title}
                    </h3>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleBroadcastTelegram(ann)}
                        disabled={broadcastingAnnId === ann.id}
                        className="p-2 rounded-xl text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors disabled:opacity-50"
                        title="ส่งแจ้งเตือน Telegram ทันที"
                      >
                        {broadcastingAnnId === ann.id ? (
                          <span className="inline-block w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 text-sky-500" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(ann)}
                        className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="แก้ไข"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ann)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Content */}
                <p className="mt-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {ann.content}
                </p>

                {/* Attachments */}
                {ann.attachments && ann.attachments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                    <p className="text-xs font-semibold text-slate-400 mb-2">เอกสารแนบ:</p>
                    <div className="flex flex-wrap gap-2">
                      {ann.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
                        >
                          <button
                            type="button"
                            onClick={() => setPreviewFile(att)}
                            className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="กดเพื่อดูตัวอย่างไฟล์"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-500" />
                            <span className="truncate max-w-[180px] font-semibold">{att.originalName}</span>
                            <Eye className="w-3 h-3 text-blue-500 ml-1" />
                          </button>
                          <a
                            href={att.dataUrl || `/api/files/download/${att.fileName}`}
                            download={att.originalName}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            title="ดาวน์โหลดไฟล์"
                          >
                            <Download className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer meta */}
                <div className="mt-4 pt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800/60">
                  <span>ผู้ประกาศ: {ann.createdByName}</span>
                  {ann.sendTelegram && (
                    <span className="flex items-center gap-1 text-blue-500 font-medium">
                      <Send className="w-3 h-3" /> แจ้งเตือน Telegram แล้ว
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="fixed inset-0" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in zoom-in-95 my-8 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-500" />
                <span>{editingAnn ? 'แก้ไขประกาศ' : 'สร้างประกาศใหม่'}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  หัวข้อประกาศ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น ประกาศปิดเรียนกรณีพิเศษ, กำหนดการสอบปลายภาค..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ประเภทประกาศ
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  >
                    <option value="GENERAL">ทั่วไป</option>
                    <option value="URGENT">ด่วนที่สุด (Urgent)</option>
                    <option value="EVENT">ข่าวกิจกรรม</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    กลุ่มเป้าหมาย
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  >
                    <option value="ALL">ทุกคน</option>
                    <option value="TEACHER">เฉพาะคณะครู</option>
                    <option value="STUDENT">เฉพาะนักเรียน</option>
                    <option value="PARENT">ผู้ปกครอง</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  เนื้อหาประกาศ <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="เขียนรายละเอียดของประกาศ..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>ปักหมุดไว้บนสุด (Pinned)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-blue-700 dark:text-blue-300">
                  <input
                    type="checkbox"
                    checked={sendTelegram}
                    onChange={(e) => setSendTelegram(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>ส่งแจ้งเตือน Telegram ทันที</span>
                </label>
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ไฟล์แนบประกาศ ({attachments.length})
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
                      >
                        <span className="truncate">{att.originalName}</span>
                        <button
                          type="button"
                          onClick={() => setAttachments(attachments.filter((a) => a.id !== att.id))}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
              >
                {saving ? 'กำลังบันทึก...' : editingAnn ? 'บันทึกการแก้ไข' : 'เผยแพร่ประกาศ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
};
