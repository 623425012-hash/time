import React, { useState, useRef, useEffect } from 'react';
import {
  Palette,
  School,
  Database,
  Save,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Download,
  Upload,
  Image as ImageIcon,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Globe,
  Tag,
  Plus,
  Edit2,
  BookOpen,
  Calendar,
  Users,
  Briefcase,
  Award,
  GraduationCap,
  Trophy,
  HeartHandshake,
  Music,
  Laptop,
  Heart,
  Flag,
  Compass,
  AlertCircle,
  X,
} from 'lucide-react';
import { SystemSettings, EventCategory } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';

export const SettingView: React.FC = () => {
  const { systemSettings, updateSystemSettings, applyPreset } = useTheme();
  const { isAdmin } = useAuth();
  const { showToast, confirm } = useToast();

  const [activeTab, setActiveTab] = useState<'general' | 'categories' | 'theme' | 'maintenance'>('general');
  const [formData, setFormData] = useState<SystemSettings>(systemSettings);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Categories State
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EventCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#2563eb');
  const [catTextColor, setCatTextColor] = useState('#ffffff');
  const [catIcon, setCatIcon] = useState('Calendar');
  const [savingCategory, setSavingCategory] = useState(false);

  useEffect(() => {
    setFormData(systemSettings);
  }, [systemSettings]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await api.get<{ categories: EventCategory[] }>('/events/categories/list');
      setCategories(res.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const themePresets = [
    { id: 'blue', name: 'Blue Classic (น้ำเงินคลาสสิก)', primary: '#2563eb', secondary: '#0d9488', sidebar: '#0f172a' },
    { id: 'green', name: 'Green Nature (เขียวธรรมชาติ)', primary: '#16a34a', secondary: '#0891b2', sidebar: '#064e3b' },
    { id: 'purple', name: 'Royal Purple (ม่วงเอกลักษณ์)', primary: '#7c3aed', secondary: '#db2777', sidebar: '#2e1065' },
    { id: 'orange', name: 'Vibrant Orange (ส้มสดใส)', primary: '#ea580c', secondary: '#d97706', sidebar: '#431407' },
    { id: 'indigo', name: 'Deep Indigo (ครามพรีเมียม)', primary: '#4f46e5', secondary: '#06b6d4', sidebar: '#1e1b4b' },
    { id: 'rose', name: 'Ruby Rose (ชมพูทับทิม)', primary: '#e11d48', secondary: '#8b5cf6', sidebar: '#4c0519' },
    { id: 'clean', name: 'Clean Minimal (ขาว-เทาเรียบหรู)', primary: '#334155', secondary: '#475569', sidebar: '#1e293b' },
  ];

  const categoryColorPresets = [
    '#2563eb', // Blue
    '#059669', // Emerald
    '#d97706', // Amber
    '#7c3aed', // Purple
    '#e11d48', // Rose
    '#0284c7', // Sky
    '#4f46e5', // Indigo
    '#0891b2', // Cyan
    '#16a34a', // Green
    '#ea580c', // Orange
    '#db2777', // Pink
    '#475569', // Slate
    '#9333ea', // Violet
    '#ca8a04', // Yellow
    '#0d9488', // Teal
    '#b91c1c', // Red
  ];

  const categoryIconOptions = [
    { id: 'Calendar', label: 'ปฏิทิน / ทั่วไป', icon: Calendar },
    { id: 'BookOpen', label: 'วิชาการ / การสอบ', icon: BookOpen },
    { id: 'Sparkles', label: 'กิจกรรม / ประเพณี', icon: Sparkles },
    { id: 'Users', label: 'การประชุม / อบรม', icon: Users },
    { id: 'Briefcase', label: 'บริหาร / นโยบาย', icon: Briefcase },
    { id: 'Award', label: 'รางวัล / เกียรติบัตร', icon: Award },
    { id: 'GraduationCap', label: 'การศึกษา / จบการศึกษา', icon: GraduationCap },
    { id: 'Trophy', label: 'กีฬา / การแข่งขัน', icon: Trophy },
    { id: 'HeartHandshake', label: 'แนะแนว / จริยธรรม', icon: HeartHandshake },
    { id: 'Music', label: 'ดนตรี / ศิลปวัฒนธรรม', icon: Music },
    { id: 'Laptop', label: 'เทคโนโลยี / สารสนเทศ', icon: Laptop },
    { id: 'Heart', label: 'สาธารณสุข / พยาบาล', icon: Heart },
    { id: 'Flag', label: 'กิจกรรมเสาธง / วันสำคัญ', icon: Flag },
    { id: 'Compass', label: 'ลูกเสือ / กิจกรรมพัฒนา', icon: Compass },
    { id: 'ShieldCheck', label: 'เวรยาม / ความปลอดภัย', icon: ShieldCheck },
    { id: 'AlertCircle', label: 'เร่งด่วน / ฉุกเฉิน', icon: AlertCircle },
  ];

  const handleApplyPreset = (preset: typeof themePresets[0]) => {
    setFormData((prev) => ({
      ...prev,
      presetTheme: preset.id as any,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      sidebarColor: preset.sidebar,
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'ไฟล์ไม่ถูกต้อง', 'กรุณาเลือกไฟล์รูปภาพ (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('error', 'ไฟล์มีขนาดใหญ่เกินไป', 'กรุณาเลือกรูปภาพขนาดไม่เกิน 10 MB');
      return;
    }

    setUploadingLogo(true);

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawDataUrl = event.target?.result as string;
        if (!rawDataUrl) {
          setUploadingLogo(false);
          return;
        }

        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const maxDim = 400;
            let width = img.width;
            let height = img.height;

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
              const optimizedUrl = canvas.toDataURL('image/png');
              setFormData((prev) => ({ ...prev, schoolLogoUrl: optimizedUrl }));
              showToast('success', 'แนบรูปภาพโลโก้สำเร็จ', 'กรุณากดปุ่ม "บันทึกการตั้งค่า" ด้านล่างเพื่อยืนยัน');
            } else {
              setFormData((prev) => ({ ...prev, schoolLogoUrl: rawDataUrl }));
              showToast('success', 'แนบรูปภาพโลโก้สำเร็จ', 'กรุณากดปุ่ม "บันทึกการตั้งค่า" ด้านล่างเพื่อยืนยัน');
            }
          } catch {
            setFormData((prev) => ({ ...prev, schoolLogoUrl: rawDataUrl }));
            showToast('success', 'แนบรูปภาพโลโก้สำเร็จ', 'กรุณากดปุ่ม "บันทึกการตั้งค่า" ด้านล่างเพื่อยืนยัน');
          } finally {
            setUploadingLogo(false);
            if (logoInputRef.current) logoInputRef.current.value = '';
          }
        };
        img.onerror = () => {
          showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถประมวลผลรูปภาพได้');
          setUploadingLogo(false);
        };
        img.src = rawDataUrl;
      };
      reader.onerror = () => {
        showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถอ่านไฟล์รูปภาพได้');
        setUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      showToast('error', 'เกิดข้อผิดพลาด', err?.message || 'ไม่สามารถอัปโหลดรูปภาพได้');
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    confirm({
      title: 'ต้องการลบรูปภาพโลโก้โรงเรียน?',
      message: 'โลโก้จะถูกนำออกจากส่วนหัวและเอกสารทั้งหมดของโรงเรียน',
      type: 'warning',
      onConfirm: () => {
        setFormData((prev) => ({ ...prev, schoolLogoUrl: '' }));
        showToast('info', 'ลบรูปภาพโลโก้แล้ว', 'กรุณากดปุ่มบันทึกเพื่อยืนยัน');
      },
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSystemSettings(formData);
      showToast('success', 'บันทึกการตั้งค่าสำเร็จ', 'อัปเดตข้อมูลระบบ โลโก้ และชุดสีธีมเรียบร้อยแล้ว');
    } catch (err: any) {
      showToast('error', 'บันทึกไม่สำเร็จ', err?.message);
    } finally {
      setSaving(false);
    }
  };

  // Category Actions
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatColor('#2563eb');
    setCatTextColor('#ffffff');
    setCatIcon('Calendar');
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: EventCategory) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatColor(cat.color);
    setCatTextColor(cat.textColor || '#ffffff');
    setCatIcon(cat.icon || 'Calendar');
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      showToast('error', 'ข้อมูลไม่ครบถ้วน', 'กรุณาระบุชื่อหมวดหมู่กิจกรรม');
      return;
    }

    setSavingCategory(true);
    try {
      if (editingCategory) {
        // Edit existing
        const res = await api.put<{ category: EventCategory }>(`/events/categories/${editingCategory.id}`, {
          name: catName.trim(),
          color: catColor,
          textColor: catTextColor,
          icon: catIcon,
        });
        showToast('success', 'แก้ไขหมวดหมู่สำเร็จ', `อัปเดต "${catName}" เรียบร้อยแล้ว`);
      } else {
        // Add new
        const res = await api.post<{ category: EventCategory }>('/events/categories', {
          name: catName.trim(),
          color: catColor,
          textColor: catTextColor,
          icon: catIcon,
        });
        showToast('success', 'เพิ่มหมวดหมู่สำเร็จ', `สร้างหมวดหมู่ "${catName}" เรียบร้อยแล้ว`);
      }
      setCategoryModalOpen(false);
      await fetchCategories();
    } catch (err: any) {
      showToast('error', 'ไม่สามารถบันทึกหมวดหมู่ได้', err?.message);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = (cat: EventCategory) => {
    confirm({
      title: `ยืนยันการลบหมวดหมู่ "${cat.name}"?`,
      message: 'การลบหมวดหมู่นี้จะไม่ลบกิจกรรมที่สร้างไปแล้ว แต่กิจกรรมเดิมอาจไม่แสดงสีของหมวดหมู่นี้',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/events/categories/${cat.id}`);
          showToast('success', 'ลบหมวดหมู่เรียบร้อย', `ลบหมวดหมู่ "${cat.name}" ออกจากระบบแล้ว`);
          await fetchCategories();
        } catch (err: any) {
          showToast('error', 'ไม่สามารถลบหมวดหมู่ได้', err?.message);
        }
      },
    });
  };

  const handleExportBackup = () => {
    window.open('/api/settings/backup', '_blank');
    showToast('success', 'สำรองข้อมูลสำเร็จ', 'กำลังดาวน์โหลดไฟล์สำรองฐานข้อมูล JSON');
  };

  const handleResetData = () => {
    confirm({
      title: 'รีเซ็ตข้อมูลระบบเป็นค่าเริ่มต้น?',
      message: 'คำเตือน: การกระทำนี้จะล้างข้อมูลกิจกรรมและประกาศทั้งหมดกลับเป็นค่าเริ่มต้นตัวอย่างของโรงเรียน',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.post('/settings/reset-default');
          showToast('success', 'รีเซ็ตข้อมูลสำเร็จ', 'คืนค่าข้อมูลโรงเรียนตัวอย่างเรียบร้อยแล้ว');
          setTimeout(() => {
            window.location.reload();
          }, 800);
        } catch (e: any) {
          showToast('error', 'รีเซ็ตไม่สำเร็จ', e?.message);
        }
      },
    });
  };

  const renderIconComponent = (iconName?: string) => {
    const found = categoryIconOptions.find((i) => i.id === iconName);
    const IconComp = found ? found.icon : Calendar;
    return <IconComp className="w-4 h-4" />;
  };

  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
        <School className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          จำกัดสิทธิ์เฉพาะผู้ดูแลระบบ (Admin)
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          คุณไม่มีสิทธิ์เข้าถึงการตั้งค่าระบบโรงเรียน
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
            <School className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              การตั้งค่าระบบโรงเรียน
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              จัดการโลโก้ ข้อมูลสถานศึกษา หมวดหมู่กิจกรรม ธีมสีระบบ และการดูแลรักษา
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'general'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <School className="w-3.5 h-3.5" />
            <span>ข้อมูล & โลโก้</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'categories'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>หมวดหมู่กิจกรรม ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'theme'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>ชุดสี & ธีม</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('maintenance')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'maintenance'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>นโยบาย & ฐานข้อมูล</span>
          </button>
        </div>
      </div>

      {/* TAB 1: General Info & Logo */}
      {activeTab === 'general' && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* School Logo Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                <span>การจัดการโลโก้โรงเรียน (School Logo)</span>
              </h3>
              <span className="text-xs text-slate-500">รองรับ PNG, JPG, JPEG, SVG, WebP (สูงสุด 5MB)</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              {/* Logo Preview Cards */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-400 mb-1">พื้นหลังสว่าง</span>
                  <div className="w-24 h-24 rounded-2xl bg-white border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-xs">
                    {formData.schoolLogoUrl ? (
                      <img
                        src={formData.schoolLogoUrl}
                        alt="School Logo Light"
                        className="w-full h-full object-contain p-1.5"
                      />
                    ) : (
                      <School className="w-10 h-10 text-slate-300" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-400 mb-1">พื้นหลังมืด (Sidebar)</span>
                  <div className="w-24 h-24 rounded-2xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center overflow-hidden shadow-xs">
                    {formData.schoolLogoUrl ? (
                      <img
                        src={formData.schoolLogoUrl}
                        alt="School Logo Dark"
                        className="w-full h-full object-contain p-1.5"
                      />
                    ) : (
                      <School className="w-10 h-10 text-slate-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Upload & Actions */}
              <div className="flex-1 space-y-4 w-full">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {formData.schoolLogoUrl ? 'โลโก้ปัจจุบันถูกบันทึกในระบบเรียบร้อยแล้ว' : 'ยังไม่มีการตั้งค่าโลโก้โรงเรียน'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    โลโก้จะแสดงในแถบเมนูหลัก แถบหัวกระดาษ รายงาน PDF และการแจ้งเตือนต่างๆ ของโรงเรียน
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{uploadingLogo ? 'กำลังอ่านรูปภาพ...' : formData.schoolLogoUrl ? 'เปลี่ยนรูปภาพโลโก้ใหม่' : 'แนบรูปภาพโลโก้'}</span>
                  </button>

                  {formData.schoolLogoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>ลบโลโก้</span>
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    หรือระบุลิงก์ URL ของรูปภาพโลโก้โดยตรง:
                  </label>
                  <input
                    type="url"
                    value={formData.schoolLogoUrl || ''}
                    onChange={(e) => setFormData({ ...formData, schoolLogoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* School Information */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <School className="w-5 h-5 text-blue-600" />
              <span>ข้อมูลสถานศึกษาและปีการศึกษา</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อโรงเรียน / สถานศึกษา (เต็ม) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  placeholder="เช่น โรงเรียนสวนกุหลาบวิทยาลัย"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อย่อโรงเรียน
                </label>
                <input
                  type="text"
                  value={formData.schoolShortName || ''}
                  onChange={(e) => setFormData({ ...formData, schoolShortName: e.target.value })}
                  placeholder="เช่น ส.ก."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  สโลแกน / ปรัชญาโรงเรียน
                </label>
                <input
                  type="text"
                  value={formData.schoolMotto || ''}
                  onChange={(e) => setFormData({ ...formData, schoolMotto: e.target.value })}
                  placeholder="เช่น ปัญญาย่อมประเสริฐกว่าทรัพย์..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ปีการศึกษา (พ.ศ.)
                  </label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ภาคเรียน
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                  >
                    <option value="1">ภาคเรียนที่ 1</option>
                    <option value="2">ภาคเรียนที่ 2</option>
                    <option value="ภาคฤดูร้อน">ภาคฤดูร้อน</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั่วไป'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Event Categories Management */}
      {activeTab === 'categories' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-blue-600" />
                  <span>ตัวเลือกหมวดหมู่กิจกรรมโรงเรียน (Event Categories)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  เพิ่ม ลบ หรือแก้ไขตัวเลือกประเภทของกิจกรรม สีสัญลักษณ์ และไอคอน เพื่อใช้แยกประเภทกิจกรรมในปฏิทิน
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddCategory}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มหมวดหมู่กิจกรรมใหม่</span>
              </button>
            </div>

            {/* Category Cards Grid */}
            {loadingCategories ? (
              <div className="py-12 text-center text-slate-400">กำลังโหลดหมวดหมู่กิจกรรม...</div>
            ) : categories.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <Tag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">ยังไม่มีหมวดหมู่กิจกรรม</p>
                <p className="text-xs text-slate-400 mt-0.5">กดปุ่มเพิ่มหมวดหมู่กิจกรรมใหม่เพื่อเริ่มต้น</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-blue-400 transition-all flex flex-col justify-between gap-3 group shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                          style={{ backgroundColor: cat.color, color: cat.textColor || '#ffffff' }}
                        >
                          {renderIconComponent(cat.icon)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {cat.name}
                          </h4>
                          <span className="text-[11px] font-mono text-slate-400">
                            {cat.color}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Preview Badge */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold shadow-xs"
                        style={{ backgroundColor: cat.color, color: cat.textColor || '#ffffff' }}
                      >
                        {renderIconComponent(cat.icon)}
                        <span>{cat.name}</span>
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditCategory(cat)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                          title="แก้ไขหมวดหมู่"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                          title="ลบหมวดหมู่"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Theme & Colors */}
      {activeTab === 'theme' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-600" />
              <span>ชุดสีและธีมของระบบ (Dynamic Theming)</span>
            </h3>

            <div>
              <p className="text-xs font-semibold text-slate-500 mb-3">เลือกโทนสีสำเร็จรูป (Preset):</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {themePresets.map((preset) => (
                  <button
                    type="button"
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                      formData.primaryColor === preset.primary
                        ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl shrink-0 shadow-xs flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: preset.primary }}
                    >
                      ★
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {preset.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">{preset.primary}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  สีหลัก (Primary Color)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.primaryColor || '#2563eb'}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-12 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor || '#2563eb'}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  สีรอง (Secondary Color)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.secondaryColor || '#0d9488'}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="w-12 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.secondaryColor || '#0d9488'}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  สีพื้นหลังเมนูด้านข้าง (Sidebar)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.sidebarColor || '#0f172a'}
                    onChange={(e) => setFormData({ ...formData, sidebarColor: e.target.value })}
                    className="w-12 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.sidebarColor || '#0f172a'}
                    onChange={(e) => setFormData({ ...formData, sidebarColor: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'กำลังบันทึก...' : 'บันทึกชุดสีธีม'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: Maintenance & Policies */}
      {activeTab === 'maintenance' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>นโยบายความปลอดภัยและโหมดการทำงาน</span>
            </h3>

            <div className="space-y-3">
              {/* Demo Mode Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                    <span>โหมดสาธิตและการทดสอบ (Demo Mode)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-300 font-bold">
                      {formData.enableDemoMode !== false ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    เมื่อเปิดโหมดสาธิต จะแสดงปุ่ม Demo Quick Login และปุ่มสลับบทบาท เพื่อความสะดวกในการทดสอบระบบ หากนำไปใช้งานจริงของโรงเรียนสามารถปิดโหมดนี้ได้
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, enableDemoMode: formData.enableDemoMode === false })}
                  className={`p-1.5 rounded-2xl transition-colors ${
                    formData.enableDemoMode !== false ? 'text-amber-600' : 'text-slate-400'
                  }`}
                >
                  {formData.enableDemoMode !== false ? (
                    <ToggleRight className="w-10 h-10" />
                  ) : (
                    <ToggleLeft className="w-10 h-10" />
                  )}
                </button>
              </div>

              {/* Approval Required Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    ต้องผ่านการอนุมัติก่อนเผยแพร่กิจกรรม (Approval Required)
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    เมื่อเปิดใช้งาน กิจกรรมที่ครู/บุคลากรสร้างจะต้องรอผู้ดูแลระบบอนุมัติก่อนขึ้นปฏิทินสาธารณะ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      defaultEventApprovalRequired: !formData.defaultEventApprovalRequired,
                    })
                  }
                  className={`p-1.5 rounded-2xl transition-colors ${
                    formData.defaultEventApprovalRequired ? 'text-blue-600' : 'text-slate-400'
                  }`}
                >
                  {formData.defaultEventApprovalRequired ? (
                    <ToggleRight className="w-10 h-10" />
                  ) : (
                    <ToggleLeft className="w-10 h-10" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-8 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'กำลังบันทึก...' : 'บันทึกนโยบาย'}</span>
              </button>
            </div>
          </div>

          {/* Database Backup & Maintenance Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <span>การสำรองข้อมูลและการดูแลระบบ (Backup & Maintenance)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  สำรองข้อมูลฐานข้อมูล (JSON Export)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  ดาวน์โหลดไฟล์สำรองข้อมูลกิจกรรม หมวดหมู่ ประกาศ ตารางเวร และผู้ใช้ทั้งหมดเก็บไว้
                </p>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลด Backup</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/60 space-y-2">
                <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>รีเซ็ตข้อมูลเป็นค่าเริ่มต้น (Reset Data)</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  ล้างข้อมูลและคืนค่าชุดข้อมูลตัวอย่างของโรงเรียน
                </p>
                <button
                  type="button"
                  onClick={handleResetData}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>รีเซ็ตข้อมูลทั้งหมด</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Category Modal (Add / Edit) */}
      {categoryModalOpen && (
        <div
          id="category-modal-overlay"
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setCategoryModalOpen(false)}
        >
          <div
            id="category-modal-container"
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Tag className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold">
                  {editingCategory ? 'แก้ไขหมวดหมู่กิจกรรม' : 'เพิ่มหมวดหมู่กิจกรรมใหม่'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCategory} className="p-6 space-y-5">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ชื่อหมวดหมู่กิจกรรม *
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="เช่น กิจกรรมชมรม, แนะแนวการศึกษา, กีฬาสี..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                />
              </div>

              {/* Color Palette Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    สีประจำหมวดหมู่
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={catColor}
                      onChange={(e) => setCatColor(e.target.value)}
                      className="w-6 h-6 rounded-md cursor-pointer border border-slate-200 dark:border-slate-700 p-0"
                    />
                    <span className="text-[11px] font-mono text-slate-500">{catColor}</span>
                  </div>
                </div>

                <div className="grid grid-cols-8 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {categoryColorPresets.map((clr) => (
                    <button
                      type="button"
                      key={clr}
                      onClick={() => setCatColor(clr)}
                      className={`w-8 h-8 rounded-xl transition-transform flex items-center justify-center ${
                        catColor.toLowerCase() === clr.toLowerCase()
                          ? 'ring-2 ring-blue-500 ring-offset-2 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: clr }}
                    >
                      {catColor.toLowerCase() === clr.toLowerCase() && (
                        <CheckCircle2 className="w-4 h-4 text-white drop-shadow-sm" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ไอคอนสัญลักษณ์
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {categoryIconOptions.map((opt) => {
                    const IconComp = opt.icon;
                    const isSelected = catIcon === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setCatIcon(opt.id)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl text-center transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <IconComp className="w-5 h-5 shrink-0" />
                        <span className="text-[10px] font-medium truncate w-full">{opt.label.split('/')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview */}
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">ตัวอย่างป้ายกิจกรรม:</span>
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all"
                  style={{ backgroundColor: catColor, color: catTextColor }}
                >
                  {renderIconComponent(catIcon)}
                  <span>{catName || 'ตัวอย่างชื่อหมวดหมู่'}</span>
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingCategory ? 'กำลังบันทึก...' : 'บันทึกหมวดหมู่'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
