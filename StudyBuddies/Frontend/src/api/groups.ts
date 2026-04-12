import type { Group } from '../types';
import { buildApiUrl } from './config';

const GROUPS_API_URL = buildApiUrl('/api/groups');

type ApiMember = {
  userId: number | string;
  username: string;
  displayName?: string;
  email?: string;
  isCreator?: boolean;
  color: string;
  avatarUrl?: string;
};

type ApiGroup = {
  id?: number;
  GroupID?: number;
  name?: string;
  Name?: string;
  createdBy?: string;
  CreatedByUserId?: number | string;
  color?: string;
  Color?: string;
  avatarUrl?: string;
  AvatarUrl?: string;
  members?: ApiMember[];
  Members?: ApiMember[];
  events?: { title: string; date: string; time: string }[];
  Events?: { title: string; date: string; time: string }[];
};

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('user') || '{}') as {
    id?: number | string;
    email?: string;
    token?: string;
  };
}

function buildGroupsQuery(user: { id?: number | string; email?: string }) {
  return `${GROUPS_API_URL}?userId=${encodeURIComponent(String(user.id ?? ''))}&email=${encodeURIComponent(String(user.email ?? ''))}`;
}

function getAuthHeaders() {
  const token = getCurrentUser().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function mapGroup(group: ApiGroup): Group {
  return {
    id: Number(group.GroupID ?? group.id ?? Date.now()),
    name: group.Name ?? group.name ?? 'Untitled Group',
    createdBy: String(group.CreatedByUserId ?? group.createdBy ?? ''),
    color: group.Color ?? group.color ?? '#7c5cfc',
    avatarUrl: group.AvatarUrl ?? group.avatarUrl,
    members: (group.Members ?? group.members ?? []).map(member => ({
      username: member.username,
      displayName: member.displayName,
      email: member.email,
      isCreator: member.isCreator,
      color: member.color,
      avatarUrl: member.avatarUrl,
    })),
    events: group.Events ?? group.events ?? [],
  };
}

async function parseResponse(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export async function fetchGroups() {
  const user = getCurrentUser();
  const res = await fetch(buildGroupsQuery(user), {
    headers: getAuthHeaders(),
  });
  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || 'Unable to load groups.');
  }

  return (data.groups || []).map(mapGroup) as Group[];
}

export async function createGroup(payload: {
  name: string;
  color: string;
  avatarUrl?: string;
  memberEmails: string[];
}) {
  const user = getCurrentUser();
  const res = await fetch(GROUPS_API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      userId: user.id,
      email: user.email,
      ...payload,
    }),
  });
  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || 'Unable to create group.');
  }

  return mapGroup(data.group);
}

export async function addGroupMembers(groupId: number, memberEmails: string[]) {
  const user = getCurrentUser();
  const res = await fetch(`${GROUPS_API_URL}/${groupId}/members`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      userId: user.id,
      memberEmails,
    }),
  });
  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || 'Unable to add members.');
  }

  return mapGroup(data.group);
}

export async function removeGroupMember(groupId: number, memberEmail: string) {
  const user = getCurrentUser();
  const res = await fetch(`${GROUPS_API_URL}/${groupId}/members`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      userId: user.id,
      memberEmail,
    }),
  });
  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || 'Unable to remove member.');
  }

  return mapGroup(data.group);
}

export async function leaveGroup(groupId: number) {
  const user = getCurrentUser();
  const res = await fetch(`${GROUPS_API_URL}/${groupId}/leave`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      userId: user.id,
      email: user.email,
    }),
  });
  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || 'Unable to leave group.');
  }
}
