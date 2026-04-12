import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchProfile, saveProfile } from '../api/profile';

const COLORS = ['#3a7bd5','#7c5cfc','#2dd4d4','#e05c7a','#f0a050','#3ecf8e','#a78bfa','#5b8dee'];
function randomColor() { return COLORS[Math.floor(Math.random()*COLORS.length)]; }
function readStoredUser() { return JSON.parse(localStorage.getItem('user')||'{}'); }
function getFallbackDisplayName(user: { displayName?: string; firstName?: string; email?: string }) {
  return user.displayName || user.firstName || user.email?.split('@')[0] || 'User';
}

export interface UserProfile {
  displayName: string;
  avatarUrl:   string | null;
  avatarColor: string;
}

interface UserCtx {
  profile: UserProfile;
  updateProfile: (p:Partial<UserProfile>) => Promise<void>;
  loadingProfile: boolean;
}

const UserContext = createContext<UserCtx>({
  profile:{displayName:'',avatarUrl:null,avatarColor:COLORS[0]},
  updateProfile:async()=>{},
  loadingProfile: true,
});

export function UserProvider({children}:{children:ReactNode}) {
  const [storageVersion, setStorageVersion] = useState(0);
  const storedUser = readStoredUser();

  useEffect(() => {
    function syncFromStorage() {
      setStorageVersion(version => version + 1);
    }

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('auth-changed', syncFromStorage);

    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('auth-changed', syncFromStorage);
    };
  }, []);

  const [profile, setProfile] = useState<UserProfile>({
    displayName: getFallbackDisplayName(storedUser),
    avatarUrl:   storedUser.avatarUrl || null,
    avatarColor: storedUser.avatarColor || randomColor(),
  });
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!storedUser.id && !storedUser.email) {
        setProfile({
          displayName: '',
          avatarUrl: null,
          avatarColor: COLORS[0],
        });
        setLoadingProfile(false);
        return;
      }

      try {
        const savedProfile = await fetchProfile();
        if (!isMounted) return;

        setProfile({
          displayName: getFallbackDisplayName(savedProfile),
          avatarUrl: savedProfile.avatarUrl,
          avatarColor: savedProfile.avatarColor || profile.avatarColor,
        });

        localStorage.setItem('user', JSON.stringify({
          ...storedUser,
          ...savedProfile,
        }));
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [storedUser.id, storedUser.email, storageVersion]);

  async function updateProfile(p:Partial<UserProfile>) {
    const latestStoredUser = readStoredUser();
    const nextProfile = { ...profile, ...p };
    const savedProfile = await saveProfile({
      displayName: nextProfile.displayName,
      avatarUrl: nextProfile.avatarUrl,
      avatarColor: nextProfile.avatarColor,
    });

    setProfile({
      displayName: getFallbackDisplayName(savedProfile),
      avatarUrl: savedProfile.avatarUrl,
      avatarColor: savedProfile.avatarColor || nextProfile.avatarColor,
    });

    localStorage.setItem('user', JSON.stringify({
      ...latestStoredUser,
      ...savedProfile,
    }));
    window.dispatchEvent(new Event('auth-changed'));
  }

  return <UserContext.Provider value={{profile,updateProfile,loadingProfile}}>{children}</UserContext.Provider>;
}

export function useUser() { return useContext(UserContext); }

export { COLORS as AVATAR_COLORS, randomColor };
