import { authFetch } from "./authFetch";
import { buildApiUrl } from "./config";

export const uploadNote = async (
  file: File,
  options?: {
    groupId?: number | string | null;
    groupName?: string | null;
  },
) => {
  try {
    const formData = new FormData();
    formData.append("note", file);

    if (options?.groupId !== undefined && options.groupId !== null && options.groupId !== "") {
      formData.append("groupId", String(options.groupId));
    }

    if (options?.groupName) {
      formData.append("groupName", options.groupName);
    }

    const res = await authFetch(buildApiUrl("/api/notes/upload"), {
      method: "POST",
      body: formData,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    if (!res.ok) {
      return { error: data?.error || "Unable to upload file." };
    }

    return data;
  } catch (err) {
    console.error(err);
    return { error: "Server error" };
  }
};

export const getNotes = async () => {
  try {
    const res = await authFetch(buildApiUrl("/api/notes"));
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch (err) {
    console.error(err);
    return { error: "Server error" };
  }
};

export const chatWithNotes = async (prompt: string, noteIds: Array<string | number>) => {
  try {
    const res = await authFetch(buildApiUrl("/api/notes/chat"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        noteIds,
      }),
    });
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch (err) {
    console.error(err);
    return { error: "Server error" };
  }
};

export const downloadNote = async (id: string) => {
  try {
    const res = await authFetch(buildApiUrl(`/api/notes/${id}/download`));
    if (!res.ok) {
      return null;
    }
    return res.blob();
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const deleteNote = async (id: string) => {
  try {
    const res = await authFetch(buildApiUrl(`/api/notes/${id}`), {
      method: "DELETE"
    });
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch (err) {
    console.error(err);
    return { error: "Server error" };
  }
};
