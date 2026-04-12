import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { supabase } from '../../supabase';
import './Sidebar.css';

// Shared gradient def — rendered once, referenced everywhere
export function GradDefs() {
  return (
    <svg width="0" height="0" style={{position:'absolute'}}>
      <defs>
        <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#5b8dee" />
          <stop offset="50%"  stopColor="#7c5cfc" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Reusable SVG wrapper — uses shared gradient
function SI({ children, size = 22 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {children}
    </svg>
  );
}

export const HomeIcon = ({ size = 22 }: { size?: number }) => (
  <SI size={size}>
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" stroke="url(#sg)" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M9 21V12h6v9" stroke="url(#sg)" strokeWidth="1.8" strokeLinejoin="round"/>
  </SI>
);

export const GroupsIcon = ({ size = 22 }: { size?: number }) => (
  <SI size={size}>
    <circle cx="12" cy="8" r="4" stroke="url(#sg)" strokeWidth="1.8"/>
    <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="url(#sg)" strokeWidth="1.8" strokeLinecap="round"/>
  </SI>
);

export const CalendarIcon = ({ size = 22 }: { size?: number }) => (
  <SI size={size}>
    <rect x="3" y="4" width="18" height="18" rx="3" stroke="url(#sg)" strokeWidth="1.8"/>
    <path d="M3 9h18M8 2v4M16 2v4" stroke="url(#sg)" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M7 13h2M11 13h2M15 13h2M7 17h2M11 17h2" stroke="url(#sg)" strokeWidth="1.8" strokeLinecap="round"/>
  </SI>
);

export const ChatIcon = ({ size = 22 }: { size?: number }) => (
  <SI size={size}>
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="url(#sg)" strokeWidth="1.8" strokeLinejoin="round"/>
  </SI>
);

export const FilesIcon = ({ size = 22 }: { size?: number }) => (
  <SI size={size}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="url(#sg)" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="url(#sg)" strokeWidth="1.8" strokeLinecap="round"/>
  </SI>
);

// White icons for use inside colored buttons
export const ChatIconWhite = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
      stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
  </svg>
);

// Topbar icons — white, no gradient (they sit inside icon-btn)
export const BellIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="url(#sg)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CalendarSmIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="18" rx="3" stroke="url(#sg)" strokeWidth="1.8"/>
    <path d="M3 9h18M8 2v4M16 2v4" stroke="url(#sg)" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const LogoutIcon = () => (
  <SI>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
      stroke="url(#sg)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </SI>
);

const navItems = [
  { id: 'dashboard', Icon: HomeIcon,     label: 'Home',     path: '/dashboard' },
  { id: 'groups',    Icon: GroupsIcon,   label: 'Groups',   path: '/groups'    },
  { id: 'calendar',  Icon: CalendarIcon, label: 'Calendar', path: '/calendar'  },
  { id: 'chats',     Icon: ChatIcon,     label: 'Chats',    path: '/chats'     },
  { id: 'files',     Icon: FilesIcon,    label: 'Files',    path: '/files'     },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  async function doLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth-changed'));
    window.location.assign('/');
  }

  return (
    <div className="sidebar">
      <GradDefs />

      <div className="sidebar-logo" onClick={() => navigate('/dashboard')}>
        <img src={logo} alt="StudyBuddies" />
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ id, Icon, label, path }) => (
          <button
            key={id}
            className={`nav-btn ${location.pathname === path ? 'active' : ''}`}
            onClick={() => navigate(path)}
            title={label}
          >
            <Icon />
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button className="nav-btn logout-btn" onClick={doLogout} title="Log out">
          <LogoutIcon />
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
