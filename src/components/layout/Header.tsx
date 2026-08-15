import React, { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  Sun,
  Moon,
  Laptop,
  Bell,
  LogOut,
  User as UserIcon,
  Shield,
  CheckCircle2,
  ChevronDown,
  LogIn,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { UserRole } from '../../types';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
  onOpenLogin: () => void;
  pendingCount?: number;
  todayCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onOpenSearch,
  onOpenLogin,
  pendingCount = 0,
}) => {
  const { user, logout, quickLogin, isAdmin } = useAuth();
  const { themeMode, setThemeMode, systemSettings } = useTheme();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      };
      // Format Thai calendar (Buddhist Era)
      const thaiYear = now.getFullYear() + 543;
      const formatted = now.toLocaleDateString('th-TH', options).replace(/\d{4}/, thaiYear.toString());
      setCurrentTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left section: Hamburger & Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-all text-xs sm:text-sm w-44 sm:w-64 border border-slate-200/60 dark:border-slate-700/60"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span className="truncate">ค้นหากิจกรรม, ประกาศ, เอกสาร...</span>
          <kbd className="hidden sm:inline-block ml-auto text-[10px] bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-400 border border-slate-200 dark:border-slate-600">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Date/Time clock */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span>{currentTime}</span>
        </div>

        {/* Dark/Light/System Mode Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setThemeMode('light')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              themeMode === 'light'
                ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title="Light Mode"
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            onClick={() => setThemeMode('dark')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              themeMode === 'dark'
                ? 'bg-white dark:bg-slate-700 text-blue-400 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title="Dark Mode"
          >
            <Moon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setThemeMode('system')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              themeMode === 'system'
                ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title="System Theme"
          >
            <Laptop className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Role Switcher for Demo (Admin / Staff / Viewer) */}
        {systemSettings.enableDemoMode !== false && (
          <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium">
            <span className="text-[11px] text-slate-400 px-1.5">สลับสิทธิ์:</span>
            {(['ADMIN', 'STAFF', 'VIEWER'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => quickLogin(r)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  user?.role === r
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}

        {/* User Profile / Login Dropdown */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <p className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{user.role}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {profileDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-2 text-sm animate-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      {user.name} {user.surname}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                        {user.role}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate">{user.department}</span>
                    </div>
                  </div>

                  {/* Switch Role Quick buttons in Dropdown for mobile */}
                  <div className="md:hidden p-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] text-slate-400 mb-1 font-medium">สลับบทบาททดสอบ:</p>
                    <div className="grid grid-cols-3 gap-1">
                      {(['ADMIN', 'STAFF', 'VIEWER'] as UserRole[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => {
                            quickLogin(r);
                            setProfileDropdownOpen(false);
                          }}
                          className={`py-1 text-center rounded-lg text-[10px] font-bold ${
                            user.role === r
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-xs font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>เข้าสู่ระบบ</span>
          </button>
        )}
      </div>
    </header>
  );
};
