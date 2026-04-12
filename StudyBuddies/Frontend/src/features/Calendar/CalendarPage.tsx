import { useState } from 'react';
import { useEvents, EVENT_TYPES, TYPE_COLOR, TYPE_ICON, AppEvent } from '../../context/EventContext';
import { useGroups } from '../../context/GroupsContext';
import './CalendarPage.css';

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function fmt12(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

const emptyForm = () => ({
  title: '',
  date: '',
  startTime: '',
  endTime: '',
  type: 'study',
  for: 'Me',
  description: '',
  location: '',
  groupId: null as number | string | null,
  groupName: null as string | null,
});

export default function CalendarPage() {
  const { events, addEvent, editEvent, markDone } = useEvents();
  const { groups } = useGroups();
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [selected,   setSelected]   = useState<AppEvent | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editMode,   setEditMode]   = useState(false);
  const [form, setForm] = useState(emptyForm());
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }

  function dayStr(day: number) { return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; }

  function getEventsForDay(day: number) {
    return events.filter(e => e.date === dayStr(day)).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  function openCreate(day?: number) {
    setForm({ ...emptyForm(), date: day ? dayStr(day) : '' });
    setEditMode(false);
    setShowCreate(true);
  }

  function openEdit(ev: AppEvent) {
    setForm({
      title: ev.title,
      date: ev.date,
      startTime: ev.startTime,
      endTime: ev.endTime,
      type: ev.type,
      for: ev.groupId ? String(ev.groupId) : 'Me',
      description: ev.description,
      location: ev.location,
      groupId: ev.groupId ?? null,
      groupName: ev.groupName ?? null,
    });
    setEditMode(true);
    setSelected(null);
    setShowCreate(true);
  }

  //TODO: API
  function handleSave() {
    if (!form.title || !form.date || !form.startTime) return;
    const selectedGroup = form.for === 'Me'
      ? null
      : groups.find(group => String(group.id) === String(form.for)) || null;
    const eventPayload = {
      ...form,
      for: selectedGroup?.name || 'Me',
      groupId: selectedGroup?.id ?? null,
      groupName: selectedGroup?.name ?? null,
    };

    if (editMode && selected) {
      editEvent({ ...eventPayload, id: selected.id });
    } else {
      addEvent(eventPayload);
    }
    setShowCreate(false);
    setSelected(null);
  }

  const isToday  = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const todayStr = today.toISOString().slice(0, 10);

  return (
    <div className="cal-wrap">
      <div className="topbar">
        <div className="topbar-left"><h2>Calendar</h2></div>
        <div className="topbar-right">
          <button className="btn-primary" onClick={() => openCreate()}>＋ Create Event</button>
        </div>
      </div>

      <div className="page-scroll">
        <div className="cal-nav">
          <button className="icon-btn" onClick={prevMonth}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="url(#sg)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="cal-month-label">
            <span>{MONTHS[month]}</span>
            <span className="cal-year">{year}</span>
          </div>
          <button className="icon-btn" onClick={nextMonth}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="url(#sg)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="cal-grid">
          {DAYS.map(d => <div key={d} className="cal-day-header">{d}</div>)}
          {cells.map((day, i) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            const isPast    = day ? dayStr(day) < todayStr : false;
            return (
              <div key={i}
                className={`cal-cell ${!day ? 'empty' : ''} ${day && isToday(day) ? 'today' : ''} ${isPast ? 'past' : ''}`}
                onClick={() => day && !isPast && openCreate(day)}>
                {day && (
                  <>
                    <span className="cal-date">{day}</span>
                    <div className="cal-events">
                      {dayEvents.slice(0, 3).map(ev => (
                        <div key={ev.id} className="cal-event-chip"
                          style={{ borderLeftColor: TYPE_COLOR[ev.type] }}
                          onClick={e => { e.stopPropagation(); setSelected(ev); }}>
                          <span style={{ color: TYPE_COLOR[ev.type], fontSize: '10px' }}>{TYPE_ICON[ev.type]}</span>
                          {fmt12(ev.startTime)} {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && <div className="cal-more">+{dayEvents.length - 3}</div>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editMode ? 'Edit Event' : 'Create Event'}</h3>
              <button className="icon-btn" onClick={() => setShowCreate(false)}>✕</button>
            </div>

            <div className="field">
              <label>Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Event title" autoFocus/>
            </div>

            <div className="field">
              <label>Type</label>
              <div className="icon-picker">
                {EVENT_TYPES.map(t => (
                  <button key={t.value} type="button"
                    className={`icon-chip ${form.type === t.value ? 'selected' : ''}`}
                    style={form.type === t.value ? { borderColor: t.color, background: `${t.color}22`, color: t.color, transform: 'scale(1.15)' } : {}}
                    onClick={() => setForm({ ...form, type: t.value })}
                    title={t.value}>
                    {t.icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Date *</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}/>
              </div>
              <div className="field">
                <label>For</label>
                <select value={form.for} onChange={e => setForm({ ...form, for: e.target.value })}>
                  <option value="Me">Just me</option>
                  {groups.map(group => (
                    <option key={group.id} value={String(group.id)}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Start Time *</label>
                <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })}/>
              </div>
              <div className="field">
                <label>End Time</label>
                <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })}/>
              </div>
            </div>

            <div className="field">
              <label>Location</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Room, Discord, Zoom..."/>
            </div>

            <div className="field">
              <label>Notes</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional..."/>
            </div>

            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>{editMode ? 'Save Changes' : 'Create Event'}</button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-event-header">
                <span className="modal-event-icon" style={{ color: TYPE_COLOR[selected.type] }}>{TYPE_ICON[selected.type]}</span>
                <h3>{selected.title}</h3>
              </div>
              <button className="icon-btn" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="event-detail-list">
              {[
                { label: 'Date',     value: selected.date },
                { label: 'Time',     value: fmt12(selected.startTime) + (selected.endTime ? ` – ${fmt12(selected.endTime)}` : '') },
                { label: 'For',      value: selected.for },
                ...(selected.location    ? [{ label: 'Location', value: selected.location    }] : []),
                ...(selected.description ? [{ label: 'Notes',    value: selected.description }] : []),
              ].map((r, i) => (
                <div key={i} className="event-detail-row">
                  <span className="event-detail-label">{r.label}</span>
                  <span className="event-detail-value">{r.value}</span>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn-ghost btn-mark-done" onClick={() => { markDone(selected.id); setSelected(null); }}>✓ Mark Done</button>
              <button className="btn-ghost" onClick={() => { setSelected(ev => ev); openEdit(selected); }}>Edit</button>
              <button className="btn-ghost" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
