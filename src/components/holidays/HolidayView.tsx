import React, { useState, useEffect } from 'react';
import {
  Flag,
  PlusCircle,
  Sparkles,
  Calendar,
  Trash2,
  Edit,
  Download,
  X,
  RefreshCw,
} from 'lucide-react';
import { ThaiHoliday } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const HolidayView: React.FC = () => {
  const { isAdmin, hasPermission } = useAuth();
  const { showToast, confirm } = useToast();

  const [holidays, setHolidays] = useState<ThaiHoliday[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<ThaiHoliday | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<ThaiHoliday['type']>('HOLIDAY');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ holidays: ThaiHoliday[] }>(`/holidays?year=${selectedYear}`);
      setHolidays(res.holidays || []);
    } catch (e) {
      console.error('Error fetching holidays:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear]);

  const handleOpenCreate = () => {
    setEditingHoliday(null);
    setName('');
    setDate(`${selectedYear}-01-01`);
    setType('HOLIDAY');
    setDescription('');
    setModalOpen(true);
  };

  const handleOpenEdit = (h: ThaiHoliday) => {
    setEditingHoliday(h);
    setName(h.name);
    setDate(h.date);
    setType(h.type);
    setDescription(h.description || '');
    setModalOpen(true);
  };

  const handleDelete = (h: ThaiHoliday) => {
    confirm({
      title: 'ยืนยันการลบวันหยุด?',
      message: `คุณต้องการลบ "${h.name}" หรือไม่?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/holidays/${h.id}`);
          showToast('success', 'ลบสำเร็จ');
          fetchHolidays();
        } catch (e: any) {
          showToast('error', 'ลบไม่สำเร็จ', e?.message);
        }
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) {
      showToast('warning', 'ข้อมูลไม่ครบ', 'กรุณากรอกชื่อและวันที่');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        date,
        type,
        description,
        isCustom: true,
      };

      if (editingHoliday) {
        await api.put(`/holidays/${editingHoliday.id}`, payload);
        showToast('success', 'แก้ไขวันหยุดสำเร็จ');
      } else {
        await api.post('/holidays', payload);
        showToast('success', 'เพิ่มวันหยุดสำเร็จ');
      }
      setModalOpen(false);
      fetchHolidays();
    } catch (err: any) {
      showToast('error', 'บันทึกไม่สำเร็จ', err?.message);
    } finally {
      setSaving(false);
    }
  };

  const canManage = isAdmin || hasPermission('events.create');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shrink-0">
            <Flag className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              วันหยุดราชการและวันสำคัญของไทย
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ปฏิทินวันหยุดนักขัตฤกษ์ วันหยุดพิเศษ และวันสำคัญทางการศึกษา
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Year selector (Thai BE) */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-500 pl-2">ปี:</span>
            {[2025, 2026, 2027].map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  selectedYear === yr
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                พ.ศ. {yr + 543}
              </button>
            ))}
          </div>

          {canManage && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await api.post('/holidays/restore-defaults');
                    showToast('success', 'คืนค่าสำเร็จ', 'รีเซ็ตวันหยุดราชการและวันสำคัญกลับเป็นค่าเริ่มต้นเรียบร้อยแล้ว');
                    fetchHolidays();
                  } catch (e: any) {
                    showToast('error', 'คืนค่าไม่สำเร็จ', e?.message);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all shrink-0"
                title="คืนค่าวันหยุดราชการและวันสำคัญตามปฏิทินหลวง"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">คืนค่าเริ่มต้น</span>
              </button>
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>เพิ่มวันหยุดพิเศษ</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Holidays Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {holidays.map((h) => {
          const isOfficial = h.type === 'HOLIDAY';
          return (
            <div
              key={h.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-rose-300 dark:hover:border-rose-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                      isOfficial
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        : 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    }`}
                  >
                    {isOfficial ? 'วันหยุดราชการ' : 'วันสำคัญ'}
                  </span>
                  {h.isCustom && canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(h)}
                        className="p-1 rounded-lg text-slate-400 hover:text-blue-600"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(h)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {h.name}
                </h3>
                {h.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {h.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-500" />
                  <span>
                    {new Date(h.date).toLocaleDateString('th-TH', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </span>
                {h.isCustom && <span className="text-[10px] text-amber-500">กำหนดเอง</span>}
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
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingHoliday ? 'แก้ไขวันหยุด' : 'เพิ่มวันหยุด / วันสำคัญ'}
              </h3>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อวันหยุด / วันสำคัญ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น วันสถาปนาโรงเรียน, วันหยุดพิเศษ..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  วันที่ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ประเภท
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                >
                  <option value="HOLIDAY">วันหยุดราชการ / หยุดเรียน</option>
                  <option value="OBSERVANCE">วันสำคัญ (ไม่หยุดเรียน)</option>
                  <option value="SCHOOL_SPECIAL">วันกิจกรรมพิเศษของโรงเรียน</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  คำอธิบายเพิ่มเติม
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="รายละเอียด..."
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
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
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
