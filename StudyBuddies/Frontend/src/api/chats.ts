import type { Chat } from '../types';
import { buildApiUrl } from './config';

const CHATS_API_URL = buildApiUrl('/api/chats');
const USER_SEARCH_API_URL = buildApiUrl('/api/users/search');

type ApiChatMember = {
  userId: number | string;
  username: string;
  displayName?: string;
  email?: string;
  isCreator?: boolean;
  color: string;
  avatarUrl?: string;
};

type ApiChatMessage = {
  id: number;
  sender: string;
  senderDisplayName?: string;
  text: string;
  time: string;
  mine: boolean;
  createdAt?: string;
};

type ApiChat = {
  id: number;
  name: string;
  type: 'direct' | 'group';
  isGroup: boolean;
  createdBy: string;
  color: string;
  members: ApiChatMember[];
  messages: ApiChatMessage[];
  lastMsg: string;
  updatedAt?: string;
  unreadCount?: number;
};

export type ChatSearchUser = {
  id: number | string;
  username: string;
  displayName: string;
  email: string;
  avatarColor: string;
  avatarUrl?: string | null;
};

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('user') || '{}') as {
    id?: number | string;
    email?: string;
  };
}

async function parseResponse(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

function mapChat(chat: ApiChat): Chat {
  return {
    id: Number(chat.id),
    name: chat.name,
    type: chat.type,
    isGroup: chat.isGroup,
    createdBy: chat.createdBy,
    color: chat.color,
    members: chat.members,
    messages: chat.messages,
    lastMsg: chat.lastMsg,
    updatedAt: chat.updatedAt,
    unreadCount: Number(chat.unreadCount || 0),
  };
}

function buildIdentity() {
  const user = getCurrentUser();
  return {
    userId: user.id,
    email: user.email,
  };
}

function buildChatsUrl(type?: 'direct' | 'group') {
  const user = getCurrentUser();
  const params = new URLSearchParams({
    userId: String(user.id ?? ''),
    email: String(user.email ?? ''),
  });

  if (type) {
    params.set('type', type);
  }

  return `${CHATS_API_URL}?${params.toString()}`;
}

export async function fetchChats(type?: 'direct' | 'group') {
  const res = await fetch(buildChatsUrl(type));
  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || 'Unable to load chats.');
  }

  return (data.chats || []).map(mapChat) as Chat[];
}

export async function fetchChat(chatId: number, type?: 'direct' | 'group') {
  const user = getCurrentUser();
  const params = new URLSearchParams({
    userId: String(user.id ?? ''),
    email: String(user.email ?? ''),
  });

  if (type) {
    params.set('type', type);
  }

  const res = await fetch(`${CHATS_API_URL}/${chatId}?${params.toString()}`);
  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || 'Unable to load chat.');
  }

  return mapChat(data.chat) as Chat;
}

export async function searchChatUsers(query: string) {
  const user = getCurrentUser();
  const params = new URLSearchParams({
    query,
    excludeUserId: String(user.id ?? ''),
  });
  const res = await fetch(`${USER_SEARCH_API_URL}?${params.toString()}`);
  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || 'Unable to search users.');
  }

  return (data.users || []) as ChatSearchUser[];
}

export async function createDirectChat(targetEmail: string) {
  const res = await fetch(`${CHATS_API_URL}/direct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...buildIdentity(),
      targetEmail,
    }),
  });
  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || 'Unable to create direct message.');
  }

  return mapChat(data.chat);
}

export async function createGroupChat(payload: { groupId: number }) {
  const res = await fetch(`${CHATS_API_URL}/group`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...buildIdentity(),
      ...payload,
    }),
  });
  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || 'Unable to create group chat.');
  }

  return mapChat(data.chat);
}

export async function sendChatMessage(chatId: number, text: string, type?: 'direct' | 'group') {
  const res = await fetch(`${CHATS_API_URL}/${chatId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...buildIdentity(),
      text,
      type,
    }),
  });
  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || 'Unable to send message.');
  }

  return {
    chat: mapChat(data.chat),
    message: data.message as ApiChatMessage,
  };
}

export async function addChatMembers(chatId: number, usernames: string[]) {
  const res = await fetch(`${CHATS_API_URL}/${chatId}/members`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...buildIdentity(),
      usernames,
    }),
  });
  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || 'Unable to add members.');
  }

  return mapChat(data.chat);
}

export async function leaveGroupChat(chatId: number) {
  const res = await fetch(`${CHATS_API_URL}/${chatId}/leave`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildIdentity()),
  });
  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || 'Unable to leave group chat.');
  }

  return data as { success: boolean };
}

export async function markChatRead(chatId: number, type?: 'direct' | 'group') {
  const res = await fetch(`${CHATS_API_URL}/${chatId}/read`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...buildIdentity(),
      type,
    }),
  });
  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || 'Unable to mark chat as read.');
  }

  return data as { success: boolean };
}

export async function fetchUnreadCount() {
  const user = getCurrentUser();
  const params = new URLSearchParams({
    userId: String(user.id ?? ''),
    email: String(user.email ?? ''),
  });
  const res = await fetch(`${CHATS_API_URL}/unread-count?${params.toString()}`);
  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || 'Unable to load unread count.');
  }

  return Number(data.unreadCount || 0);
}
