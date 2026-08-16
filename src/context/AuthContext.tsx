import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, UserPermission } from '../types';
import { api, getAuthToken, setAuthToken, removeAuthToken } from '../api/client';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  quickLogin: (role: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserProfile: (userData: Partial<User>) => void;
  isAdmin: boolean;
  isStaff: boolean;
  isViewer: boolean;
  hasPermission: (permission: UserPermission) => boolean;
}

export const DEFAULT_VIEWER_USER: User = {
  id: 'usr-viewer-1',
  name: 'กิตติศักดิ์',
  surname: 'มุ่งมั่น',
  username: 'viewer',
  email: 'viewer@school.ac.th',
  department: 'ผู้ปกครอง / นักเรียน / สาธารณะ',
  position: 'ผู้เยี่ยมชมระบบ (Viewer)',
  role: 'VIEWER',
  permissions: ['events.view', 'reports.view'],
  status: 'ACTIVE',
  createdAt: '2026-08-01T00:00:00Z',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(DEFAULT_VIEWER_USER);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const fetchCurrentUser = async () => {
    try {
      if (!getAuthToken()) {
        setUser(DEFAULT_VIEWER_USER);
        setLoading(false);
        return;
      }
      const data = await api.get<{ user: User }>('/auth/me');
      setUser(data.user);
    } catch {
      removeAuthToken();
      setToken(null);
      setUser(DEFAULT_VIEWER_USER);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const res = await api.post<{ token: string; user: User; message: string }>('/auth/login', {
        usernameOrEmail,
        password,
      });

      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.user);
      showToast('success', 'เข้าสู่ระบบสำเร็จ', `ยินดีต้อนรับคุณ ${res.user.name} ${res.user.surname}`);
      return true;
    } catch (err: any) {
      showToast('error', 'เข้าสู่ระบบไม่สำเร็จ', err?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (role: UserRole): Promise<boolean> => {
    try {
      setLoading(true);
      const res = await api.post<{ token: string; user: User; message: string }>('/auth/quick-login', { role });
      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.user);
      showToast('success', 'เข้าสู่ระบบสำเร็จ (Demo)', `ยินดีต้อนรับคุณ ${res.user.name} (${res.user.role})`);
      return true;
    } catch {
      // Fallback
      let username = 'admin';
      let password = 'admin123';
      if (role === 'STAFF') {
        username = 'staff';
        password = 'staff123';
      } else if (role === 'VIEWER') {
        username = 'viewer';
        password = 'viewer123';
      }
      return login(username, password);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      removeAuthToken();
      setToken(null);
      setUser(DEFAULT_VIEWER_USER);
      showToast('info', 'ออกจากระบบเรียบร้อยแล้ว (กลับสู่บทบาท Viewer)');
    }
  };

  const updateUserProfile = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';
  const isViewer = !user || user.role === 'VIEWER';

  const hasPermission = (permission: UserPermission): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return user.permissions ? user.permissions.includes(permission) : false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        quickLogin,
        logout,
        updateUserProfile,
        isAdmin,
        isStaff,
        isViewer,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
