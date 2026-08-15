import React, { useState } from 'react';
import { X, Lock, Mail, Shield, UserCheck, Eye, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { UserRole } from '../../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, quickLogin, loading } = useAuth();
  const { systemSettings } = useTheme();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(usernameOrEmail, password);
    if (success) {
      onClose();
    }
  };

  const handleQuick = async (role: UserRole) => {
    const success = await quickLogin(role);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in zoom-in-95 duration-150 p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              เข้าสู่ระบบ
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {systemSettings.schoolName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Switcher */}
        {systemSettings.enableDemoMode !== false && (
          <div className="my-5 p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">
              🚀 คลิกเข้าสู่ระบบทดสอบทันที (Demo Quick Login):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuick('ADMIN')}
                className="px-2 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer"
              >
                👑 ADMIN
              </button>
              <button
                type="button"
                onClick={() => handleQuick('STAFF')}
                className="px-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer"
              >
                👩‍🏫 STAFF
              </button>
              <button
                type="button"
                onClick={() => handleQuick('VIEWER')}
                className="px-2 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer"
              >
                👀 VIEWER
              </button>
            </div>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              ชื่อผู้ใช้งาน หรือ อีเมล
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="admin, staff หรือ อีเมล"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              รหัสผ่าน
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
