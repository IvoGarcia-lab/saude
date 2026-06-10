'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

export interface CalendarEvent {
  id?: string;
  title: string;
  type: 'workout' | 'meal' | 'water' | 'assessment' | 'rest';
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:MM
  description?: string;
  completed?: boolean;
}

interface EventsContextType {
  events: CalendarEvent[];
  loading: boolean;
  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: CalendarEvent) => Promise<void>;
  addEvents: (events: CalendarEvent[]) => Promise<void>;
  deleteEvent: (eventId?: string, localIndex?: number) => Promise<void>;
  toggleEventCompleted: (event: CalendarEvent, localIndex: number) => void;
  refreshEvents: () => Promise<void>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

const STORAGE_KEY = 'demo_events';

function generateId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Read events from localStorage, ensuring all entries have IDs and completed field */
function readLocalEvents(): CalendarEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((e: any, idx: number) => ({
      ...e,
      id: e.id || `migrated-${idx}-${generateId()}`,
      completed: Boolean(e.completed),
    }));
  } catch {
    return [];
  }
}

/** Write events to localStorage */
function writeLocalEvents(events: CalendarEvent[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (err) {
    console.error('Failed to write events to localStorage:', err);
  }
}

export function EventsProvider({ children }: { children: ReactNode }) {
  const { user: firebaseUser, isDemo, loading: authLoading } = useAuth();
  const [events, setEventsState] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // ─── Core setter: updates React state AND localStorage ───
  const setEvents = useCallback((newEvents: CalendarEvent[]) => {
    setEventsState(newEvents);
    writeLocalEvents(newEvents);
  }, []);

  // ─── Initial load: localStorage first, then optionally Firestore ───
  const refreshEvents = useCallback(async () => {
    // 1. Always start from localStorage (instant, offline-safe)
    const localEvents = readLocalEvents();

    if (isDemo || !firebaseUser) {
      if (localEvents.length > 0) {
        setEventsState(localEvents);
      }
      // Don't overwrite localStorage if it's empty — the caller will add defaults
      setInitialized(true);
      return;
    }

    // 2. Try Firestore for logged-in users
    setLoading(true);
    try {
      const { getFirebaseDb } = await import('@/lib/firebase');
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const db = getFirebaseDb();
      const q = query(
        collection(db, 'events'),
        where('userId', '==', firebaseUser.uid)
      );
      const snapshot = await getDocs(q);
      const firestoreEvents: CalendarEvent[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        firestoreEvents.push({
          id: doc.id,
          title: data.title,
          type: data.type,
          dateStr: data.dateStr,
          timeStr: data.timeStr,
          description: data.description || '',
          completed: Boolean(data.completed),
        });
      });

      // 3. Merge: Firestore events + localStorage `completed` overrides
      //    localStorage is the source of truth for `completed` because
      //    Firestore updates may fail or lag behind.
      const localCompletedMap = new Map<string, boolean>();
      localEvents.forEach(le => {
        // Build lookup by multiple keys
        if (le.id) localCompletedMap.set(le.id, Boolean(le.completed));
        const compositeKey = `${le.title}|${le.dateStr}|${le.timeStr}`;
        localCompletedMap.set(compositeKey, Boolean(le.completed));
      });

      const merged: CalendarEvent[] = firestoreEvents.map(fe => {
        // Check if localStorage has a more recent completed status
        const byId = fe.id ? localCompletedMap.get(fe.id) : undefined;
        const compositeKey = `${fe.title}|${fe.dateStr}|${fe.timeStr}`;
        const byComposite = localCompletedMap.get(compositeKey);
        const localCompleted = byId ?? byComposite;

        // If localStorage says completed, trust it (user toggled it)
        if (localCompleted === true && !fe.completed) {
          return { ...fe, completed: true };
        }
        return fe;
      });

      // 4. Add local-only events (not in Firestore)
      localEvents.forEach(le => {
        const existsInFirestore = merged.some(fe =>
          fe.id === le.id ||
          (fe.title === le.title && fe.dateStr === le.dateStr && fe.timeStr === le.timeStr)
        );
        if (!existsInFirestore) {
          merged.push(le);
        }
      });

      setEventsState(merged);
      writeLocalEvents(merged);
    } catch (err) {
      console.error('Firestore fetch failed, using localStorage:', err);
      setEventsState(localEvents);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [firebaseUser, isDemo]);

  // ─── Mount: load events on auth change ───
  useEffect(() => {
    if (!authLoading) {
      refreshEvents();
    }
  }, [refreshEvents, authLoading]);

  // ─── Add a single event ───
  const addEvent = useCallback(async (event: CalendarEvent) => {
    const eventWithId: CalendarEvent = {
      ...event,
      id: event.id || generateId(),
      completed: event.completed ?? false,
    };

    setEventsState(prev => {
      const updated = [...prev, eventWithId];
      writeLocalEvents(updated);
      return updated;
    });

    // Fire-and-forget Firestore sync
    if (!isDemo && firebaseUser) {
      try {
        const { getFirebaseDb } = await import('@/lib/firebase');
        const { doc, setDoc } = await import('firebase/firestore');
        const db = getFirebaseDb();
        await setDoc(doc(db, 'events', eventWithId.id!), {
          ...eventWithId,
          userId: firebaseUser.uid,
          createdAt: new Date(),
        });
      } catch (err) {
        console.error('Firestore addEvent failed (data saved locally):', err);
      }
    }
  }, [firebaseUser, isDemo]);

  // ─── Add multiple events (batch) ───
  const addEvents = useCallback(async (newEvents: CalendarEvent[]) => {
    const eventsWithIds = newEvents.map(e => ({
      ...e,
      id: e.id || generateId(),
      completed: e.completed ?? false,
    }));

    setEventsState(prev => {
      const updated = [...prev, ...eventsWithIds];
      writeLocalEvents(updated);
      return updated;
    });

    // Fire-and-forget Firestore sync
    if (!isDemo && firebaseUser) {
      try {
        const { getFirebaseDb } = await import('@/lib/firebase');
        const { doc, setDoc } = await import('firebase/firestore');
        const db = getFirebaseDb();
        for (const ev of eventsWithIds) {
          await setDoc(doc(db, 'events', ev.id!), {
            ...ev,
            userId: firebaseUser.uid,
            createdAt: new Date(),
          });
        }
      } catch (err) {
        console.error('Firestore addEvents failed (data saved locally):', err);
      }
    }
  }, [firebaseUser, isDemo]);

  // ─── Delete an event ───
  const deleteEvent = useCallback(async (eventId?: string, localIndex?: number) => {
    setEventsState(prev => {
      let updated: CalendarEvent[];
      if (eventId) {
        updated = prev.filter(e => e.id !== eventId);
      } else if (localIndex !== undefined) {
        updated = prev.filter((_, idx) => idx !== localIndex);
      } else {
        return prev;
      }
      writeLocalEvents(updated);
      return updated;
    });

    // Fire-and-forget Firestore sync
    if (!isDemo && firebaseUser && eventId) {
      try {
        const { getFirebaseDb } = await import('@/lib/firebase');
        const { doc, deleteDoc } = await import('firebase/firestore');
        const db = getFirebaseDb();
        await deleteDoc(doc(db, 'events', eventId));
      } catch (err) {
        console.error('Firestore deleteEvent failed (deleted locally):', err);
      }
    }
  }, [firebaseUser, isDemo]);

  // ─── Toggle completed status ───
  const toggleEventCompleted = useCallback((event: CalendarEvent, localIndex: number) => {
    const newCompleted = !event.completed;

    setEventsState(prev => {
      const updated = prev.map((e, idx) => {
        if ((event.id && e.id === event.id) || idx === localIndex) {
          return { ...e, completed: newCompleted };
        }
        return e;
      });
      writeLocalEvents(updated);
      return updated;
    });

    // Fire-and-forget Firestore sync
    if (!isDemo && firebaseUser && event.id) {
      (async () => {
        try {
          const { getFirebaseDb } = await import('@/lib/firebase');
          const { doc, updateDoc } = await import('firebase/firestore');
          const db = getFirebaseDb();
          await updateDoc(doc(db, 'events', event.id!), {
            completed: newCompleted,
          });
        } catch (err) {
          console.error('Firestore toggle failed (saved locally):', err);
        }
      })();
    }
  }, [firebaseUser, isDemo]);

  return (
    <EventsContext.Provider
      value={{
        events,
        loading,
        setEvents,
        addEvent,
        addEvents,
        deleteEvent,
        toggleEventCompleted,
        refreshEvents,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
}
