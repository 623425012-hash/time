import React, { useState, useEffect } from 'react';
import {
  Shield,
  PlusCircle,
  Calendar,
  User,
  Users,
  CheckCircle2,
  AlertCircle,
  Printer,
  Trash2,
  Edit,
  X,
  Send,
  Sparkles,
  RefreshCw,
  Phone,
  Building,
  Check,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Layers,
  Crown,
  CalendarRange,
} from 'lucide-react';
import { DutyGroup, DutySchedule, DutyMember, User as UserType } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatThaiDate, formatThaiDayOfWeek, THAI_MONTHS_FULL } from '../../utils/thaiDate';

const COLOR_PRESETS = [
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#059669', // Emerald Green
  '#ea580c', // Orange
  '#0284c7', // Sky
  '#e11d48', // Rose / Pink
  '#d97706', // Amber
  '#0d9488', // Teal
  '#4f46e5', // Indigo
];

export const DutyView: React.FC = () => {
  const { user, isAdmin, hasPermission } = useAuth();
  const { showToast, confirm } = useToast();

  const canManage = isAdmin || hasPermission('duties.manage');

  const [activeTab, setActiveTab] = useState<'schedule' | 'groups'>('schedule');
  const [loading, setLoading] = useState(false);

  // Data
  const [groups, setGroups] = useState<DutyGroup[]>([]);
  const [schedules, setSchedules] = useState<DutySchedule[]>([]);

  // Month navigation for Schedule
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1); // 1-12

  // Modals
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<DutyGroup | null>(null);

  const [rotationModalOpen, setRotationModalOpen] = useState(false);
  const [singleScheduleModalOpen, setSingleScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<DutySchedule | null>(null);

  // Group Form State
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [groupColor, setGroupColor] = useState(COLOR_PRESETS[0]);
  const [groupDesc, setGroupDesc] = useState('');
  const [groupResponsibilities, setGroupResponsibilities] = useState<string[]>([
    'ดูแลความเรียบร้อยและความปลอดภัยบริเวณโรงเรียน',
    'ต้อนรับและดูแลความปลอดภัยนักเรียนบริเวณประตูโรงเรียน',
    'ตรวจสอบพื้นที่และอาคารเรียน',
    'ปฏิบัติหน้าที่ตามที่ได้รับมอบหมายจากสถานศึกษา',
  ]);
  const [groupMembers, setGroupMembers] = useState<DutyMember[]>([]);
  const [newRespText, setNewRespText] = useState('');

  // Member sub-form
  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState<'LEADER' | 'MEMBER'>('MEMBER');
  const [memberDept, setMemberDept] = useState('');
  const [memberPos, setMemberPos] = useState('');
  const [memberPhone, setMemberPhone] = useState('');

  // Rotation Generator Form State
  const [rotationStart, setRotationStart] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  );
  const [rotationEnd, setRotationEnd] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()}`
  );
  const [rotationStartGroup, setRotationStartGroup] = useState('');
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [skipHolidays, setSkipHolidays] = useState(true);
  const [generatingRotation, setGeneratingRotation] = useState(false);

  // Single Day Schedule Form State
  const [singleDate, setSingleDate] = useState(today.toISOString().split('T')[0]);
  const [singleGroupId, setSingleGroupId] = useState('');
  const [singleNotes, setSingleNotes] = useState('');
  const [singleSendTelegram, setSingleSendTelegram] = useState(false);

  // Sending Telegram loading state
  const [sendingTelegramId, setSendingTelegramId] = useState<string | null>(null);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsRes, schedulesRes] = await Promise.all([
        api.get<{ groups: DutyGroup[] }>('/duties/groups'),
        api.get<{ schedules: DutySchedule[] }>('/duties/schedules'),
      ]);
      setGroups(groupsRes.groups || []);
      setSchedules(schedulesRes.schedules || []);
      if (groupsRes.groups && groupsRes.groups.length > 0 && !rotationStartGroup) {
        setRotationStartGroup(groupsRes.groups[0].id);
        setSingleGroupId(groupsRes.groups[0].id);
      }
    } catch (e) {
      console.error('Error loading duty data:', e);
      showToast('error', 'ไม่สามารถโหลดข้อมูลตารางเวรได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter schedules by current month
  const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const currentMonthSchedules = schedules.filter((s) => s.date.startsWith(monthPrefix));

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // =====================================
  // Group CRUD Handlers
  // =====================================
  const handleOpenCreateGroup = () => {
    setEditingGroup(null);
    setGroupName(`ชุดเวรที่ ${groups.length + 1}`);
    setGroupCode(`GROUP-${groups.length + 1}`);
    setGroupColor(COLOR_PRESETS[groups.length % COLOR_PRESETS.length]);
    setGroupDesc('');
    setGroupResponsibilities([
      'ดูแลความเรียบร้อยและความปลอดภัยบริเวณโรงเรียน',
      'ต้อนรับและดูแลความปลอดภัยนักเรียนบริเวณประตูโรงเรียน',
      'ตรวจสอบพื้นที่และอาคารเรียน',
      'ปฏิบัติหน้าที่ตามที่ได้รับมอบหมายจากสถานศึกษา',
    ]);
    setGroupMembers([]);
    setGroupModalOpen(true);
  };

  const handleOpenEditGroup = (g: DutyGroup) => {
    setEditingGroup(g);
    setGroupName(g.name);
    setGroupCode(g.code || '');
    setGroupColor(g.color || COLOR_PRESETS[0]);
    setGroupDesc(g.description || '');
    setGroupResponsibilities(g.responsibilities || []);
    setGroupMembers(g.members || []);
    setGroupModalOpen(true);
  };

  const handleAddMemberToGroup = () => {
    if (!memberName.trim()) {
      showToast('warning', 'กรุณากรอกชื่อสมาชิก');
      return;
    }
    const newMember: DutyMember = {
      id: `m-${Date.now()}`,
      name: memberName.trim(),
      roleInGroup: memberRole,
      department: memberDept.trim() || 'ครูผู้สอน',
      position: memberPos.trim() || 'ครู',
      phone: memberPhone.trim() || '',
    };
    // If setting as LEADER, adjust others if needed
    if (memberRole === 'LEADER') {
      const updated = groupMembers.map((m) => (m.roleInGroup === 'LEADER' ? { ...m, roleInGroup: 'MEMBER' as const } : m));
      setGroupMembers([...updated, newMember]);
    } else {
      setGroupMembers([...groupMembers, newMember]);
    }
    setMemberName('');
    setMemberDept('');
    setMemberPos('');
    setMemberPhone('');
    setMemberFormOpen(false);
  };

  const handleRemoveMember = (memberId: string) => {
    setGroupMembers(groupMembers.filter((m) => m.id !== memberId));
  };

  const handleAddResp = () => {
    if (!newRespText.trim()) return;
    setGroupResponsibilities([...groupResponsibilities, newRespText.trim()]);
    setNewRespText('');
  };

  const handleRemoveResp = (idx: number) => {
    setGroupResponsibilities(groupResponsibilities.filter((_, i) => i !== idx));
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      showToast('warning', 'กรุณากรอกชื่อชุดเวร');
      return;
    }

    try {
      if (editingGroup) {
        await api.put(`/duties/groups/${editingGroup.id}`, {
          name: groupName.trim(),
          code: groupCode.trim(),
          color: groupColor,
          description: groupDesc.trim(),
          responsibilities: groupResponsibilities,
          members: groupMembers,
        });
        showToast('success', 'บันทึกการแก้ไขชุดเวรสำเร็จ');
      } else {
        await api.post('/duties/groups', {
          name: groupName.trim(),
          code: groupCode.trim(),
          color: groupColor,
          description: groupDesc.trim(),
          responsibilities: groupResponsibilities,
          members: groupMembers,
        });
        showToast('success', 'สร้างชุดเวรใหม่สำเร็จ');
      }
      setGroupModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleDeleteGroup = async (g: DutyGroup) => {
    const ok = await confirm({
      title: `ลบ ${g.name}`,
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบ ${g.name}?`,
      type: 'danger',
      confirmText: 'ลบชุดเวร',
    });
    if (!ok) return;

    try {
      await api.delete(`/duties/groups/${g.id}`);
      showToast('success', 'ลบชุดเวรสำเร็จ');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('error', 'ไม่สามารถลบชุดเวรได้');
    }
  };

  // =====================================
  // Auto-Rotation Generation
  // =====================================
  const handleGenerateRotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rotationStart || !rotationEnd) {
      showToast('warning', 'กรุณาระบุช่วงวันที่');
      return;
    }
    if (groups.length === 0) {
      showToast('warning', 'ยังไม่มีชุดเวรในระบบ กรุณาสร้างชุดเวรก่อน');
      return;
    }

    setGeneratingRotation(true);
    try {
      const res = await api.post<{ message: string; count: number }>('/duties/generate-rotation', {
        startDate: rotationStart,
        endDate: rotationEnd,
        startGroupId: rotationStartGroup,
        skipWeekends,
        skipHolidays,
        replaceExisting: true,
      });
      showToast('success', res.message || `สร้างตารางเวรสำเร็จ ${res.count} วัน`);
      setRotationModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      showToast('error', err.response?.data?.error || 'เกิดข้อผิดพลาดในการสร้างตารางเวรหมุนอัตโนมัติ');
    } finally {
      setGeneratingRotation(false);
    }
  };

  // =====================================
  // Single Day Override
  // =====================================
  const handleOpenSingleSchedule = (dateStr?: string, existing?: DutySchedule) => {
    if (existing) {
      setEditingSchedule(existing);
      setSingleDate(existing.date);
      setSingleGroupId(existing.groupId);
      setSingleNotes(existing.notes || '');
    } else {
      setEditingSchedule(null);
      setSingleDate(dateStr || new Date().toISOString().split('T')[0]);
      setSingleGroupId(groups[0]?.id || '');
      setSingleNotes('');
    }
    setSingleSendTelegram(false);
    setSingleScheduleModalOpen(true);
  };

  const handleSaveSingleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleDate || !singleGroupId) {
      showToast('warning', 'กรุณาระบุวันที่และชุดเวร');
      return;
    }

    try {
      await api.post('/duties/schedule', {
        date: singleDate,
        groupId: singleGroupId,
        notes: singleNotes.trim(),
        sendTelegramNow: singleSendTelegram,
      });
      showToast('success', `บันทึกตารางเวรวันที่ ${formatThaiDate(singleDate, { format: 'short' })} สำเร็จ`);
      setSingleScheduleModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      showToast('error', err.response?.data?.error || 'ไม่สามารถบันทึกตารางเวรได้');
    }
  };

  const handleDeleteSchedule = async (s: DutySchedule) => {
    const ok = await confirm({
      title: 'ลบรายการตารางเวร',
      message: `คุณต้องการลบตารางเวรของวันที่ ${formatThaiDate(s.date, { format: 'medium' })} หรือไม่?`,
      type: 'danger',
      confirmText: 'ลบตารางเวร',
    });
    if (!ok) return;

    try {
      await api.delete(`/duties/schedule/${s.id || s.date}`);
      showToast('success', 'ลบรายการตารางเวรสำเร็จ');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('error', 'ไม่สามารถลบตารางเวรได้');
    }
  };

  const handleClearMonthSchedules = async () => {
    if (currentMonthSchedules.length === 0) return;
    const ok = await confirm({
      title: `ลบตารางเวรทั้งหมดของเดือน ${THAI_MONTHS_FULL[currentMonth - 1]}?`,
      message: `คุณต้องการลบรายการตารางเวรทั้งหมดในเดือนนี้ (${currentMonthSchedules.length} วัน) หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      type: 'danger',
      confirmText: 'ลบทั้งหมดของเดือนนี้',
    });
    if (!ok) return;

    try {
      for (const s of currentMonthSchedules) {
        await api.delete(`/duties/schedule/${s.id || s.date}`);
      }
      showToast('success', 'ลบตารางเวรของเดือนนี้เรียบร้อยแล้ว');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('error', 'เกิดข้อผิดพลาดในการลบตารางเวร');
    }
  };

  // =====================================
  // Send Telegram Notification
  // =====================================
  const handleSendTelegramForSchedule = async (s: DutySchedule) => {
    setSendingTelegramId(s.id);
    try {
      const res = await api.post<{ success: boolean; message: string }>(`/duties/schedule/${s.id}/notify-telegram`);
      if (res.success) {
        showToast('success', `ส่งแจ้งเตือน Telegram สำหรับ ${s.groupName || 'ชุดเวร'} วันที่ ${formatThaiDate(s.date, { format: 'short' })} เรียบร้อยแล้ว`);
      } else {
        showToast('warning', res.message || 'ส่งแจ้งเตือนไม่สำเร็จ กรุณาตรวจสอบการตั้งค่า Telegram Bot');
      }
    } catch (err: any) {
      console.error(err);
      showToast('error', err.response?.data?.error || 'เกิดข้อผิดพลาดในการส่งข้อความไปยัง Telegram');
    } finally {
      setSendingTelegramId(null);
    }
  };

  // Print schedule
  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="duty-view" className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                ระบบเวรประจำวันแบบชุด
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  {groups.length} ชุดเวร
                </span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                ผูกวันที่ → ชุดเวร → รายชื่อสมาชิกในชุด พร้อมระบบหมุนเวียนอัตโนมัติและการแจ้งเตือน Telegram
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            id="tab-schedule-btn"
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'schedule'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>ตารางการขึ้นเวร</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
              {currentMonthSchedules.length}
            </span>
          </button>

          <button
            type="button"
            id="tab-groups-btn"
            onClick={() => setActiveTab('groups')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'groups'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>จัดการชุดเวร ({groups.length})</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: SCHEDULE VIEW */}
      {/* ==================================================== */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            {/* Month Navigator */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center min-w-[180px]">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {THAI_MONTHS_FULL[currentMonth - 1]} {currentYear + 543}
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {currentMonthSchedules.length} วันปฏิบัติหน้าที่
                </span>
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                title="เดือนถัดไป"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              {canManage && (
                <>
                  <button
                    type="button"
                    id="btn-auto-rotation"
                    onClick={() => {
                      setRotationStart(`${currentYear}-${String(currentMonth).padStart(2, '0')}-01`);
                      const lastDay = new Date(currentYear, currentMonth, 0).getDate();
                      setRotationEnd(`${currentYear}-${String(currentMonth).padStart(2, '0')}-${lastDay}`);
                      setRotationModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold shadow-xs transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>สร้างตารางหมุนอัตโนมัติ</span>
                  </button>

                  <button
                    type="button"
                    id="btn-add-single-day"
                    onClick={() => handleOpenSingleSchedule()}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 text-sm font-medium transition-all"
                  >
                    <PlusCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>จัดเวรเฉพาะวัน</span>
                  </button>

                  {currentMonthSchedules.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearMonthSchedules}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-all"
                      title="ลบตารางเวรทั้งหมดในเดือนนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ล้างตารางเดือนนี้</span>
                    </button>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-medium transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์ตาราง</span>
              </button>
            </div>
          </div>

          {/* Schedules List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-3" />
              <p>กำลังโหลดตารางเวร...</p>
            </div>
          ) : currentMonthSchedules.length === 0 ? (
            <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
              <Shield className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                ยังไม่มีตารางเวรในเดือน {THAI_MONTHS_FULL[currentMonth - 1]} {currentYear + 543}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
                คุณสามารถใช้ระบบสร้างตารางเวรหมุนอัตโนมัติ (ชุดที่ 1 → 2 → 3...) หรือคลิกจัดเวรรายวันได้ทันที
              </p>
              {canManage && (
                <button
                  type="button"
                  onClick={() => {
                    setRotationStart(`${currentYear}-${String(currentMonth).padStart(2, '0')}-01`);
                    const lastDay = new Date(currentYear, currentMonth, 0).getDate();
                    setRotationEnd(`${currentYear}-${String(currentMonth).padStart(2, '0')}-${lastDay}`);
                    setRotationModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>สร้างตารางเวรหมุนอัตโนมัติ</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentMonthSchedules.map((schedule) => {
                const group = groups.find((g) => g.id === schedule.groupId);
                const color = group?.color || schedule.groupColor || '#2563eb';
                const members = schedule.membersSnapshot || group?.members || [];
                const leader = members.find((m) => m.roleInGroup === 'LEADER');
                const isSendingTelegram = sendingTelegramId === schedule.id;

                const dayName = formatThaiDayOfWeek(schedule.date);
                const shortDate = formatThaiDate(schedule.date, { format: 'short' });
                const fullDate = formatThaiDate(schedule.date, { format: 'full' });

                return (
                  <div
                    key={schedule.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                  >
                    {/* Top Color Accent */}
                    <div style={{ backgroundColor: color }} className="h-1.5 w-full" />

                    <div className="p-4.5 space-y-3.5 flex-1">
                      {/* Date & Badge Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {dayName}
                          </div>
                          <div className="text-base font-bold text-slate-900 dark:text-white">
                            {shortDate}
                          </div>
                        </div>

                        <span
                          style={{
                            backgroundColor: `${color}15`,
                            color: color,
                            borderColor: `${color}40`,
                          }}
                          className="px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>{group?.name || schedule.groupName || 'ชุดเวร'}</span>
                        </span>
                      </div>

                      {/* Leader & Members */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
                        {leader && (
                          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-md">
                            <Crown className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">หัวหน้าชุด: {leader.name}</span>
                          </div>
                        )}

                        <div className="text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">
                            สมาชิกประจำวัน ({members.length} คน):
                          </span>
                          <ul className="space-y-1">
                            {members.map((m, idx) => (
                              <li key={m.id || idx} className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                  <span className="truncate">{m.name}</span>
                                </span>
                                {m.phone && (
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    {m.phone}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Notes / Special remarks */}
                      {schedule.notes && (
                        <div className="text-xs bg-blue-50/70 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 p-2 rounded-lg border border-blue-100 dark:border-blue-900/40">
                          📝 {schedule.notes}
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendTelegramForSchedule(schedule)}
                        disabled={isSendingTelegram}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs transition-all"
                        title="ส่งแจ้งเตือนเข้ากลุ่ม Telegram ทันที"
                      >
                        {isSendingTelegram ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>แจ้งเตือน Telegram</span>
                      </button>

                      {canManage && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenSingleSchedule(schedule.date, schedule)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
                            title="แก้ไขเฉพาะวัน"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSchedule(schedule)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-500 hover:text-rose-700 transition-all"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: DUTY GROUPS MANAGEMENT */}
      {/* ==================================================== */}
      {activeTab === 'groups' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                รายชื่อชุดเวรและสมาชิก ({groups.length} ชุด)
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                เพิ่ม/แก้ไข/ลบชุดเวร และกำหนดสมาชิกในแต่ละชุดเพื่อใช้ในการหมุนเวียนอัตโนมัติ
              </p>
            </div>

            {canManage && (
              <button
                type="button"
                id="btn-create-group"
                onClick={handleOpenCreateGroup}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>เพิ่มชุดเวรใหม่</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {groups.map((group) => {
              const leader = group.members.find((m) => m.roleInGroup === 'LEADER');
              const regularMembers = group.members.filter((m) => m.roleInGroup !== 'LEADER');

              return (
                <div
                  key={group.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Header Banner */}
                    <div
                      style={{ backgroundColor: group.color }}
                      className="p-4 text-white flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider opacity-90">
                          {group.code || 'ชุดเวร'}
                        </div>
                        <h3 className="text-lg font-bold">{group.name}</h3>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold">
                        {group.members.length} สมาชิก
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3.5">
                      {group.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                          {group.description}
                        </p>
                      )}

                      {/* Leader */}
                      {leader && (
                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <div>
                              <div className="font-bold text-amber-900 dark:text-amber-200">
                                {leader.name}
                              </div>
                              <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                                {leader.position || leader.department || 'หัวหน้าชุด'}
                              </div>
                            </div>
                          </div>
                          {leader.phone && (
                            <span className="text-[11px] font-mono text-amber-800 dark:text-amber-300">
                              {leader.phone}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Members List */}
                      <div>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                          <span>รายชื่อสมาชิกในชุด:</span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            {regularMembers.length} คน
                          </span>
                        </div>

                        {regularMembers.length === 0 ? (
                          <div className="text-xs text-slate-400 italic py-2">
                            ยังไม่มีสมาชิกทั่วไป (มีเฉพาะหัวหน้าชุด)
                          </div>
                        ) : (
                          <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {regularMembers.map((m, idx) => (
                              <li
                                key={m.id || idx}
                                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs border border-slate-100 dark:border-slate-800"
                              >
                                <div className="truncate">
                                  <span className="font-medium text-slate-800 dark:text-slate-200">
                                    {m.name}
                                  </span>
                                  <span className="text-[11px] text-slate-400 block">
                                    {m.department || m.position || 'สมาชิก'}
                                  </span>
                                </div>
                                {m.phone && (
                                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0 ml-2">
                                    {m.phone}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Responsibilities */}
                      {group.responsibilities && group.responsibilities.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            หน้าที่ความรับผิดชอบ:
                          </div>
                          <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                            {group.responsibilities.slice(0, 3).map((r, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-blue-500 font-bold">•</span>
                                <span className="truncate">{r}</span>
                              </li>
                            ))}
                            {group.responsibilities.length > 3 && (
                              <li className="text-[11px] text-slate-400 pl-3">
                                + อีก {group.responsibilities.length - 3} รายการ...
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {canManage && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditGroup(group)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all"
                      >
                        <Edit className="w-3.5 h-3.5 text-blue-500" />
                        <span>แก้ไขชุดเวร & สมาชิก</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteGroup(group)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-500 transition-all"
                        title="ลบชุดเวร"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: CREATE / EDIT DUTY GROUP & MEMBERS */}
      {/* ==================================================== */}
      {groupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden my-8">
            <div
              style={{ backgroundColor: groupColor }}
              className="p-4 text-white flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5" />
                <h3 className="font-bold text-lg">
                  {editingGroup ? `แก้ไข ${editingGroup.name}` : 'สร้างชุดเวรใหม่'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setGroupModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    ชื่อชุดเวร <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="เช่น ชุดเวรที่ 1, ชุดที่ 1"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    รหัสย่อ (Code)
                  </label>
                  <input
                    type="text"
                    value={groupCode}
                    onChange={(e) => setGroupCode(e.target.value)}
                    placeholder="เช่น GROUP-1"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  สีประจำชุดเวร
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setGroupColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center text-white ${
                        groupColor === color ? 'ring-3 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'
                      }`}
                    >
                      {groupColor === color && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  คำอธิบายหรือพื้นที่รับผิดชอบ
                </label>
                <textarea
                  rows={2}
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="เช่น ดูแลความสงบเรียบร้อย ต้อนรับนักเรียนประตูหลัก และตรวจตราอาคารเรียน 1-2"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Members Section */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span>สมาชิกในชุดเวร ({groupMembers.length} คน)</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      เพิ่มครูหรือบุคลากรที่อยู่ในชุดเวรนี้
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMemberFormOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-bold transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>เพิ่มสมาชิก</span>
                  </button>
                </div>

                {/* Sub-form to add member */}
                {memberFormOpen && (
                  <div className="p-3.5 bg-blue-50/50 dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-3">
                    <div className="text-xs font-bold text-blue-900 dark:text-blue-300">
                      เพิ่มข้อมูลสมาชิกใหม่
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="ชื่อ-นามสกุล *"
                          value={memberName}
                          onChange={(e) => setMemberName(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                        />
                      </div>
                      <div>
                        <select
                          value={memberRole}
                          onChange={(e) => setMemberRole(e.target.value as 'LEADER' | 'MEMBER')}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold"
                        >
                          <option value="MEMBER">👤 สมาชิกทั่วไป</option>
                          <option value="LEADER">👑 หัวหน้าชุดเวร</option>
                        </select>
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="กลุ่มสาระ / ฝ่ายงาน"
                          value={memberDept}
                          onChange={(e) => setMemberDept(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="เบอร์โทรศัพท์ติดต่อ"
                          value={memberPhone}
                          onChange={(e) => setMemberPhone(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setMemberFormOpen(false)}
                        className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={handleAddMemberToGroup}
                        className="px-3.5 py-1 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                      >
                        บันทึกสมาชิก
                      </button>
                    </div>
                  </div>
                )}

                {/* Members list */}
                {groupMembers.length === 0 ? (
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-400">
                    ยังไม่มีสมาชิกในชุดเวรนี้ กดปุ่ม &quot;เพิ่มสมาชิก&quot; เพื่อระบุชื่อ
                  </div>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {groupMembers.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {m.roleInGroup === 'LEADER' ? (
                            <span className="p-1 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                              <Crown className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="p-1 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              <User className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {m.name}{' '}
                              {m.roleInGroup === 'LEADER' && (
                                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                  (หัวหน้าชุด)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {m.department || 'ไม่ระบุฝ่าย'} {m.phone ? ` • 📞 ${m.phone}` : ''}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.id)}
                          className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-500"
                          title="ลบสมาชิก"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Responsibilities list */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  หน้าที่ความรับผิดชอบของชุดเวร
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRespText}
                    onChange={(e) => setNewRespText(e.target.value)}
                    placeholder="พิมพ์หน้าที่แล้วกดเพิ่ม..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddResp();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddResp}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-xs font-bold"
                  >
                    เพิ่ม
                  </button>
                </div>

                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {groupResponsibilities.map((resp, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <span className="truncate">• {resp}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveResp(i)}
                        className="text-slate-400 hover:text-rose-500 ml-2"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setGroupModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs"
                >
                  {editingGroup ? 'บันทึกการแก้ไข' : 'สร้างชุดเวร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: AUTO-ROTATION GENERATOR */}
      {/* ==================================================== */}
      {rotationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-5 bg-linear-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-lg">สร้างตารางเวรหมุนอัตโนมัติ</h3>
              </div>
              <button
                type="button"
                onClick={() => setRotationModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateRotation} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ระบบจะหมุนเวียนชุดเวรตามลำดับ (เช่น ชุดที่ 1 → ชุดที่ 2 → ชุดที่ 3 → ... → ชุดที่ 6 → ชุดที่ 1) ตลอดช่วงเวลาที่ระบุ
              </p>

              {/* Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    วันที่เริ่มต้น <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={rotationStart}
                    onChange={(e) => setRotationStart(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    วันที่สิ้นสุด <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={rotationEnd}
                    onChange={(e) => setRotationEnd(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              {/* Start Group */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ชุดเวรที่เริ่มในวันแรก
                </label>
                <select
                  value={rotationStartGroup}
                  onChange={(e) => setRotationStartGroup(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      🛡️ {g.name} ({g.members.length} สมาชิก)
                    </option>
                  ))}
                </select>
              </div>

              {/* Presets */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  รูปแบบการจัดเวร:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSkipWeekends(false);
                      setSkipHolidays(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                      !skipWeekends && !skipHolidays
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="font-bold mb-0.5">🗓️ จัดเวรทุกวันต่อเนื่อง</div>
                    <div className="text-[11px] opacity-80">รวมเสาร์-อาทิตย์ และวันหยุด (ไม่เว้นวัน)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSkipWeekends(true);
                      setSkipHolidays(true);
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                      skipWeekends && skipHolidays
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="font-bold mb-0.5">🏫 เฉพาะวันทำการ</div>
                    <div className="text-[11px] opacity-80">เว้นเสาร์-อาทิตย์ และวันหยุดราชการ</div>
                  </button>
                </div>
              </div>

              {/* Fine-grain options */}
              <div className="space-y-2 pt-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={skipWeekends}
                    onChange={(e) => setSkipWeekends(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>เว้นวันเสาร์และวันอาทิตย์</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={skipHolidays}
                    onChange={(e) => setSkipHolidays(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>เว้นวันหยุดราชการไทย (อ้างอิงจากระบบปฏิทินวันหยุด)</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRotationModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={generatingRotation}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold text-sm shadow-xs"
                >
                  {generatingRotation ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>สร้างตารางเวรทันที</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: SINGLE-DAY OVERRIDE */}
      {/* ==================================================== */}
      {singleScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">
                  {editingSchedule ? 'แก้ไขตารางเวรเฉพาะวัน' : 'จัดเวรเฉพาะวัน'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSingleScheduleModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSingleSchedule} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  วันที่ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {formatThaiDate(singleDate, { format: 'full' })}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  เลือกชุดเวรที่ปฏิบัติหน้าที่ <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={singleGroupId}
                  onChange={(e) => setSingleGroupId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      🛡️ {g.name} ({g.members.length} สมาชิก)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  หมายเหตุหรือคำสั่งพิเศษเฉพาะวันนี้
                </label>
                <textarea
                  rows={2}
                  value={singleNotes}
                  onChange={(e) => setSingleNotes(e.target.value)}
                  placeholder="เช่น เน้นตรวจตราจุดรับส่งนักเรียนฝั่งทิศตะวันออก"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={singleSendTelegram}
                    onChange={(e) => setSingleSendTelegram(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>ส่งแจ้งเตือน Telegram ทันทีหลังบันทึก</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSingleScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
