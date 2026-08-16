import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  AlertCircle,
  Bell,
  Megaphone,
  Flag,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Cake,
  ClipboardList,
  PlusCircle,
  ArrowUpRight,
  LogIn,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  SchoolEvent,
  Announcement,
  ThaiHoliday,
  StaffBirthday,
  DutyRoster,
  DutyGroup,
  DutySchedule,
  ActiveNavTab,
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';
import { Shield, Crown, Send } from 'lucide-react';

interface DashboardViewProps {
  summary: {
    todayEventsCount: number;
    tomorrowEventsCount: number;
    pendingEventsCount: number;
    usersCount: number;
    announcementsCount: number;
    nextHoliday: ThaiHoliday | null;
  };
  todayEvents: SchoolEvent[];
  tomorrowEvents: SchoolEvent[];
  pendingEvents: SchoolEvent[];
  activeAnnouncements: Announcement[];
  todayBirthdays: StaffBirthday[];
  todayDuties: DutyRoster[];
  todayDutySchedule?: DutySchedule | null;
  todayDutyGroup?: DutyGroup | null;
  onSelectEvent: (event: SchoolEvent) => void;
  onNavigateTab: (tab: ActiveNavTab) => void;
  onOpenCreateEvent: () => void;
  onRefresh: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  todayEvents,
  tomorrowEvents,
  pendingEvents,
  activeAnnouncements,
  todayBirthdays,
  todayDuties,
  todayDutySchedule,
  todayDutyGroup,
  onSelectEvent,
  onNavigateTab,
  onOpenCreateEvent,
  onRefresh,
}) => {
  const { isAdmin, isViewer, hasPermission } = useAuth();
  const { showToast } = useToast();

  const handleCelebrateBirthday = async (bday: StaffBirthday) => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    if (isViewer) {
      showToast('info', 'สุขสันต์วันเกิด! 🎂', `ขอร่วมอวยพรวันเกิดแด่คุณ ${bday.name}`);
      return;
    }

    try {
      await api.post(`/birthdays/${bday.id}/wish`);
      showToast('success', 'ส่งคำอวยพรวันเกิดสำเร็จ', `ส่งคำอวยพรแด่คุณ ${bday.name} ไปยัง Telegram เรียบร้อยแล้ว`);
    } catch (e: any) {
      showToast('info', 'สุขสันต์วันเกิด!', `ขอร่วมอวยพรวันเกิดแด่คุณ ${bday.name}`);
    }
  };

  const getPriorityBadge = (priority: SchoolEvent['priority']) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">ด่วนที่สุด</span>;
      case 'IMPORTANT':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">สำคัญ</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">ทั่วไป</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Viewer Welcome & Login Prompt */}
      {isViewer && (
        <div className="p-4 sm:p-5 rounded-3xl bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold">
                ยินดีต้อนรับสู่ระบบปฏิทินกิจกรรมและตารางเวรโรงเรียน
              </p>
              <p className="text-xs text-blue-100 mt-0.5">
                ขณะนี้คุณกำลังเข้าชมในฐานะ <strong>ผู้เยี่ยมชม (Viewer)</strong> — ครูและบุคลากรสามารถเข้าสู่ระบบเพื่อจัดการกิจกรรมได้
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('login')}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-blue-700 hover:bg-blue-50 active:scale-95 text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>เข้าสู่ระบบ (Login)</span>
          </button>
        </div>
      )}

      {/* Birthday Celebration Banner if any */}
      {todayBirthdays && todayBirthdays.length > 0 && (
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-amber-500 via-pink-500 to-purple-600 p-5 text-white shadow-lg">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                <Cake className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <span>🎂 สุขสันต์วันเกิดบุคลากรวันนี้!</span>
                  <Sparkles className="w-4 h-4 text-amber-200 animate-bounce" />
                </h3>
                <p className="text-xs text-white/90 mt-0.5">
                  {todayBirthdays.map((b) => `${b.name} (${b.department})`).join(', ')}
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap">
              {todayBirthdays.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleCelebrateBirthday(b)}
                  className="px-3.5 py-2 rounded-xl bg-white text-pink-600 hover:bg-pink-50 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ร่วมอวยพร ({b.nickname || b.name.split(' ')[0]})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Today's Events */}
        <div
          onClick={() => onNavigateTab('calendar')}
          className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">กิจกรรมวันนี้</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {summary.todayEventsCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">รายการวันนี้</p>
        </div>

        {/* Tomorrow's Events */}
        <div
          onClick={() => onNavigateTab('calendar')}
          className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">กิจกรรมพรุ่งนี้</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {summary.tomorrowEventsCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">รายการพรุ่งนี้</p>
        </div>

        {/* Pending Approvals */}
        <div
          onClick={() => onNavigateTab('calendar')}
          className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">รออนุมัติ</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {summary.pendingEventsCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">กิจกรรมรอตรวจสอบ</p>
        </div>

        {/* Announcements */}
        <div
          onClick={() => onNavigateTab('announcements')}
          className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">ประกาศล่าสุด</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Megaphone className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {summary.announcementsCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">ประกาศที่ใช้งานอยู่</p>
        </div>

        {/* Next Holiday */}
        <div
          onClick={() => (!isViewer ? onNavigateTab('holidays') : onNavigateTab('calendar'))}
          className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">วันหยุดถัดไป</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Flag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2 truncate">
            {summary.nextHoliday ? summary.nextHoliday.name : 'ไม่มี'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
            {summary.nextHoliday ? summary.nextHoliday.date : '-'}
          </p>
        </div>

        {/* Users */}
        <div
          onClick={() => (!isViewer && hasPermission('users.view') ? onNavigateTab('users') : undefined)}
          className={`p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs transition-all ${
            !isViewer ? 'hover:shadow-md cursor-pointer' : 'cursor-default'
          } group`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">ผู้ใช้งาน</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {summary.usersCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">บุคลากรในระบบ</p>
        </div>
      </div>

      {/* Main Grid: Today's Timeline + Duty Roster & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: กิจกรรมวันนี้ (Timeline) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    กิจกรรมวันนี้ (Today&apos;s Timeline)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ลำดับกิจกรรมตามช่วงเวลาของวัน
                  </p>
                </div>
              </div>

              {hasPermission('events.create') && (
                <button
                  onClick={onOpenCreateEvent}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>เพิ่มกิจกรรม</span>
                </button>
              )}
            </div>

            {/* Timeline List */}
            <div className="mt-6">
              {todayEvents.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    ไม่มีกิจกรรมสำหรับวันนี้
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    สามารถตรวจสอบกิจกรรมของวันถัดไปหรือสร้างกิจกรรมใหม่ได้
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-blue-200 dark:border-blue-900 space-y-6">
                  {todayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => onSelectEvent(ev)}
                      className="relative group cursor-pointer"
                    >
                      {/* Timeline Dot */}
                      <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900 shadow-xs" />

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-all hover:shadow-xs">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {ev.isAllDay ? 'ตลอดทั้งวัน' : `${ev.startTime} - ${ev.endTime} น.`}
                              </span>
                              {getPriorityBadge(ev.priority)}
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {ev.title}
                            </h4>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                        </div>

                        {ev.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                            {ev.description}
                          </p>
                        )}

                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                          {ev.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span className="truncate">{ev.location}</span>
                            </span>
                          )}
                          {ev.coordinator && (
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{ev.coordinator}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pending Events if Admin */}
          {isAdmin && pendingEvents.length > 0 && (
            <div className="bg-amber-50/60 dark:bg-amber-950/20 rounded-3xl p-5 border border-amber-200 dark:border-amber-900/60">
              <div className="flex items-center justify-between pb-3 border-b border-amber-200/60 dark:border-amber-900/40">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <h4 className="text-sm font-bold">กิจกรรมรออนุมัติ ({pendingEvents.length} รายการ)</h4>
                </div>
                <button
                  onClick={() => onNavigateTab('calendar')}
                  className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>ดูทั้งหมด</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {pendingEvents.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => onSelectEvent(ev)}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-between cursor-pointer hover:shadow-xs transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{ev.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        ผู้เสนอ: {ev.createdByName} | วันที่: {ev.startDate}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-1 rounded-xl">
                      ตรวจสอบ
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Duty Roster + Announcements */}
        <div className="space-y-6">
          {/* Today's Duty Roster */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <ClipboardList className="w-5 h-5 text-indigo-500" />
                <h4 className="text-sm font-bold">ครูเวรประจำวันนี้</h4>
              </div>
              <button
                onClick={() => onNavigateTab('duties')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                ดูตารางเวร
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {todayDutyGroup || todayDutySchedule ? (
                <div
                  onClick={() => onNavigateTab('duties')}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-300 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        backgroundColor: `${todayDutyGroup?.color || '#2563eb'}20`,
                        color: todayDutyGroup?.color || '#2563eb',
                      }}
                      className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{todayDutyGroup?.name || todayDutySchedule?.groupName || 'ชุดเวรประจำวัน'}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {(todayDutyGroup?.members?.length || todayDutySchedule?.membersSnapshot?.length || 0)} สมาชิก
                    </span>
                  </div>

                  {/* Leader */}
                  {(() => {
                    const members = todayDutyGroup?.members || todayDutySchedule?.membersSnapshot || [];
                    const leader = members.find((m) => m.roleInGroup === 'LEADER');
                    const regularMembers = members.filter((m) => m.roleInGroup !== 'LEADER');

                    return (
                      <div className="space-y-1.5 text-xs">
                        {leader && (
                          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5">
                            <Crown className="w-3.5 h-3.5 text-amber-600" />
                            <span>หัวหน้าชุด: {leader.name}</span>
                          </div>
                        )}
                        <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                          สมาชิก: {regularMembers.map((m) => m.name).join(', ') || 'ไม่มี'}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : todayDuties.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">ยังไม่ได้กำหนดตารางเวรสำหรับวันนี้</p>
              ) : (
                todayDuties.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {d.dutyType || d.type || 'เวรประจำวัน'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                        {d.shiftTime === 'MORNING' || d.shift === 'MORNING'
                          ? 'เช้า'
                          : d.shiftTime === 'AFTERNOON' || d.shift === 'AFTERNOON'
                          ? 'บ่าย'
                          : 'ทั้งวัน'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                      {d.staffName || d.teacherName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {d.location ? `ประจำ: ${d.location}` : d.department}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Announcements */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Megaphone className="w-5 h-5 text-emerald-500" />
                <h4 className="text-sm font-bold">ประกาศข่าวสาร</h4>
              </div>
              <button
                onClick={() => onNavigateTab('announcements')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                ดูทั้งหมด
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {activeAnnouncements.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">ไม่มีประกาศในขณะนี้</p>
              ) : (
                activeAnnouncements.map((ann) => (
                  <div
                    key={ann.id}
                    onClick={() => onNavigateTab('announcements')}
                    className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      {(ann.priority === 'URGENT' || ann.type === 'URGENT') && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500 text-white">
                          ด่วน
                        </span>
                      )}
                      <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {ann.title}
                      </h5>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {ann.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
