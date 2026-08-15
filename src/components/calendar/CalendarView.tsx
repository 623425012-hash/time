import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import {
  Calendar as CalendarIcon,
  PlusCircle,
  Filter,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Building,
  CheckCircle2,
  Clock,
  Flag,
  Shield,
  Send,
  User,
  Crown,
  Phone,
  X,
  RefreshCw,
} from 'lucide-react';
import { SchoolEvent, EventCategory, ThaiHoliday, DutySchedule, DutyGroup } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { formatThaiDate, formatThaiDayOfWeek, THAI_MONTHS_FULL } from '../../utils/thaiDate';

interface CalendarViewProps {
  onSelectEvent: (event: SchoolEvent) => void;
  onOpenCreateEvent?: (date?: string) => void;
  onOpenCreate?: (date?: string) => void;
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onSelectEvent,
  onOpenCreateEvent,
  onOpenCreate,
  refreshTrigger,
  onRefresh,
}) => {
  const handleCreate = (date?: string) => {
    if (onOpenCreate) onOpenCreate(date);
    else if (onOpenCreateEvent) onOpenCreateEvent(date);
  };
  const { hasPermission, isAdmin } = useAuth();
  const { systemSettings } = useTheme();
  const { showToast, confirm } = useToast();
  const calendarRef = useRef<FullCalendar>(null);

  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [holidays, setHolidays] = useState<ThaiHoliday[]>([]);
  const [dutySchedules, setDutySchedules] = useState<DutySchedule[]>([]);
  const [dutyGroups, setDutyGroups] = useState<DutyGroup[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [showHolidays, setShowHolidays] = useState<boolean>(true);
  const [showDuties, setShowDuties] = useState<boolean>(true);
  const [currentTitle, setCurrentTitle] = useState<string>('');
  const [currentView, setCurrentView] = useState<string>('dayGridMonth');
  const [loading, setLoading] = useState<boolean>(false);

  // Selected for modals
  const [selectedHoliday, setSelectedHoliday] = useState<ThaiHoliday | null>(null);
  const [selectedDuty, setSelectedDuty] = useState<{ schedule: DutySchedule; group?: DutyGroup } | null>(null);
  const [sendingDutyTelegram, setSendingDutyTelegram] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, catsRes, holsRes, dutiesRes, groupsRes] = await Promise.all([
        api.get<{ events: SchoolEvent[] }>('/events?includePending=true'),
        api.get<{ categories: EventCategory[] }>('/events/categories/list'),
        api.get<{ holidays: ThaiHoliday[] }>('/holidays'),
        api.get<{ schedules: DutySchedule[] }>('/duties/schedules'),
        api.get<{ groups: DutyGroup[] }>('/duties/groups'),
      ]);
      setEvents(eventsRes.events || []);
      setCategories(catsRes.categories || []);
      setHolidays(holsRes.holidays || []);
      setDutySchedules(dutiesRes.schedules || []);
      setDutyGroups(groupsRes.groups || []);
    } catch (e) {
      console.error('Failed to load calendar events:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  // Filter events based on criteria
  const filteredEvents = events.filter((ev) => {
    if (selectedCategory !== 'ALL' && ev.categoryId !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && ev.status !== selectedStatus) return false;
    if (selectedDepartment !== 'ALL' && ev.department !== selectedDepartment) return false;
    return true;
  });

  // Extract unique departments for filter
  const departments = Array.from(new Set(events.map((e) => e.department).filter(Boolean)));

  // Transform into FullCalendar Event Sources
  const calendarEvents = [
    // 1. School Events
    ...filteredEvents.map((ev) => {
      const category = categories.find((c) => c.id === ev.categoryId);
      let color = category?.color || '#2563eb';
      if (ev.status === 'PENDING') color = '#d97706';
      if (ev.status === 'REJECTED') color = '#dc2626';

      return {
        id: `event-${ev.id}`,
        title: `${ev.status === 'PENDING' ? '⏳ [รออนุมัติ] ' : ''}${ev.title}`,
        start: ev.isAllDay ? ev.startDate : `${ev.startDate}T${ev.startTime || '00:00'}`,
        end: ev.isAllDay ? ev.endDate : `${ev.endDate}T${ev.endTime || '23:59'}`,
        allDay: ev.isAllDay,
        backgroundColor: color,
        borderColor: color,
        textColor: '#ffffff',
        extendedProps: {
          originalEvent: ev,
          type: 'SCHOOL_EVENT',
        },
      };
    }),

    // 2. Thai Public Holidays & Important days
    ...(showHolidays
      ? holidays.map((h) => ({
          id: `hol-${h.id}`,
          title: `🚩 ${h.name}`,
          start: h.date,
          end: h.date,
          allDay: true,
          backgroundColor: h.type === 'HOLIDAY' ? '#e11d48' : '#7c3aed',
          borderColor: h.type === 'HOLIDAY' ? '#e11d48' : '#7c3aed',
          textColor: '#ffffff',
          extendedProps: {
            type: 'HOLIDAY',
            holiday: h,
          },
        }))
      : []),

    // 3. Duty Sets (ตารางเวรประจำวันแบบชุด)
    ...(showDuties
      ? dutySchedules.map((s) => {
          const group = dutyGroups.find((g) => g.id === s.groupId);
          const color = group?.color || s.groupColor || '#0284c7';
          const name = group?.name || s.groupName || 'ชุดเวร';

          return {
            id: `duty-${s.id}`,
            title: `🛡️ ${name}`,
            start: s.date,
            end: s.date,
            allDay: true,
            backgroundColor: color,
            borderColor: color,
            textColor: '#ffffff',
            extendedProps: {
              type: 'DUTY_SCHEDULE',
              schedule: s,
              group: group,
            },
          };
        })
      : []),
  ];

  // Calendar Controls
  const handlePrev = () => {
    const calApi = calendarRef.current?.getApi();
    calApi?.prev();
    updateTitle();
  };

  const handleNext = () => {
    const calApi = calendarRef.current?.getApi();
    calApi?.next();
    updateTitle();
  };

  const handleToday = () => {
    const calApi = calendarRef.current?.getApi();
    calApi?.today();
    updateTitle();
  };

  const handleChangeView = (viewName: string) => {
    const calApi = calendarRef.current?.getApi();
    calApi?.changeView(viewName);
    setCurrentView(viewName);
    updateTitle();
  };

  const updateTitle = () => {
    const calApi = calendarRef.current?.getApi();
    if (calApi) {
      const date = calApi.getDate();
      const thaiYear = date.getFullYear() + 543;
      setCurrentTitle(`${THAI_MONTHS_FULL[date.getMonth()]} พ.ศ. ${thaiYear}`);
    }
  };

  useEffect(() => {
    updateTitle();
  }, []);

  const handleDateClick = (arg: { dateStr: string }) => {
    if (hasPermission('events.create')) {
      handleCreate(arg.dateStr);
    }
  };

  const handleEventClick = (info: any) => {
    const { extendedProps } = info.event;
    if (extendedProps.type === 'SCHOOL_EVENT') {
      onSelectEvent(extendedProps.originalEvent);
    } else if (extendedProps.type === 'HOLIDAY') {
      setSelectedHoliday(extendedProps.holiday);
    } else if (extendedProps.type === 'DUTY_SCHEDULE') {
      const g = dutyGroups.find((grp) => grp.id === extendedProps.schedule.groupId) || extendedProps.group;
      setSelectedDuty({
        schedule: extendedProps.schedule,
        group: g,
      });
    }
  };

  const handleSendTelegramForDuty = async (schedule: DutySchedule) => {
    setSendingDutyTelegram(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>(`/duties/schedule/${schedule.id}/notify-telegram`);
      if (res.success) {
        showToast('success', 'ส่งแจ้งเตือนชุดเวรไปยัง Telegram สำเร็จ');
      } else {
        showToast('warning', res.message || 'ส่งแจ้งเตือนไม่สำเร็จ');
      }
    } catch (err: any) {
      console.error(err);
      showToast('error', err.response?.data?.error || 'เกิดข้อผิดพลาดในการส่ง Telegram');
    } finally {
      setSendingDutyTelegram(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="calendar-view" className="space-y-5">
      {/* Calendar Header & View Switcher */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Navigation & Title */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
            >
              วันนี้
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="เดือนถัดไป"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{currentTitle}</span>
          </h2>
        </div>

        {/* View buttons & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Views: Month, Week, Day, List */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {[
              { id: 'dayGridMonth', label: 'เดือน' },
              { id: 'timeGridWeek', label: 'สัปดาห์' },
              { id: 'timeGridDay', label: 'วัน' },
              { id: 'listMonth', label: 'รายการ' },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => handleChangeView(v.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentView === v.id
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {hasPermission('events.create') && (
            <button
              type="button"
              id="btn-calendar-add-event"
              onClick={() => handleCreate()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>เพิ่มกิจกรรม</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
            title="พิมพ์ปฏิทิน"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">พิมพ์</span>
          </button>
        </div>
      </div>

      {/* Filters Bar & Legend */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>กรอง:</span>
          </span>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium"
          >
            <option value="ALL">หมวดหมู่ทั้งหมด</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Department Filter */}
          {departments.length > 0 && (
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium"
            >
              <option value="ALL">กลุ่มสาระ / ทุกฝ่าย</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium"
          >
            <option value="ALL">สถานะทั้งหมด</option>
            <option value="APPROVED">อนุมัติแล้ว</option>
            <option value="PENDING">รออนุมัติ</option>
          </select>
        </div>

        {/* Visibility Toggles */}
        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showHolidays}
              onChange={(e) => setShowHolidays(e.target.checked)}
              className="rounded text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
            />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              <span>วันหยุดไทย ({holidays.length})</span>
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showDuties}
              onChange={(e) => setShowDuties(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
            />
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-sky-500" />
              <span>ชุดเวรประจำวัน ({dutySchedules.length})</span>
            </span>
          </label>
        </div>
      </div>

      {/* FullCalendar Box */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={false}
          locale="th"
          firstDay={0} // Sunday
          events={calendarEvents}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="auto"
          dayMaxEvents={4}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
            hour12: false,
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
        />
      </div>

      {/* Holiday Detail Modal */}
      {selectedHoliday && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl shrink-0">
                🚩
              </div>
              <div className="min-w-0">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-1 ${
                    selectedHoliday.type === 'HOLIDAY'
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {selectedHoliday.type === 'HOLIDAY' ? 'วันหยุดราชการ' : 'วันสำคัญของไทย'}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {selectedHoliday.name}
                </h3>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs mb-5">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>วันที่:</span>
                <span className="font-bold text-slate-900 dark:text-slate-200">
                  {formatThaiDate(selectedHoliday.date, { format: 'full' })}
                </span>
              </div>
              {selectedHoliday.description && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedHoliday.description}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedHoliday(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duty Set Detail Modal */}
      {selectedDuty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-10 overflow-hidden">
            {/* Header Banner */}
            <div
              style={{ backgroundColor: selectedDuty.group?.color || selectedDuty.schedule.groupColor || '#2563eb' }}
              className="p-4 text-white flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5" />
                <div>
                  <div className="text-xs font-medium opacity-90">ข้อมูลการปฏิบัติหน้าที่ชุดเวร</div>
                  <h3 className="text-lg font-bold">
                    {selectedDuty.group?.name || selectedDuty.schedule.groupName || 'ชุดเวรประจำวัน'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDuty(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Date banner */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-slate-500">วันที่ปฏิบัติหน้าที่:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatThaiDate(selectedDuty.schedule.date, { format: 'full' })} (
                  {formatThaiDate(selectedDuty.schedule.date, { format: 'short' })})
                </span>
              </div>

              {/* Members */}
              {(() => {
                const members =
                  selectedDuty.schedule.membersSnapshot || selectedDuty.group?.members || [];
                const leader = members.find((m) => m.roleInGroup === 'LEADER');
                const others = members.filter((m) => m.roleInGroup !== 'LEADER');

                return (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>รายชื่อคณะครู/บุคลากรในชุดเวร:</span>
                      <span className="text-slate-400 font-normal">{members.length} สมาชิก</span>
                    </div>

                    {leader && (
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                          <div>
                            <span className="font-bold text-amber-900 dark:text-amber-200">
                              {leader.name}
                            </span>
                            <span className="text-[11px] text-amber-700 dark:text-amber-400 block">
                              หัวหน้าชุด • {leader.department || leader.position || '-'}
                            </span>
                          </div>
                        </div>
                        {leader.phone && (
                          <span className="text-[11px] font-mono text-amber-800 dark:text-amber-300">
                            📞 {leader.phone}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="space-y-1">
                      {others.map((m, idx) => (
                        <div
                          key={m.id || idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs border border-slate-100 dark:border-slate-800"
                        >
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {m.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              ({m.department || 'สมาชิก'})
                            </span>
                          </div>
                          {m.phone && (
                            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                              {m.phone}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Responsibilities */}
              {(() => {
                const responsibilities =
                  selectedDuty.schedule.customResponsibilities || selectedDuty.group?.responsibilities || [];
                if (responsibilities.length === 0) return null;

                return (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      หน้าที่ความรับผิดชอบ:
                    </div>
                    <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      {responsibilities.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-blue-500 font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}

              {/* Notes */}
              {selectedDuty.schedule.notes && (
                <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
                  📝 <b>หมายเหตุ:</b> {selectedDuty.schedule.notes}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSendTelegramForDuty(selectedDuty.schedule)}
                  disabled={sendingDutyTelegram}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all"
                >
                  {sendingDutyTelegram ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>ส่งแจ้งเตือน Telegram ทันที</span>
                </button>

                {(isAdmin || hasPermission('duties.manage')) && (
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await confirm({
                        title: 'ลบตารางเวรประจำวันนี้?',
                        message: `ต้องการลบตารางเวรประจำวันที่ ${formatThaiDate(selectedDuty.schedule.date)} ใช่หรือไม่?`,
                        type: 'danger',
                        confirmText: 'ลบตารางเวร',
                      });
                      if (ok) {
                        try {
                          await api.delete(`/duties/schedule/${selectedDuty.schedule.id || selectedDuty.schedule.date}`);
                          showToast('success', 'ลบตารางเวรสำเร็จ');
                          setSelectedDuty(null);
                          fetchData();
                          if (onRefresh) onRefresh();
                        } catch (err: any) {
                          showToast('error', 'ไม่สามารถลบตารางเวรได้');
                        }
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold border border-rose-200 dark:border-rose-800"
                  >
                    ลบเวรวันนี้
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedDuty(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
