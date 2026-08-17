import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginModal } from './components/auth/LoginModal';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { CalendarView } from './components/calendar/CalendarView';
import { EventFormModal } from './components/calendar/EventFormModal';
import { EventDetailModal } from './components/calendar/EventDetailModal';
import { AnnouncementView } from './components/announcements/AnnouncementView';
import { HolidayView } from './components/holidays/HolidayView';
import { DutyView } from './components/duties/DutyView';
import { BirthdayView } from './components/birthdays/BirthdayView';
import { TelegramView } from './components/telegram/TelegramView';
import { DocumentView } from './components/documents/DocumentView';
import { ReportView } from './components/reports/ReportView';
import { ApprovalView } from './components/approvals/ApprovalView';
import { EventManagerView } from './components/events/EventManagerView';
import { UserView } from './components/users/UserView';
import { SettingView } from './components/settings/SettingView';
import { LogView } from './components/logs/LogView';
import { LoginView } from './components/auth/LoginView';
import {
  ActiveNavTab,
  SchoolEvent,
  Announcement,
  ThaiHoliday,
  DutyRoster,
  StaffBirthday,
} from './types';
import { api } from './api/client';
import { localStore } from './api/localStore';
import { 
  subscribeToFirestoreData, 
  fetchInitialFirestoreData, 
  uploadFullStateToFirestore, 
  isFirestoreConfigured 
} from './api/firestoreService';

function AppContent() {
  const { user, isViewer, isAdmin, hasPermission } = useAuth();
  const { showToast } = useToast();

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Allowed tabs for Viewer role
  const VIEWER_ALLOWED_TABS: ActiveNavTab[] = ['dashboard', 'calendar', 'duties', 'announcements', 'login'];

  // Guard against navigating to unauthorized tabs
  useEffect(() => {
    if (isViewer && !VIEWER_ALLOWED_TABS.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [isViewer, activeTab]);

  // Modals State
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);

  // Dashboard Data State
  const [refreshVersion, setRefreshVersion] = useState(0);
  const refreshAll = useCallback(() => {
    setRefreshVersion((v) => v + 1);
  }, []);

  const [summary, setSummary] = useState({
    todayEventsCount: 0,
    tomorrowEventsCount: 0,
    pendingEventsCount: 0,
    usersCount: 0,
    announcementsCount: 0,
    nextHoliday: null as ThaiHoliday | null,
  });
  const [todayEvents, setTodayEvents] = useState<SchoolEvent[]>([]);
  const [tomorrowEvents, setTomorrowEvents] = useState<SchoolEvent[]>([]);
  const [pendingEvents, setPendingEvents] = useState<SchoolEvent[]>([]);
  const [activeAnnouncements, setActiveAnnouncements] = useState<Announcement[]>([]);
  const [todayBirthdays, setTodayBirthdays] = useState<StaffBirthday[]>([]);
  const [todayDuties, setTodayDuties] = useState<DutyRoster[]>([]);
  const [todayDutySchedule, setTodayDutySchedule] = useState<any>(null);
  const [todayDutyGroup, setTodayDutyGroup] = useState<any>(null);

  // Initialize and Sync with Cloud Firestore
  useEffect(() => {
    if (!isFirestoreConfigured()) return;

    // 1. Initial Pull from Firestore if exists, or Seed Firestore if empty
    const initCloudData = async () => {
      try {
        const cloudData = await fetchInitialFirestoreData();
        const localData = localStore.getData();

        if (cloudData) {
          // Merge non-empty data safely without dropping newly added local events or settings
          if (Array.isArray(cloudData.events) && cloudData.events.length > 0) {
            // Merge events by id, keeping newer local additions
            const cloudEventIds = new Set(cloudData.events.map((e) => e.id));
            const uniqueLocalEvents = (localData.events || []).filter((e) => !cloudEventIds.has(e.id));
            localData.events = [...cloudData.events, ...uniqueLocalEvents];
          }
          if (Array.isArray(cloudData.categories) && cloudData.categories.length > 0) localData.categories = cloudData.categories;
          if (Array.isArray(cloudData.holidays) && cloudData.holidays.length > 0) localData.holidays = cloudData.holidays;
          if (Array.isArray(cloudData.dutyGroups) && cloudData.dutyGroups.length > 0) localData.dutyGroups = cloudData.dutyGroups;
          if (Array.isArray(cloudData.dutySchedules) && cloudData.dutySchedules.length > 0) localData.dutySchedules = cloudData.dutySchedules;
          if (Array.isArray(cloudData.birthdays) && cloudData.birthdays.length > 0) localData.birthdays = cloudData.birthdays;
          if (Array.isArray(cloudData.announcements) && cloudData.announcements.length > 0) localData.announcements = cloudData.announcements;
          if (Array.isArray(cloudData.users) && cloudData.users.length > 0) localData.users = cloudData.users;
          
          if (cloudData.telegramSettings && (cloudData.telegramSettings.botToken || cloudData.telegramSettings.chatId)) {
            localData.telegramSettings = { ...localData.telegramSettings, ...cloudData.telegramSettings };
          }
          if (cloudData.settings) {
            localData.systemSettings = { 
              ...localData.systemSettings, 
              ...cloudData.settings,
              schoolLogoUrl: cloudData.settings.schoolLogoUrl || localData.systemSettings.schoolLogoUrl 
            };
          }
          localStore.saveData();
          refreshAll();
        } else {
          // Cloud is empty -> Push local data to seed Cloud Firestore
          await uploadFullStateToFirestore({
            events: localData.events,
            categories: localData.categories,
            holidays: localData.holidays,
            dutyGroups: localData.dutyGroups,
            dutySchedules: localData.dutySchedules,
            birthdays: localData.birthdays,
            announcements: localData.announcements,
            users: localData.users,
            telegramSettings: localData.telegramSettings,
            settings: localData.systemSettings,
          });
        }
      } catch (err) {
        console.warn('Error during Firestore sync:', err);
      }
    };

    initCloudData();

    // 2. Real-time Subscription to live changes from other devices (PC / Mobile)
    const unsubscribe = subscribeToFirestoreData((cloudData) => {
      const localData = localStore.getData();
      let changed = false;

      if (cloudData.events && JSON.stringify(localData.events) !== JSON.stringify(cloudData.events)) {
        localData.events = cloudData.events;
        changed = true;
      }
      if (cloudData.dutySchedules && JSON.stringify(localData.dutySchedules) !== JSON.stringify(cloudData.dutySchedules)) {
        localData.dutySchedules = cloudData.dutySchedules;
        changed = true;
      }
      if (cloudData.announcements && JSON.stringify(localData.announcements) !== JSON.stringify(cloudData.announcements)) {
        localData.announcements = cloudData.announcements;
        changed = true;
      }
      if (cloudData.dutyGroups && JSON.stringify(localData.dutyGroups) !== JSON.stringify(cloudData.dutyGroups)) {
        localData.dutyGroups = cloudData.dutyGroups;
        changed = true;
      }
      if (cloudData.birthdays && JSON.stringify(localData.birthdays) !== JSON.stringify(cloudData.birthdays)) {
        localData.birthdays = cloudData.birthdays;
        changed = true;
      }
      if (cloudData.categories && JSON.stringify(localData.categories) !== JSON.stringify(cloudData.categories)) {
        localData.categories = cloudData.categories;
        changed = true;
      }
      if (cloudData.telegramSettings && JSON.stringify(localData.telegramSettings) !== JSON.stringify(cloudData.telegramSettings)) {
        localData.telegramSettings = cloudData.telegramSettings;
        changed = true;
      }
      if (cloudData.settings && JSON.stringify(localData.systemSettings) !== JSON.stringify(cloudData.settings)) {
        localData.systemSettings = cloudData.settings;
        changed = true;
      }

      if (changed) {
        localStore.saveData();
        refreshAll();
      }
    });

    return () => unsubscribe();
  }, [refreshAll]);

  // Fetch Dashboard Summary Data
  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await api.get<any>('/dashboard/summary');
      if (res) {
        setSummary({
          todayEventsCount: res.todayEventsCount || 0,
          tomorrowEventsCount: res.tomorrowEventsCount || 0,
          pendingEventsCount: res.pendingEventsCount || 0,
          usersCount: res.usersCount || 0,
          announcementsCount: res.announcementsCount || 0,
          nextHoliday: res.nextHoliday || null,
        });
        setTodayEvents(res.todayEvents || []);
        setTomorrowEvents(res.tomorrowEvents || []);
        setPendingEvents(res.pendingEvents || []);
        setActiveAnnouncements(res.activeAnnouncements || []);
        setTodayBirthdays(res.todayBirthdays || []);
        setTodayDuties(res.todayDuties || []);
        setTodayDutySchedule(res.todayDutySchedule || null);
        setTodayDutyGroup(res.todayDutyGroup || null);
      }
    } catch (e) {
      console.error('Error fetching dashboard summary:', e);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, activeTab, refreshVersion]);

  // Global Keyboard Shortcuts (⌘K for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handler for opening event details
  const handleSelectEvent = (event: SchoolEvent) => {
    setSelectedEvent(event);
    setEventDetailOpen(true);
  };

  // Handler for creating a new event
  const handleOpenCreateEvent = () => {
    setEditingEvent(null);
    setEventFormOpen(true);
  };

  // Handler for editing an existing event
  const handleEditEvent = (event: SchoolEvent) => {
    setEditingEvent(event);
    setEventDetailOpen(false);
    setEventFormOpen(true);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openCreateEventModal={handleOpenCreateEvent}
        pendingCount={summary.pendingEventsCount}
        todayCount={summary.todayEventsCount}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenSearch={() => setSearchModalOpen(true)}
          onOpenLogin={() => setActiveTab('login')}
          pendingCount={summary.pendingEventsCount}
          todayCount={summary.todayEventsCount}
        />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'login' && (
              <LoginView
                onSuccess={() => {
                  setActiveTab('dashboard');
                  refreshAll();
                }}
                onContinueAsViewer={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardView
                summary={summary}
                todayEvents={todayEvents}
                tomorrowEvents={tomorrowEvents}
                pendingEvents={pendingEvents}
                activeAnnouncements={activeAnnouncements}
                todayBirthdays={todayBirthdays}
                todayDuties={todayDuties}
                todayDutySchedule={todayDutySchedule}
                todayDutyGroup={todayDutyGroup}
                onSelectEvent={handleSelectEvent}
                onNavigateTab={setActiveTab}
                onOpenCreateEvent={handleOpenCreateEvent}
                onRefresh={refreshAll}
              />
            )}

            {activeTab === 'calendar' && (
              <CalendarView
                onSelectEvent={handleSelectEvent}
                onOpenCreate={handleOpenCreateEvent}
                refreshTrigger={refreshVersion}
                onRefresh={refreshAll}
              />
            )}

            {activeTab === 'approvals' && !isViewer && (isAdmin || hasPermission('events.approve')) && (
              <ApprovalView
                onSelectEvent={handleSelectEvent}
                onRefresh={refreshAll}
              />
            )}

            {activeTab === 'event-manager' && !isViewer && (isAdmin || hasPermission('events.edit')) && (
              <EventManagerView
                onSelectEvent={handleSelectEvent}
                onEditEvent={handleEditEvent}
                onOpenCreate={handleOpenCreateEvent}
                onRefresh={refreshAll}
              />
            )}

            {activeTab === 'announcements' && <AnnouncementView />}

            {activeTab === 'holidays' && !isViewer && <HolidayView />}

            {activeTab === 'duties' && <DutyView />}

            {activeTab === 'birthdays' && !isViewer && <BirthdayView />}

            {activeTab === 'telegram' && !isViewer && (isAdmin || hasPermission('telegram.manage')) && <TelegramView />}

            {activeTab === 'documents' && !isViewer && <DocumentView />}

            {activeTab === 'reports' && !isViewer && <ReportView />}

            {activeTab === 'users' && !isViewer && hasPermission('users.view') && <UserView />}

            {activeTab === 'settings' && !isViewer && hasPermission('settings.manage') && <SettingView />}

            {activeTab === 'logs' && !isViewer && hasPermission('logs.view') && <LogView />}
          </div>
        </main>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />

      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectEvent={handleSelectEvent}
        onNavigateTab={setActiveTab}
      />

      <EventFormModal
        isOpen={eventFormOpen}
        onClose={() => setEventFormOpen(false)}
        onSaved={() => {
          refreshAll();
        }}
        initialEvent={editingEvent}
      />

      <EventDetailModal
        isOpen={eventDetailOpen}
        onClose={() => setEventDetailOpen(false)}
        event={selectedEvent}
        onEdit={handleEditEvent}
        onRefresh={() => {
          refreshAll();
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
