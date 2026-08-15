import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  X,
  Mail,
  Phone,
  Building,
  Sparkles,
} from 'lucide-react';
import { User, UserRole, UserPermission } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const UserView: React.FC = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const { showToast, confirm } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('ฝ่ายวิชาการ');
  const [position, setPosition] = useState('ครูผู้สอน');
  const [role, setRole] = useState<UserRole>('STAFF');
  const [permissions, setPermissions] = useState<UserPermission[]>(['events.view', 'events.create']);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [saving, setSaving] = useState(false);

  const allAvailablePermissions: { id: UserPermission; label: string; desc: string }[] = [
    { id: 'events.view', label: 'ดูปฏิทินกิจกรรม', desc: 'สามารถเข้าดูปฏิทินกิจกรรมโรงเรียนทั้งหมดได้' },
    { id: 'events.create', label: 'สร้างคำขอกิจกรรม', desc: 'สามารถเพิ่มและส่งคำขอกิจกรรมเข้าระบบได้' },
    { id: 'events.edit', label: 'แก้ไขกิจกรรม', desc: 'สามารถแก้ไขข้อมูลกิจกรรมของตนเองได้' },
    { id: 'events.delete', label: 'ลบกิจกรรม', desc: 'สามารถลบกิจกรรมของตนเองได้' },
    { id: 'events.approve', label: 'อนุมัติกิจกรรม', desc: 'สามารถอนุมัติหรือปฏิเสธกิจกรรมได้ (สำหรับผู้บริหาร)' },
    { id: 'announcements.create', label: 'สร้างและจัดการประกาศ', desc: 'สามารถสร้าง ข่าวสารและประกาศโรงเรียนได้' },
    { id: 'settings.manage', label: 'จัดการการตั้งค่าระบบ', desc: 'สามารถเข้าถึงการตั้งค่าและการจัดการสิทธิ์ผู้ใช้ได้' },
  ];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ users: User[] }>('/users');
      setUsers(res.users || []);
    } catch (e) {
      console.error('Error fetching users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setName('');
    setSurname('');
    setEmail('');
    setPhone('');
    setDepartment('ฝ่ายวิชาการ');
    setPosition('ครูผู้สอน');
    setRole('STAFF');
    setPermissions(['events.view', 'events.create', 'events.edit']);
    setStatus('ACTIVE');
    setModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setUsername(u.username);
    setPassword('');
    setName(u.name);
    setSurname(u.surname);
    setEmail(u.email || '');
    setPhone(u.phone || '');
    setDepartment(u.department || 'ฝ่ายวิชาการ');
    setPosition(u.position || 'ครูผู้สอน');
    setRole(u.role);
    setPermissions(u.permissions || []);
    setStatus(u.status);
    setModalOpen(true);
  };

  const handleTogglePermission = (pId: UserPermission) => {
    setPermissions((prev) =>
      prev.includes(pId) ? prev.filter((p) => p !== pId) : [...prev, pId]
    );
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'ADMIN') {
      setPermissions(allAvailablePermissions.map((p) => p.id));
    } else if (newRole === 'STAFF') {
      setPermissions(['events.view', 'events.create', 'events.edit', 'announcements.create']);
    } else {
      setPermissions(['events.view']);
    }
  };

  const handleDelete = (u: User) => {
    if (u.id === currentUser?.id) {
      showToast('error', 'ไม่สามารถลบตนเองได้', 'คุณไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้');
      return;
    }

    confirm({
      title: 'ยืนยันการลบผู้ใช้งาน?',
      message: `คุณต้องการลบผู้ใช้งาน "${u.name} ${u.surname}" ใช่หรือไม่?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/users/${u.id}`);
          showToast('success', 'ลบผู้ใช้สำเร็จ');
          fetchUsers();
        } catch (e: any) {
          showToast('error', 'ลบผู้ใช้ไม่สำเร็จ', e?.message);
        }
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) {
      showToast('warning', 'กรอกข้อมูลไม่ครบ', 'กรุณาระบุชื่อและชื่อผู้ใช้');
      return;
    }

    if (!editingUser && !password.trim()) {
      showToast('warning', 'กรุณาระบุรหัสผ่าน', 'ต้องกำหนดรหัสผ่านสำหรับผู้ใช้ใหม่');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        username,
        name,
        surname,
        email,
        phone,
        department,
        position,
        role,
        permissions,
        status,
      };

      if (password.trim()) {
        payload.password = password;
      }

      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, payload);
        showToast('success', 'แก้ไขข้อมูลผู้ใช้สำเร็จ');
      } else {
        await api.post('/users', payload);
        showToast('success', 'สร้างผู้ใช้ใหม่สำเร็จ');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      showToast('error', 'บันทึกไม่สำเร็จ', err?.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
        <Shield className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          จำกัดสิทธิ์เฉพาะผู้ดูแลระบบ (Admin)
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          คุณไม่มีสิทธิ์ในการจัดการบัญชีผู้ใช้งาน กรุณาติดต่อผู้ดูแลระบบ
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              การจัดการผู้ใช้งานและกำหนดสิทธิ์
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              จัดการบัญชีครู กำหนดบทบาท และสิทธิ์การใช้งานระบบแต่ละส่วน
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>เพิ่มผู้ใช้งานใหม่</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">ชื่อ-นามสกุล / ชื่อผู้ใช้</th>
                <th className="py-3.5 px-4">ตำแหน่ง / กลุ่มสาระ</th>
                <th className="py-3.5 px-4">บทบาท (Role)</th>
                <th className="py-3.5 px-4">สิทธิ์การใช้งาน</th>
                <th className="py-3.5 px-4">สถานะ</th>
                <th className="py-3.5 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {u.name} {u.surname}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    <p className="font-medium text-slate-800 dark:text-slate-200">{u.position}</p>
                    <p className="text-[11px] text-slate-400">{u.department}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                        u.role === 'ADMIN'
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : u.role === 'STAFF'
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {u.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : u.role === 'STAFF' ? 'ครู/เจ้าหน้าที่' : 'ผู้เข้าชม'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {u.permissions?.length || 0} รายการ
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {u.status === 'ACTIVE' ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ใช้งานอยู่
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-400 font-bold text-[11px]">
                        <XCircle className="w-3.5 h-3.5" /> ปิดใช้งาน
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                        title="แก้ไข"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={u.id === currentUser?.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-30"
                        title="ลบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="fixed inset-0" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in zoom-in-95 my-8 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>{editingUser ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}</span>
              </h3>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อผู้ใช้ (Username) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={!!editingUser}
                    placeholder="เช่น somsak.r"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {editingUser ? 'เปลี่ยนรหัสผ่าน (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน'} {!editingUser && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น สมศักดิ์"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    placeholder="เช่น รักเรียน"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ตำแหน่ง
                  </label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="เช่น ครูชำนาญการพิเศษ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    กลุ่มสาระ / ฝ่ายงาน
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="เช่น ฝ่ายวิชาการ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    บทบาทในระบบ (Role)
                  </label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="STAFF">STAFF (ครู / เจ้าหน้าที่ทั่วไป)</option>
                    <option value="ADMIN">ADMIN (ผู้ดูแลระบบ / ผู้บริหาร)</option>
                    <option value="VIEWER">VIEWER (ผู้เข้าชม / นักเรียน)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    สถานะการใช้งาน
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  >
                    <option value="ACTIVE">เปิดใช้งาน (Active)</option>
                    <option value="INACTIVE">ระงับการใช้งาน (Inactive)</option>
                  </select>
                </div>
              </div>

              {/* Granular Permissions Checklist */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  สิทธิ์การใช้งานโดยละเอียด (Granular Permissions)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allAvailablePermissions.map((perm) => (
                    <label
                      key={perm.id}
                      className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                        permissions.includes(perm.id)
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-950 dark:text-blue-200'
                          : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={permissions.includes(perm.id)}
                        onChange={() => handleTogglePermission(perm.id)}
                        className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <p className="font-bold">{perm.label}</p>
                        <p className="text-[10px] text-slate-400">{perm.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </form>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลผู้ใช้'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
