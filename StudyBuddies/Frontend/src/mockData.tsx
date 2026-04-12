/*=======================================================================
ALL MOCK DATA IS HERE
API PEOPLE - REPLACE WITH ACTUAL API CALLS
IF THERE IS A FEATURE YOU DON'T WANNA IMPLEMENT AND IT'S UNNECESSARY FEEL FREE TO CUT IT
=======================================================================*/
import type { Chat, Group, FileItem, Notification, AppEvent } from './types';

const todayStr = () => new Date().toISOString().slice(0, 10);

//EVENTS
//TODO: Replace with API
export const INITIAL_EVENTS: AppEvent[] = [
  { id: 1, title: 'COP 4331 Meeting', date: todayStr(), startTime: '14:00', endTime: '15:00', type: 'group',   for: 'COP 4331', description: 'test', location: 'Discord'          },
  { id: 2, title: 'Study Time',        date: todayStr(), startTime: '17:30', endTime: '19:00', type: 'study',   for: 'COP 4331', description: 'AAA',  location: 'Your moms house'  },
];

//CHATS
//TODO: Replace with API
export const INITIAL_CHATS: Chat[] = [
  {
    id: 1, name: 'COP 4331', type: 'group', isGroup: true, createdBy: '1', color: '#7c5cfc',
    members: [
      { userId: 1, username: 'penishead', displayName: 'Penis Head', color: '#7c5cfc' },
      { userId: 2, username: 'asas', displayName: 'Asas', color: '#3a7bd5' },
      { userId: 3, username: 'f', displayName: 'F', color: '#2dd4d4' },
    ],
    lastMsg: 'test3',
    messages: [
      { id: 1, sender: 'penis head', text: 'test1',  time: '2:10 PM', mine: false },
      { id: 2, sender: 'you',        text: 'test2',  time: '2:12 PM', mine: true  },
      { id: 3, sender: 'f',          text: 'test3',  time: '2:15 PM', mine: false },
    ],
  },
  {
    id: 2, name: 'penis head', type: 'direct', isGroup: false, createdBy: '1', color: '#3a7bd5',
    members: [
      { userId: 1, username: 'you', displayName: 'You', color: '#5b8dee' },
      { userId: 2, username: 'penishead', displayName: 'Penis Head', color: '#3a7bd5' },
    ],
    lastMsg: 'oh ok :(',
    messages: [
      { id: 1, sender: 'penis head', text: 'Hey can you send the notes from today?', time: '1:30 PM', mine: false },
      { id: 2, sender: 'you',        text: 'NO KYS!!!!',                              time: '1:32 PM', mine: true  },
      { id: 3, sender: 'penis head', text: 'oh ok :(',                                time: '1:32 PM', mine: false },
    ],
  },
];

//GROUPS
//TODO: Replace with API
export const INITIAL_GROUPS: Group[] = [
  {
    id: 1, name: 'COP 4331', createdBy: 'you', color: '#7c5cfc',
    members: [
      { username: 'you',  isCreator: true, color: '#5b8dee'  },
      { username: 'guy3',              color: '#3a7bd5'  },
      { username: 'guy1',              color: '#2dd4d4'  },
      { username: 'guy2',              color: '#e05c7a'  },
    ],
    events: [
      { title: 'Group Meeting', date: 'Today',  time: '2:00 PM' },
      { title: 'Event Title',   date: 'Apr 10', time: '1:00 PM' },
    ],
  },
];

//FILE UPLOADS
//TODO: Replace with API
export const MOCK_FILES: FileItem[] = [
  { id: 1, name: 'test1.pdf',  type: 'pdf',  size: '6.7 MB', group: 'COP 4331', uploaded: 'Today',  content: 'This is a mock PDF preview.' },
  { id: 2, name: 'test2.docx', type: 'docx', size: '6.9 MB', group: null,        uploaded: 'Apr 1',  content: 'Mock docx'                    },
];

//NOTIFICATIONS
//TODO: Replace with API
export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 1, text: 'dickhead sent you a message: "kill yourself"',     time: 'Just now',    type: 'message' },
  { id: 2, text: 'obamna added you to COP4331',                      time: '2 hours ago', type: 'group'   },
  { id: 3, text: 'Peenar Snipper Guy added you to Peenar Snipping Time', time: '5 hours ago', type: 'chat' },
];

//CALENDAR GROUPS - I screwed this up but cba to fix it now
//This should be the same as the study groups you are in
//Sorry
//TODO: Replace with API
export const CALENDAR_GROUPS = ['COP 4331'];
