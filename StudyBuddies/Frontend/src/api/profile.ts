import { buildApiUrl } from "./config";

const PROFILE_API_URL = buildApiUrl("/api/profile");

type ProfileIdentity = {
  userId?: number | string;
  email?: string;
};

export type SavedProfile = {
  id: number | string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl: string | null;
  avatarColor: string;
};

function getStoredUser() {
  return JSON.parse(localStorage.getItem("user") || "{}") as Partial<SavedProfile>;
}

function getIdentity(identity?: ProfileIdentity) {
  const storedUser = getStoredUser();
  return {
    userId: identity?.userId ?? storedUser.id,
    email: identity?.email ?? storedUser.email,
  };
}

async function parseResponse(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

function buildProfileUrl(identity?: ProfileIdentity) {
  const user = getIdentity(identity);
  return `${PROFILE_API_URL}?userId=${encodeURIComponent(String(user.userId ?? ""))}&email=${encodeURIComponent(String(user.email ?? ""))}`;
}

export async function fetchProfile(identity?: ProfileIdentity) {
  const res = await fetch(buildProfileUrl(identity));
  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || "Unable to load profile.");
  }

  return data as SavedProfile;
}

export async function saveProfile(profile: {
  displayName: string;
  avatarUrl: string | null;
  avatarColor: string;
}) {
  const user = getIdentity();
  const res = await fetch(PROFILE_API_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...user,
      ...profile,
    }),
  });
  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || "Unable to save profile.");
  }

  return data as SavedProfile;
}

export async function uploadProfileAvatar(file: File) {
  const user = getIdentity();
  const formData = new FormData();
  formData.append("avatar", file);
  formData.append("userId", String(user.userId ?? ""));
  formData.append("email", String(user.email ?? ""));

  const res = await fetch(`${PROFILE_API_URL}/avatar`, {
    method: "POST",
    body: formData,
  });
  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || "Unable to upload avatar.");
  }

  return data as { avatarUrl: string };
}
