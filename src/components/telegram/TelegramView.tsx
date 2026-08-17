import React, { useState, useEffect } from 'react';
import {
  Send,
  Bot,
  Settings2,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Sparkles,
  Zap,
  History,
  Radio,
  FileText,
  Users,
  Gift,
  ShieldCheck,
  HelpCircle,
  Trash2,
  Eye,
  Info,
  CalendarCheck,
  Play,
  ListOrdered,
  BellRing,
} from 'lucide-react';
import { TelegramSettings, TelegramLog, ScheduledJobItem } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { sendTelegramDirect } from '../../utils/telegramDirect';

export const TelegramView: React.FC = () => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [settings, setSettings] = useState<TelegramSettings>({
    botToken: '',
    chatId: '',
    enabled: false,
    notifyOnCreate: true,
    notifyOnApprove: true,
    notifyOnChange: true,
    dailySummary: true,
    dailySummaryTime: '07:00',
    advanceNotificationTime: '07:00',
    dutyReminderTime: '06:30',
    advanceDutyReminder: true,
    advanceDutyReminderTime: '17:00',
    birthdayGreetingTime: '07:00',
    notifyAdvanceDays: [1],
    defaultNotifyTimes: ['1_DAY_BEFORE', 'SAME_DAY_MORNING'],
  });

  const [logs, setLogs] = useState<TelegramLog[]>([]);
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJobItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [checkingScheduled, setCheckingScheduled] = useState(false);
  const [broadcastingTodayEvents, setBroadcastingTodayEvents] = useState(false);
  const [broadcastingDaily, setBroadcastingDaily] = useState(false);
  const [broadcastingDuty, setBroadcastingDuty] = useState(false);
  const [broadcastingAdvanceDuty, setBroadcastingAdvanceDuty] = useState(false);
  const [broadcastingBirthday, setBroadcastingBirthday] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);
  const [selectedLog, setSelectedLog] = useState<TelegramLog | null>(null);

  const fetchSettingsAndLogs = async () => {
    setLoading(true);
    try {
      const [settingsRes, logsRes, jobsRes] = await Promise.all([
        api.get<{ telegram: TelegramSettings }>('/settings/telegram'),
        api.get<{ logs: TelegramLog[] }>('/settings/telegram/logs'),
        api.get<{ jobs: ScheduledJobItem[] }>('/settings/telegram/scheduled-jobs').catch(() => ({ jobs: [] })),
      ]);
      if (settingsRes.telegram) {
        setSettings({
          ...settingsRes.telegram,
          dailySummary: settingsRes.telegram.dailySummary ?? settingsRes.telegram.notifyDailySummary ?? true,
          advanceNotificationTime: settingsRes.telegram.advanceNotificationTime || '07:00',
          dutyReminderTime: settingsRes.telegram.dutyReminderTime || '06:30',
          advanceDutyReminder: settingsRes.telegram.advanceDutyReminder ?? true,
          advanceDutyReminderTime: settingsRes.telegram.advanceDutyReminderTime || '17:00',
          birthdayGreetingTime: settingsRes.telegram.birthdayGreetingTime || '07:00',
        });
      }
      setLogs(logsRes.logs || []);
      setScheduledJobs(jobsRes.jobs || []);
    } catch (e) {
      console.error('Error fetching telegram info:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndLogs();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...settings,
        notifyDailySummary: settings.dailySummary,
      };
      await api.put('/settings/telegram', payload);
      showToast('success', 'บันทึกการตั้งค่าสำเร็จ', 'อัปเดตการตั้งค่า Telegram Bot และเวลาแจ้งเตือนล่วงหน้าเรียบร้อยแล้ว');
      fetchSettingsAndLogs();
    } catch (err: any) {
      showToast('error', 'บันทึกไม่สำเร็จ', err?.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!settings.botToken && !settings.botTokenMasked) {
      showToast('warning', 'กรุณาระบุ Bot Token', 'โปรดกรอก Telegram Bot Token ก่อนทดสอบ');
      return;
    }
    if (!settings.chatId) {
      showToast('warning', 'กรุณาระบุ Chat ID', 'โปรดกรอก Group/Channel Chat ID ก่อนทดสอบ');
      return;
    }
    setTesting(true);
    try {
      const res = await api.post<{ success: boolean; message?: string; error?: string }>('/settings/telegram/test', {
        botToken: settings.botToken,
        chatId: settings.chatId,
      });

      if (res && res.success) {
        if (settings.botToken && !settings.botToken.includes('...')) {
          const testMsg = `🔔 <b>ทดสอบการเชื่อมต่อระบบแจ้งเตือน Telegram</b>\n━━━━━━━━━━━━━━━━━━━━\n✅ ทดสอบส่งข้อความสำเร็จ! ระบบสามารถเชื่อมต่อและแจ้งเตือนเข้ากลุ่มได้ตามปกติ\n📅 วันที่และเวลา: ${new Date().toLocaleString('th-TH')}\n🏫 ระบบปฏิทินกิจกรรมโรงเรียน`;
          const directRes = await sendTelegramDirect(settings.botToken, settings.chatId, testMsg);
          if (directRes.success) {
            showToast('success', 'เชื่อมต่อ Telegram สำเร็จ!', 'ส่งข้อความทดสอบไปยังกลุ่ม Telegram เรียบร้อยแล้ว');
          } else {
            showToast('error', 'เชื่อมต่อ Telegram ไม่สำเร็จ', directRes.message);
          }
        } else {
          showToast('success', 'เชื่อมต่อ Telegram สำเร็จ!', 'ส่งข้อความทดสอบไปยังกลุ่ม Telegram เรียบร้อยแล้ว');
        }
      } else {
        showToast('error', 'เชื่อมต่อไม่สำเร็จ', res?.message || res?.error || 'กรุณาตรวจสอบ Bot Token หรือ Chat ID');
      }
      fetchSettingsAndLogs();
    } catch (err: any) {
      if (settings.botToken && !settings.botToken.includes('...')) {
        const testMsg = `🔔 <b>ทดสอบการเชื่อมต่อระบบแจ้งเตือน Telegram (Direct)</b>\n━━━━━━━━━━━━━━━━━━━━\n✅ ทดสอบส่งข้อความสำเร็จ! ระบบสามารถเชื่อมต่อและแจ้งเตือนเข้ากลุ่มได้ตามปกติ\n📅 วันที่และเวลา: ${new Date().toLocaleString('th-TH')}\n🏫 ระบบปฏิทินกิจกรรมโรงเรียน`;
        const directRes = await sendTelegramDirect(settings.botToken, settings.chatId, testMsg);
        if (directRes.success) {
          showToast('success', 'เชื่อมต่อ Telegram สำเร็จ!', 'ส่งข้อความทดสอบไปยังกลุ่ม Telegram เรียบร้อยแล้ว');
          fetchSettingsAndLogs();
          return;
        }
      }
      showToast('error', 'ทดสอบล้มเหลว', err?.message || 'ไม่สามารถส่งข้อความได้');
      fetchSettingsAndLogs();
    } finally {
      setTesting(false);
    }
  };

  const handleCheckScheduledNow = async (forceAllDue = false) => {
    setCheckingScheduled(true);
    try {
      const res = await api.post<{ success: boolean; dispatchedCount: number; dispatchedItems?: string[]; message?: string }>(
        '/scheduler/check',
        { forceAllDue }
      );
      if (res && res.dispatchedCount > 0) {
        showToast(
          'success',
          `ส่งการแจ้งเตือนสำเร็จ ${res.dispatchedCount} รายการ`,
          res.dispatchedItems?.join(', ') || res.message || 'ส่งข้อความเรียบร้อย'
        );
      } else {
        showToast('info', 'ตรวจสอบกำหนดเวลาเรียบร้อย', 'ไม่มีรายการที่ถึงเวลาส่งแจ้งเตือนในขณะนี้ (หรือได้ส่งไปแล้ว)');
      }
      fetchSettingsAndLogs();
    } catch (err: any) {
      showToast('error', 'ตรวจสอบล้มเหลว', err?.message || 'ไม่สามารถสั่งรันระบบแจ้งเตือนได้');
    } finally {
      setCheckingScheduled(false);
    }
  };

  const handleBroadcastTodayEvents = async () => {
    setBroadcastingTodayEvents(true);
    try {
      const res = await api.post<{ success: boolean; message?: string; count?: number }>('/settings/telegram/broadcast-today-events');
      showToast('success', 'ส่งแจ้งเตือนกิจกรรมวันนี้สำเร็จ', res.message || 'ส่งสรุปกิจกรรมวันนี้ทั้งหมดไปยัง Telegram แล้ว');
      fetchSettingsAndLogs();
    } catch (err: any) {
      showToast('error', 'ส่งแจ้งเตือนกิจกรรมวันนี้ล้มเหลว', err?.message || 'ไม่สามารถส่งแจ้งเตือนได้');
    } finally {
      setBroadcastingTodayEvents(false);
    }
  };

  const handleBroadcastDailySummary = async () => {
    setBroadcastingDaily(true);
    try {
      const res = await api.post<{ success: boolean; message?: string }>('/settings/telegram/broadcast-daily');
      showToast('success', 'ส่งสรุปกิจกรรมประจำวันสำเร็จ', res.message || 'ส่งสรุปกิจกรรมวันนี้ไปยัง Telegram แล้ว');
      fetchSettingsAndLogs();
    } catch (err: any) {
      showToast('error', 'ส่งสรุปล้มเหลว', err?.message || 'ไม่สามารถส่งสรุปประจำวันได้');
    } finally {
      setBroadcastingDaily(false);
    }
  };

  const handleBroadcastDutyToday = async () => {
    setBroadcastingDuty(true);
    try {
      const res = await api.post<{ success: boolean; message?: string }>('/settings/telegram/broadcast-duty-today');
      showToast('success', 'ส่งแจ้งเตือนชุดเวรสำเร็จ', res.message || 'ส่งแจ้งเตือนครูเวรประจำวันไปยัง Telegram แล้ว');
      fetchSettingsAndLogs();
    } catch (err: any) {
      showToast('error', 'ส่งแจ้งเตือนเวรล้มเหลว', err?.message || 'ไม่พบข้อมูลตารางเวรสำหรับวันนี้');
    } finally {
      setBroadcastingDuty(false);
    }
  };

  const handleBroadcastDutyAdvance = async () => {
    setBroadcastingAdvanceDuty(true);
    try {
      const res = await api.post<{ success: boolean; message?: string }>('/settings/telegram/broadcast-duty-advance');
      showToast('success', 'ส่งแจ้งเตือนครูเวรวันพรุ่งนี้สำเร็จ', res.message || 'ส่งแจ้งเตือนเตรียมความพร้อมครูเวรวันพรุ่งนี้แล้ว');
      fetchSettingsAndLogs();
    } catch (err: any) {
      showToast('error', 'ส่งแจ้งเตือนล้มเหลว', err?.message || 'ไม่พบข้อมูลตารางเวรสำหรับวันพรุ่งนี้');
    } finally {
      setBroadcastingAdvanceDuty(false);
    }
  };

  const handleBroadcastBirthdaysToday = async () => {
    setBroadcastingBirthday(true);
    try {
      const res = await api.post<{ success: boolean; message?: string }>('/settings/telegram/broadcast-birthdays-today');
      showToast('success', 'ส่งคำอวยพรวันเกิดสำเร็จ', res.message || 'ส่งคำอวยพรวันเกิดบุคลากรประจำวันแล้ว');
      fetchSettingsAndLogs();
    } catch (err: any) {
      showToast('info', 'ข้อมูลวันเกิด', err?.message || 'วันนี้ไม่มีวันคล้ายวันเกิดของบุคลากร');
    } finally {
      setBroadcastingBirthday(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('คุณต้องการล้างประวัติการส่งแจ้งเตือน Telegram ทั้งหมดใช่หรือไม่?')) return;
    setClearingLogs(true);
    try {
      await api.delete('/settings/telegram/logs');
      showToast('success', 'ล้างประวัติสำเร็จ', 'ลบประวัติการแจ้งเตือนทั้งหมดเรียบร้อย');
      setLogs([]);
    } catch (err: any) {
      showToast('error', 'เกิดข้อผิดพลาด', err?.message);
    } finally {
      setClearingLogs(false);
    }
  };

  const isConfigured = Boolean(settings.botToken || settings.botTokenMasked) && Boolean(settings.chatId);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                ระบบแจ้งเตือนผ่าน Telegram Bot
              </h2>
              {settings.enabled && isConfigured ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  เปิดใช้งานจริง
                </span>
              ) : settings.enabled ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  รอกรอก Token
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                  ปิดการทำงาน
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ส่งแจ้งเตือนกิจกรรมล่วงหน้าตามวันเวลาที่กำหนด สรุปประจำวันตอนเช้า ตารางชุดครูเวร และคำอวยพรวันเกิด
            </p>
          </div>
        </div>

        {/* Quick broadcast & manual trigger toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleBroadcastTodayEvents}
            disabled={broadcastingTodayEvents || !isConfigured}
            title="ส่งแจ้งเตือนกิจกรรมทั้งหมดของวันนี้ (06:00 น.) ไปยัง Telegram ทันที"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
          >
            <Radio className={`w-3.5 h-3.5 ${broadcastingTodayEvents ? 'animate-spin' : ''}`} />
            <span>{broadcastingTodayEvents ? 'กำลังส่งแจ้งเตือน...' : '📢 แจ้งเตือนกิจกรรมวันนี้'}</span>
          </button>

          <button
            onClick={() => handleCheckScheduledNow(false)}
            disabled={checkingScheduled || !isConfigured}
            title="ตรวจหาและส่งการแจ้งเตือนที่ถึงกำหนดเวลาทันที"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-900 text-xs font-bold shadow-xs transition-all disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${checkingScheduled ? 'animate-spin' : ''}`} />
            <span>{checkingScheduled ? 'กำลังตรวจหา...' : 'รันคิวเตือนล่วงหน้า'}</span>
          </button>

          <button
            onClick={handleBroadcastDutyToday}
            disabled={broadcastingDuty || !isConfigured}
            title="ส่งรายชื่อชุดครูเวรประจำวันไปยังกลุ่มทันที"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
          >
            <Users className={`w-3.5 h-3.5 ${broadcastingDuty ? 'animate-spin' : ''}`} />
            <span>{broadcastingDuty ? 'กำลังส่ง...' : 'แจ้งเวรวันนี้'}</span>
          </button>

          <button
            onClick={handleBroadcastDutyAdvance}
            disabled={broadcastingAdvanceDuty || !isConfigured}
            title="ส่งแจ้งเตือนชุดครูเวรวันพรุ่งนี้ล่วงหน้า"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
          >
            <CalendarCheck className={`w-3.5 h-3.5 ${broadcastingAdvanceDuty ? 'animate-spin' : ''}`} />
            <span>{broadcastingAdvanceDuty ? 'กำลังส่ง...' : 'เตือนเวรวันพรุ่งนี้'}</span>
          </button>

          <button
            onClick={handleBroadcastBirthdaysToday}
            disabled={broadcastingBirthday || !isConfigured}
            title="ส่งคำอวยพรวันเกิดบุคลากรที่มีวันเกิดวันนี้"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
          >
            <Gift className={`w-3.5 h-3.5 ${broadcastingBirthday ? 'animate-spin' : ''}`} />
            <span>{broadcastingBirthday ? 'กำลังส่ง...' : 'อวยพรวันเกิด'}</span>
          </button>
        </div>
      </div>

      {/* Scheduled Jobs Overview Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ตารางคิวการแจ้งเตือนล่วงหน้าตามเวลาจริง ({scheduledJobs.length} รายการ)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ระบบจะตรวจสอบและส่งแจ้งเตือน Telegram ตามวันและเวลาที่ระบุโดยอัตโนมัติ
              </p>
            </div>
          </div>
          <button
            onClick={fetchSettingsAndLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>อัปเดตคิว</span>
          </button>
        </div>

        {scheduledJobs.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            ยังไม่มีกิจกรรมหรือชุดเวรที่เปิดตั้งค่าแจ้งเตือนล่วงหน้า
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {scheduledJobs.slice(0, 9).map((job) => (
              <div
                key={job.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {job.timingLabel}
                    </span>
                    {job.isSent ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ส่งแล้ว
                      </span>
                    ) : job.isDue ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-bold animate-pulse">
                        <Clock className="w-3.5 h-3.5" /> ถึงเวลาส่งแล้ว
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                        <Clock className="w-3.5 h-3.5" /> รอถึงเวลา
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {job.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    วันจัดกิจกรรม: {job.targetDate}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                  <span>เวลาที่จะแจ้งเตือน:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {new Date(job.triggerDateTime).toLocaleString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-blue-600" />
              <span>การตั้งค่าเชื่อมต่อบอทและการส่งข้อความตามเวลา</span>
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              {/* Bot Enabled Switch */}
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    เปิดใช้งานระบบแจ้งเตือน Telegram
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    เมื่อเปิดใช้งาน ระบบจะส่งข้อความแจ้งเตือนอัตโนมัติตามเงื่อนไขและเวลาที่เลือกด้านล่าง
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Bot Token */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telegram Bot Token <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.botToken}
                  onChange={(e) => setSettings({ ...settings, botToken: e.target.value })}
                  placeholder={settings.botTokenMasked || 'เช่น 7123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ...'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:bg-white dark:focus:bg-slate-900 transition-colors"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  ขอ Token ได้จากบอท <strong>@BotFather</strong> บน Telegram โดยพิมพ์คำสั่ง <code>/newbot</code>
                </p>
              </div>

              {/* Chat ID / Channel */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telegram Chat ID / Group ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.chatId}
                  onChange={(e) => setSettings({ ...settings, chatId: e.target.value })}
                  placeholder="เช่น -1001928374650 หรือ @school_calendar_channel"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:bg-white dark:focus:bg-slate-900 transition-colors"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  ID ของกลุ่มที่เชิญบอทเข้าไป (สำหรับกลุ่มทั่วไปมักขึ้นต้นด้วย <code>-100...</code> เช่น <code>-1001234567890</code>)
                </p>
              </div>

              {/* Timings Configuration Section */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-500" />
                    การตั้งค่าเวลาสำหรับการแจ้งเตือนแต่ละประเภท
                  </h4>

                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400 text-[11px]">เซ็ตเวลาเช้าเร็ว:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          dailySummaryTime: '06:00',
                          advanceNotificationTime: '06:00',
                          dutyReminderTime: '06:00',
                        })
                      }
                      className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold cursor-pointer transition-all"
                    >
                      06:00 น. (แนะนำ)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          dailySummaryTime: '06:30',
                          dutyReminderTime: '06:30',
                        })
                      }
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[11px] font-medium cursor-pointer transition-all"
                    >
                      06:30 น.
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          dailySummaryTime: '07:00',
                          dutyReminderTime: '07:00',
                        })
                      }
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[11px] font-medium cursor-pointer transition-all"
                    >
                      07:00 น.
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Advance event reminder time */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">เวลาเตือนกิจกรรมล่วงหน้ารายวัน</p>
                      <p className="text-[11px] text-slate-500">สำหรับตัวเลือก 7, 3, 2, 1 วัน และเช้าวันจัดงาน</p>
                    </div>
                    <input
                      type="time"
                      value={settings.advanceNotificationTime || '07:00'}
                      onChange={(e) => setSettings({ ...settings, advanceNotificationTime: e.target.value })}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold"
                    />
                  </div>

                  {/* Daily Summary Time */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">เวลาส่งสรุปประจำวันทุกเช้า</p>
                      <p className="text-[11px] text-slate-500">สรุปภาพรวมกิจกรรมทั้งหมดในแต่ละวัน</p>
                    </div>
                    <input
                      type="time"
                      value={settings.dailySummaryTime || '07:00'}
                      onChange={(e) => setSettings({ ...settings, dailySummaryTime: e.target.value })}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold"
                    />
                  </div>

                  {/* Duty Reminder Time (Same-Day) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">เวลาเตือนครูเวรประจำวัน</p>
                      <p className="text-[11px] text-slate-500">แจ้งเตือนชุดเวรในตอนเช้าของวันที่ปฏิบัติหน้าที่</p>
                    </div>
                    <input
                      type="time"
                      value={settings.dutyReminderTime || '06:30'}
                      onChange={(e) => setSettings({ ...settings, dutyReminderTime: e.target.value })}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold"
                    />
                  </div>

                  {/* Advance Duty Reminder Time (Evening before) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">เวลาเตือนครูเวรล่วงหน้า (ตอนเย็น)</p>
                      <p className="text-[11px] text-slate-500">เตือนชุดเวรของวันพรุ่งนี้ล่วงหน้าตอนเย็น</p>
                    </div>
                    <input
                      type="time"
                      value={settings.advanceDutyReminderTime || '17:00'}
                      onChange={(e) => setSettings({ ...settings, advanceDutyReminderTime: e.target.value })}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Trigger Toggles */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  เปิด/ปิด ตัวเลือกการแจ้งเตือนอัตโนมัติ
                </h4>

                <div className="space-y-2.5">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={settings.notifyOnCreate}
                      onChange={(e) => setSettings({ ...settings, notifyOnCreate: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">แจ้งเตือนเมื่อมีการส่งคำขอกิจกรรมใหม่</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">ส่งแจ้งผู้บริหารหรือหัวหน้างานเพื่อทราบและรอการอนุมัติ</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={settings.notifyOnApprove}
                      onChange={(e) => setSettings({ ...settings, notifyOnApprove: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">แจ้งเตือนเมื่อกิจกรรมได้รับการอนุมัติ</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">แจ้งประกาศลงปฏิทินกลางโรงเรียนให้คณะครูทุกคนรับทราบ</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={settings.notifyOnChange}
                      onChange={(e) => setSettings({ ...settings, notifyOnChange: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">แจ้งเตือนเมื่อมีการแก้ไขหรือเปลี่ยนแปลงรายละเอียดกิจกรรม</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">อัปเดตวันเวลา สถานที่ หรือผู้รับผิดชอบใหม่เข้ากลุ่มทันที</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={settings.dailySummary}
                      onChange={(e) => setSettings({ ...settings, dailySummary: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">ส่งสรุปกิจกรรมและตารางครูเวรประจำวันทุกเช้า</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">สรุปงานวันนี้ พรุ่งนี้ ตารางเวร และอวยพรวันเกิดบุคลากร</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={settings.advanceDutyReminder !== false}
                      onChange={(e) => setSettings({ ...settings, advanceDutyReminder: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">ส่งแจ้งเตือนครูเวรวันพรุ่งนี้ล่วงหน้าตอนเย็น</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">แจ้งรายชื่อและหน้าที่ของชุดเวรให้เตรียมตัวล่วงหน้า</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>{testing ? 'กำลังทดสอบการส่ง...' : 'ทดสอบส่งข้อความเข้ากลุ่ม'}</span>
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า Telegram'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Telegram Bot Instructions & Guide (Right 1 col) */}
        <div className="space-y-6">
          <div className="bg-blue-50/60 dark:bg-blue-950/30 rounded-3xl p-5 border border-blue-100 dark:border-blue-900/60 space-y-3">
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>วิธีตั้งค่า Telegram Bot ใน 3 ขั้นตอน</span>
            </h4>
            <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5 list-decimal list-inside leading-relaxed">
              <li>
                ค้นหา <strong>@BotFather</strong> ใน Telegram แล้วพิมพ์ <code>/newbot</code> เพื่อตั้งชื่อบอทและรับ <strong>Token</strong>
              </li>
              <li>
                สร้างกลุ่ม Telegram หรือแชแนล จากนั้นกดเชิญบอทที่สร้างไว้เข้ากลุ่ม และ<strong>ตั้งค่าบอทเป็น Admin</strong> ของกลุ่ม
              </li>
              <li>
                ดึง <strong>Chat ID</strong> ของกลุ่ม (เช่น <code>-100xxxxxxxxx</code>) มาใส่ในช่องด้านซ้าย แล้วกดปุ่ม <strong>"ทดสอบส่งข้อความ"</strong>
              </li>
            </ol>
          </div>

          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 rounded-3xl p-5 border border-emerald-100 dark:border-emerald-900/60 space-y-3">
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>การทำงานบน Vercel และ Serverless</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              ระบบรองรับการทำงานทั้งแบบ <strong>Direct Telegram API</strong> จากฝั่งเบราว์เซอร์ และ <strong>Vercel Cron Job</strong> เรียก <code>/api/scheduler/check</code> โดยไม่ต้องพึ่ง Background Process ค้างไว้ ทำให้การแจ้งเตือนตามวันและเวลาทำงานได้อย่างเสถียร 100%
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <span>วิธีดู Chat ID ของกลุ่ม</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              เชิญบอท <strong>@RawDataBot</strong> หรือ <strong>@userinfobot</strong> เข้ากลุ่มชั่วคราว บอทจะพิมพ์ข้อความสรุป JSON ออกมา ให้ดูค่าในช่อง <code>{`"chat": {"id": -100xxxxxxxxxx}`}</code> แล้วนำตัวเลขนั้นมาใส่
            </p>
          </div>
        </div>
      </div>

      {/* Telegram Notification Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-500" />
              <span>ประวัติการส่งแจ้งเตือน Telegram ({logs.length})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              แสดงสถานะการส่งข้อความย้อนหลัง พร้อมสาเหตุข้อผิดพลาดกรณีส่งไม่สำเร็จ
            </p>
          </div>

          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button
                onClick={handleClearLogs}
                disabled={clearingLogs}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ล้างประวัติ</span>
              </button>
            )}
            <button
              onClick={fetchSettingsAndLogs}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>รีเฟรช</span>
            </button>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            ยังไม่มีประวัติการส่งข้อความแจ้งเตือน (สามารถทดลองกดปุ่ม "ทดสอบส่งข้อความ" ด้านบนได้)
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">วันและเวลาที่ส่ง</th>
                  <th className="py-3 px-3">ประเภทแจ้งเตือน</th>
                  <th className="py-3 px-4">เนื้อหาข้อความ</th>
                  <th className="py-3 px-3">สถานะ</th>
                  <th className="py-3 px-3 text-right">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => {
                  const timestampStr = log.sentAt || log.timestamp || '';
                  const formattedTime = timestampStr ? new Date(timestampStr).toLocaleString('th-TH') : '-';
                  const logContent = log.content || log.message || '';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap font-medium">
                        {formattedTime}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          {log.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-mono text-[11px] max-w-sm truncate" title={logContent}>
                        {logContent.replace(/<[^>]*>?/gm, '')}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {log.status === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" /> ส่งสำเร็จ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold text-[11px] border border-rose-200 dark:border-rose-800" title={log.error || log.errorMessage}>
                            <AlertCircle className="w-3.5 h-3.5" /> {log.error ? 'ส่งล้มเหลว' : 'ผิดพลาด'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                          title="ดูรายละเอียดข้อความ"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>รายละเอียดการแจ้งเตือน</span>
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                selectedLog.status === 'SUCCESS'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}>
                {selectedLog.status === 'SUCCESS' ? 'ส่งสำเร็จ' : 'ส่งไม่สำเร็จ'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400">ประเภท:</span>{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLog.type}</span>
              </div>
              <div>
                <span className="text-slate-400">เวลาที่ส่ง:</span>{' '}
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  {selectedLog.sentAt || selectedLog.timestamp ? new Date(selectedLog.sentAt || selectedLog.timestamp || '').toLocaleString('th-TH') : '-'}
                </span>
              </div>

              {selectedLog.error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
                  <p className="font-bold mb-0.5">สาเหตุข้อผิดพลาดจาก Telegram API:</p>
                  <p className="font-mono text-[11px]">{selectedLog.error}</p>
                </div>
              )}

              <div>
                <span className="text-slate-400 block mb-1">ข้อความที่ส่ง:</span>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 font-mono text-[11px] whitespace-pre-wrap max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  {(selectedLog.content || selectedLog.message || '').replace(/<[^>]*>?/gm, '')}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
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

