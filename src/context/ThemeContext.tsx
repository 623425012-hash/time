import React, { createContext, useContext, useState, useEffect } from 'react';
import { SystemSettings } from '../types';
import { api } from '../api/client';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemePreset {
  id: SystemSettings['presetTheme'];
  name: string;
  primary: string;
  secondary: string;
  sidebar: string;
  header: string;
  emoji: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'blue',
    name: 'Blue School (น้ำเงินคลาสสิก)',
    primary: '#2563eb',
    secondary: '#0d9488',
    sidebar: '#0f172a',
    header: '#ffffff',
    emoji: '🩵',
  },
  {
    id: 'green',
    name: 'Green School (เขียวธรรมชาติ)',
    primary: '#16a34a',
    secondary: '#0891b2',
    sidebar: '#064e3b',
    header: '#ffffff',
    emoji: '💚',
  },
  {
    id: 'purple',
    name: 'Purple School (ม่วงเอกลักษณ์)',
    primary: '#7c3aed',
    secondary: '#db2777',
    sidebar: '#2e1065',
    header: '#ffffff',
    emoji: '💜',
  },
  {
    id: 'orange',
    name: 'Orange School (ส้มสดใส)',
    primary: '#ea580c',
    secondary: '#d97706',
    sidebar: '#431407',
    header: '#ffffff',
    emoji: '🧡',
  },
  {
    id: 'colorful',
    name: 'Colorful School (หลากสีสันสดใส)',
    primary: '#0284c7',
    secondary: '#e11d48',
    sidebar: '#1e1b4b',
    header: '#ffffff',
    emoji: '🌈',
  },
  {
    id: 'clean',
    name: 'Clean School (มินิมอลขาว-เทา)',
    primary: '#334155',
    secondary: '#475569',
    sidebar: '#1e293b',
    header: '#ffffff',
    emoji: '⚪',
  },
];

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  systemSettings: SystemSettings;
  updateSystemSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  applyPreset: (presetId: SystemSettings['presetTheme']) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: SystemSettings = {
  schoolName: 'โรงเรียนสาธิตพัฒนาวิทยาคม',
  schoolShortName: 'ส.พ.ว.',
  academicYear: '2569',
  semester: '1',
  primaryColor: '#2563eb',
  secondaryColor: '#0d9488',
  sidebarColor: '#0f172a',
  headerColor: '#ffffff',
  presetTheme: 'blue',
  allowSelfRegistration: false,
  defaultEventApprovalRequired: true,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('school_calendar_theme_mode') as ThemeMode) || 'system';
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    try {
      const cached = localStorage.getItem('school_calendar_system_settings');
      if (cached) {
        return { ...defaultSettings, ...JSON.parse(cached) };
      }
    } catch {
      // ignore
    }
    return defaultSettings;
  });

  const applyColorsToCss = (settings: SystemSettings) => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', settings.primaryColor || '#2563eb');
    root.style.setProperty('--primary-hover', settings.primaryColor ? `${settings.primaryColor}ee` : '#1d4ed8');
    root.style.setProperty('--secondary-color', settings.secondaryColor || '#0d9488');
    root.style.setProperty('--sidebar-bg', settings.sidebarColor || '#0f172a');
  };

  const refreshSettings = async () => {
    try {
      const res = await api.get<{ systemSettings: SystemSettings }>('/settings/system');
      if (res && res.systemSettings) {
        const merged = { ...defaultSettings, ...res.systemSettings };
        setSystemSettings(merged);
        applyColorsToCss(merged);
        try {
          localStorage.setItem('school_calendar_system_settings', JSON.stringify(merged));
        } catch {
          // ignore storage quota error
        }
      }
    } catch {
      applyColorsToCss(systemSettings);
    }
  };

  useEffect(() => {
    applyColorsToCss(systemSettings);
    refreshSettings();
  }, []);

  // Update dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      themeMode === 'dark' ||
      (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('school_calendar_theme_mode', mode);
  };

  const updateSystemSettings = async (newSettings: Partial<SystemSettings>) => {
    const updated = { ...systemSettings, ...newSettings };
    setSystemSettings(updated);
    applyColorsToCss(updated);
    try {
      localStorage.setItem('school_calendar_system_settings', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // Direct Cloud Firestore backup to ensure other devices receive changes immediately
    try {
      import('../api/firestoreService').then(({ saveSettingsToFirestore, isFirestoreConfigured }) => {
        if (isFirestoreConfigured()) {
          saveSettingsToFirestore(updated).catch((err) => console.warn('Cloud Firestore settings save warn:', err));
        }
      }).catch(() => {});
    } catch {}

    try {
      const res = await api.put<{ systemSettings: SystemSettings }>('/settings/system', updated);
      if (res && res.systemSettings) {
        const merged = { ...defaultSettings, ...res.systemSettings };
        setSystemSettings(merged);
        applyColorsToCss(merged);
        try {
          localStorage.setItem('school_calendar_system_settings', JSON.stringify(merged));
        } catch {
          // ignore
        }
      }
    } catch (e) {
      console.error('Failed to sync system settings with server:', e);
      // Still retain locally in memory & localStorage & Firestore
    }
  };

  const applyPreset = async (presetId: SystemSettings['presetTheme']) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    await updateSystemSettings({
      presetTheme: presetId,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      sidebarColor: preset.sidebar,
      headerColor: preset.header,
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        systemSettings,
        updateSystemSettings,
        updateSettings: updateSystemSettings,
        applyPreset,
        refreshSettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
