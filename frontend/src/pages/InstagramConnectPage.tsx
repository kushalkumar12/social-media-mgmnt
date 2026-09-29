import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import { groupService, AccountGroupDTO } from '../services/groupService';
import { InstagramAccount } from '../types';
import {
  Users,
  Instagram,
  PlusCircle,
  Search,
  ArrowUpDown,
  CheckSquare,
  Square,
  RefreshCw,
  Trash2,
  Lock,
  FolderPlus,
  CheckCircle2,
  XCircle,
  Edit3,
  UserPlus,
  X,
  ExternalLink,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Clock,
  Tag
} from 'lucide-react';

export const InstagramConnectPage: React.FC = () => {
  // Palette Tab State ('ACCOUNTS' | 'GROUPS')
  const [activeTab, setActiveTab] = useState<'ACCOUNTS' | 'GROUPS'>('ACCOUNTS');

  // Accounts Data & Search/Sort/Select State
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountSearchQuery, setAccountSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'USERNAME_ASC' | 'USERNAME_DESC' | 'STATUS' | 'DATE_NEWEST'>('USERNAME_ASC');
  const [isAccountSelectMode, setIsAccountSelectMode] = useState(false);
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);

  // Groups Data & Search/Select State
  const [groups, setGroups] = useState<AccountGroupDTO[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [isGroupSelectMode, setIsGroupSelectMode] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);

  // Modal States
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [addUserId, setAddUserId] = useState('');
  const [addAccessToken, setAddAccessToken] = useState('');
  const [verifyingDetails, setVerifyingDetails] = useState(false);
  const [verifiedAccountDetails, setVerifiedAccountDetails] = useState<{
    userId: string;
    accessToken: string;
    username: string;
    profilePictureUrl?: string;
    followersCount: number;
    followingCount: number;
    valid: boolean;
  } | null>(null);
  const [verifyError, setVerifyError] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);

  // Refresh & Token Update States
  const [refreshingAccountId, setRefreshingAccountId] = useState<number | null>(null);
  const [updatingTokenAccount, setUpdatingTokenAccount] = useState<InstagramAccount | null>(null);
  const [newTokenInput, setNewTokenInput] = useState('');
  const [updatingToken, setUpdatingToken] = useState(false);
  const [updateTokenError, setUpdateTokenError] = useState('');

  // Profile Preview Popup States
  const [selectedProfileAccount, setSelectedProfileAccount] = useState<InstagramAccount | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);

  // Dynamic live running clock ticker for token countdown
  const [liveNow, setLiveNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setLiveNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const calculateTokenCountdown = (expiresAt?: string) => {
    if (!expiresAt) return { expired: false, text: 'No expiration date' };
    const diff = new Date(expiresAt).getTime() - liveNow;
    if (diff <= 0) return { expired: true, text: 'Token Expired' };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return {
      expired: false,
      text: `${days}d ${hours}h ${minutes}m ${seconds}s remaining`
    };
  };

  // Close popup on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedProfileAccount(null);
    };
    if (selectedProfileAccount) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedProfileAccount]);

  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSelectedAccountIds, setNewGroupSelectedAccountIds] = useState<number[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const [editingGroup, setEditingGroup] = useState<AccountGroupDTO | null>(null);

  // Fetch Accounts & Groups
  const fetchAccounts = async () => {
    try {
      const res = await api.get('/instagram/accounts');
      setAccounts(res.data);
    } catch (err) {
      console.error('Failed to fetch accounts', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const data = await groupService.getGroups();
      setGroups(data);
    } catch (err) {
      console.error('Failed to fetch groups', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchGroups();
  }, []);

  // --- Account Action Handlers ---
  const handleGetDetails = async () => {
    if (!addUserId.trim() || !addAccessToken.trim()) {
      setVerifyError('Please enter both User Id and Access Token.');
      return;
    }
    setVerifyingDetails(true);
    setVerifyError('');
    try {
      const res = await api.post('/instagram/verify-details', {
        userId: addUserId.trim(),
        accessToken: addAccessToken.trim()
      });
      setVerifiedAccountDetails(res.data);
    } catch (err: any) {
      setVerifyError(err.response?.data?.message || 'Failed to verify User Id and Access Token.');
      setVerifiedAccountDetails(null);
    } finally {
      setVerifyingDetails(false);
    }
  };

  const handleSaveAccount = async () => {
    if (!verifiedAccountDetails || !verifiedAccountDetails.valid) return;
    setSavingAccount(true);
    try {
      await api.post('/instagram/connect', {
        code: verifiedAccountDetails.accessToken,
        userId: verifiedAccountDetails.userId,
        username: verifiedAccountDetails.username,
        profilePictureUrl: verifiedAccountDetails.profilePictureUrl,
        followersCount: verifiedAccountDetails.followersCount,
        followingCount: verifiedAccountDetails.followingCount,
        facebookPageId: 'page_' + verifiedAccountDetails.userId
      });
      await fetchAccounts();
      setShowAddAccountModal(false);
      setAddUserId('');
      setAddAccessToken('');
      setVerifiedAccountDetails(null);
      setVerifyError('');
    } catch (err: any) {
      alert('Failed to save account: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingAccount(false);
    }
  };

  // --- Account Action Handlers ---

  const handleRefreshToken = async (id: number) => {
    setRefreshingAccountId(id);
    try {
      const res = await api.post(`/instagram/accounts/${id}/refresh`);
      setAccounts((prev) => prev.map((a) => (a.id === id ? res.data : a)));
      setSelectedProfileAccount((prev) => (prev && prev.id === id ? res.data : prev));
      alert(`Account @${res.data.username} refreshed successfully!\nDP image and followers (${res.data.followersCount || 0}) synced live with Instagram.`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      alert(`Token refresh / Meta verification failed: ${msg}`);
      fetchAccounts();
    } finally {
      setRefreshingAccountId(null);
    }
  };

  const handleUpdateToken = async () => {
    if (!updatingTokenAccount || !newTokenInput.trim()) return;
    setUpdatingToken(true);
    setUpdateTokenError('');
    try {
      const res = await api.put(`/instagram/accounts/${updatingTokenAccount.id}/token`, {
        accessToken: newTokenInput.trim()
      });
      setAccounts((prev) => prev.map((a) => (a.id === updatingTokenAccount.id ? res.data : a)));
      setSelectedProfileAccount((prev) => (prev && prev.id === updatingTokenAccount.id ? res.data : prev));
      setUpdatingTokenAccount(null);
      setNewTokenInput('');
      alert(`Access token verified and updated for @${res.data.username}!\nProfile picture and live account status refreshed.`);
    } catch (err: any) {
      setUpdateTokenError(err.response?.data?.message || 'Failed to verify new token with Meta Graph API.');
    } finally {
      setUpdatingToken(false);
    }
  };

  const handleDisconnectAccount = async (id: number) => {
    if (!window.confirm('Disconnect this Instagram account?')) return;
    try {
      await api.delete(`/instagram/accounts/${id}`);
      fetchAccounts();
      setSelectedAccountIds((prev) => prev.filter((aId) => aId !== id));
      setSelectedProfileAccount((prev) => (prev && prev.id === id ? null : prev));
    } catch (err: any) {
      alert('Disconnect failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const toggleSelectAccount = (id: number) => {
    if (selectedAccountIds.includes(id)) {
      setSelectedAccountIds(selectedAccountIds.filter((aId) => aId !== id));
    } else {
      setSelectedAccountIds([...selectedAccountIds, id]);
    }
  };

  const toggleSelectAllAccounts = () => {
    if (selectedAccountIds.length === filteredAccounts.length) {
      setSelectedAccountIds([]);
    } else {
      setSelectedAccountIds(filteredAccounts.map((a) => a.id));
    }
  };

  // --- Group Action Handlers ---
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      alert('Please enter a group name');
      return;
    }
    setCreatingGroup(true);
    try {
      await groupService.createGroup(newGroupName.trim(), newGroupSelectedAccountIds, 'ACTIVE');
      fetchGroups();
      setShowCreateGroupModal(false);
      setNewGroupName('');
      setNewGroupSelectedAccountIds([]);
    } catch (err: any) {
      alert('Failed to create group: ' + err.message);
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleUpdateGroupMembers = async () => {
    if (!editingGroup) return;
    try {
      await groupService.updateGroup(editingGroup.id, {
        groupName: editingGroup.groupName,
        status: editingGroup.status,
        accountIds: editingGroup.accountIds
      });
      fetchGroups();
      setEditingGroup(null);
    } catch (err: any) {
      alert('Failed to update group: ' + err.message);
    }
  };

  const handleToggleGroupStatus = async (group: AccountGroupDTO) => {
    const nextStatus = group.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await groupService.updateGroup(group.id, { status: nextStatus });
      fetchGroups();
    } catch (err: any) {
      alert('Failed to update group status: ' + err.message);
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (!window.confirm('Delete this group? Accounts will remain connected.')) return;
    try {
      await groupService.deleteGroup(id);
      fetchGroups();
      setSelectedGroupIds((prev) => prev.filter((gId) => gId !== id));
    } catch (err: any) {
      alert('Failed to delete group: ' + err.message);
    }
  };

  const toggleSelectGroup = (id: number) => {
    if (selectedGroupIds.includes(id)) {
      setSelectedGroupIds(selectedGroupIds.filter((gId) => gId !== id));
    } else {
      setSelectedGroupIds([...selectedGroupIds, id]);
    }
  };

  const toggleSelectAllGroups = () => {
    if (selectedGroupIds.length === filteredGroups.length) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(filteredGroups.map((g) => g.id));
    }
  };

  // --- Filtering & Sorting ---
  const filteredAccounts = accounts
    .filter((a) => a.username.toLowerCase().includes(accountSearchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'USERNAME_ASC') return a.username.localeCompare(b.username);
      if (sortBy === 'USERNAME_DESC') return b.username.localeCompare(a.username);
      if (sortBy === 'STATUS') return a.status.localeCompare(b.status);
      return b.id - a.id;
    });

  const filteredGroups = groups.filter((g) => g.groupName.toLowerCase().includes(groupSearchQuery.toLowerCase()));

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      {/* Main Title & Description */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Account Management</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Manage Instagram accounts, multi-account selection, sorting, and campaign posting groups.
        </p>
      </div>

      {/* Palette Outer Container */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Top Control Bar: Side-by-Side Tabs (Left) + Action Buttons (Right) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          {/* Side-by-Side Tabs (Palette Shape) */}
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.04)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActiveTab('ACCOUNTS')}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.95rem',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'ACCOUNTS' ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)' : 'transparent',
                color: activeTab === 'ACCOUNTS' ? '#fff' : 'var(--text-secondary)',
                boxShadow: activeTab === 'ACCOUNTS' ? '0 4px 14px rgba(59, 130, 246, 0.4)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <Instagram size={18} />
              <span>Accounts</span>
              <span style={{ background: activeTab === 'ACCOUNTS' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                {accounts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('GROUPS')}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.95rem',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'GROUPS' ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)' : 'transparent',
                color: activeTab === 'GROUPS' ? '#fff' : 'var(--text-secondary)',
                boxShadow: activeTab === 'GROUPS' ? '0 4px 14px rgba(59, 130, 246, 0.4)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <Users size={18} />
              <span>Groups</span>
              <span style={{ background: activeTab === 'GROUPS' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                {groups.length}
              </span>
            </button>
          </div>

          {/* Right Action Bar (Add | Sort | Select | Search) */}
          {activeTab === 'ACCOUNTS' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Add Button */}
              <button
                onClick={() => setShowAddAccountModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                  color: '#fff',
                  border: 'none',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)'
                }}
              >
                <PlusCircle size={16} />
                <span>Add</span>
              </button>

              {/* Sort Button / Dropdown */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    color: '#EF4444',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="USERNAME_ASC">Sort: Name (A-Z)</option>
                  <option value="USERNAME_DESC">Sort: Name (Z-A)</option>
                  <option value="STATUS">Sort: Status</option>
                  <option value="DATE_NEWEST">Sort: Newest First</option>
                </select>
              </div>

              {/* Select Toggle Button */}
              <button
                onClick={() => {
                  setIsAccountSelectMode(!isAccountSelectMode);
                  if (isAccountSelectMode) setSelectedAccountIds([]);
                }}
                style={{
                  background: isAccountSelectMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: isAccountSelectMode ? '1px solid #EF4444' : '1px solid var(--border-color)',
                  color: '#EF4444',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <CheckSquare size={16} />
                <span>{isAccountSelectMode ? 'Done Select' : 'Select'}</span>
              </button>

              {/* Search Account Input */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Search Account ➡"
                  value={accountSearchQuery}
                  onChange={(e) => setAccountSearchQuery(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    padding: '8px 34px 8px 14px',
                    borderRadius: '20px',
                    fontSize: '0.88rem',
                    width: '180px',
                    outline: 'none'
                  }}
                />
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', right: '12px' }} />
              </div>
            </div>
          ) : (
            /* Groups Tab Action Buttons */
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowCreateGroupModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                  color: '#fff',
                  border: 'none',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)'
                }}
              >
                <PlusCircle size={16} />
                <span>Add</span>
              </button>

              <button
                onClick={() => {
                  setIsGroupSelectMode(!isGroupSelectMode);
                  if (isGroupSelectMode) setSelectedGroupIds([]);
                }}
                style={{
                  background: isGroupSelectMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: isGroupSelectMode ? '1px solid #EF4444' : '1px solid var(--border-color)',
                  color: '#EF4444',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <CheckSquare size={16} />
                <span>{isGroupSelectMode ? 'Done Select' : 'Select'}</span>
              </button>

              {/* Search Groups Input */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Search groups ➡"
                  value={groupSearchQuery}
                  onChange={(e) => setGroupSearchQuery(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    padding: '8px 34px 8px 14px',
                    borderRadius: '20px',
                    fontSize: '0.88rem',
                    width: '180px',
                    outline: 'none'
                  }}
                />
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', right: '12px' }} />
              </div>
            </div>
          )}
        </div>

        {/* --- TAB 1: ACCOUNTS VIEW (Wireframe 1) --- */}
        {activeTab === 'ACCOUNTS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Batch Select Toolbar if Select Mode Active */}
            {isAccountSelectMode && (
              <div style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '12px 18px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={toggleSelectAllAccounts} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                    {selectedAccountIds.length === filteredAccounts.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    Selected: <strong>{selectedAccountIds.length}</strong> / {filteredAccounts.length} accounts
                  </span>
                </div>

                {selectedAccountIds.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => {
                        setShowCreateGroupModal(true);
                        setNewGroupSelectedAccountIds(selectedAccountIds);
                      }}
                      className="btn-secondary"
                      style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <FolderPlus size={14} />
                      <span>Create Group with Selected</span>
                    </button>

                    <button
                      onClick={async () => {
                        if (!window.confirm(`Disconnect ${selectedAccountIds.length} selected accounts?`)) return;
                        for (const id of selectedAccountIds) {
                          await api.delete(`/instagram/accounts/${id}`);
                        }
                        fetchAccounts();
                        setSelectedAccountIds([]);
                      }}
                      className="btn-danger"
                      style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                    >
                      <Trash2 size={14} />
                      <span>Disconnect Selected</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Account Display Pictures Grid (Matching Wireframe 1 Layout) */}
            {loadingAccounts ? (
              <div style={{ color: 'var(--text-secondary)', padding: '40px', textAlign: 'center' }}>Loading connected accounts...</div>
            ) : filteredAccounts.length === 0 ? (
              <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Instagram size={48} color="var(--insta-pink)" style={{ marginBottom: '12px' }} />
                <h3>No Accounts Found</h3>
                <p style={{ fontSize: '0.85rem', margin: '8px auto 20px auto', maxWidth: '400px' }}>
                  Click "+ Add" to link an Instagram Professional account or add a handle.
                </p>
                <button onClick={() => setShowAddAccountModal(true)} className="btn-primary">
                  <PlusCircle size={18} />
                  Add Instagram Account
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '24px 16px', padding: '20px 10px' }}>
                {filteredAccounts.map((acc) => {
                  const isSelected = selectedAccountIds.includes(acc.id);
                  return (
                    <div
                      key={acc.id}
                      onClick={() => {
                        if (isAccountSelectMode) {
                          toggleSelectAccount(acc.id);
                        } else {
                          setSelectedProfileAccount(acc);
                        }
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease'
                      }}
                      title="Click to view Instagram Profile details"
                    >
                      {/* Checkbox Overlay in Select Mode */}
                      {isAccountSelectMode && (
                        <div style={{ position: 'absolute', top: '-4px', right: '12px', zIndex: 10 }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectAccount(acc.id)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                        </div>
                      )}

                      {/* DP Circle Ring Container (Matching Wireframe 1 Red Circle DP) */}
                      <div
                        style={{
                          width: '74px',
                          height: '74px',
                          borderRadius: '50%',
                          border: isSelected ? '3px solid #3B82F6' : (acc.status === 'TOKEN_EXPIRED' ? '3px solid #DC2626' : '3px solid #EF4444'),
                          padding: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: acc.status === 'TOKEN_EXPIRED' ? 'rgba(220, 38, 38, 0.08)' : 'rgba(239, 68, 68, 0.05)',
                          boxShadow: isSelected ? '0 0 16px rgba(59, 130, 246, 0.6)' : '0 4px 12px rgba(239, 68, 68, 0.25)',
                          position: 'relative'
                        }}
                      >
                        {/* Avatar Circle */}
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            background: 'var(--insta-gradient)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '1.2rem',
                            textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                            overflow: 'hidden'
                          }}
                        >
                          {acc.profilePictureUrl ? (
                            <img
                              src={acc.profilePictureUrl}
                              alt={acc.username}
                              referrerPolicy="no-referrer"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            acc.username.substring(0, 2).toUpperCase()
                          )}
                        </div>

                        {/* Token Expired Warning Dot */}
                        {acc.status === 'TOKEN_EXPIRED' && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '-2px',
                              right: '-2px',
                              background: '#DC2626',
                              color: '#fff',
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              fontWeight: 800,
                              border: '2px solid #fff',
                              boxShadow: '0 2px 5px rgba(220, 38, 38, 0.4)'
                            }}
                            title="Token Expired!"
                          >
                            !
                          </div>
                        )}
                      </div>

                      {/* Username string below DP */}
                      <span
                        style={{
                          marginTop: '8px',
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          color: '#60A5FA',
                          textAlign: 'center',
                          maxWidth: '120px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        @{acc.username}
                      </span>

                      {/* Actions hover bar */}
                      {!isAccountSelectMode && (
                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                          {/* Refresh button - High contrast visible on white & dark backgrounds */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRefreshToken(acc.id);
                            }}
                            title="Refresh Token & Profile DP"
                            disabled={refreshingAccountId === acc.id}
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              color: '#059669',
                              padding: '5px',
                              borderRadius: '50%',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                            }}
                          >
                            <RefreshCw size={13} className={refreshingAccountId === acc.id ? 'animate-spin' : ''} />
                          </button>
                          {/* Update Token Key button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUpdatingTokenAccount(acc);
                              setNewTokenInput('');
                              setUpdateTokenError('');
                            }}
                            title="Update Access Token / Key"
                            style={{
                              background: 'rgba(59, 130, 246, 0.15)',
                              border: '1px solid rgba(59, 130, 246, 0.4)',
                              color: '#2563EB',
                              padding: '5px',
                              borderRadius: '50%',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                            }}
                          >
                            <Key size={13} />
                          </button>
                          {/* Disconnect Account button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDisconnectAccount(acc.id);
                            }}
                            title="Disconnect Account"
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              color: '#DC2626',
                              padding: '5px',
                              borderRadius: '50%',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- TAB 2: GROUPS VIEW (Matching Wireframe 2 Table Layout Exactly) --- */}
        {activeTab === 'GROUPS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Batch Select Toolbar if Group Select Mode Active */}
            {isGroupSelectMode && (
              <div style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '12px 18px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={toggleSelectAllGroups} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                    {selectedGroupIds.length === filteredGroups.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    Selected Groups: <strong>{selectedGroupIds.length}</strong> / {filteredGroups.length}
                  </span>
                </div>

                {selectedGroupIds.length > 0 && (
                  <button
                    onClick={async () => {
                      if (!window.confirm(`Delete ${selectedGroupIds.length} selected groups?`)) return;
                      for (const id of selectedGroupIds) {
                        await groupService.deleteGroup(id);
                      }
                      fetchGroups();
                      setSelectedGroupIds([]);
                    }}
                    className="btn-danger"
                    style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                  >
                    <Trash2 size={14} />
                    <span>Delete Selected Groups</span>
                  </button>
                )}
              </div>
            )}

            {/* Groups Table (Wireframe 2 Column Match) */}
            {loadingGroups ? (
              <div style={{ color: 'var(--text-secondary)', padding: '40px', textAlign: 'center' }}>Loading campaign groups...</div>
            ) : filteredGroups.length === 0 ? (
              <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Users size={48} color="var(--insta-purple)" style={{ marginBottom: '12px' }} />
                <h3>No Groups Created</h3>
                <p style={{ fontSize: '0.85rem', margin: '8px auto 20px auto', maxWidth: '400px' }}>
                  Create account groups to manage multi-account posting campaigns seamlessly.
                </p>
                <button onClick={() => setShowCreateGroupModal(true)} className="btn-primary">
                  <PlusCircle size={18} />
                  Add New Group
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '14px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', borderBottom: '2px solid var(--border-color)' }}>
                      {isGroupSelectMode && <th style={{ padding: '12px', width: '40px', textAlign: 'center' }}>Select</th>}
                      <th style={{ padding: '12px', width: '60px', fontWeight: 800 }}>S.No</th>
                      <th style={{ padding: '12px', fontWeight: 800 }}>Group Name</th>
                      <th style={{ padding: '12px', fontWeight: 800 }}>Members</th>
                      <th style={{ padding: '12px', fontWeight: 800 }}>Status</th>
                      <th style={{ padding: '12px', fontWeight: 800 }}>In Active</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: 800 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGroups.map((group, index) => {
                      const isChecked = selectedGroupIds.includes(group.id);
                      return (
                        <tr
                          key={group.id}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.04)'
                          }}
                        >
                          {isGroupSelectMode && (
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectGroup(group.id)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                              />
                            </td>
                          )}
                          <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>#{index + 1}</td>
                          <td style={{ padding: '12px', fontWeight: 700, color: '#fff' }}>{group.groupName}</td>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{group.memberCount}</td>
                          <td style={{ padding: '12px' }}>
                            <span
                              onClick={() => handleToggleGroupStatus(group)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                background: group.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(156, 163, 175, 0.15)',
                                color: group.status === 'ACTIVE' ? '#34D399' : '#9CA3AF'
                              }}
                            >
                              {group.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          {/* In Active column in RED font matching wireframe 2 */}
                          <td style={{ padding: '12px', fontWeight: 800, color: group.inactiveCount > 0 ? '#EF4444' : 'var(--text-muted)' }}>
                            {group.inactiveCount}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => setEditingGroup(group)}
                                className="btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Edit3 size={14} /> Edit Members
                              </button>
                              <button
                                onClick={() => handleDeleteGroup(group.id)}
                                className="btn-danger"
                                style={{ padding: '6px' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- MODAL 1: ADD INSTAGRAM ACCOUNT (Matching Wireframe Exactly) --- */}
      {showAddAccountModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              background: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
              position: 'relative'
            }}
          >
            {/* Close Modal X */}
            <button
              onClick={() => {
                setShowAddAccountModal(false);
                setVerifiedAccountDetails(null);
                setVerifyError('');
              }}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            {/* Wireframe Centered Avatar DP Circle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  border: verifiedAccountDetails ? '3px solid #10B981' : '3px solid #CBD5E1',
                  padding: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-card-hover)',
                  boxShadow: verifiedAccountDetails ? '0 0 20px rgba(16, 185, 129, 0.3)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: verifiedAccountDetails ? 'var(--insta-gradient)' : 'var(--bg-card-hover)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    overflow: 'hidden'
                  }}
                >
                  {verifiedAccountDetails?.profilePictureUrl ? (
                    <img
                      src={verifiedAccountDetails.profilePictureUrl}
                      alt={verifiedAccountDetails.username}
                      referrerPolicy="no-referrer"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : verifiedAccountDetails ? (
                    verifiedAccountDetails.username.substring(0, 2).toUpperCase()
                  ) : (
                    <Instagram size={36} color="#94A3B8" />
                  )}
                </div>
              </div>

              {/* Username & Followers / Following Metadata (Matching Wireframe) */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: verifiedAccountDetails ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {verifiedAccountDetails ? `@${verifiedAccountDetails.username}` : 'Username'}
                </div>
                <div style={{ fontSize: '0.82rem', color: verifiedAccountDetails ? '#059669' : 'var(--text-muted)', marginTop: '2px', fontWeight: 600 }}>
                  {verifiedAccountDetails ? (
                    `${(verifiedAccountDetails.followersCount / 1000).toFixed(1)}K Followers  •  ${verifiedAccountDetails.followingCount} Following`
                  ) : (
                    'Followers  Following'
                  )}
                </div>
              </div>
            </div>

            {verifyError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#B91C1C', padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', textAlign: 'center' }}>
                {verifyError}
              </div>
            )}

            {/* Input Form Fields (Matching Wireframe User Id & Access Token) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontSize: '0.88rem', fontWeight: 700 }}>
                  User Id:
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px' }}
                  placeholder="Enter User Id e.g. 178414000123"
                  value={addUserId}
                  onChange={(e) => {
                    setAddUserId(e.target.value);
                    setVerifiedAccountDetails(null);
                    setVerifyError('');
                  }}
                />
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontSize: '0.88rem', fontWeight: 700 }}>
                  Access Token:
                </label>
                <input
                  type="password"
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px' }}
                  placeholder="Enter Access Token e.g. EAAG..."
                  value={addAccessToken}
                  onChange={(e) => {
                    setAddAccessToken(e.target.value);
                    setVerifiedAccountDetails(null);
                    setVerifyError('');
                  }}
                />
              </div>
            </div>

            {/* Action Buttons at Bottom Right (Matching Wireframe Save | Get Details) */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              {/* Save Button (Disabled by default until details are fetched & valid!) */}
              <button
                type="button"
                onClick={handleSaveAccount}
                disabled={!verifiedAccountDetails || !verifiedAccountDetails.valid || savingAccount}
                style={{
                  background: verifiedAccountDetails && verifiedAccountDetails.valid
                    ? 'linear-gradient(135deg, #10B981, #059669)'
                    : 'rgba(255, 255, 255, 0.08)',
                  color: verifiedAccountDetails && verifiedAccountDetails.valid ? '#fff' : '#64748B',
                  border: '1px solid var(--border-color)',
                  padding: '10px 24px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: verifiedAccountDetails && verifiedAccountDetails.valid ? 'pointer' : 'not-allowed',
                  boxShadow: verifiedAccountDetails && verifiedAccountDetails.valid ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {savingAccount ? 'Saving...' : 'Save'}
              </button>

              {/* Get Details Button */}
              <button
                type="button"
                onClick={handleGetDetails}
                disabled={!addUserId.trim() || !addAccessToken.trim() || verifyingDetails}
                style={{
                  background: 'var(--bg-card-hover)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: addUserId.trim() && addAccessToken.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={16} className={verifyingDetails ? 'animate-spin' : ''} />
                <span>{verifyingDetails ? 'Verifying...' : 'Get Details'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: CREATE GROUP --- */}
      {showCreateGroupModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '480px', background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Create Campaign Group</h3>
              <button onClick={() => setShowCreateGroupModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>Group Name</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Diwali-Campaign"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Select Member Accounts ({newGroupSelectedAccountIds.length} selected)</label>
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {accounts.map((acc) => {
                    const isMember = newGroupSelectedAccountIds.includes(acc.id);
                    return (
                      <label key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '6px', borderRadius: '6px', background: isMember ? 'rgba(59, 130, 246, 0.08)' : 'transparent' }}>
                        <input
                          type="checkbox"
                          checked={isMember}
                          onChange={() => {
                            if (isMember) {
                              setNewGroupSelectedAccountIds(newGroupSelectedAccountIds.filter((aId) => aId !== acc.id));
                            } else {
                              setNewGroupSelectedAccountIds([...newGroupSelectedAccountIds, acc.id]);
                            }
                          }}
                        />
                        <span style={{ fontWeight: 600 }}>@{acc.username}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowCreateGroupModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreateGroup} className="btn-primary" disabled={creatingGroup}>
                {creatingGroup ? 'Creating...' : 'Save Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: EDIT GROUP MEMBERS --- */}
      {editingGroup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '480px', background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Edit Group: {editingGroup.groupName}</h3>
              <button onClick={() => setEditingGroup(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>Group Name</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%' }}
                  value={editingGroup.groupName}
                  onChange={(e) => setEditingGroup({ ...editingGroup, groupName: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Member Accounts ({editingGroup.accountIds?.length || 0} selected)</label>
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {accounts.map((acc) => {
                    const isMember = editingGroup.accountIds?.includes(acc.id);
                    return (
                      <label key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '6px', borderRadius: '6px', background: isMember ? 'rgba(59, 130, 246, 0.08)' : 'transparent' }}>
                        <input
                          type="checkbox"
                          checked={!!isMember}
                          onChange={() => {
                            const current = new Set(editingGroup.accountIds || []);
                            if (current.has(acc.id)) {
                              current.delete(acc.id);
                            } else {
                              current.add(acc.id);
                            }
                            setEditingGroup({ ...editingGroup, accountIds: Array.from(current) as any });
                          }}
                        />
                        <span style={{ fontWeight: 600 }}>@{acc.username}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setEditingGroup(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleUpdateGroupMembers} className="btn-primary">Update Members</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: UPDATE ACCESS TOKEN --- */}
      {updatingTokenAccount && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ width: '100%', maxWidth: '520px', background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '26px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                    <Key size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Update Access Token</h3>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>@{updatingTokenAccount.username} ({updatingTokenAccount.igUserId})</div>
                  </div>
                </div>
                <button onClick={() => setUpdatingTokenAccount(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              {updateTokenError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px', padding: '12px', color: '#B91C1C', fontSize: '0.85rem' }}>
                  {updateTokenError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>New Meta Access Token</label>
                <textarea
                  className="form-input"
                  rows={4}
                  style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.82rem', resize: 'vertical' }}
                  placeholder="Paste fresh Meta User/Page Access Token here..."
                  value={newTokenInput}
                  onChange={(e) => setNewTokenInput(e.target.value)}
                />
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Ensure token has permissions: <code style={{ color: 'var(--accent-blue)', background: 'var(--bg-card-hover)', padding: '2px 4px', borderRadius: '4px' }}>instagram_basic</code>, <code style={{ color: 'var(--accent-blue)', background: 'var(--bg-card-hover)', padding: '2px 4px', borderRadius: '4px' }}>instagram_content_publish</code>.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => setUpdatingTokenAccount(null)} className="btn-secondary">Cancel</button>
                <button
                  onClick={handleUpdateToken}
                  className="btn-primary"
                  disabled={updatingToken || !newTokenInput.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={14} className={updatingToken ? 'animate-spin' : ''} />
                  <span>{updatingToken ? 'Verifying with Meta...' : 'Save & Verify Token'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL 5: INSTAGRAM PROFILE PREVIEW POPUP --- */}
        {/* --- MODAL 5: INSTAGRAM PROFILE PREVIEW POPUP --- */}
        {selectedProfileAccount &&
          createPortal(
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99999,
                background: 'rgba(0, 0, 0, 0.45)',
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 16px',
                overflowY: 'auto'
              }}
              onClick={() => setSelectedProfileAccount(null)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  maxWidth: '480px',
                  maxHeight: 'min(90vh, 740px)',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  border: '1px solid rgba(226, 232, 240, 0.95)',
                  borderRadius: '24px',
                  padding: '0',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.06)',
                  position: 'relative',
                  margin: 'auto'
                }}
              >
                {/* 1. Sticky Instagram Top Bar with Prominent Close Button */}
                <div
                  style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderBottom: '1px solid #F1F5F9',
                    background: '#FFFFFF'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Instagram size={20} color="#E1306C" />
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A' }}>
                      @{selectedProfileAccount.username}
                    </span>
                    {selectedProfileAccount.status === 'ACTIVE' ? (
                      <span
                        style={{
                          background: '#ECFDF5',
                          color: '#059669',
                          border: '1px solid #A7F3D0',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <CheckCircle2 size={12} /> Active
                      </span>
                    ) : (
                      <span
                        style={{
                          background: '#FEF2F2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <XCircle size={12} /> Token Expired
                      </span>
                    )}
                  </div>

                  {/* Prominent High-Contrast Close Button */}
                  <button
                    onClick={() => setSelectedProfileAccount(null)}
                    title="Close preview (Esc)"
                    style={{
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      color: '#1E293B',
                      cursor: 'pointer',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#E2E8F0';
                      e.currentTarget.style.color = '#000000';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#F1F5F9';
                      e.currentTarget.style.color = '#1E293B';
                    }}
                  >
                    <X size={17} strokeWidth={2.5} />
                  </button>
                </div>

                {/* 2. Scrollable Profile Body */}
                <div style={{ padding: '20px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Profile Header Row (DP + Stats) */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
                    {/* Profile Picture with Instagram Gradient Story Ring */}
                    <div
                      style={{
                        width: '84px',
                        height: '84px',
                        minWidth: '84px',
                        borderRadius: '50%',
                        background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                        padding: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 6px 16px rgba(225, 48, 108, 0.25)'
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          background: '#FFFFFF',
                          padding: '2px',
                          overflow: 'hidden'
                        }}
                      >
                        {selectedProfileAccount.profilePictureUrl ? (
                          <img
                            src={selectedProfileAccount.profilePictureUrl}
                            alt={selectedProfileAccount.username}
                            referrerPolicy="no-referrer"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '1.5rem',
                              borderRadius: '50%'
                            }}
                          >
                            {selectedProfileAccount.username.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3 Stats Columns */}
                    <div
                      style={{
                        display: 'flex',
                        flex: 1,
                        justifyContent: 'space-around',
                        textAlign: 'center',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '16px',
                        padding: '12px 10px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                          {selectedProfileAccount.mediaCount ?? 0}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Posts</div>
                      </div>
                      <div style={{ borderLeft: '1px solid #E2E8F0', height: '32px' }} />
                      <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                          {selectedProfileAccount.followersCount
                            ? (selectedProfileAccount.followersCount >= 1000
                                ? (selectedProfileAccount.followersCount / 1000).toFixed(1) + 'K'
                                : selectedProfileAccount.followersCount)
                            : 0}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Followers</div>
                      </div>
                      <div style={{ borderLeft: '1px solid #E2E8F0', height: '32px' }} />
                      <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                          {selectedProfileAccount.followingCount
                            ? (selectedProfileAccount.followingCount >= 1000
                                ? (selectedProfileAccount.followingCount / 1000).toFixed(1) + 'K'
                                : selectedProfileAccount.followingCount)
                            : 0}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Following</div>
                      </div>
                    </div>
                  </div>

                  {/* Identity, Tags & Bio */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.02rem', color: '#0F172A' }}>
                        {selectedProfileAccount.username}
                      </span>
                      <span
                        style={{
                          background: '#F1F5F9',
                          color: '#475569',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                      >
                        {selectedProfileAccount.category || 'Digital Creator & Business'}
                      </span>
                      <span
                        style={{
                          background: '#EFF6FF',
                          color: '#2563EB',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                      >
                        #{selectedProfileAccount.accountType || 'BUSINESS'}
                      </span>
                    </div>

                    {/* Biography */}
                    <p style={{ fontSize: '0.86rem', color: '#334155', lineHeight: '1.4', margin: 0, whiteSpace: 'pre-line' }}>
                      {selectedProfileAccount.biography || 'Best short films, movie scenes, and clips.'}
                    </p>

                    {/* Tags */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Tag size={12} color="#94A3B8" />
                        <span>#SocialMedia</span>
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>#InstaMngmt</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>#MetaGraphAPI</span>
                    </div>
                  </div>

                  {/* UserId Card */}
                  <div
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        User ID (Given while adding)
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A', marginTop: '2px', fontFamily: 'monospace' }}>
                        {selectedProfileAccount.igUserId}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedProfileAccount.igUserId);
                        setCopiedUserId(true);
                        setTimeout(() => setCopiedUserId(false), 2000);
                      }}
                      title="Copy User ID"
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        padding: '5px 10px',
                        color: '#475569',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedUserId ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                      <span>{copiedUserId ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Key (Access Token) with Edit option */}
                  <div
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Key size={13} color="#2563EB" />
                        <span>Access Token / Key</span>
                      </div>
                      <button
                        onClick={() => {
                          setUpdatingTokenAccount(selectedProfileAccount);
                          setNewTokenInput('');
                          setUpdateTokenError('');
                        }}
                        style={{
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          color: '#2563EB',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Edit3 size={12} />
                        <span>Edit Key</span>
                      </button>
                    </div>

                    <div
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        padding: '7px 10px',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        wordBreak: 'break-all',
                        gap: '10px'
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {showKey
                          ? selectedProfileAccount.accessToken || 'No key loaded'
                          : (selectedProfileAccount.accessToken
                              ? `${selectedProfileAccount.accessToken.slice(0, 10)}••••••••••••••••${selectedProfileAccount.accessToken.slice(-6)}`
                              : '••••••••••••••••••••••••••••••••')}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <button
                          onClick={() => setShowKey(!showKey)}
                          title={showKey ? 'Hide Key' : 'Reveal Key'}
                          style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '2px' }}
                        >
                          {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        {selectedProfileAccount.accessToken && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(selectedProfileAccount.accessToken || '');
                              setCopiedKey(true);
                              setTimeout(() => setCopiedKey(false), 2000);
                            }}
                            title="Copy Key"
                            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '2px' }}
                          >
                            {copiedKey ? <Check size={16} color="#059669" /> : <Copy size={16} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Token Expiry with Dynamic Live Running Countdown */}
                  {(() => {
                    const countdown = calculateTokenCountdown(selectedProfileAccount.tokenExpiresAt);
                    return (
                      <div
                        style={{
                          background: countdown.expired ? '#FEF2F2' : '#F0FDF4',
                          border: countdown.expired ? '1px solid #FECACA' : '1px solid #BBF7D0',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: countdown.expired ? '#DC2626' : '#15803D' }}>
                            <Clock size={14} />
                            <span>Token Expiry & Live Countdown</span>
                          </div>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: countdown.expired ? '#DC2626' : '#16A34A',
                              color: '#FFFFFF'
                            }}
                          >
                            {countdown.expired ? 'EXPIRED' : 'ACTIVE'}
                          </span>
                        </div>

                        <div style={{ fontSize: '1rem', fontWeight: 800, color: countdown.expired ? '#B91C1C' : '#166534', fontFamily: 'monospace' }}>
                          {countdown.text}
                        </div>

                        {selectedProfileAccount.tokenExpiresAt && (
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                            Expires on: {new Date(selectedProfileAccount.tokenExpiresAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Action Buttons: Refresh Token | Edit Key | Remove | Close */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px', marginTop: '4px' }}>
                    {/* Refresh Token Button */}
                    <button
                      onClick={() => handleRefreshToken(selectedProfileAccount.id)}
                      disabled={refreshingAccountId === selectedProfileAccount.id}
                      style={{
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                      }}
                    >
                      <RefreshCw size={14} className={refreshingAccountId === selectedProfileAccount.id ? 'animate-spin' : ''} />
                      <span>{refreshingAccountId === selectedProfileAccount.id ? 'Refreshing...' : 'Refresh Token'}</span>
                    </button>

                    {/* Edit Key Button */}
                    <button
                      onClick={() => {
                        setUpdatingTokenAccount(selectedProfileAccount);
                        setNewTokenInput('');
                        setUpdateTokenError('');
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)'
                      }}
                    >
                      <Key size={14} />
                      <span>Edit Key</span>
                    </button>

                    {/* Remove Account Button */}
                    <button
                      onClick={() => handleDisconnectAccount(selectedProfileAccount.id)}
                      style={{
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        color: '#DC2626',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Trash2 size={14} />
                      <span>Remove</span>
                    </button>

                    {/* Explicit Close Button */}
                    <button
                      onClick={() => setSelectedProfileAccount(null)}
                      style={{
                        background: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        color: '#475569',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <X size={14} />
                      <span>Close</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    );
  };
