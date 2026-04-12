import { buildApiUrl } from "./config";

type SyncGoogleUserParams = {
  email: string;
  firstName: string;
  lastName: string;
  supabaseId: string;
};

export async function syncGoogleUser(params: SyncGoogleUserParams) {
  const res = await fetch(buildApiUrl("/api/sync-google-user"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new Error(data.error || "Unable to sync Google user.");
  }

  return data as {
    id: number | string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    avatarUrl: string | null;
    avatarColor: string;
    token?: string;
  };
}
