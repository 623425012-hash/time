import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Users,
  Building,
  AlertTriangle,
  UploadCloud,
  FileText,
  Trash2,
  BellRing,
  Repeat,
  Sparkles,
} from 'lucide-react';
import { SchoolEvent, EventCategory, EventPriority, EventRecurrence, EventAttachment } from '../../types';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSaved?: () => void;
  initialEvent?: SchoolEvent | null;
  initialDate?: string;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSaved,
  initialEvent,
  initialDate,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('16:30');
  const [isAllDay, setIsAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [coordinator, setCoordinator] = useState('');
  const [department, setDepartment] = useState('');
  const [targetGroup, setTargetGroup] = useState('');
  const [priority, setPriority] = useState<EventPriority>('NORMAL');
  const [recurrence, setRecurrence] = useState<EventRecurrence>('NONE');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [sendTelegram, setSendTelegram] = useState(true);
  const [notifySchedule, setNotifySchedule] = useState<string[]>(['1_DAY_BEFORE', 'SAME_DAY_MORNING']);
  const [attachments, setAttachments] = useState<EventAttachment[]>([]);

  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get<{ categories: EventCategory[] }>('/events/categories/list');
        setCategories(res.categories || []);
        if (!categoryId && res.categories?.length > 0) {
          setCategoryId(res.categories[0].id);
        }
      } catch (e) {
        console.error('Error fetching categories:', e);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialEvent) {
      setTitle(initialEvent.title || '');
      setCategoryId(initialEvent.categoryId || '');
      setStartDate(initialEvent.startDate || '');
      setEndDate(initialEvent.endDate || '');
      setStartTime(initialEvent.startTime || '08:30');
      setEndTime(initialEvent.endTime || '16:30');
      setIsAllDay(!!initialEvent.isAllDay);
      setLocation(initialEvent.location || '');
      setDescription(initialEvent.description || '');
      setCoordinator(initialEvent.coordinator || '');
      setDepartment(initialEvent.department || '');
      setTargetGroup(initialEvent.targetGroup || '');
      setPriority(initialEvent.priority || 'NORMAL');
      setRecurrence(initialEvent.recurrence || 'NONE');
      setRecurrenceEndDate(initialEvent.recurrenceEndDate || '');
      setSendTelegram(initialEvent.sendTelegram !== false);
      setNotifySchedule(initialEvent.notifySchedule || ['1_DAY_BEFORE', 'SAME_DAY_MORNING']);
      setAttachments(initialEvent.attachments || []);
    } else {
      const today = initialDate || new Date().toISOString().split('T')[0];
      setTitle('');
      setStartDate(today);
      setEndDate(today);
      setStartTime('08:30');
      setEndTime('16:30');
      setIsAllDay(false);
      setLocation('');
      setDescription('');
      setCoordinator(user ? `${user.name} ${user.surname}` : '');
      setDepartment(user?.department || '');
      setTargetGroup('');
      setPriority('NORMAL');
      setRecurrence('NONE');
      setRecurrenceEndDate('');
      setSendTelegram(true);
      setNotifySchedule(['1_DAY_BEFORE', 'SAME_DAY_MORNING']);
      setAttachments([]);
    }
  }, [initialEvent, initialDate, isOpen, user]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Convert to Base64 for instant client preview and offline persistence
        const base64Promise = new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve((event.target?.result as string) || '');
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
        const base64Data = await base64Promise;

        try {
          const formData = new FormData();
          formData.append('file', file);
          const res = await api.post<{ attachment: EventAttachment }>('/files/upload', formData);
          if (res && res.attachment) {
            const attWithData = {
              ...res.attachment,
              dataUrl: base64Data || res.attachment.dataUrl || `/api/files/view/${res.attachment.fileName}`,
            };
            setAttachments((prev) => [...prev, attWithData]);
            continue;
          }
        } catch {
          // Backend offline or mock fallback
        }

        // Fallback attachment with Base64
        const localAtt: EventAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          originalName: file.name,
          fileName: `file-${Date.now()}-${file.name}`,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          uploadedBy: user?.id || 'usr-default',
          uploadedByName: user ? `${user.name} ${user.surname}` : 'ผู้ใช้งาน',
          uploadedAt: new Date().toISOString(),
          dataUrl: base64Data,
        };
        setAttachments((prev) => [...prev, localAtt]);
      }
      showToast('success', 'อัปโหลดเอกสารสำเร็จ', `เพิ่มไฟล์แนบเรียบร้อยแล้ว`);
    } catch (err: any) {
      showToast('error', 'อัปโหลดไฟล์ล้มเหลว', err?.message || 'ไฟล์อาจมีขนาดใหญ่เกินไปหรือไม่รองรับ');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleNotifySchedule = (value: string) => {
    setNotifySchedule((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) {
      showToast('warning', 'กรอกข้อมูลไม่ครบถ้วน', 'กรุณาระบุชื่อกิจกรรมและช่วงเวลาให้เรียบร้อย');
      return;
    }

    if (startDate > endDate) {
      showToast('warning', 'วันที่ไม่ถูกต้อง', 'วันสิ้นสุดต้องไม่เกิดขึ้นก่อนวันเริ่มต้น');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        categoryId,
        startDate,
        endDate,
        startTime: isAllDay ? '00:00' : startTime,
        endTime: isAllDay ? '23:59' : endTime,
        isAllDay,
        location,
        description,
        coordinator,
        department,
        targetGroup,
        priority,
        recurrence,
        recurrenceEndDate: recurrence !== 'NONE' ? recurrenceEndDate : undefined,
        sendTelegram,
        notifySchedule,
        attachments,
      };

      if (initialEvent) {
        await api.put(`/events/${initialEvent.id}`, payload);
        showToast('success', 'แก้ไขกิจกรรมสำเร็จ', `อัปเดตข้อมูลกิจกรรม "${title}" เรียบร้อยแล้ว`);
      } else {
        await api.post('/events', payload);
        showToast(
          'success',
          'สร้างกิจกรรมใหม่สำเร็จ',
          user?.role === 'ADMIN'
            ? `กิจกรรม "${title}" ได้รับการอนุมัติและเผยแพร่แล้ว`
            : `ส่งคำขอจัดกิจกรรม "${title}" เข้าสู่ระบบรอการอนุมัติเรียบร้อยแล้ว`
        );
      }
      if (onSuccess) onSuccess();
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      showToast('error', 'ไม่สามารถบันทึกข้อมูลได้', err?.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in zoom-in-95 duration-150 my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {initialEvent ? 'แก้ไขข้อมูลกิจกรรม' : 'เพิ่มกิจกรรมโรงเรียนใหม่'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                บันทึกกำหนดการ กำหนดผู้รับผิดชอบ และตั้งค่าการแจ้งเตือน Telegram
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              ชื่อกิจกรรม / โครงการ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ประชุมครูประจำเดือน, พิธีไหว้ครู, สัปดาห์วิทยาศาสตร์..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                หมวดหมู่กิจกรรม
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ระดับความสำคัญ
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['NORMAL', 'IMPORTANT', 'URGENT'] as EventPriority[]).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                      priority === p
                        ? p === 'URGENT'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : p === 'IMPORTANT'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p === 'URGENT' ? 'ด่วนที่สุด' : p === 'IMPORTANT' ? 'สำคัญ' : 'ทั่วไป'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dates & Times */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>กำหนดการวันและเวลา</span>
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>ตลอดทั้งวัน (All Day)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">วันเริ่มต้น</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate < e.target.value) setEndDate(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">วันสิ้นสุด</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {!isAllDay && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">เวลาเริ่ม</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">เวลาสิ้นสุด</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

            {/* Recurrence Repeat */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                    <Repeat className="w-3 h-3 text-indigo-500" />
                    <span>การเกิดซ้ำ (Recurrence)</span>
                  </label>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as EventRecurrence)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="NONE">ไม่เกิดซ้ำ (ครั้งเดียว)</option>
                    <option value="DAILY">เกิดซ้ำทุกวัน</option>
                    <option value="WEEKLY">เกิดซ้ำทุกสัปดาห์</option>
                    <option value="MONTHLY">เกิดซ้ำทุกเดือน</option>
                    <option value="YEARLY">เกิดซ้ำทุกปี</option>
                  </select>
                </div>

                {recurrence !== 'NONE' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      สิ้นสุดการเกิดซ้ำถึงวันที่
                    </label>
                    <input
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>สถานที่จัดกิจกรรม</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="เช่น หอประชุม, ห้องประชุม 1"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-indigo-500" />
                <span>กลุ่มสาระ / ฝ่ายงาน</span>
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="เช่น ฝ่ายวิชาการ, กิจการนักเรียน"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>ผู้รับผิดชอบโครงการ</span>
              </label>
              <input
                type="text"
                value={coordinator}
                onChange={(e) => setCoordinator(e.target.value)}
                placeholder="เช่น ครูสมศักดิ์ รักเรียน"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Target Group */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-emerald-500" />
              <span>กลุ่มเป้าหมาย / ผู้เข้าร่วม</span>
            </label>
            <input
              type="text"
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value)}
              placeholder="เช่น นักเรียนชั้น ม.1-ม.6, คณะครูและบุคลากรทุกคน"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              รายละเอียดกิจกรรม / วัตถุประสงค์
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุรายละเอียด กำหนดการคร่าวๆ หรือสิ่งที่ต้องเตรียม..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            />
          </div>

          {/* Telegram Notification Settings */}
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                <BellRing className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>การแจ้งเตือนไปยัง Telegram</span>
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-blue-800 dark:text-blue-300">
                <input
                  type="checkbox"
                  checked={sendTelegram}
                  onChange={(e) => setSendTelegram(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>ส่งการแจ้งเตือน Telegram อัตโนมัติ</span>
              </label>
            </div>

            {sendTelegram && (
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  กำหนดรอบเวลาส่งแจ้งเตือนล่วงหน้า:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: '3_DAYS_BEFORE', label: 'เตือนล่วงหน้า 3 วัน' },
                    { id: '1_DAY_BEFORE', label: 'เตือนล่วงหน้า 1 วัน' },
                    { id: 'SAME_DAY_MORNING', label: 'เตือนเช้าวันจัดกิจกรรม (07:00)' },
                    { id: '1_HOUR_BEFORE', label: 'เตือนก่อนเริ่ม 1 ชั่วโมง' },
                  ].map((timing) => (
                    <button
                      type="button"
                      key={timing.id}
                      onClick={() => toggleNotifySchedule(timing.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        notifySchedule.includes(timing.id)
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {timing.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Attachments Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>เอกสารแนบ / โครงการ / หนังสือราชการ ({attachments.length})</span>
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5 text-blue-500" />
                <span>{uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดไฟล์'}</span>
              </button>
            </div>

            {attachments.length > 0 ? (
              <div className="space-y-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {att.originalName}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        ({(att.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
              >
                <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  คลิกเพื่อเลือกไฟล์เอกสารแนบ (รองรับ PDF, DOCX, XLSX, รูปภาพ สูงสุด 25MB)
                </p>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || uploading}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
          >
            {saving ? 'กำลังบันทึก...' : initialEvent ? 'บันทึกการแก้ไข' : 'สร้างกิจกรรม'}
          </button>
        </div>
      </div>
    </div>
  );
};
