import React, { useState, useEffect } from 'react';
import {
  Cake,
  Gift,
  Send,
  Sparkles,
  Calendar,
  User,
  Heart,
  PlusCircle,
  Trash2,
  Edit,
  X,
  Search,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StaffBirthday } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const BirthdayView: React.FC = () => {
  const { user, isAdmin, hasPermission } = useAuth();
  const { showToast, confirm } = useToast();

  const [birthdays, setBirthdays] = useState<StaffBirthday[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState<StaffBirthday | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [position, setPosition] = useState('ครูผู้สอน');
  const [department, setDepartment] = useState('ฝ่ายวิชาการ');
  const [birthDate, setBirthDate] = useState('1990-01-01');
  const [customWish, setCustomWish] = useState('');
  const [saving, setSaving] = useState(false);
  const [sendingWishId, setSendingWishId] = useState<string | null>(null);

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const fetchBirthdays = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ birthdays: StaffBirthday[] }>('/birthdays');
      setBirthdays(res.birthdays || []);
    } catch (e) {
      console.error('Error fetching birthdays:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const handleOpenCreate = () => {
    setEditingBirthday(null);
    setName('');
    setPosition('ครูผู้สอน');
    setDepartment('กลุ่มสาระการเรียนรู้ภาษาไทย');
    setBirthDate('1990-01-01');
    setCustomWish('สุขสันต์วันเกิด ขอให้มีสุขภาพแข็งแรง มีความสุขและประสบความสำเร็จในทุกๆ ด้าน!');
    setModalOpen(true);
  };

  const handleOpenEdit = (b: StaffBirthday) => {
    setEditingBirthday(b);
    setName(b.name);
    setPosition(b.position);
    setDepartment(b.department);
    setBirthDate(b.birthDate);
    setCustomWish(b.customWish || '');
    setModalOpen(true);
  };

  const handleDelete = (b: StaffBirthday) => {
    confirm({
      title: 'ยืนยันการลบข้อมูลวันเกิด?',
      message: `คุณต้องการลบข้อมูลวันเกิดของ "${b.name}" หรือไม่?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/birthdays/${b.id}`);
          showToast('success', 'ลบสำเร็จ');
          fetchBirthdays();
        } catch (e: any) {
          showToast('error', 'ลบไม่สำเร็จ', e?.message);
        }
      },
    });
  };

  const handleSendTelegramWish = async (b: StaffBirthday) => {
    // Launch celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    setSendingWishId(b.id);
    try {
      await api.post(`/birthdays/${b.id}/wish`);
      showToast('success', 'ส่งคำอวยพรสำเร็จ', `ส่งข้อความสุขสันต์วันเกิดไปยัง Telegram เรียบร้อยแล้ว!`);
    } catch (err: any) {
      showToast('error', 'ส่งคำอวยพรไม่สำเร็จ', err?.message || 'ตรวจสอบการเชื่อมต่อ Telegram Bot');
    } finally {
      setSendingWishId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !birthDate) {
      showToast('warning', 'กรอกข้อมูลไม่ครบ', 'กรุณาระบุชื่อและวันเกิด');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        position,
        department,
        birthDate,
        customWish,
      };

      if (editingBirthday) {
        await api.put(`/birthdays/${editingBirthday.id}`, payload);
        showToast('success', 'แก้ไขข้อมูลสำเร็จ');
      } else {
        await api.post('/birthdays', payload);
        showToast('success', 'เพิ่มข้อมูลวันเกิดสำเร็จ');
      }
      setModalOpen(false);
      fetchBirthdays();
    } catch (err: any) {
      showToast('error', 'บันทึกไม่สำเร็จ', err?.message);
    } finally {
      setSaving(false);
    }
  };

  // Filter birthdays by month & search
  const filteredBirthdays = birthdays.filter((b) => {
    if (search.trim()) {
      return (
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.department.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (selectedMonth !== 0) {
      const bMonth = parseInt(b.birthDate.split('-')[1], 10);
      return bMonth === selectedMonth;
    }
    return true;
  });

  // Calculate age / upcoming info
  const formatBirthInfo = (dateStr: string) => {
    const parts = dateStr.split('-');
    const day = parseInt(parts[2], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[0], 10);
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    return {
      formatted: `${day} ${thaiMonths[month - 1]}`,
      age,
    };
  };

  const canManage = isAdmin || hasPermission('events.create');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold shrink-0">
            <Cake className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              วันเกิดครูและบุคลากร
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ระบบแจ้งเตือนวันเกิดและส่งคำอวยพรอัตโนมัติทาง Telegram
            </p>
          </div>
        </div>

        {canManage && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-md transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>เพิ่มข้อมูลวันเกิด</span>
          </button>
        )}
      </div>

      {/* Filter & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        {/* Month Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedMonth(0)}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
              selectedMonth === 0
                ? 'bg-pink-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            ทุกเดือน ({birthdays.length})
          </button>
          {thaiMonths.map((m, idx) => {
            const mNum = idx + 1;
            const count = birthdays.filter((b) => parseInt(b.birthDate.split('-')[1], 10) === mNum).length;
            return (
              <button
                key={m}
                onClick={() => setSelectedMonth(mNum)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                  selectedMonth === mNum
                    ? 'bg-pink-600 text-white shadow-xs font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {m} {count > 0 && <span className="opacity-75">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อครู หรือกลุ่มสาระ..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Birthday Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBirthdays.map((b) => {
          const info = formatBirthInfo(b.birthDate);
          const isSending = sendingWishId === b.id;
          return (
            <div
              key={b.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-pink-300 dark:hover:border-pink-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold text-sm">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {b.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {b.position} • {b.department}
                      </p>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-1 rounded-lg text-slate-400 hover:text-blue-600"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(b)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-2xl bg-pink-50/50 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/40 space-y-1 text-xs">
                  <p className="font-semibold text-pink-900 dark:text-pink-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-pink-500" />
                    <span>วันเกิด: {info.formatted} (อายุ {info.age} ปี)</span>
                  </p>
                  {b.customWish && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                      "{b.customWish}"
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => handleSendTelegramWish(b)}
                  disabled={isSending}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSending ? 'กำลังส่งคำอวยพร...' : 'ส่งคำอวยพรเข้า Telegram'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="fixed inset-0" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Cake className="w-5 h-5 text-pink-500" />
                <span>{editingBirthday ? 'แก้ไขข้อมูลวันเกิด' : 'เพิ่มข้อมูลวันเกิด'}</span>
              </h3>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น ครูสมศรี สุขเกษม"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ตำแหน่ง
                  </label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="เช่น ครูผู้สอน, ธุรการ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    กลุ่มสาระ / ฝ่าย
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="เช่น ภาษาไทย"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  วันเดือนปีเกิด <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ข้อความคำอวยพรเฉพาะตัว
                </label>
                <textarea
                  rows={3}
                  value={customWish}
                  onChange={(e) => setCustomWish(e.target.value)}
                  placeholder="ข้อความที่จะส่งอวยพรอัตโนมัติ..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold"
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
