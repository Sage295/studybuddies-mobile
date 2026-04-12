export interface Message {
  id: number;
  sender: string;
  senderDisplayName?: string;
  text: string;
  time: string;
  mine: boolean;
  createdAt?: string;
}

export interface Chat {
  id: number;
  name: string;
  type?: 'direct' | 'group';
  isGroup: boolean;
  createdBy: string;
  members: Member[];
  color: string;
  messages: Message[];
  lastMsg: string;
  updatedAt?: string;
  unreadCount?: number;
}

export interface Member {
  userId?: number | string;
  username: string;
  displayName?: string;
  email?: string;
  isCreator?: boolean;
  color: string;
  avatarUrl?: string;
}

export interface Group {
  id: number;
  name: string;
  createdBy: string;
  color: string;
  avatarUrl?: string;
  members: Member[];
  events: { title: string; date: string; time: string }[];
}

export interface FileItem {
  id: number | string;
  name: string;
  type: string;
  size: string;
  group: string | null;
  uploaded: string;
  content?: string;
  summary?: string;
}

export interface Notification {
  id: number;
  text: string;
  time: string;
  type: string;
}

export interface AppEvent {
  id: number | string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  for: string;
  description: string;
  location: string;
  groupId?: number | string | null;
  groupName?: string | null;
}
