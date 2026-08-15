import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  CheckCircle,
  TableProperties,
  PlusCircle,
  Megaphone,
  Flag,
  ClipboardCheck,
  Cake,
  BellRing,
  Paperclip,
  BarChart3,
  Users2,
  Settings,
  ScrollText,
  School,
  X,
} from 'lucide-react';
import { ActiveNavTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface SidebarProps {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  openCreateEventModal: () => void;
  pendingCount?: number;
  todayCount?: number;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openCreateEventModal,
  pendingCount = 0,
  todayCount = 0,
  mobileOpen,
  setMobileOpen,
}) => {
  const { user, isAdmin, hasPermission } = useAuth();
  const { systemSettings } = useTheme();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: todayCount > 0 ? `${todayCount}` : undefined },
    { id: 'calendar', label: 'ปฏิทินกิจกรรม', icon: CalendarDays },
    {
      id: 'approvals',
      label: 'อนุมัติกิจกรรม',
      icon: CheckCircle,
      badge: pendingCount > 0 ? `${pendingCount} รออนุมัติ` : undefined,
      hide: !isAdmin && !hasPermission('events.approve'),
    },
    {
      id: 'event-manager',
      label: 'จัดการรายงานกิจกรรม',
      icon: TableProperties,
      hide: !isAdmin && !hasPermission('events.edit'),
    },
    { id: 'announcements', label: 'ประกาศข่าวสาร', icon: Megaphone },
    { id: 'holidays', label: 'วันหยุด / วันสำคัญ', icon: Flag },
    { id: 'duties', label: 'ตารางเวรปฏิบัติหน้าที่', icon: ClipboardCheck },
    { id: 'birthdays', label: 'วันเกิดบุคลากร', icon: Cake },
    { id: 'telegram', label: 'การแจ้งเตือน Telegram', icon: BellRing },
    { id: 'documents', label: 'เอกสารแนบ', icon: Paperclip },
    { id: 'reports', label: 'รายงานและสถิติ', icon: BarChart3 },
    { id: 'users', label: 'จัดการผู้ใช้งาน', icon: Users2, hide: !hasPermission('users.view') },
    { id: 'settings', label: 'ตั้งค่าระบบ', icon: Settings, hide: !hasPermission('settings.manage') },
    { id: 'logs', label: 'Activity Log', icon: ScrollText, hide: !hasPermission('logs.view') },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 flex flex-col transition-transform duration-300 ease-in-out border-r ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } bg-slate-900 text-slate-100 border-slate-800`}
        style={{ backgroundColor: systemSettings.sidebarColor || '#0f172a' }}
      >
        {/* School Logo & Title */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {systemSettings.schoolLogoUrl ? (
              <img
                src={systemSettings.schoolLogoUrl}
                alt={systemSettings.schoolName}
                className="w-10 h-10 rounded-xl object-contain bg-white/10 p-0.5 shadow-md shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shrink-0">
                <School className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-bold tracking-tight text-white truncate">
                {systemSettings.schoolName}
              </h1>
              <p className="text-xs text-white/60 font-medium truncate">
                ปีการศึกษา {systemSettings.academicYear} (เทอม {systemSettings.semester})
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Add Event Button */}
        {hasPermission('events.create') && (
          <div className="p-4 shrink-0">
            <button
              onClick={() => {
                openCreateEventModal();
                setMobileOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white font-medium text-sm transition-all shadow-md active:scale-[0.98]"
              style={{
                backgroundColor: systemSettings.primaryColor || '#2563eb',
              }}
            >
              <PlusCircle className="w-4 h-4" />
              <span>เพิ่มกิจกรรมใหม่</span>
            </button>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {menuItems
            .filter((item) => !item.hide)
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as ActiveNavTab);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/15 text-white shadow-inner font-semibold'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-white/60'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        item.badge.includes('รออนุมัติ')
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </nav>

        {/* Bottom User Info & Role Tag */}
        <div className="p-4 border-t border-white/10 shrink-0 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-sm shrink-0">
              {user ? user.name.charAt(0) : 'G'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {user ? `${user.name} ${user.surname}` : 'ผู้เยี่ยมชม (Guest)'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                    user?.role === 'ADMIN'
                      ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                      : user?.role === 'STAFF'
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                      : 'bg-blue-500/30 text-blue-300 border border-blue-500/40'
                  }`}
                >
                  {user?.role || 'VIEWER'}
                </span>
                <span className="text-[11px] text-white/50 truncate">{user?.department || 'สาธารณะ'}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
