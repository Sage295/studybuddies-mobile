import { useEffect, useState, type MouseEvent } from 'react';
import { Avatar, AvatarUploadZone } from '../../components/Avatar';
import { useGroups } from '../../context/GroupsContext';
import { useUser, randomColor } from '../../context/UserContext';
import type { Group, Member } from '../../types';
import {
  addGroupMembers,
  createGroup,
  leaveGroup as leaveGroupRequest,
  removeGroupMember,
} from '../../api/groups';
import './GroupsPage.css';

const ME = 'you';

function displayName(member: Member) {
  return member.username === ME ? 'You' : member.displayName || member.username;
}

function parseEmails(value: string) {
  return value
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
}

export default function GroupsPage() {
  const { profile, updateProfile } = useUser();
  const { groups, loadingGroups, groupsError, addGroup, updateGroup, removeGroupById } = useGroups();
  const [selected, setSelected] = useState<Group | null>(null);
  const [expanded, setExpanded] = useState({ members: true });
  const [addInput, setAddInput] = useState('');
  const [pageError, setPageError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMembers, setNewMembers] = useState('');
  const [newColor] = useState(() => randomColor());

  const [editDisplayName, setEditDisplayName] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | undefined>();

  const [searchQ, setSearchQ] = useState('');
  const [createMemberError, setCreateMemberError] = useState('');
  const [addMemberError, setAddMemberError] = useState('');
  const [profileSaveError, setProfileSaveError] = useState('');
  const [isSavingCreate, setIsSavingCreate] = useState(false);
  const [isSavingMembers, setIsSavingMembers] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}') as {
    id?: number | string;
    email?: string;
  };
  const currentUserEmail = (currentUser.email || '').trim().toLowerCase();
  const avatarLetter = (profile.displayName || 'U')[0].toUpperCase();

  useEffect(() => {
    setSelected(currentSelected => {
      if (!currentSelected) return groups[0] || null;
      return groups.find(group => group.id === currentSelected.id) || groups[0] || null;
    });
  }, [groups]);

  useEffect(() => {
    setPageError(groupsError);
  }, [groupsError]);

  function syncUpdatedGroup(updated: Group) {
    updateGroup(updated);
    setSelected(updated);
  }

  function toggle(key: 'members') {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function openProfile() {
    setEditDisplayName(profile.displayName);
    setEditAvatarUrl(profile.avatarUrl || undefined);
    setProfileSaveError('');
    setShowProfile(true);
  }

  function closeOnBackdrop(
    event: MouseEvent<HTMLDivElement>,
    onClose: () => void,
  ) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  async function saveProfile() {
    try {
      setIsSavingProfile(true);
      setPageError('');
      setProfileSaveError('');
      await updateProfile({ displayName: editDisplayName || profile.displayName, avatarUrl: editAvatarUrl || null });
      setShowProfile(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save profile.';
      setProfileSaveError(message);
      setPageError(message);
    } finally {
      setIsSavingProfile(false);
    }
  }

  function resetCreateState() {
    setShowCreate(false);
    setCreateMemberError('');
  }

  async function handleCreate() {
    if (!newName.trim()) return;

    try {
      setIsSavingCreate(true);
      setCreateMemberError('');
      const createdGroup = await createGroup({
        name: newName.trim(),
        color: newColor,
        memberEmails: parseEmails(newMembers),
      });
      addGroup(createdGroup);
      setSelected(createdGroup);
      resetCreateState();
      setNewName('');
      setNewMembers('');
    } catch (error) {
      setCreateMemberError(error instanceof Error ? error.message : 'Unable to create group.');
    } finally {
      setIsSavingCreate(false);
    }
  }

  async function addMember(emailList: string) {
    if (!selected || !emailList.trim()) return;

    try {
      setIsSavingMembers(true);
      setAddMemberError('');
      const updatedGroup = await addGroupMembers(selected.id, parseEmails(emailList));
      syncUpdatedGroup(updatedGroup);
      setAddInput('');
    } catch (error) {
      setAddMemberError(error instanceof Error ? error.message : 'Unable to add members.');
    } finally {
      setIsSavingMembers(false);
    }
  }

  async function removeMember(member: Member) {
    if (!selected || !member.email) return;

    try {
      setAddMemberError('');
      const updatedGroup = await removeGroupMember(selected.id, member.email);
      syncUpdatedGroup(updatedGroup);
    } catch (error) {
      setAddMemberError(error instanceof Error ? error.message : 'Unable to remove member.');
    }
  }

  async function leaveSelectedGroup() {
    if (!selected) return;

    try {
      setIsLeaving(true);
      await leaveGroupRequest(selected.id);
      const nextGroups = groups.filter(group => group.id !== selected.id);
      removeGroupById(selected.id);
      setSelected(nextGroups[0] || null);
      setShowLeave(false);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to leave group.');
    } finally {
      setIsLeaving(false);
    }
  }

  const isCreator = Boolean(
    selected?.members.some(member => member.isCreator && member.email?.toLowerCase() === currentUserEmail),
  );
  const filteredGroups = searchQ
    ? groups.filter(group =>
        group.name.toLowerCase().includes(searchQ.toLowerCase()) ||
        group.members.some(
          member =>
            member.username.toLowerCase().includes(searchQ.toLowerCase()) ||
            member.displayName?.toLowerCase().includes(searchQ.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchQ.toLowerCase()),
        ),
      )
    : groups;

  return (
    <div className="groups-wrap">
      <div className="topbar">
        <div className="topbar-left"><h2>My Groups</h2></div>
        <div className="topbar-right">
          <button type="button" className="btn-ghost btn-profile" onClick={e => { e.stopPropagation(); openProfile(); }}>
            <Avatar letter={avatarLetter} color={profile.avatarColor} url={profile.avatarUrl} size={22}/>
            Profile
          </button>
          <button type="button" className="btn-primary" onClick={e => { e.stopPropagation(); setShowCreate(true); }}>+ New Group</button>
        </div>
      </div>

      {pageError && <div className="member-input-error groups-page-error">{pageError}</div>}

      <div className="groups-body">
        <div className="groups-list">
          <div className="section-title">All Groups</div>
          {loadingGroups && <div className="groups-no-results">Loading groups...</div>}
          {!loadingGroups && filteredGroups.map(group => (
            <div
              key={group.id}
              className={`group-row ${selected?.id === group.id ? 'active' : ''}`}
              onClick={() => {
                setSelected(group);
                setExpanded({ members: true });
                setAddInput('');
                setAddMemberError('');
              }}
            >
              <Avatar letter={group.name[0]} color={group.color} url={group.avatarUrl} size={36} square/>
              <div className="group-row-info">
                <div className="group-row-name">{group.name}</div>
                <div className="group-row-sub">{group.members.length} members · {group.events.length} events</div>
              </div>
            </div>
          ))}
          {!loadingGroups && filteredGroups.length === 0 && <div className="groups-no-results">No results</div>}
        </div>

        <div className={`group-detail ${selected ? 'visible' : ''}`}>
          {selected ? (
            <>
              <div className="group-detail-header">
                <Avatar
                  letter={selected.name[0]}
                  color={selected.color}
                  url={selected.avatarUrl}
                  size={50}
                  square
                />
                <div className="group-header-info">
                  <div className="group-detail-name">{selected.name}</div>
                  <div className="group-detail-sub">{selected.members.length} members</div>
                </div>
                <div className="group-header-actions">
                  <button className="btn-ghost danger-ghost" onClick={() => setShowLeave(true)}>Leave</button>
                </div>
              </div>

              <div className="collapsible">
                <button className="collapsible-header" onClick={() => toggle('members')}>
                  <span>Members</span>
                  <span className="collapse-arrow">{expanded.members ? '▲' : '▼'}</span>
                </button>
                {expanded.members && (
                  <div className="collapsible-body scrollable">
                    {selected.members.map(member => (
                      <div key={member.email || member.username} className="member-row">
                        <Avatar
                          letter={member.username === ME ? avatarLetter : member.username[0].toUpperCase()}
                          color={member.email === currentUserEmail ? profile.avatarColor : member.color}
                          url={member.email === currentUserEmail ? profile.avatarUrl : member.avatarUrl}
                          size={28}
                        />
                        <div className="member-info">
                          <div className="member-name">{member.email === currentUserEmail ? 'You' : displayName(member)}</div>
                          {member.email && <div className="member-email">{member.email}</div>}
                          {member.isCreator && <div className="member-badge">creator</div>}
                        </div>
                        <div className="member-actions">
                          {isCreator && member.email !== currentUserEmail && (
                            <button className="icon-btn danger-btn" title="Remove" onClick={() => void removeMember(member)}>x</button>
                          )}
                        </div>
                      </div>
                    ))}
                    {isCreator && (
                      <>
                        <div className="add-member-row">
                          <input
                            placeholder="Add by account email(s)..."
                            value={addInput}
                            onChange={e => {
                              setAddInput(e.target.value);
                              setAddMemberError('');
                            }}
                            onKeyDown={e => e.key === 'Enter' && void addMember(addInput)}
                            className="add-member-input"
                          />
                          <button className="btn-ghost btn-add-member" disabled={isSavingMembers} onClick={() => void addMember(addInput)}>
                            {isSavingMembers ? 'Adding...' : 'Add'}
                          </button>
                        </div>
                        {addMemberError && <div className="member-input-error">{addMemberError}</div>}
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="detail-empty">{loadingGroups ? 'Loading your groups...' : 'Select a group to view details'}</div>
          )}
        </div>
      </div>

      {showProfile && (
        <div className="modal-overlay" onClick={e => closeOnBackdrop(e, () => setShowProfile(false))}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button type="button" className="icon-btn" onClick={() => setShowProfile(false)}>x</button>
            </div>
            <AvatarUploadZone
              currentUrl={editAvatarUrl}
              currentColor={profile.avatarColor}
              letter={avatarLetter}
              size={88}
              onFile={url => {
                setProfileSaveError('');
                setEditAvatarUrl(url);
              }}
              onError={setProfileSaveError}
              label="Visible to all group members"
            />
            <div className="field field-mt">
              <label>Display Name</label>
              <input value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} placeholder="Your display name"/>
            </div>
            {profileSaveError && <div className="member-input-error">{profileSaveError}</div>}
            <div className="modal-footer">
              <button type="button" className="btn-ghost" onClick={() => setShowProfile(false)}>Cancel</button>
              <button type="button" className="btn-primary" disabled={isSavingProfile} onClick={() => void saveProfile()}>
                {isSavingProfile ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLeave && selected && (
        <div className="modal-overlay" onClick={e => closeOnBackdrop(e, () => setShowLeave(false))}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Leave Group</h3>
              <button type="button" className="icon-btn" onClick={() => setShowLeave(false)}>x</button>
            </div>
            <p className="leave-modal-text">
              Are you sure you want to leave <strong className="leave-modal-strong">{selected.name}</strong>?
              You will also be removed from the affiliated group chat.
            </p>
            <div className="modal-footer">
              <button type="button" className="btn-ghost" onClick={() => setShowLeave(false)}>Cancel</button>
              <button type="button" className="btn-ghost danger-ghost" disabled={isLeaving} onClick={() => void leaveSelectedGroup()}>
                {isLeaving ? 'Leaving...' : 'Leave Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={e => closeOnBackdrop(e, resetCreateState)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Group</h3>
              <button type="button" className="icon-btn" onClick={resetCreateState}>x</button>
            </div>
            <div style={{display:'flex',justifyContent:'center',marginBottom:'12px'}}>
              <Avatar
                letter={newName ? newName[0].toUpperCase() : '?'}
                color={newColor}
                size={72}
                square
              />
            </div>
            <div className="field field-mt">
              <label>Group Name *</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="" autoFocus/>
            </div>
            <div className="field">
              <label>Add Members (account emails, comma separated)</label>
              <input
                value={newMembers}
                onChange={e => {
                  setNewMembers(e.target.value);
                  setCreateMemberError('');
                }}
                placeholder="friend1@email.com, friend2@email.com"
              />
            </div>
            {createMemberError && <div className="member-input-error">{createMemberError}</div>}
            <div className="modal-footer">
              <button type="button" className="btn-ghost" onClick={resetCreateState}>Cancel</button>
              <button type="button" className="btn-primary" disabled={isSavingCreate} onClick={() => void handleCreate()}>
                {isSavingCreate ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

