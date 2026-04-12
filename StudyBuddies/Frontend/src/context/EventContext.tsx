import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { createEvent, deleteEvent, getEvents, updateEvent } from "../api/event";
import type { AppEvent } from "../types";

export type { AppEvent };

export const EVENT_TYPES = [
  { value: "group", icon: "\u25C7", color: "#a78bfa" },
  { value: "study", icon: "\u25CE", color: "#2dd4d4" },
  { value: "exam", icon: "\u26A0", color: "#e05c7a" },
  { value: "deadline", icon: "\u23F1", color: "#f0a050" },
];

export const TYPE_COLOR: Record<string, string> = Object.fromEntries(EVENT_TYPES.map((typeOption) => [typeOption.value, typeOption.color]));
export const TYPE_ICON: Record<string, string> = Object.fromEntries(EVENT_TYPES.map((typeOption) => [typeOption.value, typeOption.icon]));

type EventInput = Omit<AppEvent, "id">;

interface EventCtx {
  events: AppEvent[];
  loadingEvents: boolean;
  eventsError: string;
  refreshEvents: () => Promise<AppEvent[]>;
  addEvent: (event: EventInput) => Promise<AppEvent>;
  editEvent: (event: AppEvent) => Promise<AppEvent>;
  removeEvent: (id: number | string) => Promise<void>;
  markDone: (id: number | string) => Promise<void>;
}

const EventContext = createContext<EventCtx>({
  events: [],
  loadingEvents: true,
  eventsError: "",
  refreshEvents: async () => [],
  addEvent: async () => {
    throw new Error("Event context is unavailable.");
  },
  editEvent: async () => {
    throw new Error("Event context is unavailable.");
  },
  removeEvent: async () => {},
  markDone: async () => {},
});

function sortEvents(events: AppEvent[]) {
  return [...events].sort((left, right) => left.date.localeCompare(right.date) || left.startTime.localeCompare(right.startTime));
}

export function EventProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState("");
  const [storageVersion, setStorageVersion] = useState(0);
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}") as {
    id?: number | string;
    email?: string;
  };
  const hasIdentity = Boolean(storedUser.id || storedUser.email);

  useEffect(() => {
    function syncFromStorage() {
      setStorageVersion((version) => version + 1);
    }

    window.addEventListener("storage", syncFromStorage);
    window.addEventListener("auth-changed", syncFromStorage);

    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener("auth-changed", syncFromStorage);
    };
  }, []);

  const refreshEvents = useCallback(async () => {
    if (!hasIdentity) {
      setEvents([]);
      setEventsError("");
      setLoadingEvents(false);
      return [];
    }

    setLoadingEvents(true);
    setEventsError("");

    try {
      const nextEvents = await getEvents();
      const sortedEvents = sortEvents(nextEvents);
      setEvents(sortedEvents);
      return sortedEvents;
    } catch (error) {
      setEventsError(error instanceof Error ? error.message : "Unable to load events.");
      return [];
    } finally {
      setLoadingEvents(false);
    }
  }, [hasIdentity, storageVersion]);

  useEffect(() => {
    void refreshEvents();
  }, [refreshEvents]);

  useEffect(() => {
    if (!hasIdentity) {
      return;
    }

    const handleRefresh = () => {
      void refreshEvents();
    };

    const intervalId = window.setInterval(() => {
      void refreshEvents();
    }, 10000);

    window.addEventListener("focus", handleRefresh);
    document.addEventListener("visibilitychange", handleRefresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleRefresh);
      document.removeEventListener("visibilitychange", handleRefresh);
    };
  }, [hasIdentity, refreshEvents]);

  const addEvent = useCallback(async (event: EventInput) => {
    setEventsError("");
    const createdEvent = await createEvent(event);
    setEvents((prev) => sortEvents([...prev, createdEvent]));
    return createdEvent;
  }, []);

  const editEvent = useCallback(async (event: AppEvent) => {
    setEventsError("");
    const updatedEvent = await updateEvent(event.id, {
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      type: event.type,
      for: event.for,
      description: event.description,
      location: event.location,
      groupId: event.groupId ?? null,
      groupName: event.groupName ?? null,
    });
    setEvents((prev) => sortEvents(prev.map((current) => (String(current.id) === String(updatedEvent.id) ? updatedEvent : current))));
    return updatedEvent;
  }, []);

  const removeEvent = useCallback(async (id: number | string) => {
    setEventsError("");
    await deleteEvent(id);
    setEvents((prev) => prev.filter((event) => String(event.id) !== String(id)));
  }, []);

  const markDone = useCallback(async (id: number | string) => {
    await removeEvent(id);
  }, [removeEvent]);

  return (
    <EventContext.Provider value={{ events, loadingEvents, eventsError, refreshEvents, addEvent, editEvent, removeEvent, markDone }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  return useContext(EventContext);
}
