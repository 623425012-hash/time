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
 * Fetch initial full dataset from Firestore once
 */
export const fetchInitialFirestoreData = async (): Promise<FullSystemSnapshot | null> => {
  if (!isFirestoreConfigured() || !db) return null;
  try {
    const mainDocRef = doc(db, 'system_data', 'school_calendar');
    const snapshot = await getDoc(mainDocRef);
    if (snapshot.exists()) {
      return snapshot.data() as FullSystemSnapshot;
    }
    return null;
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
  
  const unsubscribe = onSnapshot(mainDocRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data() as FullSystemSnapshot;
      onUpdate(data);
    }
  }, (error) => {
    console.warn('Firestore subscription warning:', error);
  });

  return unsubscribe;
};

/**
 * Upload full system dataset to Firestore
 */
export const uploadFullStateToFirestore = async (data: FullSystemSnapshot) => {
  if (!isFirestoreConfigured() || !db) return false;
  try {
    const mainDocRef = doc(db, 'system_data', 'school_calendar');
    await setDoc(mainDocRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
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
    const mainDocRef = doc(db, 'system_data', 'school_calendar');
    await setDoc(mainDocRef, { events, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving events to Firestore:', error);
    return false;
  }
};

export const saveDutySchedulesToFirestore = async (dutySchedules: DutySchedule[]) => {
  if (!isFirestoreConfigured() || !db) return false;
  try {
    const mainDocRef = doc(db, 'system_data', 'school_calendar');
    await setDoc(mainDocRef, { dutySchedules, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving duty schedules to Firestore:', error);
    return false;
  }
};

export const saveAnnouncementsToFirestore = async (announcements: Announcement[]) => {
  if (!isFirestoreConfigured() || !db) return false;
  try {
    const mainDocRef = doc(db, 'system_data', 'school_calendar');
    await setDoc(mainDocRef, { announcements, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving announcements to Firestore:', error);
    return false;
  }
};
