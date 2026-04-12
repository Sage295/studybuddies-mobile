import type { AppEvent } from "../types";
import { authFetch } from "./authFetch";
import { buildApiUrl } from "./config";

type EventInput = Omit<AppEvent, "id">;

type ApiEvent = {
  _id?: string;
  id?: string | number;
  title?: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  forLabel?: string;
  groupId?: string | number | null;
  groupName?: string | null;
  eventType?: string;
  location?: string;
};

async function parseResponse(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

function normalizeTime(value?: string) {
  if (!value) {
    return "";
  }

  if (/^\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function normalizeDate(value?: string) {
  if (!value) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function mapEvent(event: ApiEvent): AppEvent {
  return {
    id: event._id ?? event.id ?? Date.now(),
    title: String(event.title || "").trim(),
    date: normalizeDate(event.date),
    startTime: normalizeTime(event.startTime),
    endTime: normalizeTime(event.endTime),
    type: String(event.eventType || "study"),
    for: String(event.forLabel || "Me"),
    description: String(event.description || ""),
    location: String(event.location || ""),
    groupId: event.groupId ?? null,
    groupName: event.groupName ?? null,
  };
}

function toApiPayload(eventData: EventInput) {
  return {
    title: eventData.title,
    description: eventData.description,
    date: eventData.date,
    startTime: eventData.startTime,
    endTime: eventData.endTime,
    forLabel: eventData.for,
    groupId: eventData.groupId ?? null,
    groupName: eventData.groupName ?? null,
    location: eventData.location,
    eventType: eventData.type,
  };
}

export async function createEvent(eventData: EventInput) {
  const res = await authFetch(buildApiUrl("/api/events"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toApiPayload(eventData)),
  });
  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || "Unable to create event.");
  }

  return mapEvent(data.event);
}

export async function getEvents(filters?: {
  start?: string;
  end?: string;
  eventType?: string;
  forLabel?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.start) params.set("start", filters.start);
  if (filters?.end) params.set("end", filters.end);
  if (filters?.eventType) params.set("eventType", filters.eventType);
  if (filters?.forLabel) params.set("forLabel", filters.forLabel);

  const query = params.toString();
  const res = await authFetch(buildApiUrl(`/api/events${query ? `?${query}` : ""}`));
  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || "Unable to load events.");
  }

  return (data.events || []).map(mapEvent) as AppEvent[];
}

export async function updateEvent(id: string | number, eventData: EventInput) {
  const res = await authFetch(buildApiUrl(`/api/events/${id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toApiPayload(eventData)),
  });
  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || "Unable to update event.");
  }

  return mapEvent(data.event);
}

export async function deleteEvent(id: string | number) {
  const res = await authFetch(buildApiUrl(`/api/events/${id}`), {
    method: "DELETE",
  });
  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || "Unable to delete event.");
  }
}
