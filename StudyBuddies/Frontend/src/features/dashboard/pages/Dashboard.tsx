import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarSmIcon } from '../../../components/layout/Sidebar';
import { fetchUnreadCount } from '../../../api/chats';
import { useGroups } from '../../../context/GroupsContext';
import { useEvents, TYPE_COLOR, TYPE_ICON } from '../../../context/EventContext';
import { useUser } from '../../../context/UserContext';
import { Avatar } from '../../../components/Avatar';
import './Dashboard.css';

function fmt12(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function dayLabel(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { events, markDone } = useEvents();
  const { groups } = useGroups();
  const { profile } = useUser();

  const [selectedEvent, setSelectedEvent] = useState<typeof events[0] | null>(null);
  const [showTodo, setShowTodo] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const ud = JSON.parse(localStorage.getItem('user') || '{}');
  const firstName = profile.displayName || ud.firstName || ud.email?.split('@')[0] || 'there';
  const avatarLetter = firstName[0]?.toUpperCase() || 'U';

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const grouped = new Map<string, typeof events>();
  sorted.forEach((e) => {
    if (!grouped.has(e.date)) grouped.set(e.date, []);
    grouped.get(e.date)!.push(e);
  });

  const in7 = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  })();
  const today = new Date().toISOString().slice(0, 10);
  const todoEvents = sorted.filter((e) => e.date >= today && e.date <= in7);

  useEffect(() => {
    let mounted = true;

    async function loadUnreadCount() {
      try {
        const count = await fetchUnreadCount();
        if (mounted) {
          setUnreadMessages(count);
        }
      } catch {
        if (mounted) {
          setUnreadMessages(0);
        }
      }
    }

    void loadUnreadCount();
    const handleRefresh = () => {
      void loadUnreadCount();
    };
    const intervalId = window.setInterval(() => {
      void loadUnreadCount();
    }, 5000);
    window.addEventListener('focus', handleRefresh);
    document.addEventListener('visibilitychange', handleRefresh);
    window.addEventListener('chat-unread-changed', handleRefresh);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleRefresh);
      window.removeEventListener('chat-unread-changed', handleRefresh);
    };
  }, []);

  return (
    <div className="dash-wrap">
      <div className="topbar">
        <div className="topbar-left">
          <Avatar letter={avatarLetter} color={profile.avatarColor} url={profile.avatarUrl} size={32} />
          <h2 className="topbar-title">
            Hey, <span className="grad-name">{firstName}!</span>
          </h2>
        </div>
        <div className="topbar-right">
          <div className="notif-btn-wrap">
            <button
              className={`icon-btn ${showTodo ? 'active-btn' : ''}`}
              onClick={() => setShowTodo(!showTodo)}
              title="To-do list"
            >
              <CalendarSmIcon size={17} />
            </button>
            {todoEvents.length > 0 && <span className="notif-badge">{todoEvents.length}</span>}
          </div>
        </div>
      </div>

      {showTodo && (
        <>
          <div className="dropdown-backdrop" onClick={() => setShowTodo(false)} />
          <div className="dropdown-panel">
            <div className="dropdown-header">This Week</div>
            {todoEvents.length === 0 && <div className="dropdown-empty">Nothing due this week</div>}
            {todoEvents.map((e) => (
              <div key={e.id} className="dropdown-item todo-item">
                <span style={{ color: TYPE_COLOR[e.type], fontSize: '15px' }}>{TYPE_ICON[e.type]}</span>
                <div className="todo-event-info">
                  <div className="dropdown-text">{e.title}</div>
                  <div className="dropdown-time">{dayLabel(e.date)} · {fmt12(e.startTime)}</div>
                </div>
                <button
                  className="done-chip"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    markDone(e.id);
                  }}
                >
                  ✓ Done
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="page-scroll">
        <div className="stats-row">
          {[
            { num: events.length, label: 'Upcoming Events' },
            { num: groups.length, label: 'Study Groups' },
            { num: unreadMessages, label: 'Unread Messages' },
            { num: todoEvents.length, label: 'Due This Week' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-num">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="section-title">Upcoming Events</div>

        <div className="events-list">
          {grouped.size === 0 && <div className="empty-events">No upcoming events...</div>}
          {Array.from(grouped.entries()).map(([dateStr, evs]) => (
            <div key={dateStr} className="day-group">
              <div className="day-label">{dayLabel(dateStr)}</div>
              {evs.map((event) => (
                <div key={event.id} className="event-row">
                  <span className="event-type-icon" style={{ color: TYPE_COLOR[event.type] }}>
                    {TYPE_ICON[event.type]}
                  </span>
                  <div className="event-info" onClick={() => setSelectedEvent(event)}>
                    <div className="event-title">{event.title}</div>
                    {event.for !== 'Me' && <div className="event-group">{event.for}</div>}
                  </div>
                  <div className="event-time">{fmt12(event.startTime)}</div>
                  <button className="done-chip" onClick={() => markDone(event.id)}>
                    ✓ Mark As Done
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-event-header">
                <span className="modal-event-icon" style={{ color: TYPE_COLOR[selectedEvent.type] }}>
                  {TYPE_ICON[selectedEvent.type]}
                </span>
                <h3>{selectedEvent.title}</h3>
              </div>
              <button className="icon-btn" onClick={() => setSelectedEvent(null)}>✕</button>
            </div>
            <div className="event-detail-body">
              {[
                { label: 'Date', value: dayLabel(selectedEvent.date) },
                { label: 'Time', value: fmt12(selectedEvent.startTime) + (selectedEvent.endTime ? ` – ${fmt12(selectedEvent.endTime)}` : '') },
                ...(selectedEvent.for !== 'Me' ? [{ label: 'For', value: selectedEvent.for }] : []),
                ...(selectedEvent.location ? [{ label: 'Location', value: selectedEvent.location }] : []),
                ...(selectedEvent.description ? [{ label: 'Notes', value: selectedEvent.description }] : []),
              ].map((r, i) => (
                <div key={i} className="event-detail-row">
                  <span className="detail-label">{r.label}</span>
                  <span>{r.value}</span>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button
                className="btn-ghost danger-ghost"
                onClick={() => {
                  markDone(selectedEvent.id);
                  setSelectedEvent(null);
                }}
              >
                ✓ Mark Done
              </button>
              <button
                className="btn-ghost"
                onClick={() => {
                  setSelectedEvent(null);
                  navigate('/calendar');
                }}
              >
                View in Calendar
              </button>
              <button className="btn-ghost" onClick={() => setSelectedEvent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
