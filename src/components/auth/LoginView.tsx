import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Shield,
  UserCheck,
  Eye,
  EyeOff,
  LogIn,
  Sparkles,
  ArrowRight,
  GraduationCap,
  CheckCircle2,
  HelpCircle,
  KeyRound,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { UserRole } from '../../types';

interface LoginViewProps {
  onSuccess?: () => void;
  onContinueAsViewer?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onSuccess,
  onContinueAsViewer,
}) => {
  const { login, quickLogin, loading, isViewer, user } = useAuth();
  const { systemSettings } = useTheme();
  const { showToast } = useToast();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'quick'>('form');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) {
      showToast('warning', 'ข้อมูลไม่ครบถ้วน', 'กรุณากรอกชื่อผู้ใช้งาน/อีเมล และรหัสผ่าน');
      return;
    }

    const success = await login(usernameOrEmail, password);
    if (success) {
      onSuccess?.();
    }
  };

  const handleQuick = async (role: UserRole) => {
    const success = await quickLogin(role);
    if (success) {
      onSuccess?.();
    }
  };

  const fillCredential = (u: string, p: string) => {
    setUsernameOrEmail(u);
    setPassword(p);
    setActiveTab('form');
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 px-4 space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white p-6 sm:p-10 shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-blue-100 border border-white/20">
              <GraduationCap className="w-4 h-4" />
              <span>{systemSettings.schoolName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              เข้าสู่ระบบเพื่อจัดการข้อมูล
            </h1>
            <p className="text-sm text-blue-100 max-w-xl leading-relaxed">
              สำหรับคณะครู บุคลากร และผู้ดูแลระบบ เข้าใช้งานเพื่อเสนอโครงการ อนุมัติกิจกรรม และตั้งค่าการแจ้งเตือน
            </p>
          </div>

          {onContinueAsViewer && (
            <button
              onClick={onContinueAsViewer}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-md border border-white/20 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับสู่หน้าหลัก (Viewer)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Login Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Quick Mode (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            {/* Tabs */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'form'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>เข้าสู่ระบบด้วยรหัสผ่าน</span>
              </button>

              {systemSettings.enableDemoMode !== false && (
                <button
                  type="button"
                  onClick={() => setActiveTab('quick')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'quick'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>ทดสอบสิทธิ์ด่วน (Demo)</span>
                </button>
              )}
            </div>

            {/* Tab 1: Password Form */}
            {activeTab === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    ชื่อผู้ใช้งาน (Username) หรือ อีเมล
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={usernameOrEmail}
                      onChange={(e) => setUsernameOrEmail(e.target.value)}
                      placeholder="เช่น admin, somchai หรือ อีเมล"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    รหัสผ่าน (Password)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'กำลังตรวจสอบข้อมูล...' : 'เข้าสู่ระบบ'}</span>
                </button>
              </form>
            )}

            {/* Tab 2: Quick Demo Switcher */}
            {activeTab === 'quick' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  คลิกที่บทบาทด้านล่างเพื่อเข้าสู่ระบบทดสอบได้ทันทีโดยไม่ต้องพิมพ์รหัสผ่าน:
                </p>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => handleQuick('ADMIN')}
                    className="w-full p-4 rounded-2xl bg-rose-50/70 hover:bg-rose-100/80 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                        👑
                      </div>
                      <div>
                        <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                          ผู้ดูแลระบบ (Admin)
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          สิทธิ์เต็ม: อนุมัติกิจกรรม, ตั้งค่าระบบ, จัดการผู้ใช้, จัดการ Telegram
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-rose-500 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuick('STAFF')}
                    className="w-full p-4 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/80 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                        👩‍🏫
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                          ครูและบุคลากร (Staff)
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          เสนอกิจกรรมใหม่, บันทึกเช็คชื่อเวร, อัปโหลดเอกสาร, ดูรายงาน
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuick('VIEWER')}
                    className="w-full p-4 rounded-2xl bg-blue-50/70 hover:bg-blue-100/80 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                        👀
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                          ผู้เยี่ยมชม (Viewer)
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          ดูปฏิทิน, ตารางเวร, และประกาศข่าวสาร (ค่าเริ่มต้น)
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pre-seeded Demo Accounts & Info (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Demo Accounts List */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/60 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wider">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>บัญชีทดสอบในระบบ (Demo Accounts)</span>
            </h3>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              คลิกที่บัญชีด้านล่างเพื่อเติมข้อมูลเข้าฟอร์มอัตโนมัติ:
            </p>

            <div className="space-y-2">
              <div
                onClick={() => fillCredential('admin', 'admin123')}
                className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">admin</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                      ADMIN
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">รหัสผ่าน: admin123</p>
                </div>
                <span className="text-[11px] font-semibold text-blue-600 group-hover:underline">
                  ใช้บัญชีนี้
                </span>
              </div>

              <div
                onClick={() => fillCredential('somchai', 'staff123')}
                className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">somchai</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      STAFF
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">รหัสผ่าน: staff123</p>
                </div>
                <span className="text-[11px] font-semibold text-blue-600 group-hover:underline">
                  ใช้บัญชีนี้
                </span>
              </div>

              <div
                onClick={() => fillCredential('viewer', 'viewer123')}
                className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">viewer</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      VIEWER
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">รหัสผ่าน: viewer123</p>
                </div>
                <span className="text-[11px] font-semibold text-blue-600 group-hover:underline">
                  ใช้บัญชีนี้
                </span>
              </div>
            </div>
          </div>

          {/* Viewer Mode Notice */}
          <div className="bg-blue-50/70 dark:bg-blue-950/40 rounded-3xl p-5 border border-blue-100 dark:border-blue-900/60 space-y-2">
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>เข้าดูข้อมูลทั่วไปได้โดยไม่ต้องล็อกอิน</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              หากต้องการดูเฉพาะปฏิทิน ตารางเวร และข่าวสาร สามารถใช้งานแบบ <strong>Viewer</strong> ได้ทันที
            </p>
            {onContinueAsViewer && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onContinueAsViewer}
                  className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-blue-50 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-800 transition-all text-center cursor-pointer"
                >
                  เข้าสู่หน้า Dashboard ในฐานะ Viewer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
