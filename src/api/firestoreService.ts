import { 
  doc, 
  setDoc, 
  onSnapshot, 
  getDoc,
} from 'firebase/firestore';
import { db, isFirebaseInitialized } from '../lib/firebase';
import { 
  SchoolEvent, 
  DutySchedule, 
  DutyGroup,
  Announcement, 
  User, 
  TelegramSettings,
  ThaiHoliday,
  StaffBirthday,
  EventCategory,
  SystemSettings
} from '../types';

export interface FullSystemSnapshot {
  events?: SchoolEvent[];
  categories?: EventCategory[];
  holidays?: ThaiHoliday[];
  dutyGroups?: DutyGroup[];
  dutySchedules?: DutySchedule[];
  birthdays?: StaffBirthday[];
  announcements?: Announcement[];
  users?: User[];
  telegramSettings?: TelegramSettings;
  settings?: SystemSettings;
  updatedAt?: string;
}

export const isFirestoreConfigured = () => {
  return isFirebaseInitialized() && db !== null;
};

/**
 * Fetch full dataset from Firestore (checks both granular docs and main bundle)
 */
export const fetchInitialFirestoreData = async (): Promise<FullSystemSnapshot | null> => {
  if (!isFirestoreConfigured() || !db) return null;
  try {
    const mainDocRef = doc(db, 'system_data', 'school_calendar');
    const settingsDocRef = doc(db, 'system_data', 'settings');
    const eventsDocRef = doc(db, 'system_data', 'events');
    const dutiesDocRef = doc(db, 'system_data', 'duties');

    const [mainSnap, settingsSnap, eventsSnap, dutiesSnap] = await Promise.all([
      getDoc(mainDocRef).catch(() => null),
      getDoc(settingsDocRef).catch(() => null),
      getDoc(eventsDocRef).catch(() => null),
      getDoc(dutiesDocRef).catch(() => null),
    ]);

    let result: FullSystemSnapshot = {};
    let foundAny = false;

    if (mainSnap && mainSnap.exists()) {
      result = { ...result, ...(mainSnap.data() as FullSystemSnapshot) };
      foundAny = true;
    }

    if (settingsSnap && settingsSnap.exists()) {
      const sData = settingsSnap.data();
      if (sData?.settings) {
        result.settings = { ...result.settings, ...sData.settings };
        foundAny = true;
      }
      if (sData?.telegramSettings) {
        result.telegramSettings = { ...result.telegramSettings, ...sData.telegramSettings };
        foundAny = true;
      }
    }

    if (eventsSnap && eventsSnap.exists()) {
      const eData = eventsSnap.data();
      if (Array.isArray(eData?.events) && eData.events.length > 0) {
        result.events = eData.events;
        foundAny = true;
      }
      if (Array.isArray(eData?.categories) && eData.categories.length > 0) {
        result.categories = eData.categories;
        foundAny = true;
      }
    }

    if (dutiesSnap && dutiesSnap.exists()) {
      const dData = dutiesSnap.data();
      if (Array.isArray(dData?.dutySchedules)) {
        result.dutySchedules = dData.dutySchedules;
        foundAny = true;
      }
      if (Array.isArray(dData?.dutyGroups)) {
        result.dutyGroups = dData.dutyGroups;
        foundAny = true;
      }
      if (Array.isArray(dData?.birthdays)) {
        result.birthdays = dData.birthdays;
        foundAny = true;
      }
      if (Array.isArray(dData?.announcements)) {
        result.announcements = dData.announcements;
        foundAny = true;
      }
    }

    return foundAny ? result : null;
  } catch (error) {
    console.warn('Error fetching Firestore initial data:', error);
    return null;
  }
};

/**
 * Real-time listener for Firestore changes across all school calendar data
 */
export const subscribeToFirestoreData = (
  onUpdate: (data: FullSystemSnapshot) => void
) => {
  if (!isFirestoreConfigured() || !db) {
    return () => {};
  }

  const mainDocRef = doc(db, 'system_data', 'school_calendar');
  const settingsDocRef = doc(db, 'system_data', 'settings');
  const eventsDocRef = doc(db, 'system_data', 'events');
  const dutiesDocRef = doc(db, 'system_data', 'duties');

  let accumulated: FullSystemSnapshot = {};

  const unsubs: Array<() => void> = [];

  const handleUpdate = (partial: Partial<FullSystemSnapshot>) => {
    accumulated = { ...accumulated, ...partial };
    onUpdate({ ...accumulated });
  };

  try {
    const unsubMain = onSnapshot(mainDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as FullSystemSnapshot;
        handleUpdate(data);
      }
    }, (e) => console.warn('Main doc snapshot warn:', e));
    unsubs.push(unsubMain);

    const unsubSettings = onSnapshot(settingsDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        handleUpdate({
          settings: data?.settings,
          telegramSettings: data?.telegramSettings,
        });
      }
    }, (e) => console.warn('Settings doc snapshot warn:', e));
    unsubs.push(unsubSettings);

    const unsubEvents = onSnapshot(eventsDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        handleUpdate({
          events: data?.events,
          categories: data?.categories,
        });
      }
    }, (e) => console.warn('Events doc snapshot warn:', e));
    unsubs.push(unsubEvents);

    const unsubDuties = onSnapshot(dutiesDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        handleUpdate({
          dutySchedules: data?.dutySchedules,
          dutyGroups: data?.dutyGroups,
          birthdays: data?.birthdays,
          announcements: data?.announcements,
        });
      }
    }, (e) => console.warn('Duties doc snapshot warn:', e));
    unsubs.push(unsubDuties);
  } catch (err) {
    console.warn('Subscription error:', err);
  }

  return () => {
    unsubs.forEach((u) => {
      try {
        u();
      } catch {}
    });
  };
};

/**
 * Upload full system dataset to Firestore across multiple documents to prevent 1MB document limit
 */
export const uploadFullStateToFirestore = async (data: FullSystemSnapshot) => {
  if (!isFirestoreConfigured() || !db) return false;
  try {
    const now = new Date().toISOString();
    const mainDocRef = doc(db, 'system_data', 'school_calendar');
    const settingsDocRef = doc(db, 'system_data', 'settings');
    const eventsDocRef = doc(db, 'system_data', 'events');
    const dutiesDocRef = doc(db, 'system_data', 'duties');

    await Promise.all([
      // 1. Settings Doc (system branding, logo, colors, telegram)
      setDoc(settingsDocRef, {
        settings: data.settings || null,
        telegramSettings: data.telegramSettings || null,
        updatedAt: now,
      }, { merge: true }),

      // 2. Events & Categories Doc
      setDoc(eventsDocRef, {
        events: data.events || [],
        categories: data.categories || [],
        holidays: data.holidays || [],
        updatedAt: now,
      }, { merge: true }),

      // 3. Duties, Schedules, Announcements Doc
      setDoc(dutiesDocRef, {
        dutyGroups: data.dutyGroups || [],
        dutySchedules: data.dutySchedules || [],
        birthdays: data.birthdays || [],
        announcements: data.announcements || [],
        users: data.users || [],
        updatedAt: now,
      }, { merge: true }),

      // 4. Main Doc backup
      setDoc(mainDocRef, {
        ...data,
        updatedAt: now,
      }, { merge: true }),
    ]);

    return true;
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    return false;
  }
};

/**
 * Partial savers for individual modules
 */
export const saveEventsToFirestore = async (events: SchoolEvent[]) => {
  if (!isFirestoreConfigured() || !db) return false;
  try {
    const now = new Date().toISOString();
    const eventsDocRef = doc(db, 'system_data', 'events');
    const mainDocRef = doc(db, 'system_data', 'school_calendar');
    await Promise.all([
      setDoc(eventsDocRef, { events, updatedAt: now }, { merge: true }),
      setDoc(mainDocRef, { events, updatedAt: now }, { merge: true }),
    ]);
    return true;
  } catch (error) {
    console.error('Error saving events to Firestore:', error);
    return false;
  }
};

export const saveSettingsToFirestore = async (settings: SystemSettings, telegramSettings?: TelegramSettings) => {
  if (!isFirestoreConfigured() || !db) return false;
  try {
    const now = new Date().toISOString();
    const settingsDocRef = doc(db, 'system_data', 'settings');
    const mainDocRef = doc(db, 'system_data', 'school_calendar');
    const payload: any = { settings, updatedAt: now };
    if (telegramSettings) payload.telegramSettings = telegramSettings;

    await Promise.all([
      setDoc(settingsDocRef, payload, { merge: true }),
      setDoc(mainDocRef, payload, { merge: true }),
    ]);
    return true;
  } catch (error) {
    console.error('Error saving settings to Firestore:', error);
    return false;
  }
};

export const saveDutySchedulesToFirestore = async (dutySchedules: DutySchedule[]) => {
  if (!isFirestoreConfigured() || !db) return false;
  try {
    const now = new Date().toISOString();
    const dutiesDocRef = doc(db, 'system_data', 'duties');
    const mainDocRef = doc(db, 'system_data', 'school_calendar');
    await Promise.all([
      setDoc(dutiesDocRef, { dutySchedules, updatedAt: now }, { merge: true }),
      setDoc(mainDocRef, { dutySchedules, updatedAt: now }, { merge: true }),
    ]);
    return true;
  } catch (error) {
    console.error('Error saving duty schedules to Firestore:', error);
    return false;
  }
};

export const saveAnnouncementsToFirestore = async (announcements: Announcement[]) => {
  if (!isFirestoreConfigured() || !db) return false;
  try {
    const now = new Date().toISOString();
    const dutiesDocRef = doc(db, 'system_data', 'duties');
    const mainDocRef = doc(db, 'system_data', 'school_calendar');
    await Promise.all([
      setDoc(dutiesDocRef, { announcements, updatedAt: now }, { merge: true }),
      setDoc(mainDocRef, { announcements, updatedAt: now }, { merge: true }),
    ]);
    return true;
  } catch (error) {
    console.error('Error saving announcements to Firestore:', error);
    return false;
  }
};
